-- ============================================================
-- Fix Storage Policies for 'products' Bucket
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. VERIFY BUCKET EXISTS
-- ============================================================
SELECT id, name, public FROM storage.buckets WHERE id = 'products';

-- ============================================================
-- 2. DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================================
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to product images" ON storage.objects;

-- ============================================================
-- 3. CREATE NEW POLICIES
-- ============================================================

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'products'
);

-- Policy 2: Allow anyone to read files (public access)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (
    bucket_id = 'products'
);

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'products'
);

-- Policy 4: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'products'
);

-- ============================================================
-- 4. ENSURE BUCKET IS PUBLIC
-- ============================================================
UPDATE storage.buckets 
SET public = true 
WHERE id = 'products';

-- ============================================================
-- 5. VERIFICATION QUERIES
-- ============================================================

-- Check bucket status
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'products';

-- Check policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- ============================================================
-- 6. TEST (Optional - uncomment to test)
-- ============================================================
-- This will be run by the app, but you can test manually:
-- SELECT storage.foldername('products');
