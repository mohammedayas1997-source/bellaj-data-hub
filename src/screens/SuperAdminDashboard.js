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
  card: "#FFFFFF",
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

  const goTo = (screenName) => {
    try {
      navigation.navigate(screenName);
    } catch (error) {
      Alert.alert(
        "Screen Not Found",
        `${screenName} is not registered in Stack.Navigator.`
      );
    }
  };

  const enterAsRole = async (role, screenName) => {
    await AsyncStorage.setItem("overrideRole", role);
    await AsyncStorage.setItem("isSuperAdminOverride", "true");
    navigation.navigate(screenName);
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
      icon: "people",
      type: "ion",
      bg: COLORS.primary,
      screen: "UserManagement",
    },
    {
      title: "Agents",
      value: roleCounts.totalAgents,
      icon: "account-tie",
      type: "mci",
      bg: COLORS.danger,
      screen: "AgentDashboard",
    },
    {
      title: "Supervisors",
      value: roleCounts.totalSupervisors,
      icon: "account-supervisor",
      type: "mci",
      bg: COLORS.secondary,
      screen: "SupervisorDashboard",
    },
    {
      title: "Admins",
      value: roleCounts.totalAdmins,
      icon: "shield-checkmark",
      type: "ion",
      bg: "#B91C1C",
      screen: "AdminUserControl",
    },
    {
      title: "Revenue",
      value: formatMoney(stats?.finance?.totalRevenue),
      icon: "cash",
      type: "ion",
      bg: "#065F46",
      screen: "SalesHistory",
    },
    {
      title: "Transactions",
      value: stats?.finance?.successfulTransactions || transactions.length || 0,
      icon: "swap-horizontal",
      type: "ion",
      bg: "#991B1B",
      screen: "SalesHistory",
    },
    {
      title: "Wallet",
      value: formatMoney(stats?.finance?.walletBalance),
      icon: "wallet",
      type: "ion",
      bg: "#15803D",
      screen: "Wallet",
    },
    {
      title: "System Status",
      value: "Active",
      icon: "trending-up",
      type: "ion",
      bg: COLORS.dark,
      screen: "SuperAdminDashboard",
    },
  ];

  const drawerMenus = [
    {
      label: "Main Dashboard",
      icon: "grid-outline",
      type: "ion",
      color: COLORS.primary,
      action: () => goTo("SuperAdminDashboard"),
    },
    {
      label: "User Dashboard",
      icon: "person-circle-outline",
      type: "ion",
      color: COLORS.primary,
      action: () => enterAsRole("user", "Main"),
    },
    {
      label: "Agent Dashboard",
      icon: "account-tie",
      type: "mci",
      color: COLORS.danger,
      action: () => enterAsRole("agent", "AgentDashboard"),
    },
    {
      label: "Supervisor Dashboard",
      icon: "account-supervisor-outline",
      type: "mci",
      color: COLORS.secondary,
      action: () => enterAsRole("supervisor", "SupervisorDashboard"),
    },
    {
      label: "Admin Control",
      icon: "shield-account-outline",
      type: "mci",
      color: "#B91C1C",
      action: () => goTo("AdminUserControl"),
    },
    {
      label: "User Management",
      icon: "people-outline",
      type: "ion",
      color: COLORS.dark,
      action: () => goTo("UserManagement"),
    },
    {
      label: "Transactions",
      icon: "receipt-outline",
      type: "ion",
      color: "#15803D",
      action: () => goTo("SalesHistory"),
    },
    {
      label: "NIMC History",
      icon: "finger-print-outline",
      type: "ion",
      color: "#7C2D12",
      action: () => goTo("NIMCHistory"),
    },
    {
      label: "BVN History",
      icon: "card-account-details-outline",
      type: "mci",
      color: "#6D28D9",
      action: () => goTo("BVNHistory"),
    },
    {
      label: "Reports",
      icon: "chart-box-outline",
      type: "mci",
      color: "#0F766E",
      action: () => goTo("Reports"),
    },
    {
      label: "Notifications",
      icon: "notifications-outline",
      type: "ion",
      color: "#EA580C",
      action: () => goTo("Notifications"),
    },
    {
      label: "Settings",
      icon: "settings-outline",
      type: "ion",
      color: COLORS.muted,
      action: () => goTo("Settings"),
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
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.openDrawer?.()}
        >
          <Ionicons name="menu" size={26} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Bellaj Data Hub</Text>
          <Text style={styles.headerSubtitle}>Super Admin Command Center</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Super Admin Access</Text>
          <Text style={styles.welcomeText}>
            Manage platform users, transactions, agents, supervisors, admin
            controls, reports and activity records in real time.
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
              onPress={() => goTo(card.screen)}
            >
              <View style={styles.statInfo}>
                <Text style={styles.statTitle}>{card.title}</Text>
                <Text style={styles.statValue}>{card.value}</Text>
              </View>

              <View style={styles.iconCircle}>{renderIcon(card, 28)}</View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.drawerLikePanel}>
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

        <View style={[styles.sectionGrid, isWeb && styles.webSectionGrid]}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Users and Roles</Text>
            </View>

            {users.length === 0 ? (
              <Text style={styles.emptyText}>
                No users returned yet. Configure the /admin/users endpoint to
                show live users here.
              </Text>
            ) : (
              users.slice(0, 10).map((user, index) => (
                <TouchableOpacity
                  key={user?._id || index}
                  style={styles.userRow}
                  onPress={() => goTo("UserManagement")}
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
                No transactions returned yet. Configure the /admin/transactions
                endpoint to show live activity here.
              </Text>
            ) : (
              transactions.slice(0, 10).map((tx, index) => (
                <TouchableOpacity
                  key={tx?._id || index}
                  style={styles.txRow}
                  onPress={() => goTo("SalesHistory")}
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
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  headerTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: { color: COLORS.white, fontSize: 21, fontWeight: "900" },
  headerSubtitle: {
    color: "#DCFCE7",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  welcomeCard: {
    backgroundColor: COLORS.card,
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
    minHeight: 100,
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
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerLikePanel: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  panelTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
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