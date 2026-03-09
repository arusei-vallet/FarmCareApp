// src/navigation/RootNavigation.tsx

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Supabase
import { supabase } from '../services/supabase';

// Screens
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Tab Navigators
import CustomerTabs from './CustomerTabs';
import FarmerTabs from './FarmerTabs';

// ────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  RegisterScreen: undefined;
  ForgotPassword: undefined;
  CustomerTabs: undefined;
  FarmerTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigation = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Login' | 'CustomerTabs' | 'FarmerTabs'>('Onboarding');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // User is logged in → fetch role and decide dashboard
          const { data: profile, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!error && profile?.role) {
            const role = profile.role;
            if (role === 'customer') {
              setInitialRoute('CustomerTabs');
            } else if (role === 'farmer') {
              setInitialRoute('FarmerTabs');
            } else {
              setInitialRoute('Login'); // fallback
            }
          } else {
            setInitialRoute('Login');
          }
        } else {
          setInitialRoute('Login');
        }
      } catch (err) {
        console.error('Init error:', err);
        setInitialRoute('Login');
      } finally {
        setIsAppReady(true);
      }
    };

    initializeApp();

    // Listen for auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const role = profile?.role;

        if (role === 'customer') {
          // You can use navigation ref or dispatch here if needed
          // For simplicity, we can reload or handle in screens
        } else if (role === 'farmer') {
          //
        }
      } else {
        // Logged out → go back to Login (you can use navigation ref)
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
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
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        <Stack.Screen
          name="CustomerTabs"
          component={CustomerTabs}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="FarmerTabs"
          component={FarmerTabs}
          options={{ gestureEnabled: false }}
        />
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