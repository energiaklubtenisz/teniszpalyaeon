-- Store booking times as Budapest local wall clock (what users select in the UI).
-- Existing timestamptz values are converted from UTC instant to Europe/Budapest local time.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_overlap;

ALTER TABLE public.bookings
  ALTER COLUMN starts_at TYPE timestamp without time zone
  USING (starts_at AT TIME ZONE 'UTC'),
  ALTER COLUMN ends_at TYPE timestamp without time zone
  USING (ends_at AT TIME ZONE 'UTC');

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    court_id WITH =,
    tstzrange(
      (starts_at AT TIME ZONE 'Europe/Budapest'),
      (ends_at AT TIME ZONE 'Europe/Budapest'),
      '[)'
    ) WITH &&
  )
  WHERE (status = 'confirmed');

COMMENT ON COLUMN public.bookings.starts_at IS
  'Court booking start, Europe/Budapest local time (no time zone offset in column).';
COMMENT ON COLUMN public.bookings.ends_at IS
  'Court booking end, Europe/Budapest local time (no time zone offset in column).';
