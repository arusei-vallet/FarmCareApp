import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

interface Order {
  id: string
  date: string
  items: string[]
  total: string
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  deliveryAddress: string
  paymentMethod: string
}

const OrdersScreen = () => {
  const navigation = useNavigation()
  const [activeFilter, setActiveFilter] = useState('All')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const orders: Order[] = [
    {
      id: 'ORD-2024-001',
      date: 'Feb 25, 2024 • 10:30 AM',
      items: ['Fresh Tomatoes (2kg)', 'Red Onions (1kg)', 'Green Cabbage (1pc)'],
      total: 'KES 340',
      status: 'Delivered',
      deliveryAddress: '123 Moi Avenue, Nairobi',
      paymentMethod: 'M-Pesa',
    },
    {
      id: 'ORD-2024-002',
      date: 'Feb 24, 2024 • 3:45 PM',
      items: ['Maize Flour (2kg)', 'Green Grams (1kg)', 'Fresh Milk (2L)'],
      total: 'KES 520',
      status: 'Shipped',
      deliveryAddress: '456 Kenyatta Road, Mombasa',
      paymentMethod: 'Card',
    },
    {
      id: 'ORD-2024-003',
      date: 'Feb 23, 2024 • 9:15 AM',
      items: ['Fresh Avocado (4pcs)', 'Ripe Mangoes (2kg)', 'Bananas (1 bunch)'],
      total: 'KES 280',
      status: 'Processing',
      deliveryAddress: '789 Uhuru Highway, Kisumu',
      paymentMethod: 'M-Pesa',
    },
    {
      id: 'ORD-2024-004',
      date: 'Feb 22, 2024 • 2:00 PM',
      items: ['Irish Potatoes (3kg)', 'Carrots (1kg)', 'Fresh Spinach (2 bunches)'],
      total: 'KES 410',
      status: 'Pending',
      deliveryAddress: '321 Garden Estate, Nakuru',
      paymentMethod: 'Cash on Delivery',
    },
    {
      id: 'ORD-2024-005',
      date: 'Feb 20, 2024 • 11:20 AM',
      items: ['Chicken Whole (1pc)', 'Fresh Eggs (30pcs)', 'Fresh Milk (1L)'],
      total: 'KES 920',
      status: 'Delivered',
      deliveryAddress: '567 Lake View, Eldoret',
      paymentMethod: 'M-Pesa',
    },
  ]

  const filters = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

  const filteredOrders = activeFilter === 'All' ? orders : orders.filter(o => o.status === activeFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return '#2E7D32'
      case 'Processing': return '#1976D2'
      case 'Shipped': return '#FF9800'
      case 'Pending': return '#9E9E9E'
      case 'Cancelled': return '#D32F2F'
      default: return '#9E9E9E'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return 'checkmark-circle'
      case 'Processing': return 'settings'
      case 'Shipped': return 'car'
      case 'Pending': return 'time'
      case 'Cancelled': return 'close-circle'
      default: return 'time'
    }
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
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={styles.orderDate}>{item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.slice(0, 2).map((orderItem, index) => (
          <Text key={index} style={styles.orderItem} numberOfLines={1}>
            • {orderItem}
          </Text>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>+ {item.items.length - 2} more items</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{item.total}</Text>
        </View>
        <TouchableOpacity style={styles.detailsBtn} onPress={() => viewOrderDetails(item)}>
          <Text style={styles.detailsBtnText}>View Details</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={['#e6f5e6', '#c8e6c9', '#a5d6a7']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={22} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
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
                    <Text style={styles.detailValue}>{selectedOrder.id}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                      <Ionicons name={getStatusIcon(selectedOrder.status)} size={16} color={getStatusColor(selectedOrder.status)} />
                      <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                        {selectedOrder.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Items</Text>
                  {selectedOrder.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>• {item}</Text>
                  ))}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Delivery</Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={18} color={PRIMARY} />
                    <Text style={styles.detailValue}>{selectedOrder.deliveryAddress}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Payment</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Method:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.paymentMethod}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total:</Text>
                    <Text style={styles.totalAmountLarge}>{selectedOrder.total}</Text>
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
  itemText: { fontSize: 14, color: '#555', marginBottom: 6, marginLeft: 8 },
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
