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
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  danger: "#DC2626",
  dark: "#0F172A",
  muted: "#64748B",
  white: "#FFFFFF",
  light: "#F8FAFC",
  border: "#E2E8F0",
};

const API_ENDPOINTS = {
  dashboardStats: `${BASE_URL}/admin/dashboard-stats`,
  users: `${BASE_URL}/admin/users`,
  transactions: `${BASE_URL}/admin/transactions`,
};

const DEFAULT_STATS = {
  finance: {
    totalRevenue: 0,
    successfulTransactions: 0,
    walletBalance: 0,
  },
  users: {
    totalUsers: 0,
    totalAgents: 0,
    totalSupervisors: 0,
    totalAdmins: 0,
  },
};

const SuperAdminDashboard = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [stats, setStats] = useState(DEFAULT_STATS);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeArray = (payload, key) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    return [];
  };

  const normalizeStats = (payload) => {
    const data = payload?.data || payload || {};
    return {
      finance: {
        totalRevenue:
          data?.finance?.totalRevenue || data?.totalRevenue || data?.revenue || 0,
        successfulTransactions:
          data?.finance?.successfulTransactions ||
          data?.successfulTransactions ||
          data?.totalTransactions ||
          0,
        walletBalance: data?.finance?.walletBalance || data?.walletBalance || 0,
      },
      users: {
        totalUsers: data?.users?.totalUsers || data?.totalUsers || 0,
        totalAgents: data?.users?.totalAgents || data?.totalAgents || 0,
        totalSupervisors:
          data?.users?.totalSupervisors || data?.totalSupervisors || 0,
        totalAdmins: data?.users?.totalAdmins || data?.totalAdmins || 0,
      },
    };
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const requests = await Promise.allSettled([
        axios.get(API_ENDPOINTS.dashboardStats, { headers }),
        axios.get(API_ENDPOINTS.users, { headers }),
        axios.get(API_ENDPOINTS.transactions, { headers }),
      ]);

      if (requests[0].status === "fulfilled") {
        setStats(normalizeStats(requests[0].value.data));
      }

      if (requests[1].status === "fulfilled") {
        setUsers(normalizeArray(requests[1].value.data, "users"));
      }

      if (requests[2].status === "fulfilled") {
        setTransactions(normalizeArray(requests[2].value.data, "transactions"));
      }
    } catch (error) {
      console.log("Dashboard error:", error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const openMenu = () => {
    if (navigation.openDrawer) {
      navigation.openDrawer();
      return;
    }

    Alert.alert("Menu", "Drawer menu is not available on this navigator.");
  };

  const goBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "SuperAdminDashboard" }],
      })
    );
  };

  const navigateToDashboard = async (screenName, role = null) => {
    try {
      if (role) {
        await AsyncStorage.setItem("overrideRole", role);
        await AsyncStorage.setItem("isSuperAdminOverride", "true");
      }

      navigation.navigate(screenName);
    } catch (error) {
      Alert.alert("Navigation Error", `${screenName} is not registered.`);
    }
  };

  const resetToDashboard = async (screenName, role = null) => {
    try {
      if (role) {
        await AsyncStorage.setItem("overrideRole", role);
        await AsyncStorage.setItem("isSuperAdminOverride", "true");
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: screenName }],
        })
      );
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
            "token",
            "adminToken",
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

  const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;

  const roleCounts = useMemo(() => {
    return {
      totalUsers: stats?.users?.totalUsers || users.length || 0,
      totalAgents:
        stats?.users?.totalAgents ||
        users.filter((u) => u?.role?.toLowerCase() === "agent").length,
      totalSupervisors:
        stats?.users?.totalSupervisors ||
        users.filter((u) => u?.role?.toLowerCase() === "supervisor").length,
      totalAdmins:
        stats?.users?.totalAdmins ||
        users.filter((u) =>
          ["admin", "superadmin"].includes(u?.role?.toLowerCase())
        ).length,
    };
  }, [stats, users]);

  const statCards = [
    {
      title: "Total Users",
      value: roleCounts.totalUsers,
      icon: "account-group-outline",
      type: "mci",
      bg: COLORS.primary,
      action: () => navigateToDashboard("UserManagement"),
    },
    {
      title: "Agent Dashboard",
      value: "Open",
      icon: "account-tie-outline",
      type: "mci",
      bg: COLORS.danger,
      action: () => resetToDashboard("AgentDashboard", "agent"),
    },
    {
      title: "Support Dashboard",
      value: "Open",
      icon: "headset",
      type: "mci",
      bg: "#EA580C",
      action: () => resetToDashboard("SupportDashboard", "support"),
    },
    {
      title: "Supervisor Dashboard",
      value: "Open",
      icon: "account-supervisor-outline",
      type: "mci",
      bg: COLORS.secondary,
      action: () => resetToDashboard("SupervisorDashboard", "supervisor"),
    },
    {
      title: "Admins",
      value: roleCounts.totalAdmins,
      icon: "shield-account-outline",
      type: "mci",
      bg: "#B91C1C",
      action: () => navigateToDashboard("AdminUserControl"),
    },
    {
      title: "Revenue",
      value: formatMoney(stats?.finance?.totalRevenue),
      icon: "cash-multiple",
      type: "mci",
      bg: "#065F46",
      action: () => navigateToDashboard("SalesHistory"),
    },
    {
      title: "Transactions",
      value: stats?.finance?.successfulTransactions || transactions.length || 0,
      icon: "receipt-text-outline",
      type: "mci",
      bg: "#991B1B",
      action: () => navigateToDashboard("SalesHistory"),
    },
    {
      title: "Refresh",
      value: "Reload",
      icon: "refresh",
      type: "mci",
      bg: COLORS.dark,
      action: fetchDashboard,
    },
  ];

  const navigationCards = [
    {
      title: "Super Admin",
      subtitle: "Command Center",
      icon: "view-dashboard-outline",
      type: "mci",
      bg: COLORS.primary,
      action: () => resetToDashboard("SuperAdminDashboard", "superadmin"),
    },
    {
      title: "User Dashboard",
      subtitle: "Open user area",
      icon: "account-circle-outline",
      type: "mci",
      bg: "#0F766E",
      action: () => resetToDashboard("Main", "user"),
    },
    {
      title: "Agent Dashboard",
      subtitle: "Open agent area",
      icon: "account-tie-outline",
      type: "mci",
      bg: COLORS.danger,
      action: () => resetToDashboard("AgentDashboard", "agent"),
    },
    {
      title: "Supervisor",
      subtitle: "Open supervisor area",
      icon: "account-supervisor-outline",
      type: "mci",
      bg: COLORS.secondary,
      action: () => resetToDashboard("SupervisorDashboard", "supervisor"),
    },
    {
      title: "Support",
      subtitle: "Open support center",
      icon: "headset",
      type: "mci",
      bg: "#EA580C",
      action: () => resetToDashboard("SupportDashboard", "support"),
    },
    {
      title: "Admin Control",
      subtitle: "Manage roles",
      icon: "shield-account-outline",
      type: "mci",
      bg: "#B91C1C",
      action: () => navigateToDashboard("AdminUserControl"),
    },
    {
      title: "Users",
      subtitle: "Manage users",
      icon: "account-group-outline",
      type: "mci",
      bg: COLORS.dark,
      action: () => navigateToDashboard("UserManagement"),
    },
    {
      title: "Transactions",
      subtitle: "Sales logs",
      icon: "receipt-text-outline",
      type: "mci",
      bg: "#15803D",
      action: () => navigateToDashboard("SalesHistory"),
    },
    {
      title: "NIMC",
      subtitle: "History records",
      icon: "fingerprint",
      type: "mci",
      bg: "#7C2D12",
      action: () => navigateToDashboard("NIMCHistory"),
    },
    {
      title: "BVN",
      subtitle: "History records",
      icon: "card-account-details-outline",
      type: "mci",
      bg: "#6D28D9",
      action: () => navigateToDashboard("BVNHistory"),
    },
    {
      title: "Notifications",
      subtitle: "Message center",
      icon: "bell-outline",
      type: "mci",
      bg: "#2563EB",
      action: () => navigateToDashboard("Notifications"),
    },
  ];

  const renderIcon = (item, size = 24, color = COLORS.white) => {
    if (item.type === "mci") {
      return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
    }

    return <Ionicons name={item.icon} size={size} color={color} />;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Super Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={26} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Bellaj Data Hub</Text>
          <Text style={styles.headerSubtitle}>Super Admin Command Center</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Super Admin Access</Text>
          <Text style={styles.welcomeText}>
            Manage users, agents, supervisors, support, transactions and platform
            activity records in real time.
          </Text>
        </View>

        <View style={[styles.grid, isWeb && styles.webGrid]}>
          {statCards.map((card, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.statCard,
                { backgroundColor: card.bg },
                isWeb && styles.webStatCard,
              ]}
              activeOpacity={0.86}
              onPress={card.action}
            >
              <View style={styles.statInfo}>
                <Text style={styles.statTitle}>{card.title}</Text>
                <Text style={styles.statValue}>{card.value}</Text>
              </View>

              <View style={styles.statIconOuter}>
                <View style={styles.statIconInner}>{renderIcon(card, 28)}</View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navigationSection}>
          <Text style={styles.panelTitle}>Admin Navigation</Text>

          <View style={[styles.navGrid, isWeb && styles.webNavGrid]}>
            {navigationCards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.navCardBox, isWeb && styles.webNavCardBox]}
                onPress={item.action}
                activeOpacity={0.86}
              >
                <View style={[styles.navIconLarge, { backgroundColor: item.bg }]}>
                  {renderIcon(item, 30, COLORS.white)}
                </View>

                <Text style={styles.navCardTitle}>{item.title}</Text>
                <Text style={styles.navCardSubtitle}>{item.subtitle}</Text>

                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>OPEN</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={COLORS.primary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.sectionGrid, isWeb && styles.webSectionGrid]}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Users and Roles</Text>
            </View>

            {users.length === 0 ? (
              <Text style={styles.emptyText}>
                No users returned yet. Configure /admin/users endpoint to show
                live users here.
              </Text>
            ) : (
              users.slice(0, 10).map((user, index) => (
                <TouchableOpacity
                  key={user?._id || index}
                  style={styles.userRow}
                  onPress={() => navigateToDashboard("UserManagement")}
                  activeOpacity={0.86}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.name || "No Name"}</Text>
                    <Text style={styles.userEmail}>{user?.email || "No Email"}</Text>
                  </View>

                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user?.role || "user"}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="clipboard-list"
                size={24}
                color={COLORS.danger}
              />
              <Text style={styles.sectionTitle}>Recent Activities</Text>
            </View>

            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>
                No transactions returned yet. Configure /admin/transactions
                endpoint to show live activities here.
              </Text>
            ) : (
              transactions.slice(0, 10).map((tx, index) => (
                <TouchableOpacity
                  key={tx?._id || index}
                  style={styles.txRow}
                  onPress={() => navigateToDashboard("SalesHistory")}
                  activeOpacity={0.86}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>
                      {tx?.type || tx?.service || "Transaction"}
                    </Text>
                    <Text style={styles.txEmail}>
                      {tx?.userEmail ||
                        tx?.email ||
                        tx?.user?.email ||
                        "Unknown User"}
                    </Text>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>{formatMoney(tx?.amount)}</Text>
                    <Text style={styles.txStatus}>{tx?.status || "pending"}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginRight: 8,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
  headerSubtitle: {
    color: "#DCFCE7",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 70,
    flexGrow: 1,
  },
  welcomeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  welcomeTitle: { color: COLORS.dark, fontSize: 22, fontWeight: "900" },
  welcomeText: {
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: "600",
  },
  grid: { gap: 12, marginBottom: 18 },
  webGrid: { flexDirection: "row", flexWrap: "wrap" },
  statCard: {
    borderRadius: 18,
    padding: 18,
    minHeight: 105,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  webStatCard: { width: "23.5%", minWidth: 220 },
  statInfo: { flex: 1 },
  statTitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6,
  },
  statIconOuter: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  statIconInner: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
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
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  sectionGrid: { gap: 16 },
  webSectionGrid: { flexDirection: "row" },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { color: COLORS.dark, fontSize: 17, fontWeight: "900", flex: 1 },
  emptyText: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.muted,
    padding: 14,
    borderRadius: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: { color: COLORS.white, fontWeight: "900" },
  userInfo: { flex: 1 },
  userName: { color: COLORS.dark, fontWeight: "900", fontSize: 14 },
  userEmail: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  roleBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  roleText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  txRow: {
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  txTitle: { color: COLORS.dark, fontWeight: "900" },
  txEmail: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  txRight: { alignItems: "flex-end" },
  txAmount: { color: COLORS.primary, fontWeight: "900" },
  txStatus: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
    textTransform: "uppercase",
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderText: { marginTop: 12, color: COLORS.primary, fontWeight: "800" },
});

export default SuperAdminDashboard;