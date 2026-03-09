# Product Images Setup with Supabase Storage

This guide explains how product images are uploaded and stored in Supabase.

## Setup Steps

### 1. Create Storage Bucket in Supabase

**Option A: Using SQL Editor (Recommended)**

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the SQL file: `supabase-storage-setup.sql`

**Option B: Using Supabase UI**

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Name: `products`
4. Set **Public** = true
5. File size limit: `5MB` (5242880 bytes)
6. Allowed MIME types: `image/jpeg, image/png, image/webp`
7. Click **Create bucket**

### 2. Configure Environment Variables

Add the bucket name to your `.env` file:

```bash
EXPO_PUBLIC_SUPABASE_PRODUCTS_BUCKET=products
```

### 3. How It Works

#### When a Farmer Adds a Product:

1. **Select Image**: Farmer picks image from gallery or camera
2. **Image Stored Temporarily**: Image URI is stored in local state
3. **Save Product**: When farmer taps "Add Product":
   - Image is uploaded to Supabase Storage bucket
   - Public URL is generated
   - Product data + image URL saved to `products` table
4. **Display**: Image URL is used to display image in UI

#### File Structure in Bucket:
```
products/
├── product-1234567890-abc123.jpg
├── product-1234567891-def456.png
└── product-1234567892-ghi789.webp
```

### 4. Code Flow

```
ProductsScreen.tsx
    ↓
pickImage() / takePhoto()
    ↓
Store local URI in state
    ↓
handleSaveProduct()
    ↓
ProductContext.addProduct()
    ↓
uploadProductImage() [storage.ts]
    ↓
Supabase Storage Upload
    ↓
Get Public URL
    ↓
Save to products.images[] array
    ↓
Refresh Products List
    ↓
Display in UI
```

### 5. Key Files

| File | Purpose |
|------|---------|
| `src/services/storage.ts` | Image upload/delete functions |
| `src/context/ProductContext.tsx` | Integrates storage with product CRUD |
| `src/screens/farmer/ProductsScreen.tsx` | UI for image selection & upload feedback |
| `supabase-storage-setup.sql` | Database setup for storage bucket |

### 6. Features

- ✅ Upload images from camera or gallery
- ✅ Shows upload progress indicator
- ✅ Stores images in Supabase Storage
- ✅ Generates public URLs for display
- ✅ Works for both new and edited products
- ✅ Graceful fallback if upload fails
- ✅ Images displayed in farmer's ProductsScreen
- ✅ Images displayed in customer's HomeScreen

### 7. Troubleshooting

**Error: "Bucket not found"**
- Ensure bucket `products` exists in Supabase Storage
- Check `EXPO_PUBLIC_SUPABASE_PRODUCTS_BUCKET` in `.env`

**Error: "Permission denied"**
- Run the storage policies SQL in Supabase
- Ensure user is authenticated

**Images not displaying**
- Check if bucket is public
- Verify image URLs in database are accessible
- Check network connectivity

### 8. Security

- **Authentication Required**: Only logged-in farmers can upload
- **RLS Policies**: Users can only manage their own images
- **File Size Limit**: 5MB per image
- **MIME Type Validation**: Only images allowed

### 9. Testing

1. Start the app
2. Login as a farmer
3. Go to Products screen
4. Tap **+** button
5. Tap "Pick from gallery" or "Take a photo"
6. Fill in product details
7. Tap "Add Product"
8. Check console for upload logs
9. Verify image appears in products list
10. Check Supabase Storage bucket for uploaded file
