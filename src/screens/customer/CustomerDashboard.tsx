import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../../services/supabase'
import { useCart } from './CartContext'

const { width } = Dimensions.get('window')

const PRIMARY = '#1B5E20'
const SECONDARY = '#4CAF50'
const ACCENT = '#FBC02D'
const BG = '#F4F8F2'

const CustomerDashboard: React.FC = () => {
  const navigation = useNavigation<any>()
  const { cartCount } = useCart()
  const fadeAnim = useRef(new Animated.Value(0)).current
  
  const [userName, setUserName] = useState<string>('Customer')
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<string[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const [favoritesModalVisible, setFavoritesModalVisible] = useState(false)
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false)

  useEffect(() => {
    fetchUserProfile()
    fetchNotifications()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.log('Auth error:', authError.message)
        setLoading(false)
        return
      }

      if (user) {
        console.log('Fetching profile for user:', user.id)
        
        // Try to get user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          console.log('Profile fetch error:', profileError.message, profileError.code)
        }
        
        console.log('Profile data:', profile)
        
        if (profile?.full_name) {
          const firstName = profile.full_name.trim().split(' ')[0]
          console.log('Setting username to:', firstName)
          setUserName(firstName)
        } else {
          // Try getting email username as fallback
          const email = user.email
          if (email) {
            const emailName = email.split('@')[0]
            console.log('Using email as fallback:', emailName)
            setUserName(emailName)
          }
        }
      }
    } catch (error: any) {
      console.log('Error fetching user profile:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user's orders for notifications
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, order_number, total_amount, created_at')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const notificationsList: any[] = []
      
      orders?.forEach(order => {
        if (order.status === 'pending') {
          notificationsList.push({
            id: order.order_number || order.id,
            type: 'order',
            title: 'Order Confirmed',
            message: `Your order ${order.order_number?.slice(-6) || 'pending'} is being processed`,
            timestamp: order.created_at,
            icon: 'check-circle',
            color: '#2e7d32',
            bgColor: '#e8f5e9',
          })
        } else if (order.status === 'processing' || order.status === 'shipped') {
          notificationsList.push({
            id: order.order_number || order.id,
            type: 'delivery',
            title: 'Order On The Way',
            message: `Your order ${order.order_number?.slice(-6) || 'pending'} is out for delivery`,
            timestamp: order.created_at,
            icon: 'truck-delivery',
            color: '#1565c0',
            bgColor: '#e3f2fd',
          })
        } else if (order.status === 'delivered') {
          notificationsList.push({
            id: order.order_number || order.id,
            type: 'delivered',
            title: 'Order Delivered',
            message: `Your order has been delivered successfully!`,
            timestamp: order.created_at,
            icon: 'package-variant',
            color: '#2e7d32',
            bgColor: '#e8f5e9',
          })
        }
      })

      // Add promotional notifications
      notificationsList.push({
        id: 'promo-1',
        type: 'promo',
        title: 'Special Offer',
        message: 'Get 15% off on your next order! Use code FRESH15',
        timestamp: new Date().toISOString(),
        icon: 'percent',
        color: '#fbc02d',
        bgColor: '#fffde7',
      })

      setNotifications(notificationsList)
      setNotificationCount(notificationsList.filter(n => n.type !== 'delivered').length)
    } catch (error) {
      console.log('Error fetching notifications:', error)
    }
  }

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleNotificationPress = (notification: any) => {
    setNotificationsModalVisible(false)
    if (notification.type === 'order' || notification.type === 'delivery' || notification.type === 'delivered') {
      navigation.navigate('Orders')
    } else if (notification.type === 'promo') {
      Alert.alert('Special Offer', 'Use code FRESH15 for 15% off your next order!')
    }
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setNotificationCount(0)
  }

  const formatNotificationTime = (timestamp: string) => {
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()

    fetchUserProfile()
    fetchNotifications()
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      console.log('🔄 Fetching products from database...')
      
      // Fetch available products with seller information
      const { data: featuredProducts, error: featuredError } = await supabase
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
          users:seller_id (id, full_name)
        `)
        .eq('is_available', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20)

      if (featuredError) {
        console.log('❌ Error fetching products:', featuredError.message, featuredError.code)
        Alert.alert('Error', 'Failed to load products: ' + featuredError.message)
        return
      }

      console.log('✅ Fetched', featuredProducts?.length || 0, 'products')

      // Transform products for display
      const transformedProducts = (featuredProducts || []).map(product => {
        // Get the first image URL, or empty string if none
        let imageUrl = ''

        if (product.images && product.images.length > 0) {
          imageUrl = product.images[0]
          console.log('🖼️ Product', product.name, 'has image:', imageUrl.substring(0, 60) + '...')
        } else {
          console.log('⚠️ Product', product.name, 'has no images')
        }

        return {
          id: product.id,
          title: product.name,
          price: product.price,
          rating: product.rating || 0,
          reviews: product.review_count || 0,
          seller: (product.users as any)?.full_name || 'Local Farmer',
          image: imageUrl,
          images: product.images || [],
          description: product.description || '',
          unit: product.unit || 'kg',
          quantity: product.quantity_available || 0,
          isFeatured: product.is_featured || false,
          category: product.category || 'Fresh Produce',
        }
      })

      console.log('📦 Transformed products:', transformedProducts.length)
      if (transformedProducts.length > 0) {
        console.log('📋 First product:', {
          id: transformedProducts[0].id,
          title: transformedProducts[0].title,
          image: transformedProducts[0].image,
          seller: transformedProducts[0].seller,
        })
      }
      
      setProducts(transformedProducts)
    } catch (error: any) {
      console.log('❌ Error in fetchProducts:', error.message)
      Alert.alert('Error', 'Failed to load products: ' + error.message)
    }
  }

  const categories = [
    { id: '1', label: 'Vegetables', icon: 'leaf' },
    { id: '2', label: 'Fruits', icon: 'fruit-cherries' },
    { id: '3', label: 'Grains', icon: 'food' },
    { id: '4', label: 'Organic', icon: 'sprout' },
    { id: '5', label: 'Dairy', icon: 'cow' },
  ]

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.location}>Deliver to 📍 Nairobi</Text>
            <Text style={styles.greeting}>{getGreeting()}, {loading ? '...' : userName} 👋</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => setFavoritesModalVisible(true)}
            >
              <Ionicons 
                name={favorites.length > 0 ? 'heart' : 'heart-outline'} 
                size={26} 
                color={favorites.length > 0 ? '#c62828' : PRIMARY} 
              />
              {favorites.length > 0 && (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>{favorites.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => setNotificationsModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={26} color={PRIMARY} />
              {notificationCount > 0 && (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Cart')}
            >
              <MCIcon name="cart-outline" size={26} color={PRIMARY} />
              {cartCount > 0 && (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* SEARCH */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={22} color="#888" />
          <TextInput
            placeholder="Search fresh produce..."
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>

        {/* CATEGORIES */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map(cat => (
            <TouchableOpacity key={cat.id} style={styles.categoryChip}>
              <MCIcon name={cat.icon} size={20} color={PRIMARY} />
              <Text style={styles.categoryText}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FEATURED BANNER */}
        <LinearGradient
          colors={[PRIMARY, SECONDARY]}
          style={styles.banner}
        >
          <Text style={styles.bannerTitle}>🌾 Today’s Fresh Harvest</Text>
          <Text style={styles.bannerSubtitle}>
            Get farm-fresh produce delivered in 2–4 hours.
          </Text>
        </LinearGradient>

        {/* PRODUCTS */}
        <Text style={styles.sectionTitle}>Recommended for You</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {products.map(item => (
            <View key={item.id} style={styles.productCard}>
              <View style={styles.productImageContainer}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <TouchableOpacity 
                  style={styles.favoriteBtn}
                  onPress={() => toggleFavorite(item.id)}
                >
                  <Ionicons 
                    name={favorites.includes(item.id) ? 'heart' : 'heart-outline'} 
                    size={22} 
                    color={favorites.includes(item.id) ? '#c62828' : '#fff'} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.productContent}>
                <Text style={styles.productTitle}>{item.title}</Text>
                <Text style={styles.productSeller}>{item.seller}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.rating}>⭐ {item.rating}</Text>
                  <Text style={styles.price}>KES {item.price}/kg</Text>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                  <Text style={styles.addText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* GRID SECTION */}
        <Text style={styles.sectionTitle}>Popular Near You</Text>

        <View style={styles.grid}>
          {products.map(item => (
            <View key={item.id} style={styles.gridCard}>
              <View style={styles.gridImageContainer}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
                <TouchableOpacity 
                  style={styles.gridFavoriteBtn}
                  onPress={() => toggleFavorite(item.id)}
                >
                  <Ionicons 
                    name={favorites.includes(item.id) ? 'heart' : 'heart-outline'} 
                    size={20} 
                    color={favorites.includes(item.id) ? '#c62828' : '#fff'} 
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.gridContent}>
                <Text style={styles.gridTitle}>{item.title}</Text>
                <Text style={styles.gridPrice}>KES {item.price}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Favorites Modal */}
      <Modal
        visible={favoritesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFavoritesModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>My Favorites</Text>
                  <Text style={styles.modalSubtitle}>{favorites.length} items saved</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setFavoritesModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {favorites.length === 0 ? (
                  <View style={styles.emptyFavorites}>
                    <Ionicons name="heart-dislike-outline" size={56} color="#bdbdbd" />
                    <Text style={styles.emptyFavoritesTitle}>No Favorites Yet</Text>
                    <Text style={styles.emptyFavoritesText}>
                      Start adding products to your favorites to quickly find them later
                    </Text>
                  </View>
                ) : (
                  products
                    .filter(p => favorites.includes(p.id))
                    .map(item => (
                      <View key={item.id} style={styles.favoriteItem}>
                        <Image source={{ uri: item.image }} style={styles.favoriteItemImage} />
                        <View style={styles.favoriteItemContent}>
                          <Text style={styles.favoriteItemTitle}>{item.title}</Text>
                          <Text style={styles.favoriteItemPrice}>KES {item.price}/kg</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeFavoriteBtn}
                          onPress={() => toggleFavorite(item.id)}
                        >
                          <Ionicons name="close-circle" size={24} color="#c62828" />
                        </TouchableOpacity>
                      </View>
                    ))
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setFavoritesModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
                {favorites.length > 0 && (
                  <TouchableOpacity
                    style={styles.modalSave}
                    onPress={() => {
                      setFavoritesModalVisible(false)
                      Alert.alert('Coming Soon', 'Add all favorites to cart feature')
                    }}
                  >
                    <MCIcon name="cart-plus" size={18} color="#fff" />
                    <Text style={styles.modalBtnTextSave}>Add All to Cart</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubtitle}>
                    {notificationCount} {notificationCount === 1 ? 'notification' : 'notifications'}
                  </Text>
                </View>
                <View style={styles.modalHeaderActions}>
                  {notifications.length > 0 && (
                    <TouchableOpacity
                      onPress={clearAllNotifications}
                      style={styles.clearAllBtn}
                    >
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setNotificationsModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <View style={styles.emptyNotifications}>
                    <Ionicons name="notifications-none" size={56} color="#bdbdbd" />
                    <Text style={styles.emptyNotificationsTitle}>No Notifications</Text>
                    <Text style={styles.emptyNotificationsText}>
                      You're all caught up! Check back here for order updates and special offers.
                    </Text>
                  </View>
                ) : (
                  notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[styles.notificationItem, { backgroundColor: notification.bgColor }]}
                      onPress={() => handleNotificationPress(notification)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notificationIcon, { backgroundColor: notification.color }]}>
                        <Ionicons name={notification.icon} size={20} color="#fff" />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatNotificationTime(notification.timestamp)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setNotificationsModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default CustomerDashboard

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: 64,
    paddingHorizontal: 20,
  },

  header: {
    marginTop: 0,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  location: {
    fontSize: 12,
    color: '#666',
  },

  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: PRIMARY,
    marginTop: 6,
  },

  headerIcons: {
    flexDirection: 'row',
  },

  iconBtn: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    marginLeft: 12,
    elevation: 6,
    position: 'relative',
  },

  iconBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#c62828',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },

  iconBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  productImageContainer: {
    position: 'relative',
  },

  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  gridImageContainer: {
    position: 'relative',
  },

  gridFavoriteBtn: {
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

  searchWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    elevation: 4,
  },

  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },

  categoryScroll: {
    marginTop: 20,
    paddingBottom: 10,
  },

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 12,
    elevation: 4,
  },

  categoryText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
    color: PRIMARY,
  },

  banner: {
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
  },

  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  bannerSubtitle: {
    color: '#e8f5e9',
    marginTop: 6,
    fontSize: 13,
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '800',
    color: PRIMARY,
  },

  productCard: {
    width: 260,
    backgroundColor: '#fff',
    borderRadius: 18,
    marginRight: 18,
    elevation: 5,
    overflow: 'hidden',
  },

  productImage: {
    width: '100%',
    height: 160,
  },

  productContent: {
    padding: 16,
  },

  productTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: PRIMARY,
  },

  productSeller: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
  },

  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  rating: {
    fontSize: 13,
  },

  price: {
    fontWeight: '900',
    color: SECONDARY,
    fontSize: 16,
  },

  addBtn: {
    marginTop: 12,
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  addText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  gridCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    overflow: 'hidden',
  },

  gridImage: {
    width: '100%',
    height: 120,
  },

  gridContent: {
    padding: 12,
  },

  gridTitle: {
    fontWeight: '800',
    fontSize: 14,
    color: PRIMARY,
  },

  gridPrice: {
    marginTop: 6,
    fontWeight: '900',
    color: SECONDARY,
    fontSize: 15,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalOverlay: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: 'transparent',
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b4332',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  clearAllText: {
    fontSize: 13,
    color: '#c62828',
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: 400,
  },
  emptyFavorites: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyFavoritesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
    marginTop: 16,
  },
  emptyFavoritesText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyNotificationsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
    marginTop: 16,
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  favoriteItemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  favoriteItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  favoriteItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b4332',
  },
  favoriteItemPrice: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '700',
    marginTop: 4,
  },
  removeFavoriteBtn: {
    padding: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: '#9e9e9e',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  modalSave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2e7d32',
    flex: 1,
    padding: 16,
    borderRadius: 14,
    gap: 8,
    elevation: 4,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnTextSave: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
})