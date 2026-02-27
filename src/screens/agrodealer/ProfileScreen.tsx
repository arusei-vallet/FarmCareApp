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
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../services/supabase'

type RootStackParamList = {
  Onboarding: undefined
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

const PRIMARY = '#2196F3'
const ACCENT = '#1976D2'

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>()
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [locationEnabled, setLocationEnabled] = useState(true)

  const [profile, setProfile] = useState({
    name: 'Agro Supplies Kenya',
    email: 'info@agrosupplies.co.ke',
    phone: '+254 700 123 456',
    business: 'Agro Supplies Kenya Ltd',
    license: 'AGRO-2024-KE-001',
    avatar: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=400&q=60',
    address: 'Industrial Area, Nairobi',
    memberSince: 'March 2024',
    totalOrders: 156,
    rating: 4.7,
  })

  const [tempProfile, setTempProfile] = useState({ ...profile })
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userData) {
          setProfile({
            ...profile,
            name: userData.full_name || profile.name,
            email: user.email || profile.email,
            phone: userData.phone || profile.phone,
            business: userData.business_name || profile.business,
          })
        }
      }
    } catch (error) {
      console.log('Error loading profile:', error)
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
    if (!tempProfile.name || !tempProfile.phone || !tempProfile.business) {
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
            business_name: tempProfile.business,
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

  const menuItems = [
    { icon: 'business-outline', label: 'Business Information', action: () => {} },
    { icon: 'document-outline', label: 'License & Certificates', action: () => {} },
    { icon: 'wallet-outline', label: 'Payment & Billing', action: () => {} },
    { icon: 'people-outline', label: 'Customer Reviews', action: () => {} },
    { icon: 'chatbubble-outline', label: 'Help & Support', action: () => {} },
    { icon: 'shield-outline', label: 'Privacy Policy', action: () => {} },
    { icon: 'document-text-outline', label: 'Terms of Service', action: () => {} },
  ]

  return (
    <LinearGradient colors={['#E3F2FD', '#BBDEFB', '#90CAF9']} style={styles.container}>
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

          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.business}>{profile.business}</Text>
          <View style={styles.licenseBadge}>
            <Ionicons name="shield-checkmark" size={14} color={PRIMARY} />
            <Text style={styles.licenseText}>{profile.license}</Text>
          </View>
          <View style={styles.memberBadge}>
            <Ionicons name="calendar-outline" size={14} color={PRIMARY} />
            <Text style={styles.memberText}>Member since {profile.memberSince}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="bag-outline" size={24} color={PRIMARY} />
            <Text style={styles.statValue}>{profile.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="star" size={24} color="#FFC107" />
            <Text style={styles.statValue}>{profile.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="trending-up-outline" size={24} color={PRIMARY} />
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Fulfillment</Text>
          </View>
        </View>

        {/* Verification Badge */}
        <View style={styles.verificationCard}>
          <View style={styles.verificationHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
            <Text style={styles.verificationTitle}>Verified Agro Dealer</Text>
          </View>
          <Text style={styles.verificationText}>
            Your business license has been verified. Customers can trust your products and services.
          </Text>
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
            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon-outline" size={22} color={PRIMARY} />
                <Text style={styles.settingLabel}>Business Hours Mode</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business</Text>
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

          <TouchableOpacity style={styles.supportBtn}>
            <Ionicons name="headset-outline" size={20} color="#fff" />
            <Text style={styles.supportBtnText}>Contact Support</Text>
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
            <LinearGradient colors={['#fff', '#f5faff']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Business Profile</Text>

              <TextInput
                style={styles.input}
                placeholder="Business Name"
                value={tempProfile.business}
                onChangeText={(text) => setTempProfile({ ...tempProfile, business: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Person Name"
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
            <LinearGradient colors={['#fff', '#f5faff']} style={styles.modalContent}>
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
  name: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 4 },
  business: { fontSize: 14, color: '#555', marginBottom: 10 },
  licenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  licenseText: { fontSize: 12, color: PRIMARY, fontWeight: '500' },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  memberText: { fontSize: 12, color: PRIMARY, fontWeight: '500' },
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
  verificationCard: {
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
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verificationTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  verificationText: { fontSize: 13, color: '#666', lineHeight: 18 },
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
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  passwordBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  passwordBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  supportBtn: {
    flexDirection: 'row',
    backgroundColor: '#7B1FA2',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  supportBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
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
    backgroundColor: '#f5faff',
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
})
