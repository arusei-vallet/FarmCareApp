// src/screens/auth/SplashScreen.tsx

import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'

const { width, height } = Dimensions.get('window')

const SplashScreen = () => {
  const navigation = useNavigation<any>()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const titleAnim = useRef(new Animated.Value(0)).current
  const subtitleAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const circle1Scale = useRef(new Animated.Value(0.4)).current
  const circle2Scale = useRef(new Animated.Value(0.6)).current
  const circle3Scale = useRef(new Animated.Value(0.8)).current
  const circle1Opacity = useRef(new Animated.Value(0.9)).current
  const circle2Opacity = useRef(new Animated.Value(0.6)).current
  const circle3Opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    // Fade in background
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: true,
    }).start()

    // Scale animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start()

    // Continuous rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start()

    const createCircleAnimation = (
      scaleRef: Animated.Value,
      opacityRef: Animated.Value
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleRef, {
              toValue: 1.15,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityRef, {
              toValue: 0.3,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleRef, {
              toValue: 0.7,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityRef, {
              toValue: 0.9,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ])
      )
    }

    const anim1 = createCircleAnimation(circle1Scale, circle1Opacity)
    const anim2 = createCircleAnimation(circle2Scale, circle2Opacity)
    const anim3 = createCircleAnimation(circle3Scale, circle3Opacity)

    anim1.start()
    setTimeout(() => anim2.start(), 400)
    setTimeout(() => anim3.start(), 800)

    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start()

    // ✅ Navigate after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Onboarding')
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.background}>
        <View style={styles.gradientOverlay} />
        <View style={styles.gradientAccent} />

        <Animated.View
          style={[
            styles.circlesContainer,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          <Animated.View
            style={[
              styles.circle,
              styles.circle3,
              { transform: [{ scale: circle3Scale }], opacity: circle3Opacity },
            ]}
          />

          <Animated.View
            style={[
              styles.circle,
              styles.circle2,
              { transform: [{ scale: circle2Scale }], opacity: circle2Opacity },
            ]}
          />

          <Animated.View
            style={[
              styles.circle,
              styles.circle1,
              { transform: [{ scale: circle1Scale }], opacity: circle1Opacity },
            ]}
          />

          <View style={styles.coreCircle} />
        </Animated.View>

        <View style={styles.textContainer}>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            FarmCare
          </Animated.Text>

          <Animated.Text
            style={[
              styles.subtitle,
              {
                opacity: subtitleAnim,
                transform: [
                  {
                    translateY: subtitleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Grow with confidence
          </Animated.Text>
        </View>
      </View>
    </Animated.View>
  )
}

export default SplashScreen

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fafbfc',
  },
  gradientAccent: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76, 175, 80, 0.03)',
  },
  circlesContainer: {
    position: 'relative',
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 160,
  },
  circle1: {
    width: 140,
    height: 140,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  circle2: {
    width: 200,
    height: 200,
    borderWidth: 2.5,
    borderColor: '#66BB6A',
  },
  circle3: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: '#A5D6A7',
  },
  coreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    boxShadow: '0px 8px 20px rgba(46,125,50,0.35)', // ✅ fixed shadow deprecation
    elevation: 15,
  },
  textContainer: {
    position: 'absolute',
    bottom: '15%',
    alignItems: 'center',
    paddingHorizontal: 30,
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#558B2F',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
})