import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { CommonActions } from "@react-navigation/native";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  cardDark: "#1E293B",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  setPin: `${BASE_URL}/user/set-pin`,
  changePin: `${BASE_URL}/user/change-pin`,
  updateSettings: `${BASE_URL}/user/settings`,
};

const SettingsScreen = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const [loading, setLoading] = useState(true);
  const [savingPin, setSavingPin] = useState(false);
  const [changingPin, setChangingPin] = useState(false);

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [useFingerprintLogin, setUseFingerprintLogin] = useState(false);
  const [useFingerprintTransaction, setUseFingerprintTransaction] =
    useState(false);

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [changePinModalVisible, setChangePinModalVisible] = useState(false);

  const [transactionPin, setTransactionPin] = useState("");
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    initializeSettings();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const initializeSettings = async () => {
    try {
      await checkDeviceSupport();
      await loadSettings();
    } finally {
      setLoading(false);
    }
  };

  const checkDeviceSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);
    } catch {
      setIsBiometricSupported(false);
    }
  };

  const loadSettings = async () => {
    const loginBio = await AsyncStorage.getItem("useBiometricLogin");
    const txBio = await AsyncStorage.getItem("useBiometricTransaction");

    if (loginBio !== null) setUseFingerprintLogin(JSON.parse(loginBio));
    if (txBio !== null) setUseFingerprintTransaction(JSON.parse(txBio));
  };

  const authenticateUser = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate Bellaj Data Hub",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      return result.success;
    } catch {
      return false;
    }
  };

  const syncSettingsToBackend = async (payload) => {
    try {
      const headers = await getAuthHeaders();
      await axios.patch(API_ENDPOINTS.updateSettings, payload, { headers });
    } catch {
      console.log("Settings backend sync skipped.");
    }
  };

  const toggleBiometric = async (type) => {
    if (!isBiometricSupported) {
      Alert.alert(
        "Unavailable",
        "Biometric authentication is not available or not enrolled on this device."
      );
      return;
    }

    const authenticated = await authenticateUser();

    if (!authenticated) {
      Alert.alert("Failed", "Authentication failed.");
      return;
    }

    if (type === "login") {
      const newValue = !useFingerprintLogin;
      setUseFingerprintLogin(newValue);
      await AsyncStorage.setItem("useBiometricLogin", JSON.stringify(newValue));
      await syncSettingsToBackend({ biometricLogin: newValue });
    }

    if (type === "transaction") {
      const newValue = !useFingerprintTransaction;
      setUseFingerprintTransaction(newValue);
      await AsyncStorage.setItem(
        "useBiometricTransaction",
        JSON.stringify(newValue)
      );
      await syncSettingsToBackend({ biometricTransaction: newValue });
    }
  };

  const toggleDarkMode = async () => {
    await toggleTheme();
    await syncSettingsToBackend({ darkMode: !isDarkMode });
  };

  const validatePin = (pin) => /^\d{4}$/.test(pin);

  const handleSetPin = async () => {
    if (!validatePin(transactionPin)) {
      Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
      return;
    }

    try {
      setSavingPin(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.post(
        API_ENDPOINTS.setPin,
        {
          pin: transactionPin,
          transactionPin,
        },
        { headers, timeout: 20000 }
      );

      if (data?.success === false) {
        Alert.alert("Failed", data?.message || "PIN was not saved.");
        return;
      }

      await AsyncStorage.setItem("transactionPin", transactionPin);

      Alert.alert("Bellaj Data Hub", "Transaction PIN saved successfully.");

      setTransactionPin("");
      setPinModalVisible(false);
    } catch (error) {
      Alert.alert(
        "Save Failed",
        error?.response?.data?.message ||
          "Unable to save PIN. Please try again."
      );
    } finally {
      setSavingPin(false);
    }
  };

  const handleChangePin = async () => {
    if (!validatePin(oldPin)) {
      Alert.alert("Invalid PIN", "Old PIN must be exactly 4 digits.");
      return;
    }

    if (!validatePin(newPin)) {
      Alert.alert("Invalid PIN", "New PIN must be exactly 4 digits.");
      return;
    }

    if (oldPin === newPin) {
      Alert.alert("Invalid PIN", "New PIN must be different from old PIN.");
      return;
    }

    try {
      setChangingPin(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.post(
        API_ENDPOINTS.changePin,
        {
          oldPin,
          newPin,
          oldTransactionPin: oldPin,
          newTransactionPin: newPin,
        },
        { headers, timeout: 20000 }
      );

      if (data?.success === false) {
        Alert.alert("Failed", data?.message || "PIN was not changed.");
        return;
      }

      await AsyncStorage.setItem("transactionPin", newPin);

      Alert.alert("Bellaj Data Hub", "Transaction PIN changed successfully.");

      setOldPin("");
      setNewPin("");
      setChangePinModalVisible(false);
    } catch (error) {
      const savedPin = await AsyncStorage.getItem("transactionPin");

      if (savedPin && oldPin === savedPin) {
        await AsyncStorage.setItem("transactionPin", newPin);

        Alert.alert(
          "Bellaj Data Hub",
          "Transaction PIN changed locally. Backend sync failed."
        );

        setOldPin("");
        setNewPin("");
        setChangePinModalVisible(false);
        return;
      }

      Alert.alert(
        "Change Failed",
        error?.response?.data?.message ||
          "Unable to change PIN. Please try again."
      );
    } finally {
      setChangingPin(false);
    }
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation?.navigate?.("Main");
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "token",
            "adminToken",
            "userData",
            "userRole",
            "overrideRole",
            "isSuperAdminOverride",
          ]);

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        },
      },
    ]);
  };

  const bg = isDarkMode ? COLORS.dark : COLORS.light;
  const cardBg = isDarkMode ? COLORS.cardDark : COLORS.white;
  const textColor = isDarkMode ? COLORS.white : COLORS.dark;

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Security and preferences</Text>
        </View>

        <TouchableOpacity style={styles.logoutTopBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="cog-outline"
              size={34}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: textColor }]}>
              Bellaj Control Center
            </Text>
            <Text style={styles.heroText}>
              Manage transaction PIN, biometric access, dark mode and account security.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Security</Text>

          <SettingItem
            icon="lock-closed-outline"
            title="Set Transaction PIN"
            color={COLORS.primary}
            cardBg={cardBg}
            textColor={textColor}
            onPress={() => setPinModalVisible(true)}
          />

          <SettingItem
            icon="lock-reset"
            iconType="mci"
            title="Change Transaction PIN"
            color={COLORS.secondary}
            cardBg={cardBg}
            textColor={textColor}
            onPress={() => setChangePinModalVisible(true)}
          />

          <SettingSwitch
            icon="finger-print-outline"
            title="Fingerprint Login"
            color={COLORS.primary}
            cardBg={cardBg}
            textColor={textColor}
            value={useFingerprintLogin}
            onValueChange={() => toggleBiometric("login")}
          />

          <SettingSwitch
            icon="shield-key-outline"
            iconType="mci"
            title="Fingerprint Transaction"
            color={COLORS.secondary}
            cardBg={cardBg}
            textColor={textColor}
            value={useFingerprintTransaction}
            onValueChange={() => toggleBiometric("transaction")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferences</Text>

          <SettingSwitch
            icon="moon-outline"
            title="Dark Mode"
            color="#F59E0B"
            cardBg={cardBg}
            textColor={textColor}
            value={isDarkMode}
            onValueChange={toggleDarkMode}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>

          <SettingItem
            icon="person-circle-outline"
            title="Profile"
            color={COLORS.secondary}
            cardBg={cardBg}
            textColor={textColor}
            onPress={() => navigation.navigate("Profile")}
          />

          <SettingItem
            icon="help-buoy-outline"
            title="Support Center"
            color="#2563EB"
            cardBg={cardBg}
            textColor={textColor}
            onPress={() => navigation.navigate("Contact")}
          />

          <SettingItem
            icon="document-text-outline"
            title="Terms & Conditions"
            color="#7C3AED"
            cardBg={cardBg}
            textColor={textColor}
            onPress={() => navigation.navigate("Terms")}
          />

          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            color="#EA580C"
            cardBg={cardBg}
            textColor={textColor}
            onPress={() => navigation.navigate("PrivacyPolicy")}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
          <Text style={styles.logoutText}>LOGOUT ACCOUNT</Text>
        </TouchableOpacity>
      </ScrollView>

      <PinModal
        visible={pinModalVisible}
        title="Set Transaction PIN"
        value={transactionPin}
        setValue={setTransactionPin}
        loading={savingPin}
        buttonText="Save PIN"
        isDarkMode={isDarkMode}
        onSubmit={handleSetPin}
        onCancel={() => {
          setTransactionPin("");
          setPinModalVisible(false);
        }}
      />

      <ChangePinModal
        visible={changePinModalVisible}
        oldPin={oldPin}
        newPin={newPin}
        setOldPin={setOldPin}
        setNewPin={setNewPin}
        loading={changingPin}
        isDarkMode={isDarkMode}
        onSubmit={handleChangePin}
        onCancel={() => {
          setOldPin("");
          setNewPin("");
          setChangePinModalVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const SettingItem = ({
  icon,
  iconType,
  title,
  color,
  cardBg,
  textColor,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.item, { backgroundColor: cardBg }]}
    onPress={onPress}
    activeOpacity={0.86}
  >
    <View style={styles.itemLeft}>
      <View style={[styles.itemIcon, { backgroundColor: `${color}18` }]}>
        {iconType === "mci" ? (
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        ) : (
          <Ionicons name={icon} size={22} color={color} />
        )}
      </View>

      <Text style={[styles.itemText, { color: textColor }]}>{title}</Text>
    </View>

    <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
  </TouchableOpacity>
);

const SettingSwitch = ({
  icon,
  iconType,
  title,
  color,
  cardBg,
  textColor,
  value,
  onValueChange,
}) => (
  <View style={[styles.item, { backgroundColor: cardBg }]}>
    <View style={styles.itemLeft}>
      <View style={[styles.itemIcon, { backgroundColor: `${color}18` }]}>
        {iconType === "mci" ? (
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        ) : (
          <Ionicons name={icon} size={22} color={color} />
        )}
      </View>

      <Text style={[styles.itemText, { color: textColor }]}>{title}</Text>
    </View>

    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#CBD5E1", true: COLORS.softGreen }}
      thumbColor={value ? COLORS.secondary : "#F4F4F5"}
    />
  </View>
);

const PinModal = ({
  visible,
  title,
  value,
  setValue,
  loading,
  buttonText,
  isDarkMode,
  onSubmit,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalBox,
          { backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.white },
        ]}
      >
        <Text
          style={[
            styles.modalTitle,
            { color: isDarkMode ? COLORS.white : COLORS.dark },
          ]}
        >
          {title}
        </Text>

        <TextInput
          placeholder="Enter 4-digit PIN"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={value}
          onChangeText={(text) => setValue(text.replace(/[^0-9]/g, ""))}
          style={[
            styles.input,
            isDarkMode && {
              backgroundColor: COLORS.dark,
              color: COLORS.white,
              borderColor: "#334155",
            },
          ]}
        />

        <TouchableOpacity
          style={[styles.modalBtn, loading && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.modalBtnText}>{buttonText}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ChangePinModal = ({
  visible,
  oldPin,
  newPin,
  setOldPin,
  setNewPin,
  loading,
  isDarkMode,
  onSubmit,
  onCancel,
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalBox,
          { backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.white },
        ]}
      >
        <Text
          style={[
            styles.modalTitle,
            { color: isDarkMode ? COLORS.white : COLORS.dark },
          ]}
        >
          Change Transaction PIN
        </Text>

        <TextInput
          placeholder="Old PIN"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={oldPin}
          onChangeText={(text) => setOldPin(text.replace(/[^0-9]/g, ""))}
          style={[
            styles.input,
            isDarkMode && {
              backgroundColor: COLORS.dark,
              color: COLORS.white,
              borderColor: "#334155",
            },
          ]}
        />

        <TextInput
          placeholder="New PIN"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          value={newPin}
          onChangeText={(text) => setNewPin(text.replace(/[^0-9]/g, ""))}
          style={[
            styles.input,
            isDarkMode && {
              backgroundColor: COLORS.dark,
              color: COLORS.white,
              borderColor: "#334155",
            },
          ]}
        />

        <TouchableOpacity
          style={[styles.modalBtn, loading && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.modalBtnText}>Change PIN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    color: COLORS.primary,
    fontWeight: "800",
    marginTop: 10,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextBox: { flex: 1 },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutTopBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 90,
    flexGrow: 1,
  },
  heroCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.secondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  item: {
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    marginLeft: 13,
    fontSize: 15,
    fontWeight: "800",
  },
  logoutBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 22,
    padding: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    color: COLORS.dark,
    backgroundColor: COLORS.light,
    fontWeight: "800",
    letterSpacing: 4,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 54,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  cancelText: {
    textAlign: "center",
    marginTop: 15,
    color: COLORS.primary,
    fontWeight: "900",
  },
});

export default SettingsScreen;