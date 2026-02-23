// src/navigation/RootNavigation.tsx

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Supabase
import { supabase } from '../services/supabase';

// Screens
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import InventoryScreen from '../screens/farmer/InventoryScreen';
import AnalyticsScreen from '../screens/farmer/AnalyticsScreen';

// Navigation Stacks
import CustomerTabs from './CustomerTabs';
import FarmerTabs from './FarmerTabs';
import AgroTabs from './AgroTabs';

const Stack = createNativeStackNavigator();

const RootNavigation = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.log('Error fetching user role:', error.message);
        return null;
      }

      return data?.role || null;
    } catch (err) {
      console.log('Unexpected error fetching user role:', err);
      return null;
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate splash delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;

        if (user) {
          const role = await fetchUserRole(user.id);
          setUserRole(role);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.log('Initialization error:', err);
        setIsLoggedIn(false);
      } finally {
        setIsAppReady(true);
      }
    };

    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user;
        if (user) {
          const role = await fetchUserRole(user.id);
          setUserRole(role);
          setIsLoggedIn(true);
        } else {
          setUserRole(null);
          setIsLoggedIn(false);
        }
      }
    );

    return () => authListener?.subscription?.unsubscribe();
  }, []);

  if (!isAppReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Splash always first */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Auth screens - always available for navigation */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="InventoryScreen" component={InventoryScreen} />
<Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />

        {/* Role-based tabs - always registered so navigation targets exist */}
        <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        <Stack.Screen name="FarmerTabs" component={FarmerTabs} />
        <Stack.Screen name="AgroTabs" component={AgroTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});