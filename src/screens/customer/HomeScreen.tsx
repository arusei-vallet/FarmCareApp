import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useCart, Product } from './CartContext'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'
const LIGHT_BG = '#F4F7F5'

type FilterType = 'None' | 'Most Purchased' | 'Latest'

type RootStackParamList = {
  Home: undefined
  Categories: { category: string }
  Cart: undefined
  ProductDetail: { product: Product }
}

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>()
  const { addItem } = useCart()

  const [showAll, setShowAll] = useState<boolean>(false)
  const [favorites, setFavorites] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<boolean>(false)
  const [filterActive, setFilterActive] = useState<boolean>(false)
  const [filterType, setFilterType] = useState<FilterType>('None')
  const [addedToCart, setAddedToCart] = useState<{ [key: string]: boolean }>({}) // Track added items for UI

  const allCategories: string[] = [
    'Grains','Vegetables','Fruits','Legumes','Spices','Herbs','Tubers',
    'Seeds','Nuts','Organic Produce','Dairy','Poultry','Seafood'
  ]

  const baseProducts: Product[] = [
    { name:'Tomatoes', price:'KES 120/kg', mostPurchased:true, latest:false },
    { name:'Onions', price:'KES 100/kg', mostPurchased:true, latest:true },
    { name:'Cabbage', price:'KES 80', mostPurchased:false, latest:true },
    { name:'Maize', price:'KES 60/kg', mostPurchased:false, latest:true },
  ]

  const filteredProducts: Product[] = baseProducts.filter(p => {
    if(filterType === 'Most Purchased') return p.mostPurchased
    if(filterType === 'Latest') return p.latest
    return p.mostPurchased || p.latest
  })

  // Featured items to scroll endlessly
  const featuredItems = [1,2,3]
  const endlessFeaturedItems = Array.from({ length: 30 }, (_, i) => featuredItems[i % featuredItems.length])

  // Names pool for Popular Near You
  const productNamesPool = [
    'Green Grams','Lemon','Avocado','Mangoes','Sorghum','Wheat','Kales','Yams',
    'Arrowroots','Coriander','Herbs','Sardines','Chicken','Eggs','Beef','Milk',
    'Simsim','Coconut','Maize','Cabbage','Millet','Beans','Carrots','Tumeric',
    'Banana','Green Chili','Spinach','Rice','Barley',
    'Cucumber','Tomatoes','Potatoes','Oranges','Broccoli','Watermelon','Peanuts','Lentils','Peas'
  ]

  // Generate unique products for endless vertical scroll
  const endlessPopularItems: Product[] = Array.from({ length: 50 }, (_, i) => {
    const name = productNamesPool[i % productNamesPool.length]
    const basePrice = 50 + (i % 20) * 10
    return {
      name: name, 
      price: `KES ${basePrice}/kg`,
      mostPurchased: Math.random() < 0.5,
      latest: Math.random() < 0.5
    }
  })

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    addItem(product) // <-- update shared cart
    setAddedToCart(prev => ({ ...prev, [product.name]: true })) // Mark as added in UI
  }

  return (
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
            onPress={() => setFavorites(!favorites)}
          >
            <Icon 
              name={favorites ? "heart" : "heart-outline"} 
              size={20} 
              color={favorites ? ACCENT : "#fff"} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconCircle} 
            onPress={() => setNotifications(!notifications)}
          >
            <Icon 
              name={notifications ? "notifications" : "notifications-outline"} 
              size={20} 
              color={notifications ? ACCENT : "#fff"} 
            />
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
            />
          </View>

          <TouchableOpacity 
            style={[styles.filterBtn, filterActive && {backgroundColor:PRIMARY}]} 
            onPress={() => setFilterActive(!filterActive)}
          >
            <Icon 
              name="options-outline" 
              size={22} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>

        {/* FILTER OPTIONS */}
        {filterActive && (
          <View style={styles.filterOptions}>
            <TouchableOpacity onPress={() => { setFilterType('Most Purchased'); setFilterActive(false) }}>
              <Text style={styles.filterText}>Most Purchased</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setFilterType('Latest'); setFilterActive(false) }}>
              <Text style={styles.filterText}>Latest in Market</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setFilterType('None'); setFilterActive(false) }}>
              <Text style={styles.filterText}>Most Purchased & Latest</Text>
            </TouchableOpacity>
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
          {(showAll ? allCategories : allCategories.slice(0,5)).map((cat, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.category}
              onPress={() => navigation.navigate('Categories', { category: cat })}
            >
              <Text style={styles.categoryText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FEATURED */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Produce</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {endlessFeaturedItems.map((item,index)=>( 
            <View key={index} style={styles.featuredCard}>
              <View style={styles.featuredImage}/>
              <View style={styles.featuredOverlay}>
                <Text style={styles.featuredTitle}>Fresh Harvest</Text>
                <Text style={styles.featuredSubtitle}>Up to 20% off</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* POPULAR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Near You</Text>
        </View>

        <View style={styles.grid}>
          {endlessPopularItems.map((item,index)=>(
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
              activeOpacity={0.7}
            >
              <View style={styles.cardImg} />
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.price}>{item.price}</Text>
              <TouchableOpacity
                style={[styles.cartBtn, addedToCart[item.name] && {backgroundColor: ACCENT}]}
                onPress={(e) => {
                  e.stopPropagation()
                  handleAddToCart(item)
                }}
                disabled={addedToCart[item.name]}
              >
                <Icon
                  name={addedToCart[item.name] ? "checkmark" : "cart-outline"}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.cartText}> {addedToCart[item.name] ? 'Added' : 'Add'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:LIGHT_BG },
  header:{ backgroundColor:PRIMARY, padding:20, paddingTop:50, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomLeftRadius:25, borderBottomRightRadius:25 },
  greeting:{ color:'#C8E6C9', fontSize:14 },
  customerName:{ color:'#fff', fontSize:22, fontWeight:'bold' },
  headerIcons:{ flexDirection:'row', gap:10 },
  iconCircle:{ backgroundColor:'rgba(255,255,255,0.2)', padding:8, borderRadius:20, marginLeft:10 },
  searchRow:{ flexDirection:'row', paddingHorizontal:16, marginTop:20, marginBottom:10 },
  searchBox:{ flex:1, flexDirection:'row', backgroundColor:'#fff', padding:12, borderRadius:15, alignItems:'center', elevation:3 },
  searchInput:{ marginLeft:10, flex:1 },
  filterBtn:{ backgroundColor:ACCENT, padding:14, borderRadius:15, marginLeft:10, justifyContent:'center', alignItems:'center', elevation:3 },
  filterOptions:{ backgroundColor:'#E8F5E9', marginHorizontal:16, padding:10, borderRadius:10, marginBottom:10 },
  filterText:{ fontSize:16, color:PRIMARY, marginVertical:5 },
  sectionHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, marginTop:20, marginBottom:10 },
  sectionTitle:{ fontSize:18, fontWeight:'bold', color:'#333' },
  seeAll:{ color:ACCENT, fontWeight:'600' },
  category:{ backgroundColor:'#E8F5E9', paddingVertical:8, paddingHorizontal:18, borderRadius:20, marginLeft:16, marginBottom:5 },
  categoryText:{ color:PRIMARY, fontWeight:'600' },
  featuredCard:{ marginLeft:16, borderRadius:20, overflow:'hidden' },
  featuredImage:{ width:250, height:150, backgroundColor:'#A5D6A7' },
  featuredOverlay:{ position:'absolute', bottom:15, left:15 },
  featuredTitle:{ color:'#fff', fontSize:16, fontWeight:'bold' },
  featuredSubtitle:{ color:'#fff' },
  grid:{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', paddingHorizontal:16, marginTop:10 },
  card:{ backgroundColor:'#fff', width:'48%', borderRadius:20, padding:12, marginBottom:15, elevation:4 },
  cardImg:{ width:'100%', height:100, borderRadius:15, backgroundColor:'#E8F5E9', marginBottom:10 },
  cardTitle:{ fontWeight:'bold', fontSize:14 },
  price:{ color:ACCENT, fontWeight:'600', marginVertical:5 },
  cartBtn:{ flexDirection:'row', backgroundColor:PRIMARY, padding:8, borderRadius:10, justifyContent:'center', alignItems:'center', marginTop:5 },
  cartText:{ color:'#fff', fontWeight:'600' }
})