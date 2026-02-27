import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCart, CartItem } from './CartContext'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

type RootStackParamList = {
  Checkout: { total: number; items: CartItem[] }
}

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>
type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>

const CheckoutScreen = () => {
  const navigation = useNavigation()
  const route = useRoute<CheckoutScreenRouteProp>()
  const { clearCart } = useCart()

  const { total, items } = route.params || { total: 0, items: [] }
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'cod'>('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [processing, setProcessing] = useState(false)
  const [successModal, setSuccessModal] = useState(false)

  const deliveryFee = total > 1000 ? 0 : 150
  const finalTotal = total + deliveryFee

  const paymentMethods = [
    {
      id: 'mpesa' as const,
      name: 'M-Pesa',
      icon: 'phone-portrait-outline',
      color: '#4CAF50',
      desc: 'Pay with M-Pesa',
    },
    {
      id: 'card' as const,
      name: 'Credit/Debit Card',
      icon: 'card-outline',
      color: '#2196F3',
      desc: 'Visa, Mastercard',
    },
    {
      id: 'cod' as const,
      name: 'Cash on Delivery',
      icon: 'cash-outline',
      color: '#FF9800',
      desc: 'Pay when delivered',
    },
  ]

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'mpesa' && !phoneNumber) {
      Alert.alert('Phone Required', 'Please enter your M-Pesa phone number')
      return
    }

    setProcessing(true)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In a real app, you would:
    // 1. Create order in database
    // 2. Process payment via API
    // 3. Save order details

    setProcessing(false)
    setSuccessModal(true)

    // Clear cart after successful order
    setTimeout(() => {
      clearCart()
    }, 2000)
  }

  const handleSuccessContinue = () => {
    setSuccessModal(false)
    // Go back to parent navigator (CustomerTabs)
    const parentNav = navigation.getParent()
    if (parentNav) {
      parentNav.goBack()
    } else {
      navigation.goBack()
    }
  }

  return (
    <LinearGradient colors={['#e6f5e6', '#c8e6c9', '#a5d6a7']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            {items.slice(0, 3).map((item, index) => (
              <View key={index} style={styles.summaryItem}>
                <View style={styles.summaryItemLeft}>
                  <View style={styles.itemIcon}>
                    <Ionicons name="leaf-outline" size={20} color={PRIMARY} />
                  </View>
                  <View>
                    <Text style={styles.summaryItemName}>{item.name}</Text>
                    <Text style={styles.summaryItemQty}>Qty: {item.quantity}</Text>
                  </View>
                </View>
                <Text style={styles.summaryItemPrice}>
                  KES {((parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0) * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            {items.length > 3 && (
              <Text style={styles.moreItems}>+ {items.length - 3} more items</Text>
            )}
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Ionicons name="location-outline" size={24} color={PRIMARY} />
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>Home</Text>
              <Text style={styles.addressText}>
                123 Moi Avenue, Nairobi, Kenya
              </Text>
              <Text style={styles.addressPhone}>+254 712 345 678</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  paymentMethod === method.id && styles.paymentMethodActive,
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <View style={styles.paymentMethodLeft}>
                  <View
                    style={[
                      styles.paymentIcon,
                      { backgroundColor: method.color + '20' },
                    ]}
                  >
                    <Ionicons name={method.icon} size={24} color={method.color} />
                  </View>
                  <View>
                    <Text style={styles.paymentMethodName}>{method.name}</Text>
                    <Text style={styles.paymentMethodDesc}>{method.desc}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radio,
                    paymentMethod === method.id && styles.radioActive,
                  ]}
                >
                  {paymentMethod === method.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* M-Pesa Phone Input */}
          {paymentMethod === 'mpesa' && (
            <View style={styles.mpesaInput}>
              <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+254</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="712 345 678"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={9}
                />
              </View>
              <Text style={styles.mpesaNote}>
                You will receive an STK push on this number
              </Text>
            </View>
          )}
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>KES {total.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>
                {deliveryFee === 0 ? (
                  <Text style={styles.freeText}>FREE</Text>
                ) : (
                  `KES ${deliveryFee}`
                )}
              </Text>
            </View>
            {deliveryFee > 0 && (
              <View style={styles.deliveryOffer}>
                <Ionicons name="gift-outline" size={16} color={PRIMARY} />
                <Text style={styles.deliveryOfferText}>
                  Add KES {(1000 - total).toFixed(2)} more for FREE delivery
                </Text>
              </View>
            )}
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>KES {finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          style={[styles.placeOrderBtn, processing && styles.placeOrderBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={successModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successText}>
              Your order has been placed successfully. You will receive a confirmation SMS shortly.
            </Text>
            <Text style={styles.orderNumber}>Order #ORD-2024-{Math.floor(Math.random() * 10000)}</Text>
            <TouchableOpacity style={styles.continueBtn} onPress={handleSuccessContinue}>
              <Text style={styles.continueBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  )
}

export default CheckoutScreen

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  placeholder: { width: 40 },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryItemQty: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  moreItems: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  addressContent: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  editText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  paymentMethods: {
    gap: 10,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  paymentMethodActive: {
    borderColor: PRIMARY,
    backgroundColor: '#E8F5E9',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: PRIMARY,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY,
  },
  mpesaInput: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    marginRight: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  mpesaNote: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#888',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  freeText: {
    color: ACCENT,
    fontWeight: '700',
  },
  deliveryOffer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  deliveryOfferText: {
    fontSize: 12,
    color: PRIMARY,
    flex: 1,
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  placeOrderBtnDisabled: {
    opacity: 0.7,
  },
  placeOrderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  continueBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
})
