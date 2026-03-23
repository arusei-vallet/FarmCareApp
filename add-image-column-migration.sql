-- ============================================================
-- Migration: Add image column for backward compatibility
-- Description: Ensure products table has both image and images columns
-- Date: 2026-03-23
--
-- INSTRUCTIONS: Run this SQL in your Supabase SQL Editor
-- ============================================================

-- Add image column for backward compatibility (singular)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add comments
COMMENT ON COLUMN public.products.image IS 'Primary product image URL (for backward compatibility)';
COMMENT ON COLUMN public.products.images IS 'Array of product image URLs';

-- Update existing products to populate image column from images array
-- For TEXT[] array type, use array_length and array indexing
UPDATE public.products
SET image = images[1]
WHERE image IS NULL 
  AND images IS NOT NULL 
  AND array_length(images, 1) > 0;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
