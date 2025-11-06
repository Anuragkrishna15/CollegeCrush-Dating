-- =================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- Setup storage buckets for profile pictures and community posts
-- =================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-pictures', 'profile-pictures', true),
  ('community-media', 'community-media', true),
  ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- =================================================================
-- STORAGE POLICIES
-- =================================================================

-- Profile Pictures Bucket Policies
CREATE POLICY "Profile pictures are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-pictures'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Community Media Bucket Policies
CREATE POLICY "Community media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-media');

CREATE POLICY "Authenticated users can upload community media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'community-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own community media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'community-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own community media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'community-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Chat Media Bucket Policies
CREATE POLICY "Chat media is accessible to conversation participants" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-media'
    AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      auth.uid()::text = (storage.foldername(name))[2]
    )
  );

CREATE POLICY "Users can upload to their conversations" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-media'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own chat media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own chat media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =================================================================
-- STORAGE FUNCTIONS
-- =================================================================

-- Function to safely delete old profile pictures
CREATE OR REPLACE FUNCTION delete_old_profile_pictures()
RETURNS TRIGGER AS $$
DECLARE
  old_pics text[];
  new_pics text[];
  pic_to_delete text;
BEGIN
  -- Get old and new profile pictures
  old_pics := COALESCE(OLD.profile_pics, '{}');
  new_pics := COALESCE(NEW.profile_pics, '{}');

  -- Find pictures that are no longer in the new array
  FOREACH pic_to_delete IN ARRAY old_pics LOOP
    IF NOT (pic_to_delete = ANY(new_pics)) THEN
      -- Delete from storage (this will trigger the storage policy)
      PERFORM storage.delete_object('profile-pictures', split_part(pic_to_delete, '/', 4));
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to clean up old profile pictures
DROP TRIGGER IF EXISTS trigger_cleanup_profile_pictures ON profiles;
CREATE TRIGGER trigger_cleanup_profile_pictures
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.profile_pics IS DISTINCT FROM NEW.profile_pics)
  EXECUTE FUNCTION delete_old_profile_pictures();

-- Function to validate file uploads
CREATE OR REPLACE FUNCTION validate_file_upload()
RETURNS TRIGGER AS $$
DECLARE
  file_ext text;
  allowed_exts text[] := ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'];
BEGIN
  -- Get file extension
  file_ext := lower(split_part(NEW.name, '.', -1));

  -- Validate file extension
  IF file_ext = '' OR NOT (file_ext = ANY(allowed_exts)) THEN
    RAISE EXCEPTION 'Invalid file type. Only JPG, PNG, GIF, and WebP files are allowed.';
  END IF;

  -- Validate file size (50MB limit)
  IF NEW.file_size > 52428800 THEN
    RAISE EXCEPTION 'File size too large. Maximum size is 50MB.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply file validation to all buckets
DROP TRIGGER IF EXISTS trigger_validate_profile_pictures ON storage.objects;
CREATE TRIGGER trigger_validate_profile_pictures
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'profile-pictures')
  EXECUTE FUNCTION validate_file_upload();

DROP TRIGGER IF EXISTS trigger_validate_community_media ON storage.objects;
CREATE TRIGGER trigger_validate_community_media
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'community-media')
  EXECUTE FUNCTION validate_file_upload();

DROP TRIGGER IF EXISTS trigger_validate_chat_media ON storage.objects;
CREATE TRIGGER trigger_validate_chat_media
  BEFORE INSERT ON storage.objects
  FOR EACH ROW
  WHEN (NEW.bucket_id = 'chat-media')
  EXECUTE FUNCTION validate_file_upload();

-- =================================================================
-- UTILITY FUNCTIONS
-- =================================================================

-- Function to get storage URL for a file
CREATE OR REPLACE FUNCTION get_storage_url(bucket_name text, file_path text)
RETURNS text AS $$
BEGIN
  RETURN format('https://ymxkmfjogretzgqjuagv.supabase.co/storage/v1/object/public/%s/%s', bucket_name, file_path);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate optimized image URLs
CREATE OR REPLACE FUNCTION get_optimized_image_url(original_url text, width integer DEFAULT NULL, height integer DEFAULT NULL, quality integer DEFAULT 80)
RETURNS text AS $$
DECLARE
  base_url text;
  params text := '';
BEGIN
  IF original_url IS NULL OR original_url = '' THEN
    RETURN NULL;
  END IF;

  -- Extract base URL (remove any existing transform parameters)
  base_url := split_part(original_url, '?', 1);

  -- Build transform parameters
  IF width IS NOT NULL THEN
    params := params || format('width=%s&', width);
  END IF;

  IF height IS NOT NULL THEN
    params := params || format('height=%s&', height);
  END IF;

  params := params || format('quality=%s&resize=contain', quality);

  RETURN format('%s?%s', base_url, params);
END;
$$ LANGUAGE plpgsql IMMUTABLE;