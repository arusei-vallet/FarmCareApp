-- ============================================================
-- Supabase Storage Setup for Product Images
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================

-- Create the products bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. STORAGE POLICIES
-- ============================================================

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
CREATE POLICY "Users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'products'
    AND auth.uid()::text IS NOT NULL
);

-- Allow authenticated users to view all files in products bucket
DROP POLICY IF EXISTS "Users can view product images" ON storage.objects;
CREATE POLICY "Users can view product images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'products');

-- Allow authenticated users to update their own files
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
CREATE POLICY "Users can update own product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'products'
    AND auth.uid()::text IS NOT NULL
);

-- Allow authenticated users to delete their own files
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
CREATE POLICY "Users can delete own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'products'
    AND auth.uid()::text IS NOT NULL
);

-- ============================================================
-- 3. ENABLE PUBLIC ACCESS (Optional - for public URLs)
-- ============================================================

-- If you want images to be publicly accessible without authentication
DROP POLICY IF EXISTS "Public access to product images" ON storage.objects;
CREATE POLICY "Public access to product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'products';

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'products';
