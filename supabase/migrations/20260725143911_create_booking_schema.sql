-- Booking schema: courts, bookings, overlap guard, seed.
-- Idempotent for partial remote history (enums may already exist).

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  CREATE TYPE public.booking_type AS ENUM ('season_pass', 'one_time');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS public.courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number smallint NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courts_number_range CHECK (number BETWEEN 1 AND 8),
  CONSTRAINT courts_number_unique UNIQUE (number)
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES public.courts (id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  booking_type public.booking_type NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  price_huf integer,
  player_count smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_range_valid CHECK (ends_at > starts_at),
  CONSTRAINT bookings_price_nonnegative CHECK (price_huf IS NULL OR price_huf >= 0),
  CONSTRAINT bookings_player_count_valid CHECK (player_count IN (2, 4))
);

CREATE INDEX IF NOT EXISTS bookings_court_starts_idx
  ON public.bookings (court_id, starts_at);

CREATE INDEX IF NOT EXISTS bookings_user_id_idx
  ON public.bookings (user_id);

DO $$
BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_no_overlap
    EXCLUDE USING gist (
      court_id WITH =,
      tstzrange(starts_at, ends_at, '[)') WITH &&
    )
    WHERE (status = 'confirmed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

INSERT INTO public.courts (number, name)
VALUES
  (1, '1. pálya'),
  (2, '2. pálya'),
  (3, '3. pálya'),
  (4, '4. pálya'),
  (5, '5. pálya'),
  (6, '6. pálya'),
  (7, '7. pálya'),
  (8, '8. pálya')
ON CONFLICT (number) DO NOTHING;
