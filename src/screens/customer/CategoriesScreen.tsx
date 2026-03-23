import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Animated,
  Dimensions,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MCIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCart, Product } from './CartContext'
import { supabase } from '../../services/supabase'
import { getProductImageUrl } from '../../services/storage'

const { width } = Dimensions.get('window')

type RootStackParamList = {
  Categories: { category?: string }
  Home: undefined
  ProductDetail: { product: any }
}

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Categories'>
type CategoriesScreenRouteProp = RouteProp<RootStackParamList, 'Categories'>

const PRIMARY = '#1B5E20'
const SECONDARY = '#4CAF50'
const ACCENT = '#2ECC71'
const LIGHT_BG = '#F4F7F5'
const CARD_BG = '#FFFFFF'

interface CategoryProduct extends Product {
  id: string
  image: string
  images?: string[]
  unit: string
  rating: number
  reviews: number
  seller?: string
  category?: string
  description?: string
  quantity_available?: number
}

interface CategoryInfo {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  gradient: [string, string]
}

const CATEGORIES: CategoryInfo[] = [
  { id: 'All', name: 'All', icon: 'apps', color: '#1B5E20', bgColor: '#E8F5E9', gradient: ['#1B5E20', '#4CAF50'] },
  { id: 'Vegetables', name: 'Vegetables', icon: 'leaf', color: '#2E7D32', bgColor: '#E8F5E9', gradient: ['#2E7D32', '#66BB6A'] },
  { id: 'Fruits', name: 'Fruits', icon: 'fruit-cherries', color: '#C62828', bgColor: '#FFEBEE', gradient: ['#C62828', '#EF5350'] },
  { id: 'Grains', name: 'Grains', icon: 'grain', color: '#F9A825', bgColor: '#FFFDE7', gradient: ['#F9A825', '#FDD835'] },
  { id: 'Legumes', name: 'Legumes', icon: 'seed', color: '#6A1B9A', bgColor: '#F3E5F5', gradient: ['#6A1B9A', '#AB47BC'] },
  { id: 'Tubers', name: 'Tubers', icon: 'potato', color: '#8D6E63', bgColor: '#EFEBE9', gradient: ['#8D6E63', '#A1887F'] },
  { id: 'Dairy', name: 'Dairy', icon: 'cow', color: '#0277BD', bgColor: '#E1F5FE', gradient: ['#0277BD', '#29B6F6'] },
  { id: 'Poultry', name: 'Poultry', icon: 'chicken', color: '#F57C00', bgColor: '#FFF3E0', gradient: ['#F57C00', '#FF9800'] },
  { id: 'Seafood', name: 'Seafood', icon: 'fish', color: '#0097A7', bgColor: '#E0F7FA', gradient: ['#0097A7', '#26C6DA'] },
  { id: 'Organic', name: 'Organic', icon: 'sprout', color: '#43A047', bgColor: '#E8F5E9', gradient: ['#43A047', '#66BB6A'] },
  { id: 'Spices', name: 'Spices', icon: 'pepper', color: '#C62828', bgColor: '#FFEBEE', gradient: ['#C62828', '#E53935'] },
  { id: 'Herbs', name: 'Herbs', icon: 'sprout', color: '#43A047', bgColor: '#E8F5E9', gradient: ['#43A047', '#66BB6A'] },
  { id: 'Seeds', name: 'Seeds', icon: 'seed-outline', color: '#5D4037', bgColor: '#EFEBE9', gradient: ['#5D4037', '#795548'] },
  { id: 'Nuts', name: 'Nuts', icon: 'nut', color: '#6D4C41', bgColor: '#D7CCC8', gradient: ['#6D4C41', '#8D6E63'] },
]

