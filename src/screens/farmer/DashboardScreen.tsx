import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Modal,
  Linking,
  Platform,
  TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MCIcon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../services/supabase";

const { width } = Dimensions.get("window");

const Dashboard: React.FC = () => {
  const navigation = useNavigation<any>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [restockQuantity, setRestockQuantity] = useState("");

  // Discount state
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<any>(null);
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [discountEndDate, setDiscountEndDate] = useState("");
  const [discountActive, setDiscountActive] = useState(false);

  // KPI State
  const [kpiData, setKpiData] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingDeliveries: 0,
  });

  // Recent orders state
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    fetchCurrentUser();
    fetchDashboardData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        fetchUserProfile(user.id);
      }
    } catch (error) {
      console.log("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('full_name, email, phone')
        .eq('id', userId)
        .single();

      if (profile && !error) {
        setCurrentUser(profile);
      }
    } catch (error) {
      console.log("Error fetching profile:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch products with discount info
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, quantity_available, unit, is_available, created_at, discount_percentage, discounted_price, discount_active, discount_end_date')
        .eq('seller_id', user.id);

      if (productsError) {
        console.log('🔴 Error fetching products:', productsError);
      } else {
        console.log('🟢 Fetched products:', productsData?.length || 0);
        if (productsData && productsData.length > 0) {
          console.log('🟢 First product:', productsData[0]);
        }
      }

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate KPIs
      const totalProducts = productsData?.length || 0;
      const totalOrders = ordersData?.length || 0;
      const pendingDeliveries = ordersData?.filter(o => 
        o.status === 'pending' || o.status === 'processing' || o.status === 'shipped'
      ).length || 0;
      
      const totalRevenue = ordersData
        ?.filter(o => o.status === 'delivered' || o.status === 'confirmed')
        .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Build notifications array
      const notificationsList: any[] = [];
      
      // Low stock notifications
      const lowStockProducts = productsData?.filter(p => p.quantity_available < 10 && p.is_available) || [];
      lowStockProducts.forEach(product => {
        notificationsList.push({
          id: `low-stock-${product.id}`,
          type: 'low-stock',
          title: 'Low Stock Alert',
          message: `${product.name} is running low (${product.quantity_available} ${product.unit} remaining)`,
          timestamp: new Date().toISOString(),
          productId: product.id,
          productName: product.name,
          quantity: product.quantity_available,
          icon: 'alert-circle',
          color: '#ef6c00',
          bgColor: '#fff3e0',
        });
      });

      // New order notifications
      const newOrders = ordersData?.filter(o => o.status === 'pending') || [];
      newOrders.forEach(order => {
        const orderNumber = order.order_number || order.id.substring(0, 8);
        notificationsList.push({
          id: `new-order-${order.id}`,
          type: 'new-order',
          title: 'New Order Received',
          message: `Order ${orderNumber} from ${order.customer_name || 'a customer'} - KES ${order.total_amount}`,
          timestamp: order.created_at,
          orderId: order.id,
          orderNumber: orderNumber,
          amount: order.total_amount,
          customerName: order.customer_name,
          icon: 'cart-check',
          color: '#1565c0',
          bgColor: '#e3f2fd',
        });
      });

      // Pending delivery notifications
      const pendingOrders = ordersData?.filter(o => 
        o.status === 'processing' || o.status === 'shipped'
      ) || [];
      pendingOrders.forEach(order => {
        const orderNumber = order.order_number || order.id.substring(0, 8);
        notificationsList.push({
          id: `pending-delivery-${order.id}`,
          type: 'pending-delivery',
          title: 'Order Needs Attention',
          message: `Order ${orderNumber} is ${order.status} - requires update`,
          timestamp: order.created_at,
          orderId: order.id,
          orderNumber: orderNumber,
          status: order.status,
          icon: 'truck-delivery',
          color: '#ef6c00',
          bgColor: '#fff3e0',
        });
      });

      // Sort notifications by timestamp (newest first)
      notificationsList.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setProducts(productsData || []);
      setKpiData({
        totalRevenue,
        totalOrders,
        totalProducts,
        pendingDeliveries,
      });

      setRecentOrders(ordersData || []);
      setNotifications(notificationsList);
      setNotificationCount(notificationsList.length);
    } catch (error) {
      console.log("Error fetching dashboard data:", error);
    }
  };

  const kpis = [
    { id: 1, label: "Total Revenue", value: `KES ${kpiData.totalRevenue.toLocaleString()}`, icon: "cash", color: "#1b5e20" },
    { id: 2, label: "Orders", value: kpiData.totalOrders.toString(), icon: "clipboard-list", color: "#1565c0" },
    { id: 3, label: "Products", value: kpiData.totalProducts.toString(), icon: "package-variant", color: "#ef6c00" },
    { id: 4, label: "Pending", value: kpiData.pendingDeliveries.toString(), icon: "clock-outline", color: "#c62828" },
  ];

  const quickActions = [
    { id: 1, label: "Add Product", icon: "plus-circle-outline", action: () => navigation.navigate("Products") },
    { id: 2, label: "Manage Orders", icon: "truck-outline", action: () => navigation.navigate("Orders") },
    { id: 3, label: "Inventory", icon: "warehouse", action: () => navigation.navigate("Inventory") },
    { id: 4, label: "Analytics", icon: "chart-line", action: () => navigation.navigate("Analytics") },
  ];

  // Format orders for display
  const formatOrderForDisplay = (order: any) => {
    const productName = order.items?.[0]?.product_name || order.product_name || 'Product';
    return {
      id: order.order_number || order.id,
      product: productName,
      amount: `KES ${order.total_amount?.toLocaleString() || '0'}`,
      status: order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending',
      customer: {
        name: order.customer?.full_name || 'Customer',
        phone: order.customer?.phone || 'N/A',
        email: order.customer?.email || 'N/A',
        location: order.delivery_address || 'N/A',
      },
      productDescription: order.items?.[0]?.product_name ? `${order.items[0].quantity} x ${order.items[0].unit}` : '',
      quantity: `${order.items?.[0]?.quantity || 0} ${order.items?.[0]?.unit || 'kg'}`,
      orderDate: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      deliveryDate: order.delivered_at 
        ? new Date(order.delivered_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Pending',
    };
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Error", "Unable to logout. Try again.");
    }
  };

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
  };

  const contactCustomer = async () => {
    if (!selectedOrder?.customer?.phone) {
      Alert.alert("Error", "No phone number available for this customer.");
      return;
    }

    const phoneNumber = selectedOrder.customer.phone.replace(/\s/g, ""); // Remove spaces
    const url = Platform.OS === "android" 
      ? `tel:${phoneNumber}` 
      : `telprompt:${phoneNumber}`; // telprompt shows confirmation on iOS

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to make phone calls on this device.");
      }
    } catch (error) {
      console.log("Phone call error:", error);
      Alert.alert("Error", "Unable to initiate phone call. Please try again.");
    }
  };

  const openRestockModal = () => {
    setRestockModalVisible(true);
  };

  const handleRestock = async (product: string, quantity: string) => {
    if (!product || !quantity) {
      Alert.alert("Error", "Please select a product and enter quantity.");
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Error", "Please enter a valid quantity.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const { data: existingProduct } = await supabase
        .from('products')
        .select('id, quantity_available')
        .eq('seller_id', user.id)
        .ilike('name', `%${product}%`)
        .single();

      if (existingProduct) {
        const newQuantity = existingProduct.quantity_available + qty;
        const { error } = await supabase
          .from('products')
          .update({ quantity_available: newQuantity })
          .eq('id', existingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{
            seller_id: user.id,
            name: product,
            category: 'Restocked',
            price: 0,
            quantity_available: qty,
            unit: 'kg',
            is_available: true,
          }]);

        if (error) throw error;
      }

      Alert.alert(
        "Success! 🎉",
        `${product} has been restocked with ${qty} units.`,
        [{ text: "OK", onPress: () => setRestockModalVisible(false) }]
      );
      setRestockQuantity("");
      setSelectedProduct("");
    } catch (error: any) {
      console.log("Restock error:", error);
      Alert.alert("Error", error.message || "Failed to restock. Please try again.");
    }
  };

  const openDiscountModal = (product: any) => {
    console.log('🟢 Opening discount modal for product:', product);
    setSelectedProductForDiscount(product);
    setDiscountPercentage(product.discount_percentage?.toString() || "");
    setDiscountActive(product.discount_active || false);
    
    // Safely parse discount end date
    let endDate = "";
    if (product.discount_end_date) {
      try {
        const date = new Date(product.discount_end_date);
        if (!isNaN(date.getTime())) {
          endDate = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.log('⚠️ Invalid date format:', product.discount_end_date);
      }
    }
    setDiscountEndDate(endDate);
    
    setDiscountModalVisible(true);
    console.log('🟢 Discount modal state:', {
      discountModalVisible: true,
      selectedProduct: product?.name,
      discountPercentage: product.discount_percentage?.toString() || "0",
      discountActive: product.discount_active || false,
      discountEndDate: endDate
    });
  };

  const calculateDiscountedPrice = (price: number, percentage: number) => {
    return price - (price * percentage / 100);
  };

  const handleApplyDiscount = async () => {
    if (!selectedProductForDiscount) {
      Alert.alert("Error", "No product selected.");
      return;
    }

    const percentage = parseFloat(discountPercentage);
    if (discountActive && (isNaN(percentage) || percentage < 0 || percentage > 100)) {
      Alert.alert("Error", "Please enter a valid discount percentage (0-100).");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "User not authenticated.");
        return;
      }

      const originalPrice = selectedProductForDiscount.price;
      const discountedPrice = discountActive ? calculateDiscountedPrice(originalPrice, percentage) : null;

      // Safely handle end date
      let endDate = null;
      if (discountActive && discountEndDate) {
        try {
          const date = new Date(discountEndDate);
          if (!isNaN(date.getTime())) {
            endDate = date.toISOString();
          }
        } catch (error) {
          console.log('⚠️ Invalid end date, setting to null');
        }
      }

      const updateData: any = {
        discount_percentage: discountActive ? percentage : 0,
        discounted_price: discountedPrice,
        discount_active: discountActive,
        discount_end_date: endDate,
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProductForDiscount.id);

      if (error) throw error;

      Alert.alert(
        "Success! 🎉",
        discountActive
          ? `${selectedProductForDiscount.name} now has a ${percentage}% discount! New price: KES ${discountedPrice?.toFixed(2)}`
          : `Discount removed from ${selectedProductForDiscount.name}`,
        [{
          text: "OK",
          onPress: () => {
            setDiscountModalVisible(false);
            fetchDashboardData();
          }
        }]
      );
    } catch (error: any) {
      console.log("Discount error:", error);
      Alert.alert("Error", error.message || "Failed to apply discount. Please try again.");
    }
  };

  const removeDiscount = async (product: any) => {
    Alert.alert(
      "Remove Discount",
      `Are you sure you want to remove the discount from ${product.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .update({
                  discount_percentage: 0,
                  discounted_price: null,
                  discount_active: false,
                  discount_end_date: null,
                })
                .eq('id', product.id);

              if (error) throw error;

              Alert.alert("Success!", "Discount removed successfully.", [
                { text: "OK", onPress: () => fetchDashboardData() }
              ]);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to remove discount.");
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return { bg: "#e8f5e9", text: "#2e7d32", icon: "check-circle" };
      case "Processing":
        return { bg: "#e3f2fd", text: "#1565c0", icon: "truck-delivery" };
      case "Pending":
        return { bg: "#fff3e0", text: "#ef6c00", icon: "alert-circle" };
      case "Cancelled":
        return { bg: "#ffebee", text: "#c62828", icon: "close-circle" };
      default:
        return { bg: "#f5f5f5", text: "#666", icon: "help-circle" };
    }
  };

  const handleNotificationPress = (notification: any) => {
    setNotificationsModalVisible(false);
    
    switch (notification.type) {
      case 'low-stock':
        // Open restock modal with the product pre-selected
        setSelectedProduct(notification.productName);
        setRestockModalVisible(true);
        break;
      case 'new-order':
        // Open order details
        const order = recentOrders.find(o => o.id === notification.orderId);
        if (order) {
          const formattedOrder = formatOrderForDisplay(order);
          setSelectedOrder(formattedOrder);
          setOrderModalVisible(true);
        }
        break;
      case 'pending-delivery':
        // Navigate to orders screen
        navigation.navigate('Orders');
        break;
      default:
        Alert.alert('Notification', notification.message);
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setNotificationCount(0);
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <View style={styles.container}>
      {/* Fixed Header - Deep Green Sticky Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome Back 👋</Text>
            <Text style={styles.name}>
              {loading ? "Loading..." : currentUser?.full_name || "FarmCare Farmer"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setNotificationsModalVisible(true)}
              style={styles.notificationBtn}
            >
              <Ionicons name="notifications-outline" size={24} color="#ffffff" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} style={styles.logout}>
              <Ionicons name="log-out-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >

          {/* KPI CARDS */}
          <View style={styles.kpiContainer}>
            {kpis.map((item) => (
              <View key={item.id} style={styles.kpiCard}>
                <View style={[styles.iconCircle, { backgroundColor: item.color + "20" }]}>
                  <MCIcon name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={styles.kpiValue}>{item.value}</Text>
                <Text style={styles.kpiLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          {/* PERFORMANCE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <LinearGradient
              colors={["#d0f0c0", "#e8f5e9"]}
              style={styles.performanceCard}
            >
              <Text style={styles.performanceText}>
                Revenue increased by 12% compared to last week. Keep maintaining stock and delivery speed.
              </Text>
            </LinearGradient>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <AnimatedTouchable
                  key={action.id}
                  style={styles.actionCard}
                  activeOpacity={0.8}
                  onPress={action.action}
                >
                  <View style={styles.actionIcon}>
                    <MCIcon name={action.icon} size={26} color="#1b5e20" />
                  </View>
                  <Text style={styles.actionText}>{action.label}</Text>
                </AnimatedTouchable>
              ))}
            </View>
          </View>

          {/* MY PRODUCTS - Discount Management */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Products</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Products")}>
                <Text style={styles.viewAll}>Manage</Text>
              </TouchableOpacity>
            </View>
            {products.length === 0 ? (
              <View style={styles.emptyProductsContainer}>
                <MCIcon name="fruit-cherries" size={48} color="#bdbdbd" />
                <Text style={styles.emptyProductsText}>No products yet</Text>
                <Text style={styles.emptyProductsSubtext}>Add products to start selling</Text>
              </View>
            ) : (
              <View style={styles.productsList}>
                {products.slice(0, 5).map((product, index) => {
                  const hasDiscount = product.discount_active && product.discount_percentage > 0;
                  console.log(`🟢 Rendering product ${index}:`, {
                    name: product.name,
                    price: product.price,
                    hasDiscount,
                    discount_active: product.discount_active,
                    discount_percentage: product.discount_percentage
                  });
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productCard}
                      activeOpacity={0.7}
                      onPress={() => {
                        console.log('🟢 Product card pressed:', product.name);
                        openDiscountModal(product);
                      }}
                    >
                      <View style={styles.productCardHeader}>
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={1}>
                            {product.name}
                          </Text>
                          <Text style={styles.productStock}>
                            {product.quantity_available} {product.unit} available
                          </Text>
                        </View>
                        <View style={styles.productPriceSection}>
                          {hasDiscount ? (
                            <>
                              <Text style={styles.originalPrice}>
                                KES {product.price.toFixed(2)}
                              </Text>
                              <View style={styles.discountedPriceBadge}>
                                <Text style={styles.discountedPrice}>
                                  KES {product.discounted_price?.toFixed(2) || '0.00'}
                                </Text>
                              </View>
                            </>
                          ) : (
                            <Text style={styles.productPrice}>
                              KES {product.price.toFixed(2)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.productCardFooter}>
                        {hasDiscount ? (
                          <View style={styles.discountBadgeActive}>
                            <MCIcon name="tag-percent" size={14} color="#fff" />
                            <Text style={styles.discountBadgeText}>
                              {product.discount_percentage}% OFF
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.addDiscountHint}>
                            <Ionicons name="pricetag-outline" size={14} color="#1b5e20" />
                            <Text style={styles.addDiscountText}>Tap to add discount</Text>
                          </View>
                        )}
                        <View style={styles.productAction}>
                          <Ionicons name="chevron-forward" size={18} color="#9e9e9e" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {products.length > 5 && (
                  <TouchableOpacity
                    style={styles.viewAllProductsBtn}
                    onPress={() => navigation.navigate("Products")}
                  >
                    <Text style={styles.viewAllProductsText}>
                      View all {products.length} products
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#1b5e20" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* RECENT ORDERS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Orders")}>
                <Text style={styles.viewAll}>View all</Text>
              </TouchableOpacity>
            </View>
            {recentOrders.length === 0 ? (
              <View style={styles.emptyOrdersContainer}>
                <MCIcon name="clipboard-text-outline" size={48} color="#bdbdbd" />
                <Text style={styles.emptyOrdersText}>No orders yet</Text>
                <Text style={styles.emptyOrdersSubtext}>Orders will appear here when customers purchase your products</Text>
              </View>
            ) : (
              recentOrders.map((order) => {
                const formattedOrder = formatOrderForDisplay(order);
                const statusConfig = getStatusColor(formattedOrder.status.toLowerCase());
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderCard}
                    activeOpacity={0.7}
                    onPress={() => openOrderDetails(formattedOrder)}
                  >
                    <View style={styles.orderCardLeft}>
                      <View style={[styles.orderIconBg, { backgroundColor: statusConfig.bg }]}>
                        <MCIcon name={statusConfig.icon} size={18} color={statusConfig.text} />
                      </View>
                      <View>
                        <Text style={styles.orderId}>{formattedOrder.id}</Text>
                        <Text style={styles.orderProduct}>{formattedOrder.product}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={styles.orderAmount}>{formattedOrder.amount}</Text>
                      <View style={[styles.orderStatusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Text style={[styles.orderStatusText, { color: statusConfig.text }]}>
                          {formattedOrder.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* ALERT */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openRestockModal}
          >
            <LinearGradient
              colors={["#fff8e1", "#fffde7"]}
              style={styles.alertCard}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>⚠ Low Stock Alert</Text>
                <Ionicons name="chevron-forward" size={20} color="#8d6e63" />
              </View>
              <Text style={styles.alertText}>
                Maize stock is running low. Tap to restock and avoid missed sales.
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* Order Details Modal */}
      <Modal
        visible={orderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={["#ffffff", "#f1f8e9"]}
              style={styles.modalContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalOrderTitle}>Order Details</Text>
                  <Text style={styles.modalOrderId}>{selectedOrder?.id}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setOrderModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Status Badge */}
                {selectedOrder && (
                  <>
                    <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedOrder.status).bg }]}>
                      <MCIcon
                        name={getStatusColor(selectedOrder.status).icon}
                        size={16}
                        color={getStatusColor(selectedOrder.status).text}
                      />
                      <Text style={[styles.modalStatusText, { color: getStatusColor(selectedOrder.status).text }]}>
                        {selectedOrder.status}
                      </Text>
                    </View>

                    {/* Customer Section */}
                    <View style={styles.modalSection}>
                      <View style={styles.modalSectionHeader}>
                        <MCIcon name="account" size={20} color="#2e7d32" />
                        <Text style={styles.modalSectionTitle}>Customer Information</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Name:</Text>
                        <Text style={styles.modalInfoValue}>{selectedOrder.customer.name}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Phone:</Text>
                        <Text style={styles.modalInfoValue}>{selectedOrder.customer.phone}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Email:</Text>
                        <Text style={styles.modalInfoValue}>{selectedOrder.customer.email}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Location:</Text>
                        <Text style={styles.modalInfoValue}>{selectedOrder.customer.location}</Text>
                      </View>
                    </View>

                    {/* Product Section */}
                    <View style={styles.modalSection}>
                      <View style={styles.modalSectionHeader}>
                        <MCIcon name="agriculture" size={20} color="#2e7d32" />
                        <Text style={styles.modalSectionTitle}>Product Details</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Product:</Text>
                        <Text style={styles.modalInfoValue}>{selectedOrder.product}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Quantity:</Text>
                        <Text style={styles.modalInfoValue}>{selectedOrder.quantity}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Amount:</Text>
                        <Text style={styles.modalInfoValue}>{selectedOrder.amount}</Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Description:</Text>
                      </View>
                      <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>{selectedOrder.productDescription}</Text>
                      </View>
                    </View>

                    {/* Order Timeline */}
                    <View style={styles.modalSection}>
                      <View style={styles.modalSectionHeader}>
                        <Ionicons name="calendar-outline" size={20} color="#2e7d32" />
                        <Text style={styles.modalSectionTitle}>Order Timeline</Text>
                      </View>
                      <View style={styles.timelineRow}>
                        <View style={styles.timelineDot}>
                          <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineLabel}>Order Placed</Text>
                          <Text style={styles.timelineDate}>{selectedOrder.orderDate}</Text>
                        </View>
                      </View>
                      <View style={styles.timelineRow}>
                        <View style={[styles.timelineDot, selectedOrder.status !== "Delivered" && styles.timelineDotPending]}>
                          {selectedOrder.status === "Delivered" && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineLabel}>Expected Delivery</Text>
                          <Text style={styles.timelineDate}>{selectedOrder.deliveryDate}</Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setOrderModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
                {selectedOrder?.status !== "Delivered" && (
                  <TouchableOpacity
                    style={styles.modalActionBtn}
                    onPress={contactCustomer}
                  >
                    <Ionicons name="call-outline" size={18} color="#fff" />
                    <Text style={styles.modalBtnTextSave}>Contact Customer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Restock Modal */}
      <Modal
        visible={restockModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRestockModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={["#ffffff", "#fff8e1"]}
              style={styles.modalContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalOrderTitle}>Restock Products</Text>
                  <Text style={styles.modalOrderId}>Update your inventory</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setRestockModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Quick Restock Options */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Select Product</Text>
                  <View style={styles.productGrid}>
                    {["Maize", "Tomatoes", "Onions", "Beans", "Rice", "Cabbages"].map((product) => (
                      <TouchableOpacity
                        key={product}
                        style={[
                          styles.productChip,
                          selectedProduct === product && styles.productChipActive,
                        ]}
                        onPress={() => setSelectedProduct(product)}
                      >
                        <MCIcon
                          name={selectedProduct === product ? "check-circle" : "agriculture"}
                          size={18}
                          color={selectedProduct === product ? "#fff" : "#2e7d32"}
                        />
                        <Text
                          style={[
                            styles.productChipText,
                            selectedProduct === product && styles.productChipTextActive,
                          ]}
                        >
                          {product}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Custom Product Input */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Or Enter Custom Product</Text>
                  <View style={styles.inputWithIcon}>
                    <MCIcon name="agriculture" size={20} color="#9e9e9e" />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Potatoes"
                      placeholderTextColor="#9e9e9e"
                      value={selectedProduct}
                      onChangeText={setSelectedProduct}
                    />
                  </View>
                </View>

                {/* Quantity Input */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Quantity to Restock</Text>
                  <View style={styles.inputWithIcon}>
                    <Ionicons name="cube" size={20} color="#9e9e9e" />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 100"
                      placeholderTextColor="#9e9e9e"
                      keyboardType="numeric"
                      value={restockQuantity}
                      onChangeText={setRestockQuantity}
                    />
                    <Text style={styles.unitLabel}>kg</Text>
                  </View>

                  {/* Quick Quantity Chips */}
                  <View style={styles.quantityChips}>
                    {["50", "100", "200", "500"].map((qty) => (
                      <TouchableOpacity
                        key={qty}
                        style={[
                          styles.qtyChip,
                          restockQuantity === qty && styles.qtyChipActive,
                        ]}
                        onPress={() => setRestockQuantity(qty)}
                      >
                        <Text
                          style={[
                            styles.qtyChipText,
                            restockQuantity === qty && styles.qtyChipTextActive,
                          ]}
                        >
                          {qty} kg
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Summary */}
                {selectedProduct && restockQuantity && (
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryLabel}>Restock Summary</Text>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryText}>Product:</Text>
                      <Text style={styles.summaryValue}>{selectedProduct}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryText}>Quantity:</Text>
                      <Text style={styles.summaryValue}>{restockQuantity} kg</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    setRestockModalVisible(false);
                    setRestockQuantity("");
                    setSelectedProduct("");
                  }}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={() => handleRestock(selectedProduct, restockQuantity)}
                >
                  <MCIcon name="truck-delivery" size={18} color="#fff" />
                  <Text style={styles.modalBtnTextSave}>Restock Now</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={["#ffffff", "#f1f8e9"]}
              style={styles.modalContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalOrderTitle}>Notifications</Text>
                  <Text style={styles.modalOrderId}>
                    {notificationCount} {notificationCount === 1 ? 'notification' : 'notifications'}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  {notifications.length > 0 && (
                    <TouchableOpacity
                      onPress={clearAllNotifications}
                      style={styles.clearAllBtn}
                    >
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setNotificationsModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                  <View style={styles.emptyNotifications}>
                    <MCIcon name="notifications-none" size={56} color="#bdbdbd" />
                    <Text style={styles.emptyNotificationsTitle}>No Notifications</Text>
                    <Text style={styles.emptyNotificationsText}>
                      You're all caught up! Check back here for updates on orders and stock.
                    </Text>
                  </View>
                ) : (
                  notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[styles.notificationItem, { backgroundColor: notification.bgColor }]}
                      onPress={() => handleNotificationPress(notification)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notificationIcon, { backgroundColor: notification.color }]}>
                        <MCIcon name={notification.icon} size={20} color="#fff" />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationMessage} numberOfLines={2}>
                          {notification.message}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatNotificationTime(notification.timestamp)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setNotificationsModalVisible(false)}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
                {notifications.length > 0 && (
                  <TouchableOpacity
                    style={styles.modalActionBtn}
                    onPress={() => {
                      fetchDashboardData();
                      setNotificationsModalVisible(false);
                    }}
                  >
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={styles.modalBtnTextSave}>Refresh</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Discount Modal */}
      <Modal
        visible={discountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDiscountModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={["#ffffff", "#e8f5e9"]}
              style={styles.modalContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalOrderTitle}>
                    {selectedProductForDiscount?.discount_active ? 'Edit Discount' : 'Add Discount'}
                  </Text>
                  <Text style={styles.modalOrderId}>
                    {selectedProductForDiscount?.name || ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setDiscountModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Product Info */}
                <View style={styles.discountProductInfo}>
                  <View style={styles.discountProductRow}>
                    <Text style={styles.discountInfoLabel}>Current Price:</Text>
                    <Text style={styles.discountInfoValue}>KES {selectedProductForDiscount?.price?.toFixed(2) || '0.00'}</Text>
                  </View>
                  {selectedProductForDiscount?.discount_active && (
                    <View style={styles.discountProductRow}>
                      <Text style={styles.discountInfoLabel}>Current Discount:</Text>
                      <Text style={styles.discountInfoValue}>{selectedProductForDiscount.discount_percentage}%</Text>
                    </View>
                  )}
                </View>

                {/* Discount Percentage Input */}
                <View style={styles.discountInputSection}>
                  <Text style={styles.discountInputLabel}>Discount Percentage (%)</Text>
                  <View style={styles.discountInputWrapper}>
                    <TextInput
                      style={styles.discountPercentageInput}
                      value={discountPercentage}
                      onChangeText={setDiscountPercentage}
                      placeholder="Enter discount %"
                      keyboardType="numeric"
                      placeholderTextColor="#9e9e9e"
                    />
                    <Text style={styles.discountPercentSymbol}>%</Text>
                  </View>
                  
                  {/* Discount Preview */}
                  {discountPercentage && !isNaN(parseFloat(discountPercentage)) && (
                    <View style={styles.discountPreview}>
                      <Text style={styles.discountPreviewText}>
                        New Price: KES {calculateDiscountedPrice(
                          selectedProductForDiscount?.price || 0,
                          parseFloat(discountPercentage)
                        ).toFixed(2)}
                      </Text>
                      <Text style={styles.discountPreviewSavings}>
                        Save: KES {(
                          (selectedProductForDiscount?.price || 0) -
                          calculateDiscountedPrice(selectedProductForDiscount?.price || 0, parseFloat(discountPercentage))
                        ).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Discount Active Toggle */}
                <View style={styles.discountToggleSection}>
                  <View style={styles.discountToggleRow}>
                    <Text style={styles.discountToggleLabel}>Activate Discount</Text>
                    <TouchableOpacity
                      style={[styles.discountToggle, discountActive && styles.discountToggleActive]}
                      onPress={() => setDiscountActive(!discountActive)}
                    >
                      <View style={[styles.discountToggleCircle, discountActive && styles.discountToggleCircleActive]} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.discountToggleHint}>
                    {discountActive ? 'Discount will be visible to customers' : 'Discount will be hidden from customers'}
                  </Text>
                </View>

                {/* End Date (optional) */}
                {discountActive && (
                  <View style={styles.discountDateSection}>
                    <Text style={styles.discountInputLabel}>End Date (Optional)</Text>
                    <TextInput
                      style={styles.discountDateInput}
                      value={discountEndDate}
                      onChangeText={setDiscountEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9e9e9e"
                    />
                    <Text style={styles.discountDateHint}>Leave empty for no expiry</Text>
                  </View>
                )}
              </ScrollView>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                {selectedProductForDiscount?.discount_active && (
                  <TouchableOpacity
                    style={[styles.modalCancel, { backgroundColor: '#ef5350' }]}
                    onPress={() => removeDiscount(selectedProductForDiscount)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.modalBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalSave}
                  onPress={handleApplyDiscount}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.modalBtnTextSave}>
                    {selectedProductForDiscount?.discount_active ? 'Update' : 'Apply'} Discount
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "rgba(27, 94, 32, 0.98)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingTop: 130,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 0,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  notificationBtn: {
    position: "relative",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 14,
    elevation: 2,
  },

  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#d32f2f",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },

  notificationCount: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  welcome: {
    fontSize: 15,
    color: "#e8f5e9",
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },

  logout: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 14,
    elevation: 2,
  },

  kpiContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  kpiCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    elevation: 4,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  kpiValue: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
    color: "#1b4332",
  },

  kpiLabel: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 4,
  },

  section: {
    marginTop: 25,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1b4332",
  },

  viewAll: {
    fontSize: 13,
    color: "#2e7d32",
    fontWeight: "600",
  },

  performanceCard: {
    padding: 18,
    borderRadius: 18,
    elevation: 3,
  },

  performanceText: {
    color: "#1b5e20",
    fontWeight: "500",
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  actionCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 18,
    elevation: 4,
  },

  actionIcon: {
    backgroundColor: "#e8f5e9",
    padding: 14,
    borderRadius: 14,
  },

  actionText: {
    marginTop: 10,
    fontWeight: "600",
    color: "#1b4332",
  },

  orderCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  orderCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  orderIconBg: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  orderId: {
    fontWeight: "700",
    color: "#1b4332",
    fontSize: 14,
  },

  orderProduct: {
    color: "#6c757d",
    marginTop: 2,
    fontSize: 13,
  },

  orderAmount: {
    fontWeight: "700",
    color: "#1b4332",
    fontSize: 14,
  },

  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },

  orderStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  emptyOrdersContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
  },

  emptyOrdersText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b4332",
    marginTop: 12,
  },

  emptyOrdersSubtext: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalOverlay: {
    width: "92%",
    maxHeight: "85%",
    backgroundColor: "transparent",
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    elevation: 15,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 25,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalOrderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
  },
  modalOrderId: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  clearAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  clearAllText: {
    fontSize: 13,
    color: "#c62828",
    fontWeight: "600",
  },
  modalScroll: {
    maxHeight: 420,
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyNotificationsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
    marginTop: 16,
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    color: "#9e9e9e",
  },
  modalStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
    gap: 6,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1b4332",
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalInfoLabel: {
    fontSize: 13,
    color: "#6c757d",
    fontWeight: "500",
  },
  modalInfoValue: {
    fontSize: 13,
    color: "#1b4332",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: 10,
  },
  descriptionBox: {
    backgroundColor: "#f5f9f5",
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  descriptionText: {
    fontSize: 13,
    color: "#1b4332",
    lineHeight: 20,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  timelineDotPending: {
    backgroundColor: "#e0e0e0",
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 13,
    color: "#1b4332",
    fontWeight: "600",
  },
  timelineDate: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  modalCancel: {
    backgroundColor: "#f5f5f5",
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  modalActionBtn: {
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 3,
    shadowColor: "#2e7d32",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalBtnText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 15,
  },
  modalBtnTextSave: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Alert Card Styles
  alertCard: {
    padding: 18,
    borderRadius: 18,
    marginTop: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  alertTitle: {
    fontWeight: "700",
    color: "#8d6e63",
    fontSize: 15,
  },
  alertText: {
    marginTop: 6,
    color: "#6d4c41",
    fontSize: 13,
    lineHeight: 20,
  },

  // Restock Modal Styles
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  productChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  productChipActive: {
    backgroundColor: "#2e7d32",
  },
  productChipText: {
    fontSize: 13,
    color: "#2e7d32",
    fontWeight: "600",
  },
  productChipTextActive: {
    color: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingVertical: 12,
    marginLeft: 10,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  unitLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
    marginRight: 12,
  },
  quantityChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  qtyChip: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  qtyChipActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  qtyChipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  qtyChipTextActive: {
    color: "#fff",
  },
  summaryBox: {
    backgroundColor: "#f5f9f5",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryText: {
    fontSize: 13,
    color: "#6c757d",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1b4332",
    fontWeight: "700",
  },
  modalSave: {
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 3,
    shadowColor: "#2e7d32",
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  // Products Section Styles
  emptyProductsContainer: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
  },
  emptyProductsText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#424242",
    marginTop: 12,
  },
  emptyProductsSubtext: {
    fontSize: 14,
    color: "#9e9e9e",
    marginTop: 6,
    textAlign: "center",
  },
  productsList: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
  },
  productCard: {
    backgroundColor: "#f5f9f5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  productCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 4,
  },
  productStock: {
    fontSize: 13,
    color: "#6c757d",
  },
  productPriceSection: {
    alignItems: "flex-end",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2e7d32",
  },
  originalPrice: {
    fontSize: 13,
    color: "#9e9e9e",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  discountedPriceBadge: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  productCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  discountBadgeActive: {
    flexDirection: "row",
    backgroundColor: "#ef5350",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
    gap: 4,
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  addDiscountHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addDiscountText: {
    fontSize: 12,
    color: "#1b5e20",
    fontWeight: "500",
  },
  productAction: {
    alignItems: "center",
  },
  viewAllProductsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
  },
  viewAllProductsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b5e20",
  },

  // Discount Modal Styles
  discountProductInfo: {
    backgroundColor: "#f5f9f5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  discountProductRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  discountInfoLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  discountInfoValue: {
    fontSize: 14,
    color: "#1b4332",
    fontWeight: "700",
  },
  discountInputSection: {
    marginBottom: 20,
  },
  discountInputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  discountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
  },
  discountPercentageInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 14,
  },
  discountPercentSymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2e7d32",
  },
  discountPreview: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    gap: 4,
  },
  discountPreviewText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1b4332",
  },
  discountPreviewSavings: {
    fontSize: 13,
    color: "#2e7d32",
    fontWeight: "500",
  },
  discountToggleSection: {
    marginBottom: 20,
    backgroundColor: "#f5f9f5",
    padding: 16,
    borderRadius: 12,
  },
  discountToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  discountToggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
  },
  discountToggleHint: {
    fontSize: 12,
    color: "#6c757d",
  },
  discountToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#bdbdbd",
    padding: 3,
  },
  discountToggleActive: {
    backgroundColor: "#2e7d32",
  },
  discountToggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  discountToggleCircleActive: {
    backgroundColor: "#fff",
  },
  discountDateSection: {
    marginBottom: 16,
  },
  discountDateInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  discountDateHint: {
    fontSize: 12,
    color: "#9e9e9e",
    marginTop: 6,
  },
});