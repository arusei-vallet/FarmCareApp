# ⚠️ QUICK FIX: Storage Bucket Setup Required

The error "Network request failed" means the Supabase Storage bucket doesn't exist yet.

## Follow These Steps:

### Step 1: Create Storage Bucket in Supabase UI

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `jluxaezbaiilupmfgmgm`
3. **Click "Storage"** in the left sidebar
4. **Click "New bucket"**
5. **Fill in the details**:
   - **Name**: `products`
   - **Public**: ✅ **ON** (toggle it on)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: Leave empty (allows all)
6. **Click "Create bucket"**

### Step 2: Set Bucket to Public

1. After creating the bucket, click on it
2. Click the **"..."** (three dots) menu
3. Click **"Edit bucket"**
4. Make sure **"Public bucket"** is toggled ON
5. Click **"Save"**

### Step 3: Restart Your App

```bash
# Stop the current Expo server (Ctrl+C)
# Then restart
npm start
```

### Step 4: Try Adding a Product Again

1. Open the app
2. Go to Products screen (as farmer)
3. Tap **+** button
4. Pick an image
5. Fill in product details
6. Tap "Add Product"

The image should now upload successfully! 🎉

---

## Alternative: Run SQL to Create Bucket

If you prefer SQL, run this in Supabase SQL Editor:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('products', 'products', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');
```

---

## Verify It Works

After setup, check the console logs. You should see:
```
Uploading image to bucket: products
File name: product-1234567890-abc123.jpg
Blob created, size: 12345 type: image/jpeg
Upload successful
Public URL: https://...
```

If you still see errors, the console will show the specific issue.
