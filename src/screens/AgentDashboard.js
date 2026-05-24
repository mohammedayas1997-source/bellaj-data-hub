import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
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

const { width, height } = Dimensions.get("window");

const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";

const AgentDashboard = ({ navigation }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);

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

      console.log("PROFILE RESPONSE =>", response.data);

      if (response?.data) {
        const user = response.data.user || response.data.data;

        setUserData(user);
      }
    } catch (error) {
      console.log(
        "FETCH PROFILE ERROR =>",
        error?.response?.data || error.message,
      );

      if (error?.response?.status === 401) {
        await AsyncStorage.clear();

        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      } else {
        Alert.alert("Error", "Unable to load dashboard. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (!text) return;

      await Clipboard.setStringAsync(text);

      if (Platform.OS === "android") {
        ToastAndroid.show("Account number copied", ToastAndroid.SHORT);
      } else {
        Alert.alert("Copied", "Account number copied");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const openWhatsApp = async () => {
    try {
      const phoneNumber = "2349061244444";

      const message =
        "Hello Ayax Xpress Support, I need assistance with my account.";

      const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
        message,
      )}`;

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/${phoneNumber}`);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open WhatsApp");
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#38bdf8" />

        <Text
          style={{
            color: "#fff",
            marginTop: 15,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Loading Dashboard...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.mainContainer,
        {
          backgroundColor: isDarkMode ? "#020617" : "#f1f5f9",
        },
      ]}
    >
      <StatusBar
        translucent={false}
        backgroundColor={isDarkMode ? "#020617" : "#f1f5f9"}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={
            isDarkMode
              ? ["rgba(2,6,23,0.75)", "rgba(2,6,23,0.97)"]
              : ["rgba(255,255,255,0.7)", "rgba(248,250,252,0.98)"]
          }
          style={styles.overlay}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
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

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.openDrawer()}
              >
                <Ionicons
                  name="menu"
                  size={30}
                  color={isDarkMode ? "#fff" : "#0f172a"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back 👋</Text>

              <Text
                style={[
                  styles.userName,
                  {
                    color: isDarkMode ? "#fff" : "#0f172a",
                  },
                ]}
              >
                {userData?.firstName || "Ayax"} {userData?.surname || "User"}
              </Text>
            </View>
          </View>

          {/* WALLET CARD */}

          <View style={styles.content}>
            <LinearGradient
              colors={["#1d4ed8", "#1e3a8a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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
                  <Text style={styles.historyText}>Transactions →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.balanceContainer}>
                <Text style={styles.currency}>₦</Text>

                <Text style={styles.balanceText}>
                  {isBalanceVisible
                    ? Number(userData?.walletBalance || 0).toLocaleString()
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
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("FundWallet")}
                >
                  <LinearGradient
                    colors={["#38bdf8", "#0284c7"]}
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
                      backgroundColor: "rgba(255,255,255,0.12)",
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={openWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#22c55e" />

                  <Text style={styles.supportText}>SUPPORT</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* BANK ACCOUNTS */}

            <Text
              style={[
                styles.sectionLabel,
                {
                  color: isDarkMode ? "#fff" : "#0f172a",
                },
              ]}
            >
              Funding Accounts
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              <BankCard
                bank={userData?.bankName || "Wema Bank"}
                acc={userData?.accountNumber || "Generating..."}
                code="WB"
                onCopy={() => copyToClipboard(userData?.accountNumber)}
              />

              <BankCard
                bank="Paystack"
                acc="Instant Funding"
                code="PAY"
                onCopy={() =>
                  Alert.alert(
                    "Info",
                    "Transfer to your Wema account for instant funding.",
                  )
                }
              />
            </ScrollView>

            {/* SERVICES */}

            <Text
              style={[
                styles.sectionLabel,
                {
                  color: isDarkMode ? "#fff" : "#0f172a",
                },
              ]}
            >
              Our Services
            </Text>

            <View
              style={[
                styles.servicesContainer,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(15,23,42,0.95)"
                    : "#ffffff",
                },
              ]}
            >
              <View style={styles.grid}>
                <ServiceItem
                  icon="wifi"
                  label="Data"
                  color="#0ea5e9"
                  isDarkMode={isDarkMode}
                  onPress={() => navigation.navigate("BuyData")}
                />

                <ServiceItem
                  icon="phone-alt"
                  label="Airtime"
                  color="#22c55e"
                  isDarkMode={isDarkMode}
                  onPress={() => navigation.navigate("BuyAirtime")}
                />

                <ServiceItem
                  icon="bolt"
                  label="Power"
                  color="#facc15"
                  isDarkMode={isDarkMode}
                  onPress={() => navigation.navigate("Electricity")}
                />

                <ServiceItem
                  icon="tv"
                  label="Cable"
                  color="#8b5cf6"
                  isDarkMode={isDarkMode}
                  onPress={() => navigation.navigate("Cable")}
                />

                <ServiceItem
                  icon="id-card"
                  label="NIMC"
                  color="#ef4444"
                  isDarkMode={isDarkMode}
                  onPress={() => navigation.navigate("NIMC")}
                />

                <ServiceItem
                  icon="fingerprint"
                  label="Modify"
                  color="#ec4899"
                  isDarkMode={isDarkMode}
                  onPress={() => navigation.navigate("NIMCModification")}
                />

                <ServiceItem
                  icon="user-shield"
                  label="BVN"
                  color="#64748b"
                  isDarkMode={isDarkMode}
                  onPress={() => navigation.navigate("BVNScreen")}
                />

                <ServiceItem
                  icon="shield-alt"
                  label="NIN"
                  color="#2563eb"
                  isDarkMode={isDarkMode}
                  onPress={() => navigation.navigate("NINValidation")}
                />
              </View>
            </View>

            {/* FOOTER */}

            <View style={styles.footerBranding}>
              <Text style={styles.footerHeadline}>Why Choose Ayax Xpress?</Text>

              <View style={styles.trustGrid}>
                <TrustItem
                  icon="shield-check"
                  title="Secure"
                  sub="Encrypted"
                  color="#16a34a"
                  bg="#dcfce7"
                />

                <TrustItem
                  icon="flash"
                  title="Instant"
                  sub="Fast"
                  color="#ca8a04"
                  bg="#fef9c3"
                />

                <TrustItem
                  icon="headset"
                  title="24/7"
                  sub="Support"
                  color="#0284c7"
                  bg="#dbeafe"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM TAB */}

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

const BankCard = ({ bank, acc, code, onCopy }) => (
  <TouchableOpacity style={styles.bankBox} activeOpacity={0.8} onPress={onCopy}>
    <View style={styles.bankInfo}>
      <View style={styles.bankLogoCircle}>
        <Text style={styles.bankLogoText}>{code}</Text>
      </View>

      <View>
        <Text style={styles.bankTitle}>{bank}</Text>

        <Text style={styles.accNo}>{acc}</Text>
      </View>
    </View>

    <Ionicons name="copy-outline" size={20} color="#1e40af" />
  </TouchableOpacity>
);

const ServiceItem = ({ icon, label, color, onPress, isDarkMode }) => (
  <TouchableOpacity
    style={styles.gridItem}
    activeOpacity={0.8}
    onPress={onPress}
  >
    <View style={styles.iconBox}>
      <FontAwesome5 name={icon} size={20} color={color} />
    </View>

    <Text
      style={[
        styles.gridLabel,
        {
          color: isDarkMode ? "#fff" : "#334155",
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const TrustItem = ({ icon, title, sub, color, bg }) => (
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
    height: height,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  topHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
    color: "#94a3b8",
    fontSize: 14,
  },

  userName: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 4,
  },

  content: {
    paddingHorizontal: 16,
  },

  walletCard: {
    borderRadius: 28,
    padding: 22,
    marginTop: 10,
  },

  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  walletLabel: {
    color: "#dbeafe",
    fontSize: 14,
  },

  historyText: {
    color: "#93c5fd",
    fontSize: 13,
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
    fontWeight: "700",
  },

  balanceText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    marginLeft: 6,
  },

  walletActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  actionBtn: {
    width: "48%",
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    overflow: "hidden",
  },

  innerBtnGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },

  supportText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },

  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 28,
    marginBottom: 16,
  },

  bankBox: {
    width: width * 0.78,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 22,
    marginRight: 15,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  bankLogoText: {
    color: "#1d4ed8",
    fontWeight: "bold",
  },

  bankTitle: {
    fontSize: 13,
    color: "#64748b",
  },

  accNo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
  },

  servicesContainer: {
    borderRadius: 28,
    padding: 18,
    elevation: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  gridItem: {
    width: "23%",
    alignItems: "center",
    marginBottom: 24,
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
    textAlign: "center",
  },

  footerBranding: {
    marginTop: 30,
    marginBottom: 30,
    paddingVertical: 24,
    backgroundColor: "#fff",
    borderRadius: 28,
  },

  footerHeadline: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#475569",
    marginBottom: 20,
  },

  trustGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },

  trustItem: {
    width: "30%",
    alignItems: "center",
  },

  trustIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  trustTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },

  trustSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 3,
  },

  bottomTab: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 20,
    paddingBottom: 10,
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
