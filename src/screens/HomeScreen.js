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
import BASE_URL from "../config/api";

const { width } = Dimensions.get("window");

// 🔥 BASE URL REMOVED
// const BASE_URL = "";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F5F5F5",
};

const HomeScreen = ({ navigation }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const [userData, setUserData] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

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

      // 🔥 API REMOVED
      // Replace with your new Bellaj backend later

      // DEMO USER DATA
      setUserData({
        firstName: "Bellaj",
        surname: "User",
        walletBalance: "25,680.00",
        bankName: "Wema Bank",
        accountNumber: "1234567890",
      });
    } catch (err) {
      console.log(err.message);
    }
  };

  const copyToClipboard = (text) => {
    Clipboard.setStringAsync(text);

    if (Platform.OS === "android") {
      ToastAndroid.show("Copied", ToastAndroid.SHORT);
    }
  };

  const openWhatsApp = () => {
    const phoneNumber = "+2349061244444";

    const message = "Hello Bellaj Data Hub Support, I need assistance.";

    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message,
    )}`;

    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://wa.me/${phoneNumber.replace("+", "")}`),
    );
  };

  return (
    <View
      style={[
        styles.mainContainer,
        {
          backgroundColor: isDarkMode ? COLORS.dark : COLORS.light,
        },
      ]}
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      {/* 🔥 BACKGROUND IMAGE REMOVED */}

      <LinearGradient
        colors={isDarkMode ? ["#121212", "#0B5E3C"] : ["#ffffff", "#f5f5f5"]}
        style={styles.fullScreen}
      >
        {/* HEADER */}
        <View style={styles.topHeader}>
          <View style={styles.navRow}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/bellaj_logo.png")}
                style={styles.logoImg}
              />
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>

            <Text
              style={[
                styles.userName,
                {
                  color: isDarkMode ? COLORS.white : COLORS.dark,
                },
              ]}
            >
              {userData
                ? `${userData.firstName} ${userData.surname}`
                : "Loading..."}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* WALLET */}
          <LinearGradient
            colors={[COLORS.primary, "#990000"]}
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
                {isBalanceVisible ? userData?.walletBalance : "****"}
              </Text>

              <TouchableOpacity
                onPress={() => setIsBalanceVisible(!isBalanceVisible)}
              >
                <Ionicons
                  name={isBalanceVisible ? "eye-outline" : "eye-off-outline"}
                  size={24}
                  color="#fff"
                  style={{ marginLeft: 12 }}
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

          {/* ACCOUNTS */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: isDarkMode ? COLORS.white : COLORS.dark,
              },
            ]}
          >
            Funding Accounts
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bankScroll}
          >
            <BankCard
              bank={userData?.bankName}
              acc={userData?.accountNumber}
              code="BD"
              onCopy={() => copyToClipboard(userData?.accountNumber)}
            />
          </ScrollView>

          {/* SERVICES */}
          <Text
            style={[
              styles.sectionLabel,
              {
                color: isDarkMode ? COLORS.white : COLORS.dark,
              },
            ]}
          >
            Bellaj Services
          </Text>

          <View style={styles.servicesContainer}>
            <View style={styles.grid}>
              <ServiceItem
                icon="wifi"
                label="Data"
                color={COLORS.primary}
                onPress={() => navigation.navigate("BuyData")}
              />

              <ServiceItem
                icon="phone-alt"
                label="Airtime"
                color={COLORS.secondary}
                onPress={() => navigation.navigate("BuyAirtime")}
              />

              <ServiceItem
                icon="bolt"
                label="Electricity"
                color="#EAB308"
                onPress={() => navigation.navigate("Electricity")}
              />

              <ServiceItem
                icon="tv"
                label="Cable"
                color="#8B5CF6"
                onPress={() => navigation.navigate("Cable")}
              />

              <ServiceItem
                icon="history"
                label="History"
                color="#F97316"
                onPress={() =>
                  navigation.navigate("Main", {
                    screen: "Wallet History",
                  })
                }
              />
            </View>
          </View>

          {/* TRUST */}
          <View style={styles.footerBranding}>
            <Text style={styles.footerHeadline}>WHY BELLAJ DATA HUB?</Text>

            <View style={styles.trustGrid}>
              <TrustItem
                icon="shield-check"
                title="Secure"
                sub="Protected"
                color="#16a34a"
                bg="#DCFCE7"
              />

              <TrustItem
                icon="flash"
                title="Instant"
                sub="Automated"
                color="#CA8A04"
                bg="#FEF9C3"
              />

              <TrustItem
                icon="headset"
                title="Support"
                sub="24/7 Active"
                color="#0284C7"
                bg="#E0F2FE"
              />
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </LinearGradient>

      {/* BOTTOM TAB */}
      <View style={styles.bottomTab}>
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
          icon="help-buoy-outline"
          label="Support"
          onPress={() => navigation.navigate("Contact")}
        />
      </View>
    </View>
  );
};

/* ================= COMPONENTS ================= */

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
        {
          color: active ? COLORS.primary : "#94A3B8",
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },

  fullScreen: {
    flex: 1,
  },

  topHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
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
    width: 36,
    height: 36,
    resizeMode: "contain",
  },

  welcomeSection: {
    marginTop: 10,
  },

  welcomeText: {
    color: "#64748B",
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
    borderRadius: 25,
    padding: 22,
    marginBottom: 25,
    elevation: 8,
  },

  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  walletLabel: {
    color: "#fff",
  },

  historyText: {
    color: "#fff",
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
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 15,
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
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  bankLogoText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },

  bankTitle: {
    fontSize: 12,
    color: "#64748B",
  },

  accNo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },

  servicesContainer: {
    borderRadius: 24,
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
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
  },

  gridLabel: {
    fontSize: 11,
    textAlign: "center",
    fontWeight: "600",
    color: "#374151",
  },

  footerBranding: {
    marginTop: 25,
    paddingBottom: 40,
  },

  footerHeadline: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.primary,
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
    fontWeight: "bold",
    fontSize: 12,
    color: "#111827",
  },

  trustSub: {
    fontSize: 10,
    color: "#94A3B8",
  },

  bottomTab: {
    height: 85,
    backgroundColor: "#fff",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
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

export default HomeScreen;
