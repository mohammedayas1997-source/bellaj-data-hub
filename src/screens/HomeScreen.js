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
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { CommonActions } from "@react-navigation/native";
import { ThemeContext } from "../context/ThemeContext";
import BASE_URL from "../config/api";

const { width } = Dimensions.get("window");

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
};

const API_ENDPOINTS = {
  profile: `${BASE_URL}/user/profile`,
  wallet: `${BASE_URL}/wallet/details`,
  notifications: `${BASE_URL}/notifications/unread`,
};

const HomeScreen = ({ navigation }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const [userData, setUserData] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const normalizeUser = (payload) => {
    return payload?.data?.user || payload?.data || payload?.user || payload || null;
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      if (!headers) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const [profileRes, walletRes, notificationRes] = await Promise.allSettled([
        axios.get(API_ENDPOINTS.profile, { headers }),
        axios.get(API_ENDPOINTS.wallet, { headers }),
        axios.get(API_ENDPOINTS.notifications, { headers }),
      ]);

      let profile = null;
      let wallet = null;

      if (profileRes.status === "fulfilled") {
        profile = normalizeUser(profileRes.value.data);
      }

      if (walletRes.status === "fulfilled") {
        wallet = normalizeUser(walletRes.value.data);
      }

      if (notificationRes.status === "fulfilled") {
        const payload = notificationRes.value.data;
        setNotificationCount(payload?.count || payload?.data?.count || 0);
      }

      setUserData({
        ...(profile || {}),
        ...(wallet || {}),
      });
    } catch (error) {
      Alert.alert("Connection Error", "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) {
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
  if (route?.params?.fromSuperAdmin) {
    navigation.navigate("SuperAdminDashboard");
    return;
  }

  if (navigation.canGoBack?.()) {
    navigation.goBack();
    return;
  }

  navigation.navigate("Main");
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
            "token",
            "adminToken",
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

  const safeNavigate = (screenName, params = {}) => {
    try {
      navigation.navigate(screenName, params);
    } catch {
      Alert.alert("Navigation Error", `${screenName} is not registered.`);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text) return;

    await Clipboard.setStringAsync(String(text));

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Copied to clipboard.");
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349075207281";
    const message = "Hello Bellaj Data Hub Support, I need assistance.";

    const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message
    )}`;

    const webUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(
      message
    )}`;

    Linking.openURL(appUrl).catch(() => Linking.openURL(webUrl));
  };

  const userName = useMemo(() => {
    return (
      userData?.name ||
      userData?.fullName ||
      `${userData?.firstName || ""} ${userData?.surname || ""}`.trim() ||
      "Bellaj User"
    );
  }, [userData]);

  const walletBalance = Number(
    userData?.walletBalance || userData?.balance || 0
  );

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

  const accountName =
    userData?.accountName || accounts?.[0]?.accountName || userName;

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Bellaj Dashboard...</Text>
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
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      <LinearGradient
        colors={isDarkMode ? ["#121212", "#0B5E3C"] : ["#ffffff", "#f8fafc"]}
        style={styles.fullScreen}
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

            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => safeNavigate("Notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={27}
                color={isDarkMode ? COLORS.white : COLORS.dark}
              />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text
              style={[
                styles.userName,
                { color: isDarkMode ? COLORS.white : COLORS.dark },
              ]}
            >
              {userName}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
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
          <LinearGradient colors={[COLORS.primary, "#990000"]} style={styles.walletCard}>
            <View style={styles.walletTop}>
              <Text style={styles.walletLabel}>Available Balance</Text>

              <TouchableOpacity onPress={() => safeNavigate("SalesHistory")}>
                <Text style={styles.historyText}>
                  Transactions <Ionicons name="chevron-forward" size={12} />
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.currency}>₦</Text>
              <Text style={styles.balanceText}>
                {isBalanceVisible
                  ? walletBalance.toLocaleString()
                  : "****"}
              </Text>

              <TouchableOpacity
                onPress={() => setIsBalanceVisible(!isBalanceVisible)}
              >
                <Ionicons
                  name={isBalanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color={COLORS.white}
                  style={{ marginLeft: 12 }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.walletActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => safeNavigate("FundWallet")}
              >
                <LinearGradient
                  colors={[COLORS.secondary, "#063B26"]}
                  style={styles.innerBtnGradient}
                >
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

          <View style={styles.statsRow}>
            <StatBox
              label="Transactions"
              value={userData?.totalTransactions || 0}
              icon="receipt-text-outline"
              color={COLORS.primary}
            />
            <StatBox
              label="Data Purchased"
              value={`${userData?.totalData || userData?.totalGB || 0}GB`}
              icon="database-arrow-up-outline"
              color={COLORS.secondary}
            />
          </View>

          <Text style={[styles.sectionLabel, { color: isDarkMode ? COLORS.white : COLORS.dark }]}>
            Funding Account
          </Text>

          <BankCard
            bank={bankName}
            acc={accountNumber || "Generating..."}
            accountName={accountName}
            code="BD"
            onCopy={() => copyToClipboard(accountNumber)}
          />

          <Text style={[styles.sectionLabel, { color: isDarkMode ? COLORS.white : COLORS.dark }]}>
            Bellaj Services
          </Text>

          <View style={styles.servicesContainer}>
            <View style={styles.grid}>
              <ServiceItem icon="wifi" label="Data" color={COLORS.primary} onPress={() => safeNavigate("BuyData")} />
              <ServiceItem icon="phone-alt" label="Airtime" color={COLORS.secondary} onPress={() => safeNavigate("BuyAirtime")} />
              <ServiceItem icon="bolt" label="Electricity" color="#EAB308" onPress={() => safeNavigate("Electricity")} />
              <ServiceItem icon="tv" label="Cable" color="#8B5CF6" onPress={() => safeNavigate("Cable")} />
              <ServiceItem icon="id-card" label="NIMC" color="#F43F5E" onPress={() => safeNavigate("NIMC")} />
              <ServiceItem icon="fingerprint" label="NIN" color="#EC4899" onPress={() => safeNavigate("NINValidation")} />
              <ServiceItem icon="user-shield" label="BVN" color="#64748B" onPress={() => safeNavigate("BVNScreen")} />
              <ServiceItem icon="history" label="History" color="#F97316" onPress={() => safeNavigate("SalesHistory")} />
            </View>
          </View>

          <View style={styles.footerBranding}>
            <Text style={styles.footerHeadline}>WHY BELLAJ DATA HUB?</Text>

            <View style={styles.trustGrid}>
              <TrustItem icon="shield-check" title="Secure" sub="Protected" color="#16A34A" bg="#DCFCE7" />
              <TrustItem icon="flash" title="Instant" sub="Automated" color="#CA8A04" bg="#FEF9C3" />
              <TrustItem icon="headset" title="Support" sub="24/7 Active" color="#0284C7" bg="#E0F2FE" />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <View style={styles.bottomTab}>
        <TabItem icon="home" label="Home" active />
        <TabItem icon="time-outline" label="History" onPress={() => safeNavigate("SalesHistory")} />
        <TabItem icon="person-outline" label="Profile" onPress={() => safeNavigate("Profile")} />
        <TabItem icon="help-buoy-outline" label="Support" onPress={() => safeNavigate("Contact")} />
      </View>
    </View>
  );
};

