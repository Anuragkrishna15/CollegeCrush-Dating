-- Migration: 002_add_file_size_to_storage_objects
-- Description: Add file_size column to storage.objects table
-- Created: 2024-11-06
-- Previous migration: 001_initial_schema

-- Add file_size column to storage.objects if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'storage'
        AND table_name = 'objects'
        AND column_name = 'file_size'
    ) THEN
        ALTER TABLE storage.objects ADD COLUMN file_size bigint;
    END IF;
END $$;

-- Update the validate_file_upload function to handle cases where file_size might be null
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

    -- Validate file size (50MB limit) - only if file_size is provided
    IF NEW.file_size IS NOT NULL AND NEW.file_size > 52428800 THEN
        RAISE EXCEPTION 'File size too large. Maximum size is 50MB.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;