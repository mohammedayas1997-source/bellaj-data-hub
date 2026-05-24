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

      const [profileRes, perfRes, supRes] = await Promise.all([
        axios.get(`${BASE_URL}/user/profile`, config),

        axios
          .get(`${AGENT_URL}/performance`, config)
          .catch(() => ({ data: { data: {} } })),

        axios
          .get(`${AGENT_URL}/my-supervisor`, config)
          .catch(() => ({ data: { data: null } })),
      ]);

      if (profileRes.data?.success) {
        setUserData(profileRes.data.user || profileRes.data.data);
      }

      setPerformance(
        perfRes?.data?.data || {
          totalGB: 0,
          totalSalesValue: 0,
        },
      );

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
    const message = "Hello Ayax Xpress Support";

    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
      message,
    )}`;

    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://wa.me/${phoneNumber.replace("+", "")}`),
    );
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
        { backgroundColor: isDarkMode ? "#020617" : "#f8fafc" },
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
      >
        <LinearGradient
          colors={
            isDarkMode
              ? ["rgba(2,6,23,0.75)", "rgba(2,6,23,0.95)"]
              : ["rgba(255,255,255,0.65)", "rgba(248,250,252,0.96)"]
          }
          style={styles.fullOverlay}
        />

        {/* HEADER (UNCHANGED) */}
        <View style={styles.topHeader}>
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.logoCircle}
              onPress={() => navigation.openDrawer?.()}
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
                { color: isDarkMode ? "#fff" : "#0f172a" },
              ]}
            >
              {userData
                ? `${userData.firstName || ""} ${userData.surname || ""}`
                : "Agent"}
            </Text>
          </View>
        </View>

        {/* ================= SCROLL FIXED (IMPORTANT) ================= */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 160, // 🔥 FIX bottom tab overlap
          }}
        >
          {/* ================= WALLET (UNCHANGED) ================= */}
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
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ================= PERFORMANCE SAFE ================= */}
          <Text style={styles.sectionLabel}>Agent Performance</Text>

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

          {/* ================= SUPERVISOR SAFE ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Supervisor</Text>

            <View style={styles.infoBox}>
              {supervisor ? (
                <>
                  <Text style={styles.supName}>{supervisor.name}</Text>
                  <Text style={styles.supPhone}>{supervisor.phone}</Text>
                </>
              ) : (
                <Text>No Supervisor Assigned</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* ================= BOTTOM TAB FIX ================= */}
        <View style={styles.bottomTab}>
          <TouchableOpacity>
            <Ionicons name="home" size={24} color="#1e40af" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person" size={24} />
          </TouchableOpacity>

          <TouchableOpacity onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={24} />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default AgentDashboard;
