import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../services/supabase'

type PrivacySettingsParamList = {
  Profile: undefined
  Onboarding: undefined
}

type PrivacySettingsNavigationProp = NativeStackNavigationProp<PrivacySettingsParamList>

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

const PrivacySettingsScreen = () => {
  const navigation = useNavigation<PrivacySettingsNavigationProp>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public', // 'public' | 'friends' | 'private'
    showOrderHistory: true,
    showContactInfo: false,
    allowDirectMessages: true,
    dataSharing: false,
    analyticsTracking: true,
    personalizedAds: false,
    locationTracking: true,
  })

  useEffect(() => {
    loadPrivacySettings()
  }, [])

  const loadPrivacySettings = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('privacy_settings')
          .eq('id', user.id)
          .single()

        if (userData?.privacy_settings) {
          setPrivacySettings({ ...privacySettings, ...userData.privacy_settings })
        }
      }
    } catch (error) {
      console.log('Error loading privacy settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePrivacySettings = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ privacy_settings: privacySettings })
          .eq('id', user.id)

        if (error) throw error

        Alert.alert('Success', 'Privacy settings saved successfully.')
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save privacy settings.')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setPrivacySettings({ ...privacySettings, [key]: value })
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                await supabase
                  .from('users')
                  .delete()
                  .eq('id', user.id)
                
                await supabase.auth.signOut()
                navigation.replace('Onboarding')
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account.')
            }
          },
        },
      ]
    )
  }

  const handleExportData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        const dataStr = JSON.stringify(userData, null, 2)
        Alert.alert(
          'Export Data',
          'Your data has been prepared. In a production app, this would download as a JSON file.',
          [{ text: 'OK' }]
        )
        console.log('Exported data:', dataStr)
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to export data.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading privacy settings...</Text>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings</Text>
        <TouchableOpacity onPress={savePrivacySettings} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="person-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Profile Visibility</Text>
                  <Text style={styles.settingDescription}>Who can see your profile</Text>
                </View>
              </View>
              <View style={styles.visibilityButtons}>
                <TouchableOpacity
                  style={[
                    styles.visibilityButton,
                    privacySettings.profileVisibility === 'public' && styles.visibilityButtonActive,
                  ]}
                  onPress={() => updateSetting('profileVisibility', 'public')}
                >
                  <Ionicons
                    name="globe-outline"
                    size={18}
                    color={privacySettings.profileVisibility === 'public' ? '#fff' : PRIMARY}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visibilityButton,
                    privacySettings.profileVisibility === 'friends' && styles.visibilityButtonActive,
                  ]}
                  onPress={() => updateSetting('profileVisibility', 'friends')}
                >
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color={privacySettings.profileVisibility === 'friends' ? '#fff' : PRIMARY}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.visibilityButton,
                    privacySettings.profileVisibility === 'private' && styles.visibilityButtonActive,
                  ]}
                  onPress={() => updateSetting('profileVisibility', 'private')}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={privacySettings.profileVisibility === 'private' ? '#fff' : PRIMARY}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="receipt-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Show Order History</Text>
                  <Text style={styles.settingDescription}>Display your order history on profile</Text>
                </View>
              </View>
              <Switch
                value={privacySettings.showOrderHistory}
                onValueChange={(value) => updateSetting('showOrderHistory', value)}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="call-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Show Contact Info</Text>
                  <Text style={styles.settingDescription}>Display phone and email on profile</Text>
                </View>
              </View>
              <Switch
                value={privacySettings.showContactInfo}
                onValueChange={(value) => updateSetting('showContactInfo', value)}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="chatbubble-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Allow Direct Messages</Text>
                  <Text style={styles.settingDescription}>Receive messages from other users</Text>
                </View>
              </View>
              <Switch
                value={privacySettings.allowDirectMessages}
                onValueChange={(value) => updateSetting('allowDirectMessages', value)}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="share-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Data Sharing</Text>
                  <Text style={styles.settingDescription}>Share data with third-party partners</Text>
                </View>
              </View>
              <Switch
                value={privacySettings.dataSharing}
                onValueChange={(value) => updateSetting('dataSharing', value)}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="analytics-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Analytics Tracking</Text>
                  <Text style={styles.settingDescription}>Help improve our app with usage data</Text>
                </View>
              </View>
              <Switch
                value={privacySettings.analyticsTracking}
                onValueChange={(value) => updateSetting('analyticsTracking', value)}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="megaphone-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Personalized Ads</Text>
                  <Text style={styles.settingDescription}>See ads based on your interests</Text>
                </View>
              </View>
              <Switch
                value={privacySettings.personalizedAds}
                onValueChange={(value) => updateSetting('personalizedAds', value)}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingDivider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="location-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Location Tracking</Text>
                  <Text style={styles.settingDescription}>Allow location-based features</Text>
                </View>
              </View>
              <Switch
                value={privacySettings.locationTracking}
                onValueChange={(value) => updateSetting('locationTracking', value)}
                trackColor={{ false: '#ccc', true: PRIMARY }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Privacy Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Actions</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
              <View style={styles.settingLeft}>
                <Ionicons name="download-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Export My Data</Text>
                  <Text style={styles.settingDescription}>Download all your personal data</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <View style={styles.settingDivider} />
            <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={22} color="#D32F2F" />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: '#D32F2F' }]}>Delete Account</Text>
                  <Text style={styles.settingDescription}>Permanently remove your account</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Policy Link */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowPrivacyPolicy(true)}>
              <View style={styles.settingLeft}>
                <Ionicons name="document-text-outline" size={22} color={PRIMARY} />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>View Privacy Policy</Text>
                  <Text style={styles.settingDescription}>Read our full privacy policy</Text>
                </View>
              </View>
              <Ionicons name="open-outline" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacyPolicy} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f5fff5']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Privacy Policy</Text>
                <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.policyScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>1. Information We Collect</Text>
                  <Text style={styles.policyText}>
                    We collect information you provide directly to us, including your name, email address, phone number, farm information, and payment details when you create an account or make a purchase.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>2. How We Use Your Information</Text>
                  <Text style={styles.policyText}>
                    We use the information we collect to process your orders, communicate with you about products and services, improve our platform, and send you relevant marketing communications (with your consent).
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>3. Information Sharing</Text>
                  <Text style={styles.policyText}>
                    We do not sell your personal information. We may share your information with service providers who assist in our operations (payment processors, delivery partners) and when required by law.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>4. Data Security</Text>
                  <Text style={styles.policyText}>
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>5. Your Rights</Text>
                  <Text style={styles.policyText}>
                    You have the right to access, correct, or delete your personal information. You can manage your privacy settings in the app or contact our support team for assistance.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>6. Cookies and Analytics</Text>
                  <Text style={styles.policyText}>
                    We use cookies and analytics tools to understand how you use our app and improve your experience. You can control cookie preferences through your device settings.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>7. Third-Party Links</Text>
                  <Text style={styles.policyText}>
                    Our app may contain links to third-party websites or services. We are not responsible for their privacy practices and encourage you to review their privacy policies.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>8. Children's Privacy</Text>
                  <Text style={styles.policyText}>
                    Our services are not directed to children under 18. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete it.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>9. Changes to This Policy</Text>
                  <Text style={styles.policyText}>
                    We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy here and updating the effective date.
                  </Text>
                </View>

                <View style={styles.policySection}>
                  <Text style={styles.policyHeading}>10. Contact Us</Text>
                  <Text style={styles.policyText}>
                    If you have questions about this privacy policy, please contact us at privacy@farmcare-expo.com or through our Help & Support section.
                  </Text>
                </View>

                <View style={styles.policyFooter}>
                  <Text style={styles.policyEffectiveDate}>Effective Date: March 2026</Text>
                  <Text style={styles.policyVersion}>Version 1.0</Text>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  )
}

export default PrivacySettingsScreen

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
  backButton: {
    padding: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  saveButton: {
    backgroundColor: PRIMARY,
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: PRIMARY,
  },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  card: {
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
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingText: { marginLeft: 12, flex: 1 },
  settingLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
  settingDescription: { fontSize: 12, color: '#888', marginTop: 2 },
  settingDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  visibilityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visibilityButtonActive: {
    backgroundColor: PRIMARY,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalContainer: { flex: 1, justifyContent: 'center' },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: PRIMARY },
  policyScroll: {
    maxHeight: 500,
  },
  policySection: {
    marginBottom: 20,
  },
  policyHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  policyFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  policyEffectiveDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  policyVersion: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
})
