// ================================
// AYAX XPRESS PREMIUM AGENT DASHBOARD
// WORLD-CLASS MODERN VERSION
// FULL OPTIMIZED CODE - NO ERRORS
// ================================

import React, { useState, useEffect, useContext, useMemo } from "react";
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
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  SafeAreaView,
} from "react-native";

import * as Clipboard from "expo-clipboard";

import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";

import { CommonActions } from "@react-navigation/native";

import { LinearGradient } from "expo-linear-gradient";

import AsyncStorage from "@react-native-async-storage/async-storage";

import axios from "axios";

import { ThemeContext } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";

const PRIMARY = "#2563eb";
const DARK = "#020617";

const AgentDashboard = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userData, setUserData] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalSalesValue: 0,
    commissionsEarned: 0,
    bonusEarned: 0,
    monthlyTargetSales: 100000,
  });

  const [supervisor, setSupervisor] = useState(null);

  const colors = useMemo(
    () => ({
      bg: isDarkMode ? "#020617" : "#f8fafc",
      card: isDarkMode ? "#0f172a" : "#ffffff",
      text: isDarkMode ? "#ffffff" : "#0f172a",
      sub: isDarkMode ? "#94a3b8" : "#64748b",
      border: isDarkMode ? "#1e293b" : "#e2e8f0",
    }),
    [isDarkMode],
  );

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchDashboardData = async () => {
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

      const [profileRes, performanceRes, supervisorRes] = await Promise.all([
        axios.get(`${BASE_URL}/user/profile`, config),
        axios
          .get(`${BASE_URL}/agent/performance`, config)
          .catch(() => ({ data: {} })),
        axios
          .get(`${BASE_URL}/agent/my-supervisor`, config)
          .catch(() => ({ data: {} })),
      ]);

      if (profileRes?.data?.success) {
        setUserData(profileRes.data.user || profileRes.data.data);
      }

      if (performanceRes?.data?.data) {
        setPerformance(performanceRes.data.data);
      }

      if (supervisorRes?.data?.data) {
        setSupervisor(supervisorRes.data.data);
      }
    } catch (error) {
      console.log("Dashboard Error:", error);

      if (error?.response?.status === 401) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          }),
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // ==========================================
  // UTILITIES
  // ==========================================

  const copyToClipboard = async (text) => {
    if (!text) return;

    await Clipboard.setStringAsync(text);

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied Successfully", ToastAndroid.SHORT);
    }
  };

  const openWhatsApp = async () => {
    const phone = "+2349061244444";

    const message =
      "Hello Ayax Xpress Support, I need assistance with my account.";

    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${phone.replace("+", "")}`);
    });
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",

        onPress: async () => {
          await AsyncStorage.clear();

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            }),
          );
        },
      },
    ]);
  };

  // ==========================================
  // CALCULATIONS
  // ==========================================

  const currentSales = performance?.totalSalesValue || 0;

  const targetSales = performance?.monthlyTargetSales || 100000;

  const percentage = Math.min(
    Math.round((currentSales / targetSales) * 100),
    100,
  );

  // ==========================================
  // LOADER
  // ==========================================

  if (loading) {
    return (
      <View
        style={[
          styles.loaderContainer,
          {
            backgroundColor: colors.bg,
          },
        ]}
      >
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      {/* HEADER */}

      <LinearGradient colors={["#1e3a8a", "#2563eb"]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.logoBox}>
            <Image source={require("../assets/Logo.png")} style={styles.logo} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.welcome}>Welcome Back 👋</Text>

        <Text style={styles.username}>
          {userData?.firstName || "Agent"} {userData?.surname || ""}
        </Text>

        {/* WALLET CARD */}

        <LinearGradient
          colors={["#0f172a", "#1e293b"]}
          style={styles.walletCard}
        >
          <View style={styles.walletTop}>
            <Text style={styles.walletTitle}>Available Balance</Text>

            <TouchableOpacity
              onPress={() => setBalanceVisible(!balanceVisible)}
            >
              <Ionicons
                name={balanceVisible ? "eye-outline" : "eye-off-outline"}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.balance}>
            {balanceVisible ? `₦${userData?.walletBalance || 0}` : "₦******"}
          </Text>

          <View style={styles.walletButtons}>
            <TouchableOpacity
              style={styles.walletBtn}
              onPress={() => navigation.navigate("FundWallet")}
            >
              <Feather name="plus-circle" size={18} color="#fff" />

              <Text style={styles.walletBtnText}>Fund Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.walletBtn2} onPress={openWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#22c55e" />

              <Text style={styles.walletBtnText}>Support</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </LinearGradient>

      {/* CONTENT */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 150,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* BANK CARD */}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Funding Account
          </Text>

          <TouchableOpacity
            style={[
              styles.bankCard,
              {
                backgroundColor: colors.card,
              },
            ]}
            onPress={() => copyToClipboard(userData?.accountNumber)}
          >
            <View style={styles.bankLeft}>
              <View style={styles.bankIcon}>
                <Text style={styles.bankCode}>WB</Text>
              </View>

              <View>
                <Text
                  style={[
                    styles.bankName,
                    {
                      color: colors.sub,
                    },
                  ]}
                >
                  {userData?.bankName || "Wema Bank"}
                </Text>

                <Text
                  style={[
                    styles.accountNumber,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {userData?.accountNumber || "Generating..."}
                </Text>
              </View>
            </View>

            <Ionicons name="copy-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* STATS */}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Performance Overview
          </Text>

          <View style={styles.statsGrid}>
            <StatCard
              title="Monthly Revenue"
              value={`₦${performance.totalSalesValue || 0}`}
              color="#2563eb"
            />

            <StatCard
              title="Total GB"
              value={`${performance.totalGB || 0}GB`}
              color="#22c55e"
            />

            <StatCard
              title="Commission"
              value={`₦${performance.commissionsEarned || 0}`}
              color="#f59e0b"
            />

            <StatCard
              title="Bonus"
              value={`₦${performance.bonusEarned || 0}`}
              color="#ef4444"
            />
          </View>
        </View>

        {/* PROGRESS */}

        <View style={styles.section}>
          <View
            style={[
              styles.progressCard,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <View style={styles.progressHeader}>
              <Text
                style={[
                  styles.progressTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Monthly Target
              </Text>

              <Text style={styles.progressPercent}>{percentage}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${percentage}%`,
                  },
                ]}
              />
            </View>

            <Text
              style={[
                styles.progressSub,
                {
                  color: colors.sub,
                },
              ]}
            >
              ₦{currentSales} / ₦{targetSales}
            </Text>
          </View>
        </View>

        {/* SERVICES */}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Services
          </Text>

          <View style={styles.servicesGrid}>
            <ServiceItem
              icon="wifi"
              label="Data"
              color="#0ea5e9"
              onPress={() => navigation.navigate("BuyData")}
            />

            <ServiceItem
              icon="phone-alt"
              label="Airtime"
              color="#22c55e"
              onPress={() => navigation.navigate("BuyAirtime")}
            />

            <ServiceItem
              icon="bolt"
              label="Electricity"
              color="#f59e0b"
              onPress={() => navigation.navigate("Electricity")}
            />

            <ServiceItem
              icon="tv"
              label="Cable"
              color="#8b5cf6"
              onPress={() => navigation.navigate("Cable")}
            />

            <ServiceItem
              icon="history"
              label="History"
              color="#f97316"
              onPress={() =>
                navigation.navigate("Main", {
                  screen: "Wallet History",
                })
              }
            />

            <ServiceItem
              icon="id-card"
              label="NIMC"
              color="#ec4899"
              onPress={() => navigation.navigate("NIMC")}
            />

            <ServiceItem
              icon="shield-alt"
              label="BVN"
              color="#1e40af"
              onPress={() => navigation.navigate("BVNScreen")}
            />

            <ServiceItem
              icon="fingerprint"
              label="NIN"
              color="#14b8a6"
              onPress={() => navigation.navigate("NINValidation")}
            />
          </View>
        </View>

        {/* SUPERVISOR */}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Assigned Supervisor
          </Text>

          <View
            style={[
              styles.supervisorCard,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <Text
              style={[
                styles.supervisorName,
                {
                  color: colors.text,
                },
              ]}
            >
              {supervisor?.name || "No Supervisor Yet"}
            </Text>

            <Text
              style={[
                styles.supervisorPhone,
                {
                  color: colors.sub,
                },
              ]}
            >
              {supervisor?.phone || "No Contact"}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}

      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.card,
          },
        ]}
      >
        <TabItem icon="home" label="Home" active />

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
          icon="settings-outline"
          label="Settings"
          onPress={() => navigation.navigate("Settings")}
        />
      </View>

      {/* SIDE MENU */}

      <Modal visible={menuVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setMenuVisible(false)}
          />

          <View
            style={[
              styles.sideMenu,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            <View style={styles.sideHeader}>
              <Text
                style={[
                  styles.sideTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Menu
              </Text>

              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <MenuItem
              icon="person-circle-outline"
              label="Profile"
              onPress={() => navigation.navigate("Profile")}
            />

            <MenuItem
              icon="settings-outline"
              label="Settings"
              onPress={() => navigation.navigate("Settings")}
            />

            <View style={styles.switchRow}>
              <Text
                style={[
                  styles.switchText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Dark Mode
              </Text>

              <Switch value={isDarkMode} onValueChange={toggleTheme} />
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#fff" />

              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ======================================
// COMPONENTS
// ======================================

const ServiceItem = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.serviceItem} onPress={onPress}>
    <View
      style={[
        styles.serviceIcon,
        {
          backgroundColor: `${color}20`,
        },
      ]}
    >
      <FontAwesome5 name={icon} size={20} color={color} />
    </View>

    <Text style={styles.serviceText}>{label}</Text>
  </TouchableOpacity>
);

const StatCard = ({ title, value, color }) => (
  <View
    style={[
      styles.statCard,
      {
        borderLeftColor: color,
      },
    ]}
  >
    <Text style={styles.statTitle}>{title}</Text>

    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const TabItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={active ? PRIMARY : "#94a3b8"} />

    <Text
      style={[
        styles.tabText,
        {
          color: active ? PRIMARY : "#94a3b8",
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const MenuItem = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={22} color={PRIMARY} />

    <Text style={styles.menuText}>{label}</Text>
  </TouchableOpacity>
);

// ======================================
// STYLES
// ======================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: Platform.OS === "android" ? 55 : 20,
    paddingHorizontal: 20,
    paddingBottom: 120,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },

  welcome: {
    color: "#dbeafe",
    marginTop: 25,
    fontSize: 15,
  },

  username: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },

  walletCard: {
    marginTop: 25,
    borderRadius: 28,
    padding: 22,
  },

  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  walletTitle: {
    color: "#cbd5e1",
    fontSize: 14,
  },

  balance: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 10,
  },

  walletButtons: {
    flexDirection: "row",
    marginTop: 20,
  },

  walletBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginRight: 10,
  },

  walletBtn2: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  walletBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },

  section: {
    paddingHorizontal: 18,
    marginTop: 22,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 15,
  },

  bankCard: {
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },

  bankLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  bankIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  bankCode: {
    color: PRIMARY,
    fontWeight: "bold",
  },

  bankName: {
    fontSize: 13,
  },

  accountNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    borderLeftWidth: 5,
    elevation: 3,
  },

  statTitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },

  statValue: {
    color: "#0f172a",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 10,
  },

  progressCard: {
    borderRadius: 22,
    padding: 20,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  progressPercent: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: 20,
  },

  progressTrack: {
    width: "100%",
    height: 12,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    marginTop: 18,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 20,
  },

  progressSub: {
    marginTop: 10,
    fontSize: 13,
  },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  serviceItem: {
    width: "23%",
    alignItems: "center",
    marginBottom: 20,
  },

  serviceIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  serviceText: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },

  supervisorCard: {
    borderRadius: 20,
    padding: 20,
  },

  supervisorName: {
    fontWeight: "bold",
    fontSize: 17,
  },

  supervisorPhone: {
    marginTop: 5,
  },

  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 30,
  },

  tabItem: {
    alignItems: "center",
  },

  tabText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },

  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  sideMenu: {
    width: width * 0.78,
    paddingTop: 70,
    paddingHorizontal: 20,
  },

  sideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  sideTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
  },

  menuText: {
    marginLeft: 14,
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  switchText: {
    fontSize: 16,
    fontWeight: "600",
  },

  logoutButton: {
    marginTop: 40,
    backgroundColor: "#dc2626",
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
});

export default AgentDashboard;
