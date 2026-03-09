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
        image: item.images?.[0] || '',
        images: item.images || [],
        seller_id: item.seller_id,
        seller: (item.users as any)?.full_name || 'Local Farmer',
        description: item.description,
        category: item.category,
        is_available: item.is_available,
        rating: item.rating,
        review_count: item.review_count,
        unit: item.unit,
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
      const priceMatch = product.price.match(/(\d+(?:\.\d+)?)(?:\/(\w+))?/)
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0
      const unit = priceMatch?.[2] || 'kg'

      // Upload image to Supabase Storage if it's a local URI
      let imageUrl = product.image
      let uploadWarning = ''

      if (product.image && (product.image.startsWith('file://') || product.image.startsWith('data:'))) {
        const uploadResult = await uploadProductImage(product.image)
        if (uploadResult.error) {
          console.warn('Image upload failed:', uploadResult.error)
          uploadWarning = 'Image upload failed. Product created without image.'
          imageUrl = ''
        } else if (uploadResult.url) {
          imageUrl = uploadResult.url
        }
      }

      const insertData: any = {
        seller_id: user.id,
        name: product.name,
        description: product.description || '',
        price: price,
        unit: unit,
        quantity_available: product.stock,
        images: imageUrl ? [imageUrl] : [],
        is_available: true,
      }

      // Add category if provided
      if (product.category) {
        insertData.category = product.category
      }

      const { data, error } = await supabase
        .from('products')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        // If category column doesn't exist, retry without it
        if (error.code === 'PGRST204' && error.message.includes('category')) {
          delete insertData.category
          console.log('Retrying without category column...')
          const retryResult = await supabase
            .from('products')
            .insert(insertData)
            .select()
            .single()

          if (retryResult.error) throw retryResult.error
          await loadProducts()
          return { 
            success: true, 
            error: uploadWarning || undefined 
          }
        }
        throw error
      }

      // Refresh products list
      await loadProducts()

      return { 
        success: true, 
        error: uploadWarning || undefined 
      }
    } catch (error: any) {
      console.error('Error adding product:', error)
      return { success: false, error: error.message }
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

      if (updates.price !== undefined) {
        const priceMatch = updates.price.match(/(\d+(?:\.\d+)?)(?:\/(\w+))?/)
        if (priceMatch) {
          updateData.price = parseFloat(priceMatch[1])
          if (priceMatch[2]) updateData.unit = priceMatch[2]
        }
      }

      // Upload new image if it's a local URI
      if (updates.image && (updates.image.startsWith('file://') || updates.image.startsWith('data:'))) {
        const uploadResult = await uploadProductImage(updates.image, id)
        if (uploadResult.url) {
          updateData.images = [uploadResult.url]
        }
      } else if (updates.image) {
        updateData.images = [updates.image]
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
