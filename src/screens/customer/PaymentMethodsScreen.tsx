import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

const PaymentMethodsScreen = () => {
  const navigation = useNavigation()
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  // Mock payment methods (in a real app, these would come from a payment processor)
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'mpesa',
      name: 'M-Pesa',
      phoneNumber: '0712 *** 678',
      is_default: true,
    },
    {
      id: '2',
      type: 'card',
      name: 'Visa Card',
      last4: '4242',
      is_default: false,
    },
  ])

  const [cardFormData, setCardFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  })

  const openAddCardModal = () => {
    setCardFormData({
      cardNumber: '',
      cardholderName: '',
      expiryDate: '',
      cvv: '',
    })
    setModalVisible(true)
  }

  const addCard = async () => {
    if (!cardFormData.cardNumber || !cardFormData.cardholderName || !cardFormData.expiryDate || !cardFormData.cvv) {
      Alert.alert('Error', 'Please fill all card details')
      return
    }

    // Validate card number (simple validation)
    const cardDigits = cardFormData.cardNumber.replace(/\s/g, '')
    if (cardDigits.length < 13 || cardDigits.length > 19) {
      Alert.alert('Error', 'Please enter a valid card number')
      return
    }

    setLoading(true)

    // Simulate card validation/addition
    await new Promise(resolve => setTimeout(resolve, 1500))

    const last4 = cardDigits.slice(-4)
    const newCard = {
      id: Date.now().toString(),
      type: 'card',
      name: 'Credit/Debit Card',
      last4,
      is_default: false,
    }

    setPaymentMethods([...paymentMethods, newCard])
    setModalVisible(false)
    setLoading(false)
    Alert.alert('Success', 'Card added successfully')
  }

  const setDefaultMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(m => ({
        ...m,
        is_default: m.id === id,
      }))
    )
    Alert.alert('Success', 'Default payment method updated')
  }

  const deleteMethod = (method: any) => {
    if (method.type === 'mpesa') {
      Alert.alert('Cannot Delete', 'M-Pesa is the default payment method and cannot be removed')
      return
    }

    Alert.alert('Delete Payment Method', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setPaymentMethods(methods => methods.filter(m => m.id !== method.id))
          Alert.alert('Success', 'Payment method deleted')
        },
      },
    ])
  }

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'mpesa':
        return 'phone-portrait-outline'
      case 'card':
        return 'card-outline'
      default:
        return 'wallet-outline'
    }
  }

  const getCardColor = (type: string) => {
    switch (type) {
      case 'mpesa':
        return '#4CAF50'
      case 'card':
        return '#2196F3'
      default:
        return PRIMARY
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
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <TouchableOpacity onPress={openAddCardModal} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={PRIMARY} />
        <Text style={styles.infoText}>
          Your payment information is securely stored and encrypted
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* M-Pesa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mobile Money</Text>
          {paymentMethods.filter(m => m.type === 'mpesa').map((method) => (
            <View key={method.id} style={styles.paymentCard}>
              <View style={[styles.paymentIcon, { backgroundColor: getCardColor(method.type) + '20' }]}>
                <Ionicons name={getCardIcon(method.type)} size={24} color={getCardColor(method.type)} />
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentName}>{method.name}</Text>
                <Text style={styles.paymentDetail}>{method.phoneNumber}</Text>
              </View>
              <View style={styles.paymentActions}>
                {!method.is_default && (
                  <TouchableOpacity onPress={() => setDefaultMethod(method.id)}>
                    <Text style={styles.setDefaultText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                {method.is_default && (
                  <View style={styles.defaultBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credit/Debit Cards</Text>
          {paymentMethods.filter(m => m.type === 'card').length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="card-outline" size={40} color="#ccc" />
              <Text style={styles.emptyCardText}>No cards added yet</Text>
            </View>
          ) : (
            paymentMethods
              .filter(m => m.type === 'card')
              .map((method) => (
                <View key={method.id} style={styles.paymentCard}>
                  <View style={[styles.paymentIcon, { backgroundColor: getCardColor(method.type) + '20' }]}>
                    <Ionicons name={getCardIcon(method.type)} size={24} color={getCardColor(method.type)} />
                  </View>
                  <View style={styles.paymentContent}>
                    <Text style={styles.paymentName}>{method.name}</Text>
                    <Text style={styles.paymentDetail}>**** **** **** {method.last4}</Text>
                  </View>
                  <View style={styles.paymentActions}>
                    {!method.is_default && (
                      <TouchableOpacity onPress={() => setDefaultMethod(method.id)}>
                        <Text style={styles.setDefaultText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    {method.is_default && (
                      <View style={styles.defaultBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={ACCENT} />
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => deleteMethod(method)}>
                      <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* Payment Methods Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Accepted Payment Methods</Text>
          <View style={styles.acceptedMethods}>
            <View style={styles.acceptedMethod}>
              <Ionicons name="phone-portrait-outline" size={24} color="#4CAF50" />
              <Text style={styles.acceptedMethodText}>M-Pesa</Text>
            </View>
            <View style={styles.acceptedMethod}>
              <Ionicons name="card-outline" size={24} color="#2196F3" />
              <Text style={styles.acceptedMethodText}>Visa/Mastercard</Text>
            </View>
            <View style={styles.acceptedMethod}>
              <Ionicons name="cash-outline" size={24} color="#FF9800" />
              <Text style={styles.acceptedMethodText}>Cash on Delivery</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Card Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Card</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Card Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="number-pad"
                  maxLength={19}
                  value={cardFormData.cardNumber}
                  onChangeText={(text) => {
                    // Format card number with spaces
                    const formatted = text.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
                    setCardFormData({ ...cardFormData, cardNumber: formatted })
                  }}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Cardholder Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="JOHN KAMAU"
                  value={cardFormData.cardholderName}
                  onChangeText={(text) => setCardFormData({ ...cardFormData, cardholderName: text.toUpperCase() })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Expiry Date *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardFormData.expiryDate}
                    onChangeText={(text) => {
                      // Format expiry date
                      let formatted = text.replace(/\D/g, '')
                      if (formatted.length >= 2) {
                        formatted = formatted.slice(0, 2) + '/' + formatted.slice(2, 4)
                      }
                      setCardFormData({ ...cardFormData, expiryDate: formatted })
                    }}
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>CVV *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    value={cardFormData.cvv}
                    onChangeText={(text) => setCardFormData({ ...cardFormData, cvv: text.replace(/\D/g, '') })}
                  />
                </View>
              </View>

              <View style={styles.secureNote}>
                <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY} />
                <Text style={styles.secureNoteText}>
                  Your card information is encrypted and secure
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                  disabled={loading}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                  onPress={addCard}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Add Card</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  )
}

export default PaymentMethodsScreen

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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  paymentIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentContent: {
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  paymentDetail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  paymentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setDefaultText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyCardText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  infoSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  acceptedMethods: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  acceptedMethod: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  acceptedMethodText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 30,
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
  formGroup: {
    padding: 20,
    paddingBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    paddingBottom: 10,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  secureNote: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    margin: 20,
    borderRadius: 12,
  },
  secureNoteText: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
})
