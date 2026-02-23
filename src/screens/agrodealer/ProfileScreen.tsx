import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Agro Dealer Profile</Text>
    </View>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold', color: '#2196F3' }
})