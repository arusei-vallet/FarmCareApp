import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../services/supabase'

// Declare the navigation param list type for the main app stack
export type RootStackParamList = {
  Onboarding: undefined
  Login: undefined
  RegisterScreen: undefined
  ForgotPassword: undefined
  CustomerTabs: undefined
  FarmerTabs: undefined
  ProductDetail: { productId?: string; productName?: string; price?: number; imageUrl?: string }
  Checkout: undefined
  PrivacySettings: undefined
  HelpSupport: undefined
  PaymentMethods: undefined
  TermsOfService: undefined
  Orders: undefined
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

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
  city: string
  county?: string
  phone: string
  is_default: boolean
}

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(true)

  // Address management state
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([])
  const [addressModalVisible, setAddressModalVisible] = useState(false)
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null)
  const [countyModalVisible, setCountyModalVisible] = useState(false)
  const [locationModalVisible, setLocationModalVisible] = useState(false)
  const [searchCounty, setSearchCounty] = useState('')
  const [selectedCounty, setSelectedCounty] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [addressFormData, setAddressFormData] = useState({
    label: '',
    city: '',
    county: '',
    phone: '',
  })

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
    address: '',
    totalOrders: 0,
  })

  const [tempProfile, setTempProfile] = useState({ ...profile })
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Reload profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile()
      fetchAddresses()
    }, [])
  )

  const loadUserProfile = async () => {
    try {
      setDataLoading(true)
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.log('Auth error getting user:', authError.message)
        setDataLoading(false)
        return
      }

      if (!user) {
        console.log('No authenticated user found')
        setDataLoading(false)
        return
      }

      console.log('Loading profile for user:', user.id, 'Email:', user.email)

      // Fetch user profile data from public.users table
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('id, full_name, phone, email, avatar_url, address, created_at, role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.log('Error fetching user profile:', profileError.message, 'Code:', profileError.code)
      }

      console.log('User profile data from database:', userData)

      if (userData) {
        // Fetch total orders
        const { count: ordersCount, error: ordersError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', user.id)

        if (ordersError) {
          console.log('Error counting orders:', ordersError.message)
        }

        // Get the registered name - prioritize full_name from users table
        const registeredName = userData.full_name
          ? userData.full_name.trim()
          : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')

        setProfile({
          name: registeredName,
          email: userData.email || user.email || '',
          phone: userData.phone || '',
          avatar: userData.avatar_url || '',
          address: userData.address || '',
          totalOrders: ordersCount || 0,
        })
      } else {
        console.log('No user profile found in database, using auth data only')
        setProfile({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: '',
          avatar: '',
          address: '',
          totalOrders: 0,
        })
      }
    } catch (error: any) {
      console.log('Unexpected error loading profile:', error.message)
    } finally {
      setDataLoading(false)
    }
  }

  // Address management functions
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
    }
  }

  const openAddAddressModal = () => {
    setEditingAddress(null)
    setAddressFormData({ label: '', city: '', county: '', phone: '' })
    setSelectedCounty('')
    setSelectedLocation('')
    setAddressModalVisible(true)
  }

  const openEditAddressModal = (address: DeliveryAddress) => {
    setEditingAddress(address)
    setAddressFormData({
      label: address.label,
      city: address.city,
      county: address.county || '',
      phone: address.phone,
    })
    setSelectedCounty(address.county || '')
    setSelectedLocation(address.city)
    setAddressModalVisible(true)
  }

  const saveAddress = async () => {
    if (!addressFormData.label || !addressFormData.county || !addressFormData.city || !addressFormData.phone) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }

    // Validate phone number
    const phoneRegex = /^(\+254|0)?[17]\d{8}$/
    const cleanedPhone = addressFormData.phone.replace(/\s/g, '').replace(/\D/g, '')
    if (!phoneRegex.test(cleanedPhone) || cleanedPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid Kenyan phone number (e.g., 0712 345 678)')
      return
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.log('Auth error:', authError?.message)
        Alert.alert('Error', 'Please login to save address')
        return
      }

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

      // Format phone number properly
      let formattedPhone = cleanedPhone
      if (cleanedPhone.startsWith('0')) {
        formattedPhone = '254' + cleanedPhone.substring(1)
      } else if (cleanedPhone.startsWith('254')) {
        formattedPhone = cleanedPhone
      } else {
        formattedPhone = '254' + cleanedPhone
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('delivery_addresses')
          .update({
            label: addressFormData.label,
            address_line1: addressFormData.city,
            city: addressFormData.city,
            county: addressFormData.county || null,
            phone: formattedPhone,
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
            label: addressFormData.label,
            address_line1: addressFormData.city,
            city: addressFormData.city,
            county: addressFormData.county || null,
            phone: formattedPhone,
            is_default: addresses.length === 0,
          })

        if (error) throw error
        Alert.alert('Success', 'Address added successfully')
      }

      setAddressModalVisible(false)
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

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access gallery is needed!')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    })

    if (!result.canceled) {
      setProfile({ ...profile, avatar: result.assets[0].uri })
    }
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut()
            ;(navigation as any).replace('Onboarding')
          } catch (error) {
            Alert.alert('Error', 'Unable to logout. Please try again.')
          }
        },
      },
    ])
  }

  const openEditModal = () => {
    setTempProfile({ ...profile })
    setModalVisible(true)
  }

  const saveProfile = async () => {
    if (!tempProfile.name || !tempProfile.phone) {
      Alert.alert('Error', 'Please fill all required fields.')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('users')
          .update({
            full_name: tempProfile.name,
            phone: tempProfile.phone,
          })
          .eq('id', user.id)
      }
      setProfile({ ...tempProfile })
      setModalVisible(false)
      Alert.alert('Success', 'Profile updated successfully.')
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const openPasswordModal = () => {
    setPasswords({ old: '', new: '', confirm: '' })
    setPasswordSuccess(false)
    setPasswordModalVisible(true)
  }

  const savePassword = async () => {
    if (!passwords.new || !passwords.confirm) {
      Alert.alert('Error', 'Please fill all password fields.')
      return
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'New password and confirmation do not match.')
      return
    }
    if (passwords.new.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new })
      if (error) throw error

      setPasswordSuccess(true)
      setPasswords({ old: '', new: '', confirm: '' })

      setTimeout(() => {
        setPasswordModalVisible(false)
        setPasswordSuccess(false)
      }, 1500)
    } catch (error: any) {
      Alert.alert('Error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const menuItems: { icon: string; label: string; action: () => void; badge?: number }[] = [
    { icon: 'receipt-outline', label: 'Order History', action: () => navigation.navigate('Orders' as never), badge: 0 },
    { icon: 'card-outline', label: 'Payment Methods', action: () => navigation.navigate('PaymentMethods' as never), badge: 0 },
    { icon: 'heart-outline', label: 'Favorites', action: () => Alert.alert('Coming Soon', 'Favorites feature will be available soon'), badge: 0 },
    { icon: 'chatbubble-outline', label: 'Help & Support', action: () => navigation.navigate('HelpSupport' as never), badge: 0 },
    { icon: 'shield-outline', label: 'Privacy Policy', action: () => navigation.navigate('PrivacySettings' as never), badge: 0 },
    { icon: 'document-text-outline', label: 'Terms of Service', action: () => navigation.navigate('TermsOfService' as never), badge: 0 },
  ]

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={openEditModal}>
            <Ionicons name="create-outline" size={24} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          {dataLoading ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : (
            <>
              <Text style={styles.name}>{profile.name || 'User'}</Text>
              <Text style={styles.email}>{profile.email || 'No email'}</Text>
            </>
          )}
        </View>

        {/* Stats */}
        {dataLoading ? (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <ActivityIndicator size="small" color={PRIMARY} />
              <Text style={styles.statLabel}>Loading...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Ionicons name="bag-outline" size={24} color={PRIMARY} />
              <Text style={styles.statValue}>{profile.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
          </View>
        )}

        {/* Delivery Addresses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Addresses</Text>
            <TouchableOpacity style={styles.addAddressBtn} onPress={openAddAddressModal}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addAddressText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressesCard}>
            {addresses.length === 0 ? (
              <View style={styles.emptyAddresses}>
                <Ionicons name="location-outline" size={40} color="#ccc" />
                <Text style={styles.emptyText}>No addresses saved</Text>
                <Text style={styles.emptySubtext}>Tap Add to create your first address</Text>
              </View>
            ) : (
              addresses.map((address) => (
                <View key={address.id} style={styles.addressCard}>
                  <View style={styles.addressHeader}>
                    <View style={styles.addressLabelContainer}>
                      <Ionicons name="pricetag-outline" size={16} color={PRIMARY} />
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
                          <Ionicons name="star-outline" size={18} color="#FF9800" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => openEditAddressModal(address)}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="create-outline" size={18} color={PRIMARY} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteAddress(address)}
                        style={styles.actionBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.addressContent}>
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.addressText}>
                        {address.city}
                        {address.county ? `, ${address.county}` : ''}
                      </Text>
                    </View>
                    <View style={styles.addressRow}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={styles.addressText}>{address.phone}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={22} color={PRIMARY} />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="location-outline" size={22} color={PRIMARY} />
                <Text style={styles.settingLabel}>Location Services</Text>
              </View>
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.action}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name={item.icon as any} size={22} color={PRIMARY} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.badge !== undefined && item.badge > 0 && (
                    <View style={styles.menuBadge}>
                      <Text style={styles.menuBadgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.passwordBtn} onPress={openPasswordModal}>
            <Ionicons name="key-outline" size={20} color="#fff" />
            <Text style={styles.passwordBtnText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#fff', '#f5fff5']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={tempProfile.name}
                onChangeText={(text) => setTempProfile({ ...tempProfile, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={tempProfile.phone}
                onChangeText={(text) => setTempProfile({ ...tempProfile, phone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                placeholder="Email"
                value={tempProfile.email}
                editable={false}
              />
              <Text style={styles.inputHint}>Email cannot be changed</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={saveProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#fff', '#f5fff5']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>

              {passwordSuccess && (
                <View style={styles.successMessage}>
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                  <Text style={styles.successText}>Password changed successfully!</Text>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={passwords.new}
                onChangeText={(text) => setPasswords({ ...passwords, new: text })}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={passwords.confirm}
                onChangeText={(text) => setPasswords({ ...passwords, confirm: text })}
                secureTextEntry
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setPasswordModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={savePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add/Edit Address Modal */}
      <Modal visible={addressModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#fff', '#f5fff5']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </Text>
                <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Name/Label *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Home, Work, Office"
                    value={addressFormData.label}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, label: text })}
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
                  <Text style={styles.label}>Location *</Text>
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
                    value={addressFormData.phone}
                    onChangeText={(text) => setAddressFormData({ ...addressFormData, phone: text })}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setAddressModalVisible(false)}
                  >
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={saveAddress}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.modalBtnText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* County Selection Modal */}
      <Modal visible={countyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select County</Text>
              <TouchableOpacity onPress={() => setCountyModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search county..."
                value={searchCounty}
                onChangeText={setSearchCounty}
              />
            </View>

            <FlatList
              data={KENYA_COUNTIES.filter(c =>
                c.name.toLowerCase().includes(searchCounty.toLowerCase())
              )}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionOption}
                  onPress={() => {
                    setSelectedCounty(item.name)
                    setAddressFormData({ ...addressFormData, county: item.name })
                    setSelectedLocation('')
                    setCountyModalVisible(false)
                    setSearchCounty('')
                  }}
                >
                  <Text style={styles.selectionOptionText}>{item.name}</Text>
                  {selectedCounty === item.name && (
                    <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              )}
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
                    setAddressFormData({ ...addressFormData, city: item })
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

export default ProfileScreen

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: PRIMARY },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: PRIMARY,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 12 },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: PRIMARY, marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#f0f0f0', marginHorizontal: 10 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, color: '#333' },
  settingDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, color: '#333' },
  menuBadge: {
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  passwordBtn: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  passwordBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center' },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY, marginBottom: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#f5fff5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  inputHint: { fontSize: 12, color: '#888', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#9E9E9E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: { color: '#2E7D32', fontWeight: '500' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addAddressBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  addAddressText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  addressesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  emptyAddresses: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  addressCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  defaultBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 9,
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
    gap: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  selectorInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5fff5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#333',
  },
  selectionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectionOptionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
})
