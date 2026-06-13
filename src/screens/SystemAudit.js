import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
  warning: "#F59E0B",
  success: "#16A34A",
};

const API_ENDPOINTS = {
  stats: `${BASE_URL}/admin/dashboard-stats`,
  auditLogs: `${BASE_URL}/admin/audit-logs`,
};

const DEFAULT_STATS = {
  finance: {
    totalRevenue: 0,
    successfulTransactions: 0,
    walletBalance: 0,
  },
  users: {
    totalUsers: 0,
    totalAdmins: 0,
    totalAgents: 0,
    totalSupervisors: 0,
  },
};

const SystemAudit = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    fetchAuditData();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
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
        walletBalance:
          data?.finance?.walletBalance || data?.walletBalance || 0,
      },
      users: {
        totalUsers: data?.users?.totalUsers || data?.totalUsers || 0,
        totalAdmins: data?.users?.totalAdmins || data?.totalAdmins || 0,
        totalAgents: data?.users?.totalAgents || data?.totalAgents || 0,
        totalSupervisors:
          data?.users?.totalSupervisors || data?.totalSupervisors || 0,
      },
    };
  };

  const normalizeLogs = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.logs)) return payload.logs;
    if (Array.isArray(payload?.auditLogs)) return payload.auditLogs;
    if (Array.isArray(payload?.data?.logs)) return payload.data.logs;
    if (Array.isArray(payload?.data?.auditLogs)) return payload.data.auditLogs;
    return [];
  };

  const fetchAuditData = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      if (!headers) {
        navigation?.dispatch?.(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const [statsRes, logsRes] = await Promise.allSettled([
        axios.get(API_ENDPOINTS.stats, { headers, timeout: 25000 }),
        axios.get(API_ENDPOINTS.auditLogs, { headers, timeout: 25000 }),
      ]);

      if (statsRes.status === "fulfilled") {
        setStats(normalizeStats(statsRes.value.data));
      }

      if (logsRes.status === "fulfilled") {
        setAuditLogs(normalizeLogs(logsRes.value.data));
      }
    } catch (err) {
      Alert.alert(
        "Bellaj Data Hub",
        "Unable to load administrative audit records."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuditData();
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation?.navigate?.("SuperAdminDashboard");
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

          navigation?.dispatch?.(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        },
      },
    ]);
  };

  const auditSummary = useMemo(() => {
    const today = new Date().toDateString();

    return {
      totalLogs: auditLogs.length,
      todayLogs: auditLogs.filter((log) => {
        if (!log?.createdAt) return false;
        return new Date(log.createdAt).toDateString() === today;
      }).length,
      criticalLogs: auditLogs.filter((log) =>
        ["delete", "debit", "block", "role", "admin"].some((word) =>
          String(log?.action || log?.details || "").toLowerCase().includes(word)
        )
      ).length,
    };
  }, [auditLogs]);

  const LogItem = ({ item }) => {
    const staff =
      item?.staffId ||
      item?.staff ||
      item?.admin ||
      item?.user ||
      {};

    const staffName =
      staff?.name ||
      staff?.fullName ||
      `${staff?.firstName || ""} ${staff?.surname || ""}`.trim() ||
      item?.staffName ||
      "System User";

    const role = staff?.role || item?.role || "staff";

    return (
      <View style={styles.logCard}>
        <View style={styles.logIconBox}>
          <MaterialCommunityIcons
            name="shield-search"
            size={24}
            color={COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.logHeader}>
            <Text style={styles.staffName}>{staffName}</Text>

            <Text style={styles.logTime}>
              {item?.createdAt
                ? new Date(item.createdAt).toLocaleTimeString()
                : "--"}
            </Text>
          </View>

          <Text style={styles.staffRole}>{String(role).toUpperCase()}</Text>

          <Text style={styles.actionText}>
            {item?.action || "Administrative Activity"}
          </Text>

          <Text style={styles.logDetail}>
            {item?.details || item?.description || "No details available."}
          </Text>

          <Text style={styles.logDate}>
            {item?.createdAt
              ? new Date(item.createdAt).toLocaleString()
              : "No date"}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Audit Center...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Audit Center</Text>
          <Text style={styles.headerSubtitle}>
            Governance, security and administrative monitoring
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="security"
              size={36}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Bellaj System Audit</Text>
            <Text style={styles.heroText}>
              Monitor platform finance, users, admins and security audit trails
              in real time.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchAuditData}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainStat}>
          <Text style={styles.statLabel}>Total Revenue</Text>
          <Text style={styles.revenueText}>
            ₦{Number(stats?.finance?.totalRevenue || 0).toLocaleString()}
          </Text>
          <Text style={styles.statSubText}>
            Successful Transactions:{" "}
            {stats?.finance?.successfulTransactions || 0}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <MiniStat
            title="Total Users"
            value={stats?.users?.totalUsers || 0}
            icon="account-group-outline"
            color={COLORS.primary}
          />

          <MiniStat
            title="Admins"
            value={stats?.users?.totalAdmins || 0}
            icon="shield-account-outline"
            color={COLORS.secondary}
          />

          <MiniStat
            title="Audit Logs"
            value={auditSummary.totalLogs}
            icon="clipboard-text-clock-outline"
            color={COLORS.warning}
          />

          <MiniStat
            title="Today"
            value={auditSummary.todayLogs}
            icon="calendar-today"
            color="#2563EB"
          />
        </View>

        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <MaterialCommunityIcons
              name="alert-decagram-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.securityTitle}>Security Summary</Text>
          </View>

          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Critical Activities</Text>
            <Text style={styles.securityValue}>{auditSummary.criticalLogs}</Text>
          </View>

          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Platform Admins</Text>
            <Text style={styles.securityValue}>
              {stats?.users?.totalAdmins || 0}
            </Text>
          </View>

          <View style={styles.securityRow}>
            <Text style={styles.securityLabel}>Registered Agents</Text>
            <Text style={styles.securityValue}>
              {stats?.users?.totalAgents || 0}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Administrative Audit Logs</Text>

            <TouchableOpacity onPress={fetchAuditData}>
              <Text style={styles.reloadText}>Reload</Text>
            </TouchableOpacity>
          </View>

          {auditLogs.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="clipboard-search-outline"
                size={58}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>No Audit Logs</Text>
              <Text style={styles.emptyText}>
                Recent administrative activities will appear here.
              </Text>
            </View>
          ) : (
            auditLogs.map((log, index) => (
              <LogItem key={log?._id || log?.id || index} item={log} />
            ))
          )}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => navigation?.navigate?.("SalesHistory")}
          >
            <MaterialCommunityIcons
              name="receipt-text-outline"
              size={21}
              color={COLORS.white}
            />
            <Text style={styles.primaryActionText}>
              View Global Transaction Ledger
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => navigation?.navigate?.("AdminUserControl")}
          >
            <MaterialCommunityIcons
              name="account-key-outline"
              size={21}
              color={COLORS.secondary}
            />
            <Text style={styles.secondaryActionText}>
              Manage Roles & Permissions
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const MiniStat = ({ title, value, icon, color }) => (
  <View style={[styles.miniStat, { borderLeftColor: color }]}>
    <MaterialCommunityIcons name={icon} size={25} color={color} />
    <Text style={styles.miniValue}>{value}</Text>
    <Text style={styles.miniLabel}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 90,
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.primary,
    fontWeight: "800",
  },
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
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
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
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  mainStat: {
    backgroundColor: COLORS.primary,
    padding: 22,
    borderRadius: 22,
    marginBottom: 16,
    alignItems: "center",
  },
  statLabel: {
    color: "#FFE4E4",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  revenueText: {
    color: COLORS.white,
    fontSize: 31,
    fontWeight: "900",
    marginTop: 8,
  },
  statSubText: {
    color: "#FFE4E4",
    marginTop: 8,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 16,
  },
  miniStat: {
    width: "48%",
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  miniLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  miniValue: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 8,
  },
  securityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    marginBottom: 18,
  },
  securityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  securityTitle: {
    marginLeft: 8,
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 17,
  },
  securityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  securityLabel: {
    color: COLORS.muted,
    fontWeight: "700",
  },
  securityValue: {
    color: COLORS.dark,
    fontWeight: "900",
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
  },
  reloadText: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  logCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    flexDirection: "row",
  },
  logIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  staffName: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.dark,
    flex: 1,
  },
  staffRole: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },
  logTime: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 7,
  },
  logDetail: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: "600",
  },
  logDate: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 6,
    fontWeight: "700",
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 18,
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    fontWeight: "600",
  },
  actionSection: {
    marginBottom: 20,
  },
  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    padding: 17,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  primaryActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryActionBtn: {
    padding: 17,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    flexDirection: "row",
    gap: 8,
  },
  secondaryActionText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "900",
  },
});

export default SystemAudit;