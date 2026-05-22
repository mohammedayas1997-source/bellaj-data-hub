import React, { useState, useEffect, useContext } from "react"; // AN GYARA NAN
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { ThemeContext } from "../context/ThemeContext";

const SettingsScreen = ({ navigation }) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [useFingerprintLogin, setUseFingerprintLogin] = useState(false);
  const [useFingerprintTransaction, setUseFingerprintTransaction] =
    useState(false);

  // Yanzu useContext zai yi aiki tunda mun shigo da shi
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    checkDeviceSupport();
    loadSettings();
  }, []);

  const checkDeviceSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);
  };

  const loadSettings = async () => {
    try {
      const loginBio = await AsyncStorage.getItem("useBiometricLogin");
      const txBio = await AsyncStorage.getItem("useBiometricTransaction");
      if (loginBio !== null) setUseFingerprintLogin(JSON.parse(loginBio));
      if (txBio !== null) setUseFingerprintTransaction(JSON.parse(txBio));
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const toggleBiometric = async (type) => {
    if (!isBiometricSupported) {
      Alert.alert(
        "Not Supported",
        "Biometric authentication is not available.",
      );
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to change security settings",
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      if (type === "login") {
        const newValue = !useFingerprintLogin;
        setUseFingerprintLogin(newValue);
        await AsyncStorage.setItem(
          "useBiometricLogin",
          JSON.stringify(newValue),
        );
      } else {
        const newValue = !useFingerprintTransaction;
        setUseFingerprintTransaction(newValue);
        await AsyncStorage.setItem(
          "useBiometricTransaction",
          JSON.stringify(newValue),
        );
      }
    }
  };

  const toggleSwitch = () => setIsDarkMode((previousState) => !previousState);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("userToken");
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, isDarkMode && styles.darkContainer]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDarkMode ? "#fff" : "#1e3a8a"}
          />
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>
          Settings
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Security</Text>

        {/* Security Items... */}
        <View style={[styles.item, isDarkMode && styles.darkItem]}>
          <View style={styles.itemLeft}>
            <Ionicons name="finger-print-outline" size={22} color="#1e3a8a" />
            <Text style={[styles.itemText, isDarkMode && styles.darkItemText]}>
              Fingerprint Login
            </Text>
          </View>
          <Switch
            onValueChange={() => toggleBiometric("login")}
            value={useFingerprintLogin}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={[styles.item, isDarkMode && styles.darkItem]}>
          <View style={styles.itemLeft}>
            <Ionicons name="moon-outline" size={22} color="#1e3a8a" />
            <Text style={[styles.itemText, isDarkMode && styles.darkItemText]}>
              Dark Mode
            </Text>
          </View>
          <Switch onValueChange={toggleSwitch} value={isDarkMode} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  contentContainer: { padding: 20 },
  darkContainer: { backgroundColor: "#0f172a" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 25,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  darkText: { color: "#fff" },
  section: { marginBottom: 30 },
  sectionLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "bold",
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  darkItem: { backgroundColor: "#1e293b" },
  itemText: { marginLeft: 15, fontSize: 16, color: "#334155" },
  darkItemText: { color: "#f1f5f9" },
  logoutBtn: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontWeight: "bold" },
});

export default SettingsScreen;
