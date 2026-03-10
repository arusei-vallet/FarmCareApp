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
  Switch,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../services/supabase'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

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

const DeliveryAddressesScreen = () => {
  const navigation = useNavigation()
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null)

  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    county: '',
    phone: '',
    is_default: false,
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .eq('customer_id', user.id)
        .order('is_default', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error: any) {
      console.log('Error fetching addresses:', error.message)
      Alert.alert('Error', 'Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingAddress(null)
    setFormData({
      label: '',
      address_line1: '',
      address_line2: '',
      city: '',
      county: '',
      phone: '',
      is_default: false,
    })
    setModalVisible(true)
  }

  const openEditModal = (address: DeliveryAddress) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      county: address.county || '',
      phone: address.phone,
      is_default: address.is_default,
    })
    setModalVisible(true)
  }

  const saveAddress = async () => {
    if (!formData.label || !formData.address_line1 || !formData.city || !formData.phone) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('delivery_addresses')
          .update({
            label: formData.label,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2 || null,
            city: formData.city,
            county: formData.county || null,
            phone: formData.phone,
            is_default: formData.is_default,
          })
          .eq('id', editingAddress.id)

        if (error) throw error
        Alert.alert('Success', 'Address updated successfully')
      } else {
        // Add new address
        const { error } = await supabase
          .from('delivery_addresses')
          .insert({
            customer_id: user.id,
            label: formData.label,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2 || null,
            city: formData.city,
            county: formData.county || null,
            phone: formData.phone,
            is_default: formData.is_default,
          })

        if (error) throw error
        Alert.alert('Success', 'Address added successfully')
      }

      setModalVisible(false)
      fetchAddresses()
    } catch (error: any) {
      console.log('Error saving address:', error.message)
      Alert.alert('Error', 'Failed to save address')
    }
  }

  const deleteAddress = (address: DeliveryAddress) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('delivery_addresses')
              .delete()
              .eq('id', address.id)

            if (error) throw error
            Alert.alert('Success', 'Address deleted successfully')
            fetchAddresses()
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete address')
          }
        },
      },
    ])
  }

  const setDefaultAddress = async (address: DeliveryAddress) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // First, unset all default addresses
      await supabase
        .from('delivery_addresses')
        .update({ is_default: false })
        .eq('customer_id', user.id)

      // Then set this one as default
      const { error } = await supabase
        .from('delivery_addresses')
        .update({ is_default: true })
        .eq('id', address.id)

      if (error) throw error
      fetchAddresses()
    } catch (error: any) {
      Alert.alert('Error', 'Failed to set default address')
    }
  }

  if (loading) {
    return (
      <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading addresses...</Text>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Addresses</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Addresses List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Addresses Yet</Text>
            <Text style={styles.emptyText}>
              Add your first delivery address to start receiving orders
            </Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={openAddModal}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addFirstBtnText}>Add Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressLabelContainer}>
                  <Ionicons name="pricetag-outline" size={18} color={PRIMARY} />
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  {address.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.addressActions}>
                  {!address.is_default && (
                    <TouchableOpacity
                      onPress={() => setDefaultAddress(address)}
                      style={styles.actionBtn}
                    >
                      <Ionicons name="star-outline" size={20} color="#FF9800" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => openEditModal(address)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="create-outline" size={20} color={PRIMARY} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteAddress(address)}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.addressContent}>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={18} color="#666" />
                  <Text style={styles.addressText}>
                    {address.address_line1}
                    {address.address_line2 ? `, ${address.address_line2}` : ''}
                  </Text>
                </View>
                <View style={styles.addressRow}>
                  <Ionicons name="city-outline" size={18} color="#666" />
                  <Text style={styles.addressText}>
                    {address.city}
                    {address.county ? `, ${address.county}` : ''}
                  </Text>
                </View>
                <View style={styles.addressRow}>
                  <Ionicons name="call-outline" size={18} color="#666" />
                  <Text style={styles.addressText}>{address.phone}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add/Edit Address Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Label *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Home, Work, Office"
                  value={formData.label}
                  onChangeText={(text) => setFormData({ ...formData, label: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address Line 1 *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Street address, building number"
                  value={formData.address_line1}
                  onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Address Line 2</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Apartment, suite, floor (optional)"
                  value={formData.address_line2}
                  onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>City *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nairobi"
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                  />
                </View>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>County</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nairobi"
                    value={formData.county}
                    onChangeText={(text) => setFormData({ ...formData, county: text })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0712 345 678"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.label}>Set as Default Address</Text>
                  <Switch
                    value={formData.is_default}
                    onValueChange={(value) => setFormData({ ...formData, is_default: value })}
                    trackColor={{ false: '#ccc', true: PRIMARY }}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveAddress}>
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  )
}

export default DeliveryAddressesScreen

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addFirstBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  addFirstBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  addressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
  },
  defaultBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  addressContent: {
    gap: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
