import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'

type HelpSupportParamList = {
  Profile: undefined
}

type HelpSupportNavigationProp = NativeStackNavigationProp<HelpSupportParamList>

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'general' | 'orders' | 'payment' | 'delivery' | 'account'
}

const HelpSupportScreen = () => {
  const navigation = useNavigation<HelpSupportNavigationProp>()
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  })

  const faqData: FAQItem[] = [
    {
      id: '1',
      question: 'How do I track my order?',
      answer: 'You can track your order by going to your Order History in the profile section. Each order will have a tracking status showing its current location and estimated delivery time.',
      category: 'orders',
    },
    {
      id: '2',
      question: 'What payment methods are accepted?',
      answer: 'We accept M-Pesa, credit/debit cards (Visa, MasterCard), and bank transfers. All payments are processed securely through our payment partners.',
      category: 'payment',
    },
    {
      id: '3',
      question: 'How long does delivery take?',
      answer: 'Delivery times vary by location. Nairobi deliveries typically take 1-2 business days, while other regions may take 3-5 business days. You\'ll receive tracking information once your order ships.',
      category: 'delivery',
    },
    {
      id: '4',
      question: 'Can I cancel or modify my order?',
      answer: 'Orders can be cancelled within 1 hour of placement if they haven\'t been processed yet. Contact our support team immediately for assistance.',
      category: 'orders',
    },
    {
      id: '5',
      question: 'How do I reset my password?',
      answer: 'Go to the login screen and tap "Forgot Password". Enter your email address and we\'ll send you a link to reset your password.',
      category: 'account',
    },
    {
      id: '6',
      question: 'What is your return policy?',
      answer: 'We accept returns within 7 days of delivery for unopened items in original condition. Contact support to initiate a return request.',
      category: 'general',
    },
    {
      id: '7',
      question: 'How do I contact a seller?',
      answer: 'You can contact sellers directly through the product page or your order details. Use the "Contact Seller" button to send a message.',
      category: 'general',
    },
    {
      id: '8',
      question: 'Are there delivery fees?',
      answer: 'Delivery fees depend on your location and order size. Orders above KSh 2,000 qualify for free delivery within Nairobi.',
      category: 'delivery',
    },
  ]

  const categories = [
    { id: 'all', label: 'All', icon: 'apps-outline' },
    { id: 'general', label: 'General', icon: 'information-circle-outline' },
    { id: 'orders', label: 'Orders', icon: 'receipt-outline' },
    { id: 'payment', label: 'Payment', icon: 'card-outline' },
    { id: 'delivery', label: 'Delivery', icon: 'bike-outline' },
    { id: 'account', label: 'Account', icon: 'person-outline' },
  ]

  const filteredFAQs = faqData.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id)
  }

  const handleContactSupport = () => {
    if (!contactForm.subject || !contactForm.message) {
      Alert.alert('Error', 'Please fill in both subject and message.')
      return
    }

    Alert.alert(
      'Message Sent',
      'Thank you for contacting us. Our support team will respond within 24 hours.',
      [{ text: 'OK', onPress: () => setContactForm({ subject: '', message: '' }) }]
    )
  }

  const handleCallSupport = () => {
    Alert.alert(
      'Call Support',
      'Do you want to call our support hotline?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL('tel:+254700123456'),
        },
      ]
    )
  }

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@farmcare-expo.com?subject=Support Request&body=Please describe your issue...')
  }

  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/254700123456?text=Hello,%20I%20need%20support%20with...')
  }

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for help..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsCard}>
            <TouchableOpacity style={styles.quickAction} onPress={handleCallSupport}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="call-outline" size={24} color="#1976D2" />
              </View>
              <Text style={styles.quickActionText}>Call Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={handleEmailSupport}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="mail-outline" size={24} color={PRIMARY} />
              </View>
              <Text style={styles.quickActionText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={handleWhatsAppSupport}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.quickActionText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Ionicons
                    name={category.icon as any}
                    size={18}
                    color={selectedCategory === category.id ? '#fff' : PRIMARY}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Frequently Asked Questions ({filteredFAQs.length})
          </Text>
          <View style={styles.faqCard}>
            {filteredFAQs.map((faq) => (
              <View key={faq.id}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <View style={styles.faqQuestionLeft}>
                    <Ionicons
                      name={expandedFAQ === faq.id ? 'help-circle' : 'help-circle-outline'}
                      size={22}
                      color={PRIMARY}
                    />
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  </View>
                  <Ionicons
                    name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
                {faq.id !== filteredFAQs[filteredFAQs.length - 1].id && expandedFAQ !== faq.id && (
                  <View style={styles.faqDivider} />
                )}
              </View>
            ))}
            {filteredFAQs.length === 0 && (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term or category</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactCard}>
            <Text style={styles.contactDescription}>
              Can't find what you're looking for? Send us a message and we'll get back to you.
            </Text>
            <TextInput
              style={styles.contactInput}
              placeholder="Subject"
              value={contactForm.subject}
              onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
            />
            <TextInput
              style={[styles.contactInput, styles.contactTextarea]}
              placeholder="Describe your issue..."
              value={contactForm.message}
              onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleContactSupport}>
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          <View style={styles.resourcesCard}>
            <TouchableOpacity style={styles.resourceRow}>
              <View style={styles.resourceLeft}>
                <Ionicons name="book-outline" size={22} color={PRIMARY} />
                <Text style={styles.resourceLabel}>User Guide</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.resourceDivider} />
            <TouchableOpacity style={styles.resourceRow}>
              <View style={styles.resourceLeft}>
                <Ionicons name="videocam-outline" size={22} color={PRIMARY} />
                <Text style={styles.resourceLabel}>Video Tutorials</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.resourceDivider} />
            <TouchableOpacity style={styles.resourceRow}>
              <View style={styles.resourceLeft}>
                <Ionicons name="newspaper-outline" size={22} color={PRIMARY} />
                <Text style={styles.resourceLabel}>Blog & Updates</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  )
}

export default HelpSupportScreen

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
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  searchSection: { paddingHorizontal: 20, marginTop: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  quickActionsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  categoryChipActive: {
    backgroundColor: PRIMARY,
  },
  categoryChipText: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  faqQuestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  faqQuestionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  faqAnswer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  faqDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    fontWeight: '500',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  contactTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  resourcesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  resourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resourceLabel: {
    fontSize: 15,
    color: '#333',
  },
  resourceDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
})
