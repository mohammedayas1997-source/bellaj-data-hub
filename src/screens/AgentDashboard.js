import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ToastAndroid,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  SafeAreaView,
  Switch,
  useWindowDimensions,
  Animated,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as LocalAuthentication from "expo-local-authentication";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  danger: "#DC2626",
  accent: "#2563EB",
  purple: "#7C3AED",
  orange: "#EA580C",
  teal: "#0D9488",
  sidebarBg: "#062819",
  sidebarBorder: "#0c3b26",
  card: "#FFFFFF",
  softGreen: "#DCFCE7",
  softRed: "#FEE2E2",
};

const AgentDashboard = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 992;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Biometrics
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  // Modals & Navigation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarWidth = isWeb ? 280 : Math.min(width * 0.82, 320);
  const sidebarAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutProcessing, setLogoutProcessing] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Performance & Stats
  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalAirtime: 0,
    totalServiceRequests: 0,
    totalSalesValue: 0,
    commissionsEarned: 0,
    bonusEarned: 0,
    monthlyTargetSales: 100000,
  });

  const getHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 25000,
    };
  };

  const normalizeProfile = (payload) =>
    payload?.user || payload?.data?.user || payload?.data || payload || null;

  const normalizeList = (payload) => {
    const data = payload?.data || payload?.notifications || payload || [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.notifications)) return data.notifications;
    return [];
  };

  const toggleSidebar = (open) => {
    if (open) {
      setSidebarOpen(true);
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: -sidebarWidth,
        duration: 220,
        useNativeDriver: false,
      }).start(() => setSidebarOpen(false));
    }
  };

  const checkBiometricSetup = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);

      const savedPref = await AsyncStorage.getItem("useBiometricLogin");
      setBiometricEnabled(savedPref === "true");
    } catch {
      setBiometricSupported(false);
    }
  }, []);

  const toggleFingerprintSetting = async (value) => {
    if (value) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            "Biometrics Unavailable",
            "Please register a fingerprint or face authentication in your device settings."
          );
          return;
        }

        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to enable Fingerprint Login",
          fallbackLabel: "Use Password",
        });

        if (auth.success) {
          await AsyncStorage.setItem("useBiometricLogin", "true");
          setBiometricEnabled(true);
          Alert.alert("Success", "Fingerprint Login activated.");
        } else {
          setBiometricEnabled(false);
        }
      } catch {
        Alert.alert("Error", "Could not complete biometric setup.");
      }
    } else {
      await AsyncStorage.setItem("useBiometricLogin", "false");
      setBiometricEnabled(false);
      Alert.alert("Notice", "Fingerprint Login disabled.");
    }
  };

  // Real-time live notifications fetcher
  const syncLiveNotifications = useCallback(async () => {
    try {
      const config = await getHeaders();
      const notifEndpoints = [
        `${BASE_URL}/notifications`,
        `${BASE_URL}/user/notifications`,
        `${BASE_URL}/notifications/unread`,
      ];

      for (const url of notifEndpoints) {
        try {
          const res = await axios.get(url, config);
          if (res?.data) {
            const list = normalizeList(res.data);
            const count = list.filter((item) => !item?.isRead && !item?.read).length;
            setUnreadCount(count);
            break;
          }
        } catch {}
      }
    } catch {}
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getHeaders();

      const cachedUserData = await AsyncStorage.getItem("userData");
      if (cachedUserData) {
        try {
          setUserData(JSON.parse(cachedUserData));
        } catch {}
      }

      await checkBiometricSetup();

      const [profileRes, perfRes, supRes, txRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/users/profile`, config).catch(() => axios.get(`${BASE_URL}/auth/me`, config)),
        axios.get(`${BASE_URL}/agent/performance`, config).catch(() => axios.get(`${BASE_URL}/agent/stats`, config)),
        axios.get(`${BASE_URL}/agent/my-supervisor`, config).catch(() => axios.get(`${BASE_URL}/agent/supervisor`, config)),
        axios.get(`${BASE_URL}/agent/transactions`, config).catch(() => axios.get(`${BASE_URL}/transactions`, config)),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value?.data) {
        const prof = normalizeProfile(profileRes.value.data);
        if (prof) {
          setUserData(prof);
          await AsyncStorage.setItem("userData", JSON.stringify(prof));
        }
      }

      let dynamicGB = 0;
      let dynamicAirtime = 0;
      let dynamicRequests = 0;

      if (txRes.status === "fulfilled" && txRes.value?.data) {
        const txList = txRes.value.data?.transactions || txRes.value.data?.data || [];
        if (Array.isArray(txList)) {
          txList.forEach((tx) => {
            const type = String(tx.type || tx.category || tx.service || "").toLowerCase();
            const desc = String(tx.description || tx.narration || tx.planName || "").toLowerCase();
            const amt = Number(tx.amount || 0);

            if (type.includes("data") || desc.includes("gb") || desc.includes("mb")) {
              const matchGB = desc.match(/(\d+(\.\d+)?)\s*gb/i);
              const matchMB = desc.match(/(\d+(\.\d+)?)\s*mb/i);
              if (matchGB) dynamicGB += parseFloat(matchGB[1]);
              else if (matchMB) dynamicGB += parseFloat(matchMB[1]) / 1024;
              else dynamicGB += 1;
            }

            if (type.includes("airtime") || desc.includes("vtu")) {
              dynamicAirtime += amt;
            }

            if (type.includes("nimc") || type.includes("bvn") || type.includes("cable") || type.includes("electricity")) {
              dynamicRequests += 1;
            }
          });
        }
      }

      if (perfRes.status === "fulfilled" && perfRes.value?.data) {
        const payload = perfRes.value.data?.data || perfRes.value.data || {};
        setPerformance((prev) => ({
          ...prev,
          ...payload,
          totalGB: payload.totalGB || parseFloat(dynamicGB.toFixed(2)),
          totalAirtime: payload.totalAirtime || dynamicAirtime,
          totalServiceRequests: payload.totalServiceRequests || dynamicRequests,
        }));
      } else {
        setPerformance((prev) => ({
          ...prev,
          totalGB: parseFloat(dynamicGB.toFixed(2)),
          totalAirtime: dynamicAirtime,
          totalServiceRequests: dynamicRequests,
        }));
      }

      if (supRes.status === "fulfilled" && supRes.value?.data) {
        const payload = supRes.value.data;
        setSupervisor(payload?.data || payload?.supervisor || payload || null);
      }

      await syncLiveNotifications();
    } catch (e) {
      console.log("Error loading agent workspace:", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkBiometricSetup, syncLiveNotifications]);

  useEffect(() => {
    loadDashboard();
    // Live notification polling interval
    const liveTimer = setInterval(syncLiveNotifications, 15000);
    return () => clearInterval(liveTimer);
  }, [loadDashboard, syncLiveNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const safeNavigate = (screenName, params = {}) => {
    toggleSidebar(false);
    if (!screenName || screenName === "AgentDashboard") return;

    try {
      navigation.navigate(screenName, {
        fromAgentDashboard: true,
        backScreen: "AgentDashboard",
        ...params,
      });
    } catch {
      Alert.alert("Navigation", `Opening screen '${screenName}'`);
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

      setLogoutModalVisible(false);
      toggleSidebar(false);

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

  const copyToClipboard = async (text) => {
    if (!text) return;
    await Clipboard.setStringAsync(String(text));

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Account number copied.");
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349075207281";
    const message = "Hello Bellaj Support Desk, I require assistance with my Agent terminal.";
    const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(message)}`;
    Linking.openURL(appUrl).catch(() => Linking.openURL(webUrl));
  };

  const agentName = useMemo(() => {
    const name =
      userData?.name ||
      userData?.fullName ||
      `${userData?.firstName || ""} ${userData?.surname || ""}`.trim();
    return name || "Field Retail Agent";
  }, [userData]);

  const balance = Number(userData?.walletBalance || userData?.balance || 0);
  const currentSales = Number(performance.totalSalesValue || 0);
  const targetSales = Number(performance.monthlyTargetSales || 100000);
  const remainingToTarget = Math.max(targetSales - currentSales, 0);
  const achievementPercentage =
    targetSales > 0
      ? Math.min(Math.round((currentSales / targetSales) * 100), 100)
      : 0;

  const quickServices = [
    { icon: "wifi", label: "Data Bundles", screen: "BuyData", color: COLORS.primary },
    { icon: "phone-alt", label: "VTU Airtime", screen: "BuyAirtime", color: COLORS.secondary },
    { icon: "bolt", label: "Electricity", screen: "Electricity", color: "#EAB308" },
    { icon: "tv", label: "Cable TV", screen: "Cable", color: COLORS.purple },
    { icon: "id-card", label: "NIMC Slips", screen: "NIMC", color: COLORS.accent },
    { icon: "fingerprint", label: "NIMC Modify", screen: "NIMCModification", color: "#EC4899" },
    { icon: "user-shield", label: "BVN Check", screen: "BVNScreen", color: COLORS.muted },
    { icon: "shield-alt", label: "NIN Verify", screen: "NINValidation", color: COLORS.secondary },
    { icon: "headset", label: "Support Desk", screen: "SupportDashboard", color: COLORS.teal },
    { icon: "history", label: "Audit Logs", screen: "SalesHistory", color: COLORS.orange },
  ];

  const sidebarNavGroups = [
    {
      group: "Terminal Commerce",
      routes: [
        { title: "Sell Data & Airtime", icon: "cart-plus", action: () => safeNavigate("BuyData") },
        { title: "Fund Wallet Account", icon: "wallet-plus-outline", action: () => safeNavigate("FundWallet") },
        { title: "Commercial Sales Logs", icon: "receipt-text-outline", action: () => safeNavigate("SalesHistory") },
      ],
    },
    {
      group: "Identity & Utilities",
      routes: [
        { title: "NIMC / NIN Enrollment", icon: "fingerprint", action: () => safeNavigate("NIMC") },
        { title: "BVN Validation Gate", icon: "card-account-details-outline", action: () => safeNavigate("BVNScreen") },
        { title: "Utility Bill Settlement", icon: "flash-outline", action: () => safeNavigate("Electricity") },
        { title: "Cable TV Subscriptions", icon: "television", action: () => safeNavigate("Cable") },
      ],
    },
    {
      group: "Governance & Account",
      routes: [
        { title: "Support Operations Desk", icon: "headset", action: () => safeNavigate("SupportDashboard") },
        { title: "My Profile File", icon: "account-box-outline", action: () => setProfileModalVisible(true) },
        { title: "Update Transaction PIN", icon: "key-outline", action: () => safeNavigate("UpdatePin") },
        { title: "Direct WhatsApp Line", icon: "whatsapp", action: openWhatsApp },
      ],
    },
  ];

  const renderSidebarContent = () => (
    <View style={styles.sidebarInner}>
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarBadgeBox}>
          <MaterialCommunityIcons name="storefront-outline" size={26} color={COLORS.white} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.sidebarBrandTitle}>Bellaj Data Hub</Text>
          <Text style={styles.sidebarBrandTag}>Executive Agent Suite</Text>
        </View>
        {!isWeb && (
          <TouchableOpacity
            style={styles.sidebarCloseBtn}
            onPress={() => toggleSidebar(false)}
          >
            <Ionicons name="close" size={22} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>
        <TouchableOpacity
          style={[styles.sidebarMenuItem, styles.sidebarMenuItemActive]}
          onPress={() => toggleSidebar(false)}
        >
          <MaterialCommunityIcons name="view-dashboard" size={20} color={COLORS.white} />
          <Text style={[styles.sidebarMenuText, styles.sidebarMenuTextActive]}>
            Overview Dashboard
          </Text>
        </TouchableOpacity>

        {/* PROFILE ACTION IN SIDEBAR */}
        <TouchableOpacity
          style={styles.sidebarMenuItem}
          onPress={() => {
            toggleSidebar(false);
            setProfileModalVisible(true);
          }}
        >
          <Ionicons name="person-circle-outline" size={20} color="#94A3B8" />
          <Text style={styles.sidebarMenuText}>Agent Identity File</Text>
          <Ionicons name="chevron-forward" size={14} color="#64748B" />
        </TouchableOpacity>

        {/* FINGERPRINT ENROLLMENT */}
        <View style={styles.biometricSection}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons
              name="fingerprint"
              size={22}
              color={biometricEnabled ? COLORS.secondary : "#CBD5E1"}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.biometricTitle}>Biometric Terminal</Text>
              <Text style={styles.biometricSubText}>
                {biometricSupported
                  ? biometricEnabled
                    ? "Fingerprint login is ACTIVE"
                    : "Enable instant touch login"
                  : "Hardware not supported"}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleFingerprintSetting}
              trackColor={{ false: "#334155", true: COLORS.secondary }}
              thumbColor={COLORS.white}
              disabled={!biometricSupported}
            />
          </View>
        </View>

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
            toggleSidebar(false);
            setLogoutModalVisible(true);
          }}
        >
          <Ionicons name="power" size={18} color="#FCA5A5" />
          <Text style={styles.sidebarLogoutText}>Sign Out of Console</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.mainLayout}>
        {/* Desktop Fixed Executive Sidebar */}
        {isWeb && <View style={styles.desktopSidebar}>{renderSidebarContent()}</View>}

        {/* Mobile Animated Slide-Out Sidebar Drawer */}
        {!isWeb && sidebarOpen && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => toggleSidebar(false)}
          >
            <Animated.View
              style={[
                styles.mobileSidebarContainer,
                { width: sidebarWidth, transform: [{ translateX: sidebarAnim }] },
              ]}
              onStartShouldSetResponder={() => true}
            >
              {renderSidebarContent()}
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* Workspace Canvas */}
        <View style={styles.mainCanvas}>
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => toggleSidebar(true)}
              accessibilityLabel="Open Menu"
            >
              <Ionicons name="menu" size={26} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.headerTextBox}>
              <Text style={styles.headerTitle}>Agent Console</Text>
              <Text style={styles.headerSubtitle}>
                Welcome, {agentName}
              </Text>
            </View>

            {/* Profile Avatar Trigger Button */}
            <TouchableOpacity
              onPress={() => setProfileModalVisible(true)}
              style={styles.profileAvatarBtn}
            >
              <Ionicons name="person" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            {/* Real-time Notifications Bell with Live Badge */}
            <TouchableOpacity
              onPress={() => safeNavigate("Notifications")}
              style={styles.notificationBtn}
            >
              <Ionicons name="notifications-outline" size={21} color={COLORS.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setLogoutModalVisible(true)}
            >
              <Ionicons name="power" size={19} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {loading && !userData ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading your dashboard...</Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
            >
              {/* Balance Card */}
              <View style={styles.walletCard}>
                <View style={styles.walletTop}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MaterialCommunityIcons name="wallet-outline" size={18} color="#BBF7D0" />
                    <Text style={styles.walletLabel}>Authorized Wallet Balance</Text>
                  </View>
                  <TouchableOpacity onPress={() => safeNavigate("SalesHistory")}>
                    <Text style={styles.historyText}>
                      Audits <Ionicons name="chevron-forward" size={12} color={COLORS.white} />
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceContainer}>
                  <Text style={styles.currency}>₦</Text>
                  <Text style={styles.balanceText}>
                    {isBalanceVisible ? balance.toLocaleString() : "****"}
                  </Text>
                  <TouchableOpacity onPress={() => setIsBalanceVisible(!isBalanceVisible)}>
                    <Ionicons
                      name={isBalanceVisible ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color={COLORS.white}
                      style={{ marginLeft: 12 }}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.walletActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => safeNavigate("FundWallet")}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="add-circle" size={17} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>FUND WALLET</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.newSaleBtn}
                    onPress={() => safeNavigate("BuyData")}
                    activeOpacity={0.88}
                  >
                    <MaterialCommunityIcons name="cart-plus" size={17} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>SELL DATA</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supportBtn}
                    onPress={() => safeNavigate("SupportDashboard")}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="headset" size={17} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>SUPPORT</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* LIVE COMMERCIAL METRICS: DATA GB, AIRTIME & SERVICE REQUESTS */}
              <View style={styles.liveMetricsContainer}>
                <View style={styles.liveMetricCard}>
                  <View style={[styles.liveMetricIconBox, { backgroundColor: "#DBEAFE" }]}>
                    <Ionicons name="wifi" size={17} color="#2563EB" />
                  </View>
                  <Text style={styles.liveMetricNumber}>{performance.totalGB.toLocaleString()} GB</Text>
                  <Text style={styles.liveMetricLabel}>Data Delivered</Text>
                </View>

                <View style={styles.liveMetricCard}>
                  <View style={[styles.liveMetricIconBox, { backgroundColor: "#DCFCE7" }]}>
                    <Ionicons name="call" size={17} color="#16A34A" />
                  </View>
                  <Text style={styles.liveMetricNumber}>₦{performance.totalAirtime.toLocaleString()}</Text>
                  <Text style={styles.liveMetricLabel}>Airtime Sold</Text>
                </View>

                <View style={styles.liveMetricCard}>
                  <View style={[styles.liveMetricIconBox, { backgroundColor: "#F3E8FF" }]}>
                    <Ionicons name="layers" size={17} color="#9333EA" />
                  </View>
                  <Text style={styles.liveMetricNumber}>{performance.totalServiceRequests.toLocaleString()}</Text>
                  <Text style={styles.liveMetricLabel}>VAS / Requests</Text>
                </View>
              </View>

              {/* Financial Commissions & Performance */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}>
                  <Text style={styles.statLabel}>Revenue Handled</Text>
                  <Text style={styles.statValue}>
                    ₦{Number(currentSales || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: COLORS.orange }]}>
                  <Text style={styles.statLabel}>Direct Commission</Text>
                  <Text style={[styles.statValue, { color: COLORS.orange }]}>
                    ₦{Number(performance.commissionsEarned || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Monthly Target Progress */}
              <View style={styles.targetCard}>
                <View style={styles.targetHeader}>
                  <View>
                    <Text style={styles.targetLabel}>Operational Quota</Text>
                    <Text style={styles.targetValue}>₦{targetSales.toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.targetLabel}>Target Reached</Text>
                    <Text style={styles.percentageText}>{achievementPercentage}%</Text>
                  </View>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${achievementPercentage}%`,
                        backgroundColor: achievementPercentage >= 100 ? COLORS.secondary : COLORS.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.targetRowAlt}>
                  <Text style={styles.progressSubText}>
                    Realized: <Text style={styles.boldText}>₦{currentSales.toLocaleString()}</Text>
                  </Text>
                  <Text style={styles.remainingText}>
                    Deficit: <Text style={styles.boldTextRed}>₦{remainingToTarget.toLocaleString()}</Text>
                  </Text>
                </View>
              </View>

              {/* Dedicated Bank Accounts */}
              <Text style={styles.sectionLabel}>Dedicated Settlement Bank Account</Text>
              <View style={styles.bankCardsWrapper}>
                {userData?.accountNumber && userData?.accountNumber !== "Initialization Pending" ? (
                  <BankCard
                    bank={userData.bankName || "Wema Bank"}
                    acc={userData.accountNumber}
                    code="BD"
                    onCopy={() => copyToClipboard(userData.accountNumber)}
                  />
                ) : (
                  <BankCard
                    bank="Virtual Account Allocation"
                    acc="Generating credentials..."
                    code="POS"
                    onCopy={() => Alert.alert("Wait", "Account details currently synchronizing.")}
                  />
                )}
              </View>

              {/* Quick Services Grid */}
              <Text style={styles.sectionLabel}>Commercial Channels</Text>
              <View style={styles.servicesContainer}>
                <View style={styles.grid}>
                  {quickServices.map((service, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.gridItem}
                      onPress={() => safeNavigate(service.screen)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.iconBox}>
                        <FontAwesome5 name={service.icon} size={19} color={service.color} />
                      </View>
                      <Text style={styles.gridLabel}>{service.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Field Supervisor Dossier */}
              <View style={styles.supervisorCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <MaterialCommunityIcons name="shield-account" size={22} color={COLORS.secondary} />
                  <Text style={styles.sectionTitle}>Field Supervisory Command</Text>
                </View>

                {supervisor ? (
                  <View style={styles.supInfoBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supName}>
                        {supervisor?.name || supervisor?.fullName || "Assigned Supervisor"}
                      </Text>
                      <Text style={styles.supPhone}>
                        {supervisor?.phone || supervisor?.email || "No contact line available"}
                      </Text>
                    </View>
                    {supervisor?.phone ? (
                      <TouchableOpacity
                        style={styles.callSupBtn}
                        onPress={() => Linking.openURL(`tel:${supervisor.phone}`)}
                      >
                        <Ionicons name="call" size={15} color={COLORS.white} />
                        <Text style={styles.callSupText}>Call</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.infoText}>
                    Direct Account: Reporting directly to central administrative desk.
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* ============================================================= */}
      {/* PROFESSIONAL AGENT PROFILE MODAL */}
      {/* ============================================================= */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "88%" }]}>
            <View style={styles.profileModalHeader}>
              <View style={styles.profileAvatarLarge}>
                <Text style={styles.profileAvatarLargeText}>
                  {agentName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.profileModalName}>{agentName}</Text>
              <View style={styles.roleBadgeModal}>
                <Text style={styles.roleBadgeModalText}>AUTHORIZED RETAIL AGENT</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%", marginVertical: 12 }}>
              <View style={styles.profileItemRow}>
                <Text style={styles.profileItemLabel}>Email</Text>
                <Text style={styles.profileItemValue}>{userData?.email || "N/A"}</Text>
              </View>

              <View style={styles.profileItemRow}>
                <Text style={styles.profileItemLabel}>Telephone</Text>
                <Text style={styles.profileItemValue}>{userData?.phone || "N/A"}</Text>
              </View>

              <View style={styles.profileItemRow}>
                <Text style={styles.profileItemLabel}>State & Region</Text>
                <Text style={styles.profileItemValue}>
                  {userData?.lga ? `${userData.lga}, ` : ""}{userData?.state || "Gombe"}
                </Text>
              </View>

              <View style={styles.profileItemRow}>
                <Text style={styles.profileItemLabel}>Settlement Bank</Text>
                <Text style={styles.profileItemValue}>{userData?.bankName || "Wema Bank"}</Text>
              </View>

              <View style={styles.profileItemRow}>
                <Text style={styles.profileItemLabel}>Account Number</Text>
                <Text style={[styles.profileItemValue, { fontWeight: "900", color: COLORS.primary }]}>
                  {userData?.accountNumber || "Generating"}
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseFullBtn}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={styles.modalCloseFullBtnText}>Close Identity File</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !logoutProcessing && setLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="power" size={28} color={COLORS.danger} />
            </View>
            <Text style={styles.modalHeading}>Terminate Session?</Text>
            <Text style={styles.modalSubheading}>
              Are you sure you want to sign out from this commercial terminal?
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={logoutProcessing}
                onPress={() => setLogoutModalVisible(false)}
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
                  <Text style={styles.modalConfirmText}>Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const BankCard = ({ bank, acc, code, onCopy }) => (
  <TouchableOpacity style={styles.bankBox} onPress={onCopy} activeOpacity={0.88}>
    <View style={styles.bankInfo}>
      <View style={styles.bankLogoCircle}>
        <Text style={styles.bankLogoText}>{code}</Text>
      </View>
      <View>
        <Text style={styles.bankTitle}>{bank}</Text>
        <Text style={styles.accNo}>{acc}</Text>
      </View>
    </View>
    <Ionicons name="copy-outline" size={19} color={COLORS.primary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
    ...(Platform.OS === "web" ? { minHeight: "100vh", height: "100%" } : {}),
  },
  mainLayout: { flex: 1, flexDirection: "row", width: "100%" },

  desktopSidebar: {
    width: 280,
    backgroundColor: COLORS.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.sidebarBorder,
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    zIndex: 999,
  },
  mobileSidebarContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.sidebarBorder,
  },

  sidebarInner: { flex: 1, display: "flex", flexDirection: "column" },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 44 : 24,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sidebarBorder,
    flexDirection: "row",
    alignItems: "center",
  },
  sidebarBadgeBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarBrandTitle: { color: COLORS.white, fontSize: 15, fontWeight: "900" },
  sidebarBrandTag: { color: "#86EFAC", fontSize: 10.5, fontWeight: "600", marginTop: 2 },
  sidebarCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sidebarScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },

  biometricSection: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  biometricTitle: { color: COLORS.white, fontWeight: "800", fontSize: 12.5 },
  biometricSubText: { color: "#94A3B8", fontSize: 10, marginTop: 2 },

  sidebarSection: { marginTop: 12 },
  sidebarSectionTitle: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
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
    flex: 1,
    color: "#CBD5E1",
    fontSize: 12.5,
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

  mainCanvas: { flex: 1, display: "flex", flexDirection: "column", width: "100%" },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 44 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  headerSubtitle: {
    color: "#DCFCE7",
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  badge: {
    position: "absolute",
    right: 2,
    top: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loaderText: { marginTop: 12, color: COLORS.primary, fontWeight: "800" },

  walletCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: { color: "#FFE4E4", fontSize: 11.5, fontWeight: "700" },
  historyText: { color: COLORS.white, fontSize: 11.5, fontWeight: "800" },
  balanceContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  currency: { color: COLORS.white, fontSize: 20, fontWeight: "800" },
  balanceText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    marginLeft: 6,
  },
  walletActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  newSaleBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  supportBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.teal,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 10.5,
  },

  // LIVE OPERATIONAL METRICS
  liveMetricsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  liveMetricCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  liveMetricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  liveMetricNumber: {
    fontSize: 12.5,
    fontWeight: "900",
    color: COLORS.dark,
    textAlign: "center",
  },
  liveMetricLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: COLORS.muted,
    marginTop: 2,
    textAlign: "center",
  },

  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 10.5, color: COLORS.muted, fontWeight: "800" },
  statValue: { fontSize: 15, fontWeight: "900", color: COLORS.dark, marginTop: 4 },

  targetCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  targetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  targetRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  targetLabel: { fontSize: 10.5, color: COLORS.muted, fontWeight: "700" },
  targetValue: { fontSize: 14, fontWeight: "900", color: COLORS.dark },
  percentageText: { fontSize: 16, fontWeight: "900", color: COLORS.secondary },
  progressTrack: {
    width: "100%",
    height: 7,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginTop: 10,
    overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 4 },
  progressSubText: { fontSize: 10.5, color: COLORS.muted, fontWeight: "600" },
  remainingText: { fontSize: 10.5, color: COLORS.muted, fontWeight: "600" },
  boldText: { fontWeight: "900", color: COLORS.dark },
  boldTextRed: { fontWeight: "900", color: COLORS.danger },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  bankCardsWrapper: {
    marginBottom: 14,
  },
  bankBox: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  bankInfo: { flexDirection: "row", alignItems: "center" },
  bankLogoCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  bankLogoText: { color: COLORS.danger, fontWeight: "900", fontSize: 11 },
  bankTitle: { fontSize: 10.5, color: COLORS.muted, fontWeight: "700" },
  accNo: { fontSize: 14, color: COLORS.dark, fontWeight: "900" },

  servicesContainer: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "31%", alignItems: "center", marginBottom: 12 },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridLabel: {
    color: COLORS.dark,
    fontSize: 10.5,
    textAlign: "center",
    fontWeight: "800",
  },

  supervisorCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: COLORS.dark },
  supInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  supName: { fontWeight: "900", fontSize: 13.5, color: COLORS.dark },
  supPhone: { color: COLORS.secondary, marginTop: 2, fontWeight: "700", fontSize: 11.5 },
  callSupBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  callSupText: { color: COLORS.white, fontWeight: "800", fontSize: 11.5 },
  infoText: { color: COLORS.muted, fontWeight: "600", fontSize: 11.5 },

  // PROFILE MODAL STYLES
  profileModalHeader: {
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: "100%",
  },
  profileAvatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  profileAvatarLargeText: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.primary,
  },
  profileModalName: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
  },
  roleBadgeModal: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  roleBadgeModalText: {
    fontSize: 9.5,
    fontWeight: "900",
    color: COLORS.secondary,
  },
  profileItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileItemLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.muted,
  },
  profileItemValue: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.dark,
  },
  modalCloseFullBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  modalCloseFullBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12.5,
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
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubheading: {
    fontSize: 11.5,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 16,
  },
  modalActionRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: COLORS.dark,
    fontWeight: "800",
    fontSize: 12.5,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12.5,
  },
});

export default AgentDashboard;