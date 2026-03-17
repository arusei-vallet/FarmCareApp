import React, { useState, useEffect } from 'react'
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
  FlatList,
} from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCart, CartItem } from './CartContext'
import { supabase } from '../../services/supabase'
import { initiateSTKPush, pollPaymentStatus, validateMPesaPhone } from '../../services/mpesaService'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

type RootStackParamList = {
  Checkout: { total: number; items: CartItem[] }
  DeliveryAddresses: undefined
}

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>
type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>

interface SavedCard {
  id: string
  card_last_four: string
  card_brand: string
  card_exp_month: number
  card_exp_year: number
}

const CheckoutScreen = () => {
  const navigation = useNavigation<CheckoutScreenNavigationProp>()
  const route = useRoute<CheckoutScreenRouteProp>()
  const { clearCart } = useCart()

  const { total, items } = route.params ?? { total: 0, items: [] }
  const itemsArray: CartItem[] = Array.isArray(items) ? items : []
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'cod'>('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [processing, setProcessing] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // Card payment state
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [saveCard, setSaveCard] = useState(false)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null)
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'unknown'>('unknown')
  const [cardFormVisible, setCardFormVisible] = useState(false)
  
  // M-Pesa STK Push state
  const [stkProcessing, setStkProcessing] = useState(false)
  const [stkCheckoutRequestId, setStkCheckoutRequestId] = useState<string>('')
  const [stkPollingInterval, setStkPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Calculate subtotal from items (product prices only)
  const subtotal = itemsArray.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  // FREE delivery - set fee to 0
  const deliveryFee = 0
  const finalTotal = subtotal + deliveryFee

  // Fetch saved cards on mount
  useEffect(() => {
    fetchSavedCards()
  }, [])

  // Card type detection
  useEffect(() => {
    const detectCardType = () => {
      const cleaned = cardNumber.replace(/\s/g, '')
      if (/^4/.test(cleaned)) {
        setCardType('visa')
      } else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
        setCardType('mastercard')
      } else {
        setCardType('unknown')
      }
    }
    detectCardType()
  }, [cardNumber])

  const fetchSavedCards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('saved_cards')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedCards(data || [])
    } catch (error: any) {
      console.log('Error fetching saved cards:', error.message)
    }
  }

  // Format card number with spaces (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '')
    const limited = cleaned.substring(0, 16)
    const formatted = limited.match(/.{1,4}/g)?.join(' ') || limited
    return formatted
  }

  // Format expiry date (MM/YY)
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      const month = parseInt(cleaned.substring(0, 2))
      if (month > 12) return cleaned.substring(0, 1)
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
    }
    return cleaned
  }

  // Validate card number using Luhn algorithm
  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\s/g, '')
    if (cleaned.length < 13 || cleaned.length > 19) return false
    
    let sum = 0
    let isEven = false
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i])
      
      if (isEven) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }

  // Validate expiry date
  const validateExpiryDate = (expiry: string): boolean => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false
    
    const [month, year] = expiry.split('/')
    const monthNum = parseInt(month)
    const yearNum = parseInt('20' + year)
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    
    if (monthNum < 1 || monthNum > 12) return false
    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) return false
    
    return true
  }

  // Initiate M-Pesa STK Push
  const initiateMpesaPayment = async (orderId: string, amount: number): Promise<boolean> => {
    try {
      setStkProcessing(true)
      
      // Format phone number properly
      const formattedPhone = phoneNumber.replace(/\D/g, '')
      let mpesaPhone = formattedPhone
      if (formattedPhone.startsWith('0')) {
        mpesaPhone = '254' + formattedPhone.substring(1)
      } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
        mpesaPhone = '254' + formattedPhone
      }

      // Initiate STK push
      const stkResponse = await initiateSTKPush({
        phoneNumber: mpesaPhone,
        amount: amount,
        accountReference: `ORD-${orderId.substring(0, 8)}`,
        transactionDesc: 'FarmCare Order Payment',
      })

      setStkCheckoutRequestId(stkResponse.CheckoutRequestID)

      // Save transaction to database
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('mpesa_transactions').insert({
          order_id: orderId,
          customer_id: user.id,
          checkout_request_id: stkResponse.CheckoutRequestID,
          merchant_request_id: stkResponse.MerchantRequestID,
          phone_number: mpesaPhone,
          amount: amount,
          status: 'pending',
        })
      }

      // Show waiting dialog
      Alert.alert(
        'STK Push Sent',
        `Please enter your M-Pesa PIN on phone ${phoneNumber} to complete payment`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => stopPolling(),
          },
        ],
        { cancelable: false }
      )

      // Start polling for payment status
      return await pollForPaymentStatus(orderId)
    } catch (error: any) {
      console.error('M-Pesa STK Push error:', error)
      setStkProcessing(false)
      Alert.alert('M-Pesa Error', error.message || 'Failed to initiate STK push')
      return false
    }
  }

  // Poll for M-Pesa payment status
  const pollForPaymentStatus = async (orderId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0
      const maxAttempts = 30
      
      const interval = setInterval(async () => {
        try {
          attempts++
          
          const { data } = await supabase
            .from('mpesa_transactions')
            .select('status, result_code, result_desc')
            .eq('checkout_request_id', stkCheckoutRequestId)
            .single()

          if (data?.result_code === '0') {
            // Payment successful
            clearInterval(interval)
            setStkProcessing(false)
            
            // Update order payment status
            await supabase
              .from('orders')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
              })
              .eq('id', orderId)

            setProcessing(false)
            setSuccessModal(true)

            // Clear cart after successful order
            setTimeout(() => {
              clearCart()
            }, 500)

            resolve(true)
          } else if (data?.result_code && data.result_code !== '1032') {
            // Payment failed (not user cancelled)
            clearInterval(interval)
            setStkProcessing(false)
            setProcessing(false)
            Alert.alert('Payment Failed', data.result_desc || 'Payment was not completed')
            resolve(false)
          } else if (attempts >= maxAttempts) {
            // Timeout
            clearInterval(interval)
            setStkProcessing(false)
            setProcessing(false)
            Alert.alert('Payment Timeout', 'Please try again or use another payment method')
            resolve(false)
          }
        } catch (error) {
          console.error('Polling error:', error)
          if (attempts >= maxAttempts) {
            clearInterval(interval)
            setStkProcessing(false)
            setProcessing(false)
            resolve(false)
          }
        }
      }, 5000) // Poll every 5 seconds

      setStkPollingInterval(interval as unknown as NodeJS.Timeout)
    })
  }

  // Stop polling for payment status
  const stopPolling = () => {
    if (stkPollingInterval) {
      clearInterval(stkPollingInterval)
      setStkPollingInterval(null)
    }
    setStkProcessing(false)
  }

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'mpesa' && !phoneNumber) {
      Alert.alert('Phone Required', 'Please enter your M-Pesa phone number')
      return
    }

    // Card payment validation
    if (paymentMethod === 'card') {
      if (selectedSavedCard) {
        // Using saved card - no additional validation needed
      } else {
        if (!cardNumber) {
          Alert.alert('Card Required', 'Please enter your card number')
          return
        }
        if (!validateCardNumber(cardNumber)) {
          Alert.alert('Invalid Card', 'Please enter a valid card number')
          return
        }
        if (!cardHolderName.trim()) {
          Alert.alert('Name Required', 'Please enter the cardholder name')
          return
        }
        if (!expiryDate) {
          Alert.alert('Expiry Required', 'Please enter the card expiry date')
          return
        }
        if (!validateExpiryDate(expiryDate)) {
          Alert.alert('Invalid Expiry', 'Please enter a valid expiry date (MM/YY)')
          return
        }
        if (!cvv || cvv.length < 3) {
          Alert.alert('CVV Required', 'Please enter a valid CVV')
          return
        }
      }
    }

    if (itemsArray.length === 0) {
      Alert.alert('Cart Empty', 'Your cart is empty')
      return
    }

    setProcessing(true)

    try {
      // 1. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        Alert.alert('Error', 'Please login to place an order')
        setProcessing(false)
        return
      }

      // 2. Get user profile to ensure we have the customer_id
      const { data: profile } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'customer') {
        Alert.alert('Error', 'Invalid user profile')
        setProcessing(false)
        return
      }

      const customerId = user.id

      // 3. Group items by seller (each seller gets a separate order)
      const itemsBySeller = itemsArray.reduce((acc, item) => {
        const sellerId = item.seller_id || 'unknown'
        if (!acc[sellerId]) {
          acc[sellerId] = []
        }
        acc[sellerId].push(item)
        return acc
      }, {} as Record<string, CartItem[]>)

      // 4. Create orders for each seller
      const orderPromises = Object.entries(itemsBySeller).map(async ([sellerId, sellerItems]) => {
        // Calculate subtotal for this seller's items
        const sellerSubtotal = sellerItems.reduce((sum, item) => {
          const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0
          return sum + price * item.quantity
        }, 0)

        // Delivery is FREE for all orders
        const sellerDeliveryFee = 0
        const sellerTotal = sellerSubtotal

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: customerId,
            seller_id: sellerId,
            status: 'pending',
            subtotal: sellerSubtotal,
            delivery_fee: 0,
            total_amount: sellerTotal,
            payment_method: paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'card' ? 'Card' : 'Cash on Delivery',
            payment_status: 'pending',
            delivery_address: 'Address to be confirmed',
            delivery_instructions: `Phone: ${phoneNumber}`,
            notes: `Payment: ${paymentMethod} - FREE Delivery`,
          })
          .select()
          .single()

        if (orderError) {
          console.error('Order creation error:', orderError)
          throw orderError
        }

        // 5. Create order items for this order
        const orderItems = sellerItems.map(item => {
          const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0
          return {
            order_id: orderData.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'kg',
            unit_price: price,
            subtotal: price * item.quantity,
          }
        })

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) {
          console.error('Order items creation error:', itemsError)
          throw itemsError
        }

        return orderData
      })

      // Wait for all orders to be created
      const orders = await Promise.all(orderPromises)

      // Get the first order number for display
      if (orders.length > 0 && orders[0].order_number) {
        setOrderNumber(orders[0].order_number)
      }

      // Handle M-Pesa payment
      if (paymentMethod === 'mpesa') {
        // For M-Pesa, initiate STK push for the first order
        // In a real multi-seller scenario, you'd need to handle multiple payments
        const firstOrder = orders[0]
        const paymentSuccess = await initiateMpesaPayment(firstOrder.id, firstOrder.total_amount)
        
        if (!paymentSuccess) {
          // Payment failed or was cancelled
          setProcessing(false)
          // Don't clear cart - let user try again
          return
        }
      }

      // Save card if requested (for card payments)
      if (paymentMethod === 'card' && saveCard && !selectedSavedCard) {
        try {
          const cleanedCard = cardNumber.replace(/\s/g, '')
          const lastFour = cleanedCard.substring(cleanedCard.length - 4)
          const [expMonth, expYear] = expiryDate.split('/')

          await supabase.from('saved_cards').insert({
            customer_id: customerId,
            card_last_four: lastFour,
            card_brand: cardType === 'visa' ? 'Visa' : cardType === 'mastercard' ? 'Mastercard' : 'Unknown',
            card_exp_month: parseInt(expMonth),
            card_exp_year: parseInt('20' + expYear),
          })
        } catch (cardError: any) {
          console.log('Error saving card:', cardError.message)
          // Don't fail the order if card saving fails
        }
      }

      // For card and COD, show success immediately
      // For M-Pesa, this happens after payment confirmation
      if (paymentMethod !== 'mpesa') {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        setProcessing(false)
        setSuccessModal(true)

        // Clear cart after successful order
        setTimeout(() => {
          clearCart()
        }, 500)
      }

    } catch (error: any) {
      console.error('Order placement error:', error)
      setProcessing(false)
      Alert.alert('Error', 'Failed to place order: ' + error.message)
    }
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
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
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
            {itemsArray.slice(0, 3).map((item, index) => (
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
            {itemsArray.length > 3 && (
              <Text style={styles.moreItems}>+ {itemsArray.length - 3} more items</Text>
            )}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          {/* M-Pesa Payment */}
          <TouchableOpacity
            style={[
              styles.paymentMethodExpanded,
              paymentMethod === 'mpesa' && styles.paymentMethodExpandedActive,
            ]}
            onPress={() => setPaymentMethod('mpesa')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.paymentIcon, { backgroundColor: '#4CAF5020' }]}>
                <Ionicons name="phone-portrait-outline" size={24} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.paymentMethodName}>M-Pesa</Text>
                <Text style={styles.paymentMethodDesc}>Pay with M-Pesa</Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'mpesa' && styles.radioActive]}>
              {paymentMethod === 'mpesa' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
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

          {/* Credit/Debit Card Payment */}
          <TouchableOpacity
            style={[
              styles.paymentMethodExpanded,
              paymentMethod === 'card' && styles.paymentMethodExpandedActive,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.paymentIcon, { backgroundColor: '#2196F320' }]}>
                <Ionicons name="card-outline" size={24} color="#2196F3" />
              </View>
              <View>
                <Text style={styles.paymentMethodName}>Credit/Debit Card</Text>
                <Text style={styles.paymentMethodDesc}>Visa, Mastercard</Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'card' && styles.radioActive]}>
              {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
          {paymentMethod === 'card' && (
            <View style={styles.cardPaymentContainer}>
              {/* Saved Cards */}
              {savedCards.length > 0 && (
                <View style={styles.savedCardsSection}>
                  <Text style={styles.inputLabel}>Use Saved Card</Text>
                  <TouchableOpacity
                    style={[styles.savedCardOption, !selectedSavedCard && styles.savedCardOptionNew]}
                    onPress={() => {
                      setSelectedSavedCard(null)
                      setCardFormVisible(true)
                    }}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={!selectedSavedCard ? '#2196F3' : '#999'}
                    />
                    <Text style={[
                      styles.savedCardText,
                      !selectedSavedCard && styles.savedCardTextSelected
                    ]}>Use a New Card</Text>
                    {!selectedSavedCard && (
                      <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
                    )}
                  </TouchableOpacity>
                  {savedCards.map((card) => (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.savedCardOption, selectedSavedCard === card.id && styles.savedCardOptionSelected]}
                      onPress={() => {
                        setSelectedSavedCard(card.id)
                        setCardFormVisible(false)
                      }}
                    >
                      <Ionicons
                        name={card.card_brand === 'Visa' ? 'logo-visa' : 'logo-mastercard'}
                        size={28}
                        color={selectedSavedCard === card.id ? '#2196F3' : '#666'}
                      />
                      <View style={styles.savedCardInfo}>
                        <Text style={[
                          styles.savedCardText,
                          selectedSavedCard === card.id && styles.savedCardTextSelected
                        ]}>
                          •••• •••• •••• {card.card_last_four}
                        </Text>
                        <Text style={styles.savedCardExpiry}>
                          Expires: {String(card.card_exp_month).padStart(2, '0')}/{card.card_exp_year}
                        </Text>
                      </View>
                      {selectedSavedCard === card.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#2196F3" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* New Card Form */}
              {(!selectedSavedCard || savedCards.length === 0) && (
                <View style={styles.cardForm}>
                  {/* Card Number */}
                  <View style={styles.cardInput}>
                    <Text style={styles.inputLabel}>Card Number</Text>
                    <View style={styles.cardNumberInput}>
                      <TextInput
                        style={styles.cardNumberTextInput}
                        placeholder="1234 5678 9012 3456"
                        keyboardType="number-pad"
                        value={cardNumber}
                        onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                        maxLength={19}
                      />
                      {cardType !== 'unknown' && (
                        <Ionicons
                          name={cardType === 'visa' ? 'logo-visa' : 'logo-mastercard'}
                          size={32}
                          color={cardType === 'visa' ? '#1A1F71' : '#EB001B'}
                        />
                      )}
                    </View>
                  </View>

                  {/* Cardholder Name */}
                  <View style={styles.cardInput}>
                    <Text style={styles.inputLabel}>Cardholder Name</Text>
                    <View style={styles.textInputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#666" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="John Doe"
                        value={cardHolderName}
                        onChangeText={setCardHolderName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  {/* Expiry Date and CVV */}
                  <View style={styles.cardRow}>
                    <View style={styles.cardHalfInput}>
                      <Text style={styles.inputLabel}>Expiry Date</Text>
                      <View style={styles.expiryInputWrapper}>
                        <TextInput
                          style={styles.expiryInput}
                          placeholder="MM/YY"
                          keyboardType="number-pad"
                          value={expiryDate}
                          onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                          maxLength={5}
                        />
                        <Ionicons name="calendar-outline" size={18} color="#666" />
                      </View>
                    </View>
                    <View style={styles.cardHalfInput}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <View style={styles.cvvInputWrapper}>
                        <TextInput
                          style={styles.cvvInput}
                          placeholder="123"
                          keyboardType="number-pad"
                          value={cvv}
                          onChangeText={(text) => setCvv(text.replace(/\D/g, '').substring(0, 4))}
                          maxLength={4}
                          secureTextEntry
                        />
                        <Ionicons name="shield-checkmark-outline" size={18} color="#666" />
                      </View>
                    </View>
                  </View>

                  {/* Save Card Checkbox */}
                  <TouchableOpacity
                    style={styles.saveCardCheckbox}
                    onPress={() => setSaveCard(!saveCard)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, saveCard && styles.checkboxChecked]}>
                      {saveCard && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                    <Text style={styles.saveCardText}>Save this card for future payments</Text>
                  </TouchableOpacity>

                  {/* Security Note */}
                  <View style={styles.securityNote}>
                    <Ionicons name="lock-closed-outline" size={16} color="#4CAF50" />
                    <Text style={styles.securityNoteText}>
                      Your card information is encrypted and secure
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Cash on Delivery Payment */}
          <TouchableOpacity
            style={[
              styles.paymentMethodExpanded,
              paymentMethod === 'cod' && styles.paymentMethodExpandedActive,
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.paymentMethodLeft}>
              <View style={[styles.paymentIcon, { backgroundColor: '#FF980020' }]}>
                <Ionicons name="cash-outline" size={24} color="#FF9800" />
              </View>
              <View>
                <Text style={styles.paymentMethodName}>Cash on Delivery</Text>
                <Text style={styles.paymentMethodDesc}>Pay when delivered</Text>
              </View>
            </View>
            <View style={[styles.radio, paymentMethod === 'cod' && styles.radioActive]}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>KES {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.freeText}>FREE</Text>
            </View>
            <View style={styles.freeDeliveryBadge}>
              <Ionicons name="gift-outline" size={18} color="#fff" />
              <Text style={styles.freeDeliveryText}>FREE Delivery on All Orders</Text>
            </View>
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
          <ScrollView style={{ maxHeight: '90%' }} showsVerticalScrollIndicator={false}>
            <View style={styles.successCard}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>Order Placed!</Text>
              <Text style={styles.successText}>
                Your order has been placed successfully. You will receive a confirmation SMS shortly.
              </Text>
              {orderNumber ? (
                <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
              ) : (
                <Text style={styles.orderNumber}>Order #ORD-2024-{Math.floor(Math.random() * 10000)}</Text>
              )}

              <TouchableOpacity style={styles.continueBtn} onPress={handleSuccessContinue}>
                <Text style={styles.continueBtnText}>Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  paymentMethods: {
    gap: 10,
  },
  paymentMethodExpanded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    marginBottom: 0,
  },
  paymentMethodExpandedActive: {
    borderColor: PRIMARY,
    backgroundColor: '#E8F5E9',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
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
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 14,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 0,
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
  cardPaymentContainer: {
    marginTop: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 14,
    borderWidth: 2,
    borderColor: PRIMARY,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 0,
  },
  savedCardsSection: {
    marginBottom: 16,
  },
  savedCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  savedCardOptionNew: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  savedCardOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  savedCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  savedCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  savedCardTextSelected: {
    color: '#2196F3',
  },
  savedCardExpiry: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginLeft: 38,
  },
  cardForm: {
    gap: 16,
  },
  cardInput: {
    marginBottom: 4,
  },
  cardNumberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  cardNumberTextInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    letterSpacing: 1,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    marginLeft: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHalfInput: {
    flex: 1,
  },
  expiryInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  expiryInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  cvvInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  cvvInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
  },
  saveCardCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  saveCardText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#2E7D32',
    flex: 1,
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
  freeDeliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
    justifyContent: 'center',
  },
  freeDeliveryText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
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
    marginBottom: 16,
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
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  emptyAddress: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyAddressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  emptyAddressSubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    marginBottom: 10,
  },
  defaultBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
})
