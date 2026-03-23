# Product Images Setup - Categories Screen

## Overview

Products uploaded by farmers will now display correctly in the customer's Categories screen with images.

## Changes Made

### 1. **CategoriesScreen.tsx** - Updated Product Fetching

- Now fetches both `image` and `images` columns from database
- Handles both singular (`image`) and array (`images`) image storage
- Falls back to default description if none provided
- Properly transforms product data for display

### 2. **ProductContext.tsx** - Updated Product Storage

- Products now store images in **both** `image` and `images` fields
- Ensures backward compatibility with existing code
- `addProduct`: Stores image URL in both fields
- `updateProduct`: Updates both fields when image changes

### 3. **DashboardScreen.tsx** - Fixed Date Handling

- Added safe date parsing for discount end dates
- Prevents "Date value out of bounds" errors

## Database Schema

Your `products` table should have these columns for images:

```sql
-- Image columns (both should exist for compatibility)
image TEXT           -- Singular image URL (for backward compatibility)
images JSONB         -- Array of image URLs (for new features)
```

### If `image` column is missing, run this migration:

```sql
-- Add image column for backward compatibility
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image TEXT;

-- Add comment
COMMENT ON COLUMN public.products.image IS 'Primary product image URL (for backward compatibility)';
```

## How It Works

### Farmer Adds Product (Dashboard/Products Screen)

1. Farmer selects/takes photo
2. Image is uploaded to Supabase Storage
3. Product is saved with:
   - `image`: "https://...storage.url/..."
   - `images`: ["https://...storage.url/..."]

### Customer Views Categories Screen

1. Fetches products with both `image` and `images` columns
2. Display logic: `product.image || product.images[0]`
3. Shows product with proper image

## Testing Checklist

### For Farmers:

- [ ] Add a new product with image from gallery
- [ ] Add a new product with photo from camera
- [ ] Edit existing product and change image
- [ ] Verify product appears in database with both `image` and `images` fields

### For Customers:

- [ ] Open Categories screen
- [ ] Select different categories
- [ ] Verify products display with images
- [ ] Tap product to view details
- [ ] Add product to cart

## Troubleshooting

### Products show without images:

1. Check console logs for image upload errors
2. Verify `image` column exists in products table
3. Check storage bucket permissions

### Image upload fails:

1. Run `fix-storage-policies.sql` in Supabase
2. Check network connectivity
3. Verify storage bucket exists

### Database error "column does not exist":

Run the migration SQL above to add missing columns

## File Locations

- Customer Categories: `src/screens/customer/CategoriesScreen.tsx`
- Product Context: `src/context/ProductContext.tsx`
- Farmer Products: `src/screens/farmer/ProductsScreen.tsx`
- Farmer Dashboard: `src/screens/farmer/DashboardScreen.tsx`
