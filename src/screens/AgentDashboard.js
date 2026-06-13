import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  ToastAndroid,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";
import BASE_URL from "../config/api";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  dark2: "#111827",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  profile: `${BASE_URL}/auth/me`,
  performance: `${BASE_URL}/agent/performance`,
  supervisor: `${BASE_URL}/agent/my-supervisor`,
  notifications: `${BASE_URL}/notifications`,
};

const AgentDashboard = ({ navigation }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalSalesValue: 0,
    commissionsEarned: 0,
    bonusEarned: 0,
    monthlyTargetSales: 100000,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const getHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token
      ? {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        }
      : null;
  };

  const normalizeProfile = (payload) =>
    payload?.user || payload?.data?.user || payload?.data || payload || null;

  const normalizeList = (payload) => {
    const data = payload?.data || payload || [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.notifications)) return data.notifications;
    return [];
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const headers = await getHeaders();

      if (!headers) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const [profileRes, perfRes, supRes, notificationRes] =
        await Promise.allSettled([
          axios.get(API_ENDPOINTS.profile, { headers }),
          axios.get(API_ENDPOINTS.performance, { headers }),
          axios.get(API_ENDPOINTS.supervisor, { headers }),
          axios.get(API_ENDPOINTS.notifications, { headers }),
        ]);

      if (profileRes.status === "fulfilled") {
        setUserData(normalizeProfile(profileRes.value.data));
      }

      if (perfRes.status === "fulfilled") {
        const payload = perfRes.value.data?.data || perfRes.value.data || {};
        setPerformance((prev) => ({ ...prev, ...payload }));
      }

      if (supRes.status === "fulfilled") {
        const payload = supRes.value.data;
        setSupervisor(payload?.data || payload?.supervisor || payload || null);
      } else {
        setSupervisor(null);
      }

      if (notificationRes.status === "fulfilled") {
        const list = normalizeList(notificationRes.value.data);
        setUnreadCount(list.filter((item) => item?.read === false).length);
      }
    } catch (error) {
      if (error?.response?.status === 401) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
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

    navigation.navigate("Main");
  };

  const goBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("SuperAdminDashboard");
  };

  const safeNavigate = (screenName, params = {}) => {
    try {
      navigation.navigate(screenName, {
        fromAgentDashboard: true,
        backScreen: "AgentDashboard",
        ...params,
      });
    } catch (error) {
      Alert.alert("Navigation Error", `${screenName} is not registered.`);
    }
  };

  const handleLogout = async () => {
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

  const copyToClipboard = async (text) => {
    if (!text) return;

    await Clipboard.setStringAsync(String(text));

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Copied to clipboard.");
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349061244444";
    const message =
      "Hello Bellaj Data Hub Support, I need assistance with my Agent account.";

    const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`;
    const webUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(
      message
    )}`;

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
  const targetSales = Number(performance.monthlyTargetSales || 0);
  const remainingToTarget = Math.max(targetSales - currentSales, 0);
  const achievementPercentage =
    targetSales > 0
      ? Math.min(Math.round((currentSales / targetSales) * 100), 100)
      : 0;

  const menuItems = [
    {
      label: "Dashboard",
      icon: "view-dashboard-outline",
      type: "mci",
      color: COLORS.primary,
      action: () => safeNavigate("AgentDashboard"),
    },
    {
      label: "Fund Wallet",
      icon: "wallet-plus-outline",
      type: "mci",
      color: COLORS.secondary,
      action: () => safeNavigate("FundWallet"),
    },
    {
      label: "New Sale",
      icon: "cart-plus",
      type: "mci",
      color: "#0F766E",
      action: () => safeNavigate("NewSale"),
    },
    {
      label: "Sales History",
      icon: "receipt-text-outline",
      type: "mci",
      color: "#F97316",
      action: () => safeNavigate("SalesHistory"),
    },
    {
      label: "Wallet History",
      icon: "clock-time-four-outline",
      type: "mci",
      color: "#7C3AED",
      action: () => safeNavigate("Main", { screen: "Wallet History" }),
    },
    {
      label: "Notifications",
      icon: "bell-outline",
      type: "mci",
      color: "#EA580C",
      action: () => safeNavigate("Notifications"),
    },
    {
      label: "Profile",
      icon: "account-circle-outline",
      type: "mci",
      color: COLORS.dark,
      action: () => safeNavigate("Profile"),
    },
    {
      label: "Support",
      icon: "headset",
      type: "mci",
      color: COLORS.secondary,
      action: () => safeNavigate("Contact"),
    },
  ];

  const services = [
    { icon: "wifi", color: COLORS.primary, label: "Data", screen: "BuyData" },
    { icon: "phone-alt", color: COLORS.secondary, label: "Airtime", screen: "BuyAirtime" },
    { icon: "bolt", color: "#EAB308", label: "Power", screen: "Electricity" },
    { icon: "tv", color: "#8B5CF6", label: "Cable", screen: "Cable" },
    { icon: "id-card", color: "#F43F5E", label: "NIMC", screen: "NIMC" },
    { icon: "fingerprint", color: "#EC4899", label: "NIMC Mod", screen: "NIMCModification" },
    { icon: "user-shield", color: "#64748B", label: "BVN", screen: "BVNScreen" },
    { icon: "shield-alt", color: COLORS.secondary, label: "NIN", screen: "NINValidation" },
    { icon: "history", color: "#F97316", label: "History", screen: "SalesHistory" },
  ];

  const renderMenuIcon = (item, size = 22, color = COLORS.white) => {
    if (item.type === "mci") {
      return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
    }

    return <Ionicons name={item.icon} size={size} color={color} />;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Agent Dashboard...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.mainContainer,
        { backgroundColor: isDarkMode ? COLORS.dark : COLORS.light },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={isDarkMode ? [COLORS.dark, "#1A1A1A"] : [COLORS.white, COLORS.light]}
        style={styles.screenBg}
      >
        <View style={styles.topHeader}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDarkMode ? COLORS.white : COLORS.dark}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
              <Ionicons
                name="menu"
                size={26}
                color={isDarkMode ? COLORS.white : COLORS.dark}
              />
            </TouchableOpacity>

            <View style={styles.logoCircle}>
              <Image source={require("../assets/Logo.png")} style={styles.logoImg} />
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => safeNavigate("Notifications")}
                style={styles.notificationBtn}
              >
                <Ionicons
                  name="notifications-outline"
                  size={27}
                  color={isDarkMode ? COLORS.white : COLORS.dark}
                />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Bellaj Agent Panel</Text>
            <Text
              style={[
                styles.userName,
                { color: isDarkMode ? COLORS.white : COLORS.dark },
              ]}
            >
              {agentName}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          <LinearGradient colors={[COLORS.primary, "#990000"]} style={styles.walletCard}>
            <View style={styles.walletTop}>
              <Text style={styles.walletLabel}>Agent Available Balance</Text>
              <TouchableOpacity onPress={() => safeNavigate("Main", { screen: "Wallet History" })}>
                <Text style={styles.historyText}>
                  Transactions <Ionicons name="chevron-forward" size={12} />
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
                  size={24}
                  color={COLORS.white}
                  style={{ marginLeft: 15 }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.walletActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => safeNavigate("FundWallet")}>
                <LinearGradient colors={[COLORS.secondary, "#063B26"]} style={styles.innerBtnGradient}>
                  <Ionicons name="add-circle" size={18} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>FUND WALLET</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.supportBtn} onPress={openWhatsApp}>
                <Ionicons name="logo-whatsapp" size={18} color="#22C55E" />
                <Text style={styles.actionBtnText}>SUPPORT</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.drawerPanel}>
            <Text style={styles.panelTitle}>Agent Navigation</Text>

            <View style={styles.navGrid}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.navCard}
                  onPress={item.action}
                  activeOpacity={0.86}
                >
                  <View style={[styles.navIconBox, { backgroundColor: item.color }]}>
                    {renderMenuIcon(item, 24, COLORS.white)}
                  </View>
                  <Text style={styles.navTitle}>{item.label}</Text>
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>OPEN</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Automatic Funding Accounts</Text>

          {userData?.accountNumber && userData?.accountNumber !== "Initialization Pending" ? (
            <BankCard
              bank={userData.bankName || "Wema Bank"}
              acc={userData.accountNumber}
              code="BD"
              isDarkMode={isDarkMode}
              onCopy={() => copyToClipboard(userData.accountNumber)}
            />
          ) : (
            <BankCard
              bank="Bellaj Account Pending"
              acc="Generating..."
              code="BD"
              isDarkMode={isDarkMode}
              onCopy={() =>
                Alert.alert(
                  "Account Pending",
                  "Your virtual account is being generated automatically."
                )
              }
            />
          )}

          <BankCard
            bank="Paystack Terminal"
            acc="Automated Funding"
            code="PAY"
            isDarkMode={isDarkMode}
            onCopy={() =>
              Alert.alert(
                "Funding Note",
                "Transfer to your assigned account for automated wallet credit."
              )
            }
          />

          <Text style={styles.sectionLabel}>Performance Metrics</Text>

          <View style={styles.statsGrid}>
            <StatCard
              title="Monthly Volume"
              value={performance.totalGB || 0}
              unit="GB"
              color={COLORS.primary}
            />
            <StatCard
              title="Monthly Revenue"
              value={`₦${currentSales.toLocaleString()}`}
              unit=""
              color={COLORS.secondary}
            />
          </View>

          <View style={styles.statsGridAlt}>
            <StatCard
              title="Commissions"
              value={`₦${Number(performance.commissionsEarned || 0).toLocaleString()}`}
              unit=""
              color="#F97316"
            />
            <StatCard
              title="Bonus"
              value={`₦${Number(performance.bonusEarned || 0).toLocaleString()}`}
              unit=""
              color="#DC2626"
            />
          </View>

          <View style={styles.targetTrackingSection}>
            <Text style={styles.sectionTitle}>Target & Performance Tracking</Text>

            <View style={styles.targetCard}>
              <View style={styles.targetRow}>
                <View>
                  <Text style={styles.targetLabel}>Monthly Target</Text>
                  <Text style={styles.targetValue}>₦{targetSales.toLocaleString()}</Text>
                </View>

                <View style={styles.rightAlign}>
                  <Text style={styles.targetLabel}>Achievement</Text>
                  <Text style={styles.percentageText}>{achievementPercentage}%</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: `${achievementPercentage}%` }]} />
              </View>

              <View style={styles.targetRowAlt}>
                <Text style={styles.progressSubText}>
                  Current: <Text style={styles.boldText}>₦{currentSales.toLocaleString()}</Text>
                </Text>
                <Text style={styles.remainingText}>
                  Remaining:{" "}
                  <Text style={styles.boldTextRed}>₦{remainingToTarget.toLocaleString()}</Text>
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Bellaj Agent Services</Text>

          <View style={styles.servicesContainer}>
            <View style={styles.grid}>
              {services.map((service, index) => (
                <ServiceItem
                  key={index}
                  icon={service.icon}
                  color={service.color}
                  label={service.label}
                  onPress={() => safeNavigate(service.screen)}
                />
              ))}
            </View>
          </View>

          <View style={styles.supervisorSection}>
            <Text style={styles.sectionTitle}>Assigned Supervisor</Text>

            <View style={styles.infoBox}>
              {supervisor ? (
                <View>
                  <Text style={styles.supName}>
                    {supervisor?.name || supervisor?.fullName || "Supervisor"}
                  </Text>
                  <Text style={styles.supPhone}>
                    {supervisor?.phone || supervisor?.email || "No contact available"}
                  </Text>
                </View>
              ) : (
                <Text style={styles.infoText}>No supervisor assigned yet.</Text>
              )}
            </View>
          </View>

          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Quick Agent Actions</Text>

            <TouchableOpacity style={styles.actionBtnFull} onPress={() => safeNavigate("NewSale")}>
              <Text style={styles.actionBtnTextFull}>Process New Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnFullAlt}
              onPress={() => safeNavigate("SalesHistory")}
            >
              <Text style={styles.actionBtnTextFull}>View Sales History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerBranding}>
            <Text style={styles.footerHeadline}>Why Choose Bellaj Data Hub?</Text>

            <View style={styles.trustGrid}>
              <TrustItem icon="shield-check" color={COLORS.secondary} bg={COLORS.softGreen} title="100% Secure" sub="Encrypted" />
              <TrustItem icon="flash" color="#CA8A04" bg="#FEF9C3" title="Instant" sub="Automated" />
              <TrustItem icon="headset" color={COLORS.primary} bg={COLORS.softRed} title="24/7 Support" sub="Reliable" />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <View style={styles.bottomTab}>
        <TabItem icon="home" label="Dashboard" active onPress={() => {}} />
        <TabItem icon="time-outline" label="History" onPress={() => safeNavigate("Main", { screen: "Wallet History" })} />
        <TabItem icon="person-outline" label="Profile" onPress={() => safeNavigate("Profile")} />
        <TabItem icon="help-buoy-outline" label="Support" onPress={() => safeNavigate("Contact")} />
      </View>
    </View>
  );
};

