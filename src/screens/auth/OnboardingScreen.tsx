// src/screens/auth/OnboardingScreen.tsx

import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import Swiper from 'react-native-swiper'
import { useNavigation } from '@react-navigation/native'

const { width } = Dimensions.get('window')

const slides = [
  {
    title: 'Fresh Farm Produce',
    description:
      'Get fresh fruits, vegetables, grains, and legumes from local farmers.',
  },
  {
    title: 'Easy Ordering',
    description:
      'Order your farm produce easily and get delivery at your doorstep.',
  },
  {
    title: 'Connect with Farmers',
    description:
      'Grow your network and buy directly from trusted farmers.',
  },
]

const OnboardingScreen = () => {
  const navigation = useNavigation<any>() // Relaxed type for navigation

  return (
    <Swiper
      loop={false}
      showsPagination
      activeDotColor="#2ECC71"
      dotColor="#ccc"
    >
      {slides.map((slide, index) => (
        <View key={index} style={styles.slide}>
          {/* Placeholder Icon Circle */}
          <View style={styles.placeholderCircle}>
            <Text style={styles.emoji}>🌱</Text>
          </View>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>

          {/* Show Get Started button only on the last slide */}
          {index === slides.length - 1 && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.replace('Login')} // Updated navigation
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </Swiper>
  )
}

export default OnboardingScreen

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#ffffff',
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