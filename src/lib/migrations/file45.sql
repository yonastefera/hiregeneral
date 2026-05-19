-- Public employer logo bucket with authenticated owner-folder writes.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'company-logos',
  'company-logos',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Company logos are publicly readable'
  ) THEN
    CREATE POLICY "Company logos are publicly readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'company-logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Employers can upload company logos'
  ) THEN
    CREATE POLICY "Employers can upload company logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'company-logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Employers can update company logos'
  ) THEN
    CREATE POLICY "Employers can update company logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'company-logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
      bucket_id = 'company-logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Employers can delete company logos'
  ) THEN
    CREATE POLICY "Employers can delete company logos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'company-logos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END
$$;
