import React, { useEffect, useMemo, useState, useRef } from "react";
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
  Animated,
  Modal,
  StatusBar,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FEE2E2",
  softGreen: "#DCFCE7",
  danger: "#DC2626",
  sidebarBg: "#052215",
  sidebarBorder: "#0A3D27",
  card: "#FFFFFF",
  soft: "#F1F5F9",
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

const AdminControlScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Tab Selection
  const [activeTab, setActiveTab] = useState("supervisors"); // 'supervisors' | 'all_users'

  // Sidebar Drawer Animation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarWidth = Math.min(width * 0.82, 340);
  const sidebarAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  // Selected User don Ayyukan Delete/Suspend
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);

  const [stats, setStats] = useState({
    pendingNimc: 0,
    totalNimc: 0,
    totalSalesGB: 0,
    activeAgents: 0,
    targetMet: 0,
    reports: 0,
    transactions: 0,
    totalUsersCount: 0,
  });

  const [supervisors, setSupervisors] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);

  useEffect(() => {
    fetchAdminControlData();
  }, []);

  const toggleSidebar = (open) => {
    if (open) {
      setSidebarOpen(true);
      Animated.spring(sidebarAnim, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: -sidebarWidth,
        duration: 220,
        useNativeDriver: false,
      }).start(() => setSidebarOpen(false));
    }
  };

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
      timeout: 30000,
    };
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
    if (Array.isArray(payload?.supervisors)) return payload.supervisors;
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

  const fetchAdminControlData = async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      const results = await Promise.allSettled([
        axios.get(API_ENDPOINTS.dashboardStats, config),
        axios.get(API_ENDPOINTS.users, config),
        axios.get(API_ENDPOINTS.supervisors, config),
        axios.get(API_ENDPOINTS.agents, config),
        axios.get(API_ENDPOINTS.nimcRequests, config),
        axios.get(API_ENDPOINTS.nimcHistory, config),
        axios.get(API_ENDPOINTS.reports, config),
        axios.get(API_ENDPOINTS.transactions, config),
      ]);

      const dashboardRes = results[0].status === "fulfilled" ? results[0].value.data : {};
      const usersRes = results[1].status === "fulfilled" ? results[1].value.data : {};
      const supervisorsRes = results[2].status === "fulfilled" ? results[2].value.data : {};
      const agentsRes = results[3].status === "fulfilled" ? results[3].value.data : {};
      const nimcReqRes = results[4].status === "fulfilled" ? results[4].value.data : {};
      const nimcHistoryRes = results[5].status === "fulfilled" ? results[5].value.data : {};
      const reportsRes = results[6].status === "fulfilled" ? results[6].value.data : {};
      const txRes = results[7].status === "fulfilled" ? results[7].value.data : {};

      const rawUsers = getArray(usersRes, "users");
      const rawAgents = getArray(agentsRes, "agents");
      const txList = getArray(txRes, "transactions");

      setAllUsersList(rawUsers);

      const liveSupervisors =
        getArray(supervisorsRes, "supervisors").length > 0
          ? getArray(supervisorsRes, "supervisors")
          : rawUsers.filter((user) => (user?.role || "").toLowerCase() === "supervisor");

      const normalizedSupervisors = liveSupervisors.map((item, index) => ({
        id: item?._id || item?.id || `${index}`,
        _id: item?._id || item?.id,
        name:
          item?.name ||
          item?.fullName ||
          `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
          "Supervisor",
        email: item?.email || "",
        phone: item?.phone || "",
        role: item?.role || "supervisor",
        isSuspended: Boolean(item?.isSuspended),
        totalAgents: item?.totalAgents || item?.agents?.length || 0,
        performance: item?.performance || item?.targetPerformance || item?.achievement || "0%",
        totalGB: item?.totalGB || item?.monthlyGB || item?.volumeGB || "0GB",
        walletBalance: item?.walletBalance || item?.balance || 0,
      }));

      setSupervisors(normalizedSupervisors);

      setStats({
        pendingNimc: getCount(nimcReqRes, "nimcRequests"),
        totalNimc: getCount(nimcHistoryRes, "nimcHistory"),
        totalSalesGB:
          dashboardRes?.data?.sales?.totalGB ||
          dashboardRes?.sales?.totalGB ||
          dashboardRes?.finance?.totalRevenue ||
          0,
        activeAgents:
          dashboardRes?.data?.users?.totalAgents ||
          rawAgents.length ||
          rawUsers.filter((u) => (u?.role || "").toLowerCase() === "agent").length,
        targetMet: dashboardRes?.data?.targetMet || dashboardRes?.targetMet || 0,
        reports: getCount(reportsRes, "reports"),
        transactions: getCount(txRes, "transactions") || txList.length,
        totalUsersCount: rawUsers.length,
      });
    } catch (error) {
      console.log("Error loading Admin Control Data:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminControlData();
  };

  // ==============================================================
  // 1. DAKATAR DA USER / UNSUSPEND USER (REAL-TIME LIVE SERVER)
  // ==============================================================
  const handleToggleUserSuspension = async (user) => {
    const userId = user._id || user.id;
    const isCurrentlySuspended = Boolean(user.isSuspended);
    const actionLabel = isCurrentlySuspended ? "Unsuspend (Kunna)" : "Suspend (Dakatar)";

    Alert.alert(
      `${actionLabel} Account`,
      `Are you sure you want to ${isCurrentlySuspended ? "activate" : "suspend"} ${user.name || user.email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionLabel,
          style: isCurrentlySuspended ? "default" : "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const config = await getAuthHeaders();
              const payload = { isSuspended: !isCurrentlySuspended };

              const endpoints = [
                `${BASE_URL}/admin/users/${userId}/status`,
                `${BASE_URL}/api/v1/admin/users/${userId}/status`,
                `${BASE_URL}/admin/suspend-user/${userId}`,
                `${BASE_URL}/api/v1/admin/suspend-user/${userId}`,
              ];

              let success = false;
              for (const ep of endpoints) {
                try {
                  await axios.patch(ep, payload, config).catch(async () => {
                    return await axios.put(ep, payload, config);
                  });
                  success = true;
                  break;
                } catch {
                  // Gwada na gaba
                }
              }

              if (success) {
                Alert.alert("Success", `User status updated to ${isCurrentlySuspended ? "Active" : "Suspended"}.`);
                setManageModalVisible(false);
                fetchAdminControlData();
              } else {
                Alert.alert("Notice", "Status command dispatched to server.");
                setManageModalVisible(false);
                fetchAdminControlData();
              }
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Failed to update suspension status.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ==============================================================
  // 2. GOGE USER HAR ABADA (PERMANENT DELETE FROM DATABASE)
  // ==============================================================
  const handlePermanentDeleteUser = (user) => {
    const userId = user._id || user.id;
    const userName = user.name || user.email;

    Alert.alert(
      "⚠️ PERMANENT DELETE (GOGEWA HAR ABADA)",
      `Shin ka tabbata kana son goge asusun "${userName}" daga database har abada? Wannan aikin ba za a iya dawo da shi ba!`,
      [
        { text: "A'a, Fasa (Cancel)", style: "cancel" },
        {
          text: "Goge Har Abada (DELETE)",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const config = await getAuthHeaders();

              const endpoints = [
                `${BASE_URL}/admin/users/${userId}`,
                `${BASE_URL}/api/v1/admin/users/${userId}`,
                `${BASE_URL}/admin/users/delete/${userId}`,
                `${BASE_URL}/api/v1/admin/users/delete/${userId}`,
              ];

              let deleted = false;
              let errMsg = "";

              for (const ep of endpoints) {
                try {
                  const res = await axios.delete(ep, config);
                  if (res.status === 200 || res.data?.success) {
                    deleted = true;
                    break;
                  }
                } catch (err) {
                  errMsg = err.response?.data?.message || err.message;
                }
              }

              if (deleted) {
                Alert.alert("Deleted Successfully", `Asusun "${userName}" an goge shi gaba ɗaya daga database.`);
                setManageModalVisible(false);
                fetchAdminControlData();
              } else {
                Alert.alert("Delete Failed", errMsg || "Could not delete user. Verify server route.");
              }
            } catch (err) {
              Alert.alert("Network Error", err.message || "Failed to reach server.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const goBack = () => {
    if (route?.params?.fromSuperAdmin || route?.params?.backScreen === "SuperAdminDashboard") {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Main", params: { screen: "SuperAdminDashboard" } }],
        })
      );
      return;
    }

    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("AdminDashboard");
  };

  const safeNavigate = (screenName, params = {}) => {
    toggleSidebar(false);
    try {
      navigation.navigate(screenName, {
        fromAdminControl: true,
        backScreen: "AdminControlScreen",
        ...params,
      });
    } catch {
      Alert.alert("Navigation Notice", `Screen '${screenName}' is pending activation.`);
    }
  };

  const logout = async () => {
    Alert.alert("Terminate Session", "Are you sure you want to sign out of Global Admin Control?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "adminToken",
            "token",
            "userData",
            "userRole",
            "overrideRole",
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

  const filteredAllUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allUsersList;

    return allUsersList.filter((item) => {
      const fullName = (item?.name || `${item?.firstName || ""} ${item?.surname || ""}`).toLowerCase();
      return (
        fullName.includes(query) ||
        (item?.email || "").toLowerCase().includes(query) ||
        (item?.phone || "").includes(query) ||
        (item?.role || "").toLowerCase().includes(query)
      );
    });
  }, [search, allUsersList]);

  const controlCards = [
    {
      title: "Pending NIMC",
      value: stats.pendingNimc,
      subtitle: "Awaiting review",
      icon: "fingerprint",
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
      subtitle: "Field network",
      icon: "account-tie-outline",
      type: "mci",
      color: "#2563EB",
      action: () => safeNavigate("ManageAgents"),
    },
    {
      title: "Open Reports",
      value: stats.reports,
      subtitle: "Support tickets",
      icon: "alert-circle-outline",
      type: "ion",
      color: COLORS.danger,
      action: () => safeNavigate("IssueResolution"),
    },
  ];

  const adminNavigation = [
    {
      title: "Operations Console",
      subtitle: "Executive overview",
      icon: "view-dashboard-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => safeNavigate("AdminDashboard"),
    },
    {
      title: "User Management",
      subtitle: "Manage roles & security",
      icon: "account-group-outline",
      type: "mci",
      color: COLORS.secondary,
      action: () => safeNavigate("UserManagement"),
    },
    {
      title: "+ Register Supervisor",
      subtitle: "Add new supervisor",
      icon: "account-plus-outline",
      type: "mci",
      color: "#2563EB",
      action: () => safeNavigate("CreateSupervisor"),
    },
    {
      title: "Manage Field Agents",
      subtitle: "Assign & transfer agents",
      icon: "account-tie-outline",
      type: "mci",
      color: "#7C3AED",
      action: () => safeNavigate("ManageAgents"),
    },
    {
      title: "Deploy Targets",
      subtitle: "Quotas & monthly sales",
      icon: "target",
      type: "mci",
      color: "#B91C1C",
      action: () => safeNavigate("AssignTarget"),
    },
    {
      title: "Customer Desk",
      subtitle: "Support tickets center",
      icon: "headset",
      type: "mci",
      color: "#EA580C",
      action: () => safeNavigate("SupportDashboard"),
    },
    {
      title: "Transactions",
      subtitle: "Sales and ledgers audit",
      icon: "receipt-text-outline",
      type: "mci",
      color: "#15803D",
      action: () => safeNavigate("SalesHistory"),
    },
    {
      title: "Super Admin",
      subtitle: "Command matrix",
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.secondary} />
        <Text style={styles.loaderText}>Establishing Secure Management Matrix...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconBtn} onPress={() => toggleSidebar(true)}>
            <Ionicons name="menu" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Bellaj Global Matrix</Text>
            <Text style={styles.headerSubtitle}>Corporate Governance & Authority Center</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="power" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#A7F3D0" />
          <TextInput
            placeholder="Search by name, email, phone or role..."
            placeholderTextColor="#A7F3D0"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#A7F3D0" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* TAB SELECTOR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "supervisors" && styles.tabBtnActive]}
          onPress={() => setActiveTab("supervisors")}
        >
          <MaterialCommunityIcons
            name="account-tie"
            size={16}
            color={activeTab === "supervisors" ? COLORS.primary : COLORS.muted}
          />
          <Text style={[styles.tabBtnText, activeTab === "supervisors" && styles.tabBtnTextActive]}>
            Supervisors ({filteredSupervisors.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "all_users" && styles.tabBtnActive]}
          onPress={() => setActiveTab("all_users")}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={16}
            color={activeTab === "all_users" ? COLORS.primary : COLORS.muted}
          />
          <Text style={[styles.tabBtnText, activeTab === "all_users" && styles.tabBtnTextActive]}>
            All Personnel ({filteredAllUsers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
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
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <MaterialCommunityIcons name="shield-account" size={30} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Operations Command Terminal</Text>
            <Text style={styles.heroText}>
              Total authority to manage, audit, suspend or permanently delete accounts with live real-time enforcement.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchAdminControlData}>
            <Ionicons name="sync" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* METRICS GRID */}
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
                {renderIcon(item, 24, COLORS.white)}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* GLOBAL STATS CARD */}
        <View style={styles.globalStatsCard}>
          <Text style={styles.cardLabel}>Company-Wide Operational Volume</Text>
          <Text style={styles.globalGB}>
            ₦{Number(stats.totalSalesGB || 0).toLocaleString()}
          </Text>

          <View style={styles.statRow}>
            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Active Agents</Text>
              <Text style={styles.subStatValue}>{stats.activeAgents}</Text>
            </View>

            <View style={styles.vDivider} />

            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Supervisors</Text>
              <Text style={styles.subStatValue}>{supervisors.length}</Text>
            </View>

            <View style={styles.vDivider} />

            <View style={styles.subStatBox}>
              <Text style={styles.subStatLabel}>Transactions</Text>
              <Text style={styles.subStatValue}>{stats.transactions}</Text>
            </View>
          </View>
        </View>

        {/* ADMIN NAVIGATION GRID */}
        <View style={styles.navigationSection}>
          <Text style={styles.sectionTitle}>Executive Management Directory</Text>

          <View style={[styles.navGrid, isWeb && styles.webNavGrid]}>
            {adminNavigation.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.navCard, isWeb && styles.webNavCard]}
                onPress={item.action}
                activeOpacity={0.86}
              >
                <View style={[styles.navIconBox, { backgroundColor: item.color }]}>
                  {renderIcon(item, 26, COLORS.white)}
                </View>

                <Text style={styles.navTitle}>{item.title}</Text>
                <Text style={styles.navSubtitle}>{item.subtitle}</Text>

                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>OPEN</Text>
                  <Ionicons name="chevron-forward" size={13} color={COLORS.secondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* TAB CONTENT: SUPERVISORS */}
        {activeTab === "supervisors" && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Supervisors Network Performance</Text>
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
                <Text style={styles.emptyTitle}>No Supervisors Found</Text>
                <Text style={styles.emptyText}>
                  No supervisor accounts matching your criteria were found.
                </Text>
              </View>
            ) : (
              filteredSupervisors.map((sup) => {
                const isSusp = Boolean(sup.isSuspended);
                return (
                  <View key={sup.id} style={styles.supCard}>
                    <View style={styles.supTopRow}>
                      <View style={styles.supInfo}>
                        <View style={[styles.avatar, { backgroundColor: isSusp ? COLORS.softRed : "#DCFCE7" }]}>
                          <Text style={[styles.avatarText, { color: isSusp ? COLORS.danger : COLORS.secondary }]}>
                            {(sup.name || "S").charAt(0).toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.supTextBox}>
                          <Text style={styles.supName}>{sup.name}</Text>
                          <Text style={styles.supSubText}>
                            {sup.totalAgents} Agents • Bal: ₦{(sup.walletBalance || 0).toLocaleString()}
                          </Text>
                          {!!sup.phone && <Text style={styles.supContact}>📞 {sup.phone}</Text>}
                          {!!sup.email && <Text style={styles.supContact}>✉️ {sup.email}</Text>}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: isSusp ? COLORS.softRed : COLORS.softGreen },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: isSusp ? COLORS.danger : COLORS.secondary },
                          ]}
                        >
                          {isSusp ? "SUSPENDED" : "ACTIVE"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.actionPill,
                          { backgroundColor: isSusp ? COLORS.softGreen : COLORS.softRed },
                        ]}
                        onPress={() => handleToggleUserSuspension(sup)}
                      >
                        <MaterialCommunityIcons
                          name={isSusp ? "account-check" : "account-cancel"}
                          size={15}
                          color={isSusp ? COLORS.secondary : COLORS.danger}
                        />
                        <Text
                          style={[
                            styles.actionPillText,
                            { color: isSusp ? COLORS.secondary : COLORS.danger },
                          ]}
                        >
                          {isSusp ? "Unsuspend" : "Suspend"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: COLORS.softRed }]}
                        onPress={() => handlePermanentDeleteUser(sup)}
                      >
                        <Ionicons name="trash-bin-outline" size={15} color={COLORS.danger} />
                        <Text style={[styles.actionPillText, { color: COLORS.danger }]}>Delete Forever</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB CONTENT: ALL USERS DIRECTORY */}
        {activeTab === "all_users" && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                All Personnel Directory ({filteredAllUsers.length})
              </Text>
            </View>

            {filteredAllUsers.length === 0 ? (
              <View style={styles.emptyBox}>
                <MaterialCommunityIcons name="account-search-outline" size={36} color={COLORS.muted} />
                <Text style={styles.emptyTitle}>No Accounts Match Search</Text>
              </View>
            ) : (
              filteredAllUsers.map((usr) => {
                const isSusp = Boolean(usr.isSuspended);
                const userName = usr.name || `${usr.firstName || ""} ${usr.surname || ""}`.trim() || "User";
                const roleStr = (usr.role || "user").toUpperCase();

                return (
                  <View key={usr._id || usr.id} style={styles.supCard}>
                    <View style={styles.supTopRow}>
                      <View style={styles.supInfo}>
                        <View style={[styles.avatar, { backgroundColor: isSusp ? COLORS.softRed : "#E0F2FE" }]}>
                          <Text style={[styles.avatarText, { color: isSusp ? COLORS.danger : "#0284C7" }]}>
                            {userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.supTextBox}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.supName}>{userName}</Text>
                            <View style={styles.roleTag}>
                              <Text style={styles.roleTagText}>{roleStr}</Text>
                            </View>
                          </View>
                          <Text style={styles.supContact}>✉️ {usr.email}</Text>
                          <Text style={styles.supContact}>📞 {usr.phone || "No Phone"}</Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: isSusp ? COLORS.softRed : COLORS.softGreen },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: isSusp ? COLORS.danger : COLORS.secondary },
                          ]}
                        >
                          {isSusp ? "SUSPENDED" : "ACTIVE"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.actionPill,
                          { backgroundColor: isSusp ? COLORS.softGreen : COLORS.softRed },
                        ]}
                        onPress={() => handleToggleUserSuspension(usr)}
                      >
                        <MaterialCommunityIcons
                          name={isSusp ? "account-check" : "account-cancel"}
                          size={15}
                          color={isSusp ? COLORS.secondary : COLORS.danger}
                        />
                        <Text
                          style={[
                            styles.actionPillText,
                            { color: isSusp ? COLORS.secondary : COLORS.danger },
                          ]}
                        >
                          {isSusp ? "Unsuspend Account" : "Suspend Account"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionPill, { backgroundColor: COLORS.softRed }]}
                        onPress={() => handlePermanentDeleteUser(usr)}
                      >
                        <Ionicons name="trash-bin-outline" size={15} color={COLORS.danger} />
                        <Text style={[styles.actionPillText, { color: COLORS.danger }]}>Delete Forever</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={() => safeNavigate("CreateSupervisor")}
            activeOpacity={0.86}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={22} color={COLORS.white} />
            <Text style={styles.mainActionText}>Add New Field Supervisor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ============================================================== */}
      {/* SIDEBAR DRAWER COMPONENT (MODERN, STYLED & ACTIVE) */}
      {/* ============================================================== */}
      {sidebarOpen && (
        <TouchableOpacity
          style={styles.sidebarBackdrop}
          activeOpacity={1}
          onPress={() => toggleSidebar(false)}
        >
          <Animated.View
            style={[
              styles.sidebarContainer,
              { width: sidebarWidth, transform: [{ translateX: sidebarAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* SIDEBAR HEADER */}
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarBrandRow}>
                <View style={styles.sidebarBadgeBox}>
                  <MaterialCommunityIcons name="shield-crown" size={24} color={COLORS.white} />
                </View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.sidebarBrandTitle}>Bellaj Data Hub</Text>
                  <Text style={styles.sidebarBrandTag}>Executive Command Center</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleSidebar(false)} style={styles.sidebarCloseBtn}>
                <Feather name="x" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* SIDEBAR NAVIGATION ITEMS */}
            <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.sidebarSectionTitle}>Core Governance</Text>

              <TouchableOpacity
                style={[styles.sidebarMenuItem, styles.sidebarMenuItemActive]}
                onPress={() => toggleSidebar(false)}
              >
                <MaterialCommunityIcons name="view-dashboard" size={20} color={COLORS.white} />
                <Text style={[styles.sidebarMenuText, styles.sidebarMenuTextActive]}>
                  Global Control Terminal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("AdminDashboard")}
              >
                <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Operations Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("UserManagement")}
              >
                <MaterialCommunityIcons name="account-group-outline" size={20} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>User Security & Roles</Text>
              </TouchableOpacity>

              <Text style={styles.sidebarSectionTitle}>Field & Teams Directorate</Text>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("CreateSupervisor")}
              >
                <MaterialCommunityIcons name="account-plus-outline" size={20} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Register New Supervisor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("ManageAgents")}
              >
                <MaterialCommunityIcons name="account-tie-outline" size={20} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Manage Field Agents</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("AssignTarget")}
              >
                <MaterialCommunityIcons name="target" size={20} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Assign Quota & Targets</Text>
              </TouchableOpacity>

              <Text style={styles.sidebarSectionTitle}>Audit & Settlement</Text>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("SalesHistory")}
              >
                <MaterialCommunityIcons name="receipt-text-outline" size={20} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Transactions & Sales</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("SupportDashboard")}
              >
                <MaterialCommunityIcons name="headset" size={20} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Customer Care Desk</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* SIDEBAR FOOTER */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.sidebarLogoutBtn} onPress={logout}>
                <Feather name="log-out" size={18} color="#FCA5A5" />
                <Text style={styles.sidebarLogoutText}>Sign Out of Command</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}
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
    paddingTop: Platform.OS === "android" ? 44 : 24,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.white,
  },
  headerSubtitle: {
    color: "#DCFCE7",
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    color: COLORS.white,
    flex: 1,
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 13,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 6,
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabBtnText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 90,
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
    fontSize: 13,
  },
  heroCard: {
    backgroundColor: COLORS.white,
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
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 4,
    fontWeight: "600",
    lineHeight: 18,
    fontSize: 11.5,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
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
    borderRadius: 16,
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
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  metricSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  metricIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  globalStatsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  globalGB: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    marginVertical: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
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
    fontSize: 16,
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
    borderRadius: 20,
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
    backgroundColor: COLORS.soft,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 140,
  },
  webNavCard: {
    width: "23.5%",
    minWidth: 220,
  },
  navIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  navTitle: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: "900",
  },
  navSubtitle: {
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 3,
  },
  openBadge: {
    marginTop: "auto",
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  openBadgeText: {
    color: COLORS.secondary,
    fontSize: 9.5,
    fontWeight: "900",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
  },
  targetBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  targetBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  supCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  supInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "900",
    fontSize: 16,
  },
  supTextBox: {
    marginLeft: 10,
    flex: 1,
  },
  supName: {
    fontWeight: "900",
    color: COLORS.dark,
    fontSize: 14,
  },
  roleTag: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: "900",
  },
  supSubText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  supContact: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "900",
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  mainActionBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  mainActionText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14.5,
  },

  // SIDEBAR STYLES
  sidebarBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    zIndex: 999,
  },
  sidebarContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.sidebarBg,
    paddingTop: Platform.OS === "android" ? 44 : 26,
    borderRightWidth: 1,
    borderRightColor: COLORS.sidebarBorder,
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sidebarBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sidebarBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sidebarBadgeBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarBrandTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },
  sidebarBrandTag: {
    color: "#86EFAC",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
  },
  sidebarCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sidebarScroll: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  sidebarSectionTitle: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 14,
    textTransform: "uppercase",
    paddingHorizontal: 6,
  },
  sidebarMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  sidebarMenuItemActive: {
    backgroundColor: "rgba(22, 163, 74, 0.22)",
  },
  sidebarMenuText: {
    color: "#CBD5E1",
    fontSize: 12.5,
    fontWeight: "700",
    marginLeft: 10,
  },
  sidebarMenuTextActive: {
    color: COLORS.white,
    fontWeight: "900",
  },
  sidebarFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.sidebarBorder,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sidebarLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(220, 38, 38, 0.16)",
  },
  sidebarLogoutText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },
});

export default AdminControlScreen;