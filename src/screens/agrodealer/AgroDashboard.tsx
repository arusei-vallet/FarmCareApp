import React, { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import { LinearGradient } from 'expo-linear-gradient'

const { width } = Dimensions.get('window')

const AgroDashboard: React.FC = () => {
	const headerAnim = useRef(new Animated.Value(0)).current
	const cardPop = useRef(new Animated.Value(0.98)).current

	useEffect(() => {
		Animated.parallel([
			Animated.timing(headerAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
			Animated.spring(cardPop, { toValue: 1, friction: 6, useNativeDriver: true }),
		]).start()
	}, [])

	const overview = [
		{ id: 'sales', label: 'Weekly Sales', value: 'KES 128,400', icon: 'cash' },
		{ id: 'orders', label: 'New Orders', value: 54, icon: 'cart' },
		{ id: 'stock', label: 'Low Stock', value: 12, icon: 'package-variant' },
	]

	const inventory = [
		{ id: 'P-101', name: 'Tomatoes - Grade A', qty: '120 kg', price: 'KES 120/kg' },
		{ id: 'P-102', name: 'Maize - Organic', qty: '320 kg', price: 'KES 60/kg' },
		{ id: 'P-103', name: 'Rice - Premium', qty: '85 kg', price: 'KES 150/kg' },
	]

	const orders = [
		{ id: 'ORD-2001', buyer: 'Retailer A', total: 'KES 3,200', status: 'Pending' },
		{ id: 'ORD-2002', buyer: 'Wholesale B', total: 'KES 12,400', status: 'Confirmed' },
	]

	return (
		<LinearGradient colors={["#f7fcff", "#f0f9f4"]} style={{ flex: 1 }}>
			<ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

				<Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }] }>
					<View style={styles.headerLeft}>
						<View style={styles.avatar}><Ionicons name="storefront" size={20} color="#fff" /></View>
						<View>
							<Text style={styles.greeting}>Welcome back</Text>
							<Text style={styles.title}>Agro Dealer — FarmCare</Text>
						</View>
					</View>

					<View style={styles.headerRight}>
						<TouchableOpacity style={styles.iconBtn}><Ionicons name="notifications" size={20} color="#2e7d32" /></TouchableOpacity>
						<TouchableOpacity style={[styles.iconBtn, { marginLeft: 10 }]}><MCIcon name="message-text-outline" size={20} color="#2e7d32" /></TouchableOpacity>
					</View>
				</Animated.View>

				{/* Overview cards */}
				<Animated.View style={[styles.overviewRow, { transform: [{ scale: cardPop }] }] }>
					{overview.map(o => (
						<View key={o.id} style={styles.overCard}>
							<View style={styles.overIcon}><MCIcon name={o.icon} size={20} color="#2e7d32" /></View>
							<View>
								<Text style={styles.overValue}>{o.value}</Text>
								<Text style={styles.overLabel}>{o.label}</Text>
							</View>
						</View>
					))}
				</Animated.View>

				{/* Quick Actions */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Quick Actions</Text>
					<TouchableOpacity><Text style={styles.link}>Manage</Text></TouchableOpacity>
				</View>

				<View style={styles.actionsRow}>
					<TouchableOpacity style={styles.actionBtn}>
						<MCIcon name="plus-box" size={26} color="#fff" />
						<Text style={styles.actionText}>Add Stock</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1976d2' }]}>
						<MCIcon name="truck-fast" size={26} color="#fff" />
						<Text style={styles.actionText}>Create Order</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ff8f00' }]}>
						<MCIcon name="bank-transfer" size={26} color="#fff" />
						<Text style={styles.actionText}>Payments</Text>
					</TouchableOpacity>
				</View>

				{/* Inventory list */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Inventory</Text>
					<TouchableOpacity><Text style={styles.link}>View all</Text></TouchableOpacity>
				</View>

				<View style={styles.listCard}>
					{inventory.map(item => (
						<View key={item.id} style={styles.listRow}>
							<View style={{ flex: 1 }}>
								<Text style={styles.itemName}>{item.name}</Text>
								<Text style={styles.itemMeta}>{item.qty} • {item.price}</Text>
							</View>
							<TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>Edit</Text></TouchableOpacity>
						</View>
					))}
				</View>

				{/* Orders */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Recent Orders</Text>
					<TouchableOpacity><Text style={styles.link}>See all</Text></TouchableOpacity>
				</View>

				<View style={styles.listCard}>
					{orders.map(o => (
						<View key={o.id} style={styles.listRow}>
							<View style={{ flex: 1 }}>
								<Text style={styles.itemName}>{o.id} — {o.buyer}</Text>
								<Text style={styles.itemMeta}>{o.total} • {o.status}</Text>
							</View>
							<TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>Details</Text></TouchableOpacity>
						</View>
					))}
				</View>

				{/* Suppliers & Analytics placeholder */}
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Suppliers & Analytics</Text>
				</View>

				<View style={styles.analyticsRow}>
					<View style={styles.analyticsCard}>
						<Text style={styles.analyticsTitle}>Top Supplier</Text>
						<Text style={styles.analyticsValue}>Green Valley</Text>
					</View>
					<View style={styles.analyticsCard}>
						<Text style={styles.analyticsTitle}>Sales Trend</Text>
						<Text style={styles.analyticsValue}>+18% (wk)</Text>
					</View>
				</View>

				<View style={{ height: 36 }} />
			</ScrollView>
		</LinearGradient>
	)
}

export default AgroDashboard

const styles = StyleSheet.create({
	container: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 40 },
	header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
	headerLeft: { flexDirection: 'row', alignItems: 'center' },
	avatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
	greeting: { fontSize: 13, color: '#6b8f73' },
	title: { fontSize: 16, fontWeight: '800', color: '#163d1a' },
	headerRight: { flexDirection: 'row' },
	iconBtn: { backgroundColor: '#fff', padding: 8, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
	overviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
	overCard: { flex: 1, backgroundColor: '#fff', marginRight: 8, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
	overIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#e8f5e9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
	overValue: { fontSize: 14, fontWeight: '800', color: '#163d1a' },
	overLabel: { fontSize: 12, color: '#6b8f73', marginTop: 4 },
	sectionHeader: { marginTop: 18, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
	sectionTitle: { fontSize: 15, fontWeight: '800', color: '#163d1a' },
	link: { color: '#2e7d32', fontWeight: '700' },
	actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
	actionBtn: { flex: 1, backgroundColor: '#2e7d32', marginRight: 8, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
	actionText: { color: '#fff', marginTop: 8, fontWeight: '700' },
	listCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
	listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f2f4f3' },
	itemName: { fontWeight: '700', color: '#163d1a' },
	itemMeta: { fontSize: 12, color: '#6b8f73', marginTop: 4 },
	smallBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
	smallBtnText: { color: '#163d1a', fontWeight: '700' },
	analyticsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
	analyticsCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginRight: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
	analyticsTitle: { fontSize: 12, color: '#6b8f73' },
	analyticsValue: { fontSize: 16, fontWeight: '800', color: '#163d1a', marginTop: 6 },
	tipsCard: { marginTop: 12, backgroundColor: '#fff', padding: 14, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.03, elevation: 2 },
	tipsTitle: { fontSize: 15, fontWeight: '800', color: '#163d1a' },
	tipsText: { color: '#6b8f73', marginTop: 8 },
	tipsBtn: { marginTop: 10, backgroundColor: '#2e7d32', padding: 10, borderRadius: 10, alignItems: 'center' },
	tipsBtnText: { color: '#fff', fontWeight: '800' },
})
