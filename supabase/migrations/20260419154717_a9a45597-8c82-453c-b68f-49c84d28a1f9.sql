
-- Replace overly broad SELECT policy that allowed listing the bucket.
-- Files are still publicly accessible by direct URL because the bucket is public,
-- but unauthenticated clients cannot list/enumerate filenames.
DROP POLICY IF EXISTS "Avatar images publicly accessible" ON storage.objects;

CREATE POLICY "Authenticated users can list avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');
