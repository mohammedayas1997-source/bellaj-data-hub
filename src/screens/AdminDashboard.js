import React, { useContext, useEffect, useMemo, useState } from "react";
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
  StatusBar,
} from "react-native";
import {
  useNavigation,
  CommonActions,
  DrawerActions,
} from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BASE_URL from "../config/api";
import { ThemeContext } from "../context/ThemeContext";

const LIGHT = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  danger: "#DC2626",
  card: "#FFFFFF",
  soft: "#F8FAFC",
  text: "#0F172A",
  subText: "#64748B",
};

const DARK = {
  primary: "#E60000",
  secondary: "#22C55E",
  dark: "#020617",
  white: "#FFFFFF",
  light: "#020617",
  muted: "#94A3B8",
  border: "#1E293B",
  danger: "#EF4444",
  card: "#0F172A",
  soft: "#111827",
  text: "#F8FAFC",
  subText: "#CBD5E1",
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
  const { isDarkMode } = useContext(ThemeContext);

  const COLORS = isDarkMode ? DARK : LIGHT;
  const styles = getStyles(COLORS);
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
        axios.get(API_ENDPOINTS.users, { headers, timeout: 30000 }),
        axios.get(API_ENDPOINTS.nimcRequests, { headers, timeout: 30000 }),
        axios.get(API_ENDPOINTS.bvnRequests, { headers, timeout: 30000 }),
        axios.get(API_ENDPOINTS.allReports, { headers, timeout: 30000 }),
        axios.get(API_ENDPOINTS.salesStats, { headers, timeout: 30000 }),
        axios.get(API_ENDPOINTS.transactions, { headers, timeout: 30000 }),
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
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      const parent = navigation.getParent?.();

      if (navigation.openDrawer) return navigation.openDrawer();
      if (parent?.openDrawer) return parent.openDrawer();

      navigation.navigate("Main", { screen: "AdminDashboard" });
    }
  };

  const safeNavigate = (screenName) => {
    navigation.navigate(screenName, {
      fromAdminDashboard: true,
      backScreen: "AdminDashboard",
    });
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
        title: "Users",
        value: stats.users,
        icon: "account-group-outline",
        type: "mci",
        color: COLORS.primary,
        screen: "UserManagement",
      },
      {
        title: "Sales",
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
        title: "Issues",
        value: stats.reports,
        icon: "alert-circle-outline",
        type: "ion",
        color: COLORS.danger,
        screen: "IssueResolution",
      },
      {
        title: "Pricing",
        value: "Open",
        icon: "cash-cog",
        type: "mci",
        color: "#7C3AED",
        screen: "PricingSettings",
      },
      {
        title: "NIMC",
        value: stats.nimc,
        icon: "fingerprint",
        type: "mci",
        color: "#2563EB",
        screen: "NIMCRequests",
      },
      {
        title: "BVN",
        value: stats.bvn,
        icon: "card-account-details-outline",
        type: "mci",
        color: "#D97706",
        screen: "BvnRequests",
      },
      {
        title: "Notify",
        value: "Open",
        icon: "bell-outline",
        type: "ion",
        color: "#0EA5E9",
        screen: "Notifications",
      },
    ],
    [stats, isDarkMode]
  );

  const menuCards = [
    {
      title: "Dashboard",
      icon: "view-dashboard-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => safeNavigate("AdminDashboard"),
    },
    {
      title: "Users",
      icon: "account-group-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => safeNavigate("UserManagement"),
    },
    {
      title: "Sales",
      icon: "cash-multiple",
      type: "mci",
      color: COLORS.secondary,
      action: () => safeNavigate("SalesHistory"),
    },
    {
      title: "Pricing",
      icon: "cash-cog",
      type: "mci",
      color: "#7C3AED",
      action: () => safeNavigate("PricingSettings"),
    },
    {
      title: "Issues",
      icon: "alert-circle-outline",
      type: "ion",
      color: COLORS.danger,
      action: () => safeNavigate("IssueResolution"),
    },
    {
      title: "NIMC",
      icon: "fingerprint",
      type: "mci",
      color: "#2563EB",
      action: () => safeNavigate("NIMCRequests"),
    },
    {
      title: "BVN",
      icon: "card-account-details-outline",
      type: "mci",
      color: "#D97706",
      action: () => safeNavigate("BvnRequests"),
    },
    {
      title: "Support",
      icon: "headset",
      type: "mci",
      color: "#EA580C",
      action: () => safeNavigate("SupportDashboard"),
    },
    {
      title: "Supervisor",
      icon: "account-supervisor-outline",
      type: "mci",
      color: "#2563EB",
      action: () => safeNavigate("SupervisorDashboard"),
    },
    {
      title: "Notify",
      icon: "bell-outline",
      type: "ion",
      color: "#0EA5E9",
      action: () => safeNavigate("Notifications"),
    },
    {
      title: "Settings",
      icon: "settings-outline",
      type: "ion",
      color: "#334155",
      action: () => safeNavigate("Settings"),
    },
    {
      title: "Targets",
      icon: "target",
      type: "mci",
      color: "#16A34A",
      action: () => safeNavigate("AssignTarget"),
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

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
        nestedScrollEnabled
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              size={34}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Live Operations Center</Text>
            <Text style={styles.heroText}>
              Monitor users, sales, requests, pricing, issues and platform controls.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.statGrid}>
          {cards.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.statBox, isWeb && styles.webStatBox]}
              onPress={() => safeNavigate(item.screen)}
              activeOpacity={0.86}
            >
              <View style={[styles.statIconBox, { backgroundColor: item.color }]}>
                {renderIcon(item, 24, COLORS.white)}
              </View>

              <Text style={styles.statTitle} numberOfLines={1}>
                {item.title}
              </Text>

              <Text style={styles.statValue} numberOfLines={1}>
                {item.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navigationSection}>
          <Text style={styles.panelTitle}>Admin Navigation</Text>

          <View style={styles.iconGrid}>
            {menuCards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.iconNavBox, isWeb && styles.webIconNavBox]}
                onPress={item.action}
                activeOpacity={0.86}
              >
                <View style={[styles.navIconBox, { backgroundColor: item.color }]}>
                  {renderIcon(item, 26, COLORS.white)}
                </View>

                <Text style={styles.iconNavText} numberOfLines={2}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Service Configuration</Text>

          <QuickAction
            COLORS={COLORS}
            icon="cash-cog"
            title="Pricing Settings"
            color="#7C3AED"
            onPress={() => safeNavigate("PricingSettings")}
          />

          <QuickAction
            COLORS={COLORS}
            icon="server-outline"
            title="Manage Data & Airtime Plans"
            color={COLORS.secondary}
            onPress={() => safeNavigate("DataPlans")}
          />

          <QuickAction
            COLORS={COLORS}
            icon="television-classic"
            title="Configure Cable TV & Utility Rates"
            color={COLORS.secondary}
            onPress={() => safeNavigate("CableTvPlans")}
          />

          <QuickAction
            COLORS={COLORS}
            icon="headset"
            title="Audit Support Logs"
            color={COLORS.secondary}
            onPress={() => safeNavigate("SupportActivities")}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const QuickAction = ({ COLORS, icon, title, color, onPress }) => (
  <TouchableOpacity
    style={[
      stylesQuick.actionBtn,
      { backgroundColor: COLORS.soft, borderColor: COLORS.border },
    ]}
    onPress={onPress}
  >
    <View style={[stylesQuick.smallIconBox, { backgroundColor: color }]}>
      <MaterialCommunityIcons name={icon} size={22} color={COLORS.white} />
    </View>

    <Text style={[stylesQuick.actionText, { color: COLORS.text }]}>
      {title}
    </Text>

    <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
  </TouchableOpacity>
);

