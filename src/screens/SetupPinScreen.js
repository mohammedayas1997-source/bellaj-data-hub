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

const SetupPinScreen = ({ navigation, route }) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const cleanInput = (val) => val.replace(/[^0-9]/g, "");

  const handleCreatePin = async () => {
    if (pin.length !== 4) {
      Alert.alert("PIN Ba Daidai Ba", "Lambar PIN dole ne ta zama lambobi 4 cif.");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("PIN Bai Zo Daya Ba", "Lambar PIN ta biyu ba ta zo ɗaya da ta farko ba.");
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

      // Tura wa backend don adanawa
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

      // Adana bayanin cewa ya saita PIN a waya
      await AsyncStorage.setItem("transactionPin", pin.trim());
      const storedUser = await AsyncStorage.getItem("userData");
      let targetDashboard = "Dashboard";

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.isPinSet = true;
        parsed.hasPin = true;
        await AsyncStorage.setItem("userData", JSON.stringify(parsed));

        if (parsed.role === "superadmin") targetDashboard = "SuperAdminDashboard";
        else if (parsed.role === "admin") targetDashboard = "AdminDashboard";
        else if (parsed.role === "supervisor") targetDashboard = "SupervisorDashboard";
      }

      Alert.alert(
        "PIN Ya Tabbata! 🎉",
        "An saita lambar sirrinka ta transaction PIN cikin nasara. Yanzu za ka iya amfani da dashboard.",
        [
          {
            text: "Wuce Zuwa Dashboard",
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
      Alert.alert("Matsalar Saita PIN", error.message || "An samu matsala wajen saita PIN.");
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

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saita Transaction PIN</Text>
        <Text style={styles.headerSubtitle}>Mataki na farko na tsaron asusunka</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBox}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="shield-lock" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Kariyar Hada-Hadar Kudi</Text>
          <Text style={styles.heroText}>
            Kafin ka fara amfani da **Bellaj Data Hub**, wajibi ne ka saita lambobin PIN guda 4 da za ka rika amfani da su wajen siyan Data, Airtime, da biyan kudi.
          </Text>
        </View>

        <View style={styles.card}>
          {/* PIN INPUT */}
          <Text style={styles.inputLabel}>Shigar da Sabon PIN (Lambobi 4)</Text>
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
            <TouchableOpacity onPress={() => setShowPin(!showPin)} style={{ padding: 6 }}>
              <Ionicons name={showPin ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </View>

          {/* CONFIRM PIN INPUT */}
          <Text style={styles.inputLabel}>Tabbatar da Lambar PIN (Confirm PIN)</Text>
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
            <Ionicons name="information-circle" size={18} color={COLORS.secondary} />
            <Text style={styles.alertNoticeText}>
              Kada ka manta wannan lambar ko ka bayyana ta ga wani. Da ita za a rika cire kudi a asusunka.
            </Text>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, (pin.length !== 4 || confirmPin.length !== 4 || loading) && { opacity: 0.6 }]}
            onPress={handleCreatePin}
            disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="shield-checkmark" size={19} color={COLORS.white} />
                <Text style={styles.submitBtnText}>TABBATAR KUMA WUCE DASHBOARD</Text>
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
  headerSubtitle: { color: "#DCFCE7", fontSize: 12, marginTop: 4, fontWeight: "600" },
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.softGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
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
    fontSize: 12,
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
  alertNoticeText: { color: COLORS.primary, fontSize: 11.5, fontWeight: "700", flex: 1, lineHeight: 16 },

  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 13, letterSpacing: 0.5 },
});

export default SetupPinScreen;