import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'
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
  items?: OrderItem[]
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

const OrdersScreen = ({ navigation }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  const [activeFilter, setActiveFilter] = useState('All')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user.id)
        fetchOrders(user.id)
      }
    } catch (err: any) {
      console.error('Error getting user:', err.message)
      setLoading(false)
    }
  }

  const fetchOrders = async (sellerId: string) => {
    setLoading(true)
    try {
      // First fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!orders_customer_id_fkey (
            full_name,
            phone,
            email
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Then fetch order items for each order
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id)

          if (itemsError) {
            console.error('Error fetching items for order', order.id, itemsError)
            return { ...order, items: [] }
          }

          return { ...order, items: items || [] }
        })
      )

      setOrders(ordersWithItems)
    } catch (err: any) {
      console.error('Error fetching orders:', err.message)
      Alert.alert('Error', 'Failed to load orders: ' + err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    if (currentUser) fetchOrders(currentUser)
  }

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order)
    setDetailVisible(true)
  }

  const handleOrderPress = (order: Order) => {
    openDetailModal(order)
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
          ...(newStatus === 'cancelled' ? { cancelled_at: new Date().toISOString() } : {}),
        })
        .eq('id', orderId)

      if (error) throw error

      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, status: newStatus, updated_at: new Date().toISOString() } 
          : o
      ))
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }

      Alert.alert('Success', `Order status updated to ${getStatusLabel(newStatus)}`)
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update order status: ' + err.message)
    }
  }

  const filters = ['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

  const filteredOrders =
    activeFilter === 'All' ? orders : orders.filter(o => o.status === activeFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#2e7d32'
      case 'pending': return '#ff9800'
      case 'confirmed': return '#4caf50'
      case 'processing': return '#ff9800'
      case 'shipped': return '#1976d2'
      case 'cancelled': return '#c62828'
      default: return '#999'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleOrderPress(item)}
    >
      <Animated.View
        style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>{item.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        {/* Items List Preview */}
        <View style={styles.itemsContainer}>
          {item.items && item.items.length > 0 ? (
            item.items.slice(0, 2).map((orderItem: OrderItem, index: number) => (
              <View key={orderItem.id} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <MCIcon name="cart-outline" size={14} color="#666" />
                  <Text style={styles.itemName} numberOfLines={1}>
                    {orderItem.product_name}
                  </Text>
                </View>
                <Text style={styles.itemQuantity}>
                  {orderItem.quantity} {orderItem.unit}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No items</Text>
          )}
          {item.items && item.items.length > 2 && (
            <Text style={styles.moreItemsText}>
              +{item.items.length - 2} more item(s)
            </Text>
          )}
        </View>

        <Text style={styles.customerName}>
          {item.customer?.full_name || 'Customer'}
        </Text>
        
        <View style={styles.customerMeta}>
          <Ionicons name="call-outline" size={12} color="#666" />
          <Text style={styles.customerPhone}>{item.customer?.phone || 'N/A'}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.total}>KES {item.total_amount.toLocaleString()}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>Order Date</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        <View style={styles.paymentRow}>
          <View style={styles.paymentBadge}>
            <MCIcon 
              name={item.payment_status === 'paid' ? 'check-circle' : 'time-outline'} 
              size={12} 
              color={item.payment_status === 'paid' ? '#2e7d32' : '#ff9800'} 
            />
            <Text style={[
              styles.paymentStatus,
              { color: item.payment_status === 'paid' ? '#2e7d32' : '#ff9800' }
            ]}>
              {getStatusLabel(item.payment_status)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9e9e9e" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  )

  // Open filter modal
  const toggleFilterModal = () => setFilterModalVisible(!filterModalVisible)

  const selectFilter = (filter: string) => {
    setActiveFilter(filter)
    setFilterModalVisible(false)
  }

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Orders</Text>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFilterModal}>
            <Ionicons name="filter-outline" size={22} color="#1b5e20" />
          </TouchableOpacity>
        </Animated.View>

        {/* Orders List */}
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#bdbdbd" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>
              {activeFilter === 'All' ? 'You have no orders yet' : `No ${activeFilter} orders`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#2e7d32"
                colors={['#2e7d32']}
              />
            }
          />
        )}

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>

          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Orders</Text>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterOption,
                  activeFilter === filter && styles.activeFilterOption,
                ]}
                onPress={() => selectFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    activeFilter === filter && styles.activeFilterOptionText,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>

        {/* Order Detail Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={detailVisible}
          onRequestClose={() => setDetailVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.detailModalContainer}
          >
            <LinearGradient colors={['#ffffff', '#f3fff4']} style={styles.detailModalContent}>
              {selectedOrder && (
                <>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailTitle}>Order Details</Text>
                    <TouchableOpacity onPress={() => setDetailVisible(false)}>
                      <Ionicons name="close-circle" size={32} color="#1b5e20" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {/* Order Number & Status */}
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Ionicons name="receipt-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailLabel}>Order Number:</Text>
                        <Text style={styles.detailValue}>{selectedOrder.order_number}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20', marginTop: 8, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                          {getStatusLabel(selectedOrder.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Customer Information */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Customer Information</Text>
                      <View style={styles.detailRow}>
                        <Ionicons name="person-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailLabel}>Name:</Text>
                        <Text style={styles.detailValue}>{selectedOrder.customer?.full_name || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="call-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailLabel}>Phone:</Text>
                        <Text style={styles.detailValue}>{selectedOrder.customer?.phone || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailLabel}>Email:</Text>
                        <Text style={styles.detailValue}>{selectedOrder.customer?.email || 'N/A'}</Text>
                      </View>
                    </View>

                    {/* Delivery Address */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Delivery Address</Text>
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailValue}>{selectedOrder.delivery_address}</Text>
                      </View>
                      {selectedOrder.delivery_instructions && (
                        <View style={styles.instructionsBox}>
                          <Ionicons name="information-circle-outline" size={16} color="#1976d2" />
                          <Text style={styles.instructionsText}>{selectedOrder.delivery_instructions}</Text>
                        </View>
                      )}
                    </View>

                    {/* Order Items */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Order Items</Text>
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item: OrderItem) => (
                          <View key={item.id} style={styles.itemDetailRow}>
                            <View style={styles.itemDetailLeft}>
                              <MCIcon name="cart-check" size={16} color="#2e7d32" />
                              <Text style={styles.itemDetailName}>{item.product_name}</Text>
                            </View>
                            <View style={styles.itemDetailRight}>
                              <Text style={styles.itemDetailQuantity}>{item.quantity} {item.unit}</Text>
                              <Text style={styles.itemDetailPrice}>KES {item.subtotal.toLocaleString()}</Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noItemsText}>No items in this order</Text>
                      )}
                    </View>

                    {/* Payment Information */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Payment Information</Text>
                      <View style={styles.detailRow}>
                        <Ionicons name="wallet-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailLabel}>Payment Method:</Text>
                        <Text style={styles.detailValue}>{selectedOrder.payment_method || 'N/A'}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={selectedOrder.payment_status === 'paid' ? '#2e7d32' : '#ff9800'} />
                        <Text style={styles.detailLabel}>Payment Status:</Text>
                        <Text style={[styles.detailValue, { color: selectedOrder.payment_status === 'paid' ? '#2e7d32' : '#ff9800' }]}>
                          {getStatusLabel(selectedOrder.payment_status)}
                        </Text>
                      </View>
                    </View>

                    {/* Order Summary */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Order Summary</Text>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal:</Text>
                        <Text style={styles.summaryValue}>KES {selectedOrder.subtotal.toLocaleString()}</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                        <Text style={styles.summaryValue}>KES {selectedOrder.delivery_fee.toLocaleString()}</Text>
                      </View>
                      <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Amount:</Text>
                        <Text style={styles.totalValue}>KES {selectedOrder.total_amount.toLocaleString()}</Text>
                      </View>
                    </View>

                    {/* Order Date */}
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={20} color="#1b5e20" />
                        <Text style={styles.detailLabel}>Order Date:</Text>
                        <Text style={styles.detailValue}>{formatDate(selectedOrder.created_at)}</Text>
                      </View>
                    </View>

                    {/* Status Update Buttons */}
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Update Order Status</Text>
                      <View style={styles.statusButtons}>
                        {selectedOrder.status !== 'pending' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                          <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: '#ff9800' }]}
                            onPress={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                          >
                            <Ionicons name="construct-outline" size={18} color="#ffffff" />
                            <Text style={styles.statusButtonText}>Mark as Processing</Text>
                          </TouchableOpacity>
                        )}
                        {selectedOrder.status !== 'pending' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                          <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: '#1976d2' }]}
                            onPress={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                          >
                            <Ionicons name="bike-outline" size={18} color="#ffffff" />
                            <Text style={styles.statusButtonText}>Mark as Shipped</Text>
                          </TouchableOpacity>
                        )}
                        {selectedOrder.status !== 'pending' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                          <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: '#2e7d32' }]}
                            onPress={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                          >
                            <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                            <Text style={styles.statusButtonText}>Mark as Delivered</Text>
                          </TouchableOpacity>
                        )}
                        {selectedOrder.status !== 'pending' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                          <TouchableOpacity
                            style={[styles.statusButton, { backgroundColor: '#c62828' }]}
                            onPress={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                          >
                            <Ionicons name="close-circle-outline" size={18} color="#ffffff" />
                            <Text style={styles.statusButtonText}>Cancel Order</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </ScrollView>
                </>
              )}
            </LinearGradient>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </LinearGradient>
  )
}