const stylesQuick = StyleSheet.create({
  actionBtn: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  smallIconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 12,
  },
});

const getStyles = (COLORS) =>
  StyleSheet.create({
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
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: "rgba(255,255,255,0.16)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    headerTextBox: { flex: 1 },
    headerTitle: {
      color: COLORS.white,
      fontSize: 20,
      fontWeight: "900",
    },
    headerSubtitle: {
      color: "#FFE4E4",
      marginTop: 3,
      fontSize: 12,
      fontWeight: "600",
    },
    logoutBtn: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: COLORS.dark,
      alignItems: "center",
      justifyContent: "center",
    },
    container: { flex: 1 },
    content: {
      padding: 16,
      paddingBottom: 140,
      flexGrow: 1,
      minHeight: "100%",
      maxWidth: 1200,
      width: "100%",
      alignSelf: "center",
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
      backgroundColor: COLORS.card,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderLeftWidth: 5,
      borderLeftColor: COLORS.primary,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    heroIconBox: {
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: COLORS.text,
    },
    heroText: {
      color: COLORS.subText,
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
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 12,
      marginBottom: 18,
    },
    statBox: {
      width: "23.5%",
      minHeight: 116,
      backgroundColor: COLORS.card,
      borderRadius: 18,
      padding: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    webStatBox: {
      width: "23.5%",
      minHeight: 128,
    },
    statIconBox: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    statTitle: {
      fontSize: 10,
      color: COLORS.subText,
      fontWeight: "900",
      textAlign: "center",
      textTransform: "uppercase",
    },
    statValue: {
      fontSize: 14,
      fontWeight: "900",
      color: COLORS.text,
      marginTop: 5,
      textAlign: "center",
    },
    navigationSection: {
      backgroundColor: COLORS.card,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 18,
    },
    panelTitle: {
      color: COLORS.text,
      fontSize: 18,
      fontWeight: "900",
      marginBottom: 14,
    },
    iconGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 12,
    },
    iconNavBox: {
      width: "23.5%",
      minHeight: 112,
      backgroundColor: COLORS.soft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    },
    webIconNavBox: {
      width: "23.5%",
      minHeight: 125,
    },
    navIconBox: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    iconNavText: {
      color: COLORS.text,
      fontSize: 10,
      fontWeight: "900",
      textAlign: "center",
    },
    quickSection: {
      backgroundColor: COLORS.card,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: COLORS.text,
      marginBottom: 14,
    },
  });

export default AdminDashboard;