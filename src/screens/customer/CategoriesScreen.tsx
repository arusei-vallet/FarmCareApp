import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCart, Product } from './CartContext'

type RootStackParamList = {
  Categories: { category?: string }
  Home: undefined
}

type CategoriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Categories'>
type CategoriesScreenRouteProp = RouteProp<RootStackParamList, 'Categories'>

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'
const LIGHT_BG = '#F4F7F5'

interface CategoryProduct extends Product {
  id: string
  image: string
  unit: string
  rating: number
  reviews: number
}

const CategoriesScreen = () => {
  const navigation = useNavigation<CategoriesScreenNavigationProp>()
  const route = useRoute<CategoriesScreenRouteProp>()
  const { addItem } = useCart()

  const selectedCategory = route.params?.category || 'All'
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({})

  // Category data with products
  const categoryProducts: { [key: string]: CategoryProduct[] } = {
    'All': [
      { id: '1', name: 'Fresh Tomatoes', price: 'KES 120', unit: '/kg', rating: 4.5, reviews: 128, image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&q=60', mostPurchased: true },
      { id: '2', name: 'Red Onions', price: 'KES 100', unit: '/kg', rating: 4.3, reviews: 95, image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&q=60', mostPurchased: true },
      { id: '3', name: 'Green Cabbage', price: 'KES 80', unit: '/head', rating: 4.2, reviews: 67, image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=60', mostPurchased: false },
      { id: '4', name: 'Maize Flour', price: 'KES 150', unit: '/2kg', rating: 4.7, reviews: 210, image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=60', mostPurchased: true },
      { id: '5', name: 'Fresh Spinach', price: 'KES 50', unit: '/bunch', rating: 4.4, reviews: 82, image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=60', mostPurchased: false },
      { id: '6', name: 'Irish Potatoes', price: 'KES 90', unit: '/kg', rating: 4.6, reviews: 156, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=60', mostPurchased: true },
    ],
    'Grains': [
      { id: 'g1', name: 'Maize Grain', price: 'KES 60', unit: '/kg', rating: 4.5, reviews: 89, image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=60', mostPurchased: true },
      { id: 'g2', name: 'Rice Premium', price: 'KES 180', unit: '/kg', rating: 4.7, reviews: 145, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=60', mostPurchased: true },
      { id: 'g3', name: 'Sorghum', price: 'KES 80', unit: '/kg', rating: 4.3, reviews: 56, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=60', mostPurchased: false },
      { id: 'g4', name: 'Millet', price: 'KES 90', unit: '/kg', rating: 4.4, reviews: 42, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=60', mostPurchased: false },
    ],
    'Vegetables': [
      { id: 'v1', name: 'Fresh Tomatoes', price: 'KES 120', unit: '/kg', rating: 4.5, reviews: 128, image: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=400&q=60', mostPurchased: true },
      { id: 'v2', name: 'Red Onions', price: 'KES 100', unit: '/kg', rating: 4.3, reviews: 95, image: 'https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&q=60', mostPurchased: true },
      { id: 'v3', name: 'Green Cabbage', price: 'KES 80', unit: '/head', rating: 4.2, reviews: 67, image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=60', mostPurchased: false },
      { id: 'v4', name: 'Fresh Spinach', price: 'KES 50', unit: '/bunch', rating: 4.4, reviews: 82, image: 'https://images.unsplash.com/photo-1576045057995-568f82aba655?w=400&q=60', mostPurchased: false },
      { id: 'v5', name: 'Carrots', price: 'KES 70', unit: '/kg', rating: 4.5, reviews: 73, image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=60', mostPurchased: true },
      { id: 'v6', name: 'Broccoli', price: 'KES 150', unit: '/head', rating: 4.6, reviews: 91, image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=60', mostPurchased: false },
    ],
    'Fruits': [
      { id: 'f1', name: 'Fresh Avocado', price: 'KES 50', unit: '/each', rating: 4.8, reviews: 234, image: 'https://images.unsplash.com/photo-1523049673856-38866f8c6c99?w=400&q=60', mostPurchased: true },
      { id: 'f2', name: 'Ripe Mangoes', price: 'KES 80', unit: '/kg', rating: 4.6, reviews: 167, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=60', mostPurchased: true },
      { id: 'f3', name: 'Fresh Oranges', price: 'KES 100', unit: '/kg', rating: 4.5, reviews: 142, image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=60', mostPurchased: false },
      { id: 'f4', name: 'Bananas', price: 'KES 60', unit: '/bunch', rating: 4.4, reviews: 98, image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=60', mostPurchased: true },
      { id: 'f5', name: 'Watermelon', price: 'KES 200', unit: '/each', rating: 4.7, reviews: 189, image: 'https://images.unsplash.com/photo-1563283553-6c14b8a9a7e5?w=400&q=60', mostPurchased: false },
    ],
    'Legumes': [
      { id: 'l1', name: 'Green Grams', price: 'KES 200', unit: '/kg', rating: 4.6, reviews: 87, image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=60', mostPurchased: true },
      { id: 'l2', name: 'Beans Dry', price: 'KES 150', unit: '/kg', rating: 4.4, reviews: 112, image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=60', mostPurchased: true },
      { id: 'l3', name: 'Lentils', price: 'KES 180', unit: '/kg', rating: 4.5, reviews: 76, image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=60', mostPurchased: false },
      { id: 'l4', name: 'Peas Dry', price: 'KES 160', unit: '/kg', rating: 4.3, reviews: 54, image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&q=60', mostPurchased: false },
    ],
    'Tubers': [
      { id: 't1', name: 'Irish Potatoes', price: 'KES 90', unit: '/kg', rating: 4.6, reviews: 156, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=60', mostPurchased: true },
      { id: 't2', name: 'Sweet Potatoes', price: 'KES 60', unit: '/kg', rating: 4.4, reviews: 98, image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&q=60', mostPurchased: true },
      { id: 't3', name: 'Yams', price: 'KES 120', unit: '/kg', rating: 4.3, reviews: 67, image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&q=60', mostPurchased: false },
      { id: 't4', name: 'Cassava', price: 'KES 80', unit: '/kg', rating: 4.2, reviews: 45, image: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=400&q=60', mostPurchased: false },
    ],
    'Dairy': [
      { id: 'd1', name: 'Fresh Milk', price: 'KES 60', unit: '/litre', rating: 4.7, reviews: 234, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=60', mostPurchased: true },
      { id: 'd2', name: 'Yoghurt', price: 'KES 80', unit: '/500ml', rating: 4.5, reviews: 156, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=60', mostPurchased: true },
      { id: 'd3', name: 'Cheese', price: 'KES 350', unit: '/kg', rating: 4.6, reviews: 89, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=60', mostPurchased: false },
      { id: 'd4', name: 'Butter', price: 'KES 200', unit: '/500g', rating: 4.4, reviews: 67, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=60', mostPurchased: false },
    ],
    'Poultry': [
      { id: 'p1', name: 'Fresh Eggs', price: 'KES 20', unit: '/each', rating: 4.8, reviews: 312, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=60', mostPurchased: true },
      { id: 'p2', name: 'Chicken Whole', price: 'KES 800', unit: '/each', rating: 4.6, reviews: 178, image: 'https://images.unsplash.com/photo-1587593810167-a6b240434c17?w=400&q=60', mostPurchased: true },
      { id: 'p3', name: 'Chicken Breast', price: 'KES 450', unit: '/kg', rating: 4.5, reviews: 134, image: 'https://images.unsplash.com/photo-1587593810167-a6b240434c17?w=400&q=60', mostPurchased: false },
    ],
  }

  const allCategories = ['All', 'Grains', 'Vegetables', 'Fruits', 'Legumes', 'Tubers', 'Dairy', 'Poultry', 'Spices', 'Herbs', 'Seeds', 'Nuts']

  const products = categoryProducts[selectedCategory] || categoryProducts['All']

  const handleAddToCart = (product: CategoryProduct) => {
    addItem({ name: product.name, price: `${product.price}${product.unit}`, mostPurchased: product.mostPurchased })
    setAddedToCart(prev => ({ ...prev, [product.id]: true }))
    Alert.alert('Added to Cart', `${product.name} has been added to your cart`)
  }

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= Math.floor(rating) ? 'star' : 'star-outline'}
          size={12}
          color={i <= Math.floor(rating) ? '#FFC107' : '#ccc'}
        />
      )
    }
    return stars
  }

  const renderProduct = ({ item }: { item: CategoryProduct }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.ratingRow}>
          {renderStars(item.rating)}
          <Text style={styles.reviews}>({item.reviews})</Text>
        </View>
        <Text style={styles.price}>{item.price}{item.unit}</Text>
        <TouchableOpacity
          style={[styles.addBtn, addedToCart[item.id] && { backgroundColor: ACCENT }]}
          onPress={() => handleAddToCart(item)}
          disabled={addedToCart[item.id]}
        >
          <Ionicons
            name={addedToCart[item.id] ? 'checkmark' : 'cart-outline'}
            size={18}
            color="#fff"
          />
          <Text style={styles.addBtnText}>
            {addedToCart[item.id] ? 'Added' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <LinearGradient colors={['#e6f5e6', '#c8e6c9', '#a5d6a7']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedCategory}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Category Pills */}
      <FlatList
        data={allCategories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === item && styles.categoryPillActive,
            ]}
            onPress={() => navigation.setParams({ category: item })}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === item && styles.categoryPillTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Products Grid */}
      <FlatList
        data={products}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsGrid}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
      />
    </LinearGradient>
  )
}

export default CategoriesScreen

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  placeholder: { width: 40 },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    marginRight: 10,
  },
  categoryPillActive: {
    backgroundColor: PRIMARY,
  },
  categoryPillText: {
    color: PRIMARY,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryPillTextActive: {
    color: '#fff',
  },
  productsGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    marginRight: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E8F5E9',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviews: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: ACCENT,
    marginBottom: 8,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
})
