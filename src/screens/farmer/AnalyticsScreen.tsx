// src/screens/farmer/AnalyticsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
  const navigation = useNavigation<any>();

  // Sample data for charts
  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [5000, 6500, 8000, 7000, 9000, 7500],
      },
    ],
  };

  const lineData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        data: [1200, 2100, 1800, 2400],
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ["Revenue in KES"],
  };

  const chartConfig = {
    backgroundColor: "#f4fbf6",
    backgroundGradientFrom: "#f4fbf6",
    backgroundGradientTo: "#e8f5e9",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#2e7d32",
    },
  };

  return (
    <LinearGradient colors={['#e8f5e9', '#f4fbf6']} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>
          <Text style={styles.title}>Analytics</Text>
        </View>

        {/* Bar Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Monthly Revenue</Text>
          <BarChart
            data={barData}
            width={screenWidth - 40}
            height={220}
            yAxisLabel="KES "
            chartConfig={chartConfig}
            style={styles.chartStyle}
            fromZero
          />
        </View>

        {/* Line Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Weekly Orders</Text>
          <LineChart
            data={lineData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chartStyle}
            fromZero
          />
        </View>

        {/* Insights Section */}
        <View style={styles.insights}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>📈 Revenue increased by 15% compared to last month.</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>🚚 95% of orders were delivered on time this week.</Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>🛒 Top-selling product: Fresh Tomatoes.</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

export default AnalyticsScreen;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b4332',
  },
  chartSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 12,
  },
  chartStyle: {
    borderRadius: 16,
  },
  insights: {
    marginBottom: 30,
  },
  insightCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
  },
  insightText: {
    color: '#1b4332',
    fontWeight: '600',
  },
});