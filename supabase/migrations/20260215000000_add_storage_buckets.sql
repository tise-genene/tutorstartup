-- Storage buckets and policies for file uploads
-- Create storage buckets for messages, proposals, and profiles

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('messages', 'messages', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('proposals', 'proposals', false, 5242880, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Policies for 'messages' bucket
CREATE POLICY "Allow authenticated users to upload message files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to read their own message files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'messages' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      JOIN messages m ON m.conversation_id = cp.conversation_id
      WHERE m.id::text = (storage.filename(name))
      AND cp.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Allow users to delete their own message files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policies for 'proposals' bucket
CREATE POLICY "Allow tutors to upload proposal files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proposals' AND
  EXISTS (
    SELECT 1 FROM proposals p
    JOIN tutor_profiles tp ON p.tutor_id = tp.id
    WHERE tp.user_id = auth.uid()
    AND p.id::text = (storage.filename(name))
  )
);

CREATE POLICY "Allow job owners to read proposal files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'proposals' AND
  EXISTS (
    SELECT 1 FROM proposals p
    JOIN job_posts jp ON p.job_post_id = jp.id
    WHERE jp.parent_id = auth.uid()
    AND p.id::text = (storage.filename(name))
  )
);

CREATE POLICY "Allow proposal authors to read their files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'proposals' AND
  EXISTS (
    SELECT 1 FROM proposals p
    JOIN tutor_profiles tp ON p.tutor_id = tp.id
    WHERE tp.user_id = auth.uid()
    AND p.id::text = (storage.filename(name))
  )
);

-- 4. Policies for 'avatars' bucket (public bucket with size limits)
CREATE POLICY "Allow authenticated users to upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow users to update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Add file metadata columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;

-- 6. Add file attachments column to proposals table
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT NULL;

-- 7. Update profiles table to support avatar_url from storage
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 8. Create function to clean up storage on message deletion
CREATE OR REPLACE FUNCTION delete_message_attachments()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: Storage cleanup should be handled by application logic
  -- This is a placeholder for future implementation
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add attachment_updated_at to messages for cache invalidation
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS attachment_updated_at TIMESTAMP WITH TIME ZONE;

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
