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
  ImageBackground,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
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
import { ThemeContext } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";
const AGENT_URL = "https://ayax-api.com/api/v1/agent";

const AgentDashboard = ({ navigation }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const [userData, setUserData] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  // AGENT STATES
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalSalesValue: 0,
  });

  const [supervisor, setSupervisor] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      };

      // FETCH ALL APIs
      const [profileRes, perfRes, supRes] = await Promise.all([
        axios.get(`${BASE_URL}/user/profile`, config),

        axios
          .get(`${AGENT_URL}/performance`, config)
          .catch(() => ({ data: { data: {} } })),

        axios
          .get(`${AGENT_URL}/my-supervisor`, config)
          .catch(() => ({ data: { data: null } })),
      ]);

      // USER DATA
      if (profileRes.data?.success) {
        setUserData(profileRes.data.user || profileRes.data.data);
      }

      // PERFORMANCE
      setPerformance(
        perfRes?.data?.data || {
          totalGB: 0,
          totalSalesValue: 0,
        },
      );

      // SUPERVISOR
      setSupervisor(supRes?.data?.data || null);
    } catch (err) {
      console.log(err);

      if (err?.response?.status === 401) {
        await AsyncStorage.clear();

        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      } else {
        Alert.alert("Error", "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
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
      "Hello Ayax Xpress Support, I need assistance with my account.";

    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${phoneNumber.replace("+", "")}`);
    });
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.mainContainer,
        {
          backgroundColor: isDarkMode ? "#020617" : "#f8fafc",
        },
      ]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={
            isDarkMode
              ? ["rgba(2,6,23,0.75)", "rgba(2,6,23,0.95)"]
              : ["rgba(255,255,255,0.65)", "rgba(248,250,252,0.96)"]
          }
          style={styles.fullOverlay}
        />

        {/* ================= HEADER ================= */}

        <View style={styles.topHeader}>
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.logoCircle}
              onPress={() => navigation.openDrawer()}
            >
              <Image
                source={require("../assets/Logo.png")}
                style={styles.logoImg}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color={isDarkMode ? "#fff" : "#0f172a"}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>

            <Text
              style={[
                styles.userName,
                {
                  color: isDarkMode ? "#fff" : "#0f172a",
                },
              ]}
            >
              {userData
                ? `${userData.firstName || ""} ${userData.surname || ""}`
                : "Agent"}
            </Text>
          </View>
        </View>

        {/* ================= CONTENT ================= */}

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            paddingBottom: 140,
          }}
        >
          {/* ================= WALLET ================= */}

          <LinearGradient
            colors={["#1e40af", "#1e3a8a"]}
            style={styles.walletCard}
          >
            <View style={styles.walletTop}>
              <Text style={styles.walletLabel}>Available Balance</Text>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("Main", {
                    screen: "Wallet History",
                  })
                }
              >
                <Text style={styles.historyText}>Transactions</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.balanceContainer}>
              <Text style={styles.currency}>₦</Text>

              <Text style={styles.balanceText}>
                {isBalanceVisible ? userData?.walletBalance || "0.00" : "****"}
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
                  {
                    backgroundColor: "rgba(255,255,255,0.15)",
                  },
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

          {/* ================= AGENT STATS ================= */}

          <Text
            style={[
              styles.sectionLabel,
              {
                color: isDarkMode ? "#fff" : "#1e293b",
              },
            ]}
          >
            Agent Performance
          </Text>

          <View style={styles.statsGrid}>
            <StatCard
              title="Monthly Volume"
              value={performance.totalGB || 0}
              unit="GB"
              color="#2563eb"
            />

            <StatCard
              title="Monthly Revenue"
              value={`₦${performance.totalSalesValue || 0}`}
              unit=""
              color="#059669"
            />
          </View>

          {/* ================= SUPERVISOR ================= */}

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: isDarkMode ? "#fff" : "#334155",
                },
              ]}
            >
              Assigned Supervisor
            </Text>

            <View style={styles.infoBox}>
              {typeof supervisor === "string" ? (
                <Text style={styles.infoText}>{supervisor}</Text>
              ) : (
                <View>
                  <Text style={styles.supName}>
                    {supervisor?.name || "No Supervisor"}
                  </Text>

                  <Text style={styles.supPhone}>
                    {supervisor?.phone || "No Contact Available"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ================= BANK ================= */}

          <Text
            style={[
              styles.sectionLabel,
              {
                color: isDarkMode ? "#fff" : "#1e293b",
              },
            ]}
          >
            Automatic Funding Accounts
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bankScroll}
          >
            {userData?.accountNumber ? (
              <BankCard
                bank={userData.bankName || "Wema Bank"}
                acc={userData.accountNumber}
                code="WB"
                onCopy={() => copyToClipboard(userData.accountNumber)}
              />
            ) : (
              <BankCard
                bank="Initializing..."
                acc="Generating Account"
                code=".."
                onCopy={() => Alert.alert("Wait", "Account still processing")}
              />
            )}

            <BankCard
              bank="Paystack Terminal"
              acc="Automated Funding"
              code="PAY"
              onCopy={() =>
                Alert.alert("Info", "Transfer to your Wema account")
              }
            />
          </ScrollView>

          {/* ================= SERVICES ================= */}

          <Text
            style={[
              styles.sectionLabel,
              {
                color: isDarkMode ? "#fff" : "#1e293b",
              },
            ]}
          >
            Our Services
          </Text>

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
                icon="history"
                color="#f97316"
                label="History"
                onPress={() =>
                  navigation.navigate("Main", {
                    screen: "Wallet History",
                  })
                }
              />

              <ServiceItem
                icon="user"
                color="#0f766e"
                label="Profile"
                onPress={() => navigation.navigate("Profile")}
              />

              <ServiceItem
                icon="chart-line"
                color="#7c3aed"
                label="Sales"
                onPress={() => navigation.navigate("SalesHistory")}
              />

              <ServiceItem
                icon="plus-circle"
                color="#2563eb"
                label="New Sale"
                onPress={() => navigation.navigate("NewSale")}
              />
            </View>
          </View>

          {/* ================= TRUST ================= */}

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
        </ScrollView>

        {/* ================= BOTTOM TAB ================= */}

        <View style={styles.bottomTab}>
          <TabItem icon="home" label="Home" active onPress={() => {}} />

          <TabItem
            icon="time-outline"
            label="History"
            onPress={() =>
              navigation.navigate("Main", {
                screen: "Wallet History",
              })
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
      </ImageBackground>
    </SafeAreaView>
  );
};

// ================= SUB COMPONENTS =================

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
    <View
      style={[
        styles.trustIconCircle,
        {
          backgroundColor: bg,
        },
      ]}
    >
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

    <Text
      style={[
        styles.tabLabel,
        {
          color: active ? "#1e40af" : "#94a3b8",
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const StatCard = ({ title, value, unit, color }) => (
  <View
    style={[
      styles.statCard,
      {
        borderLeftColor: color,
      },
    ]}
  >
    <Text style={styles.statLabel}>{title}</Text>

    <Text style={styles.statValue}>
      {value} <Text style={styles.statUnit}>{unit}</Text>
    </Text>
  </View>
);

// ================= STYLES =================

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  fullOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  logoCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },

  logoImg: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },

  welcomeSection: {
    marginBottom: 10,
  },

  welcomeText: {
    color: "#64748b",
    fontSize: 14,
  },

  userName: {
    fontSize: 24,
    fontWeight: "bold",
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
  },

  walletCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 25,
  },

  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  walletLabel: {
    color: "#dbeafe",
    fontSize: 13,
  },

  historyText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "600",
  },

  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },

  currency: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },

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

  actionBtn: {
    flex: 0.48,
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },

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

  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
    paddingLeft: 4,
  },

  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    borderRadius: 14,
    borderLeftWidth: 5,
  },

  statLabel: {
    color: "#64748b",
    fontSize: 12,
  },

  statValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },

  statUnit: {
    fontSize: 12,
    color: "#94a3b8",
  },

  section: {
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
  },

  infoText: {
    color: "#64748b",
  },

  supName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
  },

  supPhone: {
    marginTop: 4,
    color: "#475569",
  },

  bankScroll: {
    marginBottom: 25,
  },

  bankBox: {
    backgroundColor: "#fff",
    width: width * 0.75,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 15,
  },

  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
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

  bankLogoText: {
    color: "#1e40af",
    fontWeight: "bold",
  },

  bankTitle: {
    fontSize: 12,
    color: "#64748b",
  },

  accNo: {
    fontSize: 17,
    color: "#0f172a",
    fontWeight: "bold",
  },

  servicesContainer: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 28,
    padding: 20,
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
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  gridLabel: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
    color: "#475569",
  },

  footerBranding: {
    marginTop: 30,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
  },

  footerHeadline: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#64748b",
    marginBottom: 20,
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
    width: 55,
    height: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  trustTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
  },

  trustSub: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 2,
  },

  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: 20,
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
});

export default AgentDashboard;
