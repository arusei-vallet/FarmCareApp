-- ============================================================
-- Migration: Add category text column to products table
-- Purpose: Backward compatibility with existing app code
-- Date: 2026-03-02
-- ============================================================

-- Add category text column (for backward compatibility)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add index for faster searches
CREATE INDEX IF NOT EXISTS idx_products_category_text ON public.products(category);

-- Add comment to document the dual-category system
COMMENT ON COLUMN public.products.category IS 
'Category name (text) for backward compatibility. Also see category_id (UUID reference).';

-- ============================================================
-- Run this in Supabase SQL Editor
-- ============================================================
