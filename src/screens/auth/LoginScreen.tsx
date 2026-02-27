// src/screens/auth/LoginScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { validateEmail, sanitizeInput } from '../../utils/validation';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleEmailFocus = () => {
    setEmailFocused(true);
    Animated.timing(emailBorderAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
    Animated.timing(emailBorderAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const handlePasswordFocus = () => {
    setPasswordFocused(true);
    Animated.timing(passwordBorderAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
    Animated.timing(passwordBorderAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const emailBorderColor = emailBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e0e0e0', '#2e7d32'],
  });

  const passwordBorderColor = passwordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e0e0e0', '#2e7d32'],
  });

  const handleLogin = async () => {
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      Alert.alert('Validation Error', emailValidation.error!);
      return;
    }

    if (!password) {
      Alert.alert('Validation Error', 'Please enter your password');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Handle specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address before logging in.';
        }
        Alert.alert('Login Failed', errorMessage);
        return;
      }

      const user = data.user;

      if (user) {
        // Fetch user role from public.users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userError || !userData?.role) {
          console.warn('Role fetch issue:', userError?.message);
          Alert.alert(
            'Account Access',
            'Login successful, but we could not load your profile role. Using default dashboard.'
          );
          navigation.replace('CustomerTabs');
          return;
        }

        const role = userData.role as 'customer' | 'farmer' | 'agrodealer' | string;

        // Professional role-based navigation with replace (no back to login)
        if (role === 'customer') {
          navigation.replace('CustomerTabs');
        } else if (role === 'farmer') {
          navigation.replace('FarmerTabs');
        } else if (role === 'agrodealer') {
          navigation.replace('AgroTabs');
        } else {
          Alert.alert(
            'Role Not Recognized',
            `Your account role (${role}) is not supported. Please contact support.`
          );
          navigation.replace('CustomerTabs'); // safe fallback
        }

        console.log(`Login successful — ${role} → dashboard`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Provide more helpful error messages
      let errorMessage = 'Unable to connect. Please check your internet and try again.';
      if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      Alert.alert('Connection Issue', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#e6f5e6', '#c8e6c9', '#a5d6a7']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your journey with Farm Care 🌱
            </Text>

            {/* EMAIL INPUT */}
            <Animated.View style={[styles.inputWrapper, { borderColor: emailBorderColor }]}>
              <Ionicons name="mail-outline" size={22} color="#2e7d32" style={styles.icon} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#9e9e9e"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                onFocus={handleEmailFocus}
                onBlur={handleEmailBlur}
              />
            </Animated.View>

            {/* PASSWORD INPUT */}
            <Animated.View style={[styles.inputWrapper, { borderColor: passwordBorderColor }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#2e7d32" style={styles.icon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9e9e9e"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#2e7d32"
                />
              </TouchableOpacity>
            </Animated.View>

            {/* LOGIN BUTTON – enhanced with shadow */}
            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
                { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* REGISTER LINK */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('RegisterScreen')}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}> Create one</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1b5e20',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4caf50',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 58,
    borderWidth: 1.5,
  },
  icon: {
    marginRight: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#1b5e20',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.3,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: '#4b5563',
  },
  registerLink: {
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '700',
  },
});