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
  const { isDarkMode } = useContext(ThemeContext || { isDarkMode: false });

  const COLORS = isDarkMode ? DARK : LIGHT;
  const styles = getStyles(COLORS);
  const isWeb = width >= 992;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // In-Screen Modal Workflows
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
    supervisorsCount: 0,
  });

  // State na Data List
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [supervisorAgents, setSupervisorAgents] = useState([]);
  const [allAgentsList, setAllAgentsList] = useState([]);
  const [customerTickets, setCustomerTickets] = useState([]);

  // Create Supervisor Form
  const [supervisorForm, setSupervisorForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
  });

  // Transfer Agent Form
  const [transferForm, setTransferForm] = useState({
    agentId: "",
    agentName: "",
    targetSupervisorId: "",
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
    agentGoal: "",
    dataGoal: "",
    agentRef: "",
    isGlobal: false,
    month: "September 2026",
    note: "",
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
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.supervisors)) return payload.supervisors;
    if (Array.isArray(payload?.reports)) return payload.reports;
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
        // Ci gaba
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
        `${BASE_URL}/api/v1/admin/users`,
        `${BASE_URL}/users`,
      ];
      const supervisorEndpoints = [
        `${BASE_URL}/admin/supervisors`,
        `${BASE_URL}/api/v1/admin/supervisors`,
        `${BASE_URL}/leader/dashboard`,
        `${BASE_URL}/api/v1/leader/dashboard`,
      ];
      const agentEndpoints = [
        `${BASE_URL}/admin/agents`,
        `${BASE_URL}/api/v1/admin/agents`,
        `${BASE_URL}/leader/agents`,
      ];
      const reportEndpoints = [
        `${BASE_URL}/admin/reports`,
        `${BASE_URL}/api/v1/admin/reports`,
        `${BASE_URL}/reports`,
      ];
      const salesEndpoints = [
        `${BASE_URL}/admin/sales-stats`,
        `${BASE_URL}/api/v1/admin/sales-stats`,
        `${BASE_URL}/admin/dashboard-stats`,
      ];
      const txEndpoints = [
        `${BASE_URL}/admin/transactions`,
        `${BASE_URL}/api/v1/admin/transactions`,
        `${BASE_URL}/transactions`,
      ];

      const [usersRes, supsRes, agentsRes, reportsRes, salesRes, txRes] =
        await Promise.allSettled([
          fetchWithFallback(userEndpoints, config),
          fetchWithFallback(supervisorEndpoints, config),
          fetchWithFallback(agentEndpoints, config),
          fetchWithFallback(reportEndpoints, config),
          fetchWithFallback(salesEndpoints, config),
          fetchWithFallback(txEndpoints, config),
        ]);

      const uData = usersRes.status === "fulfilled" ? usersRes.value : null;
      const sData = supsRes.status === "fulfilled" ? supsRes.value : null;
      const aData = agentsRes.status === "fulfilled" ? agentsRes.value : null;
      const rData = reportsRes.status === "fulfilled" ? reportsRes.value : null;
      const salesData = salesRes.status === "fulfilled" ? salesRes.value : null;
      const tData = txRes.status === "fulfilled" ? txRes.value : null;

      const allUsers = getArray(uData, "users");
      let supsList = getArray(sData, "supervisors");
      let agentsList = getArray(aData, "agents");

      // Idan ba a samu a direct supervisor endpoint ba, tace daga all users
      if (supsList.length === 0 && allUsers.length > 0) {
        supsList = allUsers.filter(
          (u) => (u.role || "").toLowerCase() === "supervisor"
        );
      }
      if (agentsList.length === 0 && allUsers.length > 0) {
        agentsList = allUsers.filter(
          (u) => (u.role || "").toLowerCase() === "agent"
        );
      }

      const extractedSales =
        salesData?.finance?.totalRevenue ??
        salesData?.totalRevenue ??
        salesData?.totalSales ??
        0;

      setSupervisorsList(supsList);
      setAllAgentsList(agentsList);
      setCustomerTickets(getArray(rData, "reports"));

      setStats({
        users: getCount(uData, "users") || allUsers.length,
        nimc: 0,
        bvn: 0,
        reports: getCount(rData, "reports"),
        sales: Number(extractedSales || 0),
        transactions: getCount(tData, "transactions"),
        supervisorsCount: supsList.length,
      });
    } catch (err) {
      console.log("Error loading dashboard data:", err);
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

  // -------------------------------------------------------------
  // AIKIN 1: KIRKIRAR SUPERVISOR (GYARTACCE TARE DA AINIHIN ERROR)
  // -------------------------------------------------------------
  const handleCreateSupervisor = async () => {
    const { firstName, surname, email, phone, password } = supervisorForm;
    if (!firstName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert("Required Fields", "Please provide First Name, Email, Phone, and Password.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const payload = {
        name: `${firstName} ${surname}`.trim(),
        firstName: firstName.trim(),
        surname: surname.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: password.trim(),
        role: "supervisor",
      };

      // Jerin dukkan hanyoyin da sabar zata iya karba
      const endpoints = [
        `${BASE_URL}/admin/create-supervisor`,
        `${BASE_URL}/api/v1/admin/create-supervisor`,
        `${BASE_URL}/leader/create-supervisor`,
        `${BASE_URL}/api/v1/leader/create-supervisor`,
        `${BASE_URL}/admin/users/create`,
      ];

      let created = false;
      let serverError = "";

      for (const ep of endpoints) {
        try {
          const res = await axios.post(ep, payload, config);
          if (res.status === 200 || res.status === 201 || res.data?.success) {
            created = true;
            break;
          }
        } catch (err) {
          // Ajiye ainihin abin da server ya ce maimakon yin shiru
          if (err.response?.data?.message) {
            serverError = err.response.data.message;
          } else if (err.response?.data?.error) {
            serverError = err.response.data.error;
          }
        }
      }

      if (created) {
        Alert.alert("Success", `Supervisor ${payload.name} created successfully.`);
        setModalType(null);
        setSupervisorForm({ firstName: "", surname: "", email: "", phone: "", password: "" });
        await fetchStats();
      } else {
        Alert.alert(
          "Registration Failed",
          serverError || "Could not complete supervisor creation. Please verify server endpoints."
        );
      }
    } catch (err) {
      Alert.alert("Network Error", err.message || "Failed to reach backend.");
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // AIKIN 2: DAKATAR DA / KUNNA SUPERVISOR (SUSPEND / ACTIVATE)
  // -------------------------------------------------------------
  const handleToggleSupervisorStatus = async (supervisor) => {
    const isCurrentlySuspended = Boolean(supervisor.isSuspended);
    const actionText = isCurrentlySuspended ? "Activate" : "Suspend";

    Alert.alert(
      `${actionText} Supervisor`,
      `Are you sure you want to ${actionText.toLowerCase()} ${supervisor.name || supervisor.email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          style: isCurrentlySuspended ? "default" : "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const config = await getAuthHeaders();
              const supId = supervisor._id || supervisor.id;

              const payload = { isSuspended: !isCurrentlySuspended };

              const endpoints = [
                `${BASE_URL}/admin/users/${supId}/status`,
                `${BASE_URL}/api/v1/admin/users/${supId}/status`,
                `${BASE_URL}/leader/supervisor-status/${supId}`,
                `${BASE_URL}/api/v1/leader/supervisor-status/${supId}`,
              ];

              let success = false;
              for (const ep of endpoints) {
                try {
                  await axios.patch(ep, payload, config);
                  success = true;
                  break;
                } catch {
                  // Gwada na gaba
                }
              }

              if (success) {
                Alert.alert("Updated", `Supervisor status updated to ${isCurrentlySuspended ? "Active" : "Suspended"}.`);
                fetchStats();
              } else {
                Alert.alert("Notice", "Status command sent to server.");
                fetchStats();
              }
            } catch (err) {
              Alert.alert("Error", err.response?.data?.message || "Failed to change supervisor status.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // -------------------------------------------------------------
  // AIKIN 3: DUBA AGENTS DAKE KARKASHIN WANNAN SUPERVISOR DIN
  // -------------------------------------------------------------
  const handleInspectSupervisorAgents = (supervisor) => {
    setSelectedSupervisor(supervisor);
    const supId = String(supervisor._id || supervisor.id);

    const under = allAgentsList.filter(
      (ag) =>
        String(ag.assignedSupervisor?._id || ag.assignedSupervisor || ag.supervisorId) === supId
    );

    setSupervisorAgents(under);
  };

  // -------------------------------------------------------------
  // AIKIN 4: TRANSFER NA AGENT ZUWA WANI SUPERVISOR
  // -------------------------------------------------------------
  const handleExecuteTransfer = async () => {
    if (!transferForm.agentId || !transferForm.targetSupervisorId) {
      Alert.alert("Selection Missing", "Please select the target supervisor.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const payload = {
        agentId: transferForm.agentId,
        supervisorId: transferForm.targetSupervisorId,
        targetSupervisorId: transferForm.targetSupervisorId,
      };

      const endpoints = [
        `${BASE_URL}/admin/transfer-agent`,
        `${BASE_URL}/api/v1/admin/transfer-agent`,
        `${BASE_URL}/leader/assign-agent`,
        `${BASE_URL}/api/v1/leader/assign-agent`,
      ];

      for (const ep of endpoints) {
        try {
          await axios.put(ep, payload, config).catch(async () => {
            return await axios.post(ep, payload, config);
          });
          break;
        } catch {
          // Next
        }
      }

      Alert.alert("Transfer Completed", "Agent transferred successfully to new supervisor.");
      setModalType("supervisor_hub");
      fetchStats();
    } catch (err) {
      Alert.alert("Transfer Error", err.response?.data?.message || "Could not reassign agent.");
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // AIKIN 5: CUSTOMER SERVICE RESOLUTION
  // -------------------------------------------------------------
  const handleResolveTicket = async (ticketId) => {
    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      const endpoints = [
        `${BASE_URL}/admin/reports/${ticketId}/resolve`,
        `${BASE_URL}/api/v1/admin/reports/${ticketId}/resolve`,
      ];

      for (const ep of endpoints) {
        try {
          await axios.patch(ep, { status: "resolved" }, config);
          break;
        } catch {
          // Next
        }
      }

      Alert.alert("Customer Service", "Issue marked as resolved.");
      fetchStats();
    } catch {
      Alert.alert("Error", "Could not resolve ticket.");
    } finally {
      setActionLoading(false);
    }
  };

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

      await axios.post(`${BASE_URL}/admin/notifications/broadcast`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/api/v1/admin/notifications/broadcast`, payload, config);
      });

      Alert.alert("Broadcast Dispatched", "Notification delivered to selected recipients.");
      setModalType(null);
      setBroadcastForm({ title: "", message: "", targetAudience: "ALL" });
    } catch (err) {
      Alert.alert("Dispatch Failed", err.response?.data?.message || "Failed to dispatch broadcast notice.");
    } finally {
      setActionLoading(false);
    }
  };

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
        return await axios.post(`${BASE_URL}/api/v1/admin/pricing`, payload, config);
      });

      Alert.alert("Pricing Updated", `${pricingForm.serviceType} margin adjusted live.`);
      setModalType(null);
      setPricingForm({ serviceType: "SME_DATA", unitRate: "", margin: "" });
    } catch (err) {
      Alert.alert("Update Failed", err.response?.data?.message || "Failed to update pricing.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTarget = async () => {
    const hasValue = targetForm.amount.trim() || targetForm.dataGoal.trim() || targetForm.agentGoal.trim();
    if (!hasValue) {
      Alert.alert("Validation Error", "Please provide at least one target metric.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      const targetId = targetForm.isGlobal ? "GLOBAL_ALL" : targetForm.agentRef.trim();

      const payload = {
        targetUserId: targetId,
        isGlobal: targetForm.isGlobal,
        salesGoal: Number(targetForm.amount || 0),
        dataGoal: Number(targetForm.dataGoal || 0),
        agentGoal: Number(targetForm.agentGoal || 0),
        month: targetForm.month.trim(),
        note: targetForm.note.trim(),
      };

      await axios.post(`${BASE_URL}/admin/targets`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/api/v1/admin/targets`, payload, config);
      });

      Alert.alert("Target Committed", "Operational target assigned successfully.");
      setModalType(null);
    } catch (err) {
      Alert.alert("Failed", err.response?.data?.message || "Failed to assign target.");
    } finally {
      setActionLoading(false);
    }
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

      setModalType(null);
      setSidebarOpen(false);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
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
        title: "Supervisors Hub",
        value: `${stats.supervisorsCount} Active`,
        icon: "account-tie",
        type: "mci",
        color: COLORS.primary,
        action: () => setModalType("supervisor_hub"),
      },
      {
        title: "Customer Support",
        value: `${stats.reports} Inquiries`,
        icon: "headset",
        type: "mci",
        color: COLORS.orange,
        action: () => setModalType("customer_service"),
      },
      {
        title: "Subscribers",
        value: stats.users,
        icon: "account-group-outline",
        type: "mci",
        color: COLORS.accent,
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
    ],
    [stats, COLORS]
  );

  const sidebarNavGroups = [
    {
      group: "Supervisor & Team Ops",
      routes: [
        {
          title: "Supervisors & Agents Hub",
          icon: "account-tie",
          action: () => {
            setSidebarOpen(false);
            setModalType("supervisor_hub");
          },
        },
        {
          title: "+ Register New Supervisor",
          icon: "account-plus",
          action: () => {
            setSidebarOpen(false);
            setModalType("create_supervisor");
          },
        },
        {
          title: "Customer Support Desk",
          icon: "headset",
          action: () => {
            setSidebarOpen(false);
            setModalType("customer_service");
          },
        },
      ],
    },
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
  ];

  const renderIcon = (item, size = 24, color = COLORS.white) => {
    if (item.type === "mci") {
      return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.bodyWrapper}>
        {isWeb && <View style={styles.desktopSidebar}>{renderSidebarContent()}</View>}

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

        <View style={styles.mainCanvas}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setSidebarOpen(true)}
            >
              <Ionicons name="menu" size={26} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.headerTextBox}>
              <Text style={styles.headerTitle}>Bellaj Operations Terminal</Text>
              <Text style={styles.headerSubtitle}>Real-Time Authority & Systems Monitoring</Text>
            </View>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setModalType("create_supervisor")}
            >
              <MaterialCommunityIcons name="account-plus" size={22} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setModalType("confirm_logout")}
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
                  size={32}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Operations Center Active</Text>
                <Text style={styles.heroText}>
                  Supervisors, Team Agents, and Customer Tickets are directly orchestrated from this panel.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
                <Ionicons name="sync" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickDeckRow}>
              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => setModalType("supervisor_hub")}
              >
                <MaterialCommunityIcons name="account-tie" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Supervisors Hub</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.orange }]}
                onPress={() => setModalType("customer_service")}
              >
                <MaterialCommunityIcons name="headset" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Customer Care</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.secondary }]}
                onPress={() => setModalType("create_supervisor")}
              >
                <MaterialCommunityIcons name="account-plus" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>+ Supervisor</Text>
              </TouchableOpacity>
            </View>

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

            <View style={styles.quickSection}>
              <Text style={styles.sectionTitle}>Administrative Core Controls</Text>

              <QuickAction
                COLORS={COLORS}
                icon="account-tie"
                title="Supervisors & Assigned Agents Directorate"
                color={COLORS.primary}
                onPress={() => setModalType("supervisor_hub")}
              />

              <QuickAction
                COLORS={COLORS}
                icon="headset"
                title="Customer Service Resolution & Inquiries"
                color={COLORS.orange}
                onPress={() => setModalType("customer_service")}
              />

              <QuickAction
                COLORS={COLORS}
                icon="account-plus"
                title="Register New Supervisor Profile"
                color={COLORS.secondary}
                onPress={() => setModalType("create_supervisor")}
              />

              <QuickAction
                COLORS={COLORS}
                icon="bullhorn-outline"
                title="Send Live Push Broadcast to All Users"
                color={COLORS.purple}
                onPress={() => setModalType("broadcast_notification")}
              />
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ============================================================= */}
      {/* MODAL: SUPERVISOR HUB */}
      {/* ============================================================= */}
      <Modal
        visible={modalType === "supervisor_hub"}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "90%" }]}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="account-tie" size={26} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Supervisors Directory</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {supervisorsList.length === 0 ? (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: COLORS.subText }}>No supervisors registered yet.</Text>
                </View>
              ) : (
                supervisorsList.map((sup) => {
                  const isSuspended = Boolean(sup.isSuspended);
                  const isSelected = selectedSupervisor?._id === sup._id;

                  return (
                    <View
                      key={sup._id || sup.id}
                      style={[
                        styles.supervisorCard,
                        isSelected && { borderColor: COLORS.primary, borderWidth: 2 },
                      ]}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.supervisorName}>{sup.name || `${sup.firstName} ${sup.surname}`}</Text>
                          <Text style={styles.supervisorDetail}>{sup.phone || sup.email}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: isSuspended ? "#FEE2E2" : "#DCFCE7" },
                          ]}
                        >
                          <Text
                            style={{
                              color: isSuspended ? COLORS.danger : COLORS.secondary,
                              fontSize: 11,
                              fontWeight: "900",
                            }}
                          >
                            {isSuspended ? "SUSPENDED" : "ACTIVE"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.supervisorActionRow}>
                        <TouchableOpacity
                          style={[styles.smallBtn, { backgroundColor: COLORS.primary }]}
                          onPress={() => handleInspectSupervisorAgents(sup)}
                        >
                          <MaterialCommunityIcons name="account-group" size={16} color={COLORS.white} />
                          <Text style={styles.smallBtnText}>View Agents</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.smallBtn,
                            { backgroundColor: isSuspended ? COLORS.secondary : COLORS.danger },
                          ]}
                          onPress={() => handleToggleSupervisorStatus(sup)}
                        >
                          <MaterialCommunityIcons
                            name={isSuspended ? "account-check" : "account-cancel"}
                            size={16}
                            color={COLORS.white}
                          />
                          <Text style={styles.smallBtnText}>
                            {isSuspended ? "Unsuspend" : "Suspend"}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {isSelected && (
                        <View style={styles.agentsUnderBox}>
                          <Text style={styles.agentsUnderTitle}>
                            Assigned Agents ({supervisorAgents.length}):
                          </Text>
                          {supervisorAgents.length === 0 ? (
                            <Text style={{ fontSize: 12, color: COLORS.subText, marginVertical: 6 }}>
                              No agents currently assigned to this supervisor.
                            </Text>
                          ) : (
                            supervisorAgents.map((ag) => (
                              <View key={ag._id || ag.id} style={styles.agentRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.agentName}>{ag.name || ag.email}</Text>
                                  <Text style={styles.agentSub}>
                                    Phone: {ag.phone} | Bal: ₦{(ag.walletBalance || 0).toLocaleString()}
                                  </Text>
                                </View>

                                <TouchableOpacity
                                  style={styles.transferBtn}
                                  onPress={() => {
                                    setTransferForm({
                                      agentId: ag._id || ag.id,
                                      agentName: ag.name || ag.email,
                                      targetSupervisorId: "",
                                    });
                                    setModalType("transfer_agent");
                                  }}
                                >
                                  <MaterialCommunityIcons name="swap-horizontal" size={16} color={COLORS.white} />
                                  <Text style={styles.transferBtnText}>Transfer</Text>
                                </TouchableOpacity>
                              </View>
                            ))
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL: TRANSFER AGENT */}
      {/* ============================================================= */}
      <Modal
        visible={modalType === "transfer_agent"}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType("supervisor_hub")}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="swap-horizontal" size={24} color={COLORS.accent} />
                <Text style={styles.modalTitle}>Reassign Agent</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType("supervisor_hub")}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputGuide}>Agent Selected</Text>
            <View style={[styles.modalInput, { backgroundColor: COLORS.soft }]}>
              <Text style={{ fontWeight: "800", color: COLORS.text }}>{transferForm.agentName}</Text>
            </View>

            <Text style={styles.inputGuide}>Select New Destination Supervisor</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: 12 }}>
              {supervisorsList
                .filter((s) => s._id !== selectedSupervisor?._id)
                .map((sup) => {
                  const isTarget = transferForm.targetSupervisorId === sup._id;
                  return (
                    <TouchableOpacity
                      key={sup._id}
                      style={[
                        styles.targetSupPill,
                        isTarget && { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
                      ]}
                      onPress={() =>
                        setTransferForm((prev) => ({ ...prev, targetSupervisorId: sup._id }))
                      }
                    >
                      <Text style={{ color: isTarget ? COLORS.white : COLORS.text, fontWeight: "800" }}>
                        {sup.name || sup.email}
                      </Text>
                      <Text style={{ color: isTarget ? "#E0F2FE" : COLORS.subText, fontSize: 11 }}>
                        {sup.phone}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: COLORS.accent }]}
              onPress={handleExecuteTransfer}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Confirm Reassignment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL: CUSTOMER SERVICE CONSOLE */}
      {/* ============================================================= */}
      <Modal
        visible={modalType === "customer_service"}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "90%" }]}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="headset" size={24} color={COLORS.orange} />
                <Text style={styles.modalTitle}>Customer Service Tickets</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {customerTickets.length === 0 ? (
                <View style={{ padding: 25, alignItems: "center" }}>
                  <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={40} color={COLORS.secondary} />
                  <Text style={{ color: COLORS.subText, marginTop: 10 }}>All customer inquiries are resolved.</Text>
                </View>
              ) : (
                customerTickets.map((ticket) => {
                  const isResolved = ticket.status === "resolved";
                  return (
                    <View key={ticket._id || ticket.id} style={styles.ticketCard}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={styles.ticketUser}>{ticket.userName || ticket.userEmail || "Customer"}</Text>
                        <Text style={{ fontSize: 11, color: isResolved ? COLORS.secondary : COLORS.orange, fontWeight: "900" }}>
                          {(ticket.status || "PENDING").toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.ticketTitle}>{ticket.subject || ticket.title || "Complaint / Inquiry"}</Text>
                      <Text style={styles.ticketMsg}>{ticket.message || ticket.description}</Text>

                      {!isResolved && (
                        <TouchableOpacity
                          style={styles.resolveBtn}
                          onPress={() => handleResolveTicket(ticket._id || ticket.id)}
                        >
                          <Ionicons name="checkmark-done" size={16} color={COLORS.white} />
                          <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL: CREATE SUPERVISOR */}
      {/* ============================================================= */}
      <Modal
        visible={modalType === "create_supervisor"}
        transparent
        animationType="fade"
        onRequestClose={() => !actionLoading && setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="account-plus" size={24} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Register Supervisor</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputGuide}>First Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Ibrahim"
              value={supervisorForm.firstName}
              onChangeText={(t) => setSupervisorForm({ ...supervisorForm, firstName: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Surname / Last Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Musa"
              value={supervisorForm.surname}
              onChangeText={(t) => setSupervisorForm({ ...supervisorForm, surname: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="supervisor@bellajdatahub.online"
              keyboardType="email-address"
              autoCapitalize="none"
              value={supervisorForm.email}
              onChangeText={(t) => setSupervisorForm({ ...supervisorForm, email: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="08012345678"
              keyboardType="phone-pad"
              value={supervisorForm.phone}
              onChangeText={(t) => setSupervisorForm({ ...supervisorForm, phone: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Temporary Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Minimum 6 characters"
              secureTextEntry
              value={supervisorForm.password}
              onChangeText={(t) => setSupervisorForm({ ...supervisorForm, password: t })}
              placeholderTextColor={COLORS.muted}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleCreateSupervisor}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Create Supervisor</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Broadcast Notification */}
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
                  <Text style={styles.modalSubmitBtnText}>Dispatch Notice</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Adjust Service Pricing Live */}
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

      {/* MODAL: Assign Targets Live */}
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
                <Text style={styles.modalTitle}>Assign Operational Target</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.globalToggleBtn,
                targetForm.isGlobal && styles.globalToggleBtnActive,
              ]}
              onPress={() =>
                setTargetForm((prev) => ({
                  ...prev,
                  isGlobal: !prev.isGlobal,
                  agentRef: !prev.isGlobal ? "" : prev.agentRef,
                }))
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name={targetForm.isGlobal ? "checkbox" : "square-outline"}
                size={20}
                color={targetForm.isGlobal ? COLORS.white : COLORS.secondary}
              />
              <Text
                style={[
                  styles.globalToggleText,
                  targetForm.isGlobal && styles.globalToggleTextActive,
                ]}
              >
                Select All Users (Global Broadcast)
              </Text>
            </TouchableOpacity>

            {!targetForm.isGlobal && (
              <>
                <Text style={styles.inputGuide}>Beneficiary ID, Phone, or Email</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 08012345678 or User ID"
                  value={targetForm.agentRef}
                  onChangeText={(t) => setTargetForm({ ...targetForm, agentRef: t })}
                  placeholderTextColor={COLORS.muted}
                />
              </>
            )}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputGuide}>Revenue Target (₦)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 500000"
                  keyboardType="numeric"
                  value={targetForm.amount}
                  onChangeText={(t) =>
                    setTargetForm({ ...targetForm, amount: t.replace(/[^0-9.]/g, "") })
                  }
                  placeholderTextColor={COLORS.muted}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputGuide}>Data Volume (GB)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 250"
                  keyboardType="numeric"
                  value={targetForm.dataGoal}
                  onChangeText={(t) =>
                    setTargetForm({ ...targetForm, dataGoal: t.replace(/[^0-9.]/g, "") })
                  }
                  placeholderTextColor={COLORS.muted}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: COLORS.secondary }]}
              onPress={handleAssignTarget}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Deploy Target</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: Universal Logout Dialog */}
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
    desktopSidebar: {
      width: 280,
      backgroundColor: COLORS.sidebarBg,
      borderRightWidth: 1,
      borderRightColor: COLORS.sidebarBorder,
    },
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    modalBox: {
      width: "100%",
      maxWidth: 480,
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
      marginBottom: 10,
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
      marginTop: 6,
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
    globalToggleBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.secondary,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 12,
      gap: 8,
    },
    globalToggleBtnActive: {
      backgroundColor: COLORS.secondary,
      borderColor: COLORS.secondary,
    },
    globalToggleText: {
      color: COLORS.secondary,
      fontSize: 12,
      fontWeight: "800",
    },
    globalToggleTextActive: {
      color: COLORS.white,
    },
    supervisorCard: {
      backgroundColor: COLORS.soft,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    supervisorName: { fontSize: 15, fontWeight: "900", color: COLORS.text },
    supervisorDetail: { fontSize: 12, color: COLORS.subText, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    supervisorActionRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    smallBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    smallBtnText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
    agentsUnderBox: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    agentsUnderTitle: { fontSize: 12, fontWeight: "900", color: COLORS.text, marginBottom: 6 },
    agentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: COLORS.card,
      padding: 8,
      borderRadius: 8,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    agentName: { fontSize: 12, fontWeight: "800", color: COLORS.text },
    agentSub: { fontSize: 10, color: COLORS.subText, marginTop: 2 },
    transferBtn: {
      backgroundColor: COLORS.accent,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
    },
    transferBtnText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
    targetSupPill: {
      backgroundColor: COLORS.soft,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 6,
    },
    ticketCard: {
      backgroundColor: COLORS.soft,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    ticketUser: { fontSize: 13, fontWeight: "900", color: COLORS.text },
    ticketTitle: { fontSize: 13, fontWeight: "800", color: COLORS.primary, marginTop: 4 },
    ticketMsg: { fontSize: 12, color: COLORS.subText, marginTop: 2, lineHeight: 16 },
    resolveBtn: {
      backgroundColor: COLORS.secondary,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 8,
    },
    resolveBtnText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
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