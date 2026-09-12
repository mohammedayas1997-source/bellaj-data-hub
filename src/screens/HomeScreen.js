import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
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
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as LocalAuthentication from "expo-local-authentication";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FEF2F2",
  softGreen: "#DCFCE7",
  danger: "#DC2626",
  accent: "#2563EB",
  purple: "#7C3AED",
  orange: "#EA580C",
  sidebarBg: "#062819",
  sidebarBorder: "#0c3b26",
};

const HomeScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 992;

  const [userData, setUserData] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sidebar Controls
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Biometric Setup State
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  // Logout Modal Controls
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutProcessing, setLogoutProcessing] = useState(false);

  const getAuthHeaders = async () => {
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

  const normalizeUser = (payload) => {
    return (
      payload?.data?.user ||
      payload?.data?.profile ||
      payload?.user ||
      payload?.profile ||
      payload?.data ||
      payload ||
      null
    );
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
            "Fingerprint Not Ready",
            "Please register a fingerprint or face scan on your device settings first."
          );
          return;
        }

        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: "Confirm Biometric for Bellaj Hub Login",
          fallbackLabel: "Use Password",
        });

        if (auth.success) {
          await AsyncStorage.setItem("useBiometricLogin", "true");
          setBiometricEnabled(true);
          Alert.alert("Success", "Fingerprint login has been activated.");
        } else {
          setBiometricEnabled(false);
        }
      } catch {
        Alert.alert("Notice", "Biometric setup could not be completed.");
      }
    } else {
      await AsyncStorage.setItem("useBiometricLogin", "false");
      setBiometricEnabled(false);
      Alert.alert("Notice", "Fingerprint login has been disabled.");
    }
  };

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      // Read local cache immediately to prevent layout shifts
      const cached = await AsyncStorage.getItem("userData");
      if (cached) {
        try {
          setUserData(JSON.parse(cached));
        } catch {}
      }

      await checkBiometricSetup();

      const profileEndpoints = [
        `${BASE_URL}/auth/me`,
        `${BASE_URL}/user/profile`,
        `${BASE_URL}/users/profile`,
      ];
      const walletEndpoints = [
        `${BASE_URL}/wallet/details`,
        `${BASE_URL}/wallet/balance`,
        `${BASE_URL}/user/wallet`,
      ];
      const notificationEndpoints = [
        `${BASE_URL}/notifications/unread`,
        `${BASE_URL}/notifications`,
      ];

      const [profileRes, walletRes, notifRes] = await Promise.allSettled([
        fetchWithFallback(profileEndpoints, config),
        fetchWithFallback(walletEndpoints, config),
        fetchWithFallback(notificationEndpoints, config),
      ]);

      let profileData = {};
      let walletData = {};

      if (profileRes.status === "fulfilled" && profileRes.value) {
        profileData = normalizeUser(profileRes.value) || {};
      }

      if (walletRes.status === "fulfilled" && walletRes.value) {
        walletData = normalizeUser(walletRes.value) || {};
      }

      if (notifRes.status === "fulfilled" && notifRes.value) {
        const payload = notifRes.value;
        setNotificationCount(
          payload?.count ??
          payload?.data?.count ??
          (Array.isArray(payload?.data) ? payload.data.filter((n) => !n.isRead).length : 0)
        );
      }

      const merged = { ...profileData, ...walletData };
      if (Object.keys(merged).length > 0) {
        setUserData(merged);
        await AsyncStorage.setItem("userData", JSON.stringify(merged));
      }
    } catch {
      // Retain state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkBiometricSetup]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const goBack = () => {
    if (route?.params?.backScreen && route.params.backScreen !== "Dashboard") {
      navigation.navigate(route.params.backScreen);
      return;
    }
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
  };

  const safeNavigate = (screenName, params = {}) => {
    setSidebarOpen(false);
    if (!screenName || screenName === "Dashboard") return;

    try {
      navigation.navigate(screenName, {
        fromHome: true,
        backScreen: "Dashboard",
        ...params,
      });
    } catch {
      Alert.alert("Module Notice", `Screen '${screenName}' is loading.`);
    }
  };

  const performLogout = async () => {
    try {
      setLogoutProcessing(true);
      await AsyncStorage.multiRemove([
        "userToken",
        "token",
        "adminToken",
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
      Alert.alert("Copied", "Account details copied to clipboard.");
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349075207281";
    const message = "Hello Bellaj Support, I need assistance with my account.";
    const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(message)}`;
    Linking.openURL(appUrl).catch(() => Linking.openURL(webUrl));
  };

  const userName = useMemo(() => {
    return (
      userData?.name ||
      userData?.fullName ||
      `${userData?.firstName || ""} ${userData?.surname || ""}`.trim() ||
      "Subscriber"
    );
  }, [userData]);

  const walletBalance = Number(userData?.walletBalance || userData?.balance || 0);

  const accounts =
    userData?.virtualAccounts ||
    userData?.accounts ||
    userData?.bankAccounts ||
    [];

  const accountNumber =
    userData?.accountNumber ||
    userData?.accountNo ||
    accounts?.[0]?.accountNumber ||
    accounts?.[0]?.accountNo;

  const bankName =
    userData?.bankName || userData?.bank || accounts?.[0]?.bankName || "Wema Bank";

  const accountName = userData?.accountName || accounts?.[0]?.accountName || userName;

  const quickServices = [
    { icon: "wifi", label: "Buy Data", screen: "BuyData", color: COLORS.primary },
    { icon: "phone-alt", label: "Airtime", screen: "BuyAirtime", color: COLORS.secondary },
    { icon: "bolt", label: "Electricity", screen: "Electricity", color: "#EAB308" },
    { icon: "tv", label: "Cable TV", screen: "Cable", color: COLORS.purple },
    { icon: "id-card", label: "NIMC Portal", screen: "NIMC", color: COLORS.accent },
    { icon: "fingerprint", label: "NIN Verify", screen: "NINValidation", color: "#EC4899" },
    { icon: "user-shield", label: "BVN Service", screen: "BVNScreen", color: COLORS.muted },
    { icon: "history", label: "History", screen: "SalesHistory", color: COLORS.orange },
  ];

  const sidebarNavGroups = [
    {
      group: "Primary Actions",
      routes: [
        { title: "Buy Data & Airtime", icon: "cellphone-wireless", action: () => safeNavigate("BuyData") },
        { title: "Fund Wallet Balance", icon: "wallet-plus-outline", action: () => safeNavigate("FundWallet") },
        { title: "Transaction History", icon: "history", action: () => safeNavigate("SalesHistory") },
        { title: "Electricity & Utilities", icon: "flash-outline", action: () => safeNavigate("Electricity") },
      ],
    },
    {
      group: "Verification Portals",
      routes: [
        { title: "NIMC Verification Desk", icon: "fingerprint", action: () => safeNavigate("NIMC") },
        { title: "BVN Verification Queue", icon: "card-account-details-outline", action: () => safeNavigate("BVNScreen") },
        { title: "Cable TV Subscription", icon: "television", action: () => safeNavigate("Cable") },
      ],
    },
    {
      group: "Account & Support",
      routes: [
        { title: "Notifications & News", icon: "bell-outline", action: () => safeNavigate("Notifications") },
        { title: "Profile Credentials", icon: "account-circle-outline", action: () => safeNavigate("Profile") },
        { title: "Customer Support Desk", icon: "headset", action: openWhatsApp },
      ],
    },
  ];

  const renderSidebarContent = () => (
    <View style={styles.sidebarInner}>
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarBadgeBox}>
          <MaterialCommunityIcons name="shield-check" size={26} color={COLORS.white} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.sidebarBrandTitle}>Bellaj Data Hub</Text>
          <Text style={styles.sidebarBrandTag}>Subscriber Command Portal</Text>
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
            Home Overview
          </Text>
        </TouchableOpacity>

        {/* Unified Fingerprint Setup Section in Sidebar */}
        <View style={styles.biometricSection}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons
              name="fingerprint"
              size={22}
              color={biometricEnabled ? COLORS.secondary : "#CBD5E1"}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.biometricTitle}>Fingerprint Login</Text>
              <Text style={styles.biometricSubText}>
                {biometricSupported
                  ? biometricEnabled
                    ? "Active for device login"
                    : "Tap switch to enable"
                  : "Not configured on device"}
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
            setSidebarOpen(false);
            setLogoutModalVisible(true);
          }}
        >
          <Ionicons name="power" size={18} color="#FCA5A5" />
          <Text style={styles.sidebarLogoutText}>Sign Out of Session</Text>
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
          {/* Top Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setSidebarOpen(true)}
              accessibilityLabel="Open Navigation Sidebar"
            >
              <Ionicons name="menu" size={26} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.headerTextBox}>
              <Text style={styles.headerTitle}>Bellaj Data Hub</Text>
              <Text style={styles.headerSubtitle}>
                Welcome, {userName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => safeNavigate("Notifications")}
              style={styles.notificationBtn}
            >
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => setLogoutModalVisible(true)}
              accessibilityLabel="Sign Out"
            >
              <Ionicons name="power" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {loading && !userData ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loaderText}>Loading dashboard balance...</Text>
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
              {/* Liquidity Balance Card */}
              <View style={styles.walletCard}>
                <View style={styles.walletTop}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MaterialCommunityIcons name="wallet-outline" size={18} color="#BBF7D0" />
                    <Text style={styles.walletLabel}>Available Wallet Liquidity</Text>
                  </View>
                  <TouchableOpacity onPress={() => safeNavigate("SalesHistory")}>
                    <Text style={styles.historyText}>
                      Transactions <Ionicons name="chevron-forward" size={12} color={COLORS.white} />
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceContainer}>
                  <Text style={styles.currency}>₦</Text>
                  <Text style={styles.balanceText}>
                    {isBalanceVisible ? walletBalance.toLocaleString() : "****"}
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
                    <Text style={styles.actionBtnText}>FUND WALLET</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supportBtn}
                    onPress={openWhatsApp}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#22C55E" />
                    <Text style={styles.actionBtnText}>SUPPORT</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Transactions Stats Cards */}
              <View style={styles.statsRow}>
                <View style={[styles.statBox, { borderLeftColor: COLORS.primary }]}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={24} color={COLORS.primary} />
                  <Text style={styles.statValue}>
                    {Number(userData?.totalTransactions || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.statLabel}>Orders Completed</Text>
                </View>

                <View style={[styles.statBox, { borderLeftColor: COLORS.secondary }]}>
                  <MaterialCommunityIcons name="database-arrow-up-outline" size={24} color={COLORS.secondary} />
                  <Text style={styles.statValue}>
                    {Number(userData?.totalData || userData?.totalGB || 0).toLocaleString()} <Text style={styles.statUnit}>GB</Text>
                  </Text>
                  <Text style={styles.statLabel}>Total Data Volume</Text>
                </View>
              </View>

              {/* Virtual Funding Bank Card */}
              <Text style={styles.sectionLabel}>Automated Funding Account</Text>
              <BankCard
                bank={bankName}
                acc={accountNumber || "Generating account..."}
                accountName={accountName}
                code="BD"
                onCopy={() => copyToClipboard(accountNumber)}
              />

              {/* Retail Telecommunications & Identity Services */}
              <Text style={styles.sectionLabel}>Telecom & Identity Portals</Text>
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

              {/* Trust Indicators Footer */}
              <View style={styles.footerBranding}>
                <Text style={styles.footerHeadline}>WHY BELLAJ DATA HUB?</Text>
                <View style={styles.trustGrid}>
                  <TrustItem icon="shield-check" title="Secure" sub="Protected" color="#16A34A" bg="#DCFCE7" />
                  <TrustItem icon="flash" title="Instant" sub="Automated" color="#CA8A04" bg="#FEF9C3" />
                  <TrustItem icon="headset" title="Support" sub="24/7 Active" color="#0284C7" bg="#E0F2FE" />
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Cross-Platform Universal Logout Dialog */}
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
            <Text style={styles.modalHeading}>Sign Out of Session?</Text>
            <Text style={styles.modalSubheading}>
              Are you sure you want to log out from this device?
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
                  <Text style={styles.modalConfirmText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const BankCard = ({ bank, acc, accountName, code, onCopy }) => (
  <TouchableOpacity style={styles.bankBox} onPress={onCopy} activeOpacity={0.88}>
    <View style={styles.bankInfo}>
      <View style={styles.bankLogoCircle}>
        <Text style={styles.bankLogoText}>{code}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.bankTitle}>{bank}</Text>
        <Text style={styles.accNo}>{acc}</Text>
        <Text style={styles.accountName}>{accountName}</Text>
      </View>
    </View>
    <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
  </TouchableOpacity>
);

const TrustItem = ({ icon, title, sub, color, bg }) => (
  <View style={styles.trustItem}>
    <View style={[styles.trustIconCircle, { backgroundColor: bg }]}>
      {icon === "flash" ? (
        <Ionicons name={icon} size={26} color={color} />
      ) : (
        <MaterialCommunityIcons name={icon} size={26} color={color} />
      )}
    </View>
    <Text style={styles.trustTitle}>{title}</Text>
    <Text style={styles.trustSub}>{sub}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.light },
  mainLayout: { flex: 1, flexDirection: "row", width: "100%" },

  // Desktop Fixed Sidebar
  desktopSidebar: {
    width: 280,
    backgroundColor: COLORS.sidebarBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.sidebarBorder,
  },

  // Mobile Slide Modal Sidebar
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

  biometricSection: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  biometricTitle: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  biometricSubText: { color: "#94A3B8", fontSize: 10, marginTop: 2 },

  sidebarSection: { marginTop: 14 },
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
    fontSize: 11,
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
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  statUnit: { fontSize: 11, color: COLORS.muted },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  bankBox: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  bankInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
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
  accNo: { fontSize: 16, fontWeight: "900", color: COLORS.dark },
  accountName: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  servicesContainer: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  gridItem: {
    width: "24%",
    alignItems: "center",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridLabel: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "800",
    color: COLORS.dark,
  },
  footerBranding: {
    marginTop: 10,
    paddingBottom: 40,
  },
  footerHeadline: {
    textAlign: "center",
    fontWeight: "900",
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 16,
  },
  trustGrid: { flexDirection: "row", justifyContent: "space-around" },
  trustItem: { alignItems: "center", width: "30%" },
  trustIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  trustTitle: { fontWeight: "900", fontSize: 12, color: COLORS.dark },
  trustSub: { fontSize: 10, color: COLORS.muted },
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

export default HomeScreen;