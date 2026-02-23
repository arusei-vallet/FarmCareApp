import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

const HomeScreen = () => {
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.customerName}>Customer</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Icon name="heart-outline" size={24} color="#2ECC71" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Icon name="notifications-outline" size={24} color="#2ECC71" style={{ marginLeft: 15 }} />
          </TouchableOpacity>

          <TouchableOpacity>
            <Icon name="menu-outline" size={26} color="#2ECC71" style={{ marginLeft: 15 }} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* SEARCH + FILTER */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={20} color="#888" />
            <TextInput
              placeholder="Search produce..."
              placeholderTextColor="#888"
              style={styles.searchInput}
            />
          </View>

          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="options-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* CATEGORIES */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Grains','Vegetables','Fruits','Legumes','Spices'].map((cat, index) => (
            <View key={index} style={styles.category}>
              <Text style={styles.categoryText}>{cat}</Text>
            </View>
          ))}
        </ScrollView>

        {/* FEATURED */}
        <Text style={styles.sectionTitle}>Featured Produce</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Placeholder blocks instead of images */}
          <View style={[styles.featuredImg, { backgroundColor: '#c8e6c9' }]} />
          <View style={[styles.featuredImg, { backgroundColor: '#a5d6a7' }]} />
          <View style={[styles.featuredImg, { backgroundColor: '#81c784' }]} />
        </ScrollView>

        {/* POPULAR */}
        <Text style={styles.sectionTitle}>Popular Near You</Text>

        <View style={styles.grid}>
          {[
            {name:'Tomatoes', price:'KES 120/kg'},
            {name:'Onions', price:'KES 100/kg'},
            {name:'Cabbage', price:'KES 80'},
            {name:'Maize', price:'KES 60/kg'},
          ].map((item,index)=>(
            <View key={index} style={styles.card}>
              {/* Placeholder block instead of image */}
              <View style={[styles.cardImg, { backgroundColor: '#e8f5e9' }]} />
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.price}>{item.price}</Text>

              <TouchableOpacity style={styles.cartBtn}>
                <Text style={{color:'#fff'}}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#F4F6F6', padding:16 },

  header:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    marginBottom:15
  },
  customerName:{
    fontSize:22,
    fontWeight:'bold',
    color:'#2ECC71'
  },
  headerIcons:{ flexDirection:'row' },

  searchRow:{
    flexDirection:'row',
    alignItems:'center',
    marginBottom:15
  },
  searchBox:{
    flex:1,
    flexDirection:'row',
    backgroundColor:'#fff',
    padding:10,
    borderRadius:10,
    alignItems:'center'
  },
  searchInput:{ marginLeft:10, flex:1 },

  filterBtn:{
    backgroundColor:'#2ECC71',
    padding:12,
    borderRadius:10,
    marginLeft:10,
    justifyContent:'center',
    alignItems:'center'
  },

  category:{
    backgroundColor:'#2ECC71',
    paddingVertical:8,
    paddingHorizontal:18,
    borderRadius:20,
    marginRight:10
  },
  categoryText:{ color:'#fff', fontWeight:'bold' },

  sectionTitle:{
    fontSize:18,
    fontWeight:'bold',
    marginVertical:15
  },

  featuredImg:{
    width:220,
    height:140,
    borderRadius:15,
    marginRight:12
  },

  grid:{
    flexDirection:'row',
    flexWrap:'wrap',
    justifyContent:'space-between'
  },
  card:{
    backgroundColor:'#fff',
    width:'48%',
    borderRadius:12,
    padding:10,
    marginBottom:15,
    elevation:2
  },
  cardImg:{
    width:'100%',
    height:100,
    borderRadius:10
  },
  cardTitle:{ fontWeight:'bold', marginTop:5 },
  price:{ color:'#2ECC71', marginVertical:4 },

  cartBtn:{
    backgroundColor:'#27AE60',
    padding:8,
    borderRadius:8,
    alignItems:'center',
    marginTop:5
  }
})