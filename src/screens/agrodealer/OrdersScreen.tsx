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
  ScrollView,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'

const PRIMARY = '#2196F3'
const ACCENT = '#1976D2'

interface Order {
  id: string
  buyer: string
  buyerPhone: string
  items: { name: string; quantity: string; price: string }[]
  total: string
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  date: string
  deliveryAddress: string
  paymentMethod: string
  paymentStatus: 'Paid' | 'Pending' | 'Partial'
}

const OrdersScreen = () => {
  const [activeFilter, setActiveFilter] = useState('All')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [statusModalVisible, setStatusModalVisible] = useState(false)

  const orders: Order[] = [
    {
      id: 'AGRO-2024-001',
      buyer: 'Green Valley Farm',
      buyerPhone: '+254 712 345 678',
      items: [
        { name: 'NPK Fertilizer 50kg', quantity: '10 bags', price: 'KES 4,500/bag' },
        { name: 'Urea Fertilizer 50kg', quantity: '5 bags', price: 'KES 3,800/bag' },
      ],
      total: 'KES 64,000',
      status: 'Confirmed',
      date: 'Feb 25, 2024 • 9:30 AM',
      deliveryAddress: 'Green Valley Farm, Nakuru County',
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'Paid',
    },
    {
      id: 'AGRO-2024-002',
      buyer: 'Sunrise Cooperative',
      buyerPhone: '+254 723 456 789',
      items: [
        { name: 'Maize Seeds Hybrid', quantity: '20 kg', price: 'KES 850/kg' },
        { name: 'Bean Seeds', quantity: '15 kg', price: 'KES 450/kg' },
        { name: 'Pesticide Spray', quantity: '10 L', price: 'KES 1,200/L' },
      ],
      total: 'KES 35,750',
      status: 'Pending',
      date: 'Feb 25, 2024 • 11:15 AM',
      deliveryAddress: 'Sunrise Cooperative, Eldoret',
      paymentMethod: 'M-Pesa',
      paymentStatus: 'Pending',
    },
    {
      id: 'AGRO-2024-003',
      buyer: 'Fresh Produce Ltd',
      buyerPhone: '+254 734 567 890',
      items: [
        { name: 'Tomato Seeds', quantity: '5 packs', price: 'KES 2,500/pack' },
        { name: 'Onion Seeds', quantity: '3 packs', price: 'KES 1,800/pack' },
      ],
      total: 'KES 17,900',
      status: 'Processing',
      date: 'Feb 24, 2024 • 2:45 PM',
      deliveryAddress: 'Fresh Produce Ltd, Nairobi',
      paymentMethod: 'Cash',
      paymentStatus: 'Partial',
    },
    {
      id: 'AGRO-2024-004',
      buyer: 'Highland Farmers Group',
      buyerPhone: '+254 745 678 901',
      items: [
        { name: 'DAP Fertilizer 50kg', quantity: '25 bags', price: 'KES 5,200/bag' },
        { name: 'CAN Fertilizer 50kg', quantity: '15 bags', price: 'KES 4,000/bag' },
      ],
      total: 'KES 190,000',
      status: 'Shipped',
      date: 'Feb 23, 2024 • 10:00 AM',
      deliveryAddress: 'Highland Farmers, Nyeri County',
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'Paid',
    },
    {
      id: 'AGRO-2024-005',
      buyer: 'Organic Farms Kenya',
      buyerPhone: '+254 756 789 012',
      items: [
        { name: 'Organic Manure', quantity: '50 bags', price: 'KES 800/bag' },
        { name: 'Compost', quantity: '30 bags', price: 'KES 600/bag' },
      ],
      total: 'KES 58,000',
      status: 'Delivered',
      date: 'Feb 20, 2024 • 8:30 AM',
      deliveryAddress: 'Organic Farms, Kiambu County',
      paymentMethod: 'M-Pesa',
      paymentStatus: 'Paid',
    },
  ]

  const filters = ['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
  const statusOptions = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

  const filteredOrders = activeFilter === 'All' ? orders : orders.filter(o => o.status === activeFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return '#2E7D32'
      case 'Confirmed': return '#1976D2'
      case 'Processing': return '#FF9800'
      case 'Shipped': return '#7B1FA2'
      case 'Pending': return '#9E9E9E'
      case 'Cancelled': return '#D32F2F'
      default: return '#9E9E9E'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Delivered': return 'checkmark-done-circle'
      case 'Confirmed': return 'checkmark-circle'
      case 'Processing': return 'construct'
      case 'Shipped': return 'car'
      case 'Pending': return 'time'
      case 'Cancelled': return 'close-circle'
      default: return 'time'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return '#2E7D32'
      case 'Pending': return '#FF9800'
      case 'Partial': return '#1976D2'
      default: return '#9E9E9E'
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailModalVisible(true)
  }

  const updateOrderStatus = (newStatus: string) => {
    if (selectedOrder) {
      // In a real app, update the order status in the database
      setSelectedOrder({ ...selectedOrder, status: newStatus as Order['status'] })
      setStatusModalVisible(false)
      setDetailModalVisible(false)
    }
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
          <Text style={styles.buyerName}>{item.buyer}</Text>
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
            • {orderItem.name} ({orderItem.quantity})
          </Text>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>+ {item.items.length - 2} more items</Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment:</Text>
            <Text style={[styles.paymentValue, { color: getPaymentStatusColor(item.paymentStatus) }]}>
              {item.paymentStatus}
            </Text>
          </View>
          <Text style={styles.totalAmount}>{item.total}</Text>
        </View>
        <TouchableOpacity style={styles.detailsBtn} onPress={() => viewOrderDetails(item)}>
          <Text style={styles.detailsBtnText}>Details</Text>
          <Ionicons name="chevron-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={['#E3F2FD', '#BBDEFB', '#90CAF9']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={22} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'Pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxActive]}>
          <Text style={[styles.statValue, { color: '#fff' }]}>
            {orders.filter(o => ['Confirmed', 'Processing'].includes(o.status)).length}
          </Text>
          <Text style={[styles.statLabel, { color: '#fff' }]}>In Progress</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'Delivered').length}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>
            {activeFilter === 'All'
              ? "You haven't received any orders yet"
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

                <ScrollView showsVerticalScrollIndicator={false}>
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
                    <Text style={styles.sectionTitle}>Buyer Information</Text>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={18} color={PRIMARY} />
                      <Text style={styles.detailValue}>{selectedOrder.buyer}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="call-outline" size={18} color={PRIMARY} />
                      <Text style={styles.detailValue}>{selectedOrder.buyerPhone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={18} color={PRIMARY} />
                      <Text style={styles.detailValue}>{selectedOrder.deliveryAddress}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {selectedOrder.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemQty}>{item.quantity}</Text>
                        <Text style={styles.itemPrice}>{item.price}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>Payment</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Method:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.paymentMethod}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={[styles.detailValue, { color: getPaymentStatusColor(selectedOrder.paymentStatus) }]}>
                        {selectedOrder.paymentStatus}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total:</Text>
                      <Text style={styles.totalAmountLarge}>{selectedOrder.total}</Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.statusBtn}
                    onPress={() => setStatusModalVisible(true)}
                  >
                    <Ionicons name="refresh-outline" size={20} color="#fff" />
                    <Text style={styles.statusBtnText}>Update Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.callBtn}>
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles.callBtnText}>Call Buyer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.statusModalContent}>
          <Text style={styles.statusModalTitle}>Update Order Status</Text>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusOption,
                selectedOrder?.status === status && { backgroundColor: getStatusColor(status) },
              ]}
              onPress={() => updateOrderStatus(status)}
            >
              <Text style={[
                styles.statusOptionText,
                selectedOrder?.status === status && { color: '#fff' },
              ]}>
                {status}
              </Text>
              {selectedOrder?.status === status && (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
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
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statBoxActive: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: PRIMARY },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
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
  orderId: { fontSize: 15, fontWeight: '700', color: '#333' },
  buyerName: { fontSize: 14, color: '#555', marginTop: 2 },
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
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  paymentLabel: { fontSize: 12, color: '#888' },
  paymentValue: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: { fontSize: 14, fontWeight: '500', color: '#333', flex: 1 },
  itemQty: { fontSize: 14, color: '#888', marginHorizontal: 12 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  totalAmountLarge: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  detailActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  statusBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  callBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statusModalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
  },
  statusModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusOptionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
})
