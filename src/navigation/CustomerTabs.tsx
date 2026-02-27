// src/navigation/CustomerTabs.tsx
import React, { useContext } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/Ionicons'

// Import customer screens
import HomeScreen from '../screens/customer/HomeScreen'
import CategoriesScreen from '../screens/customer/CategoriesScreen'
import CartScreen from '../screens/customer/CartScreen'
import OrdersScreen from '../screens/customer/OrdersScreen'
import ProfileScreen from '../screens/customer/ProfileScreen'

// Import CartContext for badge count
import { CartContext } from '../screens/customer/CartContext'

const Tab = createBottomTabNavigator()

const CartTabIcon = ({ color, size }: { color: string; size: number }) => {
  const context = useContext(CartContext);
  const cartItems = context?.cartItems || [];
  const itemCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

  return (
    <View style={styles.tabIconContainer}>
      <Icon name="cart" size={size} color={color} />
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {itemCount > 99 ? '99+' : itemCount}
          </Text>
        </View>
      )}
    </View>
  )
}

const CustomerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2ECC71',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home'

          switch (route.name) {
            case 'Home':
              iconName = 'home'
              break
            case 'Categories':
              iconName = 'grid'
              break
            case 'Cart':
              // Use custom CartTabIcon with badge
              return <CartTabIcon color={color} size={size} />
            case 'Orders':
              iconName = 'receipt'
              break
            case 'Profile':
              iconName = 'person'
              break
          }

          return <Icon name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default CustomerTabs

const styles = StyleSheet.create({
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D32F2F',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
})