// src/screens/farmer/OrderDetailScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { supabase } from '../../services/supabase'

interface Order {
  id: string
  order_number: string
  customer_id: string
  seller_id: string
  status: string
  subtotal: number
  delivery_fee: number
  total_amount: number
  payment_method?: string
  payment_status: string
  delivery_address: string
  delivery_instructions?: string
  notes?: string
  created_at: string
  updated_at: string
  delivered_at?: string
  cancelled_at?: string
  customer?: {
    full_name: string
    phone: string
    email: string
  }
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  unit: string
  subtotal: number
}

const OrderDetailScreen = ({ navigation, route }: any) => {
  const { orderId } = route.params
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Simplified status options for farmer: Pending, Accepted, Rejected
  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: 'time-outline', color: '#ff9800' },
    { value: 'accepted', label: 'Accepted', icon: 'checkmark-circle-outline', color: '#4caf50' },
    { value: 'rejected', label: 'Rejected', icon: 'close-circle-outline', color: '#c62828' },
  ]

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      // First fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Fetch customer details separately if customer_id exists
      let customerData = null
      if (orderData.customer_id) {
        const { data: customer, error: customerError } = await supabase
          .from('users')
          .select('full_name, phone, email')
          .eq('id', orderData.customer_id)
          .single()

        if (!customerError && customer) {
          customerData = customer
        }
      }

      // Combine order with customer data
      const orderWithCustomer = {
        ...orderData,
        customer: customerData
      }

      setOrder(orderWithCustomer)

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (err: any) {
      console.error('Error fetching order details:', err)
      Alert.alert('Error', 'Failed to load order details: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return

    setUpdatingStatus(true)
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      // Set rejected_at when order is rejected
      if (newStatus === 'rejected') {
        updateData.rejected_at = new Date().toISOString()
      }
      // Set accepted_at when order is accepted
      if (newStatus === 'accepted') {
        updateData.accepted_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      Alert.alert('Success', `Order ${newStatus.toLowerCase()} successfully`)
      setStatusModalVisible(false)
      fetchOrderDetails()
    } catch (err: any) {
      console.error('Error updating status:', err)
      Alert.alert('Error', 'Failed to update order status: ' + err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#4caf50'
      case 'pending': return '#ff9800'
      case 'rejected': return '#c62828'
      default: return '#999'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option?.icon || 'help-circle-outline'
  }

  if (loading) {
    return (
      <LinearGradient colors={['#f4fbf6', '#e8f5e9']} style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </LinearGradient>
    )
  }

  if (!order) {
    return (
      <LinearGradient colors={['#f4fbf6', '#e8f5e9']} style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <MCIcon name="alert-circle-outline" size={64} color="#bdbdbd" />
        <Text style={styles.emptyTitle}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1b4332" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSubtitle}>{order.order_number}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.statusButton, { borderColor: getStatusColor(order.status) }]}
          onPress={() => setStatusModalVisible(true)}
        >
          <MCIcon name={getStatusIcon(order.status)} size={18} color={getStatusColor(order.status)} />
          <Text style={[styles.statusButtonText, { color: getStatusColor(order.status) }]}>
            {getStatusLabel(order.status)}
          </Text>
          <Ionicons name="chevron-down" size={16} color={getStatusColor(order.status)} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={[styles.statusCard, { backgroundColor: getStatusColor(order.status) + '10' }]}>
          <View style={styles.statusCardHeader}>
            <MCIcon name={getStatusIcon(order.status)} size={32} color={getStatusColor(order.status)} />
            <View style={styles.statusCardTextContainer}>
              <Text style={styles.statusCardTitle}>Order Status</Text>
              <Text style={[styles.statusCardValue, { color: getStatusColor(order.status) }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.updateStatusBtn, { backgroundColor: getStatusColor(order.status) }]}
            onPress={() => setStatusModalVisible(true)}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.updateStatusText}>Update Status</Text>
          </TouchableOpacity>
        </View>

        {/* Order Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.infoLabel}>Order Date</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(order.created_at)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="wallet-outline" size={18} color="#666" />
              <Text style={styles.infoLabel}>Payment</Text>
            </View>
            <Text style={styles.infoValue}>
              {order.payment_method || 'N/A'} • {getStatusLabel(order.payment_status)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <MCIcon name="truck-delivery" size={18} color="#666" />
              <Text style={styles.infoLabel}>Delivery Fee</Text>
            </View>
            <Text style={styles.infoValue}>KES {order.delivery_fee.toLocaleString()}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerAvatar}>
              <MCIcon name="account-circle" size={40} color="#2e7d32" />
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{order.customer?.full_name || 'Unknown'}</Text>
              <View style={styles.customerDetail}>
                <Ionicons name="call-outline" size={14} color="#666" />
                <Text style={styles.customerDetailText}>{order.customer?.phone || 'N/A'}</Text>
              </View>
              <View style={styles.customerDetail}>
                <Ionicons name="mail-outline" size={14} color="#666" />
                <Text style={styles.customerDetailText} numberOfLines={1}>{order.customer?.email || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Ionicons name="location-outline" size={20} color="#2e7d32" />
            <Text style={styles.addressText}>{order.delivery_address}</Text>
            {order.delivery_instructions && (
              <View style={styles.instructionsContainer}>
                <MCIcon name="note-edit-outline" size={16} color="#1976d2" />
                <Text style={styles.instructionsText}>{order.delivery_instructions}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          <View style={styles.itemsCard}>
            {items.map((item, index) => (
              <View key={item.id}>
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemDetails}>
                      {item.quantity} {item.unit} × KES {item.unit_price.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtotal}>KES {item.subtotal.toLocaleString()}</Text>
                </View>
                {index < items.length - 1 && <View style={styles.itemDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>KES {order.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>KES {order.delivery_fee.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelTotal}>Total</Text>
            <Text style={styles.summaryValueTotal}>KES {order.total_amount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouchable} 
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
          />
        </View>

        <View style={styles.statusModalContent} pointerEvents="box-none">
          <View style={styles.statusModalHeader}>
            <Text style={styles.statusModalTitle}>Update Order Status</Text>
            <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.statusModalSubtitle}>Select new status for {order.order_number}</Text>

          <ScrollView style={styles.statusOptionsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {statusOptions.map((option) => {
              const isCurrentStatus = order.status === option.value
              const isDisabled = isCurrentStatus || updatingStatus

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.statusOption,
                    isCurrentStatus && styles.statusOptionCurrent,
                    isDisabled && styles.statusOptionDisabled,
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      updateOrderStatus(option.value)
                    }
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <View style={styles.statusOptionLeft}>
                    <View style={[styles.statusOptionIcon, { backgroundColor: option.color + '20' }]}>
                      <MCIcon name={option.icon} size={20} color={option.color} />
                    </View>
                    <View>
                      <Text style={[styles.statusOptionLabel, isCurrentStatus && styles.statusOptionLabelCurrent]}>
                        {option.label}
                      </Text>
                      {isCurrentStatus && (
                        <Text style={styles.statusOptionCurrentText}>Current Status</Text>
                      )}
                    </View>
                  </View>
                  {updatingStatus && isCurrentStatus ? (
                    <ActivityIndicator size="small" color={option.color} />
                  ) : (
                    <Ionicons
                      name={isCurrentStatus ? 'checkmark-circle' : 'chevron-forward'}
                      size={20}
                      color={isCurrentStatus ? option.color : '#9e9e9e'}
                    />
                  )}
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      </Modal>
    </LinearGradient>
  )
}

export default OrderDetailScreen

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 14, color: '#666' },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1b5e20' },
  backButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#2e7d32', borderRadius: 12 },
  backButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  statusCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCardTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  statusCardTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusCardValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  updateStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  updateStatusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },

  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 10,
  },

  customerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  customerAvatar: {
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 6,
  },
  customerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  customerDetailText: {
    fontSize: 13,
    color: '#666',
  },

  addressCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    lineHeight: 20,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
    backgroundColor: '#e3f2fd',
    padding: 10,
    borderRadius: 8,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 18,
  },

  itemsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b4332',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b4332',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },

  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryLabelTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b4332',
  },
  summaryValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2e7d32',
  },

  notesCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  statusModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
  },
  statusModalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  statusOptionsScroll: {
    maxHeight: 350,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  statusOptionCurrent: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  statusOptionDisabled: {
    opacity: 0.5,
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  statusOptionLabelCurrent: {
    color: '#2e7d32',
  },
  statusOptionCurrentText: {
    fontSize: 11,
    color: '#2e7d32',
    marginTop: 2,
  },
})
