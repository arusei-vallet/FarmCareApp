import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCart } from './CartContext'
import { useProducts, Product as ContextProduct } from '../../context/ProductContext'
import { supabase } from '../../services/supabase'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'
const LIGHT_BG = '#F4F7F5'

type FilterType = 'None' | 'Most Purchased' | 'Latest' | 'Low Price' | 'High Price'

type RootStackParamList = {
  Home: undefined
  Categories: { category: string }
  Cart: undefined
  ProductDetail: { product: ContextProduct & { images?: string[]; seller?: string; rating?: number; review_count?: number; unit?: string } }
  Checkout: undefined
}

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

// Extend product type for UI state
interface ProductWithUI extends ContextProduct {
  mostPurchased?: boolean
  latest?: boolean
  isFeatured?: boolean
  discount_percentage?: number
  discounted_price?: number
  discount_active?: boolean
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const { addItem } = useCart()
  const { products, loading } = useProducts()

  const [showAll, setShowAll] = useState<boolean>(false)
  const [favorites, setFavorites] = useState<boolean>(false)
  const [favoriteProducts, setFavoriteProducts] = useState<Set<string>>(new Set())
  const [showFavoritesModal, setShowFavoritesModal] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<boolean>(false)
  const [filterActive, setFilterActive] = useState<boolean>(false)
  const [filterType, setFilterType] = useState<FilterType>('None')
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({})

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredProducts, setFilteredProducts] = useState<ProductWithUI[]>([])

  // Featured products with discounts
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithUI[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  // Notification state
  const [notificationList, setNotificationList] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false)
  const [notificationLoading, setNotificationLoading] = useState<boolean>(false)

  const allCategories: string[] = [
    'Grains','Vegetables','Fruits','Legumes','Spices','Herbs','Tubers',
    'Seeds','Nuts','Organic Produce','Dairy','Poultry','Seafood'
  ]

  // Convert context products to UI products
  const productsWithUI: ProductWithUI[] = products.map((p, index) => ({
    ...p,
    mostPurchased: index % 2 === 0,
    latest: index % 3 === 0,
  }))

  // Filter and search products
  useEffect(() => {
    let result = [...productsWithUI]

    // Apply search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.price.toLowerCase().includes(lowerQuery)
      )
    }

    // Apply filter
    if (filterType === 'Most Purchased') {
      result = result.filter(p => p.mostPurchased)
    } else if (filterType === 'Latest') {
      result = result.filter(p => p.latest)
    } else if (filterType === 'Low Price') {
      result.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0
        return priceA - priceB
      })
    } else if (filterType === 'High Price') {
      result.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 0
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 0
        return priceB - priceA
      })
    }

    setFilteredProducts(result)
  }, [searchQuery, filterType, products])

  // Featured items to scroll endlessly
  const featuredItems = [1, 2, 3]
  const endlessFeaturedItems = Array.from({ length: 30 }, (_, i) => featuredItems[i % featuredItems.length])

  // Add product to cart
  const handleAddToCart = (product: ContextProduct) => {
    addItem(product)
    setAddedToCart(prev => ({ ...prev, [product.id]: true }))
  }

  // Toggle favorite for a product
  const toggleFavorite = (productId: string) => {
    setFavoriteProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  // Get favorite products list
  const getFavoriteProductsList = () => {
    const favorites = products.filter(p => favoriteProducts.has(p.id)).map(p => ({
      id: String(p.id || ''),
      name: String(p.name || ''),
      price: String(p.price || ''),
      image: p.image || '',
      images: Array.isArray(p.images) ? p.images : [],
      seller: p.seller || '',
      seller_id: p.seller_id || '',
      rating: Number(p.rating || 0),
      review_count: Number(p.review_count || 0),
      unit: p.unit || 'kg',
    }));
    console.log('Favorites to render:', favorites);
    return favorites;
  }

  // Add favorite product to cart
  const addFavoriteToCart = (product: { id: string; name: string; price: string; seller_id?: string; unit?: string; image?: string }) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      seller_id: product.seller_id,
      unit: product.unit || 'kg',
      image: product.image,
    })
    setAddedToCart(prev => ({ ...prev, [product.id]: true }))
  }

  // Add all favorites to cart
  const addAllFavoritesToCart = () => {
    getFavoriteProductsList().forEach(product => {
      addFavoriteToCart(product)
    })
    setShowFavoritesModal(false)
  }

  // Fetch featured products with discounts
  const fetchFeaturedProducts = async () => {
    try {
      setFeaturedLoading(true)

      // Fetch products that are featured OR have active discounts
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          unit,
          images,
          is_featured,
          rating,
          review_count,
          category,
          quantity_available,
          seller_id,
          discount_percentage,
          discounted_price,
          discount_active,
          users:seller_id (id, full_name)
        `)
        .eq('is_available', true)
        .or('is_featured.eq.true,discount_active.eq.true')
        .order('discount_active', { ascending: false })
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const formattedFeatured: ProductWithUI[] = (data || []).map(item => ({
        id: String(item.id || ''),
        name: String(item.name || ''),
        price: `KES ${item.price}/${item.unit}`,
        stock: Number(item.quantity_available) || 0,
        image: item.images?.[0] || '',
        images: item.images || [],
        seller: (item.users as any)?.full_name || 'Local Farmer',
        seller_id: item.seller_id,
        rating: item.rating,
        review_count: item.review_count,
        unit: item.unit,
        isFeatured: item.is_featured || item.discount_active,
        discount_percentage: item.discount_percentage,
        discounted_price: item.discounted_price,
        discount_active: item.discount_active,
      }))

      setFeaturedProducts(formattedFeatured)
    } catch (error) {
      console.error('Error fetching featured products:', error)
    } finally {
      setFeaturedLoading(false)
    }
  }

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications()
    fetchFeaturedProducts()
  }, [])

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
        return
      }

      setNotificationList(data || [])
      setUnreadCount((data || []).filter(n => !n.is_read).length)
    } catch (error) {
      console.error('Notification fetch error:', error)
    } finally {
      setNotificationLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (!error) {
        setNotificationList(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)

      if (!error) {
        setNotificationList(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'security':
        return { name: 'shield-checkmark', color: '#1976D2', bgColor: '#E3F2FD' }
      case 'notice':
        return { name: 'notifications', color: '#F57C00', bgColor: '#FFF3E0' }
      case 'order':
        return { name: 'receipt', color: '#2E7D32', bgColor: '#E8F5E9' }
      case 'promo':
        return { name: 'percent', color: '#FBC02D', bgColor: '#FFFDE7' }
      default:
        return { name: 'information-circle', color: '#666', bgColor: '#F5F5F5' }
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const renderProductCard = ({ item }: { item: ProductWithUI }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        const parentNav = navigation.getParent()
        if (parentNav && item.id) {
          parentNav.navigate('ProductDetail', {
            product: {
              id: item.id,
              name: String(item.name || ''),
              price: String(item.price || ''),
              image: String(item.image || ''),
              images: Array.isArray(item.images) ? item.images : [],
              seller: String(item.seller || ''),
              rating: Number(item.rating || 0),
              review_count: Number(item.review_count || 0),
              unit: String(item.unit || 'kg'),
            }
          })
        } else {
          console.error('Parent navigator not found')
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardImg}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="image-outline" size={40} color="#ccc" />
          </View>
        )}
        <TouchableOpacity
          style={styles.cardFavoriteIcon}
          onPress={(e) => {
            e.stopPropagation()
            toggleFavorite(item.id)
          }}
          activeOpacity={0.7}
        >
          <Icon
            name={favoriteProducts.has(item.id) ? 'heart' : 'heart-outline'}
            size={22}
            color={favoriteProducts.has(item.id) ? '#FF5252' : '#fff'}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.price}>{String(item.price)}</Text>
      <TouchableOpacity
        style={[styles.cartBtn, addedToCart[item.id] && { backgroundColor: ACCENT }]}
        onPress={(e) => {
          e.stopPropagation()
          handleAddToCart(item)
        }}
        disabled={addedToCart[item.id]}
      >
        <Icon
          name={addedToCart[item.id] ? "checkmark" : "cart-outline"}
          size={16}
          color="#fff"
        />
        <Text style={styles.cartText}> {addedToCart[item.id] ? 'Added' : 'Add'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.customerName}>Customer</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => setShowFavoritesModal(true)}
          >
            <Icon
              name={favoriteProducts.size > 0 ? "heart" : "heart-outline"}
              size={20}
              color={favoriteProducts.size > 0 ? "#FF5252" : "#fff"}
            />
            {favoriteProducts.size > 0 && (
              <View style={styles.favoriteBadge}>
                <Text style={styles.favoriteBadgeText}>
                  {favoriteProducts.size > 9 ? '9+' : String(favoriteProducts.size)}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => {
              setShowNotificationsModal(true)
              fetchNotifications()
            }}
          >
            <Icon
              name={unreadCount > 0 ? "notifications" : "notifications-outline"}
              size={20}
              color="#fff"
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* SEARCH */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#777" />
            <TextInput
              placeholder="Search fresh produce..."
              placeholderTextColor="#777"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color="#777" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterBtn, filterActive && { backgroundColor: PRIMARY }]}
            onPress={() => setFilterActive(!filterActive)}
          >
            <Icon name="options-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* FILTER OPTIONS */}
        {filterActive && (
          <View style={styles.filterOptions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity onPress={() => { setFilterType('None'); setFilterActive(false) }}>
                <Text style={[styles.filterText, filterType === 'None' && { fontWeight: 'bold' }]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFilterType('Most Purchased'); setFilterActive(false) }}>
                <Text style={[styles.filterText, filterType === 'Most Purchased' && { fontWeight: 'bold' }]}>Most Purchased</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFilterType('Latest'); setFilterActive(false) }}>
                <Text style={[styles.filterText, filterType === 'Latest' && { fontWeight: 'bold' }]}>Latest</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFilterType('Low Price'); setFilterActive(false) }}>
                <Text style={[styles.filterText, filterType === 'Low Price' && { fontWeight: 'bold' }]}>Low Price</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFilterType('High Price'); setFilterActive(false) }}>
                <Text style={[styles.filterText, filterType === 'High Price' && { fontWeight: 'bold' }]}>High Price</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* CATEGORIES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setShowAll(!showAll)}>
            <Text style={styles.seeAll}>{showAll ? 'Show Less' : 'See All'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(showAll ? allCategories : allCategories.slice(0, 5)).map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.category}
              onPress={() => navigation.navigate('Categories', { category: cat })}
            >
              <Text style={styles.categoryText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FEATURED - Endless Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🌾 Featured Produce</Text>
          <Text style={styles.sectionSubtitle}>Fresh deals from local farmers</Text>
        </View>

        {featuredLoading ? (
          <View style={styles.featuredLoadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.featuredLoadingText}>Loading fresh deals...</Text>
          </View>
        ) : featuredProducts.length === 0 ? (
          <View style={styles.emptyFeatured}>
            <Icon name="leaf-outline" size={48} color="#ccc" />
            <Text style={styles.emptyFeaturedText}>No featured products yet</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScrollContent}
          >
            {/* Duplicate products for endless scroll effect */}
            {[...featuredProducts, ...featuredProducts, ...featuredProducts].map((item, index) => {
              const uniqueKey = `${item.id}-${index}`
              return (
                <TouchableOpacity
                  key={uniqueKey}
                  style={styles.featuredCard}
                  onPress={() => {
                    const parentNav = navigation.getParent()
                    if (parentNav && item.id) {
                      parentNav.navigate('ProductDetail', {
                        product: {
                          id: item.id,
                          name: String(item.name || ''),
                          price: String(item.price || ''),
                          image: String(item.image || ''),
                          images: item.images || [],
                          seller: String(item.seller || ''),
                          seller_id: item.seller_id,
                          rating: Number(item.rating || 0),
                          review_count: Number(item.review_count || 0),
                          unit: String(item.unit || 'kg'),
                        }
                      })
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.featuredImageContainer}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.featuredImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.featuredImage, styles.featuredPlaceholder]}>
                        <Icon name="image-outline" size={40} color="#ccc" />
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.favoriteIcon}
                      onPress={(e) => {
                        e.stopPropagation()
                        toggleFavorite(item.id)
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={favoriteProducts.has(item.id) ? 'heart' : 'heart-outline'}
                        size={24}
                        color={favoriteProducts.has(item.id) ? '#FF5252' : '#fff'}
                      />
                    </TouchableOpacity>
                    {/* Discount Badge */}
                    {item.discount_active && item.discount_percentage ? (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>{item.discount_percentage}% OFF</Text>
                      </View>
                    ) : item.isFeatured ? (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredBadgeText}>FEATURED</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.featuredOverlay}>
                    <Text style={styles.featuredTitle} numberOfLines={1}>{item.name}</Text>
                    {/* Price with discount */}
                    {item.discount_active && item.discounted_price ? (
                      <View style={styles.featuredPriceContainer}>
                        <Text style={styles.featuredOriginalPrice}>
                          {String(item.price)}
                        </Text>
                        <Text style={styles.featuredDiscountedPrice}>
                          KES {item.discounted_price.toFixed(2)}/{item.unit}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.featuredSubtitle}>{String(item.price)}</Text>
                    )}
                    {item.rating ? (
                      <View style={styles.featuredRating}>
                        <Icon name="star" size={12} color="#FFC107" />
                        <Text style={styles.featuredRatingText}>{item.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        )}

        {/* POPULAR - Now showing farmer's products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${filteredProducts.length})` : 'Popular Near You'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading fresh products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="search-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? `No products found for "${searchQuery}"` : 'No products available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Check back later for fresh produce'}
            </Text>
          </View>
        ) : (
          <View
            key={`${filteredProducts.length}-${filterType}-${searchQuery}`}
            style={styles.grid}
          >
            {filteredProducts.map((item, index) => (
              <View key={item.id || index} style={{ width: '48%' }}>
                {renderProductCard({ item })}
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* FAVORITES MODAL */}
      <Modal
        visible={showFavoritesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>My Favorites</Text>
                <Text style={styles.modalSubtitle}>
                  {String(favoriteProducts.size) + ' ' + (favoriteProducts.size === 1 ? 'item' : 'items') + ' saved'}
                </Text>
              </View>
              <View style={styles.modalHeaderActions}>
                {favoriteProducts.size > 0 && (
                  <TouchableOpacity onPress={addAllFavoritesToCart} style={styles.markAllBtn}>
                    <Icon name="cart" size={18} color={PRIMARY} />
                    <Text style={styles.markAllText}>Add all</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowFavoritesModal(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {getFavoriteProductsList().length === 0 ? (
              <View style={styles.emptyFavorites}>
                <Icon name="heart-dislike-outline" size={64} color="#ccc" />
                <Text style={styles.emptyFavoritesTitle}>No Favorites Yet</Text>
                <Text style={styles.emptyFavoritesText}>
                  Start adding products to your favorites to quickly find them later
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.favoritesScroll} showsVerticalScrollIndicator={false}>
                {getFavoriteProductsList().map((product, index) => (
                  <View key={product.id || String(index)} style={styles.favoriteProductCard}>
                    <View style={styles.favoriteProductImageContainer}>
                      {product.image ? (
                        <Image
                          source={{ uri: product.image }}
                          style={styles.favoriteProductImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.favoriteProductPlaceholder}>
                          <Icon name="image-outline" size={32} color="#999" />
                        </View>
                      )}
                    </View>
                    <View style={styles.favoriteProductContent}>
                      <Text style={styles.favoriteProductTitle}>{String(product.name)}</Text>
                      <Text style={styles.favoriteProductPrice}>{String(product.price)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.favoriteRemoveBtn}
                      onPress={() => toggleFavorite(product.id)}
                    >
                      <Icon name="close-circle" size={24} color="#FF5252" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* NOTIFICATIONS MODAL */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Notifications</Text>
                <Text style={styles.modalSubtitle}>
                  {`${unreadCount} ${unreadCount === 1 ? 'unread' : 'unread'} ${notificationList.length === 0 ? '' : `of ${notificationList.length} total`}`}
                </Text>
              </View>
              <View style={styles.modalHeaderActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                    <Text style={styles.markAllText}>Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotificationsModal(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {notificationLoading ? (
              <View style={styles.loadingModalContainer}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.loadingModalText}>Loading notifications...</Text>
              </View>
            ) : notificationList.length === 0 ? (
              <View style={styles.emptyNotifications}>
                <Icon name="notifications-none" size={64} color="#ccc" />
                <Text style={styles.emptyNotificationsTitle}>No Notifications</Text>
                <Text style={styles.emptyNotificationsText}>
                  You're all caught up! Check back here for security alerts, notices from farmers, and order updates.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.notificationsScroll} showsVerticalScrollIndicator={false}>
                {notificationList.map((notification) => {
                  const iconConfig = getNotificationIcon(notification.type)
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={[
                        styles.notificationItem,
                        { backgroundColor: iconConfig.bgColor },
                        notification.is_read && { opacity: 0.7 }
                      ]}
                      onPress={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id)
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notificationIconBox, { backgroundColor: iconConfig.color }]}>
                        <Icon name={iconConfig.name} size={20} color="#fff" />
                      </View>
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={[styles.notificationTitle, !notification.is_read && styles.unreadTitle]}>
                            {notification.title}
                          </Text>
                          {!notification.is_read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>{formatTime(notification.created_at)}</Text>
                      </View>
                      <Icon name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      </View>
    </LinearGradient>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LIGHT_BG },
  header: { backgroundColor: PRIMARY, padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  greeting: { color: '#C8E6C9', fontSize: 14 },
  customerName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerIcons: { flexDirection: 'row', marginLeft: 10 },
  iconCircle: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20, marginLeft: 10 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  searchBox: { flex: 1, flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 15, alignItems: 'center', elevation: 3, gap: 8 },
  searchInput: { flex: 1 },
  filterBtn: { backgroundColor: ACCENT, padding: 14, borderRadius: 15, marginLeft: 10, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  filterOptions: { backgroundColor: '#E8F5E9', marginHorizontal: 16, padding: 10, borderRadius: 10, marginBottom: 10 },
  filterText: { fontSize: 14, color: PRIMARY, marginHorizontal: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sectionSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  seeAll: { color: ACCENT, fontWeight: '600' },
  category: { backgroundColor: '#E8F5E9', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, marginLeft: 16, marginBottom: 5 },
  categoryText: { color: PRIMARY, fontWeight: '600' },
  featuredCard: { marginLeft: 16, borderRadius: 20, overflow: 'hidden', width: 250, height: 180 },
  featuredScrollContent: { paddingRight: 16 },
  featuredLoadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  featuredLoadingText: { fontSize: 14, color: '#999', marginTop: 12 },
  emptyFeatured: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyFeaturedText: { fontSize: 14, color: '#999', marginTop: 8 },
  featuredImageContainer: { width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', position: 'relative' },
  featuredImage: { width: '100%', height: '100%', borderRadius: 20 },
  featuredPlaceholder: { backgroundColor: '#A5D6A7', justifyContent: 'center', alignItems: 'center' },
  favoriteIcon: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6 },
  featuredBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: ACCENT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  featuredBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#E53935', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  discountBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  featuredPriceContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 8 },
  featuredOriginalPrice: { color: '#ccc', fontSize: 12, textDecorationLine: 'line-through' },
  featuredDiscountedPrice: { color: '#FFC107', fontSize: 14, fontWeight: 'bold' },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: 'rgba(0,0,0,0.5)' },
  featuredTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  featuredSubtitle: { color: '#fff', fontSize: 14, marginTop: 2 },
  featuredRating: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  featuredRatingText: { color: '#fff', fontSize: 12, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 10, paddingBottom: 20 },
  card: { backgroundColor: '#fff', width: '100%', borderRadius: 20, padding: 12, marginBottom: 15, elevation: 4 },
  cardImg: { width: '100%', height: 120, borderRadius: 15, backgroundColor: '#E8F5E9', marginBottom: 10, overflow: 'hidden', position: 'relative' },
  productImage: { width: '100%', height: '100%', borderRadius: 15 },
  placeholderImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 15 },
  cardFavoriteIcon: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 18, padding: 5 },
  cardTitle: { fontWeight: 'bold', fontSize: 14 },
  price: { color: ACCENT, fontWeight: '600', marginVertical: 5 },
  cartBtn: { flexDirection: 'row', backgroundColor: PRIMARY, padding: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  cartText: { color: '#fff', fontWeight: '600' },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  favoriteBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  favoriteBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingModalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingModalText: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyNotificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsScroll: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    gap: 12,
  },
  notificationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    marginLeft: 6,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  emptyFavorites: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyFavoritesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyFavoritesText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  favoritesScroll: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  favoriteProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  favoriteProductImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  favoriteProductImage: {
    width: '100%',
    height: '100%',
  },
  favoriteProductPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteProductContent: {
    flex: 1,
    marginLeft: 12,
  },
  favoriteProductTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  favoriteProductPrice: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
    marginBottom: 4,
  },
  favoriteProductRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteProductRatingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  favoriteProductActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteRemoveBtn: {
    padding: 4,
  },
  favoriteAddToCartBtn: {
    backgroundColor: PRIMARY,
    padding: 8,
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
