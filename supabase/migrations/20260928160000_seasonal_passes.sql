-- 1. season_year hozzáadása a season_pass_whitelist táblához
ALTER TABLE public.season_pass_whitelist 
  ADD COLUMN IF NOT EXISTS season_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- 2. Korábbi egyedi index cseréje összetett indexre (email + season_year)
DROP INDEX IF EXISTS public.season_pass_whitelist_email_idx;
CREATE UNIQUE INDEX IF NOT EXISTS season_pass_whitelist_email_season_year_idx 
  ON public.season_pass_whitelist (lower(email), season_year);

-- 3. Felhasználók saját bérleteik lekérdezésének engedélyezése (SELECT RLS)
DROP POLICY IF EXISTS "Users can view their own season pass whitelist entries" ON public.season_pass_whitelist;
CREATE POLICY "Users can view their own season pass whitelist entries"
  ON public.season_pass_whitelist
  FOR SELECT
  TO authenticated
  USING (
    lower(email) = lower((SELECT email FROM public.profiles WHERE id = (SELECT auth.uid())))
    OR lower(email) = lower((SELECT auth.jwt() ->> 'email'))
  );

-- 4. Triggerek frissítése az aktuális év figyelembevételével
CREATE OR REPLACE FUNCTION public.handle_season_pass_whitelist_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.season_year = EXTRACT(YEAR FROM CURRENT_DATE)::integer THEN
    UPDATE public.profiles
    SET active_season_pass = true,
        updated_at = now()
    WHERE lower(email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_season_pass_whitelist_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET active_season_pass = EXISTS (
        SELECT 1 FROM public.season_pass_whitelist
        WHERE lower(email) = lower(OLD.email)
          AND season_year = EXTRACT(YEAR FROM CURRENT_DATE)::integer
      ),
      updated_at = now()
  WHERE lower(email) = lower(OLD.email);
  RETURN OLD;
END;
$$;

-- 5. Foglalási RLS szigorítása: a user csak a bérlete évében foglalhat bérlettel
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
        SELECT 1 FROM public.season_pass_whitelist spw
        JOIN public.profiles p ON lower(p.email) = lower(spw.email)
        WHERE p.id = (SELECT auth.uid())
          AND spw.season_year = EXTRACT(YEAR FROM starts_at)::integer
      )
    )
  );
