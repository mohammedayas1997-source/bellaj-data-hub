import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
  RefreshControl,
  useColorScheme,
  Modal,
  StatusBar,
  Dimensions,
  ToastAndroid,
  Image,
  ImageBackground,
  Linking,
  Platform,
} from "react-native";

import * as Clipboard from "expo-clipboard";

import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";

const AgentDashboard = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [userData, setUserData] = useState(null);
  const [supervisor, setSupervisor] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalSalesValue: 0,
    commissionsEarned: 0,
    bonusEarned: 0,
    monthlyTargetSales: 0,
  });

  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });

        return;
      }

      const response = await axios.get(`${BASE_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.data?.success) {
        setUserData(response.data.user || response.data.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchAgentData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [perfRes, supRes] = await Promise.all([
        axios
          .get(`${BASE_URL}/agent/performance`, config)
          .catch(() => ({ data: { data: null } })),

        axios
          .get(`${BASE_URL}/agent/my-supervisor`, config)
          .catch(() => ({ data: { data: null } })),
      ]);

      if (perfRes.data?.data) {
        setPerformance(perfRes.data.data);
      }

      if (supRes.data?.data) {
        setSupervisor(supRes.data.data);
      } else {
        setSupervisor("No Supervisor Assigned Yet");
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchAgentData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);

    fetchUserData();
    fetchAgentData();
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
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.6)", "rgba(248,250,252,0.95)"]}
          style={styles.fullOverlay}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.topHeader}>
            <View style={styles.navRow}>
              <View style={styles.logoCircle}>
                <Image
                  source={require("../assets/Logo.png")}
                  style={styles.logoImg}
                />
              </View>

              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="#0f172a"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>

              <Text style={styles.userName}>
                {userData
                  ? `${userData.firstName} ${userData.surname}`
                  : "Loading..."}
              </Text>
            </View>
          </View>

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
                  style={{
                    marginLeft: 15,
                  }}
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

                <Text
                  style={[
                    styles.actionBtnText,
                    {
                      color: "#fff",
                    },
                  ]}
                >
                  SUPPORT
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <Text style={styles.sectionLabel}>Automatic Funding Accounts</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bankScroll}
          >
            <TouchableOpacity
              style={styles.bankBox}
              onPress={() => copyToClipboard(userData?.accountNumber)}
            >
              <View style={styles.bankInfo}>
                <View style={styles.bankLogoCircle}>
                  <Text style={styles.bankLogoText}>WB</Text>
                </View>

                <View>
                  <Text style={styles.bankTitle}>
                    {userData?.bankName || "Wema Bank"}
                  </Text>

                  <Text style={styles.accNo}>
                    {userData?.accountNumber || "Generating..."}
                  </Text>
                </View>
              </View>

              <Ionicons name="copy-outline" size={18} color="#1e40af" />
            </TouchableOpacity>
          </ScrollView>

          <Text style={styles.sectionLabel}>Our Services</Text>

          <View style={styles.servicesContainer}>
            <View style={styles.grid}>
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigation.navigate("BuyData")}
              >
                <View style={styles.iconBox}>
                  <FontAwesome5 name="wifi" size={20} color="#0ea5e9" />
                </View>

                <Text style={styles.gridLabel}>Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigation.navigate("BuyAirtime")}
              >
                <View style={styles.iconBox}>
                  <FontAwesome5 name="phone-alt" size={20} color="#22c55e" />
                </View>

                <Text style={styles.gridLabel}>Airtime</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigation.navigate("Electricity")}
              >
                <View style={styles.iconBox}>
                  <FontAwesome5 name="bolt" size={20} color="#eab308" />
                </View>

                <Text style={styles.gridLabel}>Power</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => navigation.navigate("Cable")}
              >
                <View style={styles.iconBox}>
                  <FontAwesome5 name="tv" size={20} color="#8b5cf6" />
                </View>

                <Text style={styles.gridLabel}>Cable</Text>
              </TouchableOpacity>
            </View>
          </View>

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target & Performance</Text>

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
                    {
                      width: `${achievementPercentage}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.targetRowAlt}>
                <Text style={styles.progressSubText}>
                  Current: ₦{currentSales}
                </Text>

                <Text style={styles.remainingText}>
                  Remaining: ₦{remainingToTarget}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
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

          <View style={styles.footerBranding}>
            <Text style={styles.footerHeadline}>Why Choose Ayax Xpress?</Text>

            <View style={styles.trustGrid}>
              <View style={styles.trustItem}>
                <View
                  style={[
                    styles.trustIconCircle,
                    {
                      backgroundColor: "#dcfce7",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={28}
                    color="#16a34a"
                  />
                </View>

                <Text style={styles.trustTitle}>100% Secure</Text>

                <Text style={styles.trustSub}>Encrypted</Text>
              </View>

              <View style={styles.trustItem}>
                <View
                  style={[
                    styles.trustIconCircle,
                    {
                      backgroundColor: "#fef9c3",
                    },
                  ]}
                >
                  <Ionicons name="flash" size={28} color="#ca8a04" />
                </View>

                <Text style={styles.trustTitle}>Instant</Text>

                <Text style={styles.trustSub}>Automated</Text>
              </View>

              <View style={styles.trustItem}>
                <View
                  style={[
                    styles.trustIconCircle,
                    {
                      backgroundColor: "#e0f2fe",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="headset"
                    size={28}
                    color="#0284c7"
                  />
                </View>

                <Text style={styles.trustTitle}>24/7 Support</Text>

                <Text style={styles.trustSub}>Reliable</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="home" size={24} color="#1e40af" />

            <Text
              style={[
                styles.tabLabel,
                {
                  color: "#1e40af",
                },
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() =>
              navigation.navigate("Main", {
                screen: "Wallet History",
              })
            }
          >
            <Ionicons name="time-outline" size={24} color="#94a3b8" />

            <Text
              style={[
                styles.tabLabel,
                {
                  color: "#94a3b8",
                },
              ]}
            >
              History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-outline" size={24} color="#94a3b8" />

            <Text
              style={[
                styles.tabLabel,
                {
                  color: "#94a3b8",
                },
              ]}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>

        <Modal visible={menuVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDarkMode ? "#1e293b" : "#fff",
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setMenuVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isDarkMode ? "#fff" : "#000"}
                />
              </TouchableOpacity>

              <Text
                style={[
                  styles.menuTitle,
                  {
                    color: isDarkMode ? "#fff" : "#000",
                  },
                ]}
              >
                Menu
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);

                  navigation.navigate("Profile");
                }}
              >
                <Text
                  style={[
                    styles.menuItem,
                    {
                      color: isDarkMode ? "#cbd5e1" : "#334155",
                    },
                  ]}
                >
                  👤 My Profile
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginVertical: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setMenuVisible(false);

                    navigation.navigate("Settings");
                  }}
                >
                  <Text
                    style={[
                      styles.menuItem,
                      {
                        color: isDarkMode ? "#fff" : "#000",
                      },
                    ]}
                  >
                    ⚙️ Settings
                  </Text>
                </TouchableOpacity>

                <Switch value={isDarkMode} disabled />
              </View>

              <TouchableOpacity
                onPress={handleLogout}
                style={{ marginTop: 30 }}
              >
                <Text
                  style={[
                    styles.menuItem,
                    {
                      color: "red",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  🚪 Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  fullOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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

  logoCircle: {
    width: 45,
    height: 45,
    backgroundColor: "#0f172a",
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
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
    fontWeight: "500",
  },

  userName: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "bold",
  },

  walletCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 25,
    elevation: 10,
    marginHorizontal: 16,
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
    justifyContent: "center",
    alignItems: "center",
  },

  innerBtnGradient: {
    flex: 1,
    width: "100%",
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
    color: "#1e293b",
    marginBottom: 15,
    paddingLeft: 20,
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
    marginLeft: 20,
    marginRight: 15,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#1e40af",
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
    fontSize: 12,
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
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 28,
    padding: 20,
    elevation: 4,
    marginHorizontal: 16,
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
    elevation: 1,
  },

  gridLabel: {
    color: "#475569",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
  },

  statsGrid: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statsGridAlt: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 6,
    elevation: 3,
  },

  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 5,
  },

  statUnit: {
    fontSize: 12,
    color: "#94a3b8",
  },

  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },

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
  },

  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  targetRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  targetLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  targetValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e3a8a",
    marginTop: 2,
  },

  rightAlign: {
    alignItems: "flex-end",
  },

  percentageText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#059669",
  },

  progressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    marginTop: 15,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#059669",
  },

  progressSubText: {
    fontSize: 12,
    color: "#475569",
  },

  remainingText: {
    fontSize: 12,
    color: "#475569",
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
  },

  infoText: {
    color: "#64748b",
  },

  supName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a8a",
  },

  supPhone: {
    fontSize: 14,
    color: "#475569",
    marginTop: 2,
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
    textTransform: "uppercase",
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
    borderRadius: 27.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 3,
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
    height: 85,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    padding: 30,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "40%",
  },

  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },

  menuItem: {
    fontSize: 18,
    marginVertical: 10,
  },

  closeBtn: {
    alignSelf: "flex-end",
  },
});

export default AgentDashboard;
