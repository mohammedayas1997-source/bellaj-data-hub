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
  StatusBar,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  CommonActions,
  DrawerActions,
} from "@react-navigation/native";
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
        axios.get(API_ENDPOINTS.dashboardStats, { headers, timeout: 30000 }),
        axios.get(API_ENDPOINTS.users, { headers, timeout: 30000 }),
        axios.get(API_ENDPOINTS.transactions, { headers, timeout: 30000 }),
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
      Alert.alert("Connection Error", "Unable to load super admin dashboard.");
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
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      const parent = navigation.getParent?.();

      if (navigation.openDrawer) return navigation.openDrawer();
      if (parent?.openDrawer) return parent.openDrawer();

      navigation.navigate("Main", { screen: "SuperAdminDashboard" });
    }
  };

  const goBack = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            params: { screen: "SuperAdminDashboard" },
          },
        ],
      })
    );
  };

  const navigateToDashboard = async (screenName, role = null) => {
  try {
    if (role) {
      await AsyncStorage.setItem("overrideRole", role);
      await AsyncStorage.setItem("isSuperAdminOverride", "true");
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            params: {
              screen: screenName,
              params: {
                fromSuperAdmin: true,
                backScreen: "SuperAdminDashboard",
              },
            },
          },
        ],
      })
    );
  } catch {
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

  const dashboardCards = [
    {
      title: "Users",
      value: roleCounts.totalUsers,
      icon: "account-group-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => navigateToDashboard("UserManagement"),
    },
    {
      title: "Admin",
      value: "Open",
      icon: "view-dashboard",
      type: "mci",
      color: "#0F766E",
      action: () => navigateToDashboard("AdminDashboard", "admin"),
    },
    {
      title: "Agent",
      value: "Open",
      icon: "account-tie-outline",
      type: "mci",
      color: COLORS.danger,
      action: () => navigateToDashboard("AgentDashboard", "agent"),
    },
    {
      title: "Support",
      value: "Open",
      icon: "headset",
      type: "mci",
      color: "#EA580C",
      action: () => navigateToDashboard("SupportDashboard", "support"),
    },
    {
      title: "Supervisor",
      value: "Open",
      icon: "account-supervisor-outline",
      type: "mci",
      color: COLORS.secondary,
      action: () => navigateToDashboard("SupervisorDashboard", "supervisor"),
    },
    {
      title: "Admins",
      value: roleCounts.totalAdmins,
      icon: "shield-account-outline",
      type: "mci",
      color: "#B91C1C",
      action: () => navigateToDashboard("AdminUserControl"),
    },
    {
      title: "Revenue",
      value: formatMoney(stats?.finance?.totalRevenue),
      icon: "cash-multiple",
      type: "mci",
      color: "#065F46",
      action: () => navigateToDashboard("SalesHistory"),
    },
    {
      title: "Transactions",
      value: stats?.finance?.successfulTransactions || transactions.length || 0,
      icon: "receipt-text-outline",
      type: "mci",
      color: "#991B1B",
      action: () => navigateToDashboard("SalesHistory"),
    },
  ];

  const navigationCards = [
    {
      title: "Super Admin",
      icon: "view-dashboard-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => navigateToDashboard("SuperAdminDashboard", "superadmin"),
    },
    {
      title: "Admin",
      icon: "view-dashboard",
      type: "mci",
      color: "#0F766E",
      action: () => navigateToDashboard("AdminDashboard", "admin"),
    },
    {
      title: "User",
      icon: "account-circle-outline",
      type: "mci",
      color: "#0284C7",
      action: () => navigateToDashboard("Main", "user"),
    },
    {
      title: "Agent",
      icon: "account-tie-outline",
      type: "mci",
      color: COLORS.danger,
      action: () => navigateToDashboard("AgentDashboard", "agent"),
    },
    {
      title: "Supervisor",
      icon: "account-supervisor-outline",
      type: "mci",
      color: COLORS.secondary,
      action: () => navigateToDashboard("SupervisorDashboard", "supervisor"),
    },
    {
      title: "Support",
      icon: "headset",
      type: "mci",
      color: "#EA580C",
      action: () => navigateToDashboard("SupportDashboard", "support"),
    },
    {
      title: "Admin Control",
      icon: "shield-account-outline",
      type: "mci",
      color: "#B91C1C",
      action: () => navigateToDashboard("AdminUserControl"),
    },
    {
      title: "Users",
      icon: "account-group-outline",
      type: "mci",
      color: COLORS.dark,
      action: () => navigateToDashboard("UserManagement"),
    },
    {
      title: "Transactions",
      icon: "receipt-text-outline",
      type: "mci",
      color: "#15803D",
      action: () => navigateToDashboard("SalesHistory"),
    },
    {
      title: "NIMC",
      icon: "fingerprint",
      type: "mci",
      color: "#7C2D12",
      action: () => navigateToDashboard("NIMCHistory"),
    },
    {
      title: "BVN",
      icon: "card-account-details-outline",
      type: "mci",
      color: "#6D28D9",
      action: () => navigateToDashboard("BVNHistory"),
    },
    {
      title: "Notifications",
      icon: "bell-outline",
      type: "mci",
      color: "#2563EB",
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

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
        nestedScrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <MaterialCommunityIcons
              name="shield-crown-outline"
              size={32}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Super Admin Access</Text>
            <Text style={styles.welcomeText}>
              Manage all dashboards, users, roles, transactions and platform
              activity records in real time.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchDashboard}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.iconGrid}>
          {dashboardCards.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.iconCard, isWeb && styles.webIconCard]}
              activeOpacity={0.86}
              onPress={item.action}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                {renderIcon(item, 26, COLORS.white)}
              </View>

              <Text style={styles.iconTitle} numberOfLines={1}>
                {item.title}
              </Text>

              <Text style={styles.iconValue} numberOfLines={1}>
                {item.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.navigationSection}>
          <Text style={styles.panelTitle}>Admin Navigation</Text>

          <View style={styles.iconGrid}>
            {navigationCards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.iconCard, isWeb && styles.webIconCard]}
                onPress={item.action}
                activeOpacity={0.86}
              >
                <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                  {renderIcon(item, 26, COLORS.white)}
                </View>

                <Text style={styles.iconTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>OPEN</Text>
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
    paddingBottom: 120,
    flexGrow: 1,
    minHeight: "100%",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  welcomeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  welcomeTitle: { color: COLORS.dark, fontSize: 22, fontWeight: "900" },
  welcomeText: {
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: "600",
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 18,
  },
  iconCard: {
    width: "23.5%",
    minHeight: 118,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  webIconCard: {
    width: "23.5%",
    minHeight: 128,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconTitle: {
    color: COLORS.dark,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  iconValue: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 5,
    textAlign: "center",
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
  openBadge: {
    marginTop: 7,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  openBadgeText: {
    color: COLORS.primary,
    fontSize: 9,
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