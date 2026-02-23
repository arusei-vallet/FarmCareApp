// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('')

  const handleReset = () => {
    if (!email) {
      Alert.alert('Error', 'Enter your email')
      return
    }
    Alert.alert('Success', 'Password reset functionality will connect to Supabase next')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      <View style={styles.inputContainer}>
        <Icon name="mail-outline" size={20} color="#2ECC71" style={styles.icon} />
        <TextInput placeholder="Enter your email" autoCapitalize="none" value={email} onChangeText={setEmail} style={styles.input} />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
    </View>
  )
}

export default ForgotPasswordScreen

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2ECC71' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 10, marginVertical: 10 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 10 },
  button: { backgroundColor: '#2ECC71', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})
