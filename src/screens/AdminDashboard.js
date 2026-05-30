import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  users: "",
  nimcRequests: "",
  bvnRequests: "",
  allReports: "",
  salesStats: "",
};

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    users: 0,
    nimc: 0,
    bvn: 0,
    reports: 0,
    sales: 0,
  });

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (
        !API_ENDPOINTS.users &&
        !API_ENDPOINTS.nimcRequests &&
        !API_ENDPOINTS.bvnRequests &&
        !API_ENDPOINTS.allReports &&
        !API_ENDPOINTS.salesStats
      ) {
        setStats({
          users: 0,
          nimc: 0,
          bvn: 0,
          reports: 0,
          sales: 0,
        });
        return;
      }

      const [usersRes, nimcRes, bvnRes, reportRes, salesRes] =
        await Promise.all([
          API_ENDPOINTS.users
            ? axios.get(API_ENDPOINTS.users, config)
            : Promise.resolve({ data: { data: [] } }),

          API_ENDPOINTS.nimcRequests
            ? axios.get(API_ENDPOINTS.nimcRequests, config)
            : Promise.resolve({ data: { count: 0 } }),

          API_ENDPOINTS.bvnRequests
            ? axios.get(API_ENDPOINTS.bvnRequests, config)
            : Promise.resolve({ data: { count: 0 } }),

          API_ENDPOINTS.allReports
            ? axios.get(API_ENDPOINTS.allReports, config)
            : Promise.resolve({ data: { requests: [] } }),

          API_ENDPOINTS.salesStats
            ? axios.get(API_ENDPOINTS.salesStats, config)
            : Promise.resolve({ data: { total: 0 } }),
        ]);

      setStats({
        users: usersRes?.data?.data?.length || 0,
        nimc: nimcRes?.data?.count || 0,
        bvn: bvnRes?.data?.count || 0,
        reports: reportRes?.data?.requests?.length || 0,
        sales: salesRes?.data?.total || 0,
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Connection Error", "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const MenuCard = ({ title, count, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardCount}>{count}</Text>
      </View>

      <View style={[styles.iconCircle, { backgroundColor: color }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Bellaj Admin Panel</Text>
        <Text style={styles.subText}>Management & Systems Control</Text>
      </View>

      <View style={styles.grid}>
        <MenuCard
          title="Total Users"
          count={stats.users}
          icon="U"
          color={COLORS.primary}
          onPress={() => navigation.navigate("AllUsers")}
        />

        <MenuCard
          title="Total Sales"
          count={`₦${stats.sales}`}
          icon="₦"
          color={COLORS.secondary}
          onPress={() => navigation.navigate("SalesLogs")}
        />

        <MenuCard
          title="Issue Resolution"
          count={stats.reports}
          icon="!"
          color="#DC2626"
          onPress={() => navigation.navigate("IssueResolution")}
        />

        <MenuCard
          title="System Pricing"
          count="Update"
          icon="P"
          color="#7C3AED"
          onPress={() => navigation.navigate("PricingSettings")}
        />

        <MenuCard
          title="NIMC Requests"
          count={stats.nimc}
          icon="N"
          color="#2563EB"
          onPress={() => navigation.navigate("NimcRequests")}
        />

        <MenuCard
          title="BVN Requests"
          count={stats.bvn}
          icon="B"
          color="#D97706"
          onPress={() => navigation.navigate("BvnRequests")}
        />
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Service Configuration</Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("DataPlans")}
        >
          <Text style={styles.actionText}>Manage Data & Airtime Plans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("CableTvPlans")}
        >
          <Text style={styles.actionText}>
            Configure Cable TV & Utility Rates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("AssignTargets")}
        >
          <Text style={styles.actionText}>Assign Supervisor Targets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("SupportActivities")}
        >
          <Text style={styles.actionText}>Audit Support Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  header: {
    padding: 25,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  subText: {
    color: "#FFE4E4",
    marginTop: 5,
  },
  grid: {
    padding: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: COLORS.white,
    width: "47%",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 5,
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "600",
  },
  cardCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginTop: 5,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  actionSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 15,
  },
  actionBtn: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  actionText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
  },
});

export default AdminDashboard;