const BankCard = ({ bank, acc, accountName, code, onCopy }) => (
  <TouchableOpacity style={styles.bankBox} onPress={onCopy} activeOpacity={0.86}>
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

const StatBox = ({ label, value, icon, color }) => (
  <View style={[styles.statBox, { borderLeftColor: color }]}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TrustItem = ({ icon, title, sub, color, bg }) => (
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
    <Ionicons
      name={icon}
      size={24}
      color={active ? COLORS.primary : "#94A3B8"}
    />
    <Text
      style={[
        styles.tabLabel,
        { color: active ? COLORS.primary : "#94A3B8" },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  fullScreen: { flex: 1 },
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.primary,
    fontWeight: "800",
  },
  topHeader: {
    paddingTop: Platform.OS === "android" ? 56 : 38,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
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
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
    backgroundColor: "rgba(15,23,42,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
  welcomeSection: { marginTop: 5 },
  welcomeText: { color: COLORS.muted, fontSize: 14, fontWeight: "600" },
  userName: { fontSize: 24, fontWeight: "900" },
  content: { flex: 1, paddingHorizontal: 16 },
  scrollContent: { paddingBottom: 170, flexGrow: 1 },
  walletCard: {
    borderRadius: 25,
    padding: 22,
    marginBottom: 16,
    elevation: 8,
  },
  walletTop: { flexDirection: "row", justifyContent: "space-between" },
  walletLabel: { color: COLORS.white, fontWeight: "700" },
  historyText: { color: COLORS.white, fontWeight: "800", fontSize: 12 },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  currency: { color: COLORS.white, fontSize: 24, fontWeight: "900" },
  balanceText: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
    marginLeft: 8,
  },
  walletActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: {
    flex: 0.48,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },
  supportBtn: {
    flex: 0.48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  innerBtnGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    marginLeft: 8,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 19,
    fontWeight: "900",
    marginTop: 8,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 12,
    marginTop: 8,
  },
  bankBox: {
    backgroundColor: COLORS.white,
    width: width * 0.88,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bankInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  bankLogoCircle: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bankLogoText: { color: COLORS.primary, fontWeight: "900" },
  bankTitle: { fontSize: 12, color: COLORS.muted, fontWeight: "700" },
  accNo: { fontSize: 19, fontWeight: "900", color: COLORS.dark },
  accountName: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  servicesContainer: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 18,
  },
  gridItem: {
    width: "24%",
    alignItems: "center",
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gridLabel: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "800",
    color: "#374151",
  },
  footerBranding: {
    marginTop: 10,
    paddingBottom: 40,
  },
  footerHeadline: {
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 20,
  },
  trustGrid: { flexDirection: "row", justifyContent: "space-around" },
  trustItem: { alignItems: "center", width: "30%" },
  trustIconCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  trustTitle: { fontWeight: "900", fontSize: 12, color: COLORS.dark },
  trustSub: { fontSize: 10, color: COLORS.muted },
  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
});

export default HomeScreen;