import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const OrdersScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Agro Dealer Orders</Text>
    </View>
  )
}

export default OrdersScreen

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold', color: '#2196F3' }
})