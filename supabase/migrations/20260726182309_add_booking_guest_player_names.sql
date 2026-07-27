-- Store names of guest players (everyone except the booking user).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_player_names text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill existing rows so the count constraint can be added safely.
UPDATE public.bookings
SET guest_player_names = ARRAY(
  SELECT 'Ismeretlen'::text
  FROM generate_series(1, player_count - 1)
)
WHERE cardinality(guest_player_names) <> player_count - 1;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_guest_player_names_count;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_guest_player_names_count
  CHECK (cardinality(guest_player_names) = player_count - 1);

COMMENT ON COLUMN public.bookings.guest_player_names IS
  'Names of other players on the booking; the booker is identified via user_id / profiles.';