export default OrdersScreen

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#1b5e20' },
  iconButton: { backgroundColor: '#ffffff', padding: 10, borderRadius: 12, elevation: 3 },

  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontWeight: '700', fontSize: 14, color: '#444' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  
  // Items Container
  itemsContainer: { 
    backgroundColor: '#f9f9f9', 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 6,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  itemName: { 
    fontSize: 13, 
    fontWeight: '500', 
    color: '#333',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  noItemsText: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  moreItemsText: { fontSize: 11, color: '#2e7d32', fontWeight: '600', marginTop: 4 },

  customerName: { fontSize: 16, fontWeight: '800', color: '#1b5e20', marginBottom: 4 },
  customerMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  customerPhone: { fontSize: 12, color: '#666' },
  
  bottomRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: { fontSize: 10, color: '#666', marginBottom: 2 },
  total: { fontWeight: '800', fontSize: 16, color: '#000' },
  dateContainer: { alignItems: 'flex-end' },
  dateLabel: { fontSize: 10, color: '#666', marginBottom: 2 },
  date: { fontSize: 12, color: '#888' },
  
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentStatus: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Loading & Empty States
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingText: { marginTop: 16, fontSize: 14, color: '#666' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyTitle: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#1b5e20' },
  emptyText: { marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { position: 'absolute', top: '30%', left: '10%', width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1b5e20', marginBottom: 16, textAlign: 'center' },
  filterOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 10, backgroundColor: '#e8f5e9' },
  activeFilterOption: { backgroundColor: '#2e7d32' },
  filterOptionText: { color: '#1b5e20', fontWeight: '600', textAlign: 'center' },
  activeFilterOptionText: { color: '#fff' },

  // Detail Modal Styles
  detailModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000066' },
  detailModalContent: { width: '95%', maxHeight: '90%', borderRadius: 16, padding: 20, elevation: 6 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  detailTitle: { fontSize: 20, fontWeight: '800', color: '#1b5e20' },
  detailSection: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  detailSectionTitle: { fontSize: 16, fontWeight: '700', color: '#1b5e20', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  detailLabel: { fontSize: 14, color: '#666', fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1 },
  instructionsBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#e3f2fd', padding: 10, borderRadius: 8, marginTop: 8 },
  instructionsText: { fontSize: 13, color: '#1565c0', flex: 1, fontStyle: 'italic' },
  itemDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 8 },
  itemDetailLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  itemDetailName: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemDetailRight: { alignItems: 'flex-end' },
  itemDetailQuantity: { fontSize: 13, color: '#666', fontWeight: '600' },
  itemDetailPrice: { fontSize: 13, color: '#2e7d32', fontWeight: '700', marginTop: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 10, marginTop: 6 },
  totalValue: { fontSize: 18, color: '#2e7d32', fontWeight: '800' },
  statusButtons: { gap: 10 },
  statusButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  statusButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})