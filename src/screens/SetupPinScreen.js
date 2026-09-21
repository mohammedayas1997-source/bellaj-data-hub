import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#DCFCE7",
  danger: "#DC2626",
};

const SetupPinScreen = ({ navigation }) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const cleanInput = (val) => val.replace(/[^0-9]/g, "");

  const handleCreatePin = async () => {
    if (pin.length !== 4) {
      Alert.alert("Invalid PIN", "Transaction PIN must be exactly 4 digits.");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("PIN Mismatch", "New PIN and confirmation PIN do not match.");
      return;
    }

    try {
      setLoading(true);
      const token =
        (await AsyncStorage.getItem("userToken")) ||
        (await AsyncStorage.getItem("token"));

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      const payload = {
        pin: pin.trim(),
        transactionPin: pin.trim(),
        confirmPin: confirmPin.trim(),
      };

      const endpoints = [
        `${BASE_URL}/user/set-pin`,
        `${BASE_URL}/api/v1/user/set-pin`,
        `${BASE_URL}/users/set-pin`,
        `${BASE_URL}/auth/set-pin`,
      ];

      let success = false;
      let errMsg = "";

      for (const url of endpoints) {
        try {
          const res = await axios.post(url, payload, config);
          if (res.status === 200 || res.status === 201 || res.data?.success) {
            success = true;
            break;
          }
        } catch (err) {
          errMsg = err.response?.data?.message || err.message;
        }
      }

      if (!success && errMsg) {
        throw new Error(errMsg);
      }

      await AsyncStorage.setItem("transactionPin", pin.trim());
      const storedUser = await AsyncStorage.getItem("userData");
      
      // Determine target destination strictly between Customer (Dashboard) and Agent (AgentDashboard)
      let targetDashboard = "Dashboard";

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.isPinSet = true;
        parsed.hasPin = true;
        await AsyncStorage.setItem("userData", JSON.stringify(parsed));

        const userRole = String(parsed.role || "").trim().toLowerCase();
        if (userRole === "agent") {
          targetDashboard = "AgentDashboard";
        } else {
          targetDashboard = "Dashboard";
        }
      }

      Alert.alert(
        "PIN Configured Successfully",
        "Your 4-digit transaction PIN has been set successfully. You can now access your dashboard.",
        [
          {
            text: "Proceed to Dashboard",
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: targetDashboard }],
                })
              );
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "PIN Configuration Failed",
        error.message || "An error occurred while setting up your transaction PIN."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set Transaction PIN</Text>
        <Text style={styles.headerSubtitle}>Initial account security setup</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBox}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="shield-lock"
              size={38}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.heroTitle}>Protect Your Wallet</Text>
          <Text style={styles.heroText}>
            Before proceeding, please create a secret 4-digit transaction PIN. This PIN will be required to authorize all data orders, airtime recharges, and wallet transfers.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>Enter 4-Digit PIN</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={!showPin}
              value={pin}
              onChangeText={(t) => setPin(cleanInput(t))}
            />
            <TouchableOpacity
              onPress={() => setShowPin(!showPin)}
              style={{ padding: 6 }}
            >
              <Ionicons
                name={showPin ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Confirm 4-Digit PIN</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={!showPin}
              value={confirmPin}
              onChangeText={(t) => setConfirmPin(cleanInput(t))}
            />
          </View>

          <View style={styles.alertNotice}>
            <Ionicons
              name="information-circle"
              size={18}
              color={COLORS.secondary}
            />
            <Text style={styles.alertNoticeText}>
              Never share your transaction PIN with anyone. It acts as the final authorization key for your funds.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (pin.length !== 4 || confirmPin.length !== 4 || loading) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleCreatePin}
            disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons
                  name="shield-checkmark"
                  size={19}
                  color={COLORS.white}
                />
                <Text style={styles.submitBtnText}>CONFIRM & CONTINUE</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 48 : 26,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  headerSubtitle: {
    color: "#DCFCE7",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  content: { padding: 16, paddingBottom: 60 },

  heroBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.softGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  heroTitle: { fontSize: 16, fontWeight: "900", color: COLORS.dark },
  heroText: {
    fontSize: 12.5,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    fontWeight: "500",
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 6,
    marginTop: 4,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    minHeight: 52,
    fontSize: 22,
    color: COLORS.dark,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 10,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },

  alertNotice: {
    flexDirection: "row",
    backgroundColor: COLORS.softGreen,
    padding: 12,
    borderRadius: 10,
    gap: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  alertNoticeText: {
    color: COLORS.primary,
    fontSize: 11.5,
    fontWeight: "700",
    flex: 1,
    lineHeight: 16,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

export default SetupPinScreen;