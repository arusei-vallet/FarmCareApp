import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { useCart, CartItem } from './CartContext'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

const CartScreen: React.FC = () => {
  const navigation = useNavigation()
  const { cartItems, removeItem, decreaseQuantity, clearCart } = useCart()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0
      return sum + price * item.quantity
    }, 0)
  }

  const deliveryFee = calculateSubtotal() > 1000 ? 0 : 150
  const total = calculateSubtotal() + deliveryFee

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Add items to your cart before checkout')
      return
    }
    // Navigate to Checkout in parent navigator
    const parentNav = navigation.getParent()
    if (parentNav) {
      parentNav.navigate('Checkout', { total, items: cartItems })
    } else {
      Alert.alert('Error', 'Unable to navigate to checkout')
    }
  }

  const toggleSelectItem = (itemName: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemName)) {
      newSelected.delete(itemName)
    } else {
      newSelected.add(itemName)
    }
    setSelectedItems(newSelected)
  }

  const selectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.name)))
    }
  }

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const isSelected = selectedItems.has(item.name)

    return (
      <View style={[styles.cartItem, isSelected && styles.cartItemSelected]}>
        <TouchableOpacity
          style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          onPress={() => toggleSelectItem(item.name)}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </TouchableOpacity>

        <View style={styles.itemImage}>
          <Ionicons name="leaf-outline" size={32} color={PRIMARY} />
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>{item.price}</Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => decreaseQuantity(item.name)}
            >
              <Ionicons name="remove" size={18} color={PRIMARY} />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.quantityBtn}
              onPress={() => {}}
            >
              <Ionicons name="add" size={18} color={PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalAmount}>
            KES {((parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0) * item.quantity).toFixed(2)}
          </Text>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeItem(item.name)}
          >
            <Ionicons name="trash-outline" size={20} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (cartItems.length === 0) {
    return (
      <LinearGradient colors={['#e6f5e6', '#c8e6c9', '#a5d6a7']} style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={80} color={PRIMARY} />
          </View>
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptyText}>
            Looks like you haven't added anything to your cart yet
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={['#e6f5e6', '#c8e6c9', '#a5d6a7']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart ({cartItems.length})</Text>
        <TouchableOpacity onPress={selectAll}>
          <Text style={styles.selectAllText}>
            {selectedItems.size === cartItems.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCartItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.cartList}
      />

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>KES {calculateSubtotal().toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery Fee</Text>
          <Text style={styles.summaryValue}>
            {deliveryFee === 0 ? (
              <Text style={styles.freeText}>FREE</Text>
            ) : (
              `KES ${deliveryFee}`
            )}
          </Text>
        </View>

        {deliveryFee > 0 && (
          <View style={styles.deliveryNote}>
            <Ionicons name="information-circle" size={16} color={PRIMARY} />
            <Text style={styles.deliveryNoteText}>
              Free delivery on orders over KES 1,000
            </Text>
          </View>
        )}

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>KES {total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Checkout Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  )
}

export default CartScreen

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
  headerTitle: { fontSize: 22, fontWeight: '700', color: PRIMARY },
  selectAllText: { fontSize: 14, color: PRIMARY, fontWeight: '600' },
  cartList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cartItemSelected: {
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemDetails: { flex: 1 },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: '600',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    alignItems: 'flex-end',
  },
  itemTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 8,
  },
  removeBtn: {
    padding: 4,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  freeText: {
    color: ACCENT,
    fontWeight: '700',
  },
  deliveryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  deliveryNoteText: {
    fontSize: 12,
    color: PRIMARY,
    flex: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    gap: 12,
  },
  clearBtn: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  clearBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  checkoutBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  checkoutBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
  },
  shopBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
