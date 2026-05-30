import React, { useState, useEffect, useContext } from "react";
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
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  profile: "",
  performance: "",
  supervisor: "",
  notifications: "",
};

const AgentDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isDarkMode } = useContext(ThemeContext);

  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalSalesValue: 0,
    commissionsEarned: 0,
    bonusEarned: 0,
    monthlyTargetSales: 100000,
  });

  const [supervisor, setSupervisor] = useState(null);

  const fetchAgentAndProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        setLoading(false);
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      };

      if (
        !API_ENDPOINTS.profile &&
        !API_ENDPOINTS.performance &&
        !API_ENDPOINTS.supervisor
      ) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [profileRes, perfRes, supRes] = await Promise.all([
        API_ENDPOINTS.profile
          ? axios
              .get(API_ENDPOINTS.profile, config)
              .catch(() => ({ data: { success: false } }))
          : Promise.resolve({ data: { success: false } }),

        API_ENDPOINTS.performance
          ? axios
              .get(API_ENDPOINTS.performance, config)
              .catch(() => ({ data: { data: null } }))
          : Promise.resolve({ data: { data: null } }),

        API_ENDPOINTS.supervisor
          ? axios
              .get(API_ENDPOINTS.supervisor, config)
              .catch(() => ({ data: { data: null } }))
          : Promise.resolve({ data: { data: null } }),
      ]);

      if (profileRes.data?.success) {
        setUserData(profileRes.data.user || profileRes.data.data);
      }

      if (perfRes.data?.data) {
        setPerformance(perfRes.data.data);
      }

      if (supRes.data?.data) {
        setSupervisor(supRes.data.data);
      } else {
        setSupervisor("No Supervisor Assigned Yet");
      }
    } catch (err) {
      console.log("Bellaj Agent Dashboard Fetch Error:", err);

      if (err.response?.status === 401) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!API_ENDPOINTS.notifications) return;

      const response = await axios.get(API_ENDPOINTS.notifications);
      const data = response.data || [];
      const unread = data.filter((n) => n.read === false).length;

      setUnreadCount(unread);
    } catch (error) {
      console.log("Notification fetch error:", error);
    }
  };

  useEffect(() => {
    fetchAgentAndProfileData();
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentAndProfileData();
    fetchNotifications();
  };

  const copyToClipboard = async (text) => {
    if (!text) return;

    await Clipboard.setStringAsync(text);

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349061244444";
    const message =
      "Hello Bellaj Data Hub Support, I need assistance with my Agent account.";

    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message,
    )}`;

    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://wa.me/${phoneNumber.replace("+", "")}`),
    );
  };

  const currentSales = performance.totalSalesValue || 0;
  const targetSales = performance.monthlyTargetSales || 0;
  const remainingToTarget =
    targetSales - currentSales > 0 ? targetSales - currentSales : 0;

  const achievementPercentage =
    targetSales > 0
      ? Math.min(Math.round((currentSales / targetSales) * 100), 100)
      : 0;

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        }),
      );
    } catch (error) {
      console.log("Logout Error:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
        colors={
          isDarkMode ? [COLORS.dark, "#1A1A1A"] : [COLORS.white, COLORS.light]
        }
        style={styles.screenBg}
      >
        <View style={styles.topHeader}>
          <View style={styles.navRow}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/Logo.png")}
                style={styles.logoImg}
              />
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Notifications")}
                style={styles.notificationBtn}
              >
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color={isDarkMode ? COLORS.white : COLORS.dark}
                />

                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.openDrawer()}>
                <Ionicons
                  name="menu"
                  size={32}
                  color={isDarkMode ? COLORS.white : COLORS.dark}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Bellaj Agent Panel,</Text>

            <Text
              style={[
                styles.userName,
                { color: isDarkMode ? COLORS.white : COLORS.dark },
              ]}
            >
              {userData
                ? `${userData.firstName || userData.name || ""} ${
                    userData.surname || ""
                  }`
                : "Agent"}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 180,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          <LinearGradient
            colors={[COLORS.primary, "#990000"]}
            style={styles.walletCard}
          >
            <View style={styles.walletTop}>
              <Text style={styles.walletLabel}>Agent Available Balance</Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Main", { screen: "Wallet History" })
                }
              >
                <Text style={styles.historyText}>
                  Transactions <Ionicons name="chevron-forward" size={12} />
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.currency}>₦</Text>

              <Text style={styles.balanceText}>
                {isBalanceVisible
                  ? userData?.walletBalance || userData?.balance || "0.00"
                  : "****"}
              </Text>

              <TouchableOpacity
                onPress={() => setIsBalanceVisible(!isBalanceVisible)}
              >
                <Ionicons
                  name={isBalanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color={COLORS.white}
                  style={{ marginLeft: 15 }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.walletActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate("FundWallet")}
              >
                <LinearGradient
                  colors={[COLORS.secondary, "#063B26"]}
                  style={styles.innerBtnGradient}
                >
                  <Ionicons name="add-circle" size={18} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>FUND WALLET</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportBtn}
                onPress={openWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#22C55E" />
                <Text style={styles.actionBtnText}>SUPPORT</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Automatic Funding Accounts</Text>

          {userData?.accountNumber &&
          userData?.accountNumber !== "Initialization Pending" ? (
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
                  "Wait",
                  "Your unique virtual agent account is being provisioned automatically.",
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
                "Note",
                "Transfer to your assigned account for instant automated wallet credit.",
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
              value={`₦${currentSales}`}
              unit=""
              color={COLORS.secondary}
            />
          </View>

          <View style={styles.statsGridAlt}>
            <StatCard
              title="Commissions Earned"
              value={`₦${performance.commissionsEarned || 0}`}
              unit=""
              color="#F97316"
            />

            <StatCard
              title="Bonus Earned"
              value={`₦${performance.bonusEarned || 0}`}
              unit=""
              color="#DC2626"
            />
          </View>

          <View style={styles.targetTrackingSection}>
            <Text style={styles.sectionTitle}>
              Target & Performance Tracking
            </Text>

            <View style={styles.targetCard}>
              <View style={styles.targetRow}>
                <View>
                  <Text style={styles.targetLabel}>Monthly Target</Text>
                  <Text style={styles.targetValue}>₦{targetSales}</Text>
                </View>

                <View style={styles.rightAlign}>
                  <Text style={styles.targetLabel}>Achievement</Text>
                  <Text style={styles.percentageText}>
                    {achievementPercentage}%
                  </Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${achievementPercentage}%` },
                  ]}
                />
              </View>

              <View style={styles.targetRowAlt}>
                <Text style={styles.progressSubText}>
                  Current: <Text style={styles.boldText}>₦{currentSales}</Text>
                </Text>

                <Text style={styles.remainingText}>
                  Remaining:{" "}
                  <Text style={styles.boldTextRed}>₦{remainingToTarget}</Text>
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Bellaj Agent Services</Text>

          <View style={styles.servicesContainer}>
            <View style={styles.grid}>
              <ServiceItem
                icon="wifi"
                color={COLORS.primary}
                label="Data"
                onPress={() => navigation.navigate("BuyData")}
              />

              <ServiceItem
                icon="phone-alt"
                color={COLORS.secondary}
                label="Airtime"
                onPress={() => navigation.navigate("BuyAirtime")}
              />

              <ServiceItem
                icon="bolt"
                color="#EAB308"
                label="Power"
                onPress={() => navigation.navigate("Electricity")}
              />

              <ServiceItem
                icon="tv"
                color="#8B5CF6"
                label="Cable"
                onPress={() => navigation.navigate("Cable")}
              />

              <ServiceItem
                icon="id-card"
                color="#F43F5E"
                label="NIMC Verify"
                onPress={() => navigation.navigate("NIMC")}
              />

              <ServiceItem
                icon="fingerprint"
                color="#EC4899"
                label="NIMC Mod"
                onPress={() => navigation.navigate("NIMCModification")}
              />

              <ServiceItem
                icon="user-shield"
                color="#64748B"
                label="BVN"
                onPress={() => navigation.navigate("BVNScreen")}
              />

              <ServiceItem
                icon="shield-alt"
                color={COLORS.secondary}
                label="NIN Valid"
                onPress={() => navigation.navigate("NINValidation")}
              />

              <ServiceItem
                icon="history"
                color="#F97316"
                label="History"
                onPress={() =>
                  navigation.navigate("Main", { screen: "Wallet History" })
                }
              />
            </View>
          </View>

          <View style={styles.supervisorSection}>
            <Text style={styles.sectionTitle}>Assigned Supervisor</Text>

            <View style={styles.infoBox}>
              {typeof supervisor === "string" ? (
                <Text style={styles.infoText}>{supervisor}</Text>
              ) : (
                <View>
                  <Text style={styles.supName}>
                    {supervisor?.name || "N/A"}
                  </Text>
                  <Text style={styles.supPhone}>
                    {supervisor?.phone || "No Contact"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Quick Agent Actions</Text>

            <TouchableOpacity
              style={styles.actionBtnFull}
              onPress={() => navigation.navigate("NewSale")}
            >
              <Text style={styles.actionBtnTextFull}>Process New Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnFullAlt}
              onPress={() => navigation.navigate("SalesHistory")}
            >
              <Text style={styles.actionBtnTextFull}>View Sales History</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerBranding}>
            <Text style={styles.footerHeadline}>
              Why Choose Bellaj Data Hub?
            </Text>

            <View style={styles.trustGrid}>
              <TrustItem
                icon="shield-check"
                color={COLORS.secondary}
                bg={COLORS.softGreen}
                title="100% Secure"
                sub="Encrypted"
              />

              <TrustItem
                icon="flash"
                color="#CA8A04"
                bg="#FEF9C3"
                title="Instant"
                sub="Automated"
              />

              <TrustItem
                icon="headset"
                color={COLORS.primary}
                bg={COLORS.softRed}
                title="24/7 Support"
                sub="Reliable"
              />
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </LinearGradient>

      <View style={styles.bottomTab}>
        <TabItem icon="home" label="Dashboard" active onPress={() => {}} />

        <TabItem
          icon="time-outline"
          label="History"
          onPress={() =>
            navigation.navigate("Main", { screen: "Wallet History" })
          }
        />

        <TabItem
          icon="person-outline"
          label="Profile"
          onPress={() => navigation.navigate("Profile")}
        />

        <TabItem
          icon="help-buoy-outline"
          label="Support"
          onPress={() => navigation.navigate("Contact")}
        />
      </View>
    </View>
  );
};

const BankCard = ({ bank, acc, code, onCopy, isDarkMode }) => (
  <TouchableOpacity
    style={[styles.bankBox, isDarkMode && { backgroundColor: "#1E293B" }]}
    onPress={onCopy}
  >
    <View style={styles.bankInfo}>
      <View style={styles.bankLogoCircle}>
        <Text style={styles.bankLogoText}>{code}</Text>
      </View>

      <View>
        <Text style={styles.bankTitle}>{bank}</Text>
        <Text style={[styles.accNo, isDarkMode && { color: COLORS.white }]}>
          {acc}
        </Text>
      </View>
    </View>

    <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
  </TouchableOpacity>
);

const ServiceItem = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress}>
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
    <Ionicons
      name={icon}
      size={24}
      color={active ? COLORS.primary : "#94A3B8"}
    />

    <Text
      style={[styles.tabLabel, { color: active ? COLORS.primary : "#94A3B8" }]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: "100%",
  },
  screenBg: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationBtn: {
    marginRight: 20,
  },
  logoCircle: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImg: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  welcomeSection: {
    marginBottom: 10,
  },
  welcomeText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  walletCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 25,
    elevation: 10,
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: {
    color: "#FFE4E4",
    fontSize: 13,
  },
  historyText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  currency: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "600",
  },
  balanceText: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "bold",
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginTop: 15,
    marginBottom: 15,
    paddingLeft: 4,
  },
  bankBox: {
    backgroundColor: COLORS.white,
    width: width * 0.75,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  bankLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bankLogoText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  bankTitle: {
    fontSize: 12,
    color: COLORS.muted,
  },
  accNo: {
    fontSize: 17,
    color: COLORS.dark,
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statsGridAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: COLORS.white,
    width: "48%",
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 6,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginTop: 5,
  },
  statUnit: {
    fontSize: 12,
    color: "#94A3B8",
  },
  targetTrackingSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
  },
  targetCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  targetRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  targetLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  targetValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  rightAlign: {
    alignItems: "flex-end",
  },
  percentageText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    marginTop: 15,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
  },
  progressSubText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  remainingText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  boldText: {
    fontWeight: "700",
    color: COLORS.dark,
  },
  boldTextRed: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  servicesContainer: {
    borderRadius: 28,
    padding: 20,
    elevation: 4,
    marginBottom: 20,
    backgroundColor: COLORS.white,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "23%",
    alignItems: "center",
    marginBottom: 22,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 1,
  },
  gridLabel: {
    color: "#475569",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
  },
  supervisorSection: {
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  infoText: {
    color: COLORS.muted,
  },
  supName: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.dark,
  },
  supPhone: {
    color: COLORS.secondary,
    marginTop: 4,
  },
  actionSection: {
    marginBottom: 20,
  },
  actionBtnFull: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  actionBtnFullAlt: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  actionBtnTextFull: {
    color: COLORS.white,
    fontWeight: "bold",
  },
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
    fontWeight: "bold",
    marginBottom: 15,
    color: COLORS.primary,
  },
  trustGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  trustItem: {
    alignItems: "center",
    width: "30%",
  },
  trustIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    color: COLORS.dark,
    textAlign: "center",
  },
  trustSub: {
    fontSize: 10,
    color: COLORS.muted,
    textAlign: "center",
  },
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
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default AgentDashboard;
