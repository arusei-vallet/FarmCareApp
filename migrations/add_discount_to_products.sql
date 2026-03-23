-- ============================================================
-- Migration: Add discount columns to products table
-- Description: Enable farmers to add discounts to products
-- Date: 2026-03-20
-- ============================================================

-- Add discount columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS discount_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP WITH TIME ZONE;

-- Add check constraint to ensure discount_percentage is between 0 and 100
ALTER TABLE public.products
ADD CONSTRAINT check_discount_percentage CHECK (
    discount_percentage >= 0 AND discount_percentage <= 100
);

-- Add check constraint to ensure discounted_price is positive
ALTER TABLE public.products
ADD CONSTRAINT check_discounted_price CHECK (
    discounted_price IS NULL OR discounted_price >= 0
);

-- Add index for querying discounted products efficiently
CREATE INDEX IF NOT EXISTS idx_products_discount_active 
ON public.products(discount_active) 
WHERE discount_active = true;

-- Add index for discount end date (useful for expiring discounts)
CREATE INDEX IF NOT EXISTS idx_products_discount_end_date 
ON public.products(discount_end_date) 
WHERE discount_active = true;

-- Comment on columns
COMMENT ON COLUMN public.products.discount_percentage IS 'Discount percentage (0-100)';
COMMENT ON COLUMN public.products.discounted_price IS 'Price after discount is applied';
COMMENT ON COLUMN public.products.discount_active IS 'Whether the discount is currently active';
COMMENT ON COLUMN public.products.discount_start_date IS 'Discount start date/time';
COMMENT ON COLUMN public.products.discount_end_date IS 'Discount end date/time (null for no expiry)';

-- Grant permissions (RLS already enabled on products table)
-- Sellers can update their own products including discount fields
