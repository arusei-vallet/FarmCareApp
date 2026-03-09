import React, { useRef, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { supabase } from '../../services/supabase'
import PrivacySettingsScreen from '../customer/PrivacySettingsScreen'
import HelpSupportScreen from '../customer/HelpSupportScreen'

type RootStackParamList = {
  Login: undefined
  PrivacySettings: undefined
  HelpSupport: undefined
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    farm: '',
    avatar: '',
  })

  const [modalVisible, setModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [tempProfile, setTempProfile] = useState({ ...profile })
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [editFieldModalVisible, setEditFieldModalVisible] = useState(false)
  const [currentEditField, setCurrentEditField] = useState<'name' | 'email' | 'phone' | 'farm'>('name')
  const [tempFieldValue, setTempFieldValue] = useState('')

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start()
  }, [])

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)

      // Get current auth user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        Alert.alert('Error', 'Not logged in')
        setLoading(false)
        return
      }

      // Fetch profile from public.users table
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('full_name, email, phone, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        Alert.alert('Error', 'Failed to load profile')
        setLoading(false)
        return
      }

      setProfile({
        name: userProfile?.full_name || user.user_metadata?.full_name || '',
        email: userProfile?.email || user.email || '',
        phone: userProfile?.phone || user.user_metadata?.phone || '',
        farm: user.user_metadata?.farm_name || '',
        avatar: userProfile?.avatar_url || '',
      })

      setLoading(false)
    } catch (err) {
      console.error('Unexpected error loading profile:', err)
      Alert.alert('Error', 'Failed to load profile')
      setLoading(false)
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
      // TODO: Upload to Supabase Storage and update avatar_url
      setProfile({ ...profile, avatar: result.assets[0].uri })
    }
  }

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          navigation.replace('Login')
        },
      },
    ])
  }

  const openEditModal = () => {
    setTempProfile({ ...profile })
    setModalVisible(true)
  }

  const saveProfile = async () => {
    if (!tempProfile.name || !tempProfile.email || !tempProfile.phone) {
      Alert.alert('Error', 'Please fill all required fields.')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'Not logged in')
        return
      }

      // Update profile in public.users table
      const { error } = await supabase
        .from('users')
        .update({
          full_name: tempProfile.name,
          email: tempProfile.email,
          phone: tempProfile.phone,
        })
        .eq('id', user.id)

      if (error) {
        Alert.alert('Error', 'Failed to update profile')
        console.error('Update error:', error)
        return
      }

      setProfile({ ...tempProfile })
      setModalVisible(false)
      Alert.alert('Success', 'Profile updated successfully.')
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile')
      console.error('Unexpected error:', err)
    }
  }

  const openEditFieldModal = (field: 'name' | 'email' | 'phone' | 'farm', value: string) => {
    setCurrentEditField(field)
    setTempFieldValue(value)
    setEditFieldModalVisible(true)
  }

  const saveFieldEdit = async () => {
    if (!tempFieldValue.trim()) {
      Alert.alert('Error', 'This field cannot be empty.')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('Error', 'Not logged in')
        return
      }

      let updateData: any = {}
      let successMessage = 'Updated successfully.'

      if (currentEditField === 'farm') {
        // Update farm name in user_metadata
        const { error } = await supabase.auth.updateUser({
          data: { farm_name: tempFieldValue }
        })
        if (error) throw error
        successMessage = 'Farm name updated successfully.'
      } else if (currentEditField === 'name') {
        updateData = { full_name: tempFieldValue }
        const { error } = await supabase.from('users').update(updateData).eq('id', user.id)
        if (error) throw error
      } else if (currentEditField === 'phone') {
        updateData = { phone: tempFieldValue }
        const { error } = await supabase.from('users').update(updateData).eq('id', user.id)
        if (error) throw error
      } else if (currentEditField === 'email') {
        // Email change requires reconfirmation
        const { error } = await supabase.auth.updateUser({ email: tempFieldValue })
        if (error) throw error
        successMessage = 'Email updated. Please check your inbox to confirm.'
      }

      // Update local state
      setProfile({
        ...profile,
        [currentEditField === 'name' ? 'name' : currentEditField === 'farm' ? 'farm' : currentEditField === 'phone' ? 'phone' : 'email']: tempFieldValue,
      })
      setEditFieldModalVisible(false)
      Alert.alert('Success', successMessage)
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update field.')
      console.error('Update field error:', err)
    }
  }

  const openPasswordModal = () => {
    setPasswords({ old: '', new: '', confirm: '' })
    setPasswordSuccess(false)
    setPasswordModalVisible(true)
  }

  const savePassword = async () => {
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      Alert.alert('Error', 'Please fill all password fields.')
      return
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'New password and confirmation do not match.')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      setPasswordSuccess(true)
      setPasswords({ old: '', new: '', confirm: '' })

      setTimeout(() => {
        setPasswordModalVisible(false)
        setPasswordSuccess(false)
      }, 1500)
    } catch (err) {
      Alert.alert('Error', 'Failed to update password')
      console.error('Password update error:', err)
    }
  }

  const ProfileItem: React.FC<{
    icon: string
    label: string
    value: string
    type?: 'ion' | 'mc'
    field?: 'name' | 'email' | 'phone' | 'farm'
  }> = ({ icon, label, value, type = 'ion', field }) => {
    const IconComponent = type === 'mc' ? MCIcon : Ionicons
    const isEditable = field !== undefined

    return (
      <TouchableOpacity
        style={styles.profileItem}
        onPress={() => field && openEditFieldModal(field, value)}
        disabled={!isEditable}
      >
        <View style={styles.profileItemIcon}>
          <IconComponent name={icon} size={20} color="#2e7d32" />
        </View>
        <View style={styles.profileItemContent}>
          <Text style={styles.profileItemLabel}>{label}</Text>
          <View style={styles.profileItemValueRow}>
            <Text style={styles.profileItemValue}>{value || 'Not set'}</Text>
            {isEditable && <Ionicons name="create-outline" size={16} color="#2e7d32" />}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const ActionButton: React.FC<{
    icon: string
    label: string
    onPress: () => void
    danger?: boolean
  }> = ({ icon, label, onPress, danger = false }) => (
    <TouchableOpacity style={[styles.actionButton, danger && styles.dangerButton]} onPress={onPress}>
      <View style={[styles.actionButtonIcon, danger && styles.dangerIconBg]}>
        <Ionicons name={icon} size={20} color={danger ? '#d32f2f' : '#2e7d32'} />
      </View>
      <Text style={[styles.actionButtonText, danger && styles.dangerButtonText]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={50} color="#2e7d32" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.farm}>{profile.farm || 'Farmer'}</Text>
        </Animated.View>

        {/* Profile Information Card */}
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          <ProfileItem
            icon="mail-outline"
            label="Email"
            value={profile.email}
            field="email"
          />
          <ProfileItem
            icon="call-outline"
            label="Phone"
            value={profile.phone}
            field="phone"
          />
          <ProfileItem
            icon="leaf-outline"
            label="Farm Name"
            value={profile.farm}
            type="mc"
            field="farm"
          />

          <View style={styles.divider} />

          <View style={styles.profileItem}>
            <View style={styles.profileItemIcon}>
              <MCIcon name="bell-outline" size={20} color="#2e7d32" />
            </View>
            <View style={styles.profileItemContent}>
              <Text style={styles.profileItemLabel}>Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#bdbdbd', true: '#81c784' }}
                thumbColor="#fff"
                style={styles.switch}
              />
            </View>
          </View>
        </Animated.View>

        {/* Account Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Account Settings</Text>

          <ActionButton
            icon="create-outline"
            label="Edit Profile"
            onPress={openEditModal}
          />
          <ActionButton
            icon="lock-closed-outline"
            label="Change Password"
            onPress={openPasswordModal}
          />
          <ActionButton
            icon="shield-checkmark-outline"
            label="Privacy Settings"
            onPress={() => navigation.navigate('PrivacySettings')}
          />
          <ActionButton
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => navigation.navigate('HelpSupport')}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />

        {/* Edit Profile Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalOverlay}>
              <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons name="person-outline" size={20} color="#9e9e9e" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor="#9e9e9e"
                        value={tempProfile.name}
                        onChangeText={(text) => setTempProfile({ ...tempProfile, name: text })}
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons name="mail-outline" size={20} color="#9e9e9e" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#9e9e9e"
                        value={tempProfile.email}
                        onChangeText={(text) => setTempProfile({ ...tempProfile, email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons name="call-outline" size={20} color="#9e9e9e" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your phone"
                        placeholderTextColor="#9e9e9e"
                        value={tempProfile.phone}
                        onChangeText={(text) => setTempProfile({ ...tempProfile, phone: text })}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Farm Name</Text>
                    <View style={styles.inputWithIcon}>
                      <MCIcon name="agriculture" size={20} color="#9e9e9e" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter farm name"
                        placeholderTextColor="#9e9e9e"
                        value={tempProfile.farm}
                        onChangeText={(text) => setTempProfile({ ...tempProfile, farm: text })}
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSave}
                    onPress={saveProfile}
                  >
                    <Text style={styles.modalBtnTextSave}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Change Password Modal */}
        <Modal visible={passwordModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalOverlay}>
              <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Change Password</Text>
                  <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {passwordSuccess && (
                  <View style={styles.successMessage}>
                    <MCIcon name="check-circle" size={20} color="#2e7d32" />
                    <Text style={styles.successText}>Password changed successfully!</Text>
                  </View>
                )}

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Current Password</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons name="lock-closed-outline" size={20} color="#9e9e9e" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter current password"
                        placeholderTextColor="#9e9e9e"
                        value={passwords.old}
                        onChangeText={(text) => setPasswords({ ...passwords, old: text })}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons name="lock-closed-outline" size={20} color="#9e9e9e" />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter new password"
                        placeholderTextColor="#9e9e9e"
                        value={passwords.new}
                        onChangeText={(text) => setPasswords({ ...passwords, new: text })}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <View style={styles.inputWithIcon}>
                      <Ionicons name="lock-closed-outline" size={20} color="#9e9e9e" />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm new password"
                        placeholderTextColor="#9e9e9e"
                        value={passwords.confirm}
                        onChangeText={(text) => setPasswords({ ...passwords, confirm: text })}
                        secureTextEntry
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setPasswordModalVisible(false)}
                  >
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSave}
                    onPress={savePassword}
                  >
                    <Text style={styles.modalBtnTextSave}>Update Password</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Single Field Modal */}
        <Modal visible={editFieldModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalOverlay}>
              <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Edit {currentEditField === 'name' ? 'Name' : currentEditField === 'email' ? 'Email' : currentEditField === 'phone' ? 'Phone' : 'Farm Name'}
                  </Text>
                  <TouchableOpacity onPress={() => setEditFieldModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    {currentEditField === 'name' ? 'Full Name' : currentEditField === 'email' ? 'Email Address' : currentEditField === 'phone' ? 'Phone Number' : 'Farm Name'}
                  </Text>
                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name={
                        currentEditField === 'name' ? 'person-outline' :
                        currentEditField === 'email' ? 'mail-outline' :
                        currentEditField === 'phone' ? 'call-outline' : 'leaf-outline'
                      }
                      size={20}
                      color="#9e9e9e"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter value"
                      placeholderTextColor="#9e9e9e"
                      value={tempFieldValue}
                      onChangeText={setTempFieldValue}
                      keyboardType={currentEditField === 'phone' ? 'phone-pad' : currentEditField === 'email' ? 'email-address' : 'default'}
                      autoCapitalize={currentEditField === 'email' ? 'none' : 'words'}
                    />
                  </View>
                  {currentEditField === 'email' && (
                    <Text style={styles.inputHint}>You'll need to confirm your new email address.</Text>
                  )}
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setEditFieldModalVisible(false)}
                  >
                    <Text style={styles.modalBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSave}
                    onPress={saveFieldEdit}
                  >
                    <Text style={styles.modalBtnTextSave}>Save</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </ScrollView>
    </LinearGradient>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#2e7d32',
    fontWeight: '600',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2e7d32',
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 4,
  },
  farm: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b4332',
  },
  editLink: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 14,
    color: '#1b4332',
    fontWeight: '600',
    flex: 1,
  },
  profileItemValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actionButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIconBg: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#1b4332',
    fontWeight: '600',
  },
  dangerButton: {
    // Keep same style but icon bg changes
  },
  dangerButtonText: {
    color: '#d32f2f',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#d32f2f',
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0,
    elevation: 4,
    shadowColor: '#d32f2f',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: 'transparent',
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
  },
  modalScroll: {
    maxHeight: 320,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1b4332',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 6,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancel: {
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSave: {
    backgroundColor: '#2e7d32',
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2e7d32',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnTextSave: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#2e7d32',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
})
