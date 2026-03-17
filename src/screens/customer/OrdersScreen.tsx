import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../services/supabase'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit: string
  unit_price: number
  subtotal: number
}

interface Order {
  id: string
  order_number: string
  created_at: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  subtotal: number
  delivery_fee: number
  payment_method: string
  payment_status: string
  delivery_address: string
  delivery_instructions?: string
  items: OrderItem[]
}

const OrdersScreen = () => {
  const navigation = useNavigation()
  const [activeFilter, setActiveFilter] = useState('All')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('No user found')
        setLoading(false)
        return
      }

      // Fetch orders for this customer
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          created_at,
          status,
          total_amount,
          subtotal,
          delivery_fee,
          payment_method,
          payment_status,
          delivery_address,
          order_items (
            id,
            product_name,
            quantity,
            unit,
            unit_price,
            subtotal
          )
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        setLoading(false)
        return
      }

      // Transform orders for display
      const transformedOrders: Order[] = (ordersData || []).map(order => ({
        ...order,
        items: order.order_items || [],
      }))

      setOrders(transformedOrders)
    } catch (error) {
      console.error('Unexpected error fetching orders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchOrders()
  }

  const filteredOrders = activeFilter === 'All' ? orders : orders.filter(o => o.status === activeFilter)

  const filters = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#2E7D32'
      case 'processing': return '#1976D2'
      case 'shipped': return '#FF9800'
      case 'pending': return '#9E9E9E'
      case 'cancelled': return '#D32F2F'
      case 'confirmed': return '#1976D2'
      default: return '#9E9E9E'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return 'checkmark-circle'
      case 'processing': return 'settings'
      case 'shipped': return 'car'
      case 'pending': return 'time'
      case 'cancelled': return 'close-circle'
      case 'confirmed': return 'checkmark-done-circle'
      default: return 'time'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true 
    }
    const timeStr = date.toLocaleTimeString('en-US', timeOptions)
    
    if (isToday) {
      return `Today • ${timeStr}`
    }
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }
    return date.toLocaleDateString('en-US', dateOptions)
  }

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toFixed(2)}`
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailModalVisible(true)
  }

  const reorder = (order: Order) => {
    // Navigate to home or categories with items to add
    setDetailModalVisible(false)
    // In a real app, you would add all items from the order to cart
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => viewOrderDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderId}>{item.order_number}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.orderItem} numberOfLines={1}>
            • {orderItem.product_name} ({orderItem.quantity}{orderItem.unit})
          </Text>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>+ {item.items.length - 2} more items</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(item.total_amount)}</Text>
        </View>
        <TouchableOpacity style={styles.detailsBtn} onPress={() => viewOrderDetails(item)}>
          <Text style={styles.detailsBtnText}>View Details</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={22} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>
            {activeFilter === 'All'
              ? "You haven't placed any orders yet"
              : `No ${activeFilter.toLowerCase()} orders`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.filterModalContent}>
          <Text style={styles.filterModalTitle}>Filter Orders</Text>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterOption,
                activeFilter === filter && styles.activeFilterOption,
              ]}
              onPress={() => {
                setActiveFilter(filter)
                setFilterModalVisible(false)
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  activeFilter === filter && styles.activeFilterOptionText,
                ]}
              >
                {filter}
              </Text>
              {activeFilter === filter && (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Order Details Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedOrder && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>Order Details</Text>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#333" />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Order ID:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.order_number}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedOrder.created_at)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                      <Ionicons name={getStatusIcon(selectedOrder.status)} size={16} color={getStatusColor(selectedOrder.status)} />
                      <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={styles.itemText}>• {item.product_name}</Text>
                      <Text style={styles.itemQuantity}>{item.quantity} {item.unit} × KES {item.unit_price.toFixed(2)}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Delivery</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={18} color={PRIMARY} />
                    <Text style={styles.detailValue}>{selectedOrder.delivery_address}</Text>
                  </View>
                  {selectedOrder.delivery_instructions && (
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={18} color={PRIMARY} />
                      <Text style={styles.detailValue}>{selectedOrder.delivery_instructions}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Payment</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Method:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.payment_method}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.payment_status?.charAt(0).toUpperCase() + selectedOrder.payment_status?.slice(1) || 'Pending'}</Text>
                  </View>
                </View>

                <View style={styles.priceSummary}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Subtotal</Text>
                    <Text style={styles.priceValue}>{formatCurrency(selectedOrder.subtotal)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Delivery Fee</Text>
                    <Text style={styles.priceValue}>{formatCurrency(selectedOrder.delivery_fee)}</Text>
                  </View>
                  <View style={styles.priceDivider} />
                  <View style={styles.priceRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(selectedOrder.total_amount)}</Text>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.reorderBtn}
                    onPress={() => reorder(selectedOrder)}
                  >
                    <Ionicons name="cart-outline" size={20} color="#fff" />
                    <Text style={styles.reorderBtnText}>Reorder</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  )
}

export default OrdersScreen

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
  headerTitle: { fontSize: 24, fontWeight: '700', color: PRIMARY },
  filterBtn: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 12,
  },
  ordersList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: { flex: 1 },
  orderId: { fontSize: 16, fontWeight: '700', color: '#333' },
  orderDate: { fontSize: 12, color: '#888', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderItems: { marginBottom: 12 },
  orderItem: { fontSize: 14, color: '#555', marginBottom: 4 },
  moreItems: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalLabel: { fontSize: 12, color: '#888' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: PRIMARY },
  detailsBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 4,
  },
  detailsBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  activeFilterOption: {
    backgroundColor: PRIMARY,
  },
  filterOptionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  activeFilterOptionText: {
    color: '#fff',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  detailSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: { fontSize: 14, color: '#888', width: 80 },
  detailValue: { fontSize: 14, color: '#333', flex: 1 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 8,
  },
  itemText: { fontSize: 14, color: '#555', flex: 1 },
  itemQuantity: { fontSize: 12, color: '#888' },
  priceSummary: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  priceLabel: { fontSize: 14, color: '#666' },
  priceValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  priceDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  totalValue: { fontSize: 18, fontWeight: '700', color: PRIMARY },
  totalAmountLarge: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  detailActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  reorderBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  reorderBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
})
