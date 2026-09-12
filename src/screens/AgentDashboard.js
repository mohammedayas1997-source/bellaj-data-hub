import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  useWindowDimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as LocalAuthentication from "expo-local-authentication";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
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
  card: "#FFFFFF",
  soft: "#F1F5F9",
  sidebarBg: "#062819",
  sidebarBorder: "#0c3b26",
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

  // Biometrics & Fingerprint Setup State
  const [isBiometricActive, setIsBiometricActive] = useState(false);
  const [biometricSettingUp, setBiometricSettingUp] = useState(false);

  // Modals & Navigation
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutProcessing, setLogoutProcessing] = useState(false);

  // Real-Time Transaction Ledger Activity
  const [recentTransactions, setRecentTransactions] = useState([]);

  const [performance, setPerformance] = useState({
    totalGB: 0,
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
      timeout: 20000,
    };
  };

  const normalizeProfile = (payload) =>
    payload?.user || payload?.data?.user || payload?.data || payload || null;

  const normalizeList = (payload) => {
    const data = payload?.data || payload || [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.notifications)) return data.notifications;
    if (Array.isArray(data?.transactions)) return data.transactions;
    return [];
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

  const checkBiometricStatus = async () => {
    try {
      const isEnabled = await AsyncStorage.getItem("useBiometricLogin");
      setIsBiometricActive(isEnabled === "true");
    } catch {
      setIsBiometricActive(false);
    }
  };

  const toggleFingerprintSetup = async () => {
    try {
      setBiometricSettingUp(true);
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Fingerprint Not Available",
          "Your phone does not support fingerprint or face recognition, or no security print is registered in your phone settings."
        );
        return;
      }

      if (isBiometricActive) {
        // Turn Off Fingerprint Login
        await AsyncStorage.removeItem("useBiometricLogin");
        setIsBiometricActive(false);
        Alert.alert("Success", "Fingerprint login has been turned off.");
      } else {
        // Verify User Fingerprint Before Enabling
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Scan your fingerprint to link to your account",
          fallbackLabel: "Cancel",
          disableDeviceFallback: false,
        });

        if (result.success) {
          await AsyncStorage.setItem("useBiometricLogin", "true");
          setIsBiometricActive(true);
          Alert.alert(
            "Fingerprint Enabled",
            "Your fingerprint is now set up. You can now use your finger to log in anytime."
          );
        } else {
          Alert.alert("Failed", "Fingerprint could not be verified. Try again.");
        }
      }
    } catch (e) {
      Alert.alert("Notice", "Failed to update fingerprint settings.");
    } finally {
      setBiometricSettingUp(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getHeaders();

      // Read local cache first so it never appears blank
      const cachedUserData = await AsyncStorage.getItem("userData");
      if (cachedUserData) {
        try {
          setUserData(JSON.parse(cachedUserData));
        } catch {}
      }

      await checkBiometricStatus();

      const profileEndpoints = [
        `${BASE_URL}/auth/me`,
        `${BASE_URL}/auth/user-profile`,
        `${BASE_URL}/users/profile`,
      ];
      const perfEndpoints = [
        `${BASE_URL}/agent/performance`,
        `${BASE_URL}/agent/stats`,
      ];
      const supEndpoints = [
        `${BASE_URL}/agent/my-supervisor`,
        `${BASE_URL}/agent/supervisor`,
      ];
      const notifEndpoints = [
        `${BASE_URL}/notifications`,
        `${BASE_URL}/user/notifications`,
      ];
      const txEndpoints = [
        `${BASE_URL}/agent/transactions`,
        `${BASE_URL}/transactions`,
        `${BASE_URL}/user/transactions`,
      ];

      const [profileRes, perfRes, supRes, notificationRes, txRes] =
        await Promise.allSettled([
          fetchWithFallback(profileEndpoints, config),
          fetchWithFallback(perfEndpoints, config),
          fetchWithFallback(supEndpoints, config),
          fetchWithFallback(notifEndpoints, config),
          fetchWithFallback(txEndpoints, config),
        ]);

      if (profileRes.status === "fulfilled" && profileRes.value) {
        setUserData(normalizeProfile(profileRes.value));
      }

      if (perfRes.status === "fulfilled" && perfRes.value) {
        const payload = perfRes.value?.data || perfRes.value || {};
        setPerformance((prev) => ({ ...prev, ...payload }));
      }

      if (supRes.status === "fulfilled" && supRes.value) {
        const payload = supRes.value;
        setSupervisor(payload?.data || payload?.supervisor || payload || null);
      }

      if (notificationRes.status === "fulfilled" && notificationRes.value) {
        const list = normalizeList(notificationRes.value);
        setUnreadCount(list.filter((item) => !item?.isRead && !item?.read).length);
      }

      if (txRes.status === "fulfilled" && txRes.value) {
        const rawTxs = normalizeList(txRes.value);
        setRecentTransactions(rawTxs.slice(0, 10));
      }
    } catch {
      // Retain state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const safeNavigate = (screenName, params = {}) => {
    setSidebarOpen(false);
    if (!screenName || screenName === "AgentDashboard") return;

    try {
      navigation.navigate(screenName, {
        fromAgentDashboard: true,
        backScreen: "AgentDashboard",
        ...params,
      });
    } catch {
      Alert.alert("Notice", `The screen '${screenName}' is opening.`);
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
      setSidebarOpen(false);

      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      } catch {}

      navigation.navigate("Login");
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
      Alert.alert("Copied", "Account number copied to clipboard.");
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349075207281";
    const message = "Hello Bellaj Support, I need help with my Agent account.";
    const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(message)}`;
    Linking.openURL(appUrl).catch(() => Linking.openURL(webUrl));
  };

  const agentName = useMemo(() => {
    const name =
      userData?.name ||
      userData?.fullName ||
      `${userData?.firstName || ""} ${userData?.surname || ""}`.trim();
    return name || "Agent";
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
    { icon: "wifi", label: "Buy Data", screen: "BuyData", color: COLORS.primary },
    { icon: "phone-alt", label: "Buy Airtime", screen: "BuyAirtime", color: COLORS.secondary },
    { icon: "bolt", label: "Pay Light Bill", screen: "Electricity", color: "#EAB308" },
    { icon: "tv", label: "Cable TV", screen: "Cable", color: COLORS.purple },
    { icon: "id-card", label: "Check NIN", screen: "NIMC", color: COLORS.accent },
    { icon: "fingerprint", label: "Change NIN", screen: "NIMCModification", color: "#EC4899" },
    { icon: "user-shield", label: "Check BVN", screen: "BVNScreen", color: COLORS.muted },
    { icon: "shield-alt", label: "Validate NIN", screen: "NINValidation", color: COLORS.secondary },
    { icon: "history", label: "Sales Log", screen: "SalesHistory", color: COLORS.orange },
  ];

  // Simplified English for Easy Reading in Sidebar
  const sidebarNavGroups = [
    {
      group: "Selling & Money",
      routes: [
        { title: "Sell to Customer", icon: "cart-plus", action: () => safeNavigate("NewSale") },
        { title: "Add Money to Wallet", icon: "wallet-plus-outline", action: () => safeNavigate("FundWallet") },
        { title: "My Sales History", icon: "history", action: () => safeNavigate("SalesHistory") },
        { title: "My Wallet History", icon: "receipt-text-outline", action: () => safeNavigate("WalletDashboard") },
      ],
    },
    {
      group: "Everyday Services",
      routes: [
        { title: "Buy Data & Airtime", icon: "cellphone-wireless", action: () => safeNavigate("BuyData") },
        { title: "NIN National ID Services", icon: "fingerprint", action: () => safeNavigate("NIMC") },
        { title: "BVN Bank Check", icon: "card-account-details-outline", action: () => safeNavigate("BVNScreen") },
        { title: "Pay Electricity Bill", icon: "flash-outline", action: () => safeNavigate("Electricity") },
      ],
    },
    {
      group: "Account & Help",
      routes: [
        { title: "My Messages & Alerts", icon: "bell-outline", action: () => safeNavigate("Notifications") },
        { title: "My Profile Details", icon: "account-circle-outline", action: () => safeNavigate("Profile") },
        { title: "Chat with Customer Care", icon: "headset", action: openWhatsApp },
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
          <Text style={styles.sidebarBrandTag}>Agent Quick Menu</Text>
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
            Home Dashboard
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
            setLogoutModalVisible(true);
          }}
        >
          <Ionicons name="power" size={18} color="#FCA5A5" />
          <Text style={styles.sidebarLogoutText}>Log Out of App</Text>
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

        {/* Workspace Canvas */}
        <View style={styles.mainCanvas}>
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setSidebarOpen(true)}
              accessibilityLabel="Open Menu"
            >
              <Ionicons name="menu" size={26} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.headerTextBox}>
              <Text style={styles.headerTitle}>Agent Work Station</Text>
              <Text style={styles.headerSubtitle}>
                Welcome, {agentName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => safeNavigate("Notifications")}
              style={styles.notificationBtn}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setLogoutModalVisible(true)}
            >
              <Ionicons name="power" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {loading && !userData ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading Your Dashboard...</Text>
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
                    <Text style={styles.walletLabel}>My Main Balance</Text>
                  </View>
                  <TouchableOpacity onPress={() => safeNavigate("SalesHistory")}>
                    <Text style={styles.historyText}>
                      See History <Ionicons name="chevron-forward" size={12} color={COLORS.white} />
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
                    <Ionicons name="add-circle" size={18} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>ADD MONEY</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.newSaleBtn}
                    onPress={() => safeNavigate("NewSale")}
                    activeOpacity={0.88}
                  >
                    <MaterialCommunityIcons name="cart-plus" size={18} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>SELL NOW</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supportBtn}
                    onPress={openWhatsApp}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#22C55E" />
                    <Text style={styles.actionBtnText}>HELP CHAT</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fingerprint Lock Setup Card */}
              <View style={styles.fingerprintCard}>
                <View style={styles.fingerprintInfo}>
                  <View
                    style={[
                      styles.fingerprintIconCircle,
                      { backgroundColor: isBiometricActive ? "#DCFCE7" : "#FEE2E2" },
                    ]}
                  >
                    <Ionicons
                      name="finger-print"
                      size={24}
                      color={isBiometricActive ? COLORS.secondary : COLORS.danger}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.fingerprintTitle}>Fingerprint Login</Text>
                    <Text style={styles.fingerprintDesc}>
                      {isBiometricActive
                        ? "Active: You can log in using your fingerprint."
                        : "Turn on fingerprint to log in faster next time."}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.fingerprintToggleBtn,
                    { backgroundColor: isBiometricActive ? COLORS.danger : COLORS.secondary },
                  ]}
                  onPress={toggleFingerprintSetup}
                  disabled={biometricSettingUp}
                >
                  {biometricSettingUp ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.fingerprintToggleBtnText}>
                      {isBiometricActive ? "Turn Off" : "Set Up Now"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Performance Metrics Cards */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
                  <Text style={styles.statLabel}>Data Dispatched</Text>
                  <Text style={styles.statValue}>
                    {Number(performance.totalGB || 0).toLocaleString()} <Text style={styles.statUnit}>GB</Text>
                  </Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}>
                  <Text style={styles.statLabel}>Total Sales Made</Text>
                  <Text style={styles.statValue}>
                    ₦{Number(currentSales || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: COLORS.orange }]}>
                  <Text style={styles.statLabel}>My Profit (Commission)</Text>
                  <Text style={[styles.statValue, { color: COLORS.orange }]}>
                    ₦{Number(performance.commissionsEarned || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: COLORS.purple }]}>
                  <Text style={styles.statLabel}>Extra Bonus Earned</Text>
                  <Text style={[styles.statValue, { color: COLORS.purple }]}>
                    ₦{Number(performance.bonusEarned || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Target Card */}
              <View style={styles.targetCard}>
                <View style={styles.targetHeader}>
                  <View>
                    <Text style={styles.targetLabel}>Sales Goal For This Month</Text>
                    <Text style={styles.targetValue}>₦{targetSales.toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.targetLabel}>Work Done</Text>
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
                    Sold so far: <Text style={styles.boldText}>₦{currentSales.toLocaleString()}</Text>
                  </Text>
                  <Text style={styles.remainingText}>
                    Left to complete: <Text style={styles.boldTextRed}>₦{remainingToTarget.toLocaleString()}</Text>
                  </Text>
                </View>
              </View>

              {/* Bank Virtual Account */}
              <Text style={styles.sectionLabel}>Your Transfer Account to Add Money</Text>
              <View style={styles.bankCardsWrapper}>
                {userData?.accountNumber && userData?.accountNumber !== "Initialization Pending" ? (
                  <BankCard
                    bank={userData.bankName || "Wema Bank (Fast Transfer)"}
                    acc={userData.accountNumber}
                    code="BD"
                    onCopy={() => copyToClipboard(userData.accountNumber)}
                  />
                ) : (
                  <BankCard
                    bank="Bank Account Loading"
                    acc="Generating account number..."
                    code="POS"
                    onCopy={() =>
                      Alert.alert("Account Loading", "Your bank account number is preparing. Pull down to refresh.")
                    }
                  />
                )}
              </View>

              {/* POS Services Grid */}
              <Text style={styles.sectionLabel}>Services You Can Sell Now</Text>
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
                        <FontAwesome5 name={service.icon} size={20} color={service.color} />
                      </View>
                      <Text style={styles.gridLabel}>{service.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Recent Sales History Log */}
              <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitle}>Recent Sales & Activity</Text>
                  <TouchableOpacity onPress={() => safeNavigate("SalesHistory")}>
                    <Text style={styles.seeAllText}>See Full List</Text>
                  </TouchableOpacity>
                </View>

                {recentTransactions.length === 0 ? (
                  <View style={styles.emptyHistoryBox}>
                    <Ionicons name="receipt-outline" size={32} color={COLORS.muted} />
                    <Text style={styles.emptyHistoryTitle}>No Sales Yet</Text>
                    <Text style={styles.emptyHistoryText}>
                      When you sell data or airtime, the details will show here right away.
                    </Text>
                  </View>
                ) : (
                  recentTransactions.map((tx, idx) => (
                    <View key={tx?._id || idx} style={styles.txRow}>
                      <View style={styles.txIconCircle}>
                        <MaterialCommunityIcons
                          name={
                            tx?.service === "AIRTIME"
                              ? "phone"
                              : tx?.service === "ELECTRICITY"
                              ? "flash"
                              : "wifi"
                          }
                          size={18}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.txTitle}>
                          {tx?.type || tx?.service || "Data Sale"}
                        </Text>
                        <Text style={styles.txDate}>
                          {tx?.createdAt
                            ? new Date(tx.createdAt).toLocaleDateString()
                            : "Today"}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.txAmount}>
                          ₦{Number(tx?.amount || 0).toLocaleString()}
                        </Text>
                        <Text
                          style={[
                            styles.txStatus,
                            { color: tx?.status === "failed" ? COLORS.danger : COLORS.secondary },
                          ]}
                        >
                          {tx?.status || "Success"}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Regional Supervisor Card */}
              <View style={styles.supervisorCard}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <MaterialCommunityIcons name="shield-account" size={22} color={COLORS.secondary} />
                  <Text style={styles.sectionTitle}>My Team Leader (Supervisor)</Text>
                </View>

                {supervisor ? (
                  <View style={styles.supInfoBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.supName}>
                        {supervisor?.name || supervisor?.fullName || "Supervisor"}
                      </Text>
                      <Text style={styles.supPhone}>
                        {supervisor?.phone || supervisor?.email || "No phone number available"}
                      </Text>
                    </View>
                    {supervisor?.phone ? (
                      <TouchableOpacity
                        style={styles.callSupBtn}
                        onPress={() => Linking.openURL(`tel:${supervisor.phone}`)}
                      >
                        <Ionicons name="call" size={16} color={COLORS.white} />
                        <Text style={styles.callSupText}>Call</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <Text style={styles.infoText}>
                    You are working directly with Head Office. No individual supervisor assigned to your account.
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

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
              <Ionicons name="power" size={30} color={COLORS.danger} />
            </View>
            <Text style={styles.modalHeading}>Do You Want to Log Out?</Text>
            <Text style={styles.modalSubheading}>
              You will be signed out of your agent account. You can log back in with your password or fingerprint.
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
                  <Text style={styles.modalConfirmText}>Yes, Log Out</Text>
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
    <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.light },
  mainLayout: { flex: 1, flexDirection: "row", width: "100%" },

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
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
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
    backgroundColor: "rgba(22, 163, 74, 0.22)",
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  headerSubtitle: {
    color: "#DCFCE7",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  notificationBtn: {
    width: 40,
    height: 40,
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
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: COLORS.white, fontSize: 9, fontWeight: "900" },
  logoutBtn: {
    width: 40,
    height: 40,
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
    padding: 20,
    marginBottom: 16,
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: { color: "#FFE4E4", fontSize: 12, fontWeight: "700" },
  historyText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  balanceContainer: { flexDirection: "row", alignItems: "center", marginVertical: 12 },
  currency: { color: COLORS.white, fontSize: 22, fontWeight: "800" },
  balanceText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: "900",
    marginLeft: 6,
  },
  walletActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  newSaleBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  supportBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 11,
  },

  // Fingerprint Box Styles
  fingerprintCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fingerprintInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  fingerprintIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fingerprintTitle: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "800",
  },
  fingerprintDesc: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  fingerprintToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  fingerprintToggleBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 11, color: COLORS.muted, fontWeight: "800" },
  statValue: { fontSize: 16, fontWeight: "900", color: COLORS.dark, marginTop: 4 },
  statUnit: { fontSize: 12, color: COLORS.muted },
  targetCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  targetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  targetRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  targetLabel: { fontSize: 11, color: COLORS.muted, fontWeight: "700" },
  targetValue: { fontSize: 15, fontWeight: "900", color: COLORS.dark },
  percentageText: { fontSize: 18, fontWeight: "900", color: COLORS.secondary },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginTop: 12,
    overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 4 },
  progressSubText: { fontSize: 11, color: COLORS.muted, fontWeight: "600" },
  remainingText: { fontSize: 11, color: COLORS.muted, fontWeight: "600" },
  boldText: { fontWeight: "900", color: COLORS.dark },
  boldTextRed: { fontWeight: "900", color: COLORS.danger },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  bankCardsWrapper: {
    marginBottom: 16,
  },
  bankBox: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  bankInfo: { flexDirection: "row", alignItems: "center" },
  bankLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  bankLogoText: { color: COLORS.danger, fontWeight: "900", fontSize: 12 },
  bankTitle: { fontSize: 11, color: COLORS.muted, fontWeight: "700" },
  accNo: { fontSize: 15, color: COLORS.dark, fontWeight: "900" },
  servicesContainer: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "31%", alignItems: "center", marginBottom: 14 },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridLabel: {
    color: COLORS.dark,
    fontSize: 11,
    textAlign: "center",
    fontWeight: "800",
  },

  // Sales History Log Component
  historySection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyHistoryBox: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHistoryTitle: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 6,
  },
  emptyHistoryText: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  txIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  txDate: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 2,
  },
  txAmount: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  txStatus: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: 2,
  },

  supervisorCard: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: COLORS.dark },
  supInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  supName: { fontWeight: "900", fontSize: 14, color: COLORS.dark },
  supPhone: { color: COLORS.secondary, marginTop: 2, fontWeight: "700", fontSize: 12 },
  callSupBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  callSupText: { color: COLORS.white, fontWeight: "800", fontSize: 12 },
  infoText: { color: COLORS.muted, fontWeight: "600", fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 6,
    textAlign: "center",
  },
  modalSubheading: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 18,
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: COLORS.dark,
    fontWeight: "800",
    fontSize: 13,
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
    fontSize: 13,
  },
});

export default AgentDashboard;