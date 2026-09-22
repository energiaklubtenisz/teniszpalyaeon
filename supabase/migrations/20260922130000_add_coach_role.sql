-- Coach role: enum extension, new tables, RLS policies
-- Adds: coach role, recurring bookings, player management, notifications, statistics

-- 1. Extend user_role enum with 'coach'
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'coach';

-- 2. Add coach_title to profiles (admin-assigned display title)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_title text;

-- 3. Create or extend notification_type enum
DO $$
BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'booking_displaced',
    'coach_assignment',
    'coach_invitation',
    'practice_cancelled',
    'general'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'coach_invitation';

-- 4. Coach–Player relationship
CREATE TABLE IF NOT EXISTS public.coach_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coach_players_unique UNIQUE (coach_id, player_id),
  CONSTRAINT coach_players_no_self CHECK (coach_id <> player_id)
);

ALTER TABLE public.coach_players ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.coach_players ADD COLUMN IF NOT EXISTS responded_at timestamptz;

CREATE INDEX IF NOT EXISTS coach_players_coach_idx ON public.coach_players (coach_id);
CREATE INDEX IF NOT EXISTS coach_players_player_idx ON public.coach_players (player_id);
CREATE INDEX IF NOT EXISTS coach_players_status_idx ON public.coach_players (status);

ALTER TABLE public.coach_players ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own player roster
DROP POLICY IF EXISTS "Coaches manage own players" ON public.coach_players;
CREATE POLICY "Coaches manage own players"
  ON public.coach_players
  FOR ALL
  TO authenticated
  USING (
    coach_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role::text = 'coach'
    )
  )
  WITH CHECK (
    coach_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role::text = 'coach'
    )
  );

-- Players can see their coach assignments and invitations
DROP POLICY IF EXISTS "Players can view own coach assignments" ON public.coach_players;
CREATE POLICY "Players can view own coach assignments"
  ON public.coach_players
  FOR SELECT
  TO authenticated
  USING (player_id = (SELECT auth.uid()));

-- Players can respond to their own invitations (accept / decline)
DROP POLICY IF EXISTS "Players can respond to invitations" ON public.coach_players;
CREATE POLICY "Players can respond to invitations"
  ON public.coach_players
  FOR UPDATE
  TO authenticated
  USING (player_id = (SELECT auth.uid()))
  WITH CHECK (player_id = (SELECT auth.uid()));

-- Admins can view all coach-player relationships
DROP POLICY IF EXISTS "Admins can view all coach players" ON public.coach_players;
CREATE POLICY "Admins can view all coach players"
  ON public.coach_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.coach_players TO authenticated;

-- 5. Recurring booking series
CREATE TABLE IF NOT EXISTS public.recurring_booking_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  day_of_week smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  court_ids uuid[] NOT NULL,
  effective_from date NOT NULL,
  effective_until date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT series_day_valid CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT series_time_valid CHECK (end_time > start_time),
  CONSTRAINT series_date_valid CHECK (effective_until >= effective_from)
);

CREATE INDEX IF NOT EXISTS recurring_series_coach_idx ON public.recurring_booking_series (coach_id);

ALTER TABLE public.recurring_booking_series ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own series" ON public.recurring_booking_series;
CREATE POLICY "Coaches manage own series"
  ON public.recurring_booking_series
  FOR ALL
  TO authenticated
  USING (
    coach_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role::text = 'coach'
    )
  )
  WITH CHECK (
    coach_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role::text = 'coach'
    )
  );

-- Admins can view all series
DROP POLICY IF EXISTS "Admins can view all series" ON public.recurring_booking_series;
CREATE POLICY "Admins can view all series"
  ON public.recurring_booking_series
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.recurring_booking_series TO authenticated;

-- 6. Recurring booking exceptions (skip certain dates)
CREATE TABLE IF NOT EXISTS public.recurring_booking_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid NOT NULL REFERENCES public.recurring_booking_series (id) ON DELETE CASCADE,
  excluded_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exception_unique UNIQUE (series_id, excluded_date)
);

CREATE INDEX IF NOT EXISTS recurring_exceptions_series_idx ON public.recurring_booking_exceptions (series_id);

ALTER TABLE public.recurring_booking_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own exceptions" ON public.recurring_booking_exceptions;
CREATE POLICY "Coaches manage own exceptions"
  ON public.recurring_booking_exceptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.recurring_booking_series s
      WHERE s.id = series_id AND s.coach_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recurring_booking_series s
      WHERE s.id = series_id AND s.coach_id = (SELECT auth.uid())
    )
  );

GRANT SELECT, INSERT, DELETE ON TABLE public.recurring_booking_exceptions TO authenticated;

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  data jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;
-- Service role / admin can INSERT notifications (done via admin client)

-- 8. Player statistics
CREATE TABLE IF NOT EXISTS public.player_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  stat_type text NOT NULL,
  stat_value text NOT NULL DEFAULT '',
  notes text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_stats_coach_player_idx
  ON public.player_statistics (coach_id, player_id);

ALTER TABLE public.player_statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own player stats" ON public.player_statistics;
CREATE POLICY "Coaches manage own player stats"
  ON public.player_statistics
  FOR ALL
  TO authenticated
  USING (
    coach_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role::text = 'coach'
    )
  )
  WITH CHECK (
    coach_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role::text = 'coach'
    )
  );

-- Players can view their own stats
DROP POLICY IF EXISTS "Players can view own stats" ON public.player_statistics;
CREATE POLICY "Players can view own stats"
  ON public.player_statistics
  FOR SELECT
  TO authenticated
  USING (player_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.player_statistics TO authenticated;

-- 9. Add coach-related columns to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recurring_series_id uuid
  REFERENCES public.recurring_booking_series (id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_coach_booking boolean NOT NULL DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS player_ids uuid[] DEFAULT '{}';
ALTER TABLE public.recurring_booking_series ADD COLUMN IF NOT EXISTS player_ids uuid[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS bookings_series_idx ON public.bookings (recurring_series_id)
  WHERE recurring_series_id IS NOT NULL;

-- 10. Relax player_count and guest_player_names for coach bookings
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_player_count_valid;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_player_count_flexible;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_player_count_flexible
  CHECK (
    (is_coach_booking = true)
    OR (player_count IN (2, 4))
  );

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_guest_player_names_count;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_guest_player_names_count
  CHECK (
    (is_coach_booking = true)
    OR (cardinality(guest_player_names) = player_count - 1)
  );

-- 11. Allow coach bookings to bypass season_pass check
-- Update the INSERT RLS policy for bookings
DROP POLICY IF EXISTS "Authenticated users can create own bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      -- Coach bookings are always allowed
      is_coach_booking = true
      OR (
        booking_type <> 'season_pass'
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid()) AND profiles.active_season_pass = true
        )
      )
    )
  );

-- 12. Allow coaches to update bookings they displaced (admin client handles this)
-- Service role already bypasses RLS, so coach displacement uses admin client
