import React, { useRef, useEffect } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StyleSheet, Animated, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'

// Farmer Screens (UNCHANGED)
import DashboardScreen from '../screens/farmer/DashboardScreen'
import ProductsScreen from '../screens/farmer/ProductsScreen'
import OrdersScreen from '../screens/farmer/OrdersScreen'
import ProfileScreen from '../screens/farmer/ProfileScreen'

const Tab = createBottomTabNavigator()

/* 🔥 Modern Animated Icon */
const TabIcon = ({ focused, activeIcon, inactiveIcon, type }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.15 : 1,
      friction: 4,
      useNativeDriver: true,
    }).start()
  }, [focused])

  const IconComponent = type === 'mc' ? MCIcon : Ionicons

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        focused && styles.activeIconContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <IconComponent
        name={focused ? activeIcon : inactiveIcon}
        size={22}
        color={focused ? '#ffffff' : '#8e8e8e'}
      />
    </Animated.View>
  )
}

const FarmerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#1b5e20',
        tabBarInactiveTintColor: '#8e8e8e',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
      }}
    >
      {/* Dashboard */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon="home"
              inactiveIcon="home-outline"
              type="ion"
            />
          ),
        }}
      />

      {/* Products */}
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon="package-variant"
              inactiveIcon="package-variant-closed"
              type="mc"
            />
          ),
        }}
      />

      {/* Orders */}
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon="clipboard-list"
              inactiveIcon="clipboard-list-outline"
              type="mc"
            />
          ),
        }}
      />

      {/* Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              activeIcon="person"
              inactiveIcon="person-outline"
              type="ion"
            />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

export default FarmerTabs

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    height: 80,
    paddingBottom: 12,
    paddingTop: 10,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeIconContainer: {
    backgroundColor: '#2e7d32',
    shadowColor: '#2e7d32',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
})