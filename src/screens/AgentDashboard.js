import React, { useState, useEffect, useContext, useCallback } from "react";
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
} from "@expo/vector-icons";

import { CommonActions } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";

const AgentDashboard = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [userData, setUserData] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalSalesValue: 0,
    commissionsEarned: 0,
    bonusEarned: 0,
    monthlyTargetSales: 100000,
  });

  const [supervisor, setSupervisor] = useState(null);

  const fetchAgentAndProfileData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        setLoading(false);

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          }),
        );

        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      };

      const [profileRes, perfRes, supRes] = await Promise.all([
        axios
          .get(`${BASE_URL}/user/profile`, config)
          .catch(() => ({ data: { success: false } })),

        axios
          .get(`${BASE_URL}/agent/performance`, config)
          .catch(() => ({ data: { data: null } })),

        axios
          .get(`${BASE_URL}/agent/my-supervisor`, config)
          .catch(() => ({ data: { data: null } })),
      ]);

      if (profileRes?.data?.success) {
        setUserData(profileRes.data.user || profileRes.data.data);
      }

      if (perfRes?.data?.data) {
        setPerformance(perfRes.data.data);
      }

      if (supRes?.data?.data) {
        setSupervisor(supRes.data.data);
      } else {
        setSupervisor("No Supervisor Assigned Yet");
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
  }, [navigation]);

  useEffect(() => {
    fetchAgentAndProfileData();
  }, [fetchAgentAndProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentAndProfileData();
  };

  const copyToClipboard = async (text) => {
    if (!text) return;

    await Clipboard.setStringAsync(text);

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied Successfully", ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", "Account number copied");
    }
  };

  const openWhatsApp = async () => {
    try {
      const phoneNumber = "+2349061244444";

      const message =
        "Hello Ayax Xpress Support, I need assistance with my Agent account.";

      const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
        message,
      )}`;

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/${phoneNumber.replace("+", "")}`);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open WhatsApp");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout from your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",

          onPress: async () => {
            try {
              setMenuVisible(false);

              await AsyncStorage.multiRemove([
                "userToken",
                "userData",
                "walletData",
              ]);

              await AsyncStorage.clear();

              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                }),
              );
            } catch (error) {
              console.log("Logout Error:", error);

              Alert.alert(
                "Logout Failed",
                "Something went wrong while logging out.",
              );
            }
          },
        },
      ],
    );
  };

  const currentSales = performance.totalSalesValue || 0;
  const targetSales = performance.monthlyTargetSales || 100000;

  const remainingToTarget =
    targetSales - currentSales > 0 ? targetSales - currentSales : 0;

  const achievementPercentage =
    targetSales > 0
      ? Math.min(Math.round((currentSales / targetSales) * 100), 100)
      : 0;

  if (loading) {
    return (
      <View
        style={[
          styles.loaderContainer,
          {
            backgroundColor: isDarkMode ? "#020617" : "#f8fafc",
          },
        ]}
      >
        <ActivityIndicator size="large" color="#2563eb" />

        <Text style={styles.loadingText}>Loading Dashboard...</Text>
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
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      {/* BACKGROUND IMAGE RETURNED */}
      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={
            isDarkMode
              ? ["rgba(2,6,23,0.95)", "rgba(15,23,42,0.96)"]
              : ["rgba(255,255,255,0.70)", "rgba(248,250,252,0.96)"]
          }
          style={styles.overlay}
        >
          {/* HEADER */}
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
                  name="menu"
                  size={32}
                  color={isDarkMode ? "#fff" : "#0f172a"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Agent Control Dashboard</Text>

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
                  : "Ayax Agent"}
              </Text>
            </View>
          </View>

          {/* MAIN SCROLL */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces
            nestedScrollEnabled
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#2563eb"
              />
            }
          >
            {/* WALLET CARD */}
            <LinearGradient
              colors={["#1e40af", "#1d4ed8", "#2563eb"]}
              style={styles.walletCard}
            >
              <View style={styles.walletTop}>
                <Text style={styles.walletLabel}>Agent Available Balance</Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Main", {
                      screen: "Wallet History",
                    })
                  }
                >
                  <Text style={styles.historyText}>Transactions →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.balanceContainer}>
                <Text style={styles.currency}>₦</Text>

                <Text style={styles.balanceText}>
                  {isBalanceVisible
                    ? userData?.walletBalance || userData?.balance || "0.00"
                    : "********"}
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
                    colors={["#38bdf8", "#0ea5e9"]}
                    style={styles.innerBtnGradient}
                  >
                    <Ionicons name="add-circle" size={18} color="#fff" />

                    <Text style={styles.actionBtnText}>FUND WALLET</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.supportBtn}
                  onPress={openWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#22c55e" />

                  <Text style={styles.actionBtnText}>SUPPORT</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* FUNDING ACCOUNTS */}
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

            {userData?.accountNumber ? (
              <BankCard
                bank={userData?.bankName || "Wema Bank"}
                acc={userData?.accountNumber}
                code="WB"
                onCopy={() => copyToClipboard(userData?.accountNumber)}
                isDarkMode={isDarkMode}
              />
            ) : (
              <BankCard
                bank="Wema Bank (Pending)"
                acc="Generating..."
                code="WB"
                onCopy={() =>
                  Alert.alert(
                    "Please Wait",
                    "Virtual account still generating...",
                  )
                }
                isDarkMode={isDarkMode}
              />
            )}

            <BankCard
              bank="Paystack Terminal"
              acc="Automated Funding"
              code="PAY"
              onCopy={() =>
                Alert.alert(
                  "Info",
                  "Transfer to your assigned Wema account for instant funding.",
                )
              }
              isDarkMode={isDarkMode}
            />

            {/* STATS */}
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: isDarkMode ? "#fff" : "#1e293b",
                },
              ]}
            >
              Performance Metrics
            </Text>

            <View style={styles.statsGrid}>
              <StatCard
                title="Monthly Volume"
                value={performance.totalGB || 0}
                unit="GB"
                color="#2563eb"
              />

              <StatCard
                title="Revenue"
                value={`₦${currentSales}`}
                color="#16a34a"
              />
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                title="Commissions"
                value={`₦${performance.commissionsEarned || 0}`}
                color="#eab308"
              />

              <StatCard
                title="Bonus"
                value={`₦${performance.bonusEarned || 0}`}
                color="#dc2626"
              />
            </View>

            {/* TARGET */}
            <View style={styles.targetCard}>
              <View style={styles.targetRow}>
                <View>
                  <Text style={styles.targetLabel}>Monthly Target</Text>

                  <Text style={styles.targetValue}>₦{targetSales}</Text>
                </View>

                <View>
                  <Text style={styles.targetLabel}>Achievement</Text>

                  <Text style={styles.percentText}>
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

              <View style={styles.targetBottom}>
                <Text style={styles.smallText}>Current: ₦{currentSales}</Text>

                <Text style={styles.smallText}>
                  Remaining: ₦{remainingToTarget}
                </Text>
              </View>
            </View>

            {/* SERVICES */}
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: isDarkMode ? "#fff" : "#1e293b",
                },
              ]}
            >
              Agent Utility Services
            </Text>

            <View
              style={[
                styles.servicesContainer,
                {
                  backgroundColor: isDarkMode ? "#0f172a" : "#fff",
                },
              ]}
            >
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
                  color="#facc15"
                  label="Electricity"
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
                  label="NIMC"
                  onPress={() => navigation.navigate("NIMC")}
                />

                <ServiceItem
                  icon="fingerprint"
                  color="#ec4899"
                  label="NIN Mod"
                  onPress={() => navigation.navigate("NIMCModification")}
                />

                <ServiceItem
                  icon="user-shield"
                  color="#475569"
                  label="BVN"
                  onPress={() => navigation.navigate("BVNScreen")}
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
              </View>
            </View>

            {/* SUPERVISOR */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Assigned Supervisor</Text>

              {typeof supervisor === "string" ? (
                <Text style={styles.infoText}>{supervisor}</Text>
              ) : (
                <>
                  <Text style={styles.supName}>
                    {supervisor?.name || "N/A"}
                  </Text>

                  <Text style={styles.supPhone}>
                    {supervisor?.phone || "No Contact"}
                  </Text>
                </>
              )}
            </View>

            {/* QUICK ACTIONS */}
            <TouchableOpacity
              style={styles.bigActionBtn}
              onPress={() => navigation.navigate("NewSale")}
            >
              <Text style={styles.bigActionText}>Process New Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bigActionBtn}
              onPress={() => navigation.navigate("SalesHistory")}
            >
              <Text style={styles.bigActionText}>View Sales History</Text>
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footerBranding}>
              <Text style={styles.footerTitle}>Why Choose Ayax Xpress?</Text>

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
                  color="#eab308"
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

            <View style={{ height: 150 }} />
          </ScrollView>

          {/* SIDE MENU */}
          <Modal
            visible={menuVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setMenuVisible(false)}
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.overlayTouch}
                onPress={() => setMenuVisible(false)}
              />

              <View
                style={[
                  styles.sideMenu,
                  {
                    backgroundColor: isDarkMode ? "#0f172a" : "#fff",
                  },
                ]}
              >
                <View style={styles.menuHeader}>
                  <Image
                    source={require("../assets/Logo.png")}
                    style={styles.menuLogo}
                  />

                  <TouchableOpacity onPress={() => setMenuVisible(false)}>
                    <Ionicons
                      name="close"
                      size={28}
                      color={isDarkMode ? "#fff" : "#000"}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.profileArea}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {userData?.firstName?.charAt(0) || "A"}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.profileName,
                      {
                        color: isDarkMode ? "#fff" : "#0f172a",
                      },
                    ]}
                  >
                    {userData?.firstName} {userData?.surname}
                  </Text>

                  <Text style={styles.profileEmail}>
                    {userData?.email || "No Email"}
                  </Text>
                </View>

                <MenuItem
                  icon="person-circle-outline"
                  text="Profile"
                  color="#2563eb"
                  isDarkMode={isDarkMode}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("Profile");
                  }}
                />

                <MenuItem
                  icon="settings-outline"
                  text="Settings"
                  color="#7c3aed"
                  isDarkMode={isDarkMode}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate("Settings");
                  }}
                />

                <View style={styles.menuOption}>
                  <Ionicons name="moon-outline" size={24} color="#f59e0b" />

                  <Text
                    style={[
                      styles.menuOptionText,
                      {
                        color: isDarkMode ? "#fff" : "#0f172a",
                      },
                    ]}
                  >
                    Dark Mode
                  </Text>

                  <View style={{ flex: 1 }} />

                  <Switch value={isDarkMode} onValueChange={toggleTheme} />
                </View>

                <MenuItem
                  icon="logo-whatsapp"
                  text="Contact Support"
                  color="#22c55e"
                  isDarkMode={isDarkMode}
                  onPress={openWhatsApp}
                />

                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={22} color="#fff" />

                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* BOTTOM TAB */}
          <View
            style={[
              styles.bottomTab,
              {
                backgroundColor: isDarkMode ? "#0f172a" : "#fff",
              },
            ]}
          >
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
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
};

