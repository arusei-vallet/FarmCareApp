// src/screens/farmer/AnalyticsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const screenWidth = Dimensions.get('window').width;

interface StatCardProps {
  icon: string;
  iconColor: string;
  bgColor: string;
  value: string | number;
  label: string;
  trend?: string;
  trendPositive?: boolean;
}

const AnalyticsScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [revenueDetailsVisible, setRevenueDetailsVisible] = useState(false);
  const [orderTrendsVisible, setOrderTrendsVisible] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingDeliveries: 0,
    avgOrderValue: 0,
    growthRate: 0,
    topProduct: 'N/A',
    customerSatisfaction: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
  });
  const [chartData, setChartData] = useState({
    revenue: [] as number[],
    orders: [] as number[],
    labels: [] as string[],
  });
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [productDetails, setProductDetails] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all orders for this seller
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch all products for this seller
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, review_count, rating, is_available')
        .eq('seller_id', user.id);

      if (productsError) throw productsError;

      // Calculate analytics
      const now = new Date();
      const periodStart = getPeriodStart(selectedPeriod);
      
      // Filter orders by period
      const filteredOrders = orders?.filter(order => 
        new Date(order.created_at) >= periodStart
      ) || [];

      const previousPeriodStart = getPreviousPeriodStart(selectedPeriod);
      const previousOrders = orders?.filter(order => 
        new Date(order.created_at) >= previousPeriodStart && 
        new Date(order.created_at) < periodStart
      ) || [];

      // Calculate revenue from completed/delivered orders
      const completedOrders = filteredOrders.filter(o => 
        o.status === 'delivered' || o.status === 'confirmed'
      );
      
      const totalRevenue = completedOrders.reduce((sum, order) => 
        sum + (order.total_amount || 0), 0
      );

      const previousRevenue = previousOrders
        .filter(o => o.status === 'delivered' || o.status === 'confirmed')
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // Calculate growth rate
      const growthRate = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      // Calculate total orders (all statuses except cancelled)
      const totalOrders = filteredOrders.filter(o => o.status !== 'cancelled').length;

      // Pending deliveries
      const pendingDeliveries = filteredOrders.filter(o => 
        o.status === 'shipped' || o.status === 'processing'
      ).length;

      // Average order value
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Cancelled orders
      const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled').length;

      // Top product (by order count)
      const productOrderCount = new Map<string, number>();
      filteredOrders.forEach(order => {
        // We'd need order_items for accurate data, using seller's products as fallback
        if (products && products.length > 0) {
          const productName = products[0]?.name || 'Unknown Product';
          productOrderCount.set(productName, (productOrderCount.get(productName) || 0) + 1);
        }
      });

      let topProduct = 'N/A';
      let maxOrders = 0;
      productOrderCount.forEach((count, name) => {
        if (count > maxOrders) {
          maxOrders = count;
          topProduct = name;
        }
      });

      // If no order data, use first product name
      if (topProduct === 'N/A' && products && products.length > 0) {
        topProduct = products[0]?.name || 'N/A';
      }

      // Customer satisfaction (average rating from products)
      const ratedProducts = products?.filter(p => p.review_count > 0) || [];
      const customerSatisfaction = ratedProducts.length > 0
        ? ratedProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedProducts.length
        : 0;

      // Total and active products
      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_available).length || 0;

      // Store detailed data for insights
      setOrderDetails(filteredOrders);
      setProductDetails(products || []);

      // Generate chart data
      const chartData = generateChartData(orders, selectedPeriod);

      setAnalyticsData({
        totalRevenue,
        totalOrders,
        pendingDeliveries,
        avgOrderValue: Math.round(avgOrderValue),
        growthRate: Math.round(growthRate),
        topProduct,
        customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
        completedOrders: completedOrders.length,
        cancelledOrders,
        totalProducts,
        activeProducts,
      });

      setChartData(chartData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPeriodStart = (period: 'week' | 'month' | 'year'): Date => {
    const now = new Date();
    switch (period) {
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return yearAgo;
    }
  };

  const getPreviousPeriodStart = (period: 'week' | 'month' | 'year'): Date => {
    const now = new Date();
    switch (period) {
      case 'week':
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        return twoWeeksAgo;
      case 'month':
        const twoMonthsAgo = new Date(now);
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        return twoMonthsAgo;
      case 'year':
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        return twoYearsAgo;
    }
  };

  const generateChartData = (orders: any[], period: 'week' | 'month' | 'year') => {
    const revenue: number[] = [];
    const orderCounts: number[] = [];
    const labels: string[] = [];

    if (period === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayOrders = orders?.filter(order => 
          order.created_at.startsWith(dateStr)
        ) || [];
        
        orderCounts.push(dayOrders.length);
        revenue.push(
          dayOrders
            .filter(o => o.status === 'delivered' || o.status === 'confirmed')
            .reduce((sum, o) => sum + o.total_amount, 0)
        );
      }
    } else if (period === 'month') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear().toString().slice(-2);
        
        labels.push(`${month} '${year}`);
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        }) || [];
        
        orderCounts.push(monthOrders.length);
        revenue.push(
          monthOrders
            .filter(o => o.status === 'delivered' || o.status === 'confirmed')
            .reduce((sum, o) => sum + o.total_amount, 0)
        );
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        }) || [];
        
        orderCounts.push(monthOrders.length);
        revenue.push(
          monthOrders
            .filter(o => o.status === 'delivered' || o.status === 'confirmed')
            .reduce((sum, o) => sum + o.total_amount, 0)
        );
      }
    }

    return { revenue, orders: orderCounts, labels };
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const handleViewRevenueDetails = () => {
    setRevenueDetailsVisible(true);
  };

  const handleViewOrderTrends = () => {
    setOrderTrendsVisible(true);
  };

  const getOrderStatusColor = (status: string): string => {
    switch (status) {
      case 'delivered':
      case 'confirmed':
        return '#e8f5e9';
      case 'pending':
      case 'processing':
      case 'shipped':
        return '#fff3e0';
      case 'cancelled':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  };

  // Bar chart data - Revenue
  const barData = useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.revenue.map(v => Math.round(v)),
      },
    ],
  }), [chartData]);

  // Line chart data - Orders
  const lineData = useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.orders,
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Orders"],
  }), [chartData]);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#e0e0e0",
      strokeWidth: 0.5,
    },
    style: {
      borderRadius: 12,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#2e7d32",
    },
  };

  const compactChartConfig = {
    ...chartConfig,
    labelColor: (opacity = 1) => `rgba(108, 117, 125, ${opacity})`,
  };

  const StatCard: React.FC<StatCardProps> = ({ icon, iconColor, bgColor, value, label, trend, trendPositive }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
        <MCIcon name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend && trend !== 'N/A' && (
        <View style={styles.trendContainer}>
          <MCIcon
            name={trendPositive ? "arrow-up-right" : "arrow-down-right"}
            size={12}
            color={trendPositive ? "#2e7d32" : "#c62828"}
          />
          <Text style={[styles.trendText, trendPositive && styles.trendTextPositive]}>
            {trend}
          </Text>
        </View>
      )}
    </View>
  );

  const PeriodFilter: React.FC<{
    label: string;
    active: boolean;
    onPress: () => void;
  }> = ({ label, active, onPress }) => (
    <TouchableOpacity
      style={[styles.periodChip, active && styles.periodChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
        <View style={styles.fullLoading}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.fullLoadingText}>Loading analytics...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f5f9f5', '#e8f5e9', '#ffffff']} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#1b4332" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Analytics</Text>
              <Text style={styles.headerSubtitle}>Track your performance</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download-outline" size={20} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Period Filter */}
        <View style={styles.filterContainer}>
          <PeriodFilter
            label="Weekly"
            active={selectedPeriod === 'week'}
            onPress={() => setSelectedPeriod('week')}
          />
          <PeriodFilter
            label="Monthly"
            active={selectedPeriod === 'month'}
            onPress={() => setSelectedPeriod('month')}
          />
          <PeriodFilter
            label="Yearly"
            active={selectedPeriod === 'year'}
            onPress={() => setSelectedPeriod('year')}
          />
        </View>

        {/* Statistics Cards - Compact */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <StatCard
            icon="cash"
            iconColor="#1b5e20"
            bgColor="#e8f5e9"
            value={`KES ${analyticsData.totalRevenue.toLocaleString()}`}
            label="Total Revenue"
            trend={`${analyticsData.growthRate}% vs last period`}
            trendPositive={analyticsData.growthRate >= 0}
          />
          <StatCard
            icon="cart-outline"
            iconColor="#1565c0"
            bgColor="#e3f2fd"
            value={analyticsData.totalOrders}
            label="Total Orders"
            trend={`${analyticsData.completedOrders} completed`}
            trendPositive={true}
          />
          <StatCard
            icon="truck-delivery"
            iconColor="#ef6c00"
            bgColor="#fff3e0"
            value={analyticsData.pendingDeliveries}
            label="Pending"
            trend={`${analyticsData.cancelledOrders} cancelled`}
            trendPositive={analyticsData.cancelledOrders === 0}
          />
          <StatCard
            icon="star"
            iconColor="#fbc02d"
            bgColor="#fffde7"
            value={analyticsData.customerSatisfaction > 0 ? analyticsData.customerSatisfaction : 'N/A'}
            label="Rating"
            trend={analyticsData.customerSatisfaction > 0 ? 'Based on reviews' : undefined}
            trendPositive={true}
          />
        </ScrollView>

        {/* Bar Chart Section - Compact */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Revenue Overview</Text>
            <TouchableOpacity onPress={handleViewRevenueDetails}>
              <Text style={styles.viewAllText}>View Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartCard}>
            {loading ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={styles.chartLoadingText}>Loading chart data...</Text>
              </View>
            ) : (
              <BarChart
                data={barData}
                width={screenWidth - 40}
                height={160}
                yAxisLabel="KES "
                yAxisSuffix=""
                chartConfig={compactChartConfig}
                style={styles.chartStyle}
                fromZero
                withInnerLines={false}
                showBarTops={false}
                showValuesOnTopOfBars={true}
              />
            )}
          </View>
        </View>

        {/* Line Chart Section - Compact */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Order Trends</Text>
            <TouchableOpacity onPress={handleViewOrderTrends}>
              <Text style={styles.viewAllText}>View Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chartCard}>
            {loading ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={styles.chartLoadingText}>Loading chart data...</Text>
              </View>
            ) : (
              <LineChart
                data={lineData}
                width={screenWidth - 40}
                height={160}
                chartConfig={compactChartConfig}
                bezier
                style={styles.chartStyle}
                fromZero
                withInnerLines={false}
                withShadow={false}
              />
            )}
          </View>
        </View>

        {/* Insights Section */}
        <View style={styles.insights}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <View style={styles.insightsGrid}>
            <TouchableOpacity
              onPress={() => setSelectedInsight('revenue')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#e8f5e9', '#f1f8e9']}
                style={styles.insightCard}
              >
                <View style={styles.insightIcon}>
                  <MCIcon name="trending-up" size={20} color="#2e7d32" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightText}>
                    Revenue {analyticsData.growthRate >= 0 ? 'up' : 'down'} {Math.abs(analyticsData.growthRate)}% from last period
                  </Text>
                  <Text style={styles.insightSubtext}>Tap to view breakdown</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#2e7d32" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedInsight('orders')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#e3f2fd', '#f1f8e9']}
                style={styles.insightCard}
              >
                <View style={styles.insightIcon}>
                  <MCIcon name="truck-check" size={20} color="#1565c0" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightText}>
                    {analyticsData.completedOrders} orders completed
                  </Text>
                  <Text style={styles.insightSubtext}>Tap to view details</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#1565c0" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedInsight('products')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#fff3e0', '#fff8e1']}
                style={styles.insightCard}
              >
                <View style={styles.insightIcon}>
                  <MCIcon name="cart-check" size={20} color="#ef6c00" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightText}>
                    {analyticsData.topProduct}
                  </Text>
                  <Text style={styles.insightSubtext}>Best selling product</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ef6c00" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedInsight('customers')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#f3e5f5', '#f1f8e9']}
                style={styles.insightCard}
              >
                <View style={styles.insightIcon}>
                  <MCIcon name="account-group" size={20} color="#7b1fa2" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightText}>
                    Avg. order value: KES {analyticsData.avgOrderValue}
                  </Text>
                  <Text style={styles.insightSubtext}>Customer spending insights</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#7b1fa2" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedInsight('inventory')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#ffebee', '#f1f8e9']}
                style={styles.insightCard}
              >
                <View style={styles.insightIcon}>
                  <MCIcon name="package-variant" size={20} color="#c62828" />
                </View>
                <View style={styles.insightTextContainer}>
                  <Text style={styles.insightText}>
                    {analyticsData.activeProducts} of {analyticsData.totalProducts} active
                  </Text>
                  <Text style={styles.insightSubtext}>Tap to manage inventory</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#c62828" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Revenue Breakdown Modal */}
      <Modal visible={selectedInsight === 'revenue'} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Revenue Breakdown</Text>
                <TouchableOpacity onPress={() => setSelectedInsight(null)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.revenueSummary}>
                  <Text style={styles.revenueAmount}>KES {analyticsData.totalRevenue.toLocaleString()}</Text>
                  <Text style={styles.revenueLabel}>Total Revenue ({selectedPeriod})</Text>
                  <View style={styles.growthBadge}>
                    <MCIcon
                      name={analyticsData.growthRate >= 0 ? "trending-up" : "trending-down"}
                      size={16}
                      color={analyticsData.growthRate >= 0 ? "#2e7d32" : "#c62828"}
                    />
                    <Text style={[
                      styles.growthText,
                      { color: analyticsData.growthRate >= 0 ? "#2e7d32" : "#c62828" }
                    ]}>
                      {Math.abs(analyticsData.growthRate)}% from previous period
                    </Text>
                  </View>
                </View>

                <View style={styles.revenueStats}>
                  <View style={styles.revenueStatBox}>
                    <Text style={styles.revenueStatValue}>KES {analyticsData.avgOrderValue}</Text>
                    <Text style={styles.revenueStatLabel}>Avg Order Value</Text>
                  </View>
                  <View style={styles.revenueStatBox}>
                    <Text style={styles.revenueStatValue}>{analyticsData.completedOrders}</Text>
                    <Text style={styles.revenueStatLabel}>Completed Orders</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Recent Orders</Text>
                {orderDetails.slice(0, 10).map((order, index) => (
                  <View key={index} style={styles.orderItem}>
                    <View style={styles.orderItemLeft}>
                      <View style={[
                        styles.orderStatusBadge,
                        { backgroundColor: order.status === 'delivered' ? '#e8f5e9' : '#fff3e0' }
                      ]}>
                        <Text style={[
                          styles.orderStatusText,
                          { color: order.status === 'delivered' ? '#2e7d32' : '#ef6c00' }
                        ]}>
                          {order.status}
                        </Text>
                      </View>
                      <Text style={styles.orderItemText}>Order #{order.order_number?.slice(-6) || 'N/A'}</Text>
                    </View>
                    <Text style={styles.orderItemAmount}>KES {order.total_amount}</Text>
                  </View>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Orders Details Modal */}
      <Modal visible={selectedInsight === 'orders'} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Order Details</Text>
                <TouchableOpacity onPress={() => setSelectedInsight(null)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.orderStats}>
                  <View style={styles.orderStatBox}>
                    <Text style={[styles.orderStatValue, { color: '#2e7d32' }]}>{analyticsData.completedOrders}</Text>
                    <Text style={styles.orderStatLabel}>Completed</Text>
                  </View>
                  <View style={styles.orderStatBox}>
                    <Text style={[styles.orderStatValue, { color: '#ef6c00' }]}>{analyticsData.pendingDeliveries}</Text>
                    <Text style={styles.orderStatLabel}>Pending</Text>
                  </View>
                  <View style={styles.orderStatBox}>
                    <Text style={[styles.orderStatValue, { color: '#c62828' }]}>{analyticsData.cancelledOrders}</Text>
                    <Text style={styles.orderStatLabel}>Cancelled</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>All Orders</Text>
                {orderDetails.map((order, index) => (
                  <View key={index} style={styles.orderItem}>
                    <View style={styles.orderItemLeft}>
                      <View style={[
                        styles.orderStatusBadge,
                        { backgroundColor: getOrderStatusColor(order.status) }
                      ]}>
                        <Text style={styles.orderStatusText}>{order.status}</Text>
                      </View>
                      <View>
                        <Text style={styles.orderItemText}>Order #{order.order_number?.slice(-6) || 'N/A'}</Text>
                        <Text style={styles.orderItemDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderItemAmount}>KES {order.total_amount}</Text>
                  </View>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Product Details Modal */}
      <Modal visible={selectedInsight === 'products'} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Product Performance</Text>
                <TouchableOpacity onPress={() => setSelectedInsight(null)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.topProductCard}>
                  <MCIcon name="award" size={40} color="#ef6c00" />
                  <Text style={styles.topProductLabel}>Best Seller</Text>
                  <Text style={styles.topProductName}>{analyticsData.topProduct}</Text>
                  <Text style={styles.topProductStats}>Top performing product this period</Text>
                </View>

                <Text style={styles.modalSectionTitle}>All Products</Text>
                {productDetails.map((product, index) => (
                  <View key={index} style={styles.productItem}>
                    <View style={styles.productItemLeft}>
                      <View style={[
                        styles.productAvailability,
                        { backgroundColor: product.is_available ? '#e8f5e9' : '#ffebee' }
                      ]}>
                        <MCIcon
                          name={product.is_available ? "check-circle" : "cancel"}
                          size={16}
                          color={product.is_available ? "#2e7d32" : "#c62828"}
                        />
                      </View>
                      <Text style={styles.productItemText}>{product.name}</Text>
                    </View>
                    <View style={styles.productRating}>
                      <MCIcon name="star" size={14} color="#fbc02d" />
                      <Text style={styles.productRatingText}>{product.rating || '0'}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Customer Insights Modal */}
      <Modal visible={selectedInsight === 'customers'} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Customer Insights</Text>
                <TouchableOpacity onPress={() => setSelectedInsight(null)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.customerStats}>
                  <View style={styles.customerStatCard}>
                    <MCIcon name="cash" size={28} color="#7b1fa2" />
                    <Text style={styles.customerStatValue}>KES {analyticsData.avgOrderValue}</Text>
                    <Text style={styles.customerStatLabel}>Average Order Value</Text>
                  </View>
                  <View style={styles.customerStatCard}>
                    <MCIcon name="star" size={28} color="#fbc02d" />
                    <Text style={styles.customerStatValue}>{analyticsData.customerSatisfaction}</Text>
                    <Text style={styles.customerStatLabel}>Customer Rating</Text>
                  </View>
                </View>

                <View style={styles.tipCard}>
                  <MCIcon name="lightbulb-on" size={24} color="#f57f17" />
                  <Text style={styles.tipTitle}>Tip to Increase Sales</Text>
                  <Text style={styles.tipText}>
                    Customers spend an average of KES {Math.round(analyticsData.avgOrderValue * 1.2)} when you offer bundle deals. Consider creating product bundles!
                  </Text>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Inventory Management Modal */}
      <Modal visible={selectedInsight === 'inventory'} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Inventory Overview</Text>
                <TouchableOpacity onPress={() => setSelectedInsight(null)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.inventorySummary}>
                  <View style={styles.inventoryStatCard}>
                    <Text style={[styles.inventoryStatValue, { color: '#2e7d32' }]}>{analyticsData.activeProducts}</Text>
                    <Text style={styles.inventoryStatLabel}>Active</Text>
                  </View>
                  <View style={styles.inventoryStatCard}>
                    <Text style={[styles.inventoryStatValue, { color: '#c62828' }]}>{analyticsData.totalProducts - analyticsData.activeProducts}</Text>
                    <Text style={styles.inventoryStatLabel}>Inactive</Text>
                  </View>
                  <View style={styles.inventoryStatCard}>
                    <Text style={[styles.inventoryStatValue, { color: '#1565c0' }]}>{analyticsData.totalProducts}</Text>
                    <Text style={styles.inventoryStatLabel}>Total</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Product List</Text>
                {productDetails.map((product, index) => (
                  <View key={index} style={styles.productItem}>
                    <View style={styles.productItemLeft}>
                      <View style={[
                        styles.productAvailability,
                        { backgroundColor: product.is_available ? '#e8f5e9' : '#ffebee' }
                      ]}>
                        <MCIcon
                          name={product.is_available ? "check-circle" : "cancel"}
                          size={16}
                          color={product.is_available ? "#2e7d32" : "#c62828"}
                        />
                      </View>
                      <Text style={styles.productItemText}>{product.name}</Text>
                    </View>
                    <TouchableOpacity style={styles.editProductBtn}>
                      <MCIcon name="pencil-outline" size={18} color="#2e7d32" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Revenue Details Modal */}
      <Modal visible={revenueDetailsVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Revenue Details</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedPeriod === 'week' ? 'Last 7 days' : selectedPeriod === 'month' ? 'Last 6 months' : 'Last 12 months'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setRevenueDetailsVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Revenue Summary */}
                <View style={styles.revenueSummaryCard}>
                  <Text style={styles.revenueTotalAmount}>KES {analyticsData.totalRevenue.toLocaleString()}</Text>
                  <Text style={styles.revenueTotalLabel}>Total Revenue</Text>
                  <View style={[styles.growthBadge, { backgroundColor: analyticsData.growthRate >= 0 ? '#e8f5e9' : '#ffebee' }]}>
                    <MCIcon
                      name={analyticsData.growthRate >= 0 ? "trending-up" : "trending-down"}
                      size={16}
                      color={analyticsData.growthRate >= 0 ? "#2e7d32" : "#c62828"}
                    />
                    <Text style={[
                      styles.growthBadgeText,
                      { color: analyticsData.growthRate >= 0 ? "#2e7d32" : "#c62828" }
                    ]}>
                      {analyticsData.growthRate >= 0 ? '+' : ''}{analyticsData.growthRate}% from previous period
                    </Text>
                  </View>
                </View>

                {/* Revenue Breakdown by Period */}
                <Text style={styles.modalSectionTitle}>Revenue Breakdown</Text>
                {chartData.revenue.map((revenue, index) => (
                  <View key={index} style={styles.revenueBreakdownItem}>
                    <View style={styles.revenueBreakdownLeft}>
                      <MCIcon name="calendar-today" size={18} color="#2e7d32" />
                      <Text style={styles.revenueBreakdownLabel}>{chartData.labels[index]}</Text>
                    </View>
                    <Text style={styles.revenueBreakdownValue}>KES {Math.round(revenue).toLocaleString()}</Text>
                  </View>
                ))}

                {/* Order Statistics */}
                <Text style={styles.modalSectionTitle}>Order Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <MCIcon name="check-circle" size={24} color="#2e7d32" />
                    <Text style={styles.statBoxValue}>{analyticsData.completedOrders}</Text>
                    <Text style={styles.statBoxLabel}>Completed</Text>
                  </View>
                  <View style={styles.statBox}>
                    <MCIcon name="alert-circle" size={24} color="#ef6c00" />
                    <Text style={styles.statBoxValue}>{analyticsData.cancelledOrders}</Text>
                    <Text style={styles.statBoxLabel}>Cancelled</Text>
                  </View>
                  <View style={styles.statBox}>
                    <MCIcon name="cash-multiple" size={24} color="#1565c0" />
                    <Text style={styles.statBoxValue}>KES {Math.round(analyticsData.avgOrderValue).toLocaleString()}</Text>
                    <Text style={styles.statBoxLabel}>Avg Order</Text>
                  </View>
                </View>

                {/* Top Performing Period */}
                <View style={styles.topPeriodCard}>
                  <View style={styles.topPeriodHeader}>
                    <MCIcon name="trophy" size={24} color="#fbc02d" />
                    <Text style={styles.topPeriodTitle}>Best Performing Period</Text>
                  </View>
                  {(() => {
                    const maxRevenue = Math.max(...chartData.revenue);
                    const bestIndex = chartData.revenue.indexOf(maxRevenue);
                    return (
                      <>
                        <Text style={styles.topPeriodLabel}>{chartData.labels[bestIndex]}</Text>
                        <Text style={styles.topPeriodAmount}>KES {Math.round(maxRevenue).toLocaleString()}</Text>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setRevenueDetailsVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Order Trends Details Modal */}
      <Modal visible={orderTrendsVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient colors={['#ffffff', '#f1f8e9']} style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Order Trends</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedPeriod === 'week' ? 'Last 7 days' : selectedPeriod === 'month' ? 'Last 6 months' : 'Last 12 months'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setOrderTrendsVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Order Summary */}
                <View style={styles.orderSummaryCard}>
                  <View style={styles.orderSummaryRow}>
                    <View style={styles.orderSummaryStat}>
                      <Text style={styles.orderSummaryValue}>{analyticsData.totalOrders}</Text>
                      <Text style={styles.orderSummaryLabel}>Total Orders</Text>
                    </View>
                    <View style={[styles.orderSummaryStat, { borderLeftWidth: 1, borderLeftColor: '#e0e0e0', paddingLeft: 20 }]}>
                      <Text style={styles.orderSummaryValue}>{analyticsData.pendingDeliveries}</Text>
                      <Text style={styles.orderSummaryLabel}>Pending</Text>
                    </View>
                  </View>
                </View>

                {/* Orders by Period */}
                <Text style={styles.modalSectionTitle}>Orders Over Time</Text>
                {chartData.orders.map((orderCount, index) => (
                  <View key={index} style={styles.orderTrendItem}>
                    <View style={styles.orderTrendLeft}>
                      <View style={[styles.orderTrendDot, { backgroundColor: orderCount > 0 ? '#2e7d32' : '#bdbdbd' }]}>
                        {orderCount > 0 && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <Text style={styles.orderTrendLabel}>{chartData.labels[index]}</Text>
                    </View>
                    <Text style={styles.orderTrendValue}>{orderCount} orders</Text>
                  </View>
                ))}

                {/* Order Status Breakdown */}
                <Text style={styles.modalSectionTitle}>Order Status Breakdown</Text>
                <View style={styles.statusBreakdownGrid}>
                  <View style={[styles.statusBreakdownCard, { backgroundColor: '#e8f5e9' }]}>
                    <MCIcon name="check-circle" size={28} color="#2e7d32" />
                    <Text style={styles.statusBreakdownValue}>{analyticsData.completedOrders}</Text>
                    <Text style={styles.statusBreakdownLabel}>Delivered</Text>
                  </View>
                  <View style={[styles.statusBreakdownCard, { backgroundColor: '#fff3e0' }]}>
                    <MCIcon name="truck-delivery" size={28} color="#ef6c00" />
                    <Text style={styles.statusBreakdownValue}>{analyticsData.pendingDeliveries}</Text>
                    <Text style={styles.statusBreakdownLabel}>In Transit</Text>
                  </View>
                  <View style={[styles.statusBreakdownCard, { backgroundColor: '#ffebee' }]}>
                    <MCIcon name="close-circle" size={28} color="#c62828" />
                    <Text style={styles.statusBreakdownValue}>{analyticsData.cancelledOrders}</Text>
                    <Text style={styles.statusBreakdownLabel}>Cancelled</Text>
                  </View>
                </View>

                {/* Insights */}
                <View style={styles.trendInsightsCard}>
                  <View style={styles.trendInsightsHeader}>
                    <Ionicons name="lightbulb-outline" size={20} color="#fbc02d" />
                    <Text style={styles.trendInsightsTitle}>Key Insights</Text>
                  </View>
                  {(() => {
                    const avgOrders = chartData.orders.length > 0 
                      ? chartData.orders.reduce((a, b) => a + b, 0) / chartData.orders.length 
                      : 0;
                    const maxOrders = Math.max(...chartData.orders);
                    const minOrders = Math.min(...chartData.orders);
                    return (
                      <>
                        <View style={styles.insightRow}>
                          <Ionicons name="arrow-up-circle" size={16} color="#2e7d32" />
                          <Text style={styles.insightText}>
                            Average {Math.round(avgOrders)} orders per period
                          </Text>
                        </View>
                        <View style={styles.insightRow}>
                          <Ionicons name="trending-up" size={16} color="#1565c0" />
                          <Text style={styles.insightText}>
                            Peak: {maxOrders} orders, Low: {minOrders} orders
                          </Text>
                        </View>
                        <View style={styles.insightRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
                          <Text style={styles.trendInsightText}>
                            {analyticsData.totalOrders > 0
                              ? `${Math.round((analyticsData.completedOrders / analyticsData.totalOrders) * 100)}% completion rate`
                              : 'No orders yet'
                            }
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setOrderTrendsVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default AnalyticsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b4332',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  exportBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  periodChipActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  periodChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  periodChipTextActive: {
    color: '#fff',
  },
  statsScrollContent: {
    paddingRight: 10,
    paddingBottom: 10,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    minWidth: 130,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b4332',
  },
  statLabel: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 3,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 10,
    color: '#c62828',
    marginLeft: 3,
    fontWeight: '500',
  },
  trendTextPositive: {
    color: '#2e7d32',
  },
  searchContainer: {
    marginVertical: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  chartSection: {
    marginBottom: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b4332',
  },
  viewAllText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  chartStyle: {
    borderRadius: 12,
    marginVertical: 8,
  },
  chartLoading: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
  },
  fullLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  insights: {
    marginBottom: 10,
  },
  insightsGrid: {
    gap: 10,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#1b4332',
    fontWeight: '600',
    lineHeight: 18,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightSubtext: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 2,
  },
  // Modal styles
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
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1b4332' },
  modalScroll: {
    maxHeight: 450,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b4332',
    marginTop: 16,
    marginBottom: 12,
  },
  // Revenue breakdown styles
  revenueSummaryCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    marginBottom: 20,
  },
  revenueTotalAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1b4332',
  },
  revenueTotalLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  revenueBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  revenueBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  revenueBreakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b4332',
  },
  revenueBreakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e7d32',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b4332',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
  },
  topPeriodCard: {
    backgroundColor: '#fff8e1',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  topPeriodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  topPeriodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b4332',
  },
  topPeriodLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
  },
  topPeriodAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f57f17',
    marginTop: 4,
  },
  // Order trends styles
  orderSummaryCard: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  orderSummaryStat: {
    alignItems: 'center',
  },
  orderSummaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1565c0',
  },
  orderSummaryLabel: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 4,
  },
  orderTrendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  orderTrendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderTrendDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderTrendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b4332',
  },
  orderTrendValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e7d32',
  },
  statusBreakdownGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statusBreakdownCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  statusBreakdownValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b4332',
  },
  statusBreakdownLabel: {
    fontSize: 11,
    color: '#6c757d',
    textAlign: 'center',
  },
  trendInsightsCard: {
    backgroundColor: '#fffde7',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  trendInsightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trendInsightsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b4332',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trendInsightText: {
    fontSize: 13,
    color: '#6c757d',
    flex: 1,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  growthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 4,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    flex: 1,
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  modalBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 15,
  },
  revenueSummary: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    marginBottom: 16,
  },
  revenueAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1b4332',
  },
  revenueLabel: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 4,
  },
  revenueStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  revenueStatBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  revenueStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
  },
  revenueStatLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
  },
  // Order styles
  orderStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  orderStatBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  orderStatLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  orderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderItemText: {
    fontSize: 13,
    color: '#1b4332',
    fontWeight: '600',
  },
  orderItemDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  orderItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  // Product styles
  topProductCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff3e0',
    borderRadius: 16,
    marginBottom: 16,
  },
  topProductLabel: {
    fontSize: 12,
    color: '#ef6c00',
    fontWeight: '600',
    marginTop: 8,
  },
  topProductName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
    marginTop: 4,
  },
  topProductStats: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  productAvailability: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productItemText: {
    fontSize: 13,
    color: '#1b4332',
    fontWeight: '500',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  productRatingText: {
    fontSize: 13,
    color: '#fbc02d',
    fontWeight: '600',
  },
  editProductBtn: {
    padding: 8,
  },
  // Customer styles
  customerStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  customerStatCard: {
    flex: 1,
    backgroundColor: '#f3e5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  customerStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
    marginTop: 8,
  },
  customerStatLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f57f17',
    marginBottom: 4,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  // Inventory styles
  inventorySummary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inventoryStatCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  inventoryStatValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  inventoryStatLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
  },
});
