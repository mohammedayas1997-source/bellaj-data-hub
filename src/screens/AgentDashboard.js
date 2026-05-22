import React, { useState, useEffect, useRef } from "react";
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
  Animated,
} from "react-native";

import * as Clipboard from "expo-clipboard";

import { useNavigation } from "@react-navigation/native";

import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const isTabletOrDesktop = width >= 768;

const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";

const AgentDashboard = () => {
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    fetchUserData();
    fetchAgentData();
  }, []);

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

  const onRefresh = () => {
    setRefreshing(true);

    fetchUserData();

    fetchAgentData();
  };

  const copyToClipboard = async (text) => {
    if (!text) return;

    await Clipboard.setStringAsync(text);

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied Successfully", ToastAndroid.SHORT);
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349061244444";

    const message = "Hello Ayax Support";

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

  const services = [
    {
      name: "Data",
      icon: "wifi",
      color: "#0ea5e9",
      screen: "BuyData",
      type: "FontAwesome5",
    },

    {
      name: "Airtime",
      icon: "phone-alt",
      color: "#22c55e",
      screen: "BuyAirtime",
      type: "FontAwesome5",
    },

    {
      name: "Power",
      icon: "bolt",
      color: "#eab308",
      screen: "Electricity",
      type: "FontAwesome5",
    },

    {
      name: "Cable",
      icon: "tv",
      color: "#8b5cf6",
      screen: "Cable",
      type: "FontAwesome5",
    },

    {
      name: "Wallet",
      icon: "wallet",
      color: "#2563eb",
      screen: "FundWallet",
      type: "Ionicons",
    },

    {
      name: "History",
      icon: "time-outline",
      color: "#f97316",
      screen: "Wallet History",
      type: "Ionicons",
    },

    {
      name: "Profile",
      icon: "person-circle-outline",
      color: "#ec4899",
      screen: "Profile",
      type: "Ionicons",
    },

    {
      name: "Settings",
      icon: "settings-outline",
      color: "#475569",
      screen: "Settings",
      type: "Ionicons",
    },
  ];

  const renderIcon = (item) => {
    if (item.type === "FontAwesome5") {
      return <FontAwesome5 name={item.icon} size={22} color={item.color} />;
    }

    return <Ionicons name={item.icon} size={24} color={item.color} />;
  };

  const StatCard = ({ title, value, unit, color, icon }) => (
    <Animated.View
      style={[
        styles.statCard,
        {
          borderLeftColor: color,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.statTop}>
        <Text style={styles.statLabel}>{title}</Text>

        <Feather name={icon} size={18} color={color} />
      </View>

      <Text style={styles.statValue}>
        {value}

        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" />

      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.7)", "rgba(248,250,252,0.95)"]}
          style={styles.overlay}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
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
                    size={30}
                    color="#0f172a"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.welcomeText}>Welcome Back</Text>

              <Text style={styles.userName}>
                {userData
                  ? `${userData.firstName} ${userData.surname}`
                  : "Agent"}
              </Text>
            </View>

            <LinearGradient
              colors={["#2563eb", "#1e3a8a"]}
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
                  {isBalanceVisible
                    ? userData?.walletBalance || "0.00"
                    : "******"}
                </Text>

                <TouchableOpacity
                  onPress={() => setIsBalanceVisible(!isBalanceVisible)}
                >
                  <Ionicons
                    name={isBalanceVisible ? "eye-outline" : "eye-off-outline"}
                    size={24}
                    color="#fff"
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.walletActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate("FundWallet")}
                >
                  <LinearGradient
                    colors={["#38bdf8", "#0284c7"]}
                    style={styles.gradientBtn}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#fff"
                    />

                    <Text style={styles.actionBtnText}>FUND</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.supportBtn}
                  onPress={openWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#22c55e" />

                  <Text style={styles.supportText}>SUPPORT</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <Text style={styles.sectionLabel}>Automatic Funding Account</Text>

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
                    {userData?.accountNumber || "Generating"}
                  </Text>
                </View>
              </View>

              <Ionicons name="copy-outline" size={22} color="#2563eb" />
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Services</Text>

            <View style={styles.servicesContainer}>
              {services.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.gridItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (item.screen === "Wallet History") {
                      navigation.navigate("Main", {
                        screen: "Wallet History",
                      });
                    } else {
                      navigation.navigate(item.screen);
                    }
                  }}
                >
                  <View style={styles.iconBox}>{renderIcon(item)}</View>

                  <Text style={styles.gridLabel}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                title="Monthly Volume"
                value={performance.totalGB || 0}
                unit="GB"
                color="#2563eb"
                icon="activity"
              />

              <StatCard
                title="Monthly Revenue"
                value={`₦${currentSales}`}
                unit=""
                color="#16a34a"
                icon="dollar-sign"
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                title="Commissions"
                value={`₦${performance.commissionsEarned || 0}`}
                unit=""
                color="#ca8a04"
                icon="award"
              />

              <StatCard
                title="Bonus"
                value={`₦${performance.bonusEarned || 0}`}
                unit=""
                color="#dc2626"
                icon="gift"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target Performance</Text>

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
                  <Animated.View
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
                    Current ₦{currentSales}
                  </Text>

                  <Text style={styles.remainingText}>
                    Remaining ₦{remainingToTarget}
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
              <View style={styles.trustItem}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={28}
                  color="#16a34a"
                />

                <Text style={styles.trustTitle}>Secure</Text>
              </View>

              <View style={styles.trustItem}>
                <Ionicons name="flash" size={28} color="#eab308" />

                <Text style={styles.trustTitle}>Fast</Text>
              </View>

              <View style={styles.trustItem}>
                <MaterialCommunityIcons
                  name="headset"
                  size={28}
                  color="#0284c7"
                />

                <Text style={styles.trustTitle}>24/7 Support</Text>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </Animated.View>
        </ScrollView>

        <View style={styles.bottomTab}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="home" size={24} color="#2563eb" />

            <Text style={[styles.tabLabel, { color: "#2563eb" }]}>Home</Text>
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

            <Text style={styles.tabLabel}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-outline" size={24} color="#94a3b8" />

            <Text style={styles.tabLabel}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={24} color="#94a3b8" />

            <Text style={styles.tabLabel}>Settings</Text>
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
                  size={26}
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
                Dashboard Menu
              </Text>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate("Profile")}
              >
                <Ionicons name="person-outline" size={22} color="#2563eb" />

                <Text style={styles.menuText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate("Settings")}
              >
                <Ionicons name="settings-outline" size={22} color="#2563eb" />

                <Text style={styles.menuText}>Settings</Text>

                <Switch value={isDarkMode} disabled />
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#fff" />

                <Text style={styles.logoutText}>Logout</Text>
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
  },

  overlay: {
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  logoImg: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },

  welcomeText: {
    marginTop: 20,
    color: "#64748b",
    fontSize: 15,
  },

  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
  },

  walletCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 24,
    padding: 22,
    elevation: 6,
  },

  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  walletLabel: {
    color: "#dbeafe",
    fontSize: 13,
  },

  historyText: {
    color: "#93c5fd",
    fontWeight: "600",
  },

  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  currency: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },

  balanceText: {
    color: "#fff",
    fontSize: width > 500 ? 40 : 32,
    fontWeight: "bold",
    marginLeft: 5,
  },

  walletActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },

  actionBtn: {
    width: "48%",
    height: 48,
    borderRadius: 14,
    overflow: "hidden",
  },

  gradientBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  supportBtn: {
    width: "48%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  supportText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "bold",
  },

  actionBtnText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "bold",
  },

  sectionLabel: {
    marginTop: 24,
    marginBottom: 15,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },

  bankBox: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
  },

  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  bankLogoCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  bankLogoText: {
    color: "#2563eb",
    fontWeight: "bold",
  },

  bankTitle: {
    color: "#64748b",
    fontSize: 12,
  },

  accNo: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "bold",
  },

  servicesContainer: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    elevation: 4,
  },

  gridItem: {
    width: isTabletOrDesktop ? "22%" : "23%",
    alignItems: "center",
    marginBottom: 22,
  },

  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    marginBottom: 8,
  },

  gridLabel: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },

  statsGrid: {
    paddingHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderLeftWidth: 5,
    elevation: 4,
  },

  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },

  statValue: {
    marginTop: 12,
    fontSize: width > 500 ? 24 : 18,
    fontWeight: "bold",
    color: "#0f172a",
  },

  statUnit: {
    fontSize: 12,
    color: "#94a3b8",
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 22,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 12,
  },

  targetCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },

  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  targetLabel: {
    color: "#64748b",
    fontSize: 12,
  },

  targetValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginTop: 4,
  },

  rightAlign: {
    alignItems: "flex-end",
  },

  percentageText: {
    color: "#16a34a",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 4,
  },

  progressTrack: {
    height: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 18,
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 20,
  },

  targetRowAlt: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressSubText: {
    color: "#64748b",
    fontSize: 12,
  },

  remainingText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },

  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    elevation: 4,
  },

  infoText: {
    color: "#64748b",
  },

  supName: {
    color: "#1e3a8a",
    fontWeight: "bold",
    fontSize: 18,
  },

  supPhone: {
    marginTop: 5,
    color: "#475569",
  },

  footerBranding: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 24,
    marginHorizontal: 16,
    borderRadius: 24,
    elevation: 4,
  },

  trustItem: {
    alignItems: "center",
  },

  trustTitle: {
    marginTop: 8,
    color: "#334155",
    fontWeight: "bold",
    fontSize: 12,
  },

  bottomTab: {
    height: 82,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 10,
    paddingBottom: 10,
  },

  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  tabLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 320,
  },

  closeBtn: {
    alignSelf: "flex-end",
  },

  menuTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 14,
  },

  menuText: {
    flex: 1,
    marginLeft: 12,
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 15,
  },

  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default AgentDashboard;
