import React, { useState, useEffect } from "react";
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
  Modal, // Import Modal
} from "react-native";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useColorScheme } from "react-native";

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://ayax-data-xpress-server.onrender.com/api/v1";

const AgentDashboard = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false); // State for menu
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // ... (Sauran state da functions dinka sun kasance yadda suke)
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
      if (profileRes.data?.success)
        setUserData(profileRes.data.user || profileRes.data.data);
      if (perfRes.data?.data) setPerformance(perfRes.data.data);
      if (supRes.data?.data) setSupervisor(supRes.data.data);
      else setSupervisor("No Supervisor Assigned Yet");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgentAndProfileData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentAndProfileData();
  };
  const copyToClipboard = (text) => {
    Clipboard.setString(text);
    if (Platform.OS === "android")
      ToastAndroid.show("Copied", ToastAndroid.SHORT);
  };
  const openWhatsApp = () => {
    /* ... (kamar da) ... */
  };
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
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
        <ActivityIndicator size="large" />
      </View>
    );

  return (
    <View style={styles.mainContainer}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* MENU MODAL */}
      <Modal visible={menuVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Account Menu</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Profile");
              }}
            >
              <Ionicons name="person-outline" size={24} color="#1e40af" />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Settings");
              }}
            >
              <Ionicons name="settings-outline" size={24} color="#1e40af" />
              <Text style={styles.menuText}>
                Settings (Theme: {isDarkMode ? "Dark" : "Light"})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomWidth: 0 }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#dc2626" />
              <Text style={[styles.menuText, { color: "#dc2626" }]}>
                Logout
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ImageBackground
        source={require("../assets/ayax_promo_hijab.png")}
        style={styles.backgroundImage}
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
              <Ionicons name="menu-outline" size={32} color="#0f172a" />
            </TouchableOpacity>
          </View>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Agent Control Panel,</Text>
            <Text style={styles.userName}>
              {userData ? `${userData.name || ""}` : "Loading..."}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* ... (Sauran dashboard content dinka duka suna nan) ... */}
          <View style={{ height: 150 }} />
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  backgroundImage: { flex: 1, width: "100%" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  menuText: { marginLeft: 15, fontSize: 16 },
  closeBtn: {
    marginTop: 20,
    backgroundColor: "#1e40af",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  // ... (Sauran styles dinka su kasance nan)
});

export default AgentDashboard;
