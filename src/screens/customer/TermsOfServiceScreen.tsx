import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

const TermsOfServiceScreen = () => {
  const navigation = useNavigation()
  const [expandedSection, setExpandedSection] = useState<string | null>('intro')

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const sections = [
    {
      id: 'intro',
      title: 'Introduction',
      icon: 'information-circle-outline',
      content: `Welcome to FarmCare Expo! These Terms of Service govern your use of our mobile application and services. By accessing or using FarmCare Expo, you agree to be bound by these terms.

FarmCare Expo is a platform that connects farmers with customers, enabling the buying and selling of fresh farm produce directly.`,
    },
    {
      id: 'accounts',
      title: 'User Accounts',
      icon: 'person-outline',
      content: `• You must be at least 18 years old to create an account
• You are responsible for maintaining the security of your account
• You must provide accurate and complete registration information
• You must notify us immediately of any unauthorized use of your account
• We reserve the right to suspend or terminate accounts that violate these terms`,
    },
    {
      id: 'orders',
      title: 'Orders & Payments',
      icon: 'cart-outline',
      content: `• All orders are subject to availability and confirmation
• Prices are displayed in Kenyan Shillings (KES) and may change without notice
• Payment must be made through our approved payment methods (M-Pesa, Card, or Cash on Delivery)
• Orders may be cancelled by either party before confirmation
• Delivery fees apply based on your location and order value`,
    },
    {
      id: 'delivery',
      title: 'Delivery & Shipping',
      icon: 'bicycle-outline',
      content: `• We deliver to specified areas within Kenya
• Delivery times are estimates and not guaranteed
• You must be available to receive your order at the specified address
• Failed delivery attempts may result in additional charges
• Risk of loss passes to you upon delivery`,
    },
    {
      id: 'returns',
      title: 'Returns & Refunds',
      icon: 'return-up-back-outline',
      content: `• Fresh produce can be returned within 24 hours if quality is unsatisfactory
• Contact customer support immediately for quality issues
• Refunds will be processed to your original payment method
• Perishable items must be reported with photographic evidence
• We reserve the right to refuse returns that don't meet our policy`,
    },
    {
      id: 'farmers',
      title: 'For Farmers (Sellers)',
      icon: 'leaf-outline',
      content: `• Farmers must provide accurate product descriptions and images
• Products must meet quality standards as described
• Orders must be fulfilled within the specified timeframe
• Farmers are responsible for packaging products appropriately
• Commission fees apply to all sales made through the platform`,
    },
    {
      id: 'prohibited',
      title: 'Prohibited Conduct',
      icon: 'ban-outline',
      content: `• You may not use the platform for any illegal purpose
• You may not harass, abuse, or harm another person
• You may not impersonate any person or entity
• You may not interfere with the security of the platform
• You may not use the platform to transmit spam or unsolicited messages`,
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      icon: 'shield-outline',
      content: `• We collect and process personal data as described in our Privacy Policy
• Your data is used to provide and improve our services
• We implement security measures to protect your information
• You have rights to access, correct, and delete your data
• We may share data with third parties only as necessary to provide services`,
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      icon: 'warning-outline',
      content: `• FarmCare Expo is a platform connecting buyers and sellers
• We are not liable for the quality, safety, or legality of products
• Our total liability is limited to the amount of your order
• We are not liable for indirect, incidental, or consequential damages
• The platform is provided "as is" without warranties of any kind`,
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      icon: 'refresh-outline',
      content: `• We may modify these terms at any time
• Continued use of the platform constitutes acceptance of new terms
• We will notify users of significant changes via email or app notification
• The current version is always available in the app
• Last updated: March 2026`,
    },
    {
      id: 'contact',
      title: 'Contact Information',
      icon: 'call-outline',
      content: `For questions about these Terms of Service:

📧 Email: support@farmcareexpo.co.ke
📱 Phone: +254 700 000 000
📍 Address: Nairobi, Kenya

Customer Support Hours:
Monday - Friday: 8:00 AM - 6:00 PM
Saturday: 9:00 AM - 5:00 PM
Sunday & Holidays: 10:00 AM - 4:00 PM`,
    },
  ]

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Last Updated */}
      <View style={styles.updatedCard}>
        <Ionicons name="time-outline" size={18} color={PRIMARY} />
        <Text style={styles.updatedText}>Last updated: March 2026</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => Linking.openURL('https://farmcareexpo.co.ke/privacy')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={PRIMARY} />
            <Text style={styles.quickLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => Linking.openURL('https://farmcareexpo.co.ke/support')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={PRIMARY} />
            <Text style={styles.quickLinkText}>Support Center</Text>
          </TouchableOpacity>
        </View>

        {/* Sections */}
        {sections.map((section) => (
          <View key={section.id} style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons name={section.icon as any} size={22} color={PRIMARY} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Ionicons
                name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>

            {expandedSection === section.id && (
              <View style={styles.sectionContent}>
                <Text style={styles.sectionText}>{section.content}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Accept Button */}
        <TouchableOpacity style={styles.acceptBtn}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
          <Text style={styles.acceptBtnText}>I Accept the Terms</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  )
}

export default TermsOfServiceScreen

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
  headerRight: { width: 40 },
  updatedCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  updatedText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '500',
  },
  quickLinks: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quickLinkText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    whiteSpace: 'pre-line',
  },
  acceptBtn: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