/* COMPONENTS */

const MenuItem = ({ icon, text, color, onPress, isDarkMode }) => (
  <TouchableOpacity style={styles.menuOption} onPress={onPress}>
    <Ionicons name={icon} size={24} color={color} />

    <Text
      style={[
        styles.menuOptionText,
        {
          color: isDarkMode ? "#fff" : "#0f172a",
        },
      ]}
    >
      {text}
    </Text>
  </TouchableOpacity>
);

const BankCard = ({ bank, acc, code, onCopy, isDarkMode }) => (
  <TouchableOpacity
    style={[
      styles.bankBox,
      {
        backgroundColor: isDarkMode ? "#0f172a" : "#fff",
      },
    ]}
    onPress={onCopy}
  >
    <View style={styles.bankInfo}>
      <View style={styles.bankLogoCircle}>
        <Text style={styles.bankLogoText}>{code}</Text>
      </View>

      <View>
        <Text style={styles.bankTitle}>{bank}</Text>

        <Text
          style={[
            styles.accNo,
            {
              color: isDarkMode ? "#fff" : "#0f172a",
            },
          ]}
        >
          {acc}
        </Text>
      </View>
    </View>

    <Ionicons name="copy-outline" size={20} color="#2563eb" />
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
        <Ionicons name={icon} size={26} color={color} />
      ) : (
        <MaterialCommunityIcons name={icon} size={26} color={color} />
      )}
    </View>

    <Text style={styles.trustTitle}>{title}</Text>

    <Text style={styles.trustSub}>{sub}</Text>
  </View>
);

const TabItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Ionicons name={icon} size={24} color={active ? "#2563eb" : "#94a3b8"} />

    <Text
      style={[
        styles.tabLabel,
        {
          color: active ? "#2563eb" : "#94a3b8",
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },

  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  overlay: {
    flex: 1,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "600",
  },

  topHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },

  logoImg: {
    width: 34,
    height: 34,
    resizeMode: "contain",
  },

  welcomeSection: {
    marginTop: 20,
  },

  welcomeText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },

  userName: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 180,
    paddingHorizontal: 16,
    paddingBottom: 150,
    flexGrow: 1,
  },

  walletCard: {
    borderRadius: 28,
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
    color: "#dbeafe",
    fontSize: 13,
  },

  historyText: {
    color: "#bfdbfe",
    fontWeight: "700",
  },

  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },

  currency: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
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
    marginTop: 25,
  },

  actionBtn: {
    width: "48%",
    height: 50,
    borderRadius: 16,
    overflow: "hidden",
  },

  innerBtnGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  supportBtn: {
    width: "48%",
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  actionBtnText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },

  sectionLabel: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 15,
    marginTop: 10,
  },

  bankBox: {
    padding: 18,
    borderRadius: 22,
    marginBottom: 15,
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
    marginRight: 14,
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
    fontWeight: "bold",
    fontSize: 17,
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    borderLeftWidth: 5,
    elevation: 3,
  },

  statLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },

  statValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },

  statUnit: {
    fontSize: 12,
  },

  targetCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    marginTop: 10,
    marginBottom: 20,
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
    marginTop: 5,
    fontWeight: "bold",
    fontSize: 18,
    color: "#0f172a",
  },

  percentText: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: 22,
    marginTop: 5,
  },

  progressTrack: {
    height: 12,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    marginTop: 18,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 12,
  },

  targetBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  smallText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },

  servicesContainer: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
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
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  gridLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
  },

  infoBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 22,
    marginBottom: 20,
  },

  infoTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
    color: "#0f172a",
  },

  infoText: {
    color: "#64748b",
  },

  supName: {
    fontWeight: "bold",
    fontSize: 17,
    color: "#0f172a",
  },

  supPhone: {
    marginTop: 5,
    color: "#2563eb",
    fontWeight: "600",
  },

  bigActionBtn: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 14,
  },

  bigActionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  footerBranding: {
    marginTop: 15,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
  },

  footerTitle: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 20,
  },

  trustGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  trustItem: {
    alignItems: "center",
  },

  trustIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
  },

  trustTitle: {
    marginTop: 8,
    fontWeight: "bold",
    fontSize: 12,
  },

  trustSub: {
    fontSize: 10,
    color: "#64748b",
  },

  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    elevation: 20,
  },

  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  tabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: "700",
  },

  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },

  overlayTouch: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  sideMenu: {
    width: width * 0.82,
    height: height,
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuLogo: {
    width: 55,
    height: 55,
    resizeMode: "contain",
  },

  profileArea: {
    alignItems: "center",
    marginVertical: 35,
  },

  avatarCircle: {
    width: 85,
    height: 85,
    borderRadius: 42,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 34,
  },

  profileName: {
    fontSize: 20,
    fontWeight: "bold",
  },

  profileEmail: {
    color: "#94a3b8",
    marginTop: 6,
  },

  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  menuOptionText: {
    marginLeft: 15,
    fontWeight: "700",
    fontSize: 15,
  },

  logoutBtn: {
    backgroundColor: "#dc2626",
    padding: 18,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 40,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 16,
  },
});

export default AgentDashboard;
