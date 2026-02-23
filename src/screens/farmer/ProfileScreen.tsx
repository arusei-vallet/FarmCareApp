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
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'

const { width } = Dimensions.get('window')

const ProfileScreen = () => {
  const navigation = useNavigation()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  const [profile, setProfile] = useState({
    name: 'Vallet Jepkosigei',
    email: 'vallet@example.com',
    phone: '+254 712 345 678',
    farm: 'Green Valley Farm',
    avatar:
      'https://images.unsplash.com/photo-1603415526960-f7f7e28c72a2?auto=format&fit=crop&w=400&q=60',
  })

  const [modalVisible, setModalVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [tempProfile, setTempProfile] = useState({ ...profile })
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' })
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, useNativeDriver: true }),
    ]).start()
  }, [])

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
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') },
    ])
  }

  const openEditModal = () => {
    setTempProfile({ ...profile })
    setModalVisible(true)
  }

  const saveProfile = () => {
    if (!tempProfile.name || !tempProfile.email || !tempProfile.phone || !tempProfile.farm) {
      Alert.alert('Error', 'Please fill all fields.')
      return
    }
    setProfile({ ...tempProfile })
    setModalVisible(false)
    Alert.alert('Success', 'Profile updated successfully.')
  }

  const openPasswordModal = () => {
    setPasswords({ old: '', new: '', confirm: '' })
    setPasswordSuccess(false)
    setPasswordModalVisible(true)
  }

  const savePassword = () => {
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      Alert.alert('Error', 'Please fill all password fields.')
      return
    }
    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'New password and confirmation do not match.')
      return
    }

    // Here, implement your supabase password change if needed
    // Example: supabase.auth.updateUser({ password: passwords.new })

    setPasswordSuccess(true)
    setPasswords({ old: '', new: '', confirm: '' })

    setTimeout(() => {
      setPasswordModalVisible(false)
      setPasswordSuccess(false)
    }, 1500)
  }

  return (
    <LinearGradient colors={['#f4fbf6', '#e8f5e9']} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={pickAvatar}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <View style={styles.cameraIcon}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.farm}>{profile.farm}</Text>
        </Animated.View>

        {/* Profile Info */}
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#2e7d32" />
            <Text style={styles.infoText}>{profile.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#2e7d32" />
            <Text style={styles.infoText}>{profile.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="leaf-outline" size={20} color="#2e7d32" />
            <Text style={styles.infoText}>{profile.farm}</Text>
          </View>
          <View style={[styles.infoRow, { justifyContent: 'space-between' }]}>
            <Text style={{ fontWeight: '700', fontSize: 15, color: '#163d1a' }}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: '#2e7d32' }}
              thumbColor="#fff"
            />
          </View>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editBtn} onPress={openPasswordModal}>
            <Ionicons name="key-outline" size={20} color="#fff" />
            <Text style={styles.editBtnText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Profile Modal */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <LinearGradient colors={['#e8f5e9', '#f4fbf6']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={tempProfile.name}
                onChangeText={(text) => setTempProfile({ ...tempProfile, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={tempProfile.email}
                onChangeText={(text) => setTempProfile({ ...tempProfile, email: text })}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={tempProfile.phone}
                onChangeText={(text) => setTempProfile({ ...tempProfile, phone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Farm Name"
                value={tempProfile.farm}
                onChangeText={(text) => setTempProfile({ ...tempProfile, farm: text })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSave} onPress={saveProfile}>
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </KeyboardAvoidingView>
        </Modal>

        {/* Change Password Modal */}
        <Modal visible={passwordModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
          >
            <LinearGradient colors={['#e8f5e9', '#f4fbf6']} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>

              {passwordSuccess && (
                <Text style={{ color: '#2e7d32', fontWeight: '700', marginBottom: 10, textAlign: 'center' }}>
                  Password changed successfully!
                </Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="Old Password"
                value={passwords.old}
                onChangeText={(text) => setPasswords({ ...passwords, old: text })}
                secureTextEntry
              />
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
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setPasswordModalVisible(false)}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSave} onPress={savePassword}>
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </KeyboardAvoidingView>
        </Modal>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#2e7d32' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2e7d32', borderRadius: 16, padding: 4 },
  name: { fontSize: 22, fontWeight: '900', color: '#163d1a', marginTop: 12 },
  farm: { fontSize: 16, fontWeight: '700', color: '#4CAF50', marginTop: 4 },
  infoCard: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 4, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  infoText: { marginLeft: 12, fontSize: 15, color: '#163d1a', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  editBtn: { flexDirection: 'row', backgroundColor: '#2e7d32', padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flex: 1, marginRight: 10 },
  editBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 16 },
  logoutBtn: { flexDirection: 'row', backgroundColor: '#d32f2f', padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flex: 1 },
  logoutBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8, fontSize: 16 },

  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { width: width - 40, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#163d1a', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15, borderWidth: 1, borderColor: '#cfcfcf' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtnCancel: { backgroundColor: '#9e9e9e', flex: 1, padding: 12, borderRadius: 12, marginRight: 8, alignItems: 'center' },
  modalBtnSave: { backgroundColor: '#2e7d32', flex: 1, padding: 12, borderRadius: 12, marginLeft: 8, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})