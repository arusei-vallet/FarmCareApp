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
  const [isCardSticky, setIsCardSticky] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

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
      const asset = result.assets[0]
      await uploadAvatar(asset.uri)
    }
  }

  const uploadAvatar = async (imageUri: string) => {
    try {
      setAvatarUploading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'Please login to upload image')
        return
      }

      // Fetch the image from the URI
      const response = await fetch(imageUri)
      const blob = await response.blob()

      // Generate a unique filename
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`

      // Try to upload to Supabase Storage
      let publicUrl: string | null = null
      let uploadSuccess = false

      // Try 'images' bucket first
      const { error: imagesError } = await supabase.storage
        .from('images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
        })

      if (!imagesError) {
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(fileName)
        publicUrl = urlData?.publicUrl || null
        uploadSuccess = true
      } else {
        console.log('Images bucket error:', imagesError.message)
        
        // Try 'avatars' bucket as fallback
        const { error: avatarsError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true,
          })

        if (!avatarsError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)
          publicUrl = urlData?.publicUrl || null
          uploadSuccess = true
        } else {
          console.log('Avatars bucket error:', avatarsError.message)
        }
      }

      // If upload succeeded, update database with public URL
      if (uploadSuccess && publicUrl) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id)

        if (updateError) {
          console.error('Database update error:', updateError)
        }

        setProfile({ ...profile, avatar: publicUrl })
        Alert.alert('Success', 'Profile image updated successfully!')
      } else {
        // Fallback: save local URI (works offline/development)
        const { error: localError } = await supabase
          .from('users')
          .update({ avatar_url: imageUri })
          .eq('id', user.id)

        if (!localError) {
          setProfile({ ...profile, avatar: imageUri })
          Alert.alert(
            'Info',
            'Image saved locally. Cloud storage unavailable.',
            [{ text: 'OK' }]
          )
        } else {
          Alert.alert(
            'Error',
            'Failed to save image. Please try again.',
            [{ text: 'OK' }]
          )
        }
      }
    } catch (error: any) {
      console.error('Error uploading profile image:', error.message)
      
      // Final fallback - save local URI
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('users')
            .update({ avatar_url: imageUri })
            .eq('id', user.id)
          setProfile({ ...profile, avatar: imageUri })
          Alert.alert('Info', 'Image saved locally (offline mode)')
        }
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError)
        Alert.alert('Error', 'Failed to save image. Please try again.')
      }
    } finally {
      setAvatarUploading(false)
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        onScroll={(e) => {
          const scrollY = e.nativeEvent.contentOffset.y;
          setIsCardSticky(scrollY > 50);
        }}
        scrollEventThrottle={16}
      >
        {/* Header - Deep Green Sticky Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={openEditModal}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Card & Stats - Sticky */}
        <View style={isCardSticky ? styles.profileCardWrapperSticky : styles.profileCardWrapper}>
          <View style={styles.profileCardSticky}>
            <TouchableOpacity 
              onPress={pickAvatar} 
              style={styles.avatarContainer}
              disabled={avatarUploading}
            >
              {avatarUploading ? (
                <View style={styles.avatarLoadingContainer}>
                  <ActivityIndicator size="large" color={PRIMARY} />
                </View>
              ) : (
                <>
                  <Image source={{ uri: profile.avatar }} style={styles.avatar} />
                  <View style={styles.cameraIcon}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                </>
              )}
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
              <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate('Orders' as never)} activeOpacity={0.7}>
                <Ionicons name="bag-outline" size={24} color={PRIMARY} />
                <Text style={styles.statValue}>{profile.totalOrders}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
                <Ionicons name="chevron-forward" size={18} color="#999" style={styles.statChevron} />
              </TouchableOpacity>
            </View>
          )}
        </View>

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

                <View style={styles.formRow}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.label}>County *</Text>
                    <TouchableOpacity
                      style={styles.selectorInput}
                      onPress={() => setCountyModalVisible(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.selectorContent}>
                        {selectedCounty ? (
                          <View style={styles.selectedChip}>
                            <Ionicons name="location" size={16} color={PRIMARY} />
                            <Text style={styles.selectedChipText} numberOfLines={1}>{selectedCounty}</Text>
                          </View>
                        ) : (
                          <Text style={styles.selectorPlaceholder}>Select County</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.formGroupHalf}>
                    <Text style={styles.label}>Location *</Text>
                    <TouchableOpacity
                      style={[styles.selectorInput, !selectedCounty && styles.selectorInputDisabled]}
                      onPress={() => {
                        if (!selectedCounty) {
                          Alert.alert('Select County First', 'Please select a county first')
                          return
                        }
                        setLocationModalVisible(true)
                      }}
                      activeOpacity={0.7}
                      disabled={!selectedCounty}
                    >
                      <View style={styles.selectorContent}>
                        {selectedLocation ? (
                          <View style={styles.selectedChip}>
                            <Ionicons name="map" size={16} color={ACCENT} />
                            <Text style={styles.selectedChipText} numberOfLines={1}>{selectedLocation}</Text>
                          </View>
                        ) : (
                          <Text style={styles.selectorPlaceholder}>Select Location</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Selected Address Preview */}
                {(selectedCounty || selectedLocation) && (
                  <View style={styles.addressPreview}>
                    <View style={styles.previewHeader}>
                      <Ionicons name="information-circle" size={18} color={PRIMARY} />
                      <Text style={styles.previewTitle}>Address Preview</Text>
                    </View>
                    <Text style={styles.previewText}>
                      {selectedLocation || 'Location'}{selectedCounty ? `, ${selectedCounty}` : ''}
                    </Text>
                  </View>
                )}

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
            <LinearGradient colors={['#1B5E20', '#2E7D32', '#4CAF50']} style={styles.countyModalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="location" size={28} color="#fff" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.countyModalTitle}>Select County</Text>
                  <Text style={styles.countyModalSubtitle}>Choose your delivery county</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButtonWhite}
                onPress={() => setCountyModalVisible(false)}
              >
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.searchContainerEnhanced}>
              <View style={styles.searchIconBox}>
                <Ionicons name="search" size={22} color="#666" />
              </View>
              <TextInput
                style={styles.searchInputEnhanced}
                placeholder="Search county..."
                value={searchCounty}
                onChangeText={setSearchCounty}
                placeholderTextColor="#999"
              />
              {searchCounty.length > 0 && (
                <TouchableOpacity onPress={() => setSearchCounty('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={24} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.countiesCountEnhanced}>
              <Ionicons name="layers" size={16} color={PRIMARY} />
              <Text style={styles.countiesCountTextEnhanced}>
                {KENYA_COUNTIES.filter(c => c.name.toLowerCase().includes(searchCounty.toLowerCase())).length} counties available
              </Text>
            </View>

            <FlatList
              data={KENYA_COUNTIES.filter(c =>
                c.name.toLowerCase().includes(searchCounty.toLowerCase())
              )}
              keyExtractor={(item) => item.name}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.countyCard,
                    selectedCounty === item.name && styles.countyCardSelected,
                    index === 0 && styles.countyCardFirst,
                  ]}
                  onPress={() => {
                    setSelectedCounty(item.name)
                    setAddressFormData({ ...addressFormData, county: item.name })
                    setSelectedLocation('')
                    setCountyModalVisible(false)
                    setSearchCounty('')
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.countyCardLeft}>
                    <View style={[
                      styles.countyNumberBadge,
                      selectedCounty === item.name && styles.countyNumberBadgeSelected,
                    ]}>
                      <Text style={[
                        styles.countyNumberText,
                        selectedCounty === item.name && styles.countyNumberTextSelected,
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={[
                      styles.countyIconCard,
                      selectedCounty === item.name && styles.countyIconCardSelected,
                    ]}>
                      <Ionicons 
                        name={selectedCounty === item.name ? 'location' : 'location-outline'} 
                        size={22} 
                        color={selectedCounty === item.name ? '#fff' : PRIMARY} 
                      />
                    </View>
                    <View style={styles.countyInfo}>
                      <Text style={[
                        styles.countyNameText,
                        selectedCounty === item.name && styles.countyNameTextSelected,
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={styles.countyLocationsText}>
                        {item.locations.length} locations available
                      </Text>
                    </View>
                  </View>
                  {selectedCounty === item.name && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={32} color={PRIMARY} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No counties found</Text>
                  <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal visible={locationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectionModalContent}>
            <LinearGradient colors={['#2E7D32', '#43A047', '#66BB6A']} style={styles.locationModalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="map" size={28} color="#fff" />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.locationModalTitle}>Select Location</Text>
                  <Text style={styles.locationModalSubtitle}>{selectedCounty}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButtonWhite}
                onPress={() => setLocationModalVisible(false)}
              >
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.locationsCountEnhanced}>
              <Ionicons name="navigate" size={16} color={ACCENT} />
              <Text style={styles.locationsCountTextEnhanced}>
                {KENYA_COUNTIES.find(c => c.name === selectedCounty)?.locations.length || 0} locations available
              </Text>
            </View>

            <FlatList
              data={KENYA_COUNTIES.find(c => c.name === selectedCounty)?.locations || []}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.locationCard,
                    selectedLocation === item && styles.locationCardSelected,
                    index === 0 && styles.locationCardFirst,
                  ]}
                  onPress={() => {
                    setSelectedLocation(item)
                    setAddressFormData({ ...addressFormData, city: item })
                    setLocationModalVisible(false)
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.locationCardLeft}>
                    <View style={[
                      styles.locationNumberBadge,
                      selectedLocation === item && styles.locationNumberBadgeSelected,
                    ]}>
                      <Text style={[
                        styles.locationNumberText,
                        selectedLocation === item && styles.locationNumberTextSelected,
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={[
                      styles.locationIconCard,
                      selectedLocation === item && styles.locationIconCardSelected,
                    ]}>
                      <Ionicons 
                        name={selectedLocation === item ? 'navigate' : 'navigate-outline'} 
                        size={20} 
                        color={selectedLocation === item ? '#fff' : ACCENT} 
                      />
                    </View>
                    <View style={styles.locationInfo}>
                      <Text style={[
                        styles.locationNameText,
                        selectedLocation === item && styles.locationNameTextSelected,
                      ]}>
                        {item}
                      </Text>
                    </View>
                  </View>
                  {selectedLocation === item && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={32} color={ACCENT} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Ionicons name="map-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No locations found</Text>
                  <Text style={styles.emptyStateSubtext}>This county has no locations listed</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: PRIMARY,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  profileCardWrapper: {
    backgroundColor: '#f5f9f5',
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 10,
  },
  profileCardWrapperSticky: {
    backgroundColor: '#f5f9f5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1000,
  },
  profileCardSticky: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 10,
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarLoadingContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: PRIMARY,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  statsWrapper: {
    backgroundColor: '#f5f9f5',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  statsWrapperSticky: {
    backgroundColor: '#f5f9f5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  statsContainerSticky: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  statBox: { flex: 1, alignItems: 'center', position: 'relative' },
  statChevron: { position: 'absolute', right: 0, top: 0 },
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
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
    minHeight: 50,
  },
  selectorInputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  selectorContent: {
    flex: 1,
    flexDirection: 'row',
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
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flex: 1,
  },
  selectedChipText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '600',
    flex: 1,
  },
  addressPreview: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: PRIMARY,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    paddingLeft: 24,
  },
  selectionModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  countyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  countyModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  countyModalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  closeButtonWhite: {
    padding: 4,
  },
  searchContainerEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchInputEnhanced: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  countiesCountEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  countiesCountTextEnhanced: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  locationModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  locationModalSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  locationsCountEnhanced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  locationsCountTextEnhanced: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  locationCardFirst: {
    marginTop: 8,
  },
  locationCardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: ACCENT,
    borderWidth: 2,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  locationCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  locationNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationNumberBadgeSelected: {
    backgroundColor: ACCENT,
  },
  locationNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  locationNumberTextSelected: {
    color: '#fff',
  },
  locationIconCard: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconCardSelected: {
    backgroundColor: ACCENT,
  },
  locationInfo: {
    flex: 1,
    gap: 4,
  },
  locationNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  locationNameTextSelected: {
    color: ACCENT,
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
  countyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  countyCardFirst: {
    marginTop: 8,
  },
  countyCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: PRIMARY,
    borderWidth: 2,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  countyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  countyNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countyNumberBadgeSelected: {
    backgroundColor: PRIMARY,
  },
  countyNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  countyNumberTextSelected: {
    color: '#fff',
  },
  countyIconCard: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countyIconCardSelected: {
    backgroundColor: PRIMARY,
  },
  countyInfo: {
    flex: 1,
    gap: 4,
  },
  countyNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  countyNameTextSelected: {
    color: PRIMARY,
  },
  countyLocationsText: {
    fontSize: 12,
    color: '#888',
  },
  selectedIndicator: {
    paddingLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  selectionOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  countyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionOptionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  selectedCheck: {
    paddingLeft: 8,
  },
  countiesCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  countiesCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  locationsCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  locationsCountText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
})
