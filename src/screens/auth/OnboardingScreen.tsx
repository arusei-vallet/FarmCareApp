// src/screens/auth/OnboardingScreen.tsx

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'

const { width } = Dimensions.get('window')

const OnboardingScreen = () => {
  const navigation = useNavigation<any>()

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
      <View style={styles.placeholderCircle}>
        <Text style={styles.emoji}>🌱</Text>
      </View>

      <Text style={styles.title}>Connect with Farmers</Text>
      <Text style={styles.description}>
        Grow your network and buy directly from trusted farmers.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </LinearGradient>
  )
}

export default OnboardingScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  placeholderCircle: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1b5e20',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2ECC71',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 40,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
})