const CategoriesScreen = () => {
  const navigation = useNavigation<CategoriesScreenNavigationProp>()
  const route = useRoute<CategoriesScreenRouteProp>()
  const { addItem } = useCart()

  const selectedCategory = route.params?.category || 'All'
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({})
  const [products, setProducts] = useState<CategoryProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'rating' | 'newest'>('default')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CategoryProduct | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const fadeAnim = new Animated.Value(0)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          unit,
          image,
          images,
          rating,
          review_count,
          category,
          quantity_available,
          seller_id,
          users:seller_id (full_name)
        `)
        .eq('is_available', true)

      if (selectedCategory !== 'All') {
        query = query.ilike('category', `%${selectedCategory}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50)

      if (error) {
        Alert.alert('Error', 'Failed to load products: ' + error.message)
        return
      }

      const transformedProducts: CategoryProduct[] = (data || []).map(product => {
        // Handle both image (singular) and images (array) fields
        const rawImage = product.image || product.images?.[0] || ''
        // Convert storage path to public URL
        const productImage = rawImage ? getProductImageUrl(rawImage) : ''

        console.log('🖼️ Product:', product.name, '| Raw:', rawImage, '| URL:', productImage?.substring(0, 80))

        return {
          id: product.id,
          name: product.name,
          description: product.description || 'Fresh produce from local farmers',
          price: `KES ${product.price}`,
          unit: product.unit || 'kg',
          image: productImage || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name),
          images: product.images && product.images.length > 0
            ? product.images.map((img: string) => getProductImageUrl(img))
            : [productImage || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(product.name)],
          rating: product.rating || 0,
          reviews: product.review_count || 0,
          seller: (product.users as any)?.full_name || 'Local Farmer',
          category: product.category,
          quantity_available: product.quantity_available,
        }
      })

      setProducts(transformedProducts)
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load products: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryInfo = (categoryName: string): CategoryInfo => {
    return CATEGORIES.find(c => c.name === categoryName) || CATEGORIES[0]
  }

  const filteredAndSortedProducts = () => {
    let result = [...products]

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.seller?.toLowerCase().includes(lowerQuery)
      )
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0
          return priceA - priceB
        })
        break
      case 'price-high':
        result.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0
          return priceB - priceA
        })
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        result.sort((a, b) => b.reviews - a.reviews)
        break
    }

    return result
  }

  const displayProducts = filteredAndSortedProducts()

  const handleAddToCart = (product: CategoryProduct) => {
    addItem({ name: product.name, price: `${product.price}/${product.unit}`, mostPurchased: product.mostPurchased })
    setAddedToCart(prev => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddedToCart(prev => ({ ...prev, [product.id]: false }))
    }, 2000)
  }

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId)
      } else {
        newFavorites.add(productId)
      }
      return newFavorites
    })
  }

  const handleQuickView = (product: CategoryProduct) => {
    setSelectedProduct(product)
    setShowQuickView(true)
  }

  const renderStars = (rating: number, size: number = 14) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : 'star-outline'}
          size={size}
          color={i <= Math.floor(rating) ? '#FFC107' : '#ddd'}
        />
      )
    }
    return stars
  }

  const renderCategoryPill = ({ item }: { item: string }) => {
    const categoryInfo = getCategoryInfo(item)
    const isActive = selectedCategory === item

    return (
      <TouchableOpacity
        style={[
          styles.categoryPill,
          isActive && { backgroundColor: categoryInfo.color },
        ]}
        onPress={() => navigation.setParams({ category: item })}
        activeOpacity={0.7}
      >
        <MCIcons
          name={categoryInfo.icon}
          size={18}
          color={isActive ? '#fff' : categoryInfo.color}
          style={styles.categoryIcon}
        />
        <Text
          style={[
            styles.categoryPillText,
            isActive && styles.categoryPillTextActive,
            { color: isActive ? '#fff' : categoryInfo.color },
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderProductCard = ({ item }: { item: CategoryProduct }) => {
    const isFavorite = favorites.has(item.id)
    const isAdded = addedToCart[item.id]

    if (viewMode === 'list') {
      return (
        <Animated.View style={[styles.listCard, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.listImageContainer}
            onPress={() => handleQuickView(item)}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.listImage}
              resizeMode="cover"
              onError={(e) => {
                console.error('❌ List Image load error for', item.name, ':', e.nativeEvent.error, '| URL:', item.image)
              }}
              onLoad={() => {
                console.log('✅ List Image loaded for', item.name)
              }}
            />
            {item.quantity_available !== null && item.quantity_available !== undefined && item.quantity_available < 10 && (
              <View style={styles.lowStockBadge}>
                <Text style={styles.lowStockText}>Low Stock</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.listContent}>
            <View style={styles.listHeader}>
              <Text style={styles.listProductName} numberOfLines={2}>{item.name}</Text>
              <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite ? '#e53935' : '#999'}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.listSeller} numberOfLines={1}>🌾 {item.seller}</Text>
            <View style={styles.listRatingRow}>
              <View style={styles.listStars}>{renderStars(item.rating, 12)}</View>
              <Text style={styles.listReviews}>({item.reviews})</Text>
            </View>
            {/* Product Description */}
            <Text style={styles.listDescription} numberOfLines={2}>
              {item.description || 'Fresh produce from local farmers'}
            </Text>
            <Text style={styles.listPrice}>{item.price}<Text style={styles.listUnit}>/{item.unit}</Text></Text>
            <View style={styles.listActions}>
              <TouchableOpacity
                style={[styles.listAddBtn, isAdded && { backgroundColor: ACCENT }]}
                onPress={() => handleAddToCart(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isAdded ? 'checkmark' : 'cart-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.listAddText}>{isAdded ? 'Added' : 'Add'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.listQuickViewBtn}
                onPress={() => handleQuickView(item)}
              >
                <Ionicons name="eye-outline" size={18} color={PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )
    }

    // Grid view
    return (
      <Animated.View style={[styles.gridCard, { opacity: fadeAnim }]}>
        <View style={styles.gridImageContainer}>
          <TouchableOpacity onPress={() => handleQuickView(item)} activeOpacity={0.7}>
            <Image
              source={{ uri: item.image }}
              style={styles.gridImage}
              resizeMode="cover"
              onError={(e) => {
                console.error('❌ Grid Image load error for', item.name, ':', e.nativeEvent.error, '| URL:', item.image?.substring(0, 100))
              }}
              onLoad={() => {
                console.log('✅ Grid Image loaded for', item.name)
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteBtn}
            onPress={() => toggleFavorite(item.id)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? '#e53935' : '#fff'}
            />
          </TouchableOpacity>
          {item.quantity_available !== null && item.quantity_available !== undefined && item.quantity_available < 10 && (
            <View style={styles.lowStockGridBadge}>
              <Text style={styles.lowStockGridText}>Only {item.quantity_available} left</Text>
            </View>
          )}
        </View>
        <View style={styles.gridContent}>
          <Text style={styles.gridProductName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.gridSeller} numberOfLines={1}>🌾 {item.seller}</Text>
          <View style={styles.gridRatingRow}>
            {renderStars(item.rating, 10)}
            <Text style={styles.gridReviews}>({item.reviews})</Text>
          </View>
          {/* Product Description */}
          <Text style={styles.gridDescription} numberOfLines={2}>
            {item.description || 'Fresh produce'}
          </Text>
          <Text style={styles.gridPrice}>{item.price}<Text style={styles.gridUnit}>/{item.unit}</Text></Text>
          <TouchableOpacity
            style={[styles.gridAddBtn, isAdded && { backgroundColor: ACCENT }]}
            onPress={() => handleAddToCart(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isAdded ? 'checkmark' : 'cart-outline'}
              size={16}
              color="#fff"
            />
            <Text style={styles.gridAddText}>{isAdded ? 'Added' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    )
  }

  const renderEmpty = () => {
    const categoryInfo = getCategoryInfo(selectedCategory)
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: categoryInfo.bgColor }]}>
          <MCIcons name={categoryInfo.icon} size={64} color={categoryInfo.color} />
        </View>
        <Text style={styles.emptyTitle}>No products found</Text>
        <Text style={styles.emptyText}>
          {selectedCategory === 'All'
            ? 'No products available yet. Check back later for fresh produce!'
            : `No products in ${selectedCategory}. Try another category or check back soon.`
          }
        </Text>
        <TouchableOpacity
          style={styles.browseAllBtn}
          onPress={() => navigation.setParams({ category: 'All' })}
        >
          <Text style={styles.browseAllText}>Browse All Products</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const currentCategoryInfo = getCategoryInfo(selectedCategory)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header - Deep Green Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <MCIcons name={currentCategoryInfo.icon} size={24} color="#fff" style={styles.headerIcon} />
            <Text style={styles.headerTitle}>{selectedCategory}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              placeholder="Search products..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          data={CATEGORIES.map(c => c.name)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          keyExtractor={(item) => item}
          renderItem={renderCategoryPill}
        />
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <Text style={styles.resultCount}>
            {displayProducts.length} {displayProducts.length === 1 ? 'product' : 'products'}
          </Text>
        </View>
        <View style={styles.toolbarRight}>
          <TouchableOpacity
            style={styles.viewToggleBtn}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid-outline'}
              size={20}
              color={PRIMARY}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sortBtn}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.sortBtnText}>
              {sortBy === 'default' ? 'Sort' : sortBy.replace('-', ' ')}
            </Text>
            <Ionicons name="chevron-down" size={18} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Products Grid/List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading fresh products...</Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={displayProducts}
          numColumns={viewMode === 'grid' ? 2 : 1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={viewMode === 'grid' ? styles.productsGrid : styles.productsList}
          keyExtractor={(item) => item.id}
          renderItem={renderProductCard}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Sort By</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'default', label: 'Default', icon: 'apps' },
                  { key: 'price-low', label: 'Price: Low to High', icon: 'arrow-down' },
                  { key: 'price-high', label: 'Price: High to Low', icon: 'arrow-up' },
                  { key: 'rating', label: 'Top Rated', icon: 'star' },
                  { key: 'newest', label: 'Most Popular', icon: 'fire' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      sortBy === option.key && styles.sortOptionActive,
                    ]}
                    onPress={() => {
                      setSortBy(option.key as any)
                      setShowFilterModal(false)
                    }}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={sortBy === option.key ? '#fff' : PRIMARY}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortBy === option.key && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSortBy('default')
                setSearchQuery('')
                setShowFilterModal(false)
              }}
            >
              <Ionicons name="refresh-outline" size={20} color={PRIMARY} />
              <Text style={styles.resetText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quick View Modal */}
      <Modal
        visible={showQuickView}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickView(false)}
      >
        <View style={styles.quickViewOverlay}>
          <View style={styles.quickViewContent}>
            {selectedProduct && (
              <>
                <View style={styles.quickViewImageContainer}>
                  <Image
                    source={{ uri: selectedProduct.image }}
                    style={styles.quickViewImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.quickViewClose}
                    onPress={() => setShowQuickView(false)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.quickViewBody}>
                  <Text style={styles.quickViewTitle}>{selectedProduct.name}</Text>
                  <View style={styles.quickViewRating}>
                    {renderStars(selectedProduct.rating, 16)}
                    <Text style={styles.quickViewReviews}>({selectedProduct.reviews} reviews)</Text>
                  </View>
                  <Text style={styles.quickViewSeller}>🌾 Sold by {selectedProduct.seller}</Text>
                  <Text style={styles.quickViewDescription} numberOfLines={3}>
                    {selectedProduct.description || 'Fresh produce sourced directly from local farmers.'}
                  </Text>
                  <View style={styles.quickViewFooter}>
                    <View>
                      <Text style={styles.quickViewPrice}>{selectedProduct.price}</Text>
                      <Text style={styles.quickViewUnit}>per {selectedProduct.unit}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.quickViewCartBtn,
                        addedToCart[selectedProduct.id] && { backgroundColor: ACCENT },
                      ]}
                      onPress={() => {
                        handleAddToCart(selectedProduct)
                        setTimeout(() => setShowQuickView(false), 500)
                      }}
                    >
                      <Ionicons
                        name={addedToCart[selectedProduct.id] ? 'checkmark' : 'cart-outline'}
                        size={22}
                        color="#fff"
                      />
                      <Text style={styles.quickViewCartText}>
                        {addedToCart[selectedProduct.id] ? 'Added' : 'Add to Cart'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default CategoriesScreen

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerActionBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: '#333',
  },
  categoriesWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    marginRight: 10,
    gap: 6,
  },
  categoryIcon: {
    marginBottom: -2,
  },
  categoryPillText: {
    fontWeight: '600',
    fontSize: 14,
  },
  categoryPillTextActive: {
    color: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  toolbarLeft: {
    flex: 1,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  viewToggleBtn: {
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    gap: 4,
  },
  sortBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  productsGrid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  productsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  gridCard: {
    width: '48%',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    marginRight: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  gridImageContainer: {
    position: 'relative',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lowStockGridBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 87, 34, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowStockGridText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  gridContent: {
    padding: 12,
  },
  gridProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  gridSeller: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
  },
  gridRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridReviews: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4,
  },
  gridPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: ACCENT,
    marginBottom: 2,
  },
  gridUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: '#888',
  },
  gridDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 15,
    marginBottom: 4,
  },
  gridAddBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  gridAddText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  listImageContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    backgroundColor: '#E8F5E9',
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 87, 34, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lowStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  listContent: {
    flex: 1,
    padding: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  listProductName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  listSeller: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  listRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  listStars: {
    flexDirection: 'row',
  },
  listReviews: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  listPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT,
    marginBottom: 8,
  },
  listUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#888',
  },
  listDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 6,
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  listAddBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  listAddText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  listQuickViewBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  browseAllBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  browseAllText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalSection: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: PRIMARY,
  },
  sortOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    gap: 8,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  quickViewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quickViewContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
  },
  quickViewImageContainer: {
    position: 'relative',
    height: 250,
    backgroundColor: '#E8F5E9',
  },
  quickViewImage: {
    width: '100%',
    height: '100%',
  },
  quickViewClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickViewBody: {
    padding: 20,
  },
  quickViewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  quickViewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickViewReviews: {
    fontSize: 13,
    color: '#888',
    marginLeft: 8,
  },
  quickViewSeller: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  quickViewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  quickViewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quickViewPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
  },
  quickViewUnit: {
    fontSize: 13,
    color: '#888',
  },
  quickViewCartBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickViewCartText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
})
