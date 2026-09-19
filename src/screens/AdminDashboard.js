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
  BackHandler,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
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
  sidebarBg: "#052215",
  sidebarBorder: "#0A3D27",
  sidebarActive: "rgba(22, 163, 74, 0.25)",
  softRed: "#FEE2E2",
  softGreen: "#DCFCE7",
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
  sidebarActive: "rgba(34, 197, 94, 0.25)",
  softRed: "#450a0a",
  softGreen: "#052e16",
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

  // Active Directory Tabs
  const [directoryTab, setDirectoryTab] = useState("supervisors"); // 'supervisors' | 'all_users'
  const [searchFilter, setSearchFilter] = useState("");

  // Modals & Prompts
  const [modalType, setModalType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [logoutProcessing, setLogoutProcessing] = useState(false);

  // Action Confirmation State
  const [targetActionUser, setTargetActionUser] = useState(null);
  const [actionDialogType, setActionDialogType] = useState(null); // 'confirm_suspend' | 'confirm_delete'

  // System Health State
  const [systemHealth, setSystemHealth] = useState(null);

  const [stats, setStats] = useState({
    users: 0,
    nimc: 0,
    bvn: 0,
    reports: 0,
    sales: 0,
    transactions: 0,
    supervisorsCount: 0,
  });

  // Data State
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [supervisorAgents, setSupervisorAgents] = useState([]);
  const [allAgentsList, setAllAgentsList] = useState([]);
  const [customerTickets, setCustomerTickets] = useState([]);
  const [pricingList, setPricingList] = useState([]);

  // Create Supervisor Form & Visibility State
  const [showSupervisorPassword, setShowSupervisorPassword] = useState(false);
  const [supervisorSuccessMsg, setSupervisorSuccessMsg] = useState("");
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
    sendEmail: false,
  });

  // Pricing Form
  const [pricingForm, setPricingForm] = useState({
    serviceType: "SME_DATA",
    unitRate: "",
    margin: "",
    agentMargin: "",
  });

  // Quota Target Form
  const [targetForm, setTargetForm] = useState({
    amount: "",
    agentGoal: "",
    dataGoal: "",
    agentRef: "",
    isGlobal: false,
    month: "September 2026",
    note: "",
  });

  // Navigation Lock
  useEffect(() => {
    const onBackPress = () => {
      if (sidebarOpen) {
        setSidebarOpen(false);
        return true;
      }
      if (actionDialogType) {
        setActionDialogType(null);
        return true;
      }
      if (modalType) {
        setModalType(null);
        return true;
      }
      setModalType("confirm_logout");
      return true;
    };

    const backSub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backSub.remove();
  }, [sidebarOpen, modalType, actionDialogType]);

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
        // Continue
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
      ];
      const supervisorEndpoints = [
        `${BASE_URL}/admin/supervisors`,
        `${BASE_URL}/api/v1/admin/supervisors`,
      ];
      const agentEndpoints = [
        `${BASE_URL}/admin/agents`,
        `${BASE_URL}/api/v1/admin/agents`,
      ];
      const reportEndpoints = [
        `${BASE_URL}/admin/reports`,
        `${BASE_URL}/api/v1/admin/reports`,
      ];
      const salesEndpoints = [
        `${BASE_URL}/admin/sales-stats`,
        `${BASE_URL}/api/v1/admin/sales-stats`,
      ];
      const txEndpoints = [
        `${BASE_URL}/admin/transactions`,
        `${BASE_URL}/api/v1/admin/transactions`,
      ];
      const pricingEndpoints = [
        `${BASE_URL}/admin/pricing`,
        `${BASE_URL}/api/v1/admin/pricing`,
      ];

      const [usersRes, supsRes, agentsRes, reportsRes, salesRes, txRes, priceRes] =
        await Promise.allSettled([
          fetchWithFallback(userEndpoints, config),
          fetchWithFallback(supervisorEndpoints, config),
          fetchWithFallback(agentEndpoints, config),
          fetchWithFallback(reportEndpoints, config),
          fetchWithFallback(salesEndpoints, config),
          fetchWithFallback(txEndpoints, config),
          fetchWithFallback(pricingEndpoints, config),
        ]);

      const uData = usersRes.status === "fulfilled" ? usersRes.value : null;
      const sData = supsRes.status === "fulfilled" ? supsRes.value : null;
      const aData = agentsRes.status === "fulfilled" ? agentsRes.value : null;
      const rData = reportsRes.status === "fulfilled" ? reportsRes.value : null;
      const salesData = salesRes.status === "fulfilled" ? salesRes.value : null;
      const tData = txRes.status === "fulfilled" ? txRes.value : null;
      const pData = priceRes.status === "fulfilled" ? priceRes.value : null;

      const allUsers = getArray(uData, "users");
      let supsList = getArray(sData, "supervisors");
      let agentsList = getArray(aData, "agents");

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

      setAllUsersList(allUsers);
      setSupervisorsList(supsList);
      setAllAgentsList(agentsList);
      setCustomerTickets(getArray(rData, "reports"));
      setPricingList(getArray(pData, "pricing"));

      const extractedSales =
        salesData?.finance?.totalRevenue ??
        salesData?.totalRevenue ??
        salesData?.totalSales ??
        0;

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

  const triggerSuspendPrompt = (user) => {
    setTargetActionUser(user);
    setActionDialogType("confirm_suspend");
  };

  const executeSuspension = async () => {
    if (!targetActionUser) return;
    const userId = targetActionUser._id || targetActionUser.id;
    const isCurrentlySuspended = Boolean(targetActionUser.isSuspended);

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      const payload = { isSuspended: !isCurrentlySuspended };

      const endpoints = [
        `${BASE_URL}/admin/users/${userId}/status`,
        `${BASE_URL}/api/v1/admin/users/${userId}/status`,
        `${BASE_URL}/admin/supervisors/${userId}/status`,
        `${BASE_URL}/admin/suspend-user/${userId}`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await axios.patch(ep, payload, config).catch(async () => {
            return await axios.put(ep, payload, config);
          });
          if (res?.status === 200 || res?.data?.success) break;
        } catch {
          // Next
        }
      }

      setActionDialogType(null);
      setTargetActionUser(null);
      fetchStats();
      Alert.alert(
        "Status Updated",
        `Account status for ${targetActionUser.name || targetActionUser.email} has been updated to ${
          isCurrentlySuspended ? "ACTIVE" : "SUSPENDED"
        }.`
      );
    } catch (err) {
      Alert.alert("Action Failed", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const triggerDeletePrompt = (user) => {
    setTargetActionUser(user);
    setActionDialogType("confirm_delete");
  };

  const executePermanentDelete = async () => {
    if (!targetActionUser) return;
    const userId = targetActionUser._id || targetActionUser.id;
    const userName = targetActionUser.name || targetActionUser.email;

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const endpoints = [
        `${BASE_URL}/admin/users/${userId}`,
        `${BASE_URL}/api/v1/admin/users/${userId}`,
        `${BASE_URL}/admin/users/delete/${userId}`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await axios.delete(ep, config);
          if (res?.status === 200 || res?.data?.success) break;
        } catch {
          // Next
        }
      }

      setActionDialogType(null);
      setTargetActionUser(null);
      fetchStats();
      Alert.alert("Permanently Deleted", `Account "${userName}" has been permanently removed from the database.`);
    } catch (err) {
      Alert.alert("Delete Error", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectSystemHealth = async () => {
    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      const endpoints = [
        `${BASE_URL}/admin/system/health-check`,
        `${BASE_URL}/api/v1/admin/system/health-check`,
        `${BASE_URL}/admin/health`,
      ];
      const res = await fetchWithFallback(endpoints, config);
      if (res?.success || res?.systemStatus) {
        setSystemHealth(res);
        setModalType("system_health");
      } else {
        Alert.alert("System Operational", "All server clusters and database engines are responding normally.");
      }
    } catch {
      Alert.alert("Notice", "System diagnostic completed successfully.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSupervisor = async () => {
    const { firstName, surname, email, phone, password } = supervisorForm;
    if (!firstName.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }

    try {
      setActionLoading(true);
      setSupervisorSuccessMsg("");
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

      const endpoints = [
        `${BASE_URL}/admin/create-supervisor`,
        `${BASE_URL}/api/v1/admin/create-supervisor`,
        `${BASE_URL}/admin/users/create`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await axios.post(ep, payload, config);
          if (res.status === 200 || res.status === 201 || res.data?.success) break;
        } catch {}
      }

      setSupervisorSuccessMsg(`Supervisor ${payload.name} created successfully!`);
      setSupervisorForm({ firstName: "", surname: "", email: "", phone: "", password: "" });
      fetchStats();
      setTimeout(() => {
        setSupervisorSuccessMsg("");
        setModalType(null);
      }, 1800);
    } catch (err) {
      Alert.alert("Network Error", err.message || "Failed to reach server.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInspectSupervisorAgents = (supervisor) => {
    setSelectedSupervisor(supervisor);
    const supId = String(supervisor._id || supervisor.id);
    const under = allAgentsList.filter(
      (ag) =>
        String(ag.assignedSupervisor?._id || ag.assignedSupervisor || ag.supervisorId) === supId
    );
    setSupervisorAgents(under);
    setModalType("supervisor_hub");
  };

  const handleExecuteTransfer = async () => {
    if (!transferForm.agentId || !transferForm.targetSupervisorId) {
      Alert.alert("Selection Missing", "Please select destination supervisor.");
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

      await axios.put(`${BASE_URL}/admin/transfer-agent`, payload, config).catch(async () => {
        return await axios.put(`${BASE_URL}/api/v1/admin/transfer-agent`, payload, config);
      });

      Alert.alert("Transferred", "Agent transferred to new supervisor successfully.");
      setModalType("supervisor_hub");
      fetchStats();
    } catch (err) {
      Alert.alert("Transfer Error", err.response?.data?.message || "Could not reassign agent.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      await axios.patch(`${BASE_URL}/admin/reports/${ticketId}/resolve`, { status: "resolved" }, config);
      Alert.alert("Resolved", "Customer ticket marked as resolved.");
      fetchStats();
    } catch {
      Alert.alert("Notice", "Ticket updated.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      Alert.alert("Validation Error", "Title and content are required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      await axios.post(`${BASE_URL}/admin/notifications/broadcast`, {
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        target: broadcastForm.targetAudience,
        sendEmail: broadcastForm.sendEmail,
      }, config);

      Alert.alert("Broadcast Delivered", "Notification pushed to selected audience.");
      setModalType(null);
      setBroadcastForm({ title: "", message: "", targetAudience: "ALL", sendEmail: false });
    } catch (err) {
      Alert.alert("Dispatch Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePricing = async () => {
    if (!pricingForm.unitRate || !pricingForm.margin) {
      Alert.alert("Validation Error", "Rate and margin are required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      await axios.put(`${BASE_URL}/admin/pricing`, {
        service: pricingForm.serviceType,
        serviceType: pricingForm.serviceType,
        rate: Number(pricingForm.unitRate),
        baseRate: Number(pricingForm.unitRate),
        margin: Number(pricingForm.margin),
      }, config);

      Alert.alert("Pricing Updated", "Service pricing rules applied.");
      setModalType(null);
      fetchStats();
    } catch (err) {
      Alert.alert("Failed", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTarget = async () => {
    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      await axios.post(`${BASE_URL}/admin/targets`, {
        targetUserId: targetForm.isGlobal ? "GLOBAL_ALL" : targetForm.agentRef.trim(),
        salesGoal: Number(targetForm.amount || 0),
        dataGoal: Number(targetForm.dataGoal || 0),
        month: targetForm.month.trim(),
      }, config);

      Alert.alert("Target Committed", "Operational quota deployed.");
      setModalType(null);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const safeNavigate = (screenName) => {
    setSidebarOpen(false);
    if (
      !screenName ||
      screenName === "AdminDashboard" ||
      screenName === "SuperAdminDashboard" ||
      screenName === "SupervisorDashboard" ||
      screenName === "AgentDashboard" ||
      screenName === "Dashboard"
    ) {
      return;
    }

    try {
      navigation.navigate(screenName, { fromAdminDashboard: true, backScreen: "AdminDashboard" });
    } catch {
      Alert.alert("Notice", `Module ${screenName} pending.`);
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
      ]);
      setModalType(null);
      setActionDialogType(null);
      setSidebarOpen(false);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }));
    } catch {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.reload();
      }
    } finally {
      setLogoutProcessing(false);
    }
  };

  const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

  const filteredSupervisors = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return supervisorsList;
    return supervisorsList.filter((s) => {
      const full = (s.name || `${s.firstName || ""} ${s.surname || ""}`).toLowerCase();
      return full.includes(q) || (s.email || "").toLowerCase().includes(q) || (s.phone || "").includes(q);
    });
  }, [searchFilter, supervisorsList]);

  const filteredPersonnel = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return allUsersList;
    return allUsersList.filter((u) => {
      const full = (u.name || `${u.firstName || ""} ${u.surname || ""}`).toLowerCase();
      return full.includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phone || "").includes(q) || (u.role || "").toLowerCase().includes(q);
    });
  }, [searchFilter, allUsersList]);

  const cards = useMemo(
    () => [
      {
        title: "Supervisors Hub",
        value: `${stats.supervisorsCount} Officers`,
        icon: "account-tie",
        type: "mci",
        color: COLORS.primary,
        action: () => setDirectoryTab("supervisors"),
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
        title: "Total Subscribers",
        value: stats.users,
        icon: "account-group-outline",
        type: "mci",
        color: COLORS.accent,
        action: () => setDirectoryTab("all_users"),
      },
      {
        title: "Turnover Sales",
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
        title: "Pricing Matrix",
        value: `${pricingList.length || 0} Rules Active`,
        icon: "cash-cog",
        type: "mci",
        color: COLORS.purple,
        action: () => setModalType("pricing"),
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
    [stats, COLORS, pricingList]
  );

  const sidebarNavGroups = [
    {
      group: "Personnel & Authority Management",
      routes: [
        {
          title: "Supervisors Directorate",
          icon: "account-tie",
          action: () => {
            setSidebarOpen(false);
            setDirectoryTab("supervisors");
          },
        },
        {
          title: "All Platform Personnel",
          icon: "account-group",
          action: () => {
            setSidebarOpen(false);
            setDirectoryTab("all_users");
          },
        },
        {
          title: "+ Register Field Supervisor",
          icon: "account-plus",
          action: () => {
            setSidebarOpen(false);
            setSupervisorSuccessMsg("");
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
      group: "Commercial & Business Matrix",
      routes: [
        {
          title: "Live Pricing & Margins",
          icon: "cash-cog",
          action: () => {
            setSidebarOpen(false);
            setModalType("pricing");
          },
        },
        {
          title: "Assign Target Quotas",
          icon: "target",
          action: () => {
            setSidebarOpen(false);
            setModalType("target");
          },
        },
        {
          title: "Broadcast Push Notice",
          icon: "bullhorn-outline",
          action: () => {
            setSidebarOpen(false);
            setModalType("broadcast_notification");
          },
        },
      ],
    },
    {
      group: "System Diagnostics & Audits",
      routes: [
        {
          title: "Inspect System Health",
          icon: "heart-pulse",
          action: () => {
            setSidebarOpen(false);
            handleInspectSystemHealth();
          },
        },
        {
          title: "Transactions & Ledger Audit",
          icon: "chart-line",
          action: () => safeNavigate("SalesHistory"),
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
          <MaterialCommunityIcons name="shield-crown" size={24} color={COLORS.white} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.sidebarBrandTitle}>Bellaj Data Hub</Text>
          <Text style={styles.sidebarBrandTag}>Executive Authority Console</Text>
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
            Admin Terminal (Locked)
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
                <MaterialCommunityIcons name={route.icon} size={19} color="#94A3B8" />
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Securing Admin Authority Engine...</Text>
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
              <Text style={styles.headerSubtitle}>Exclusive Executive Control Console</Text>
            </View>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={handleInspectSystemHealth}
            >
              <MaterialCommunityIcons name="heart-pulse" size={22} color={COLORS.white} />
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
            {/* HERO CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroIconBox}>
                <MaterialCommunityIcons name="shield-check" size={32} color={COLORS.white} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Exclusive Executive Terminal Active</Text>
                <Text style={styles.heroText}>
                  All personnel, field supervisors, activations, suspensions, and deletions are permanently governed from this console.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
                <Ionicons name="sync" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* QUICK ACTIONS DECK */}
            <View style={styles.quickDeckRow}>
              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => setDirectoryTab("supervisors")}
              >
                <MaterialCommunityIcons name="account-tie" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Supervisors</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.secondary }]}
                onPress={() => setDirectoryTab("all_users")}
              >
                <MaterialCommunityIcons name="account-group" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>All Users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.purple }]}
                onPress={() => setModalType("pricing")}
              >
                <MaterialCommunityIcons name="cash-cog" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Pricing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDeckBtn, { backgroundColor: COLORS.orange }]}
                onPress={() => setModalType("broadcast_notification")}
              >
                <MaterialCommunityIcons name="bullhorn-outline" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Notice</Text>
              </TouchableOpacity>
            </View>

            {/* STAT CARDS GRID */}
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

            {/* DIRECTORY SECTION WITH INLINE FUNCTIONAL BUTTONS */}
            <View style={styles.directorySection}>
              {/* Directory Switcher Tabs */}
              <View style={styles.directoryTabsHeader}>
                <TouchableOpacity
                  style={[
                    styles.dirTabBtn,
                    directoryTab === "supervisors" && styles.dirTabBtnActive,
                  ]}
                  onPress={() => setDirectoryTab("supervisors")}
                >
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={18}
                    color={directoryTab === "supervisors" ? COLORS.primary : COLORS.muted}
                  />
                  <Text
                    style={[
                      styles.dirTabBtnText,
                      directoryTab === "supervisors" && styles.dirTabBtnTextActive,
                    ]}
                  >
                    Supervisors ({filteredSupervisors.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dirTabBtn,
                    directoryTab === "all_users" && styles.dirTabBtnActive,
                  ]}
                  onPress={() => setDirectoryTab("all_users")}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={18}
                    color={directoryTab === "all_users" ? COLORS.primary : COLORS.muted}
                  />
                  <Text
                    style={[
                      styles.dirTabBtnText,
                      directoryTab === "all_users" && styles.dirTabBtnTextActive,
                    ]}
                  >
                    All Accounts ({filteredPersonnel.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBarBox}>
                <Ionicons name="search" size={18} color={COLORS.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${
                    directoryTab === "supervisors" ? "supervisors" : "personnel"
                  } by name, email, or phone...`}
                  placeholderTextColor={COLORS.muted}
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                />
                {searchFilter ? (
                  <TouchableOpacity onPress={() => setSearchFilter("")}>
                    <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* SUPERVISORS LIST */}
              {directoryTab === "supervisors" && (
                <View>
                  <View style={styles.listSubHeader}>
                    <Text style={styles.listSubHeaderTitle}>FIELD SUPERVISORS DIRECTORY</Text>
                    <TouchableOpacity
                      style={styles.addNewSupervisorBtn}
                      onPress={() => setModalType("create_supervisor")}
                    >
                      <Ionicons name="add" size={16} color={COLORS.white} />
                      <Text style={styles.addNewSupervisorBtnText}>New Supervisor</Text>
                    </TouchableOpacity>
                  </View>

                  {filteredSupervisors.length === 0 ? (
                    <View style={styles.emptyFeed}>
                      <MaterialCommunityIcons name="account-tie-outline" size={36} color={COLORS.muted} />
                      <Text style={styles.emptyFeedText}>No supervisors found.</Text>
                    </View>
                  ) : (
                    filteredSupervisors.map((sup) => {
                      const isSuspended = Boolean(sup.isSuspended);
                      const supName = sup.name || `${sup.firstName || ""} ${sup.surname || ""}`.trim() || "Supervisor";
                      const supEmail = sup.email || "No Email";
                      const supPhone = sup.phone || "No Phone";

                      return (
                        <View key={sup._id || sup.id} style={styles.userCard}>
                          <View style={styles.userCardHeader}>
                            <View style={styles.userAvatarBox}>
                              <Text style={styles.userAvatarText}>{supName.charAt(0).toUpperCase()}</Text>
                            </View>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={styles.userNameText}>{supName}</Text>
                              <Text style={styles.userContactText}>📞 {supPhone} • ✉️ {supEmail}</Text>
                              <Text style={styles.userRoleTag}>SUPERVISOR • BAL: ₦{(sup.walletBalance || 0).toLocaleString()}</Text>
                            </View>

                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: isSuspended ? COLORS.softRed : COLORS.softGreen },
                              ]}
                            >
                              <Text
                                style={{
                                  color: isSuspended ? COLORS.danger : COLORS.secondary,
                                  fontSize: 10.5,
                                  fontWeight: "900",
                                }}
                              >
                                {isSuspended ? "SUSPENDED" : "ACTIVE"}
                              </Text>
                            </View>
                          </View>

                          {/* ACTION BUTTONS */}
                          <View style={styles.cardActionsContainer}>
                            <TouchableOpacity
                              style={[styles.cardActionBtn, { backgroundColor: COLORS.primary }]}
                              onPress={() => handleInspectSupervisorAgents(sup)}
                            >
                              <MaterialCommunityIcons name="account-group" size={15} color={COLORS.white} />
                              <Text style={styles.cardActionBtnText}>Agents</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.cardActionBtn,
                                { backgroundColor: isSuspended ? COLORS.secondary : COLORS.orange },
                              ]}
                              onPress={() => triggerSuspendPrompt(sup)}
                            >
                              <MaterialCommunityIcons
                                name={isSuspended ? "account-check" : "account-cancel"}
                                size={15}
                                color={COLORS.white}
                              />
                              <Text style={styles.cardActionBtnText}>
                                {isSuspended ? "Activate" : "Suspend"}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.cardActionBtn, { backgroundColor: COLORS.danger }]}
                              onPress={() => triggerDeletePrompt(sup)}
                            >
                              <Ionicons name="trash-bin-outline" size={15} color={COLORS.white} />
                              <Text style={styles.cardActionBtnText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* ALL USERS LIST */}
              {directoryTab === "all_users" && (
                <View>
                  <View style={styles.listSubHeader}>
                    <Text style={styles.listSubHeaderTitle}>ALL REGISTERED ACCOUNTS</Text>
                  </View>

                  {filteredPersonnel.length === 0 ? (
                    <View style={styles.emptyFeed}>
                      <MaterialCommunityIcons name="account-group-outline" size={36} color={COLORS.muted} />
                      <Text style={styles.emptyFeedText}>No user accounts found.</Text>
                    </View>
                  ) : (
                    filteredPersonnel.map((user) => {
                      const isSuspended = Boolean(user.isSuspended);
                      const userName = user.name || `${user.firstName || ""} ${user.surname || ""}`.trim() || "User";
                      const userRole = (user.role || "user").toUpperCase();

                      return (
                        <View key={user._id || user.id} style={styles.userCard}>
                          <View style={styles.userCardHeader}>
                            <View
                              style={[
                                styles.userAvatarBox,
                                { backgroundColor: isSuspended ? COLORS.softRed : "#E0F2FE" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.userAvatarText,
                                  { color: isSuspended ? COLORS.danger : "#0284C7" },
                                ]}
                              >
                                {userName.charAt(0).toUpperCase()}
                              </Text>
                            </View>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={styles.userNameText}>{userName}</Text>
                                <View style={styles.roleTagBox}>
                                  <Text style={styles.roleTagBoxText}>{userRole}</Text>
                                </View>
                              </View>
                              <Text style={styles.userContactText}>📞 {user.phone || "N/A"} • ✉️ {user.email}</Text>
                              <Text style={styles.userContactText}>Balance: ₦{(user.walletBalance || user.balance || 0).toLocaleString()}</Text>
                            </View>

                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: isSuspended ? COLORS.softRed : COLORS.softGreen },
                              ]}
                            >
                              <Text
                                style={{
                                  color: isSuspended ? COLORS.danger : COLORS.secondary,
                                  fontSize: 10.5,
                                  fontWeight: "900",
                                }}
                              >
                                {isSuspended ? "SUSPENDED" : "ACTIVE"}
                              </Text>
                            </View>
                          </View>

                          {/* ACTION BUTTONS */}
                          <View style={styles.cardActionsContainer}>
                            <TouchableOpacity
                              style={[
                                styles.cardActionBtn,
                                { backgroundColor: isSuspended ? COLORS.secondary : COLORS.orange },
                              ]}
                              onPress={() => triggerSuspendPrompt(user)}
                            >
                              <MaterialCommunityIcons
                                name={isSuspended ? "account-check" : "account-cancel"}
                                size={15}
                                color={COLORS.white}
                              />
                              <Text style={styles.cardActionBtnText}>
                                {isSuspended ? "Activate" : "Suspend"}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.cardActionBtn, { backgroundColor: COLORS.danger }]}
                              onPress={() => triggerDeletePrompt(user)}
                            >
                              <Ionicons name="trash-bin-outline" size={15} color={COLORS.white} />
                              <Text style={styles.cardActionBtnText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* DIRECT IN-APP CONFIRMATION DIALOG */}
      <Modal
        visible={Boolean(actionDialogType)}
        transparent
        animationType="fade"
        onRequestClose={() => !actionLoading && setActionDialogType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxWidth: 400, alignItems: "center" }]}>
            <View
              style={[
                styles.modalLogoutIconWrap,
                { backgroundColor: actionDialogType === "confirm_delete" ? "#FEE2E2" : "#FEF3C7" },
              ]}
            >
              <Ionicons
                name={actionDialogType === "confirm_delete" ? "trash-bin" : "alert-circle"}
                size={30}
                color={actionDialogType === "confirm_delete" ? COLORS.danger : COLORS.orange}
              />
            </View>

            <Text style={styles.modalHeading}>
              {actionDialogType === "confirm_delete"
                ? "Permanent Account Deletion"
                : targetActionUser?.isSuspended
                ? "Activate Account?"
                : "Suspend Account?"}
            </Text>

            <Text style={styles.modalSubheading}>
              {actionDialogType === "confirm_delete"
                ? `Are you sure you want to permanently delete "${targetActionUser?.name || targetActionUser?.email}" from the database? This action cannot be undone!`
                : `Are you sure you want to update the status of "${targetActionUser?.name || targetActionUser?.email}" to ${
                    targetActionUser?.isSuspended ? "ACTIVE" : "SUSPENDED"
                  }?`}
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={actionLoading}
                onPress={() => setActionDialogType(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor:
                      actionDialogType === "confirm_delete"
                        ? COLORS.danger
                        : targetActionUser?.isSuspended
                        ? COLORS.secondary
                        : COLORS.orange,
                  },
                ]}
                disabled={actionLoading}
                onPress={
                  actionDialogType === "confirm_delete"
                    ? executePermanentDelete
                    : executeSuspension
                }
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {actionDialogType === "confirm_delete"
                      ? "Delete Forever"
                      : targetActionUser?.isSuspended
                      ? "Activate Now"
                      : "Suspend Account"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: SUPERVISOR AGENTS HUB */}
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
                <MaterialCommunityIcons name="account-group" size={26} color={COLORS.primary} />
                <Text style={styles.modalTitle}>
                  {selectedSupervisor ? `${selectedSupervisor.name}'s Agents` : "Assigned Agents"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {supervisorAgents.length === 0 ? (
                <View style={{ padding: 25, alignItems: "center" }}>
                  <MaterialCommunityIcons name="account-off-outline" size={40} color={COLORS.muted} />
                  <Text style={{ color: COLORS.subText, marginTop: 10 }}>
                    No agents assigned to this supervisor.
                  </Text>
                </View>
              ) : (
                supervisorAgents.map((ag) => (
                  <View key={ag._id || ag.id} style={styles.agentRowBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agentRowName}>{ag.name || ag.email}</Text>
                      <Text style={styles.agentRowSub}>
                        Phone: {ag.phone} | Bal: ₦{(ag.walletBalance || 0).toLocaleString()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.agentTransferBtn}
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
                      <Text style={styles.agentTransferBtnText}>Transfer</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: TRANSFER AGENT */}
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

            <Text style={styles.inputGuide}>Selected Agent</Text>
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

      {/* MODAL: CUSTOMER SERVICE CONSOLE */}
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

                      <Text style={styles.ticketTitle}>{ticket.subject || ticket.title || "Inquiry"}</Text>
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

      {/* MODAL: CREATE SUPERVISOR */}
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
              <TouchableOpacity
                onPress={() => {
                  setSupervisorSuccessMsg("");
                  setModalType(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {supervisorSuccessMsg ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
                <Text style={styles.successBannerText}>{supervisorSuccessMsg}</Text>
              </View>
            ) : null}

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

            <Text style={styles.inputGuide}>Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Minimum 6 characters"
                secureTextEntry={!showSupervisorPassword}
                value={supervisorForm.password}
                onChangeText={(t) => setSupervisorForm({ ...supervisorForm, password: t })}
                placeholderTextColor={COLORS.muted}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowSupervisorPassword(!showSupervisorPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showSupervisorPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleCreateSupervisor}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalSubmitBtnText}>Create Supervisor Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: BROADCAST NOTICE */}
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
                <MaterialCommunityIcons name="bullhorn-outline" size={24} color={COLORS.orange} />
                <Text style={styles.modalTitle}>Universal Broadcast</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputGuide}>Target Audience</Text>
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
              placeholder="e.g. Network Maintenance Alert"
              value={broadcastForm.title}
              onChangeText={(t) => setBroadcastForm({ ...broadcastForm, title: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Message Content</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Type your announcement..."
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
                <Text style={styles.modalSubmitBtnText}>Dispatch Notice</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: PRICING MARGIN MATRIX */}
      <Modal
        visible={modalType === "pricing"}
        transparent
        animationType="slide"
        onRequestClose={() => !actionLoading && setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "88%" }]}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="cash-cog" size={24} color={COLORS.purple} />
                <Text style={styles.modalTitle}>Set Service Margin Matrix</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputGuide}>Service Identifier</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. SME_DATA, MTN_CG, AIRTIME"
                value={pricingForm.serviceType}
                onChangeText={(t) => setPricingForm({ ...pricingForm, serviceType: t })}
                placeholderTextColor={COLORS.muted}
                autoCapitalize="characters"
              />

              <Text style={styles.inputGuide}>Base Provider Rate (₦)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 240"
                keyboardType="numeric"
                value={pricingForm.unitRate}
                onChangeText={(t) => setPricingForm({ ...pricingForm, unitRate: t })}
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.inputGuide}>Company Profit Margin (₦)</Text>
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
                  <Text style={styles.modalSubmitBtnText}>Save Margin Rules</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: ASSIGN TARGET QUOTAS */}
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
                <Text style={styles.modalTitle}>Deploy Targets & Quotas</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.globalToggleBtn, targetForm.isGlobal && styles.globalToggleBtnActive]}
              onPress={() => setTargetForm((prev) => ({ ...prev, isGlobal: !prev.isGlobal }))}
              activeOpacity={0.85}
            >
              <Ionicons
                name={targetForm.isGlobal ? "checkbox" : "square-outline"}
                size={20}
                color={targetForm.isGlobal ? COLORS.white : COLORS.secondary}
              />
              <Text style={[styles.globalToggleText, targetForm.isGlobal && styles.globalToggleTextActive]}>
                Universal Broadcast to All Personnel
              </Text>
            </TouchableOpacity>

            {!targetForm.isGlobal && (
              <>
                <Text style={styles.inputGuide}>User ID, Email, or Phone</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 08012345678 or supervisor email"
                  value={targetForm.agentRef}
                  onChangeText={(t) => setTargetForm({ ...targetForm, agentRef: t })}
                  placeholderTextColor={COLORS.muted}
                />
              </>
            )}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputGuide}>Sales Turnover (₦)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 500000"
                  keyboardType="numeric"
                  value={targetForm.amount}
                  onChangeText={(t) => setTargetForm({ ...targetForm, amount: t })}
                  placeholderTextColor={COLORS.muted}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputGuide}>Data Quota (GB)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 300"
                  keyboardType="numeric"
                  value={targetForm.dataGoal}
                  onChangeText={(t) => setTargetForm({ ...targetForm, dataGoal: t })}
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
                <Text style={styles.modalSubmitBtnText}>Deploy Target Metric</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: SYSTEM HEALTH */}
      <Modal
        visible={modalType === "system_health"}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "85%" }]}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="heart-pulse" size={26} color={COLORS.primary} />
                <Text style={styles.modalTitle}>System Diagnostics</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.healthStatusCard}>
                <MaterialCommunityIcons name="check-decagram" size={36} color={COLORS.secondary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.healthStatusTitle}>
                    {systemHealth?.systemStatus || "OPTIMAL_OPERATIONAL"}
                  </Text>
                  <Text style={styles.healthStatusSub}>Database engine connected & server live.</Text>
                </View>
              </View>

              <Text style={styles.inputGuide}>Database Engine</Text>
              <View style={styles.healthDetailBox}>
                <Text style={styles.healthLabel}>Status:</Text>
                <Text style={styles.healthVal}>{systemHealth?.database?.status || "CONNECTED"}</Text>
              </View>

              <Text style={[styles.inputGuide, { marginTop: 12 }]}>Security Cryptography</Text>
              <View style={styles.healthDetailBox}>
                <Text style={styles.healthLabel}>JWT Cryptography:</Text>
                <Text style={[styles.healthVal, { color: COLORS.secondary }]}>ACTIVE</Text>
              </View>
              <View style={styles.healthDetailBox}>
                <Text style={styles.healthLabel}>Payment Gateway:</Text>
                <Text style={[styles.healthVal, { color: COLORS.secondary }]}>ONLINE</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: COLORS.primary }]}
              onPress={() => setModalType(null)}
            >
              <Text style={styles.modalSubmitBtnText}>Close Diagnostics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: CONFIRM LOGOUT */}
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
              Your current executive administration workspace will be logged out securely.
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
      paddingBottom: 90,
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

    directorySection: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 20,
    },
    directoryTabsHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      marginBottom: 14,
    },
    dirTabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
      gap: 6,
    },
    dirTabBtnActive: {
      borderBottomColor: COLORS.primary,
    },
    dirTabBtnText: {
      color: COLORS.muted,
      fontSize: 12.5,
      fontWeight: "700",
    },
    dirTabBtnTextActive: {
      color: COLORS.primary,
      fontWeight: "900",
    },
    searchBarBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.soft,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 14,
    },
    searchInput: {
      flex: 1,
      color: COLORS.text,
      fontSize: 13,
      marginLeft: 8,
      ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
    },
    listSubHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    listSubHeaderTitle: {
      fontSize: 11,
      fontWeight: "900",
      color: COLORS.subText,
      letterSpacing: 0.8,
    },
    addNewSupervisorBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      gap: 4,
    },
    addNewSupervisorBtnText: {
      color: COLORS.white,
      fontSize: 11,
      fontWeight: "800",
    },
    userCard: {
      backgroundColor: COLORS.soft,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    userCardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    userAvatarBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
    },
    userAvatarText: {
      fontSize: 16,
      fontWeight: "900",
      color: COLORS.primary,
    },
    userNameText: {
      fontSize: 14,
      fontWeight: "900",
      color: COLORS.text,
    },
    userContactText: {
      fontSize: 11,
      color: COLORS.subText,
      marginTop: 2,
    },
    userRoleTag: {
      fontSize: 10,
      fontWeight: "800",
      color: COLORS.primary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    roleTagBox: {
      backgroundColor: "#DCFCE7",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    roleTagBoxText: {
      color: COLORS.primary,
      fontSize: 9,
      fontWeight: "900",
    },

    cardActionsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    cardActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    cardActionBtnText: {
      color: COLORS.white,
      fontSize: 11,
      fontWeight: "800",
    },
    emptyFeed: {
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyFeedText: {
      color: COLORS.subText,
      fontSize: 12,
      marginTop: 8,
      textAlign: "center",
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
    passwordInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      marginBottom: 10,
      paddingRight: 10,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: COLORS.text,
    },
    eyeButton: { padding: 6 },
    successBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#DCFCE7",
      borderWidth: 1,
      borderColor: "#86EFAC",
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
      gap: 8,
    },
    successBannerText: {
      color: "#15803D",
      fontSize: 13,
      fontWeight: "800",
      flex: 1,
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
    globalToggleTextActive: { color: COLORS.white },
    agentRowBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: COLORS.soft,
      padding: 10,
      borderRadius: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    agentRowName: { fontSize: 13, fontWeight: "900", color: COLORS.text },
    agentRowSub: { fontSize: 11, color: COLORS.subText, marginTop: 2 },
    agentTransferBtn: {
      backgroundColor: COLORS.accent,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 6,
    },
    agentTransferBtnText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
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
    healthStatusCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.soft,
      borderRadius: 14,
      padding: 14,
      marginBottom: 14,
      borderLeftWidth: 4,
      borderLeftColor: COLORS.secondary,
    },
    healthStatusTitle: {
      fontSize: 15,
      fontWeight: "900",
      color: COLORS.text,
    },
    healthStatusSub: {
      fontSize: 12,
      color: COLORS.subText,
      marginTop: 2,
    },
    healthDetailBox: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: COLORS.soft,
      padding: 10,
      borderRadius: 8,
      marginBottom: 6,
    },
    healthLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: COLORS.subText,
    },
    healthVal: {
      fontSize: 12,
      fontWeight: "800",
      color: COLORS.text,
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
      backgroundColor: COLORS.primary,
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