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

// Kenya Counties Data with major locations
const KENYA_COUNTIES = [
  { name: 'Mombasa', locations: ['Mombasa Island', 'Mombasa CBD', 'Kilindini', 'Tudor', 'Nyali', 'Bamburi', 'Shanzu', 'Likoni', 'Changamwe'] },
  { name: 'Kwale', locations: ['Kwale Town', 'Msambweni', 'Gazi', 'Lungalunga', 'Matuga'] },
  { name: 'Kilifi', locations: ['Kilifi Town', 'Malindi', 'Watamu', 'Arabuko', 'Gede'] },
  { name: 'Tana River', locations: ['Hola', 'Garsen', 'Madogo'] },
  { name: 'Lamu', locations: ['Lamu Town', 'Shela', 'Manda'] },
  { name: 'Taita Taveta', locations: ['Voi', 'Taveta', 'Wundanyi'] },
  { name: 'Garissa', locations: ['Garissa Town', 'Dadaab'] },
  { name: 'Wajir', locations: ['Wajir Town', 'Eldas'] },
  { name: 'Mandera', locations: ['Mandera Town', 'El Wak'] },
  { name: 'Marsabit', locations: ['Marsabit Town', 'Moyale'] },
  { name: 'Isiolo', locations: ['Isiolo Town', 'Merti'] },
  { name: 'Meru', locations: ['Meru Town', 'Maua'] },
  { name: 'Tharaka Nithi', locations: ['Kathwana', 'Chuka'] },
  { name: 'Embu', locations: ['Embu Town', 'Runyenjes'] },
  { name: 'Kitui', locations: ['Kitui Town', 'Mwingi'] },
  { name: 'Machakos', locations: ['Machakos Town', 'Athi River', 'Syokimau', 'Mulolongo'] },
  { name: 'Makueni', locations: ['Wote', 'Kibwezi', 'Makindu'] },
  { name: 'Nyandarua', locations: ['Ol Kalou', 'Nyahururu'] },
  { name: 'Nyeri', locations: ['Nyeri Town', 'Othaya', 'Karatina'] },
  { name: 'Kirinyaga', locations: ['Kerugoya', 'Sagana', 'Kutus'] },
  { name: 'Muranga', locations: ['Muranga Town', 'Kangema'] },
  { name: 'Kiambu', locations: ['Kiambu Town', 'Thika', 'Ruiru', 'Juja', 'Kikuyu', 'Limuru', 'Karuri', 'Gatundu'] },
  { name: 'Turkana', locations: ['Lodwar', 'Kakuma'] },
  { name: 'West Pokot', locations: ['Kapenguria'] },
  { name: 'Samburu', locations: ['Maralal'] },
  { name: 'Trans Nzoia', locations: ['Kitale'] },
  { name: 'Uasin Gishu', locations: ['Eldoret'] },
  { name: 'Elgeyo Marakwet', locations: ['Iten'] },
  { name: 'Nandi', locations: ['Kapsabet', 'Nandi Hills'] },
  { name: 'Baringo', locations: ['Kabarnet'] },
  { name: 'Laikipia', locations: ['Nanyuki', 'Rumuruti'] },
  { name: 'Nakuru', locations: ['Nakuru Town', 'Naivasha', 'Gilgil', 'Molo'] },
  { name: 'Narok', locations: ['Narok Town'] },
  { name: 'Kajiado', locations: ['Kajiado Town', 'Ngong', 'Ongata Rongai', 'Kitengela'] },
  { name: 'Kericho', locations: ['Kericho Town'] },
  { name: 'Bomet', locations: ['Bomet Town'] },
  { name: 'Kakamega', locations: ['Kakamega Town', 'Mumias'] },
  { name: 'Vihiga', locations: ['Vihiga Town', 'Mbale', 'Hamisi', 'Luanda', 'Emuhaya', 'Mumias West', 'Wodanga', 'Lyaduywa', 'Izawa', 'Shirere', 'Tsintsuta', 'Lugari', 'Matungu'] },
  { name: 'Bungoma', locations: ['Bungoma Town', 'Webuye'] },
  { name: 'Busia', locations: ['Busia Town', 'Malaba'] },
  { name: 'Siaya', locations: ['Siaya Town'] },
  { name: 'Kisumu', locations: ['Kisumu City', 'Ahero', 'Maseno'] },
  { name: 'Homa Bay', locations: ['Homa Bay Town'] },
  { name: 'Migori', locations: ['Migori Town'] },
  { name: 'Kisii', locations: ['Kisii Town'] },
  { name: 'Nyamira', locations: ['Nyamira Town'] },
  { name: 'Nairobi', locations: ['Nairobi CBD', 'Westlands', 'Kasarani', 'Roysambu', 'Kahawa', 'Ruaraka', 'Embakasi', 'Kamukunji', 'Starehe', 'Makadara', 'Langata', 'Kibra', 'Dagoretti', 'Karen', 'Kilimani', 'Kileleshwa', 'Lavington', 'South B', 'South C', 'Buruburu', 'Donholm', 'Utawala', 'Kayole'] },
]

