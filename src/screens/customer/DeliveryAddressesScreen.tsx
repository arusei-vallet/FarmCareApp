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
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../services/supabase'

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

  // County and location selection state
  const [countyModalVisible, setCountyModalVisible] = useState(false)
  const [locationModalVisible, setLocationModalVisible] = useState(false)
  const [searchCounty, setSearchCounty] = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')

  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
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
      city: '',
      county: '',
      phone: '',
      is_default: false,
    })
    setSelectedCounty('')
    setSelectedLocation('')
    setSearchCounty('')
    setModalVisible(true)
  }

  const openEditModal = (address: DeliveryAddress) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      address_line1: address.city,
      city: address.city,
      county: address.county || '',
      phone: address.phone,
      is_default: address.is_default,
    })
    setSelectedCounty(address.county || '')
    setSelectedLocation(address.city)
    setModalVisible(true)
  }

  const saveAddress = async () => {
    console.log('Saving address:', formData)

    if (!formData.label || !formData.county || !formData.city || !formData.phone) {
      Alert.alert('Error', 'Please fill all required fields')
      console.log('Validation failed - missing fields')
      return
    }

    // Validate phone number
    const phoneRegex = /^(\+254|0)?[17]\d{8}$/
    const cleanedPhone = formData.phone.replace(/\s/g, '').replace(/\D/g, '')
    if (!phoneRegex.test(cleanedPhone) || cleanedPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number (e.g., 0712 345 678)')
      console.log('Validation failed - invalid phone:', cleanedPhone)
      return
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.log('Auth error:', authError?.message)
        Alert.alert('Error', 'Please login to save address')
        return
      }

      console.log('Auth user ID:', user.id)

      // First, check if user profile exists in public.users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.log('Profile not found, creating one...')
        // Create user profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            role: 'customer',
            created_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
          Alert.alert('Error', 'Failed to create user profile: ' + insertError.message)
          return
        }
        console.log('Profile created successfully')
      }

      console.log('Using customer_id:', user.id)

      // Format phone number properly
      let formattedPhone = cleanedPhone
      if (cleanedPhone.startsWith('0')) {
        formattedPhone = '254' + cleanedPhone.substring(1)
      } else if (cleanedPhone.startsWith('254')) {
        formattedPhone = cleanedPhone
      } else {
        formattedPhone = '254' + cleanedPhone
      }

      console.log('Saving with data:', {
        customer_id: user.id,
        label: formData.label,
        address_line1: formData.city,
        city: formData.city,
        county: formData.county,
        phone: formattedPhone,
      })

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('delivery_addresses')
          .update({
            label: formData.label,
            address_line1: formData.city,
            city: formData.city,
            county: formData.county || null,
            phone: formattedPhone,
            is_default: formData.is_default,
          })
          .eq('id', editingAddress.id)

        if (error) {
          console.log('Update error:', error)
          throw error
        }
        console.log('Address updated successfully')
      } else {
        // Add new address
        const { error } = await supabase
          .from('delivery_addresses')
          .insert({
            customer_id: customerId,
            label: formData.label,
            address_line1: formData.city,
            city: formData.city,
            county: formData.county || null,
            phone: formattedPhone,
            is_default: formData.is_default,
          })

        if (error) {
          console.log('Insert error:', error)
          throw error
        }
        console.log('Address inserted successfully')
      }

      setModalVisible(false)
      await fetchAddresses()
      
      Alert.alert('Success', editingAddress ? 'Address updated successfully' : 'Address added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])
    } catch (error: any) {
      console.log('Error saving address:', error.message, error)
      Alert.alert('Error', 'Failed to save address: ' + error.message)
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
                <Text style={styles.label}>County *</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  onPress={() => setCountyModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={selectedCounty ? styles.selectorInputText : styles.selectorPlaceholder}>
                    {selectedCounty || 'Select County'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location/Town *</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  onPress={() => {
                    if (!selectedCounty) {
                      Alert.alert('Select County First', 'Please select a county first')
                      return
                    }
                    setLocationModalVisible(true)
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={selectedLocation ? styles.selectorInputText : styles.selectorPlaceholder}>
                    {selectedLocation || 'Select Location'}
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

      {/* County Selection Modal */}
      <Modal visible={countyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.countySelectionModal}>
            {/* Header with Gradient */}
            <LinearGradient colors={[PRIMARY, '#2E7D32']} style={styles.countyModalHeader}>
              <View style={styles.countyHeaderLeft}>
                <Ionicons name="map" size={24} color="#fff" />
                <Text style={styles.countyModalTitle}>Select County</Text>
              </View>
              <TouchableOpacity 
                onPress={() => { setCountyModalVisible(false); setSearchCounty(''); }}
                style={styles.closeButton}
              >
                <Ionicons name="close-circle" size={28} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Search Bar */}
            <View style={styles.countySearchContainer}>
              <Ionicons name="search" size={20} color={PRIMARY} />
              <TextInput
                style={styles.countySearchInput}
                placeholder="Search for a county..."
                placeholderTextColor="#999"
                value={searchCounty}
                onChangeText={setSearchCounty}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchCounty.length > 0 && (
                <TouchableOpacity onPress={() => setSearchCounty('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Results Count */}
            <View style={styles.resultsCount}>
              <Text style={styles.resultsCountText}>
                {KENYA_COUNTIES.filter(c => c.name.toLowerCase().includes(searchCounty.toLowerCase())).length} counties
              </Text>
            </View>

            {/* County List */}
            <FlatList
              data={KENYA_COUNTIES.filter(c =>
                c.name.toLowerCase().includes(searchCounty.toLowerCase())
              )}
              keyExtractor={(item) => item.name}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.countyOption,
                    selectedCounty === item.name && styles.countyOptionSelected,
                    index === 0 && styles.countyOptionFirst,
                  ]}
                  onPress={() => {
                    setSelectedCounty(item.name)
                    setFormData({ ...formData, county: item.name })
                    setSelectedLocation('')
                    setCountyModalVisible(false)
                    setSearchCounty('')
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.countyOptionLeft}>
                    <View style={[
                      styles.countyIconContainer,
                      selectedCounty === item.name && styles.countyIconContainerSelected,
                    ]}>
                      <Ionicons 
                        name="location" 
                        size={20} 
                        color={selectedCounty === item.name ? '#fff' : PRIMARY} 
                      />
                    </View>
                    <Text style={[
                      styles.countyOptionText,
                      selectedCounty === item.name && styles.countyOptionTextSelected,
                    ]}>
                      {item.name}
                    </Text>
                  </View>
                  {selectedCounty === item.name && (
                    <View style={styles.selectedCheckmark}>
                      <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.countySeparator} />}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal visible={locationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCounty} - Select Location
              </Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={KENYA_COUNTIES.find(c => c.name === selectedCounty)?.locations || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionOption}
                  onPress={() => {
                    setSelectedLocation(item)
                    setFormData({ ...formData, city: item })
                    setLocationModalVisible(false)
                  }}
                >
                  <Text style={styles.selectionOptionText}>{item}</Text>
                  {selectedLocation === item && (
                    <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
            />
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
    maxHeight: '90%',
    minHeight: '60%',
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
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  selectorInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorInputText: {
    fontSize: 15,
    color: '#333',
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: '#999',
  },
  selectionModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
  },
  selectionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionOptionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
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
