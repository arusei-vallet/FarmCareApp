import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
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
  }, []);

  const kpis = [
    { id: 1, label: "Total Revenue", value: "KES 124,500", icon: "cash", color: "#1b5e20" },
    { id: 2, label: "Orders", value: "312", icon: "clipboard-list", color: "#1565c0" },
    { id: 3, label: "Products", value: "48", icon: "package-variant", color: "#ef6c00" },
    { id: 4, label: "Pending Deliveries", value: "9", icon: "clock-outline", color: "#c62828" },
  ];

  const quickActions = [
    { id: 1, label: "Add Product", icon: "plus-circle-outline", action: () => navigation.navigate("Products") },
    { id: 2, label: "Manage Orders", icon: "truck-outline", action: () => navigation.navigate("Orders") },
    { id: 3, label: "Inventory", icon: "warehouse", action: () => Alert.alert("Info", "Inventory tapped") },
    { id: 4, label: "Analytics", icon: "chart-line", action: () => Alert.alert("Info", "Analytics tapped") },
  ];

  const recentOrders = [
    { id: "ORD-1012", product: "Tomatoes", amount: "KES 3,200", status: "Delivered" },
    { id: "ORD-1013", product: "Maize", amount: "KES 1,840", status: "Processing" },
    { id: "ORD-1014", product: "Onions", amount: "KES 2,100", status: "Pending" },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.replace("Login");
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Error", "Unable to logout. Try again.");
    }
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <LinearGradient colors={["#e8f5e9", "#f1f8e9", "#ffffff"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcome}>Welcome Back 👋</Text>
              <Text style={styles.name}>FarmCare Farmer</Text>
            </View>

            <TouchableOpacity onPress={handleLogout} style={styles.logout}>
              <Ionicons name="log-out-outline" size={24} color="#c62828" />
            </TouchableOpacity>
          </View>

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

          {/* RECENT ORDERS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            {recentOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <Text style={styles.orderProduct}>{order.product}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.orderAmount}>{order.amount}</Text>
                  <Text
                    style={[
                      styles.orderStatus,
                      order.status === "Delivered"
                        ? { color: "#2e7d32" }
                        : order.status === "Processing"
                        ? { color: "#1565c0" }
                        : { color: "#ef6c00" },
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ALERT */}
          <LinearGradient
            colors={["#fff8e1", "#fffde7"]}
            style={styles.alertCard}
          >
            <Text style={styles.alertTitle}>⚠ Low Stock Alert</Text>
            <Text style={styles.alertText}>
              Maize stock is running low. Update inventory to avoid missed sales.
            </Text>
          </LinearGradient>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  welcome: {
    fontSize: 15,
    color: "#4e944f",
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b4332",
  },

  logout: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 14,
    elevation: 4,
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

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1b4332",
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
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 3,
  },

  orderId: {
    fontWeight: "700",
    color: "#1b4332",
  },

  orderProduct: {
    color: "#6c757d",
    marginTop: 3,
  },

  orderAmount: {
    fontWeight: "700",
    color: "#1b4332",
  },

  orderStatus: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },

  alertCard: {
    padding: 18,
    borderRadius: 18,
    marginTop: 25,
    elevation: 3,
  },

  alertTitle: {
    fontWeight: "700",
    color: "#8d6e63",
  },

  alertText: {
    marginTop: 6,
    color: "#6d4c41",
  },
});