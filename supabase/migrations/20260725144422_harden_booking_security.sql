-- RLS for courts and bookings. Pass enforcement intentionally deferred.

ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active courts" ON public.courts;
CREATE POLICY "Anyone can view active courts"
  ON public.courts
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view confirmed bookings" ON public.bookings;
CREATE POLICY "Anyone can view confirmed bookings"
  ON public.bookings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'confirmed');

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated users can create own bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT SELECT ON TABLE public.courts TO anon, authenticated;
GRANT SELECT ON TABLE public.bookings TO anon, authenticated;
GRANT INSERT ON TABLE public.bookings TO authenticated;
