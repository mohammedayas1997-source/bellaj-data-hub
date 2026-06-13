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

  useEffect(() => {
    fetchStats();
  }, []);

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

      const usersRes =
        results[0].status === "fulfilled" ? results[0].value.data : {};
      const nimcRes =
        results[1].status === "fulfilled" ? results[1].value.data : {};
      const bvnRes =
        results[2].status === "fulfilled" ? results[2].value.data : {};
      const reportsRes =
        results[3].status === "fulfilled" ? results[3].value.data : {};
      const salesRes =
        results[4].status === "fulfilled" ? results[4].value.data : {};
      const txRes =
        results[5].status === "fulfilled" ? results[5].value.data : {};

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
    } catch {
      Alert.alert("Connection Error", "Failed to load live dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const openMenu = () => {
    const parent = navigation.getParent?.();

    if (navigation.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    Alert.alert(
      "Menu Error",
      "AdminDashboard must be inside DrawerNavigator for menu to work."
    );
  };

  const safeNavigate = (screenName) => {
    try {
      navigation.navigate(screenName, {
        fromAdminDashboard: true,
        backScreen: "AdminDashboard",
      });
    } catch {
      Alert.alert(
        "Navigation Error",
        `${screenName} is not registered in App.js.`
      );
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
        icon: "account-group-outline",
        type: "mci",
        color: COLORS.primary,
        screen: "UserManagement",
      },
      {
        title: "Total Sales",
        value: formatMoney(stats.sales),
        icon: "cash-multiple",
        type: "mci",
        color: COLORS.secondary,
        screen: "SalesHistory",
      },
      {
        title: "Transactions",
        value: stats.transactions,
        icon: "receipt-text-outline",
        type: "mci",
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
        icon: "fingerprint",
        type: "mci",
        color: "#2563EB",
        screen: "NIMCRequests",
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
        title: "Notifications",
        value: "Open",
        icon: "bell-outline",
        type: "ion",
        color: "#7C3AED",
        screen: "Notifications",
      },
      {
        title: "Settings",
        value: "Open",
        icon: "settings-outline",
        type: "ion",
        color: "#334155",
        screen: "Settings",
      },
    ],
    [stats]
  );

  const menuCards = [
    {
      title: "Admin Dashboard",
      subtitle: "Admin operations center",
      icon: "view-dashboard-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => safeNavigate("AdminDashboard"),
    },
    {
      title: "All Users",
      subtitle: "Manage platform users",
      icon: "account-group-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => safeNavigate("UserManagement"),
    },
    {
      title: "Sales Logs",
      subtitle: "Revenue and transactions",
      icon: "cash-multiple",
      type: "mci",
      color: COLORS.secondary,
      action: () => safeNavigate("SalesHistory"),
    },
    {
      title: "Issue Resolution",
      subtitle: "Resolve customer issues",
      icon: "alert-circle-outline",
      type: "ion",
      color: COLORS.danger,
      action: () => safeNavigate("IssueResolution"),
    },
    {
      title: "NIMC Requests",
      subtitle: "Manage NIMC requests",
      icon: "fingerprint",
      type: "mci",
      color: "#2563EB",
      action: () => safeNavigate("NIMCRequests"),
    },
    {
      title: "BVN Requests",
      subtitle: "Manage BVN requests",
      icon: "card-account-details-outline",
      type: "mci",
      color: "#D97706",
      action: () => safeNavigate("BvnRequests"),
    },
    {
      title: "Agent Dashboard",
      subtitle: "Open agent panel",
      icon: "account-tie-outline",
      type: "mci",
      color: "#0F766E",
      action: () => safeNavigate("AgentDashboard"),
    },
    {
      title: "Support Dashboard",
      subtitle: "Open support center",
      icon: "headset",
      type: "mci",
      color: "#EA580C",
      action: () => safeNavigate("SupportDashboard"),
    },
    {
      title: "Supervisor Dashboard",
      subtitle: "Open supervisor panel",
      icon: "account-supervisor-outline",
      type: "mci",
      color: "#2563EB",
      action: () => safeNavigate("SupervisorDashboard"),
    },
    {
      title: "Notifications",
      subtitle: "Message center",
      icon: "bell-outline",
      type: "ion",
      color: "#2563EB",
      action: () => safeNavigate("Notifications"),
    },
    {
      title: "Settings",
      subtitle: "App preferences",
      icon: "settings-outline",
      type: "ion",
      color: "#334155",
      action: () => safeNavigate("Settings"),
    },
  ];

  const renderIcon = (item, size = 24, color = COLORS.white) => {
    if (item.type === "mci") {
      return (
        <MaterialCommunityIcons name={item.icon} size={size} color={color} />
      );
    }

    return <Ionicons name={item.icon} size={size} color={color} />;
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
        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={26} color={COLORS.white} />
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
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Live Operations Center</Text>
            <Text style={styles.heroText}>
              Monitor users, sales, requests, issues and platform controls in
              real time.
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

        <View style={styles.navigationSection}>
          <Text style={styles.panelTitle}>Admin Navigation</Text>

          <View style={[styles.navGrid, isWeb && styles.webNavGrid]}>
            {menuCards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.navCardBox, isWeb && styles.webNavCardBox]}
                onPress={item.action}
                activeOpacity={0.86}
              >
                <View
                  style={[
                    styles.navIconLarge,
                    { backgroundColor: item.color },
                  ]}
                >
                  {renderIcon(item, 30, COLORS.white)}
                </View>

                <Text style={styles.navCardTitle}>{item.title}</Text>
                <Text style={styles.navCardSubtitle}>{item.subtitle}</Text>

                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>OPEN</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={COLORS.secondary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Service Configuration</Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => safeNavigate("DataPlans")}
          >
            <MaterialCommunityIcons
              name="server-outline"
              size={22}
              color={COLORS.secondary}
            />
            <Text style={styles.actionText}>Manage Data & Airtime Plans</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => safeNavigate("CableTvPlans")}
          >
            <MaterialCommunityIcons
              name="television-classic"
              size={22}
              color={COLORS.secondary}
            />
            <Text style={styles.actionText}>
              Configure Cable TV & Utility Rates
            </Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => safeNavigate("AssignTarget")}
          >
            <MaterialCommunityIcons
              name="target"
              size={22}
              color={COLORS.secondary}
            />
            <Text style={styles.actionText}>Assign Supervisor Targets</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => safeNavigate("SupportActivities")}
          >
            <MaterialCommunityIcons
              name="headset"
              size={22}
              color={COLORS.secondary}
            />
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
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
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
  content: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
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
  navigationSection: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  panelTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  webNavGrid: {
    justifyContent: "flex-start",
    columnGap: 12,
  },
  navCardBox: {
    width: "48%",
    backgroundColor: COLORS.light,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 150,
  },
  webNavCardBox: {
    width: "23.5%",
    minWidth: 220,
  },
  navIconLarge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  navCardTitle: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "900",
  },
  navCardSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  openBadge: {
    marginTop: "auto",
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  openBadgeText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "900",
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