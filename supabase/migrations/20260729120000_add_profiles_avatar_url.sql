-- Add avatar_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Update privileges for authenticated users to allow updating avatar_url
GRANT UPDATE (full_name, phone, updated_at, avatar_url) ON TABLE public.profiles TO authenticated;

-- Ensure storage schema and avatars bucket exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read avatars' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public read avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatar' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatar' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatar' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;
END $$;
