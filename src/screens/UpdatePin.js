import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { CommonActions } from "@react-navigation/native";
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
  pinStatus: `${BASE_URL}/user/pin-status`,
  createPin: `${BASE_URL}/user/set-pin`,
  updatePin: `${BASE_URL}/user/change-pin`,
};

const UpdatePin = ({ navigation }) => {
  const [hasPin, setHasPin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const checkPinStatus = async () => {
    try {
      setFetchingStatus(true);

      const headers = await getAuthHeaders();

      if (!headers) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const localUserData = await AsyncStorage.getItem("userData");
      if (localUserData) {
        const user = JSON.parse(localUserData);

        if (
          user?.has_transaction_pin ||
          user?.pin_set === true ||
          user?.hasPin === true ||
          user?.transactionPinSet === true
        ) {
          setHasPin(true);
        }
      }

      const { data } = await axios.get(API_ENDPOINTS.pinStatus, {
        headers,
        timeout: 20000,
      });

      const status =
        data?.hasPin ||
        data?.has_transaction_pin ||
        data?.pin_set ||
        data?.data?.hasPin ||
        data?.data?.has_transaction_pin ||
        data?.data?.pin_set ||
        false;

      setHasPin(Boolean(status));
    } catch {
      const savedPin = await AsyncStorage.getItem("transactionPin");
      setHasPin(Boolean(savedPin));
    } finally {
      setFetchingStatus(false);
    }
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("Profile");
  };

  const logout = async () => {
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
            "transactionPin",
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

  const cleanPin = (value) => value.replace(/[^0-9]/g, "");

  const validatePin = () => {
    if (hasPin && oldPin.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter your current 4-digit PIN.");
      return false;
    }

    if (newPin.length !== 4) {
      Alert.alert("Invalid PIN", "New PIN must be exactly 4 digits.");
      return false;
    }

    if (confirmPin.length !== 4) {
      Alert.alert("Invalid PIN", "Please confirm your 4-digit PIN.");
      return false;
    }

    if (newPin !== confirmPin) {
      Alert.alert("PIN Mismatch", "New PIN and confirmation PIN do not match.");
      return false;
    }

    if (hasPin && oldPin === newPin) {
      Alert.alert("Invalid PIN", "New PIN must be different from old PIN.");
      return false;
    }

    return true;
  };

  const handleProcessPin = async () => {
    if (!validatePin()) return;

    Alert.alert(
      hasPin ? "Update Transaction PIN" : "Create Transaction PIN",
      hasPin
        ? "Are you sure you want to update your transaction PIN?"
        : "Are you sure you want to create this transaction PIN?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: hasPin ? "Update" : "Create",
          onPress: async () => {
            try {
              setLoading(true);

              const headers = await getAuthHeaders();

              if (!headers) {
                Alert.alert("Session Expired", "Please login again.", [
                  { text: "Login", onPress: () => navigation.navigate("Login") },
                ]);
                return;
              }

              const endpoint = hasPin
                ? API_ENDPOINTS.updatePin
                : API_ENDPOINTS.createPin;

              const payload = hasPin
                ? {
                    oldPin,
                    newPin,
                    oldTransactionPin: oldPin,
                    newTransactionPin: newPin,
                  }
                : {
                    pin: newPin,
                    transactionPin: newPin,
                    confirmPin,
                  };

              const { data } = await axios.post(endpoint, payload, {
                headers,
                timeout: 25000,
              });

              if (data?.success === false || data?.status === "failed") {
                Alert.alert(
                  "Failed",
                  data?.message || "Unable to process PIN request."
                );
                return;
              }

              await AsyncStorage.setItem("transactionPin", newPin);

              const storedUser = await AsyncStorage.getItem("userData");
              if (storedUser) {
                const user = JSON.parse(storedUser);
                const updatedUser = {
                  ...user,
                  has_transaction_pin: true,
                  pin_set: true,
                  hasPin: true,
                  transactionPinSet: true,
                };

                await AsyncStorage.setItem(
                  "userData",
                  JSON.stringify(updatedUser)
                );
              }

              Alert.alert(
                "Bellaj Data Hub",
                hasPin
                  ? "Transaction PIN updated successfully."
                  : "Transaction PIN created successfully.",
                [
                  {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );

              setOldPin("");
              setNewPin("");
              setConfirmPin("");
              setHasPin(true);
            } catch (error) {
              const localSavedPin = await AsyncStorage.getItem("transactionPin");

              if (hasPin && localSavedPin && oldPin === localSavedPin) {
                await AsyncStorage.setItem("transactionPin", newPin);

                Alert.alert(
                  "Bellaj Data Hub",
                  "PIN updated locally. Backend sync failed.",
                  [{ text: "OK", onPress: () => navigation.goBack() }]
                );
                return;
              }

              Alert.alert(
                "PIN Error",
                error?.response?.data?.message ||
                  error?.response?.data?.error ||
                  "Connection error. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (fetchingStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Checking PIN Status...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>
            {hasPin ? "Change Transaction PIN" : "Create Transaction PIN"}
          </Text>
          <Text style={styles.headerSubtitle}>
            Secure your Bellaj transactions
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={hasPin ? "shield-checkmark" : "lock-open"}
              size={38}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {hasPin ? "PIN Security Update" : "Setup Transaction PIN"}
            </Text>
            <Text style={styles.heroText}>
              {hasPin
                ? "Change your 4-digit security code used for payments and service transactions."
                : "Create a 4-digit transaction PIN to authorize wallet payments and service requests."}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="shield-key-outline"
              size={24}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>
              {hasPin ? "Update Security PIN" : "Create Security PIN"}
            </Text>
          </View>

          {hasPin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                value={oldPin}
                onChangeText={(text) => setOldPin(cleanPin(text))}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{hasPin ? "New PIN" : "Setup PIN"}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={(text) => setNewPin(cleanPin(text))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="••••"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={(text) => setConfirmPin(cleanPin(text))}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={COLORS.secondary}
            />
            <Text style={styles.infoText}>
              Your transaction PIN must be exactly 4 digits. Do not share it
              with anyone.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.75 }]}
            onPress={handleProcessPin}
            disabled={loading}
            activeOpacity={0.86}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name={hasPin ? "shield-checkmark-outline" : "key-outline"}
                  size={21}
                  color={COLORS.white}
                />
                <Text style={styles.submitBtnText}>
                  {hasPin ? "UPDATE TRANSACTION PIN" : "CREATE PIN NOW"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.secondaryBtn} onPress={goBack}>
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.primary,
    fontWeight: "800",
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
    fontSize: 18,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
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
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 8,
  },
  cardTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
  },
  inputGroup: {
    marginBottom: 17,
  },
  label: {
    color: COLORS.dark,
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: COLORS.light,
    borderRadius: 15,
    minHeight: 58,
    paddingHorizontal: 15,
    color: COLORS.dark,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontWeight: "900",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  infoBox: {
    backgroundColor: COLORS.softGreen,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 18,
  },
  infoText: {
    color: COLORS.secondary,
    fontWeight: "700",
    lineHeight: 19,
    flex: 1,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 18,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 14,
  },
});

export default UpdatePin;