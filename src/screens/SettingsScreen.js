import React, { useState, useEffect } from "react";
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

const SettingsScreen = ({ navigation }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [useFingerprintLogin, setUseFingerprintLogin] = useState(false);
  const [useFingerprintTransaction, setUseFingerprintTransaction] =
    useState(false);

  useEffect(() => {
    checkDeviceSupport();
    loadSettings();
  }, []);

  // Check if hardware supports biometrics
  const checkDeviceSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);
  };

  // Load saved preferences from AsyncStorage
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
        "Biometric authentication is not available or set up on this device.",
      );
      return;
    }

    // Authenticate user before allowing them to change security settings
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
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear only session tokens to keep biometric preferences,
              // or use .clear() to wipe everything.
              await AsyncStorage.removeItem("userToken");
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              Alert.alert("Error", "An error occurred during logout.");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleNavigation = (screenName) => {
    if (!navigation) {
      Alert.alert("Error", "Navigation is not available.");
      return;
    }
    navigation.navigate(screenName);
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

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Security</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={() => handleNavigation("ForgotPassword")}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="lock-closed-outline" size={22} color="#1e3a8a" />
            <Text style={styles.itemText}>Change Password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => handleNavigation("UpdatePin")}
        >
          <View style={styles.itemLeft}>
            <MaterialCommunityIcons
              name="numeric-4-box-outline"
              size={22}
              color="#1e3a8a"
            />
            <Text style={styles.itemText}>Transaction PIN</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        {/* Biometric Login Toggle */}
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="finger-print-outline" size={22} color="#1e3a8a" />
            <Text style={styles.itemText}>Fingerprint Login</Text>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#1e3a8a" }}
            thumbColor={useFingerprintLogin ? "#fff" : "#f4f3f4"}
            onValueChange={() => toggleBiometric("login")}
            value={useFingerprintLogin}
          />
        </View>

        {/* Biometric PIN Toggle */}
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={22}
              color="#1e3a8a"
            />
            <Text style={styles.itemText}>Biometric PIN Bypass</Text>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#1e3a8a" }}
            thumbColor={useFingerprintTransaction ? "#fff" : "#f4f3f4"}
            onValueChange={() => toggleBiometric("transaction")}
            value={useFingerprintTransaction}
          />
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Preferences</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={() => handleNavigation("Profile")}
        >
          <View style={styles.itemLeft}>
            <Ionicons name="person-outline" size={22} color="#1e3a8a" />
            <Text style={styles.itemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="moon-outline" size={22} color="#1e3a8a" />
            <Text style={styles.itemText}>Dark Mode</Text>
          </View>
          <Switch
            trackColor={{ false: "#767577", true: "#1e3a8a" }}
            thumbColor={isDarkMode ? "#fff" : "#f4f3f4"}
            onValueChange={toggleSwitch}
            value={isDarkMode}
          />
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Logout Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  contentContainer: { padding: 20, paddingBottom: 40 },
  darkContainer: { backgroundColor: "#0f172a" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 25,
  },
  backButton: { marginRight: 15, padding: 5 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  darkText: { color: "#fff" },
  section: { marginBottom: 30 },
  sectionLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "bold",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  itemText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  logoutText: {
    marginLeft: 10,
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SettingsScreen;
