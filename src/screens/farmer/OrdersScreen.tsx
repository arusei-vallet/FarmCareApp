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
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'

const OrdersScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  const [activeFilter, setActiveFilter] = useState('All')
  const [filterModalVisible, setFilterModalVisible] = useState(false)

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

  const orders = [
    { id: 'ORD-1021', product: 'Fresh Tomatoes', buyer: 'Green Market Ltd', total: 'KES 1,500', status: 'Delivered', date: 'Today, 10:30 AM' },
    { id: 'ORD-1022', product: 'Maize (50kg)', buyer: 'City Grocers', total: 'KES 3,200', status: 'Processing', date: 'Yesterday' },
    { id: 'ORD-1023', product: 'Red Onions', buyer: 'Fresh Basket', total: 'KES 980', status: 'Shipped', date: 'Feb 21' },
  ]

  const filters = ['All', 'Processing', 'Shipped', 'Delivered']

  const filteredOrders =
    activeFilter === 'All' ? orders : orders.filter(o => o.status === activeFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return '#2e7d32'
      case 'Processing': return '#ff9800'
      case 'Shipped': return '#1976d2'
      default: return '#999'
    }
  }

  const renderItem = ({ item }: any) => (
    <Animated.View
      style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderId}>{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.product}>{item.product}</Text>
      <Text style={styles.meta}>{item.buyer}</Text>

      <View style={styles.bottomRow}>
        <Text style={styles.total}>{item.total}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
    </Animated.View>
  )

  // Open filter modal
  const toggleFilterModal = () => setFilterModalVisible(!filterModalVisible)

  const selectFilter = (filter: string) => {
    setActiveFilter(filter)
    setFilterModalVisible(false)
  }

  return (
    <LinearGradient colors={['#f4fbf6', '#e8f5e9']} style={{ flex: 1 }}>
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
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        />

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
  product: { fontSize: 16, fontWeight: '800', color: '#1b5e20', marginBottom: 4 },
  meta: { fontSize: 13, color: '#6b8f73', marginBottom: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  total: { fontWeight: '800', fontSize: 15, color: '#000' },
  date: { fontSize: 12, color: '#888' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  modalContent: { position: 'absolute', top: '30%', left: '10%', width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1b5e20', marginBottom: 16, textAlign: 'center' },
  filterOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 10, backgroundColor: '#e8f5e9' },
  activeFilterOption: { backgroundColor: '#2e7d32' },
  filterOptionText: { color: '#1b5e20', fontWeight: '600', textAlign: 'center' },
  activeFilterOptionText: { color: '#fff' },
})