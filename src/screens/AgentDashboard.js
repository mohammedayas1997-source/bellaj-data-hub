import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  Clipboard,
  ToastAndroid,
  ImageBackground,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useColorScheme } from "react-native";

const { width } = Dimensions.get("window");
const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";

const AgentDashboard = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

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
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      };

      // Gudanar da dukkan kiran API lokaci guda (Profile Data + Performance Metrics)
      const [profileRes, perfRes, supRes] = await Promise.all([
        axios
          .get(`${BASE_URL}/user/profile`, config)
          .catch((e) => ({ data: { success: false } })),
        axios
          .get(`${BASE_URL}/agent/performance`, config)
          .catch((e) => ({ data: { data: null } })),
        axios
          .get(`${BASE_URL}/agent/my-supervisor`, config)
          .catch((e) => ({ data: { data: null } })),
      ]);

      // Karban bayanan Profile na asali (Domin ciro sunaye da Account Number dinsa)
      if (profileRes.data && profileRes.data.success) {
        setUserData(profileRes.data.user || profileRes.data.data);
      }

      // Karban bayanan Metrics na Agent
      if (perfRes.data?.data) {
        setPerformance(perfRes.data.data);
      } else {
        setPerformance({
          totalGB: 0,
          totalSalesValue: 0,
          commissionsEarned: 0,
          bonusEarned: 0,
          monthlyTargetSales: 100000,
        });
      }

      if (supRes.data?.data) {
        setSupervisor(supRes.data.data);
      } else {
        setSupervisor("No Supervisor Assigned Yet");
      }
    } catch (err) {
      console.log("Comprehensive Agent Dashboard Fetch Error:", err);
      if (err.response && err.response.status === 401) {
        await AsyncStorage.clear();
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgentAndProfileData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentAndProfileData();
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    Clipboard.setString(text);
    if (Platform.OS === "android") {
      ToastAndroid.show("Copied to clipboard", ToastAndroid.SHORT);
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349061244444";
    const message = `Hello Ayax Xpress Support, I need assistance with my Agent account.`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://wa.me/${phoneNumber.replace("+", "")}`),
    );
  };

  // Calculations for Target Progression
  const currentSales = performance.totalSalesValue || 0;
  const targetSales = performance.monthlyTargetSales || 0;
  const remainingToTarget =
    targetSales - currentSales > 0 ? targetSales - currentSales : 0;
  const achievementPercentage =
    targetSales > 0
      ? Math.min(Math.round((currentSales / targetSales) * 100), 100)
      : 0;

  const StatCard = ({ title, value, unit, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>
        {value} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to exit?", [
      { text: "Cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.fullOverlayGradient}>
          <LinearGradient
            colors={["rgba(255,255,255,0.6)", "rgba(248,250,252,0.95)"]}
            style={styles.fullOverlay}
          />
        </View>

        <View style={styles.topHeader}>
          <View style={styles.navRow}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/Logo.png")}
                style={styles.logoImg}
              />
            </View>
            {/* Bar notification kawai a nan */}
            <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#0f172a"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Agent Control Panel,</Text>
            <Text style={styles.userName}>
              {userData
                ? `${userData.firstName || userData.name || ""} ${userData.surname || ""}`
                : "Loading..."}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* A ƙarshen ScrollView, kafin footer ko bayan Services */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Profile")}
            >
              <Ionicons name="person-outline" size={24} color="#1e40af" />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate("Settings")}
            >
              <Ionicons name="settings-outline" size={24} color="#1e40af" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#dc2626" />
              <Text style={[styles.menuText, { color: "#dc2626" }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />

          {/* 1. WALLET CARD & BALANCE */}
          <LinearGradient
            colors={["#1e40af", "#1e3a8a"]}
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
                  color="#38bdf8"
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
                  colors={["#38bdf8", "#0ea5e9"]}
                  style={styles.innerBtnGradient}
                >
                  <Ionicons name="add-circle" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>FUND WALLET</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: "rgba(255,255,255,0.15)" },
                ]}
                onPress={openWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#22c55e" />
                <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                  SUPPORT
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* 2. AUTOMATIC VIRTUAL ACCOUNTS SECTION */}
          <Text style={styles.sectionLabel}>Automatic Funding Accounts</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bankScroll}
          >
            {userData?.accountNumber &&
            userData?.accountNumber !== "Initialization Pending" ? (
              <BankCard
                bank={userData.bankName || "Wema Bank"}
                acc={userData.accountNumber}
                code="WB"
                onCopy={() => copyToClipboard(userData.accountNumber)}
              />
            ) : (
              <BankCard
                bank="Wema Bank (Pending)"
                acc="Generating..."
                code=".."
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
              onCopy={() =>
                Alert.alert(
                  "Note",
                  "Transfer to your assigned Wema account for instant automated wallet credit.",
                )
              }
            />
          </ScrollView>

          {/* 3. CORE METRICS GRID */}
          <Text style={styles.sectionLabel}>Performance Metrics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Monthly Volume"
              value={performance.totalGB || 0}
              unit="GB"
              color="#2563eb"
            />
            <StatCard
              title="Monthly Revenue"
              value={`₦${currentSales}`}
              unit=""
              color="#059669"
            />
          </View>

          <View style={styles.statsGridAlt}>
            <StatCard
              title="Commissions Earned"
              value={`₦${performance.commissionsEarned || 0}`}
              unit=""
              color="#d4af37"
            />
            <StatCard
              title="Bonus Earned"
              value={`₦${performance.bonusEarned || 0}`}
              unit=""
              color="#dc2626"
            />
          </View>

          {/* 4. PERFORMANCE TRACKING PROGRESS */}
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
                  Current Progress:{" "}
                  <Text style={styles.boldText}>₦{currentSales}</Text>
                </Text>
                <Text style={styles.remainingText}>
                  Remaining:{" "}
                  <Text style={styles.boldTextRed}>₦{remainingToTarget}</Text>
                </Text>
              </View>
            </View>
          </View>

          {/* 5. SERVICES GRID FOR AGENT TO SELL */}
          <Text style={styles.sectionLabel}>Agent Utilities Services</Text>
          <View style={styles.servicesContainer}>
            <View style={styles.grid}>
              <ServiceItem
                icon="wifi"
                color="#0ea5e9"
                label="Data"
                onPress={() => navigation.navigate("BuyData")}
              />
              <ServiceItem
                icon="phone-alt"
                color="#22c55e"
                label="Airtime"
                onPress={() => navigation.navigate("BuyAirtime")}
              />
              <ServiceItem
                icon="bolt"
                color="#eab308"
                label="Power"
                onPress={() => navigation.navigate("Electricity")}
              />
              <ServiceItem
                icon="tv"
                color="#8b5cf6"
                label="Cable"
                onPress={() => navigation.navigate("Cable")}
              />
              <ServiceItem
                icon="id-card"
                color="#f43f5e"
                label="NIMC Verify"
                onPress={() => navigation.navigate("NIMC")}
              />
              <ServiceItem
                icon="fingerprint"
                color="#ec4899"
                label="NIMC Mod"
                onPress={() => navigation.navigate("NIMCModification")}
              />
              <ServiceItem
                icon="user-shield"
                color="#64748b"
                label="BVN"
                onPress={() => navigation.navigate("BVNScreen")}
              />
              <ServiceItem
                icon="shield-alt"
                color="#1e40af"
                label="NIN Valid"
                onPress={() => navigation.navigate("NINValidation")}
              />
              <ServiceItem
                icon="history"
                color="#f97316"
                label="History"
                onPress={() =>
                  navigation.navigate("Main", { screen: "Wallet History" })
                }
              />
            </View>
          </View>

          {/* 6. SUPERVISOR INFO */}
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

          {/* 7. QUICK ACTIONS */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Quick Agent Actions</Text>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("NewSale")}
            >
              <Text style={styles.actionBtnText}>Process New Sale</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("SalesHistory")}
            >
              <Text style={styles.actionBtnText}>View Sales History</Text>
            </TouchableOpacity>
          </View>

          {/* 8. BRANDING FOOTER */}
          <View style={styles.footerBranding}>
            <Text style={styles.footerHeadline}>Why Choose Ayax Xpress?</Text>
            <View style={styles.trustGrid}>
              <TrustItem
                icon="shield-check"
                color="#16a34a"
                bg="#dcfce7"
                title="100% Secure"
                sub="Encrypted"
              />
              <TrustItem
                icon="flash"
                color="#ca8a04"
                bg="#fef9c3"
                title="Instant"
                sub="Automated"
              />
              <TrustItem
                icon="headset"
                color="#0284c7"
                bg="#e0f2fe"
                title="24/7 Support"
                sub="Reliable"
              />
            </View>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      </ImageBackground>

      {/* BOTTOM NAVIGATION TAB */}
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

// Internal Sub-Components
const BankCard = ({ bank, acc, code, onCopy }) => (
  <TouchableOpacity style={styles.bankBox} onPress={onCopy}>
    <View style={styles.bankInfo}>
      <View style={styles.bankLogoCircle}>
        <Text style={styles.bankLogoText}>{code}</Text>
      </View>
      <View>
        <Text style={styles.bankTitle}>{bank}</Text>
        <Text style={styles.accNo}>{acc}</Text>
      </View>
    </View>
    <Ionicons name="copy-outline" size={18} color="#1e40af" />
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
    <Ionicons name={icon} size={24} color={active ? "#1e40af" : "#94a3b8"} />
    <Text style={[styles.tabLabel, { color: active ? "#1e40af" : "#94a3b8" }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Unified Consistent Stylesheet
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc",
  },
  userName: {
    color: isDarkMode ? "#f8fafc" : "#0f172a",
    fontSize: 24,
    fontWeight: "bold",
  },
  backgroundImage: { flex: 1, width: "100%", height: "100%" },
  fullOverlayGradient: { ...StyleSheet.absoluteFillObject },
  fullOverlay: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  topHeader: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoCircle: {
    width: 45,
    height: 45,
    backgroundColor: "#0f172a",
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  logoImg: { width: 32, height: 32, resizeMode: "contain" },
  welcomeSection: { marginBottom: 10 },
  welcomeText: { color: "#64748b", fontSize: 14, fontWeight: "500" },
  userName: { color: "#0f172a", fontSize: 24, fontWeight: "bold" },

  // Scroll Content
  content: { flex: 1, paddingHorizontal: 16 },

  // Wallet
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
  walletLabel: { color: "#dbeafe", fontSize: 13 },
  historyText: { color: "#38bdf8", fontSize: 12, fontWeight: "600" },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  currency: { color: "#fff", fontSize: 24, fontWeight: "600" },
  balanceText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginLeft: 8,
  },
  walletActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: { flex: 0.48, height: 48, borderRadius: 14, overflow: "hidden" },
  innerBtnGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 8,
  },

  // Sections & Banks
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 15,
    marginBottom: 15,
    paddingLeft: 4,
  },
  bankScroll: { marginBottom: 25 },
  bankBox: {
    backgroundColor: "#fff",
    width: width * 0.75,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 15,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#1e40af",
  },
  bankLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bankLogoText: { color: "#1e40af", fontWeight: "bold", fontSize: 12 },
  bankTitle: { fontSize: 12, color: "#64748b" },
  accNo: { fontSize: 17, color: "#0f172a", fontWeight: "bold" },

  // Stats & Progress
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
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 6,
    elevation: 3,
  },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 5,
  },
  statUnit: { fontSize: 12, color: "#94a3b8" },

  targetTrackingSection: { marginTop: 10, marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 10,
  },
  targetCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
  percentageText: { fontSize: 20, fontWeight: "800", color: "#059669" },
  progressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    marginTop: 15,
    overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: "#059669", borderRadius: 5 },
  boldText: { fontWeight: "700", color: "#0f172a" },
  boldTextRed: { fontWeight: "700", color: "#dc2626" },

  // Services
  servicesContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 28,
    padding: 20,
    elevation: 4,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: { width: "23%", alignItems: "center", marginBottom: 22 },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
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

  // Settings & Menu (Sabo)
  menuSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  menuText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },

  // Footer & Tab
  bottomTab: {
    height: 85,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingBottom: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 20,
  },
  tabItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabLabel: { fontSize: 10, marginTop: 4, fontWeight: "600" },
  footerBranding: {
    marginTop: 10,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },
  trustGrid: { flexDirection: "row", justifyContent: "space-around" },
});

export default AgentDashboard;
