-- Media vault Storage bucket (private, user-scoped paths)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media-vault',
  'media-vault',
  false,
  52428800,   -- 50 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic',
        'video/mp4', 'video/quicktime',
        'audio/mpeg', 'audio/mp4', 'audio/aac',
        'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload/read only inside their own folder: {user_id}/*
CREATE POLICY "media_vault_user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media-vault'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "media_vault_user_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'media-vault'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "media_vault_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media-vault'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
