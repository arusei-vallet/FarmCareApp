import React, { useRef, useEffect } from 'react'
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
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

const PRIMARY = '#1B5E20'
const SECONDARY = '#4CAF50'
const ACCENT = '#FBC02D'
const BG = '#F4F8F2'

const CustomerDashboard: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  const categories = [
    { id: '1', label: 'Vegetables', icon: 'leaf' },
    { id: '2', label: 'Fruits', icon: 'fruit-cherries' },
    { id: '3', label: 'Grains', icon: 'food' },
    { id: '4', label: 'Organic', icon: 'sprout' },
    { id: '5', label: 'Dairy', icon: 'cow' },
  ]

  const products = [
    {
      id: '1',
      title: 'Organic Tomatoes',
      price: 120,
      rating: 4.8,
      seller: 'Green Valley',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce',
    },
    {
      id: '2',
      title: 'Fresh Maize',
      price: 60,
      rating: 4.6,
      seller: 'Farm Fresh Ltd',
      image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc',
    },
    {
      id: '3',
      title: 'Sweet Onions',
      price: 100,
      rating: 4.7,
      seller: 'Local Farmers',
      image: 'https://images.unsplash.com/photo-1582515073490-dc7c0f8a3e9b',
    },
  ]

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.location}>Deliver to 📍 Nairobi</Text>
            <Text style={styles.greeting}>Good Morning, Brian 👋</Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={26} color={PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <MCIcon name="cart-outline" size={26} color={PRIMARY} />
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
              <Image source={{ uri: item.image }} style={styles.productImage} />
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
              <Image source={{ uri: item.image }} style={styles.gridImage} />
              <View style={styles.gridContent}>
                <Text style={styles.gridTitle}>{item.title}</Text>
                <Text style={styles.gridPrice}>KES {item.price}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
})