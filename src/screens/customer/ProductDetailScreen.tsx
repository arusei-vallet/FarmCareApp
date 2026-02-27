import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCart, Product } from './CartContext'

const { width } = Dimensions.get('window')

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

type RootStackParamList = {
  ProductDetail: { product: Product }
}

type ProductDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>
type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>

interface ProductDetail extends Product {
  id?: string
  description?: string
  rating?: number
  reviews?: number
  stock?: number
  images?: string[]
  seller?: string
  category?: string
}

const ProductDetailScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<ProductDetailScreenRouteProp>()
  const { addItem } = useCart()

  const product = route.params?.product as ProductDetail | undefined
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text>Product not found</Text>
      </View>
    )
  }

  const images = product.images || [
    'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=800&q=60',
    'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800&q=60',
    'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=800&q=60',
  ]

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        name: product.name,
        price: product.price,
        mostPurchased: product.mostPurchased,
      })
    }
    Alert.alert(
      'Added to Cart',
      `${quantity} x ${product.name} has been added to your cart`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => navigation.goBack() },
      ]
    )
  }

  const incrementQuantity = () => setQuantity(prev => prev + 1)
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(prev => prev - 1)
  }

  const totalPrice = (parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0) * quantity

  return (
    <LinearGradient colors={['#e6f5e6', '#c8e6c9', '#a5d6a7']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="share-outline" size={24} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="heart-outline" size={24} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: images[selectedImage] }} style={styles.mainImage} />

          {images.length > 1 && (
            <View style={styles.imageThumbnails}>
              {images.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.thumbnail, selectedImage === index && styles.thumbnailActive]}
                  onPress={() => setSelectedImage(index)}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category || 'Fresh Produce'}</Text>
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= (product.rating || 4) ? 'star' : 'star-outline'}
                  size={18}
                  color="#FFC107"
                />
              ))}
            </View>
            <Text style={styles.reviewsText}>
              ({product.reviews || 128} reviews)
            </Text>
            <Text style={styles.soldText}>• 500+ sold</Text>
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.price}>KES {totalPrice.toFixed(2)}</Text>
            <Text style={styles.unitPrice}>{product.price}</Text>
          </View>

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
            <Text style={styles.stockText}>In Stock</Text>
            <Text style={styles.availableText}>
              {product.stock || 100}kg available
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              {product.description ||
                `Fresh ${product.name.toLowerCase()} sourced directly from local farmers. 
                High quality, organic, and perfect for your daily cooking needs. 
                Rich in nutrients and flavor.`}
            </Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={decrementQuantity}
              >
                <Ionicons name="remove" size={24} color={PRIMARY} />
              </TouchableOpacity>

              <View style={styles.quantityDisplay}>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Text style={styles.quantityUnit}>kg</Text>
              </View>

              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={incrementQuantity}
              >
                <Ionicons name="add" size={24} color={PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seller Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sold By</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>
                  {product.seller || 'Green Valley Farm'}
                </Text>
                <View style={styles.sellerRating}>
                  <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
                  <Text style={styles.sellerVerified}>Verified Seller</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.contactBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>KES {totalPrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Ionicons name="cart-outline" size={22} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

export default ProductDetailScreen

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  imageContainer: {
    backgroundColor: '#fff',
    paddingBottom: 16,
  },
  mainImage: {
    width: width,
    height: width,
    backgroundColor: '#E8F5E9',
  },
  imageThumbnails: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  thumbnailActive: {
    borderColor: PRIMARY,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginTop: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
  },
  reviewsText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },
  soldText: {
    fontSize: 14,
    color: '#888',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: PRIMARY,
  },
  unitPrice: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  availableText: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 8,
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  quantityDisplay: {
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  quantityUnit: {
    fontSize: 12,
    color: '#888',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  sellerVerified: {
    fontSize: 12,
    color: PRIMARY,
  },
  contactBtn: {
    padding: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#888',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY,
  },
  addToCartBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
