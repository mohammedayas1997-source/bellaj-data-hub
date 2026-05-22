import React, { useState, useCallback } from "react";
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
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const { width } = Dimensions.get("window");
const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";

const AgentDashboard = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
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

      const [profileRes, perfRes, supRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/user/profile`, config),
        axios.get(`${BASE_URL}/agent/performance`, config),
        axios.get(`${BASE_URL}/agent/my-supervisor`, config),
      ]);

      if (profileRes.status === "fulfilled")
        setUserData(profileRes.value.data.user || profileRes.value.data.data);
      if (perfRes.status === "fulfilled")
        setPerformance(perfRes.value.data.data || {});
      if (supRes.status === "fulfilled")
        setSupervisor(supRes.value.data.data || "No Supervisor Assigned");
    } catch (err) {
      console.log("Data Fetch Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAgentAndProfileData();
    }, []),
  );

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

  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* --- MENU MODAL --- */}
      <Modal visible={showMenu} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} />
        </TouchableWithoutFeedback>
        <View style={styles.menuDrawer}>
          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate("Profile");
            }}
          >
            <Text>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
            <Text style={{ color: "red" }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* --- CONTENT --- */}
      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.6)", "rgba(248,250,252,0.95)"]}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.topHeader}>
          <Text style={styles.userName}>{userData?.firstName || "Agent"}</Text>
          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <Ionicons name="menu" size={30} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flexScroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchAgentAndProfileData}
            />
          }
        >
          <LinearGradient
            colors={["#1e40af", "#1e3a8a"]}
            style={styles.walletCard}
          >
            <Text style={styles.walletLabel}>Balance</Text>
            <Text style={styles.balance}>
              {isBalanceVisible
                ? `₦${userData?.walletBalance || "0.00"}`
                : "****"}
            </Text>
          </LinearGradient>

          {/* Add your grid, stats, and other components here */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  flexScroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 50 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
  },
  backgroundImage: { flex: 1, width: "100%" },
  walletCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
  walletLabel: { color: "#fff" },
  balance: { color: "#fff", fontSize: 30, fontWeight: "bold" },
  menuDrawer: {
    position: "absolute",
    top: 100,
    right: 20,
    width: 150,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  drawerItem: { paddingVertical: 10 },
});

export default AgentDashboard;
