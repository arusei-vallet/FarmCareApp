// src/navigation/CustomerTabs.tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/Ionicons'

// Import customer screens
import HomeScreen from '../screens/customer/HomeScreen'
import CategoriesScreen from '../screens/customer/CategoriesScreen'
import CartScreen from '../screens/customer/CartScreen'
import OrdersScreen from '../screens/customer/OrdersScreen'
import ProfileScreen from '../screens/customer/ProfileScreen'

const Tab = createBottomTabNavigator()

const CustomerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
              iconName = 'cart'
              break
            case 'Orders':
              iconName = 'receipt'
              break
            case 'Profile':
              iconName = 'person'
              break
          }

          return <Icon name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#2ECC71',
        tabBarInactiveTintColor: '#888',
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