type RootStackParamList = {
  Checkout: { total: number; items: CartItem[] }
  DeliveryAddresses: undefined
}

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>
type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>

interface DeliveryAddress {
  id: string
  label: string
  address_line1: string
  address_line2?: string
  city: string
  county?: string
  phone: string
  is_default: boolean
}

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

  const { total, items } = route.params || { total: 0, items: [] }
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'cod'>('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [processing, setProcessing] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([])
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null)
  const [addressModalVisible, setAddressModalVisible] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  // County and location selection state
  const [countyModalVisible, setCountyModalVisible] = useState(false)
  const [locationModalVisible, setLocationModalVisible] = useState(false)
  const [searchCounty, setSearchCounty] = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  // Add/Edit address form state
  const [newAddressData, setNewAddressData] = useState({
    label: '',
    address_line1: '',
    county: '',
    location: '',
    phone: '',
  })
  
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
  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0
    return sum + price * item.quantity
  }, 0)

  // FREE delivery - set fee to 0
  const deliveryFee = 0
  const finalTotal = subtotal + deliveryFee

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses()
    fetchSavedCards()
  }, [])

  // Focus effect to reload addresses when returning from DeliveryAddresses screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses()
    })
    return unsubscribe
  }, [navigation])

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

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false })

      if (error) throw error

      setAddresses(data || [])

      // Select default address or first address
      const defaultAddr = data?.find(a => a.is_default) || data?.[0] || null
      setSelectedAddress(defaultAddr)
    } catch (error: any) {
      console.log('Error fetching addresses:', error.message)
    } finally {
      setLoadingAddresses(false)
    }
  }

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

  const handleSaveNewAddress = async () => {
    if (!newAddressData.label || !newAddressData.address_line1 || !newAddressData.county || !newAddressData.location || !newAddressData.phone) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('delivery_addresses')
        .insert({
          customer_id: user.id,
          label: newAddressData.label,
          address_line1: newAddressData.address_line1,
          city: newAddressData.location,
          county: newAddressData.county,
          phone: newAddressData.phone,
          is_default: addresses.length === 0,
        })

      if (error) throw error

      Alert.alert('Success', 'Address added successfully')
      
      // Clear form
      setNewAddressData({
        label: '',
        address_line1: '',
        county: '',
        location: '',
        phone: '',
      })
      
      // Reload addresses
      fetchAddresses()
    } catch (error: any) {
      console.log('Error saving address:', error.message)
      Alert.alert('Error', 'Failed to save address')
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

  const handleSelectAddress = () => {
    setAddressModalVisible(true)
  }

  const confirmAddressSelection = (address: DeliveryAddress) => {
    setSelectedAddress(address)
    setAddressModalVisible(false)
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
    if (!selectedAddress) {
      Alert.alert('Address Required', 'Please select a delivery address')
      return
    }

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

    if (items.length === 0) {
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
      const itemsBySeller = items.reduce((acc, item) => {
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

        // Build delivery address string from selected address
        const deliveryAddressStr = selectedAddress
          ? `${selectedAddress.address_line1}${selectedAddress.address_line2 ? ', ' + selectedAddress.address_line2 : ''}, ${selectedAddress.city}${selectedAddress.county ? ', ' + selectedAddress.county : ''}`
          : 'Address not provided'

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
            delivery_address: deliveryAddressStr,
            delivery_instructions: selectedAddress ? `Phone: ${selectedAddress.phone}` : `Phone: ${phoneNumber}`,
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
          <TouchableOpacity
            style={styles.addressCard}
            onPress={handleSelectAddress}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={24} color={PRIMARY} />
            {loadingAddresses ? (
              <View style={styles.addressContent}>
                <ActivityIndicator size="small" color={PRIMARY} />
                <Text style={styles.addressText}>Loading addresses...</Text>
              </View>
            ) : selectedAddress ? (
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                <Text style={styles.addressText}>
                  {selectedAddress.address_line1}
                  {selectedAddress.address_line2 ? `, ${selectedAddress.address_line2}` : ''}
                </Text>
                <Text style={styles.addressText}>
                  {selectedAddress.city}
                  {selectedAddress.county ? `, ${selectedAddress.county}` : ''}
                </Text>
                <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
              </View>
            ) : (
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>No Address Selected</Text>
                <Text style={styles.addressText}>Tap to select a delivery address</Text>
              </View>
            )}
            <View style={styles.addressActions}>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </View>
          </TouchableOpacity>
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

      {/* Address Selection Modal */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addressModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delivery Address</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Saved Addresses */}
              <Text style={styles.subTitle}>Saved Addresses</Text>
              {loadingAddresses ? (
                <View style={styles.loadingAddresses}>
                  <ActivityIndicator size="small" color={PRIMARY} />
                  <Text style={styles.loadingAddressesText}>Loading...</Text>
                </View>
              ) : addresses.length === 0 ? (
                <View style={styles.emptyAddresses}>
                  <Ionicons name="location-outline" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>No addresses saved</Text>
                  <Text style={styles.emptySubtext}>Add a new address below</Text>
                </View>
              ) : (
                addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressOptionCard,
                      selectedAddress?.id === address.id && styles.addressOptionSelected,
                    ]}
                    onPress={() => confirmAddressSelection(address)}
                  >
                    <View style={styles.addressOptionHeader}>
                      <View style={styles.addressOptionLabel}>
                        <Ionicons name="pricetag-outline" size={16} color={PRIMARY} />
                        <Text style={styles.addressOptionLabelText}>{address.label}</Text>
                        {address.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        )}
                      </View>
                      {selectedAddress?.id === address.id && (
                        <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
                      )}
                    </View>
                    <View style={styles.addressOptionContent}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.addressOptionText}>
                        {address.address_line1}
                        {address.address_line2 ? `, ${address.address_line2}` : ''}
                      </Text>
                    </View>
                    <View style={styles.addressOptionContent}>
                      <Ionicons name="city-outline" size={16} color="#666" />
                      <Text style={styles.addressOptionText}>
                        {address.city}
                        {address.county ? `, ${address.county}` : ''}
                      </Text>
                    </View>
                    <View style={styles.addressOptionContent}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={styles.addressOptionText}>{address.phone}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}

              {/* Add New Address Section */}
              <View style={styles.divider} />
              <Text style={styles.subTitle}>Add New Address</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Label *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Home, Work, Office"
                  value={newAddressData.label}
                  onChangeText={(text) => setNewAddressData({ ...newAddressData, label: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address Line 1 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street address, building number"
                  value={newAddressData.address_line1}
                  onChangeText={(text) => setNewAddressData({ ...newAddressData, address_line1: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>County *</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  onPress={() => setCountyModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={newAddressData.county ? styles.selectorInputText : styles.selectorPlaceholder}>
                    {newAddressData.county || 'Select County'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location/Town *</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  onPress={() => {
                    if (!newAddressData.county) {
                      Alert.alert('Select County First', 'Please select a county first')
                      return
                    }
                    setLocationModalVisible(true)
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={newAddressData.location ? styles.selectorInputText : styles.selectorPlaceholder}>
                    {newAddressData.location || 'Select Location'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0712 345 678"
                  keyboardType="phone-pad"
                  value={newAddressData.phone}
                  onChangeText={(text) => setNewAddressData({ ...newAddressData, phone: text })}
                />
              </View>

              <TouchableOpacity
                style={styles.saveAddressBtn}
                onPress={handleSaveNewAddress}
              >
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.saveAddressText}>Save Address</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* County Selection Modal */}
      <Modal
        visible={countyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCountyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select County</Text>
              <TouchableOpacity onPress={() => setCountyModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search county..."
                value={searchCounty}
                onChangeText={setSearchCounty}
              />
            </View>

            <FlatList
              data={KENYA_COUNTIES.filter(c =>
                c.name.toLowerCase().includes(searchCounty.toLowerCase())
              )}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionOption}
                  onPress={() => {
                    setNewAddressData({ ...newAddressData, county: item.name, location: '' })
                    setCountyModalVisible(false)
                    setSearchCounty('')
                  }}
                >
                  <Text style={styles.selectionOptionText}>{item.name}</Text>
                  {newAddressData.county === item.name && (
                    <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {newAddressData.county} - Select Location
              </Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={KENYA_COUNTIES.find(c => c.name === newAddressData.county)?.locations || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionOption}
                  onPress={() => {
                    setNewAddressData({ ...newAddressData, location: item })
                    setLocationModalVisible(false)
                  }}
                >
                  <Text style={styles.selectionOptionText}>{item}</Text>
                  {newAddressData.location === item && (
                    <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

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
            {orderNumber ? (
              <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
            ) : (
              <Text style={styles.orderNumber}>Order #ORD-2024-{Math.floor(Math.random() * 10000)}</Text>
            )}
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
  addressActions: {
    padding: 8,
  },
  addressModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptyAddresses: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  addressOptionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  addressOptionSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#E8F5E9',
  },
  addressOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressOptionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressOptionLabelText: {
    fontSize: 15,
    fontWeight: '600',
    color: PRIMARY,
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
  addressOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  addressOptionText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  addNewAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  addNewAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    marginTop: 8,
  },
  loadingAddresses: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingAddressesText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  formGroup: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
  },
  selectorInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
  },
  selectorInputText: {
    fontSize: 15,
    color: '#333',
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  saveAddressBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveAddressText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  selectionModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#333',
  },
  selectionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionOptionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
})
