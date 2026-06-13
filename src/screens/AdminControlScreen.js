import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  danger: "#DC2626",
};

const API_ENDPOINTS = {
  dashboardStats: `${BASE_URL}/admin/dashboard-stats`,
  users: `${BASE_URL}/admin/users`,
  supervisors: `${BASE_URL}/admin/supervisors`,
  agents: `${BASE_URL}/admin/agents`,
  nimcRequests: `${BASE_URL}/admin/nimc-requests`,
  nimcHistory: `${BASE_URL}/admin/nimc-history`,
  reports: `${BASE_URL}/admin/reports`,
  transactions: `${BASE_URL}/admin/transactions`,
};

const AdminControlScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    pendingNimc: 0,
    totalNimc: 0,
    totalSalesGB: 0,
    activeAgents: 0,
    targetMet: 0,
    reports: 0,
    transactions: 0,
  });

  const [supervisors, setSupervisors] = useState([]);

  useEffect(() => {
    fetchAdminControlData();
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
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data?.users)) return payload.data.users;
    return [];
  };

  const getCount = (payload, key) => {
    if (typeof payload?.count === "number") return payload.count;
    if (typeof payload?.total === "number") return payload.total;
    if (typeof payload?.data?.count === "number") return payload.data.count;
    if (typeof payload?.data?.total === "number") return payload.data.total;
    return getArray(payload, key).length;
  };

  const fetchAdminControlData = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      const results = await Promise.allSettled([
        axios.get(API_ENDPOINTS.dashboardStats, { headers }),
        axios.get(API_ENDPOINTS.users, { headers }),
        axios.get(API_ENDPOINTS.supervisors, { headers }),
        axios.get(API_ENDPOINTS.agents, { headers }),
        axios.get(API_ENDPOINTS.nimcRequests, { headers }),
        axios.get(API_ENDPOINTS.nimcHistory, { headers }),
        axios.get(API_ENDPOINTS.reports, { headers }),
        axios.get(API_ENDPOINTS.transactions, { headers }),
      ]);

      const dashboardRes =
        results[0].status === "fulfilled" ? results[0].value.data : {};
      const usersRes =
        results[1].status === "fulfilled" ? results[1].value.data : {};
      const supervisorsRes =
        results[2].status === "fulfilled" ? results[2].value.data : {};
      const agentsRes =
        results[3].status === "fulfilled" ? results[3].value.data : {};
      const nimcReqRes =
        results[4].status === "fulfilled" ? results[4].value.data : {};
      const nimcHistoryRes =
        results[5].status === "fulfilled" ? results[5].value.data : {};
      const reportsRes =
        results[6].status === "fulfilled" ? results[6].value.data : {};
      const txRes =
        results[7].status === "fulfilled" ? results[7].value.data : {};

      const users = getArray(usersRes, "users");
      const agents = getArray(agentsRes, "agents");
      const txList = getArray(txRes, "transactions");

      const liveSupervisors =
        getArray(supervisorsRes, "supervisors").length > 0
          ? getArray(supervisorsRes, "supervisors")
          : users.filter((user) => user?.role?.toLowerCase() === "supervisor");

      const normalizedSupervisors = liveSupervisors.map((item, index) => ({
        id: item?._id || item?.id || `${index}`,
        name:
          item?.name ||
          item?.fullName ||
          `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
          "Supervisor",
        email: item?.email || "",
        phone: item?.phone || "",
        totalAgents: item?.totalAgents || item?.agents?.length || 0,
        performance:
          item?.performance ||
          item?.targetPerformance ||
          item?.achievement ||
          "0%",
        totalGB:
          item?.totalGB ||
          item?.monthlyGB ||
          item?.volumeGB ||
          "0GB",
      }));

      setSupervisors(normalizedSupervisors);

      setStats({
        pendingNimc: getCount(nimcReqRes, "nimcRequests"),
        totalNimc: getCount(nimcHistoryRes, "nimcHistory"),
        totalSalesGB:
          dashboardRes?.data?.sales?.totalGB ||
          dashboardRes?.sales?.totalGB ||
          dashboardRes?.totalGB ||
          0,
        activeAgents:
          dashboardRes?.data?.users?.totalAgents ||
          dashboardRes?.users?.totalAgents ||
          agents.length ||
          users.filter((user) => user?.role?.toLowerCase() === "agent").length,
        targetMet:
          dashboardRes?.data?.targetMet ||
          dashboardRes?.targetMet ||
          0,
        reports: getCount(reportsRes, "reports"),
        transactions: getCount(txRes, "transactions") || txList.length,
      });
    } catch (error) {
      Alert.alert("Connection Error", "Failed to load live admin control data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminControlData();
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

    Alert.alert("Menu", "Drawer menu is not available on this navigator.");
  };

  const goBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("AdminDashboard");
  };

  const safeNavigate = (screenName, params = {}) => {
    try {
      navigation.navigate(screenName, {
        fromAdminControl: true,
        backScreen: "AdminUserControl",
        ...params,
      });
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

  const filteredSupervisors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return supervisors;

    return supervisors.filter((item) => {
      return (
        item?.name?.toLowerCase().includes(query) ||
        item?.email?.toLowerCase().includes(query) ||
        item?.phone?.toLowerCase().includes(query)
      );
    });
  }, [search, supervisors]);

  const controlCards = [
    {
      title: "Pending NIMC",
      value: stats.pendingNimc,
      subtitle: "Awaiting review",
      icon: "file-document-edit-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => safeNavigate("NIMCRequests"),
    },
    {
      title: "NIMC History",
      value: stats.totalNimc,
      subtitle: "Completed records",
      icon: "history",
      type: "mci",
      color: COLORS.secondary,
      action: () => safeNavigate("NIMCHistory"),
    },
    {
      title: "Active Agents",
      value: stats.activeAgents,
      subtitle: "Platform network",
      icon: "account-tie-outline",
      type: "mci",
      color: "#2563EB",
      action: () => safeNavigate("ManageAgents"),
    },
    {
      title: "Open Reports",
      value: stats.reports,
      subtitle: "Support issues",
      icon: "alert-circle-outline",
      type: "ion",
      color: COLORS.danger,
      action: () => safeNavigate("IssueResolution"),
    },
  ];

  const adminNavigation = [
    {
      title: "Admin Dashboard",
      subtitle: "Operations overview",
      icon: "view-dashboard-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => safeNavigate("AdminDashboard"),
    },
    {
      title: "User Management",
      subtitle: "Manage users and roles",
      icon: "account-group-outline",
      type: "mci",
      color: COLORS.secondary,
      action: () => safeNavigate("UserManagement"),
    },
    {
      title: "Create Supervisor",
      subtitle: "Add a new supervisor",
      icon: "account-plus-outline",
      type: "mci",
      color: "#2563EB",
      action: () => safeNavigate("CreateSupervisor"),
    },
    {
      title: "Manage Agents",
      subtitle: "Assign and monitor agents",
      icon: "account-tie-outline",
      type: "mci",
      color: "#7C3AED",
      action: () => safeNavigate("ManageAgents"),
    },
    {
      title: "Assign Targets",
      subtitle: "Set performance targets",
      icon: "target",
      type: "mci",
      color: "#B91C1C",
      action: () => safeNavigate("AssignTarget"),
    },
    {
      title: "Support Dashboard",
      subtitle: "Support operations center",
      icon: "headset",
      type: "mci",
      color: "#EA580C",
      action: () => safeNavigate("SupportDashboard"),
    },
    {
      title: "Transactions",
      subtitle: "Sales and activity logs",
      icon: "receipt-text-outline",
      type: "mci",
      color: "#15803D",
      action: () => safeNavigate("SalesHistory"),
    },
    {
      title: "Super Admin",
      subtitle: "Command center",
      icon: "shield-crown-outline",
      type: "mci",
      color: COLORS.dark,
      action: () => safeNavigate("SuperAdminDashboard"),
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
        <Text style={styles.loaderText}>Loading Admin Control...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={23} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
            <Ionicons name="menu" size={25} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Bellaj Global Control</Text>
            <Text style={styles.headerSubtitle}>Enterprise administration center</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#FCA5A5" />
          <TextInput
            placeholder="Search supervisor, email or phone..."
            placeholderTextColor="#FCA5A5"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
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
            <Text style={styles.heroTitle}>Admin Control Center</Text>
            <Text style={styles.heroText}>
              Monitor NIMC operations, supervisors, agents, targets and company-wide
              performance in real time.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchAdminControlData}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={[styles.cardGrid, isWeb && styles.webCardGrid]}>
          {controlCards.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.metricCard,
                { borderLeftColor: item.color },
                isWeb && styles.webMetricCard,
              ]}
              onPress={item.action}
              activeOpacity={0.86}
            >
              <View style={styles.metricTextBox}>
                <Text style={styles.metricTitle}>{item.title}</Text>
                <Text style={styles.metricValue}>{item.value}</Text>
                <Text style={styles.metricSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={[styles.metricIcon, { backgroundColor: item.color }]}>
                {renderIcon(item, 25, COLORS.white)}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.globalStatsCard}>
          <Text style={styles.cardLabel}>Company-Wide Sales Volume</Text>
          <Text style={styles.globalGB}>
            {Number(stats.totalSalesGB || 0).toLocaleString()} GB
          </Text>

          <View style={styles.statRow}>
            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Active Agents</Text>
              <Text style={styles.subStatValue}>{stats.activeAgents}</Text>
            </View>

            <View style={styles.vDivider} />

            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Target Met</Text>
              <Text style={styles.subStatValue}>{stats.targetMet}%</Text>
            </View>

            <View style={styles.vDivider} />

            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Transactions</Text>
              <Text style={styles.subStatValue}>{stats.transactions}</Text>
            </View>
          </View>
        </View>

        <View style={styles.navigationSection}>
          <Text style={styles.sectionTitle}>Admin Navigation</Text>

          <View style={[styles.navGrid, isWeb && styles.webNavGrid]}>
            {adminNavigation.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.navCard, isWeb && styles.webNavCard]}
                onPress={item.action}
                activeOpacity={0.86}
              >
                <View style={[styles.navIconBox, { backgroundColor: item.color }]}>
                  {renderIcon(item, 29, COLORS.white)}
                </View>

                <Text style={styles.navTitle}>{item.title}</Text>
                <Text style={styles.navSubtitle}>{item.subtitle}</Text>

                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>OPEN</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.secondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Supervisors Performance</Text>

          <TouchableOpacity
            style={styles.targetBtn}
            onPress={() => safeNavigate("AssignTarget")}
          >
            <MaterialCommunityIcons name="target" size={16} color={COLORS.white} />
            <Text style={styles.targetBtnText}>Set Targets</Text>
          </TouchableOpacity>
        </View>

        {filteredSupervisors.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="account-supervisor-outline"
              size={36}
              color={COLORS.muted}
            />
            <Text style={styles.emptyTitle}>No supervisors found</Text>
            <Text style={styles.emptyText}>
              Live supervisors will appear here once the backend returns data.
            </Text>
          </View>
        ) : (
          filteredSupervisors.map((sup) => (
            <TouchableOpacity
              key={sup.id}
              style={styles.supCard}
              onPress={() => safeNavigate("ManageAgents", { supervisorId: sup.id })}
              activeOpacity={0.86}
            >
              <View style={styles.supInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(sup.name || "S").charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.supTextBox}>
                  <Text style={styles.supName}>{sup.name}</Text>
                  <Text style={styles.supSubText}>
                    {sup.totalAgents} Agents Managed
                  </Text>
                  {!!sup.email && <Text style={styles.supContact}>{sup.email}</Text>}
                </View>
              </View>

              <View style={styles.supStats}>
                <View style={styles.perfBadge}>
                  <Text style={styles.perfText}>{sup.performance}</Text>
                </View>

                <Text style={styles.supGB}>{sup.totalGB}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={() => safeNavigate("CreateSupervisor")}
            activeOpacity={0.86}
          >
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={22}
              color={COLORS.white}
            />
            <Text style={styles.mainActionText}>Add New Supervisor</Text>
          </TouchableOpacity>
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
    paddingBottom: 20,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.white,
  },
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
  searchBar: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    color: COLORS.white,
    flex: 1,
    marginLeft: 8,
    fontWeight: "600",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    color: COLORS.dark,
    fontSize: 23,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 6,
    fontWeight: "600",
    lineHeight: 20,
    paddingRight: 12,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  cardGrid: {
    gap: 12,
    marginBottom: 16,
  },
  webCardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metricCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },
  webMetricCard: {
    width: "48.5%",
    minWidth: 280,
  },
  metricTextBox: {
    flex: 1,
  },
  metricTitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: COLORS.dark,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 5,
  },
  metricSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  metricIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  globalStatsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  globalGB: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.primary,
    marginVertical: 10,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 15,
  },
  subStatBox: {
    flex: 1,
    alignItems: "center",
  },
  subStatLabel: {
    fontSize: 10,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontWeight: "800",
  },
  subStatValue: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.secondary,
    marginTop: 3,
  },
  vDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  navigationSection: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
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
  navCard: {
    width: "48%",
    backgroundColor: COLORS.light,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 150,
  },
  webNavCard: {
    width: "23.5%",
    minWidth: 220,
  },
  navIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  navTitle: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "900",
  },
  navSubtitle: {
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
  },
  targetBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  targetBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 19,
  },
  supCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "900",
    color: COLORS.primary,
    fontSize: 18,
  },
  supTextBox: {
    marginLeft: 12,
    flex: 1,
  },
  supName: {
    fontWeight: "900",
    color: COLORS.dark,
    fontSize: 15,
  },
  supSubText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  supContact: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },
  supStats: {
    alignItems: "flex-end",
  },
  perfBadge: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 5,
  },
  perfText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "900",
  },
  supGB: {
    fontWeight: "900",
    color: COLORS.primary,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 30,
  },
  mainActionBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  mainActionText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 16,
  },
});

export default AdminControlScreen;