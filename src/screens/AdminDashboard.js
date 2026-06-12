import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useNavigation, CommonActions } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  danger: "#DC2626",
  card: "#FFFFFF",
};

const API_ENDPOINTS = {
  users: `${BASE_URL}/admin/users`,
  nimcRequests: `${BASE_URL}/admin/nimc-requests`,
  bvnRequests: `${BASE_URL}/admin/bvn-requests`,
  allReports: `${BASE_URL}/admin/reports`,
  salesStats: `${BASE_URL}/admin/sales-stats`,
  transactions: `${BASE_URL}/admin/transactions`,
};

const AdminDashboard = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    users: 0,
    nimc: 0,
    bvn: 0,
    reports: 0,
    sales: 0,
    transactions: 0,
  });

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("adminToken")) ||
      (await AsyncStorage.getItem("token"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getArray = (payload, key) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.requests)) return payload.requests;
    if (Array.isArray(payload?.data?.requests)) return payload.data.requests;
    return [];
  };

  const getCount = (payload, key) => {
    if (typeof payload?.count === "number") return payload.count;
    if (typeof payload?.total === "number") return payload.total;
    if (typeof payload?.data?.count === "number") return payload.data.count;
    if (typeof payload?.data?.total === "number") return payload.data.total;
    return getArray(payload, key).length;
  };

  const fetchStats = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      const results = await Promise.allSettled([
        axios.get(API_ENDPOINTS.users, { headers }),
        axios.get(API_ENDPOINTS.nimcRequests, { headers }),
        axios.get(API_ENDPOINTS.bvnRequests, { headers }),
        axios.get(API_ENDPOINTS.allReports, { headers }),
        axios.get(API_ENDPOINTS.salesStats, { headers }),
        axios.get(API_ENDPOINTS.transactions, { headers }),
      ]);

      const usersRes = results[0].status === "fulfilled" ? results[0].value.data : {};
      const nimcRes = results[1].status === "fulfilled" ? results[1].value.data : {};
      const bvnRes = results[2].status === "fulfilled" ? results[2].value.data : {};
      const reportsRes = results[3].status === "fulfilled" ? results[3].value.data : {};
      const salesRes = results[4].status === "fulfilled" ? results[4].value.data : {};
      const txRes = results[5].status === "fulfilled" ? results[5].value.data : {};

      setStats({
        users: getCount(usersRes, "users"),
        nimc: getCount(nimcRes, "nimcRequests"),
        bvn: getCount(bvnRes, "bvnRequests"),
        reports: getCount(reportsRes, "reports"),
        sales:
          salesRes?.total ||
          salesRes?.data?.total ||
          salesRes?.totalSales ||
          salesRes?.data?.totalSales ||
          0,
        transactions: getCount(txRes, "transactions"),
      });
    } catch (err) {
      Alert.alert("Connection Error", "Failed to load live dashboard data.");
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

  const safeNavigate = (screenName) => {
    try {
      navigation.navigate(screenName);
    } catch (error) {
      Alert.alert("Navigation Error", `${screenName} is not registered.`);
    }
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "adminToken",
            "token",
            "userData",
            "userRole",
            "overrideRole",
            "isSuperAdminOverride",
          ]);

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        },
      },
    ]);
  };

  const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

  const cards = useMemo(
    () => [
      {
        title: "Total Users",
        value: stats.users,
        icon: "people-outline",
        type: "ion",
        color: COLORS.primary,
        screen: "AllUsers",
      },
      {
        title: "Total Sales",
        value: formatMoney(stats.sales),
        icon: "cash-outline",
        type: "ion",
        color: COLORS.secondary,
        screen: "SalesLogs",
      },
      {
        title: "Transactions",
        value: stats.transactions,
        icon: "swap-horizontal-outline",
        type: "ion",
        color: "#0F766E",
        screen: "SalesHistory",
      },
      {
        title: "Issue Resolution",
        value: stats.reports,
        icon: "alert-circle-outline",
        type: "ion",
        color: COLORS.danger,
        screen: "IssueResolution",
      },
      {
        title: "NIMC Requests",
        value: stats.nimc,
        icon: "finger-print-outline",
        type: "ion",
        color: "#2563EB",
        screen: "NimcRequests",
      },
      {
        title: "BVN Requests",
        value: stats.bvn,
        icon: "card-account-details-outline",
        type: "mci",
        color: "#D97706",
        screen: "BvnRequests",
      },
      {
        title: "System Pricing",
        value: "Manage",
        icon: "tag-multiple-outline",
        type: "mci",
        color: "#7C3AED",
        screen: "PricingSettings",
      },
      {
        title: "Service Plans",
        value: "Manage",
        icon: "server-outline",
        type: "mci",
        color: "#334155",
        screen: "DataPlans",
      },
    ],
    [stats]
  );

  const drawerMenus = [
    {
      label: "Admin Overview",
      icon: "grid-outline",
      type: "ion",
      color: COLORS.primary,
      action: () => safeNavigate("AdminDashboard"),
    },
    {
      label: "All Users",
      icon: "people-outline",
      type: "ion",
      color: COLORS.primary,
      action: () => safeNavigate("AllUsers"),
    },
    {
      label: "Sales Logs",
      icon: "cash-outline",
      type: "ion",
      color: COLORS.secondary,
      action: () => safeNavigate("SalesLogs"),
    },
    {
      label: "Issue Resolution",
      icon: "alert-circle-outline",
      type: "ion",
      color: COLORS.danger,
      action: () => safeNavigate("IssueResolution"),
    },
    {
      label: "Pricing Settings",
      icon: "tag-multiple-outline",
      type: "mci",
      color: "#7C3AED",
      action: () => safeNavigate("PricingSettings"),
    },
    {
      label: "NIMC Requests",
      icon: "finger-print-outline",
      type: "ion",
      color: "#2563EB",
      action: () => safeNavigate("NimcRequests"),
    },
    {
      label: "BVN Requests",
      icon: "card-account-details-outline",
      type: "mci",
      color: "#D97706",
      action: () => safeNavigate("BvnRequests"),
    },
    {
      label: "Data & Airtime Plans",
      icon: "server-outline",
      type: "mci",
      color: "#334155",
      action: () => safeNavigate("DataPlans"),
    },
    {
      label: "Cable & Utility Rates",
      icon: "television-classic",
      type: "mci",
      color: "#0F766E",
      action: () => safeNavigate("CableTvPlans"),
    },
    {
      label: "Supervisor Targets",
      icon: "target",
      type: "mci",
      color: "#B91C1C",
      action: () => safeNavigate("AssignTargets"),
    },
    {
      label: "Support Activities",
      icon: "headset",
      type: "mci",
      color: "#EA580C",
      action: () => safeNavigate("SupportActivities"),
    },
  ];

  const renderIcon = (item, size = 24, color = COLORS.white) => {
    if (item.type === "mci") {
      return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
    }

    return <Ionicons name={item.icon} size={size} color={color} />;
  };

  const goBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "AdminDashboard" }],
      })
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation.openDrawer?.()}
        >
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Bellaj Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Management & Systems Control</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroTitle}>Live Operations Center</Text>
            <Text style={styles.heroText}>
              Monitor users, sales, requests, issues and platform controls in real time.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={[styles.grid, isWeb && styles.webGrid]}>
          {cards.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.card,
                { borderLeftColor: item.color },
                isWeb && styles.webCard,
              ]}
              onPress={() => safeNavigate(item.screen)}
              activeOpacity={0.86}
            >
              <View style={styles.cardTextBox}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardCount}>{item.value}</Text>
              </View>

              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                {renderIcon(item, 24, COLORS.white)}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.drawerPanel}>
          <Text style={styles.panelTitle}>Admin Navigation</Text>

          {drawerMenus.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.drawerItem}
              onPress={item.action}
              activeOpacity={0.86}
            >
              <View style={[styles.drawerIcon, { backgroundColor: item.color }]}>
                {renderIcon(item, 22, COLORS.white)}
              </View>

              <Text style={styles.drawerLabel}>{item.label}</Text>

              <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Service Configuration</Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => safeNavigate("DataPlans")}
          >
            <MaterialCommunityIcons name="server-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.actionText}>Manage Data & Airtime Plans</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => safeNavigate("CableTvPlans")}
          >
            <MaterialCommunityIcons name="television-classic" size={22} color={COLORS.secondary} />
            <Text style={styles.actionText}>Configure Cable TV & Utility Rates</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => safeNavigate("AssignTargets")}
          >
            <MaterialCommunityIcons name="target" size={22} color={COLORS.secondary} />
            <Text style={styles.actionText}>Assign Supervisor Targets</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => safeNavigate("SupportActivities")}
          >
            <MaterialCommunityIcons name="headset" size={22} color={COLORS.secondary} />
            <Text style={styles.actionText}>Audit Support Logs</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  headerSubtitle: {
    color: "#FFE4E4",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 50 },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  loaderText: {
    color: COLORS.primary,
    fontWeight: "800",
    marginTop: 12,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: COLORS.dark,
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 6,
    fontWeight: "600",
    lineHeight: 20,
    paddingRight: 12,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    gap: 12,
    marginBottom: 18,
  },
  webGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webCard: {
    width: "48.5%",
    minWidth: 280,
  },
  cardTextBox: { flex: 1 },
  cardTitle: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  cardCount: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  drawerPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  panelTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  drawerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  drawerLabel: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "800",
  },
  quickSection: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: COLORS.light,
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: "#334155",
    fontWeight: "800",
    marginLeft: 10,
  },
});

export default AdminDashboard;