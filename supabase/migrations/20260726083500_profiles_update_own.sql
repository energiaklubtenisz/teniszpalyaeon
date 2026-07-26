-- Allow authenticated users to update their own profile row.
-- App code only writes full_name and phone (never role / active_season_pass).

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

GRANT UPDATE ON TABLE public.profiles TO authenticated;
