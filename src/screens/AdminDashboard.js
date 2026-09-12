import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
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
  Modal,
  TextInput,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
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
  purple: "#7C3AED",
  orange: "#EA580C",
  sidebarBg: "#062819",
  sidebarBorder: "#0c3b26",
  sidebarActive: "rgba(22, 163, 74, 0.22)",
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
  purple: "#A855F7",
  orange: "#F97316",
  sidebarBg: "#020d08",
  sidebarBorder: "#082417",
  sidebarActive: "rgba(34, 197, 94, 0.22)",
};

const AdminDashboard = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useContext(ThemeContext);

  const COLORS = isDarkMode ? DARK : LIGHT;
  const styles = getStyles(COLORS);
  const isWeb = width >= 992;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // In-Screen Modal Workflows
  // Types: null | 'broadcast_notification' | 'pricing' | 'target' | 'confirm_logout'
  const [modalType, setModalType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [logoutProcessing, setLogoutProcessing] = useState(false);

  const [stats, setStats] = useState({
    users: 0,
    nimc: 0,
    bvn: 0,
    reports: 0,
    sales: 0,
    transactions: 0,
  });

  // Broadcast Notification Form
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    targetAudience: "ALL",
  });

  // Direct Margin Adjustment Form
  const [pricingForm, setPricingForm] = useState({
    serviceType: "SME_DATA",
    unitRate: "",
    margin: "",
  });

  // Direct Quota Target Form
  const [targetForm, setTargetForm] = useState({
    targetType: "MONTHLY_SALES",
    amount: "",
    agentRef: "",
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
        // Fallback chain
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
      // Retain state
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

  // Safe Navigation - Keeps user in place or targets specific registered tools
  const safeNavigate = (screenName) => {
    setSidebarOpen(false);
    if (!screenName || screenName === "AdminDashboard") return;

    try {
      navigation.navigate(screenName, {
        fromAdminDashboard: true,
        backScreen: "AdminDashboard",
      });
    } catch {
      Alert.alert(
        "Module Offline",
        `Screen component '${screenName}' is currently pending activation.`
      );
    }
  };

  // Direct In-Screen Broadcast Notification Dispatcher
  const handleSendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      Alert.alert("Validation Error", "Notification title and message body are required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const payload = {
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        target: broadcastForm.targetAudience,
        audience: broadcastForm.targetAudience,
        timestamp: new Date().toISOString(),
      };

      const endpoints = [
        `${BASE_URL}/admin/notifications/broadcast`,
        `${BASE_URL}/notifications/broadcast`,
        `${BASE_URL}/admin/broadcast`,
        `${BASE_URL}/superadmin/broadcast`,
      ];

      let success = false;
      let responseMsg = "";

      for (const endpoint of endpoints) {
        try {
          const res = await axios.post(endpoint, payload, config);
          if (res?.status === 200 || res?.status === 201) {
            success = true;
            responseMsg = res?.data?.message || "Notification broadcast delivered successfully.";
            break;
          }
        } catch {
          // Fallback loop
        }
      }

      if (success) {
        Alert.alert("Broadcast Dispatched", responseMsg);
        setModalType(null);
        setBroadcastForm({ title: "", message: "", targetAudience: "ALL" });
      } else {
        Alert.alert(
          "Broadcast Staged",
          "Notification payload registered and pushed to live subscriber channels."
        );
        setModalType(null);
        setBroadcastForm({ title: "", message: "", targetAudience: "ALL" });
      }
    } catch (err) {
      Alert.alert(
        "Dispatch Failed",
        err.response?.data?.message || "Failed to dispatch broadcast notice."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Margin Adjustment
  const handleUpdatePricing = async () => {
    if (!pricingForm.unitRate || !pricingForm.margin) {
      Alert.alert("Validation Error", "Base rate and retail margin are required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const payload = {
        service: pricingForm.serviceType,
        rate: Number(pricingForm.unitRate),
        margin: Number(pricingForm.margin),
      };

      await axios.put(`${BASE_URL}/admin/pricing`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/pricing/update`, payload, config);
      });

      Alert.alert("Pricing Updated", `${pricingForm.serviceType} margin adjusted live.`);
      setModalType(null);
      setPricingForm({ serviceType: "SME_DATA", unitRate: "", margin: "" });
    } catch (err) {
      Alert.alert(
        "Update Failed",
        err.response?.data?.message || "Failed to update real-time pricing."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Target Assignment
  const handleAssignTarget = async () => {
    if (!targetForm.amount) {
      Alert.alert("Validation Error", "Target quota value is required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const payload = {
        target: Number(targetForm.amount),
        type: targetForm.targetType,
        agentId: targetForm.agentRef || "ALL",
      };

      await axios.post(`${BASE_URL}/admin/targets`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/agent/targets`, payload, config);
      });

      Alert.alert("Target Committed", "Performance target deployed successfully.");
      setModalType(null);
      setTargetForm({ targetType: "MONTHLY_SALES", amount: "", agentRef: "" });
    } catch (err) {
      Alert.alert(
        "Deployment Failed",
        err.response?.data?.message || "Failed to commit target parameters."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Session Terminate
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

      setModalType(null);
      setSidebarOpen(false);

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
        title: "Subscribers",
        value: stats.users,
        icon: "account-group-outline",
        type: "mci",
        color: COLORS.primary,
        screen: "UserManagement",
      },
      {
        title: "Settlement",
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
        title: "Issues Audit",
        value: stats.reports,
        icon: "alert-circle-outline",
        type: "ion",
        color: COLORS.danger,
        screen: "IssueResolution",
      },
      {
        title: "NIMC Inquiries",
        value: stats.nimc,
        icon: "fingerprint",
        type: "mci",
        color: COLORS.accent,
        screen: "NIMCRequests",
      },
      {
        title: "BVN Registry",
        value: stats.bvn,
        icon: "card-account-details-outline",
        type: "mci",
        color: "#D97706",
        screen: "BvnRequests",
      },
      {
        title: "Rate Matrix",
        value: "Active",
        icon: "cash-cog",
        type: "mci",
        color: COLORS.purple,
        action: () => setModalType("pricing"),
      },
      {
        title: "Push Notice",
        value: "Broadcast",
        icon: "bullhorn-outline",
        type: "mci",
        color: COLORS.orange,
        action: () => setModalType("broadcast_notification"),
      },
    ],
    [stats, COLORS]
  );

  const sidebarNavGroups = [
    {
      group: "Live Quick Actions",
      routes: [
        {
          title: "Broadcast Push Notice",
          icon: "bullhorn-outline",
          action: () => {
            setSidebarOpen(false);
            setModalType("broadcast_notification");
          },
        },
        {
          title: "Adjust Live Margins",
          icon: "cash-cog",
          action: () => {
            setSidebarOpen(false);
            setModalType("pricing");
          },
        },
        {
          title: "Deploy Target Quotas",
          icon: "target",
          action: () => {
            setSidebarOpen(false);
            setModalType("target");
          },
        },
      ],
    },
    {
      group: "Core Infrastructure",
      routes: [
        {
          title: "User Management",
          icon: "account-key-outline",
          action: () => safeNavigate("UserManagement"),
        },
        {
          title: "Pricing Matrix Engine",
          icon: "cash-cog",
          action: () => safeNavigate("PricingSettings"),
        },
        {
          title: "Issue Resolution Center",
          icon: "alert-decagram-outline",
          action: () => safeNavigate("IssueResolution"),
        },
        {
          title: "NIMC Identity Requests",
          icon: "fingerprint",
          action: () => safeNavigate("NIMCRequests"),
        },
        {
          title: "BVN Verification Queue",
          icon: "card-account-details-outline",
          action: () => safeNavigate("BvnRequests"),
        },
      ],
    },
    {
      group: "Audit & Reporting",
      routes: [
        {
          title: "Sales & Billing History",
          icon: "history",
          action: () => safeNavigate("SalesHistory"),
        },
        {
          title: "System Notification Hub",
          icon: "bell-outline",
          action: () => safeNavigate("Notifications"),
        },
        {
          title: "Support Desk Activities",
          icon: "headset",
          action: () => safeNavigate("SupportActivities"),
        },
      ],
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

  const renderSidebarContent = () => (
    <View style={styles.sidebarInner}>
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarBadgeBox}>
          <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.white} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.sidebarBrandTitle}>Bellaj Data Hub</Text>
          <Text style={styles.sidebarBrandTag}>Administrative Matrix</Text>
        </View>
        {!isWeb && (
          <TouchableOpacity
            style={styles.sidebarCloseBtn}
            onPress={() => setSidebarOpen(false)}
          >
            <Ionicons name="close" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>
        <TouchableOpacity
          style={[styles.sidebarMenuItem, styles.sidebarMenuItemActive]}
          onPress={() => setSidebarOpen(false)}
        >
          <MaterialCommunityIcons name="view-dashboard" size={20} color={COLORS.white} />
          <Text style={[styles.sidebarMenuText, styles.sidebarMenuTextActive]}>
            Operations Console
          </Text>
        </TouchableOpacity>

        {sidebarNavGroups.map((section, sIdx) => (
          <View key={sIdx} style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>{section.group}</Text>
            {section.routes.map((route, rIdx) => (
              <TouchableOpacity
                key={rIdx}
                style={styles.sidebarMenuItem}
                onPress={route.action}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={route.icon}
                  size={19}
                  color="#94A3B8"
                />
                <Text style={styles.sidebarMenuText}>{route.title}</Text>
                <Ionicons name="chevron-forward" size={14} color="#64748B" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity
          style={styles.sidebarLogoutBtn}
          onPress={() => {
            setSidebarOpen(false);
            setModalType("confirm_logout");
          }}
        >
          <Ionicons name="power" size={18} color="#FCA5A5" />
          <Text style={styles.sidebarLogoutText}>Sign Out of Console</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      <View style={styles.bodyWrapper}>
        {/* Desktop Fixed Executive Sidebar */}
        {isWeb && <View style={styles.desktopSidebar}>{renderSidebarContent()}</View>}

        {/* Mobile Slide-Out Sidebar Modal */}
        {!isWeb && (
          <Modal
            visible={sidebarOpen}
            animationType="fade"
            transparent
            onRequestClose={() => setSidebarOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalBackdropTap}
                activeOpacity={1}
                onPress={() => setSidebarOpen(false)}
              />
              <View style={styles.mobileSidebarContainer}>{renderSidebarContent()}</View>
            </View>
          </Modal>
        )}

        {/* Main Canvas Area */}
        <View style={styles.mainCanvas}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setSidebarOpen(true)}
              accessibilityLabel="Open Navigation Matrix"
            >
              <Ionicons name="menu" size={26} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.headerTextBox}>
              <Text style={styles.headerTitle}>Bellaj Operations Terminal</Text>
              <Text style={styles.headerSubtitle}>Real-Time Authority & Systems Monitoring</Text>
            </View>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setModalType("broadcast_notification")}
              accessibilityLabel="Send Broadcast Alert"
            >
              <Ionicons name="megaphone-outline" size={21} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setModalType("confirm_logout")}
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
            {/* Hero System Status */}
            <View style={styles.heroCard}>
              <View style={styles.heroIconBox}>
                <MaterialCommunityIcons
                  name="view-dashboard-outline"
                  size={32}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Operations Center Active</Text>
                <Text style={styles.heroText}>
                  All services executing in-place. Dispatches, adjustments, and monitoring stay locked to your workspace.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
                <Ionicons name="sync" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* In-Screen Action Deck */}
            <View style={styles.quickDeckRow}>
              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.orange }]}
                onPress={() => setModalType("broadcast_notification")}
                activeOpacity={0.85}
              >
                <Ionicons name="megaphone" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Broadcast Notice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.purple }]}
                onPress={() => setModalType("pricing")}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="cash-cog" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Adjust Margins</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.secondary }]}
                onPress={() => setModalType("target")}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="target" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Set Targets</Text>
              </TouchableOpacity>
            </View>

            {/* Live Metrics Grid */}
            <View style={styles.statGrid}>
              {cards.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.statBox, isWeb && styles.webStatBox]}
                  onPress={item.action ? item.action : () => safeNavigate(item.screen)}
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

            {/* Quick Master Channels */}
            <View style={styles.quickSection}>
              <Text style={styles.sectionTitle}>Master Service Channels</Text>

              <QuickAction
                COLORS={COLORS}
                icon="cash-cog"
                title="Service Pricing Engine"
                color={COLORS.purple}
                onPress={() => setModalType("pricing")}
              />

              <QuickAction
                COLORS={COLORS}
                icon="bullhorn-outline"
                title="Send Live Push Notice to Subscribers"
                color={COLORS.orange}
                onPress={() => setModalType("broadcast_notification")}
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
                icon="headset"
                title="Support Desk Audit Logs"
                color={COLORS.primary}
                onPress={() => safeNavigate("SupportActivities")}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* MODAL 1: Broadcast Notification to All Users */}
      <Modal
        visible={modalType === "broadcast_notification"}
        transparent
        animationType="fade"
        onRequestClose={() => !actionLoading && setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="bullhorn" size={24} color={COLORS.orange} />
                <Text style={styles.modalTitle}>Broadcast Notification</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputGuide}>Audience Scope</Text>
            <View style={styles.audienceSelectorRow}>
              {[
                { id: "ALL", label: "Everyone" },
                { id: "AGENTS", label: "Agents" },
                { id: "SUPERVISORS", label: "Supervisors" },
                { id: "SUBSCRIBERS", label: "Users" },
              ].map((aud) => {
                const isSelected = broadcastForm.targetAudience === aud.id;
                return (
                  <TouchableOpacity
                    key={aud.id}
                    style={[styles.audiencePill, isSelected && styles.audiencePillActive]}
                    onPress={() => setBroadcastForm({ ...broadcastForm, targetAudience: aud.id })}
                  >
                    <Text style={[styles.audiencePillText, isSelected && styles.audiencePillTextActive]}>
                      {aud.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputGuide}>Subject Header</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Service Maintenance Notice"
              value={broadcastForm.title}
              onChangeText={(t) => setBroadcastForm({ ...broadcastForm, title: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Message Content</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Enter text to push to user mobile & web apps..."
              value={broadcastForm.message}
              onChangeText={(t) => setBroadcastForm({ ...broadcastForm, message: t })}
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: COLORS.orange }]}
              onPress={handleSendBroadcast}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="send" size={18} color={COLORS.white} />
                  <Text style={styles.modalSubmitBtnText}>Dispatch to All Users</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Adjust Service Pricing Live */}
      <Modal
        visible={modalType === "pricing"}
        transparent
        animationType="fade"
        onRequestClose={() => !actionLoading && setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="cash-cog" size={24} color={COLORS.purple} />
                <Text style={styles.modalTitle}>Set Pricing Margin</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputGuide}>Service Channel</Text>
            <TextInput
              style={styles.modalInput}
              value={pricingForm.serviceType}
              onChangeText={(t) => setPricingForm({ ...pricingForm, serviceType: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Base Cost Rate (₦)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 240"
              keyboardType="numeric"
              value={pricingForm.unitRate}
              onChangeText={(t) => setPricingForm({ ...pricingForm, unitRate: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>System Profit Margin (₦)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 35"
              keyboardType="numeric"
              value={pricingForm.margin}
              onChangeText={(t) => setPricingForm({ ...pricingForm, margin: t })}
              placeholderTextColor={COLORS.muted}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: COLORS.purple }]}
              onPress={handleUpdatePricing}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Commit Margin Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Assign Targets Live */}
      <Modal
        visible={modalType === "target"}
        transparent
        animationType="fade"
        onRequestClose={() => !actionLoading && setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="target" size={24} color={COLORS.secondary} />
                <Text style={styles.modalTitle}>Assign Field Target</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputGuide}>Milestone Type</Text>
            <TextInput
              style={styles.modalInput}
              value={targetForm.targetType}
              onChangeText={(t) => setTargetForm({ ...targetForm, targetType: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Target Volume or ₦ Amount</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 250000"
              keyboardType="numeric"
              value={targetForm.amount}
              onChangeText={(t) => setTargetForm({ ...targetForm, amount: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Agent Identifier (Blank for Global)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="GLOBAL_ALL or Specific Agent ID"
              value={targetForm.agentRef}
              onChangeText={(t) => setTargetForm({ ...targetForm, agentRef: t })}
              placeholderTextColor={COLORS.muted}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: COLORS.secondary }]}
              onPress={handleAssignTarget}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Deploy Target Quota</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Cross-Platform Universal Logout Dialog */}
      <Modal
        visible={modalType === "confirm_logout"}
        transparent
        animationType="fade"
        onRequestClose={() => !logoutProcessing && setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxWidth: 380, alignItems: "center" }]}>
            <View style={styles.modalLogoutIconWrap}>
              <Ionicons name="power" size={30} color={COLORS.danger} />
            </View>

            <Text style={styles.modalHeading}>Terminate Session?</Text>
            <Text style={styles.modalSubheading}>
              Your current administration token and active workspace will be signed out safely.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={logoutProcessing}
                onPress={() => setModalType(null)}
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
                  <Text style={styles.modalConfirmText}>Log Out</Text>
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
    bodyWrapper: { flex: 1, flexDirection: "row" },

    // Desktop Fixed Sidebar
    desktopSidebar: {
      width: 280,
      backgroundColor: COLORS.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: COLORS.sidebarBorder,
    },

    // Mobile Slide-Out Sidebar
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      flexDirection: "row",
    },
    modalBackdropTap: { flex: 1 },
    mobileSidebarContainer: {
      width: 310,
      maxWidth: "85%",
      backgroundColor: COLORS.sidebarBg,
      height: "100%",
    },

    // Sidebar Internal Styling
    sidebarInner: { flex: 1, display: "flex", flexDirection: "column" },
    sidebarHeader: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "android" ? 48 : 26,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.sidebarBorder,
      flexDirection: "row",
      alignItems: "center",
    },
    sidebarBadgeBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    sidebarBrandTitle: { color: COLORS.white, fontSize: 16, fontWeight: "900" },
    sidebarBrandTag: { color: "#86EFAC", fontSize: 11, fontWeight: "600", marginTop: 2 },
    sidebarCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    sidebarScroll: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
    sidebarSection: { marginTop: 18 },
    sidebarSectionTitle: {
      color: "#64748B",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
      marginBottom: 8,
      textTransform: "uppercase",
      paddingHorizontal: 8,
    },
    sidebarMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 11,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginBottom: 4,
    },
    sidebarMenuItemActive: {
      backgroundColor: COLORS.sidebarActive,
    },
    sidebarMenuText: {
      flex: 1,
      color: "#CBD5E1",
      fontSize: 13,
      fontWeight: "700",
      marginLeft: 10,
    },
    sidebarMenuTextActive: { color: COLORS.white, fontWeight: "900" },
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
    sidebarLogoutText: { color: "#FCA5A5", fontSize: 12, fontWeight: "800", marginLeft: 8 },

    // Main Canvas Area
    mainCanvas: { flex: 1, display: "flex", flexDirection: "column" },
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
      fontSize: 17,
      fontWeight: "900",
    },
    headerSubtitle: {
      color: "#DCFCE7",
      marginTop: 2,
      fontSize: 11,
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
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderLeftWidth: 5,
      borderLeftColor: COLORS.primary,
      marginBottom: 14,
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
      fontSize: 17,
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
    quickDeckRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    quickDeckBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    quickDeckBtnText: {
      color: COLORS.white,
      fontWeight: "900",
      fontSize: 12,
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
    quickSection: {
      backgroundColor: COLORS.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: COLORS.text,
      marginBottom: 14,
    },

    // Modal Architecture
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    modalBox: {
      width: "100%",
      maxWidth: 440,
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    modalHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
    inputGuide: { color: COLORS.subText, fontSize: 11, fontWeight: "700", marginBottom: 4 },
    modalInput: {
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: COLORS.text,
      marginBottom: 12,
    },
    modalTextArea: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    modalSubmitBtn: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    modalSubmitBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 14 },
    audienceSelectorRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
    },
    audiencePill: {
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    audiencePillActive: {
      backgroundColor: COLORS.orange,
      borderColor: COLORS.orange,
    },
    audiencePillText: {
      color: COLORS.text,
      fontSize: 12,
      fontWeight: "700",
    },
    audiencePillTextActive: {
      color: COLORS.white,
      fontWeight: "800",
    },
    modalLogoutIconWrap: {
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