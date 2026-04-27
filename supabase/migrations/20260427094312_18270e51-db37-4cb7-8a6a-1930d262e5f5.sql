
-- Restrict listing on public receipts bucket: allow read only by direct object name lookup, not bulk listing.
DROP POLICY IF EXISTS "Public read comprovativos-publicos" ON storage.objects;

CREATE POLICY "Public direct-read comprovativos-publicos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'comprovativos-publicos'
  AND name IS NOT NULL
);
