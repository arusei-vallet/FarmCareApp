import { supabase } from './supabase'
import Constants from 'expo-constants'

const PRODUCTS_BUCKET = Constants.expoConfig?.extra?.supabaseProductsBucket || 'products'

/**
 * Convert URI to base64
 */
async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove data:image/jpeg;base64, prefix if present
      const base64Data = base64.split(',')[1] || base64
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Upload a product image to Supabase Storage
 * Uses base64 upload as fallback for network issues
 */
export async function uploadProductImage(
  uri: string,
  productId?: string
): Promise<{ url?: string; error?: string }> {
  try {
    if (!uri) {
      return { error: 'No image URI provided' }
    }

    // Check if it's a remote URL (already uploaded)
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      console.log('✓ Image is already a URL, skipping upload:', uri.substring(0, 50))
      return { url: uri }
    }

    // Generate unique filename
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = productId 
      ? `product-${productId}-${Date.now()}.${fileExt}`
      : `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    console.log('📤 Uploading image...')
    console.log('  Bucket:', PRODUCTS_BUCKET)
    console.log('  Filename:', fileName)

    // Method 1: Try blob upload first
    try {
      const response = await fetch(uri)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }
      const blob = await response.blob()
      console.log('  Blob created - Size:', blob.size, 'bytes')

      const { data, error: uploadError } = await supabase.storage
        .from(PRODUCTS_BUCKET)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: blob.type || 'image/jpeg',
        })

      if (uploadError) throw uploadError

      console.log('✓ Upload successful (blob method)')
      const { data: urlData } = supabase.storage
        .from(PRODUCTS_BUCKET)
        .getPublicUrl(fileName)

      return { url: urlData.publicUrl }
    } catch (blobError: any) {
      console.warn('⚠️ Blob upload failed, trying base64 method...', blobError.message)
      
      // Method 2: Try base64 upload (works better on Android emulator)
      try {
        const base64Data = await uriToBase64(uri)
        console.log('  Converting to base64...')

        // For base64 upload, we need to use a different approach
        // Fetch the image and convert to blob with proper type
        const response = await fetch(uri)
        const arrayBuffer = await response.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        console.log('  Uploading as Uint8Array...')
        
        const { data, error: uploadError } = await supabase.storage
          .from(PRODUCTS_BUCKET)
          .upload(fileName, uint8Array, {
            cacheControl: '3600',
            upsert: false,
            contentType: fileExt === 'png' ? 'image/png' : 'image/jpeg',
          })

        if (uploadError) throw uploadError

        console.log('✓ Upload successful (base64 method)')
        const { data: urlData } = supabase.storage
          .from(PRODUCTS_BUCKET)
          .getPublicUrl(fileName)

        return { url: urlData.publicUrl }
      } catch (base64Error: any) {
        console.error('❌ Base64 upload also failed:', base64Error.message)
        throw base64Error
      }
    }
  } catch (error: any) {
    console.error('❌ All upload methods failed:', error.message)
    
    const errorMsg = error.message.toLowerCase()
    
    // Provide specific error messages
    if (errorMsg.includes('bucket') || errorMsg.includes('not found')) {
      return { 
        url: 'https://via.placeholder.com/400?text=Product+Image',
        error: 'Storage bucket "products" not found.'
      }
    }
    
    if (errorMsg.includes('permission') || errorMsg.includes('policy') || errorMsg.includes('unauthorized')) {
      return { 
        url: 'https://via.placeholder.com/400?text=Product+Image',
        error: 'Permission denied. Run fix-storage-policies.sql'
      }
    }

    if (errorMsg.includes('network')) {
      return { 
        url: 'https://via.placeholder.com/400?text=Product+Image',
        error: 'Network error - check internet connection'
      }
    }
    
    return { 
      url: 'https://via.placeholder.com/400?text=Product+Image',
      error: error.message 
    }
  }
}

/**
 * Upload multiple product images
 */
export async function uploadProductImages(
  uris: string[],
  productId?: string
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = []
  const errors: string[] = []

  for (const uri of uris) {
    const result = await uploadProductImage(uri, productId)
    if (result.url) {
      urls.push(result.url)
    } else if (result.error) {
      errors.push(result.error)
    }
  }

  return { urls, errors }
}

/**
 * Delete a product image from Supabase Storage
 */
export async function deleteProductImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const urlParts = imageUrl.split('/')
    const fileName = urlParts.pop()

    if (!fileName) {
      return { success: false, error: 'Invalid image URL' }
    }

    const { error } = await supabase.storage
      .from(PRODUCTS_BUCKET)
      .remove([fileName])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
