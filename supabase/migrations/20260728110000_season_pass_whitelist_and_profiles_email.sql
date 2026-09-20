-- Season pass whitelist management and profiles email syncing
-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill existing emails from auth.users
UPDATE public.profiles p
SET email = LOWER(TRIM(u.email))
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email <> LOWER(TRIM(u.email)));

-- 3. Unique index for profiles(lower(email))
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_idx ON public.profiles (lower(email)) WHERE email IS NOT NULL;

-- 4. Create season_pass_whitelist table
CREATE TABLE IF NOT EXISTS public.season_pass_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS season_pass_whitelist_email_idx ON public.season_pass_whitelist (lower(email));

-- 5. Enable RLS on season_pass_whitelist
ALTER TABLE public.season_pass_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage season pass whitelist" ON public.season_pass_whitelist;
CREATE POLICY "Admins can manage season pass whitelist"
  ON public.season_pass_whitelist
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.season_pass_whitelist TO authenticated;

-- 6. Trigger: When an email is inserted into season_pass_whitelist, activate season pass for existing profile
CREATE OR REPLACE FUNCTION public.handle_season_pass_whitelist_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET active_season_pass = true,
      updated_at = now()
  WHERE lower(email) = lower(NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_season_pass_whitelist_inserted ON public.season_pass_whitelist;
CREATE TRIGGER on_season_pass_whitelist_inserted
  AFTER INSERT ON public.season_pass_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_season_pass_whitelist_insert();

-- 7. Trigger: When an email is removed from season_pass_whitelist, deactivate season pass for profile
CREATE OR REPLACE FUNCTION public.handle_season_pass_whitelist_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET active_season_pass = false,
      updated_at = now()
  WHERE lower(email) = lower(OLD.email);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_season_pass_whitelist_deleted ON public.season_pass_whitelist;
CREATE TRIGGER on_season_pass_whitelist_deleted
  AFTER DELETE ON public.season_pass_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_season_pass_whitelist_delete();

-- 8. Update handle_new_user() to check season_pass_whitelist and store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_whitelisted boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.season_pass_whitelist
    WHERE lower(email) = lower(trim(NEW.email))
  ) INTO is_whitelisted;

  INSERT INTO public.profiles (id, full_name, email, active_season_pass)
  VALUES (
    NEW.id,
    NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    lower(trim(NEW.email)),
    COALESCE(is_whitelisted, false)
  );
  RETURN NEW;
END;
$$;

-- 9. Enforce active_season_pass in bookings RLS policy
DROP POLICY IF EXISTS "Authenticated users can create own bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      booking_type <> 'season_pass'
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (SELECT auth.uid()) AND profiles.active_season_pass = true
      )
    )
  );
