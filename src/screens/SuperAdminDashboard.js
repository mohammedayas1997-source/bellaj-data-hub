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

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};
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
          data?.finance?.totalRevenue ||
          data?.totalRevenue ||
          data?.revenue ||
          0,
        successfulTransactions:
          data?.finance?.successfulTransactions ||
          data?.successfulTransactions ||
          data?.totalTransactions ||
          0,
        walletBalance:
          data?.finance?.walletBalance || data?.walletBalance || 0,
      },
      users: {
        totalUsers:
          data?.users?.totalUsers ||
          data?.totalUsers ||
          users.length ||
          0,
        totalAgents:
          data?.users?.totalAgents || data?.totalAgents || 0,
        totalSupervisors:
          data?.users?.totalSupervisors || data?.totalSupervisors || 0,
        totalAdmins:
          data?.users?.totalAdmins || data?.totalAdmins || 0,
      },
    };
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      try {
        const statsRes = await axios.get(API_ENDPOINTS.dashboardStats, {
          headers,
        });
        setStats(normalizeStats(statsRes.data));
      } catch (error) {
        console.log("Stats endpoint not ready:", error?.response?.status);
      }

      try {
        const usersRes = await axios.get(API_ENDPOINTS.users, { headers });
        setUsers(normalizeArray(usersRes.data, "users"));
      } catch (error) {
        console.log("Users endpoint not ready:", error?.response?.status);
      }

      try {
        const txRes = await axios.get(API_ENDPOINTS.transactions, {
          headers,
        });
        setTransactions(normalizeArray(txRes.data, "transactions"));
      } catch (error) {
        console.log("Transactions endpoint not ready:", error?.response?.status);
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

  const formatMoney = (value) => {
    return `₦${Number(value || 0).toLocaleString()}`;
  };

  const roleCounts = useMemo(() => {
    const totalAgents =
      stats?.users?.totalAgents ||
      users.filter((u) => u?.role?.toLowerCase() === "agent").length;

    const totalSupervisors =
      stats?.users?.totalSupervisors ||
      users.filter((u) => u?.role?.toLowerCase() === "supervisor").length;

    const totalAdmins =
      stats?.users?.totalAdmins ||
      users.filter((u) =>
        ["admin", "superadmin"].includes(u?.role?.toLowerCase())
      ).length;

    return {
      totalUsers: stats?.users?.totalUsers || users.length,
      totalAgents,
      totalSupervisors,
      totalAdmins,
    };
  }, [stats, users]);

  const cards = [
    {
      title: "Total Users",
      value: roleCounts.totalUsers,
      icon: "people",
      iconType: "ion",
      bg: COLORS.primary,
    },
    {
      title: "Agents",
      value: roleCounts.totalAgents,
      icon: "account-tie",
      iconType: "mci",
      bg: COLORS.danger,
    },
    {
      title: "Supervisors",
      value: roleCounts.totalSupervisors,
      icon: "account-check",
      iconType: "mci",
      bg: COLORS.secondary,
    },
    {
      title: "Admins",
      value: roleCounts.totalAdmins,
      icon: "shield-checkmark",
      iconType: "ion",
      bg: "#B91C1C",
    },
    {
      title: "Revenue",
      value: formatMoney(stats?.finance?.totalRevenue),
      icon: "cash",
      iconType: "ion",
      bg: "#065F46",
    },
    {
      title: "Transactions",
      value: stats?.finance?.successfulTransactions || transactions.length || 0,
      icon: "swap-horizontal",
      iconType: "ion",
      bg: "#991B1B",
    },
    {
      title: "Wallet Balance",
      value: formatMoney(stats?.finance?.walletBalance),
      icon: "wallet",
      iconType: "ion",
      bg: "#15803D",
    },
    {
      title: "Status",
      value: "Active",
      icon: "trending-up",
      iconType: "ion",
      bg: COLORS.dark,
    },
  ];

  const renderIcon = (item, size = 30, color = COLORS.white) => {
    if (item.iconType === "mci") {
      return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
    }

    return <Ionicons name={item.icon} size={size} color={color} />;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Bellaj Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bellaj Data Hub</Text>
          <Text style={styles.headerSubtitle}>Super Admin Command Center</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
          <Text style={styles.logoutText}>Logout</Text>
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
          <Text style={styles.welcomeTitle}>Welcome Super Admin</Text>
          <Text style={styles.welcomeText}>
            Anan zaka iya ganin users, agents, supervisors, admins,
            transactions da aikin kowa.
          </Text>
        </View>

        <View style={[styles.grid, isWeb && styles.webGrid]}>
          {cards.map((card, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                { backgroundColor: card.bg },
                isWeb && styles.webStatCard,
              ]}
            >
              <View style={styles.statInfo}>
                <Text style={styles.statTitle}>{card.title}</Text>
                <Text style={styles.statValue}>{card.value}</Text>
              </View>
              <View style={styles.iconCircle}>{renderIcon(card)}</View>
            </View>
          ))}
        </View>

        <View style={[styles.sectionGrid, isWeb && styles.webSectionGrid]}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Users / Agents / Supervisors</Text>
            </View>

            {users.length === 0 ? (
              <Text style={styles.emptyText}>
                Babu users da aka dawo dasu tukuna. Idan kana son su fito kai
                tsaye, backend endpoint /admin/users ya kasance.
              </Text>
            ) : (
              users.slice(0, 10).map((user, index) => (
                <View key={user?._id || index} style={styles.userRow}>
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
                </View>
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
              <Text style={styles.sectionTitle}>Recent Activities / Aikin Kowa</Text>
            </View>

            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>
                Babu transactions da aka dawo dasu tukuna. Idan kana son ganin
                aikin kowa, backend endpoint /admin/transactions ya kasance.
              </Text>
            ) : (
              transactions.slice(0, 10).map((tx, index) => (
                <View key={tx?._id || index} style={styles.txRow}>
                  <View>
                    <Text style={styles.txTitle}>
                      {tx?.type || tx?.service || "Transaction"}
                    </Text>
                    <Text style={styles.txEmail}>
                      {tx?.userEmail || tx?.email || tx?.user?.email || "Unknown User"}
                    </Text>
                  </View>

                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>{formatMoney(tx?.amount)}</Text>
                    <Text style={styles.txStatus}>{tx?.status || "pending"}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#DCFCE7",
    fontSize: 13,
    marginTop: 3,
    fontWeight: "600",
  },
  logoutBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoutText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
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
  welcomeTitle: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
  },
  welcomeText: {
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: "600",
  },
  grid: {
    gap: 12,
    marginBottom: 16,
  },
  webGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statCard: {
    borderRadius: 18,
    padding: 18,
    minHeight: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  webStatCard: {
    width: "23.5%",
    minWidth: 220,
  },
  statInfo: {
    flex: 1,
  },
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
  sectionGrid: {
    gap: 16,
  },
  webSectionGrid: {
    flexDirection: "row",
  },
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
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 17,
    fontWeight: "900",
    flex: 1,
  },
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
  avatarText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 14,
  },
  userEmail: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
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
  txTitle: {
    color: COLORS.dark,
    fontWeight: "900",
  },
  txEmail: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    color: COLORS.primary,
    fontWeight: "900",
  },
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
  loaderText: {
    marginTop: 12,
    color: COLORS.primary,
    fontWeight: "800",
  },
});

export default SuperAdminDashboard;