// App.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { supabase } from './src/services/supabase';

// Error Boundary
import ErrorBoundary from './src/components/ErrorBoundary';

// Customer Tabs
import CustomerTabs from './src/navigation/CustomerTabs';

// Customer Screens
import ProductDetailScreen from './src/screens/customer/ProductDetailScreen';
import CheckoutScreen from './src/screens/customer/CheckoutScreen';
import ChatScreen from './src/screens/customer/ChatScreen';

// Farmer Tabs
import FarmerTabs from './src/navigation/FarmerTabs';

// Auth Screens
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Customer Profile & Settings
import PrivacySettingsScreen from './src/screens/customer/PrivacySettingsScreen';
import HelpSupportScreen from './src/screens/customer/HelpSupportScreen';
import CouponsScreen from './src/screens/customer/CouponsScreen';
import DeliveryAddressesScreen from './src/screens/customer/DeliveryAddressesScreen';
import PaymentMethodsScreen from './src/screens/customer/PaymentMethodsScreen';
import TermsOfServiceScreen from './src/screens/customer/TermsOfServiceScreen';
import OrdersScreen from './src/screens/customer/OrdersScreen';

// Cart context
import { CartProvider } from './src/screens/customer/CartContext';

// Product context
import { ProductProvider } from './src/context/ProductContext';

const Stack = createNativeStackNavigator();

const PRIMARY = '#1B5E20';

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Load icon fonts
        await Font.loadAsync({
          'Ionicons': require('react-native-vector-icons/Fonts/Ionicons.ttf'),
          'MaterialCommunityIcons': require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
        });
        setFontsLoaded(true);

        // Check auth session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          const role = profile?.role;

          if (role === 'customer') {
            setInitialRoute('CustomerTabs');
          } else if (role === 'farmer') {
            setInitialRoute('FarmerTabs');
          } else {
            setInitialRoute('Login');
          }
        }
        
        setAppReady(true);
      } catch (e) {
        console.warn('App init error:', e);
        setAppReady(true);
      }
    };

    prepareApp();

    // Listen for logout / session change
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        setInitialRoute('Onboarding');
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // Show loading screen while fonts are loading
  if (!appReady || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading FarmCare...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ProductProvider>
        <CartProvider>
          <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: PRIMARY },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
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
            name="ProductDetail"
            component={ProductDetailScreen}
          />

          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{
              headerShown: true,
              title: 'Checkout',
              headerStyle: { backgroundColor: PRIMARY },
              headerTintColor: '#fff',
            }}
          />

          <Stack.Screen
            name="FarmerTabs"
            component={FarmerTabs}
            options={{ gestureEnabled: false }}
          />

          <Stack.Screen
            name="PrivacySettings"
            component={PrivacySettingsScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="HelpSupport"
            component={HelpSupportScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="TermsOfService"
            component={TermsOfServiceScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Coupons"
            component={CouponsScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="DeliveryAddresses"
            component={DeliveryAddressesScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="PaymentMethods"
            component={PaymentMethodsScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  </ProductProvider>
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f9f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '600',
  },
});