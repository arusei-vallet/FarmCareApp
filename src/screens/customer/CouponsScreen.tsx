import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Clipboard,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../services/supabase'

const PRIMARY = '#1B5E20'
const ACCENT = '#2ECC71'
const SECONDARY = '#4CAF50'

interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_discount_amount?: number
  is_used: boolean
  used_at?: string
  expires_at: string
  created_at: string
}

const CouponsScreen = () => {
  const navigation = useNavigation()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: couponsData, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('user_id', user.id)
        .order('expires_at', { ascending: true })

      if (error) {
        console.error('Error fetching coupons:', error)
        return
      }

      setCoupons(couponsData || [])
    } catch (error) {
      console.error('Unexpected error fetching coupons:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchCoupons()
  }

  const copyCode = (code: string) => {
    Clipboard.setString(code)
    Alert.alert('Copied!', `Coupon code "${code}" copied to clipboard`)
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`
    }
    return `KES ${coupon.discount_value} OFF`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getDiscountColor = (coupon: Coupon) => {
    if (coupon.is_used) return '#9E9E9E'
    if (isExpired(coupon.expires_at)) return '#FF5722'
    if (coupon.discount_type === 'percentage') return '#FF9800'
    return PRIMARY
  }

  const renderCoupon = (coupon: Coupon, index: number) => {
    const expired = isExpired(coupon.expires_at)
    const used = coupon.is_used

    return (
      <View key={coupon.id} style={styles.couponCard}>
        <LinearGradient
          colors={used ? ['#f5f5f5', '#e0e0e0'] : expired ? ['#fff3e0', '#ffe0b2'] : ['#E8F5E9', '#C8E6C9']}
          style={styles.couponGradient}
        >
          {/* Left side - Discount badge */}
          <View style={[styles.discountBadge, { backgroundColor: getDiscountColor(coupon) + '20' }]}>
            <Text style={[styles.discountText, { color: getDiscountColor(coupon) }]}>
              {formatDiscount(coupon)}
            </Text>
            {coupon.max_discount_amount && coupon.discount_type === 'percentage' && (
              <Text style={styles.maxDiscountText}>
                Max KES {coupon.max_discount_amount}
              </Text>
            )}
          </View>

          {/* Dotted line separator */}
          <View style={styles.dottedLineContainer}>
            <View style={styles.dottedLine}>
              {[...Array(15)].map((_, i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
          </View>

          {/* Right side - Coupon details */}
          <View style={styles.couponDetails}>
            <View style={styles.codeContainer}>
              <Text style={styles.couponCode}>{coupon.code}</Text>
              {!used && !expired && (
                <TouchableOpacity onPress={() => copyCode(coupon.code)}>
                  <Ionicons name="copy-outline" size={20} color={PRIMARY} />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.couponDescription} numberOfLines={2}>
              {coupon.description}
            </Text>

            <View style={styles.couponMeta}>
              <View style={styles.minOrder}>
                <Ionicons name="cart-outline" size={14} color="#666" />
                <Text style={styles.minOrderText}>
                  Min: KES {coupon.min_order_amount}
                </Text>
              </View>

              <View style={[styles.expiryBadge, expired && styles.expiredBadge]}>
                <Ionicons 
                  name={expired ? 'close-circle' : 'time-outline'} 
                  size={14} 
                  color={expired ? '#FF5722' : PRIMARY} 
                />
                <Text style={[styles.expiryText, expired && styles.expiredText]}>
                  {expired ? 'Expired' : 'Exp'} {formatDate(coupon.expires_at)}
                </Text>
              </View>
            </View>

            {used && (
              <View style={styles.usedBadge}>
                <Text style={styles.usedText}>Used on {formatDate(coupon.used_at || '')}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    )
  }

  const activeCoupons = coupons.filter(c => !c.is_used && !isExpired(c.expires_at))
  const expiredCoupons = coupons.filter(c => isExpired(c.expires_at) || c.is_used)

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coupons</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Ionicons name="pricetag-outline" size={24} color={SECONDARY} />
          <Text style={styles.summaryValue}>{activeCoupons.length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Ionicons name="time-outline" size={24} color="#FF9800" />
          <Text style={styles.summaryValue}>{expiredCoupons.length}</Text>
          <Text style={styles.summaryLabel}>Expired/Used</Text>
        </View>
      </View>

      {/* Coupons List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading your coupons...</Text>
        </View>
      ) : coupons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Coupons Yet</Text>
          <Text style={styles.emptyText}>
            Coupons will appear here when you earn them or during promotions
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
            />
          }
        >
          {/* Active Coupons */}
          {activeCoupons.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Active Coupons</Text>
              {activeCoupons.map((coupon, index) => renderCoupon(coupon, index))}
            </>
          )}

          {/* Expired/Used Coupons */}
          {expiredCoupons.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Expired & Used</Text>
              {expiredCoupons.map((coupon, index) => renderCoupon(coupon, index))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </LinearGradient>
  )
}

export default CouponsScreen

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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '700', color: PRIMARY, marginTop: 8 },
  summaryLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: '#f0f0f0', marginHorizontal: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  couponCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  couponGradient: {
    flexDirection: 'row',
    minHeight: 120,
  },
  discountBadge: {
    width: 100,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  discountText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  maxDiscountText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  dottedLineContainer: {
    width: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dottedLine: {
    flexDirection: 'column',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  couponDetails: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    fontFamily: 'monospace',
  },
  couponDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    flex: 1,
  },
  couponMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minOrderText: {
    fontSize: 11,
    color: '#666',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(27, 94, 32, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expiredBadge: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
  },
  expiryText: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: '500',
  },
  expiredText: {
    color: '#FF5722',
  },
  usedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(158, 158, 158, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  usedText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
})
