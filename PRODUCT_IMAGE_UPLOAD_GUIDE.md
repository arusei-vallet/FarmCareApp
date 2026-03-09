# Product Image Upload & Display Guide

## Overview
This guide explains how product images are uploaded by farmers and displayed to customers.

## Flow

### 1. Farmer Uploads Product with Image

**File:** `src/screens/farmer/ProductsScreen.tsx`

When a farmer adds a product:
1. Farmer taps "Add Product" button
2. Farmer can pick image from gallery OR take photo with camera
3. Image URI is stored temporarily in component state
4. When farmer saves the product:
   - Image is uploaded to Supabase Storage (`products` bucket)
   - Image URL is saved in the `products.images` array column
   - Product data (including image URL) is saved to `products` table

### 2. Image Storage

**File:** `src/services/storage.ts`

- Images are stored in Supabase Storage bucket: `products`
- File naming: `product-{productId}-{timestamp}.{ext}`
- Supported formats: JPG, PNG
- Upload methods:
  - **Blob upload** (preferred): Direct binary upload
  - **Base64/Uint8Array upload** (fallback): For Android emulator issues

### 3. Customer Views Products

**File:** `src/screens/customer/CustomerDashboard.tsx`

When customer opens the app:
1. `fetchProducts()` queries the `products` table
2. Filters: `is_available = true`
3. Orders: Featured products first, then newest
4. Joins with `users` table to get seller name
5. Transforms data for display:
   - Uses first image from `images` array
   - Falls back to placeholder if no image
6. Displays products with images

## Troubleshooting

### Images Not Showing on Customer Dashboard

#### Check 1: Verify Images in Database
```sql
-- Run this in Supabase SQL Editor
SELECT id, name, images, is_available 
FROM products 
WHERE is_available = true 
LIMIT 10;
```

Expected result: `images` column should contain URLs like:
```
["https://xxxxxx.supabase.co/storage/v1/object/public/products/product-xxx-123.jpg"]
```

#### Check 2: Verify Storage Bucket Exists
1. Go to Supabase Dashboard → Storage
2. Check if `products` bucket exists
3. If not, create it with **Public** access

#### Check 3: Verify Storage Policies
Run this SQL in Supabase SQL Editor:

```sql
-- Allow anyone to read (view) product images
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Check 4: Check Console Logs
When customer dashboard loads, check for these logs:
```
🔄 Fetching products from database...
✅ Fetched X products
🖼️ Product [name] has image: https://...
📦 Transformed products: X
📋 First product: { id, title, image, seller }
```

If you see:
- `⚠️ Product [name] has no images` → Product was saved without image
- `❌ Error fetching products` → Check RLS policies on products table

#### Check 5: Verify .env Configuration
Ensure `.env` file exists with:
```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_SUPABASE_PRODUCTS_BUCKET=products
```

### Image Upload Fails

#### Common Errors:

**"Bucket not found"**
- Create the `products` bucket in Supabase Storage

**"Permission denied"**
- Run the storage policies SQL above

**"Network error"**
- Check internet connection
- Try on real device (Android emulator has network issues with blob uploads)

#### Debug Image Upload:
Watch for these console logs when farmer uploads:
```
📤 Uploading image...
  Bucket: products
  Filename: product-xxx-123.jpg
✓ Upload successful (blob method)
```

Or if fallback is used:
```
⚠️ Blob upload failed, trying base64 method...
✓ Upload successful (base64 method)
```

## Testing

### Test Image Upload (Farmer Side)
1. Open farmer dashboard
2. Go to Products → Add Product
3. Fill in name, price, quantity
4. Tap image picker → Select photo
5. Save product
6. Check console for upload logs
7. Verify in Supabase:
   - Storage → products bucket → image file exists
   - SQL Editor → `SELECT images FROM products WHERE name = '...'`

### Test Image Display (Customer Side)
1. Open customer dashboard
2. Check console logs
3. Verify products show with images
4. If placeholder shows, check why image URL is missing

## Database Schema

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'kg',
  quantity_available DECIMAL(10,2),
  images TEXT[],  -- Array of image URLs
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Note:** `images` is an array (`TEXT[]`) to support multiple images per product

## Best Practices

1. **Always upload images before saving product** - The ProductContext handles this automatically
2. **Use image compression** - Current quality is 0.7 (70%)
3. **Validate image URLs** - Check if URL starts with `http`
4. **Provide fallback** - Always show placeholder if image missing
5. **Log errors** - Console logs help debug issues

## Quick Fix Commands

### Reset Products Table (if needed)
```sql
-- Add images column if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
```

### Fix Storage Policies
```bash
# Run the fix script
psql -h your-db.supabase.co -U postgres -d postgres -f fix-storage-policies.sql
```

### Check Products with Images
```sql
SELECT 
  id, 
  name, 
  CASE 
    WHEN images IS NULL OR array_length(images, 1) IS NULL THEN 'No Image'
    ELSE 'Has Image'
  END as image_status,
  price,
  is_available
FROM products
WHERE is_available = true
ORDER BY created_at DESC;
```
