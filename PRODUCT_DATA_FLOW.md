# Product Data Flow - From Farmer to Customer

## Overview
This document explains how products added by farmers are displayed to customers with images, using Supabase as the backend.

## Complete Flow

### 1. Farmer Adds Product

**File:** `src/screens/farmer/ProductsScreen.tsx`

```typescript
// Farmer picks image from gallery/camera
const pickImage = async () => {
  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
  })
  
  if (!result.canceled) {
    setNewProduct({ ...newProduct, image: result.assets[0].uri })
  }
}

// When saving product
const saveProduct = async () => {
  // ProductContext handles image upload automatically
  await addProduct({
    name,
    price,
    stock,
    image, // Local URI (file://)
    // ... other fields
  })
}
```

### 2. Image Upload to Storage

**File:** `src/services/storage.ts`

```typescript
export async function uploadProductImage(uri: string, productId?: string) {
  // 1. Check if remote URL (already uploaded)
  if (uri.startsWith('http')) {
    return { url: uri }
  }
  
  // 2. Upload to Supabase Storage
  const fileName = `product-${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('products')
    .upload(fileName, blob)
  
  // 3. Get public URL
  const { data: urlData } = supabase.storage
    .from('products')
    .getPublicUrl(fileName)
  
  return { url: urlData.publicUrl }
}
```

### 3. Save Product to Database

**File:** `src/context/ProductContext.tsx`

```typescript
const addProduct = async (product) => {
  // 1. Upload image first
  let imageUrl = product.image
  if (product.image.startsWith('file://')) {
    const uploadResult = await uploadProductImage(product.image)
    imageUrl = uploadResult.url
  }
  
  // 2. Insert product with image URL
  await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      name: product.name,
      price: price,
      quantity_available: product.stock,
      images: imageUrl ? [imageUrl] : [], // Array of URLs
      is_available: true,
    })
}
```

### 4. Customer Fetches Products

**File:** `src/screens/customer/CustomerDashboard.tsx`

```typescript
const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      images,        // Array of image URLs
      seller_id,
      users:seller_id (full_name)
    `)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
  
  // Transform for display
  const transformedProducts = data.map(product => ({
    id: product.id,
    title: product.name,
    price: product.price,
    image: product.images?.[0] || 'placeholder', // First image
    seller: product.users?.full_name || 'Farmer',
  }))
  
  setProducts(transformedProducts)
}
```

### 5. Display Products with Images

**File:** `src/screens/customer/CustomerDashboard.tsx`

```typescript
<ScrollView horizontal>
  {products.map(item => (
    <View key={item.id} style={styles.productCard}>
      <Image 
        source={{ uri: item.image }}  // Shows image from Supabase
        style={styles.productImage} 
      />
      <Text>{item.title}</Text>
      <Text>{item.seller}</Text>
      <Text>KES {item.price}</Text>
    </View>
  ))}
</ScrollView>
```

## Database Schema

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'kg',
  quantity_available DECIMAL(10,2),
  images TEXT[],              -- Array of image URLs
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Storage Bucket
- **Name:** `products`
- **Access:** Public
- **File naming:** `product-{timestamp}-{random}.{ext}`

## Required Setup

### 1. Create Storage Bucket (Supabase Dashboard)
```
Storage → Create bucket → "products"
Set to Public access
```

### 2. Add Storage Policies (SQL Editor)
```sql
-- Allow anyone to read product images
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.role() = 'authenticated'
);
```

### 3. Environment Variables (.env)
```env
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
EXPO_PUBLIC_SUPABASE_PRODUCTS_BUCKET=products
```

## Mock Data Removed

### Before (Mock Data):
```typescript
// ❌ OLD - CategoriesScreen.tsx
const categoryProducts = {
  'All': [
    { 
      id: '1', 
      name: 'Fresh Tomatoes', 
      image: 'https://images.unsplash.com/...' // Static URL
    },
    // ... more hardcoded products
  ]
}
```

### After (Real Data):
```typescript
// ✅ NEW - CategoriesScreen.tsx
const fetchProducts = async () => {
  const { data } = await supabase
    .from('products')
    .select('*, images, users(full_name)')
    .eq('is_available', true)
  
  // Products from database with real images
  setCategoryProducts(data)
}
```

## Files Updated

### Customer Screens (Now using Supabase):
1. ✅ `src/screens/customer/CustomerDashboard.tsx`
2. ✅ `src/screens/customer/CategoriesScreen.tsx`
3. ✅ `src/screens/customer/HomeScreen.tsx` (already using ProductContext)

### Farmer Screens (Already working):
1. ✅ `src/screens/farmer/ProductsScreen.tsx`
2. ✅ `src/context/ProductContext.tsx`
3. ✅ `src/services/storage.ts`

## Testing

### Test Product Upload (Farmer):
1. Open Farmer Dashboard → Products
2. Tap "+" to add product
3. Fill name, price, quantity
4. Tap image picker → Select photo
5. Save
6. **Check console:** Should see upload logs
7. **Check Supabase:** 
   - Storage → products bucket → image file
   - SQL: `SELECT images FROM products ORDER BY created_at DESC`

### Test Product Display (Customer):
1. Open Customer Dashboard
2. **Check console:** Should see fetch logs
   ```
   🔄 Fetching products from database...
   ✅ Fetched 5 products
   🖼️ Product Tomatoes has image: https://...
   ```
3. Products should display with farmer-uploaded images
4. Categories screen should show products from database

## Troubleshooting

### Images Not Showing?

**Check 1: Console Logs**
```
Farmer side:
📤 Uploading image...
✓ Upload successful

Customer side:
🔄 Fetching products...
🖼️ Product X has image: https://...
```

**Check 2: Database**
```sql
SELECT id, name, images 
FROM products 
WHERE is_available = true;
```
Should return URLs like: `["https://xxx.supabase.co/storage/..."]`

**Check 3: Storage**
- Go to Supabase Dashboard → Storage
- Check if `products` bucket exists
- Check if image files are uploaded

**Check 4: RLS Policies**
```sql
-- Run in SQL Editor
SELECT * FROM storage.objects WHERE bucket_id = 'products';
```
Should return uploaded images

### Common Issues

**"Bucket not found"**
→ Create `products` bucket in Supabase Storage

**"Permission denied"**
→ Run the storage policies SQL above

**"Network error"**
→ Check internet connection
→ Try on real device (Android emulator has issues)

**No products showing**
→ Check if farmer added products with `is_available = true`
→ Check console for fetch errors

## Summary

✅ **Farmer adds product** → Image uploaded to Storage → URL saved in Database  
✅ **Customer views products** → Fetch from Database → Display images from URLs  
✅ **No mock data** → All products from Supabase  
✅ **Real-time updates** → New products appear immediately  

## Next Steps

1. **Test on real device** for best image upload performance
2. **Monitor console logs** during testing
3. **Check Supabase dashboard** to verify data
4. **Add more products** to see pagination (limit 20-50 per page)
