import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Icon from 'react-native-vector-icons/Ionicons'

// Import screens for agro dealer
import AgroDashboard from '../screens/agrodealer/AgroDashboard'
import OrdersScreen from '../screens/agrodealer/OrdersScreen'
import ProfileScreen from '../screens/agrodealer/ProfileScreen'

const Tab = createBottomTabNavigator()

const AgroTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home'

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home'
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
        tabBarActiveTintColor: '#2196F3', // Blue for agro dealer
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen name="Dashboard" component={AgroDashboard} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

export default AgroTabs