const BankCard = ({ bank, acc, code, onCopy, isDarkMode }) => (
  <TouchableOpacity
    style={[styles.bankBox, isDarkMode && { backgroundColor: "#1E293B" }]}
    onPress={onCopy}
    activeOpacity={0.86}
  >
    <View style={styles.bankInfo}>
      <View style={styles.bankLogoCircle}>
        <Text style={styles.bankLogoText}>{code}</Text>
      </View>

      <View>
        <Text style={styles.bankTitle}>{bank}</Text>
        <Text style={[styles.accNo, isDarkMode && { color: COLORS.white }]}>{acc}</Text>
      </View>
    </View>

    <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
  </TouchableOpacity>
);

const ServiceItem = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.86}>
    <View style={styles.iconBox}>
      <FontAwesome5 name={icon} size={20} color={color} />
    </View>
    <Text style={styles.gridLabel}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ title, value, unit, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statLabel}>{title}</Text>
    <Text style={styles.statValue}>
      {value} <Text style={styles.statUnit}>{unit}</Text>
    </Text>
  </View>
);

const TrustItem = ({ icon, color, bg, title, sub }) => (
  <View style={styles.trustItem}>
    <View style={[styles.trustIconCircle, { backgroundColor: bg }]}>
      {icon === "flash" ? (
        <Ionicons name={icon} size={28} color={color} />
      ) : (
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      )}
    </View>
    <Text style={styles.trustTitle}>{title}</Text>
    <Text style={styles.trustSub}>{sub}</Text>
  </View>
);

const TabItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={active ? COLORS.primary : "#94A3B8"} />
    <Text style={[styles.tabLabel, { color: active ? COLORS.primary : "#94A3B8" }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1, width: "100%" },
  screenBg: { flex: 1 },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  loaderText: { marginTop: 12, color: COLORS.primary, fontWeight: "800" },
  topHeader: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 56 : 38,
    paddingBottom: 16,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 8,
  },
  headerActions: { flexDirection: "row", alignItems: "center", marginLeft: "auto" },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationBtn: { marginRight: 12 },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  logoCircle: {
    width: 46,
    height: 46,
    backgroundColor: COLORS.white,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImg: { width: 34, height: 34, resizeMode: "contain" },
  welcomeSection: { marginBottom: 8 },
  welcomeText: { color: COLORS.muted, fontSize: 14, fontWeight: "600" },
  userName: { fontSize: 25, fontWeight: "900" },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 180,
    flexGrow: 1,
  },
  walletCard: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 18,
    elevation: 10,
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: { color: "#FFE4E4", fontSize: 13, fontWeight: "700" },
  historyText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  balanceContainer: { flexDirection: "row", alignItems: "center", marginVertical: 15 },
  currency: { color: COLORS.white, fontSize: 24, fontWeight: "700" },
  balanceText: {
    color: COLORS.white,
    fontSize: 35,
    fontWeight: "900",
    marginLeft: 8,
  },
  walletActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  actionBtn: { flex: 0.48, height: 48, borderRadius: 15, overflow: "hidden" },
  supportBtn: {
    flex: 0.48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerBtnGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
    marginLeft: 8,
  },
  drawerPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  panelTitle: { color: COLORS.dark, fontSize: 18, fontWeight: "900", marginBottom: 14 },
  navGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  navCard: {
    width: "48%",
    backgroundColor: COLORS.light,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 145,
  },
  navIconBox: {
    width: 56,
    height: 56,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  navTitle: { color: COLORS.dark, fontSize: 14, fontWeight: "900" },
  openBadge: {
    marginTop: "auto",
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  openBadgeText: { color: COLORS.secondary, fontSize: 10, fontWeight: "900" },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 15,
    marginBottom: 15,
    paddingLeft: 4,
  },
  bankBox: {
    backgroundColor: COLORS.white,
    width: width * 0.86,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bankInfo: { flexDirection: "row", alignItems: "center" },
  bankLogoCircle: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bankLogoText: { color: COLORS.primary, fontWeight: "900", fontSize: 12 },
  bankTitle: { fontSize: 12, color: COLORS.muted, fontWeight: "700" },
  accNo: { fontSize: 17, color: COLORS.dark, fontWeight: "900" },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  statsGridAlt: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  statCard: {
    backgroundColor: COLORS.white,
    width: "48%",
    padding: 15,
    borderRadius: 18,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "800" },
  statValue: { fontSize: 18, fontWeight: "900", color: COLORS.dark, marginTop: 5 },
  statUnit: { fontSize: 12, color: "#94A3B8" },
  targetTrackingSection: { marginTop: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "900", color: COLORS.dark, marginBottom: 10 },
  targetCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  targetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  targetRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  targetLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "700" },
  targetValue: { fontSize: 16, fontWeight: "900", color: COLORS.dark },
  rightAlign: { alignItems: "flex-end" },
  percentageText: { fontSize: 20, fontWeight: "900", color: COLORS.secondary },
  progressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    marginTop: 15,
    overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: COLORS.secondary, borderRadius: 5 },
  progressSubText: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  remainingText: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  boldText: { fontWeight: "900", color: COLORS.dark },
  boldTextRed: { fontWeight: "900", color: COLORS.primary },
  servicesContainer: {
    borderRadius: 24,
    padding: 18,
    elevation: 4,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "31%", alignItems: "center", marginBottom: 22 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 19,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridLabel: {
    color: "#475569",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "800",
  },
  supervisorSection: { marginBottom: 20 },
  infoBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  infoText: { color: COLORS.muted, fontWeight: "700" },
  supName: { fontWeight: "900", fontSize: 16, color: COLORS.dark },
  supPhone: { color: COLORS.secondary, marginTop: 4, fontWeight: "700" },
  actionSection: { marginBottom: 20 },
  actionBtnFull: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  actionBtnFullAlt: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  actionBtnTextFull: { color: COLORS.white, fontWeight: "900" },
  footerBranding: {
    marginTop: 10,
    paddingBottom: 40,
    backgroundColor: COLORS.light,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  footerHeadline: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 15,
    color: COLORS.primary,
  },
  trustGrid: { flexDirection: "row", justifyContent: "space-around" },
  trustItem: { alignItems: "center", width: "30%" },
  trustIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
    color: COLORS.dark,
    textAlign: "center",
  },
  trustSub: { fontSize: 10, color: COLORS.muted, textAlign: "center" },
  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    height: 85,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 20,
    elevation: 20,
  },
  tabItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: "800" },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
});

export default AgentDashboard;