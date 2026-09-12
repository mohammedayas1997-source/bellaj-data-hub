import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
  StatusBar,
  Modal,
} from "react-native";
import { CommonActions, DrawerActions } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BASE_URL from "../config/api";
import { ThemeContext } from "../context/ThemeContext";

const LIGHT = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  danger: "#DC2626",
  card: "#FFFFFF",
  soft: "#F1F5F9",
  text: "#0F172A",
  subText: "#64748B",
  accent: "#2563EB",
};

const DARK = {
  primary: "#16A34A",
  secondary: "#22C55E",
  dark: "#020617",
  white: "#FFFFFF",
  light: "#020617",
  muted: "#94A3B8",
  border: "#1E293B",
  danger: "#EF4444",
  card: "#0F172A",
  soft: "#1E293B",
  text: "#F8FAFC",
  subText: "#CBD5E1",
  accent: "#38BDF8",
};

const AdminDashboard = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useContext(ThemeContext);

  const COLORS = isDarkMode ? DARK : LIGHT;
  const styles = getStyles(COLORS);
  const isWeb = width >= 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutProcessing, setLogoutProcessing] = useState(false);

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

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 35000,
    };
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
    if (typeof payload?.totalUsers === "number") return payload.totalUsers;
    if (typeof payload?.data?.count === "number") return payload.data.count;
    if (typeof payload?.data?.total === "number") return payload.data.total;
    return getArray(payload, key).length;
  };

  const fetchWithFallback = async (endpoints, config) => {
    for (const url of endpoints) {
      try {
        const res = await axios.get(url, config);
        if (res?.data) return res.data;
      } catch {
        // Continue loop to backup path
      }
    }
    return null;
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      const userEndpoints = [
        `${BASE_URL}/admin/users`,
        `${BASE_URL}/superadmin/users`,
        `${BASE_URL}/users`,
      ];
      const nimcEndpoints = [
        `${BASE_URL}/admin/nimc-requests`,
        `${BASE_URL}/nimc/requests`,
        `${BASE_URL}/admin/nimc`,
      ];
      const bvnEndpoints = [
        `${BASE_URL}/admin/bvn-requests`,
        `${BASE_URL}/bvn/requests`,
        `${BASE_URL}/admin/bvn`,
      ];
      const reportEndpoints = [
        `${BASE_URL}/admin/reports`,
        `${BASE_URL}/reports`,
        `${BASE_URL}/support/reports`,
      ];
      const salesEndpoints = [
        `${BASE_URL}/admin/sales-stats`,
        `${BASE_URL}/admin/dashboard-stats`,
        `${BASE_URL}/superadmin/stats`,
      ];
      const txEndpoints = [
        `${BASE_URL}/admin/transactions`,
        `${BASE_URL}/superadmin/transactions`,
        `${BASE_URL}/transactions`,
      ];

      const [usersRes, nimcRes, bvnRes, reportsRes, salesRes, txRes] =
        await Promise.allSettled([
          fetchWithFallback(userEndpoints, config),
          fetchWithFallback(nimcEndpoints, config),
          fetchWithFallback(bvnEndpoints, config),
          fetchWithFallback(reportEndpoints, config),
          fetchWithFallback(salesEndpoints, config),
          fetchWithFallback(txEndpoints, config),
        ]);

      const uData = usersRes.status === "fulfilled" ? usersRes.value : null;
      const nData = nimcRes.status === "fulfilled" ? nimcRes.value : null;
      const bData = bvnRes.status === "fulfilled" ? bvnRes.value : null;
      const rData = reportsRes.status === "fulfilled" ? reportsRes.value : null;
      const sData = salesRes.status === "fulfilled" ? salesRes.value : null;
      const tData = txRes.status === "fulfilled" ? txRes.value : null;

      const extractedSales =
        sData?.finance?.totalRevenue ??
        sData?.totalRevenue ??
        sData?.totalSales ??
        sData?.data?.finance?.totalRevenue ??
        sData?.data?.totalRevenue ??
        sData?.data?.totalSales ??
        sData?.total ??
        0;

      setStats({
        users: getCount(uData, "users"),
        nimc: getCount(nData, "nimcRequests"),
        bvn: getCount(bData, "bvnRequests"),
        reports: getCount(rData, "reports"),
        sales: Number(extractedSales || 0),
        transactions: getCount(tData, "transactions"),
      });
    } catch {
      // Retain state gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const goToSuperAdmin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            params: {
              screen: "SuperAdminDashboard",
            },
          },
        ],
      })
    );
  };

  const goBack = () => {
    if (
      route?.params?.fromSuperAdmin ||
      route?.params?.backScreen === "SuperAdminDashboard"
    ) {
      goToSuperAdmin();
      return;
    }

    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main", { screen: "AdminDashboard" });
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
      fromSuperAdmin:
        route?.params?.fromSuperAdmin ||
        route?.params?.backScreen === "SuperAdminDashboard",
      fromAdminDashboard: true,
      backScreen:
        route?.params?.fromSuperAdmin ||
        route?.params?.backScreen === "SuperAdminDashboard"
          ? "SuperAdminDashboard"
          : "AdminDashboard",
    });
  };

  const performLogout = async () => {
    try {
      setLogoutProcessing(true);
      await AsyncStorage.multiRemove([
        "userToken",
        "adminToken",
        "token",
        "userData",
        "userRole",
        "overrideRole",
        "isSuperAdminOverride",
      ]);

      setLogoutModalVisible(false);

      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      } catch {
        // Fallback
      }

      const parentNav = navigation.getParent?.();
      if (parentNav) {
        try {
          parentNav.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
          return;
        } catch {
          // Fallback
        }
      }

      navigation.navigate("Login");
    } catch {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.reload();
      }
    } finally {
      setLogoutProcessing(false);
    }
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
    [stats, COLORS]
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
        <Text style={styles.loaderText}>Establishing Secure Management Console...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "light-content"}
        backgroundColor={COLORS.primary}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={26} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Bellaj Admin Console</Text>
          <Text style={styles.headerSubtitle}>Real-Time Systems Authority</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModalVisible(true)}
          accessibilityLabel="Terminate Session"
        >
          <Ionicons name="power" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
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
              Audit subscriber records, transaction settlements, identity verification queues, and active telecom rates in real time.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
            <Ionicons name="sync" size={20} color={COLORS.white} />
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
          <Text style={styles.panelTitle}>Administrative Navigation Matrix</Text>

          <View style={styles.iconGrid}>
            {menuCards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.iconNavBox, isWeb && styles.webIconNavBox]}
                onPress={item.action}
                activeOpacity={0.86}
              >
                <View style={[styles.navIconBox, { backgroundColor: item.color }]}>
                  {renderIcon(item, 24, COLORS.white)}
                </View>

                <Text style={styles.iconNavText} numberOfLines={2}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Master Service Channels</Text>

          <QuickAction
            COLORS={COLORS}
            icon="cash-cog"
            title="Service Pricing Engine"
            color="#7C3AED"
            onPress={() => safeNavigate("PricingSettings")}
          />

          <QuickAction
            COLORS={COLORS}
            icon="server-outline"
            title="Data & Airtime Plan Schedules"
            color={COLORS.secondary}
            onPress={() => safeNavigate("DataPlans")}
          />

          <QuickAction
            COLORS={COLORS}
            icon="television-classic"
            title="Utility & Cable TV Rates"
            color={COLORS.secondary}
            onPress={() => safeNavigate("CableTvPlans")}
          />

          <QuickAction
            COLORS={COLORS}
            icon="headset"
            title="Support Desk Audit Logs"
            color={COLORS.primary}
            onPress={() => safeNavigate("SupportActivities")}
          />
        </View>
      </ScrollView>

      {/* Universal Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !logoutProcessing && setLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="power" size={32} color={COLORS.danger} />
            </View>

            <Text style={styles.modalHeading}>Sign Out of Console?</Text>
            <Text style={styles.modalSubheading}>
              Your current administrative token and active workspace will be terminated safely.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={logoutProcessing}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={logoutProcessing}
                onPress={performLogout}
              >
                {logoutProcessing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm Logout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    activeOpacity={0.82}
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
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  smallIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 12,
  },
});

const getStyles = (COLORS) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.light },
    header: {
      backgroundColor: COLORS.primary,
      paddingTop: Platform.OS === "android" ? 44 : 20,
      paddingBottom: 16,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    headerTextBox: { flex: 1 },
    headerTitle: {
      color: COLORS.white,
      fontSize: 18,
      fontWeight: "900",
    },
    headerSubtitle: {
      color: "#DCFCE7",
      marginTop: 2,
      fontSize: 12,
      fontWeight: "600",
    },
    logoutBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    container: { flex: 1 },
    content: {
      padding: 16,
      paddingBottom: 80,
      flexGrow: 1,
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
      marginTop: 14,
    },
    heroCard: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderLeftWidth: 5,
      borderLeftColor: COLORS.primary,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    heroIconBox: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: COLORS.text,
    },
    heroText: {
      color: COLORS.subText,
      marginTop: 4,
      fontWeight: "600",
      lineHeight: 18,
      fontSize: 12,
    },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
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
      minHeight: 114,
      backgroundColor: COLORS.card,
      borderRadius: 16,
      padding: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    webStatBox: {
      width: "23.5%",
      minHeight: 124,
    },
    statIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
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
      fontSize: 13,
      fontWeight: "900",
      color: COLORS.text,
      marginTop: 4,
      textAlign: "center",
    },
    navigationSection: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 18,
    },
    panelTitle: {
      color: COLORS.text,
      fontSize: 16,
      fontWeight: "900",
      marginBottom: 14,
    },
    iconGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
    },
    iconNavBox: {
      width: "23.5%",
      minHeight: 108,
      backgroundColor: COLORS.soft,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    },
    webIconNavBox: {
      width: "23.5%",
      minHeight: 120,
    },
    navIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    iconNavText: {
      color: COLORS.text,
      fontSize: 10,
      fontWeight: "800",
      textAlign: "center",
    },
    quickSection: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: COLORS.text,
      marginBottom: 14,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    modalBox: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 22,
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    modalIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#FEE2E2",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    modalHeading: {
      fontSize: 18,
      fontWeight: "900",
      color: COLORS.text,
      marginBottom: 6,
      textAlign: "center",
    },
    modalSubheading: {
      fontSize: 13,
      color: COLORS.subText,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 18,
    },
    modalActionRow: {
      flexDirection: "row",
      width: "100%",
      gap: 10,
    },
    modalCancelBtn: {
      flex: 1,
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalCancelText: {
      color: COLORS.text,
      fontWeight: "800",
      fontSize: 14,
    },
    modalConfirmBtn: {
      flex: 1,
      backgroundColor: COLORS.danger,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    modalConfirmText: {
      color: COLORS.white,
      fontWeight: "900",
      fontSize: 14,
    },
  });

export default AdminDashboard;