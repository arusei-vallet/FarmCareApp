import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const CartScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Customer Cart Screen</Text>
    </View>
  )
}

export default CartScreen

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
})
