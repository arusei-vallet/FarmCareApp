import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../services/supabase'
import { uploadProductImage } from '../services/storage'

export interface Product {
  id: string
  name: string
  price: string
  stock: number
  image: string
  images?: string[]
  seller_id?: string
  seller?: string
  description?: string
  category?: string
  is_available?: boolean
  rating?: number
  review_count?: number
  unit?: string
  discount_percentage?: number
  discounted_price?: number
  discount_active?: boolean
  discount_start_date?: string
  discount_end_date?: string
}

interface ProductContextType {
  products: Product[]
  loading: boolean
  refreshProducts: () => Promise<void>
  addProduct: (product: Omit<Product, 'id'>) => Promise<{ success: boolean; error?: string }>
  updateProduct: (id: string, product: Partial<Product>) => Promise<{ success: boolean; error?: string }>
  deleteProduct: (id: string) => Promise<{ success: boolean; error?: string }>
  getProductById: (id: string) => Product | undefined
  searchProducts: (query: string) => Product[]
  uploadImage: (uri: string, productId?: string) => Promise<{ url?: string; error?: string }>
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Load products on mount
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users:seller_id (id, full_name)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Convert database format to app format
      const formattedProducts: Product[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        price: `KES ${item.price}/${item.unit}`,
        stock: Number(item.quantity_available) || 0,
        image: item.image || item.images?.[0] || '',
        images: item.images || [item.image].filter(Boolean),
        seller_id: item.seller_id,
        seller: (item.users as any)?.full_name || 'Local Farmer',
        description: item.description,
        category: item.category,
        is_available: item.is_available,
        rating: item.rating,
        review_count: item.review_count,
        unit: item.unit,
        discount_percentage: item.discount_percentage,
        discounted_price: item.discounted_price,
        discount_active: item.discount_active,
        discount_start_date: item.discount_start_date,
        discount_end_date: item.discount_end_date,
      }))

      setProducts(formattedProducts)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (uri: string, productId?: string) => {
    return await uploadProductImage(uri, productId)
  }

  const addProduct = async (product: Omit<Product, 'id'>): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get current user (seller)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'Not authenticated' }
      }

      // Parse price to extract numeric value and unit
      // Handle both formats: "KES 120/kg" or just numeric value
      let price = 0
      let unit = product.unit || 'kg'
      
      if (typeof product.price === 'string') {
        const priceMatch = product.price.match(/(\d+(?:\.\d+)?)(?:\/(\w+))?/)
        price = priceMatch ? parseFloat(priceMatch[1]) : 0
        if (priceMatch?.[2]) {
          unit = priceMatch[2]
        }
      } else if (typeof product.price === 'number') {
        price = product.price
      }

      // Upload image to Supabase Storage if it's a local URI
      let imageUrl = ''
      let uploadWarning = ''

      if (product.image && product.image !== 'https://via.placeholder.com/400') {
        if (product.image.startsWith('file://') || product.image.startsWith('data:')) {
          console.log('📷 Uploading image from URI:', product.image.substring(0, 50))
          const uploadResult = await uploadProductImage(product.image)
          if (uploadResult.error) {
            console.warn('❌ Image upload failed:', uploadResult.error)
            uploadWarning = 'Image upload failed. Product created without image.'
            imageUrl = ''
          } else if (uploadResult.url) {
            console.log('✅ Image uploaded successfully:', uploadResult.url)
            imageUrl = uploadResult.url
          }
        } else {
          // It's already a URL
          imageUrl = product.image
        }
      }

      const insertData: any = {
        seller_id: user.id,
        name: product.name.trim(),
        description: product.description || '',
        price: price,
        unit: unit,
        quantity_available: product.stock,
        image: imageUrl, // Store in singular field for compatibility
        images: imageUrl ? [imageUrl] : [], // Store in array field for new features
        is_available: product.is_available !== undefined ? product.is_available : true,
      }

      // Add category if provided (only if it's a valid category)
      if (product.category && product.category !== 'Uncategorized') {
        insertData.category = product.category
      }

      console.log('📝 Inserting product:', insertData)

      const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Supabase error:', error.message, error.details)
        
        // If category column doesn't exist, retry without it
        if (error.message.includes('category') || error.code === 'PGRST204') {
          delete insertData.category
          console.log('🔄 Retrying without category column...')
          const retryResult = await supabase
            .from('products')
            .insert(insertData)
            .select()
            .single()

          if (retryResult.error) {
            console.error('❌ Retry failed:', retryResult.error)
            throw retryResult.error
          }
          
          await loadProducts()
          return {
            success: true,
            error: uploadWarning || 'Product saved (category not supported in your database)'
          }
        }
        throw error
      }

      console.log('✅ Product added successfully:', data?.id)

      // Refresh products list
      await loadProducts()

      return {
        success: true,
        error: uploadWarning || undefined
      }
    } catch (error: any) {
      console.error('❌ Error adding product:', error.message)
      return { 
        success: false, 
        error: error.message || 'Failed to add product. Please try again.' 
      }
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>): Promise<{ success: boolean; error?: string }> => {
    try {
      const updateData: any = {}

      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.stock !== undefined) updateData.quantity_available = updates.stock
      if (updates.is_available !== undefined) updateData.is_available = updates.is_available
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.discount_percentage !== undefined) {
        updateData.discount_percentage = updates.discount_percentage
        updateData.discount_active = updates.discount_percentage > 0
      }
      if (updates.discount_active !== undefined) updateData.discount_active = updates.discount_active
      if (updates.discounted_price !== undefined) updateData.discounted_price = updates.discounted_price

      if (updates.price !== undefined) {
        const priceMatch = updates.price.match(/(\d+(?:\.\d+)?)(?:\/(\w+))?/)
        if (priceMatch) {
          updateData.price = parseFloat(priceMatch[1])
          if (priceMatch[2]) updateData.unit = priceMatch[2]
          // Recalculate discounted price if discount exists
          if (updates.discount_percentage !== undefined && updates.discount_percentage > 0) {
            updateData.discounted_price = updateData.price - (updateData.price * (updates.discount_percentage / 100))
          }
        }
      }

      // Upload new image if it's a local URI
      if (updates.image && (updates.image.startsWith('file://') || updates.image.startsWith('data:'))) {
        const uploadResult = await uploadProductImage(updates.image, id)
        if (uploadResult.url) {
          updateData.image = uploadResult.url // Store in singular field
          updateData.images = [uploadResult.url] // Store in array field
        }
      } else if (updates.image) {
        updateData.image = updates.image // Store in singular field
        updateData.images = [updates.image] // Store in array field
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Refresh products list
      await loadProducts()

      return { success: true }
    } catch (error: any) {
      console.error('Error updating product:', error)
      return { success: false, error: error.message }
    }
  }

  const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Soft delete - mark as unavailable instead of deleting
      const { error } = await supabase
        .from('products')
        .update({ is_available: false })
        .eq('id', id)

      if (error) throw error

      // Refresh products list
      await loadProducts()

      return { success: true }
    } catch (error: any) {
      console.error('Error deleting product:', error)
      return { success: false, error: error.message }
    }
  }

  const getProductById = (id: string) => {
    return products.find(p => p.id === id)
  }

  const searchProducts = (query: string): Product[] => {
    if (!query.trim()) return products
    const lowerQuery = query.toLowerCase()
    return products.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.price.toLowerCase().includes(lowerQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery))
    )
  }

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        refreshProducts: loadProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        searchProducts,
        uploadImage,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export const useProducts = () => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider')
  }
  return context
}
