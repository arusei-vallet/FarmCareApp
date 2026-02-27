// App.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from './src/services/supabase';

// Error Boundary
import ErrorBoundary from './src/components/ErrorBoundary';

// Loading
import { LoadingScreen } from './src/components/LoadingOverlay';

// Customer Tabs
import CustomerTabs from './src/navigation/CustomerTabs';

// Customer Screens
import ProductDetailScreen from './src/screens/customer/ProductDetailScreen';
import CheckoutScreen from './src/screens/customer/CheckoutScreen';

// Farmer Tabs
import FarmerTabs from './src/navigation/FarmerTabs';

// Agrodealer Tabs
import AgroTabs from './src/navigation/AgroTabs';

// Auth Screens
import SplashScreen from './src/screens/auth/SplashScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Cart context
import { CartProvider } from './src/screens/customer/CartContext';

const Stack = createNativeStackNavigator();

const PRIMARY = '#1B5E20';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Splash');

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Small splash delay
        await new Promise(resolve => setTimeout(resolve, 1500));

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
          } else if (role === 'agrodealer') {
            setInitialRoute('AgroTabs');
          } else {
            setInitialRoute('Login');
          }
        } else {
          setInitialRoute('Onboarding');
        }
      } catch (e) {
        console.warn('App init error:', e);
        setInitialRoute('Onboarding');
      } finally {
        setIsReady(true);
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

  if (!isReady) {
    return <LoadingScreen message="Initializing app..." />;
  }

  return (
    <ErrorBoundary>
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
          <Stack.Screen name="Splash" component={SplashScreen} />
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
            name="AgroTabs"
            component={AgroTabs}
            options={{ gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  </ErrorBoundary>
  );
}