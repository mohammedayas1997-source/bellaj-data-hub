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

  // ================= FETCH =================

  const fetchAgentAndProfileData = async () => {
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
        axios.get(`${BASE_URL}/user/profile`, config),
        axios.get(`${BASE_URL}/agent/performance`, config),
        axios.get(`${BASE_URL}/agent/my-supervisor`, config),
      ]);

      if (profileRes?.data?.success) {
        setUserData(profileRes.data.user || profileRes.data.data);
      }

      if (perfRes?.data?.data) {
        setPerformance(perfRes.data.data);
      }

      if (supRes?.data?.data) {
        setSupervisor(supRes.data.data);
      }
    } catch (error) {
      console.log("Dashboard Error:", error);

      if (error?.response?.status === 401) {
        await AsyncStorage.clear();

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
    fetchAgentAndProfileData();
  }, []);

  // ================= REFRESH =================

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentAndProfileData();
  };

  // ================= COPY =================

  const copyToClipboard = async (text) => {
    if (!text) return;

    await Clipboard.setStringAsync(text);

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied Successfully", ToastAndroid.SHORT);
    }
  };

  // ================= WHATSAPP =================

  const openWhatsApp = async () => {
    try {
      const phoneNumber = "+2349061244444";

      const message =
        "Hello Ayax Xpress Support, I need assistance with my account.";

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

  // ================= LOGOUT =================

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
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

              await AsyncStorage.clear();

              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                }),
              );
            } catch (error) {
              console.log("Logout Error:", error);

              Alert.alert("Error", "Logout Failed");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  // ================= PERFORMANCE =================

  const currentSales = performance.totalSalesValue || 0;

  const targetSales = performance.monthlyTargetSales || 100000;

  const achievementPercentage =
    targetSales > 0
      ? Math.min(Math.round((currentSales / targetSales) * 100), 100)
      : 0;

  const remainingToTarget =
    targetSales - currentSales > 0 ? targetSales - currentSales : 0;

  // ================= LOADING =================

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // ================= UI =================

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? "#020617" : "#f1f5f9",
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        resizeMode="cover"
        style={styles.backgroundImage}
        imageStyle={{
          opacity: 0.15,
        }}
      >
        {/* Overlay */}

        <LinearGradient
          colors={["rgba(255,255,255,0.75)", "rgba(248,250,252,0.96)"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/Logo.png")}
                style={styles.logo}
              />
            </View>

            <TouchableOpacity onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={32} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <Text style={styles.welcomeText}>Agent Control Panel</Text>

          <Text style={styles.userName}>
            {userData?.firstName || "Agent"} {userData?.surname || ""}
          </Text>
        </View>

        {/* MAIN SCROLL */}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* WALLET */}

          <LinearGradient
            colors={["#1d4ed8", "#1e3a8a"]}
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

            <View style={styles.balanceRow}>
              <Text style={styles.balanceCurrency}>₦</Text>

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

            <View style={styles.walletButtons}>
              <TouchableOpacity
                style={styles.walletBtn}
                onPress={() => navigation.navigate("FundWallet")}
              >
                <LinearGradient
                  colors={["#38bdf8", "#0284c7"]}
                  style={styles.walletBtnGradient}
                >
                  <Ionicons name="add-circle" size={18} color="#fff" />

                  <Text style={styles.walletBtnText}>FUND</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportBtn}
                onPress={openWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#22c55e" />

                <Text style={styles.supportText}>SUPPORT</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* BANK */}

          <Text style={styles.sectionTitle}>Funding Accounts</Text>

          <BankCard
            bank={userData?.bankName || "Wema Bank"}
            acc={userData?.accountNumber || "Generating..."}
            code="WB"
            onCopy={() => copyToClipboard(userData?.accountNumber)}
          />

          {/* STATS */}

          <Text style={styles.sectionTitle}>Performance Metrics</Text>

          <View style={styles.statsRow}>
            <StatCard
              title="Monthly Volume"
              value={performance.totalGB || 0}
              unit="GB"
              color="#2563eb"
            />

            <StatCard
              title="Revenue"
              value={`₦${currentSales}`}
              color="#059669"
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title="Commission"
              value={`₦${performance.commissionsEarned || 0}`}
              color="#d97706"
            />

            <StatCard
              title="Bonus"
              value={`₦${performance.bonusEarned || 0}`}
              color="#dc2626"
            />
          </View>

          {/* TARGET */}

          <View style={styles.targetCard}>
            <View style={styles.targetTop}>
              <View>
                <Text style={styles.targetLabel}>Monthly Target</Text>

                <Text style={styles.targetAmount}>₦{targetSales}</Text>
              </View>

              <Text style={styles.percentage}>{achievementPercentage}%</Text>
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
              <Text style={styles.bottomSmall}>Current: ₦{currentSales}</Text>

              <Text style={styles.bottomSmall}>
                Remaining: ₦{remainingToTarget}
              </Text>
            </View>
          </View>

          {/* SERVICES */}

          <Text style={styles.sectionTitle}>Agent Services</Text>

          <View style={styles.servicesBox}>
            <View style={styles.grid}>
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
                label="Power"
                color="#eab308"
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
                icon="fingerprint"
                label="NIMC"
                color="#ec4899"
                onPress={() => navigation.navigate("NIMC")}
              />

              <ServiceItem
                icon="user-shield"
                label="BVN"
                color="#64748b"
                onPress={() => navigation.navigate("BVNScreen")}
              />

              <ServiceItem
                icon="shield-alt"
                label="NIN"
                color="#1e40af"
                onPress={() => navigation.navigate("NINValidation")}
              />
            </View>
          </View>

          {/* SUPERVISOR */}

          <Text style={styles.sectionTitle}>Assigned Supervisor</Text>

          <View style={styles.infoBox}>
            {typeof supervisor === "string" ? (
              <Text>{supervisor}</Text>
            ) : (
              <>
                <Text style={styles.supervisorName}>
                  {supervisor?.name || "No Supervisor"}
                </Text>

                <Text style={styles.supervisorPhone}>
                  {supervisor?.phone || ""}
                </Text>
              </>
            )}
          </View>

          {/* ACTIONS */}

          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.fullBtn}
            onPress={() => navigation.navigate("NewSale")}
          >
            <Text style={styles.fullBtnText}>Process New Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fullBtn}
            onPress={() => navigation.navigate("SalesHistory")}
          >
            <Text style={styles.fullBtnText}>Sales History</Text>
          </TouchableOpacity>

          {/* EXTRA SPACE */}

          <View style={{ height: 180 }} />
        </ScrollView>

        {/* SIDE MENU */}

        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              activeOpacity={1}
              style={styles.overlay}
              onPress={() => setMenuVisible(false)}
            />

            <View
              style={[
                styles.sideMenu,
                {
                  backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
                },
              ]}
            >
              <View style={styles.menuHeader}>
                <View style={styles.sideLogoContainer}>
                  <Image
                    source={require("../assets/Logo.png")}
                    style={styles.menuLogo}
                  />
                </View>

                <TouchableOpacity onPress={() => setMenuVisible(false)}>
                  <Ionicons
                    name="close"
                    size={30}
                    color={isDarkMode ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.profileBox}>
                <View style={styles.avatar}>
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

                <Text style={styles.profileEmail}>{userData?.email}</Text>
              </View>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Profile");
                }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color="#2563eb"
                />

                <Text
                  style={[
                    styles.menuItemText,
                    {
                      color: isDarkMode ? "#fff" : "#0f172a",
                    },
                  ]}
                >
                  Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("Settings");
                }}
              >
                <Ionicons name="settings-outline" size={24} color="#7c3aed" />

                <Text
                  style={[
                    styles.menuItemText,
                    {
                      color: isDarkMode ? "#fff" : "#0f172a",
                    },
                  ]}
                >
                  Settings
                </Text>
              </TouchableOpacity>

              <View style={styles.menuItem}>
                <Ionicons name="moon-outline" size={24} color="#f59e0b" />

                <Text
                  style={[
                    styles.menuItemText,
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

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#fff" />

                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* BOTTOM TAB */}

        <View style={styles.bottomTab}>
          <TabItem icon="home" label="Dashboard" active />

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
            onPress={openWhatsApp}
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

// ================= COMPONENTS =================

const BankCard = ({ bank, acc, code, onCopy }) => (
  <TouchableOpacity style={styles.bankCard} onPress={onCopy}>
    <View style={styles.bankLeft}>
      <View style={styles.bankCircle}>
        <Text style={styles.bankCode}>{code}</Text>
      </View>

      <View>
        <Text style={styles.bankName}>{bank}</Text>

        <Text style={styles.accountNumber}>{acc}</Text>
      </View>
    </View>

    <Ionicons name="copy-outline" size={20} color="#2563eb" />
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
    <Text style={styles.statTitle}>{title}</Text>

    <Text style={styles.statValue}>
      {value} <Text style={styles.statUnit}>{unit}</Text>
    </Text>
  </View>
);

const ServiceItem = ({ icon, label, color, onPress }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress}>
    <View style={styles.iconBox}>
      <FontAwesome5 name={icon} size={20} color={color} />
    </View>

    <Text style={styles.gridLabel}>{label}</Text>
  </TouchableOpacity>
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

// ================= STYLES =================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingTop: Platform.OS === "android" ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  sideLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  welcomeText: {
    marginTop: 20,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },

  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 5,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 200,
    flexGrow: 1,
  },

  walletCard: {
    borderRadius: 26,
    padding: 22,
    marginTop: 10,
    marginBottom: 20,
    elevation: 8,
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
    color: "#7dd3fc",
    fontWeight: "700",
  },

  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  balanceCurrency: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },

  balanceText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginLeft: 6,
  },

  walletButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  walletBtn: {
    width: "48%",
    height: 50,
    borderRadius: 14,
    overflow: "hidden",
  },

  walletBtnGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  walletBtnText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },

  supportBtn: {
    width: "48%",
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  supportText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 15,
    marginTop: 10,
  },

  bankCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    elevation: 4,
  },

  bankLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  bankCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  bankCode: {
    color: "#2563eb",
    fontWeight: "bold",
  },

  bankName: {
    color: "#64748b",
    fontSize: 12,
  },

  accountNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 5,
    elevation: 3,
  },

  statTitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },

  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 6,
  },

  statUnit: {
    fontSize: 12,
    color: "#94a3b8",
  },

  targetCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    elevation: 3,
  },

  targetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  targetLabel: {
    color: "#64748b",
    fontSize: 13,
  },

  targetAmount: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },

  percentage: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#059669",
  },

  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
    marginTop: 18,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#059669",
  },

  targetBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  bottomSmall: {
    color: "#64748b",
    fontSize: 12,
  },

  servicesBox: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 20,
    elevation: 3,
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
    marginBottom: 20,
  },

  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  gridLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },

  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },

  supervisorName: {
    fontSize: 17,
    fontWeight: "bold",
  },

  supervisorPhone: {
    color: "#2563eb",
    marginTop: 5,
  },

  fullBtn: {
    backgroundColor: "#1d4ed8",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },

  fullBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  modalContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  overlay: {
    flex: 1,
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
    marginBottom: 30,
  },

  menuLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },

  profileBox: {
    alignItems: "center",
    marginBottom: 40,
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 50,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 32,
  },

  profileName: {
    fontWeight: "bold",
    fontSize: 20,
  },

  profileEmail: {
    color: "#64748b",
    marginTop: 4,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  menuItemText: {
    marginLeft: 15,
    fontWeight: "600",
    fontSize: 16,
  },

  logoutBtn: {
    backgroundColor: "#dc2626",
    height: 55,
    borderRadius: 18,
    marginTop: 40,
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
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    elevation: 10,
  },

  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
});

export default AgentDashboard;
