// src/screens/auth/RegisterScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { validateRegistration, sanitizeInput } from '../../utils/validation';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'farmer' | 'agrodealer'>('customer');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const nameBorderAnim = useRef(new Animated.Value(0)).current;
  const phoneBorderAnim = useRef(new Animated.Value(0)).current;
  const emailBorderAnim = useRef(new Animated.Value(0)).current;
  const passwordBorderAnim = useRef(new Animated.Value(0)).current;
  const confirmPasswordBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  const animateBorder = (anim: Animated.Value, toValue: number) => {
    Animated.timing(anim, {
      toValue,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const handleFieldFocus = (field: string, anim: Animated.Value) => {
    animateBorder(anim, 1);
  };

  const handleFieldBlur = (anim: Animated.Value) => {
    animateBorder(anim, 0);
  };

  const getBorderColor = (anim: Animated.Value) => {
    return anim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#e0e0e0', '#2e7d32'],
    });
  };

  const handleRegister = async () => {
    // Validate all fields
    const errors = validateRegistration({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    });

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Alert.alert('Validation Error', firstError as string);
      return;
    }

    try {
      setLoading(true);

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { 
            full_name: sanitizeInput(name),
            phone: sanitizeInput(phone),
            role 
          },
        },
      });

      if (authError) {
        Alert.alert('Registration Error', authError.message);
        return;
      }

      const user = authData.user;
      if (!user?.id) {
        Alert.alert('Error', 'Failed to create account – no user ID received');
        return;
      }

      // 2. Insert profile into public.users table
      const { error: profileError } = await supabase.from('users').insert({
        id: user.id,
        full_name: sanitizeInput(name),
        phone: sanitizeInput(phone),
        role,
        email: email.trim().toLowerCase(),
      });

      if (profileError) {
        console.error('Profile insert failed:', profileError);
        Alert.alert('Partial Success', 'Account created, but profile save failed. Please contact support.');
      }

      Alert.alert('Success', 'Account created! Welcome to Farm Care 🌱');

      // 3. Navigate to role-based dashboard using replace (clears back stack)
      if (role === 'customer') {
        navigation.replace('CustomerTabs');
      } else if (role === 'farmer') {
        navigation.replace('FarmerTabs');
      } else if (role === 'agrodealer') {
        navigation.replace('AgroTabs');
      } else {
        navigation.replace('CustomerTabs');
      }

      console.log(`Registered as ${role} → replaced to dashboard`);

    } catch (err) {
      console.error('Registration unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#e6f5e6', '#c8e6c9', '#a5d6a7']} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Farm Care and grow with confidence 🌱</Text>

            {/* FULL NAME */}
            <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(nameBorderAnim) }]}>
              <Ionicons name="person-outline" size={22} color="#2e7d32" style={styles.icon} />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#9e9e9e"
                style={styles.input}
                value={name}
                onChangeText={setName}
                onFocus={() => handleFieldFocus('name', nameBorderAnim)}
                onBlur={() => handleFieldBlur(nameBorderAnim)}
              />
            </Animated.View>

            {/* PHONE */}
            <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(phoneBorderAnim) }]}>
              <Ionicons name="call-outline" size={22} color="#2e7d32" style={styles.icon} />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#9e9e9e"
                keyboardType="phone-pad"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                onFocus={() => handleFieldFocus('phone', phoneBorderAnim)}
                onBlur={() => handleFieldBlur(phoneBorderAnim)}
              />
            </Animated.View>

            {/* EMAIL */}
            <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(emailBorderAnim) }]}>
              <Ionicons name="mail-outline" size={22} color="#2e7d32" style={styles.icon} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#9e9e9e"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                onFocus={() => handleFieldFocus('email', emailBorderAnim)}
                onBlur={() => handleFieldBlur(emailBorderAnim)}
              />
            </Animated.View>

            {/* PASSWORD */}
            <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(passwordBorderAnim) }]}>
              <Ionicons name="lock-closed-outline" size={22} color="#2e7d32" style={styles.icon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#9e9e9e"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                onFocus={() => handleFieldFocus('password', passwordBorderAnim)}
                onBlur={() => handleFieldBlur(passwordBorderAnim)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#2e7d32" />
              </TouchableOpacity>
            </Animated.View>

            {/* CONFIRM PASSWORD */}
            <Animated.View style={[styles.inputWrapper, { borderColor: getBorderColor(confirmPasswordBorderAnim) }]}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#2e7d32" style={styles.icon} />
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor="#9e9e9e"
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => handleFieldFocus('confirmPassword', confirmPasswordBorderAnim)}
                onBlur={() => handleFieldBlur(confirmPasswordBorderAnim)}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#2e7d32" />
              </TouchableOpacity>
            </Animated.View>

            {/* ROLE SELECTOR */}
            <View style={styles.roleContainer}>
              {(['customer', 'farmer', 'agrodealer'] as const).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.roleButton, role === item && styles.roleSelected]}
                  onPress={() => setRole(item)}
                >
                  <Text style={[styles.roleText, role === item && { color: '#fff' }]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* REGISTER BUTTON */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
            </TouchableOpacity>

            {/* LOGIN LINK */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Already have an account? Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default RegisterScreen;

// styles remain unchanged
const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#1b5e20' },
  subtitle: { textAlign: 'center', color: '#4caf50', marginBottom: 25, marginTop: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6f4',
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 56,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 15 },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 30,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
  },
  roleSelected: { backgroundColor: '#2e7d32' },
  roleText: { fontWeight: '600', color: '#2e7d32' },
  button: {
    backgroundColor: '#1b5e20',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loginLink: { textAlign: 'center', marginTop: 18, color: '#2e7d32', fontWeight: '600' },
});