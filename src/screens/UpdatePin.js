import React, { useEffect, useState, useCallback } from "react";
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
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#DCFCE7",
  softRed: "#FEE2E2",
  danger: "#DC2626",
  warning: "#D97706",
};

const UpdatePin = ({ navigation }) => {
  const [hasPin, setHasPin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 25000,
    };
  };

  const checkPinStatus = useCallback(async () => {
    try {
      setFetchingStatus(true);
      const config = await getAuthHeaders();

      // 1. Duba local storage da farko
      const localUserData = await AsyncStorage.getItem("userData");
      if (localUserData) {
        try {
          const user = JSON.parse(localUserData);
          if (
            user?.has_transaction_pin ||
            user?.pin_set === true ||
            user?.hasPin === true ||
            user?.isPinSet === true ||
            (user?.pin && user?.pin !== "0000")
          ) {
            setHasPin(true);
          }
        } catch {}
      }

      // 2. Duba kai tsaye daga backend endpoints masu yawa (fallbacks)
      const endpoints = [
        `${BASE_URL}/user/pin-status`,
        `${BASE_URL}/api/v1/user/pin-status`,
        `${BASE_URL}/users/pin-status`,
        `${BASE_URL}/users/profile`,
        `${BASE_URL}/api/v1/users/me`,
      ];

      for (const url of endpoints) {
        try {
          const res = await axios.get(url, config);
          const data = res.data;
          const status =
            data?.hasPin ||
            data?.has_transaction_pin ||
            data?.pin_set ||
            data?.isPinSet ||
            data?.data?.hasPin ||
            data?.user?.hasPin ||
            (data?.user?.pin && data?.user?.pin !== "0000");

          if (status !== undefined) {
            setHasPin(Boolean(status));
            break;
          }
        } catch {}
      }
    } catch {
      const savedPin = await AsyncStorage.getItem("transactionPin");
      setHasPin(Boolean(savedPin && savedPin !== "0000"));
    } finally {
      setFetchingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkPinStatus();
  }, [checkPinStatus]);

  const cleanPin = (value) => value.replace(/[^0-9]/g, "");

  const validatePin = () => {
    if (hasPin && oldPin.length !== 4) {
      Alert.alert("PIN Ba Daidai Ba", "Don Allah saka ainihin lambar PIN ɗinka ta yanzu (lambobi 4).");
      return false;
    }

    if (newPin.length !== 4) {
      Alert.alert("PIN Ba Daidai Ba", "Sabuwar lambar PIN dole ne ta kasance daidai lambobi 4.");
      return false;
    }

    if (confirmPin.length !== 4) {
      Alert.alert("Tabbatar da PIN", "Don Allah tabbatar da sabuwar lambar PIN ɗinka (lambobi 4).");
      return false;
    }

    if (newPin !== confirmPin) {
      Alert.alert("PIN Bai Zo Daya Ba", "Sabuwar lambar PIN da ta tabbatarwa ba su zo ɗaya ba.");
      return false;
    }

    if (hasPin && oldPin === newPin) {
      Alert.alert("Kuskure", "Sabuwar lambar PIN dole ne ta bambanta da tsohuwar lambar PIN.");
      return false;
    }

    return true;
  };

  const handleProcessPin = async () => {
    if (!validatePin()) return;

    Alert.alert(
      hasPin ? "Sauya Transaction PIN" : "Saita Sabon PIN",
      hasPin
        ? "Shin ka tabbata kana son sauya lambar sirrinka ta transaction PIN?"
        : "Shin ka tabbata kana son saita wannan a matsayin lambar sirrinka ta PIN?",
      [
        { text: "Fasa", style: "cancel" },
        {
          text: "Tabbatar",
          onPress: async () => {
            try {
              setLoading(true);
              const config = await getAuthHeaders();

              const payload = hasPin
                ? {
                    oldPin: oldPin.trim(),
                    newPin: newPin.trim(),
                    pin: newPin.trim(),
                    currentPin: oldPin.trim(),
                    transactionPin: newPin.trim(),
                  }
                : {
                    pin: newPin.trim(),
                    transactionPin: newPin.trim(),
                    confirmPin: confirmPin.trim(),
                  };

              // Jerin endpoints na sabuntawa ko saita sabon PIN
              const endpoints = hasPin
                ? [
                    `${BASE_URL}/user/change-pin`,
                    `${BASE_URL}/api/v1/user/change-pin`,
                    `${BASE_URL}/users/change-pin`,
                    `${BASE_URL}/users/update-pin`,
                  ]
                : [
                    `${BASE_URL}/user/set-pin`,
                    `${BASE_URL}/api/v1/user/set-pin`,
                    `${BASE_URL}/users/set-pin`,
                    `${BASE_URL}/auth/set-pin`,
                  ];

              let successResult = false;
              let serverMessage = "";

              for (const url of endpoints) {
                try {
                  const res = await axios.post(url, payload, config).catch(async () => {
                    return await axios.put(url, payload, config);
                  });

                  if (res?.status === 200 || res?.status === 201 || res?.data?.success) {
                    successResult = true;
                    serverMessage = res?.data?.message || "An sabunta Transaction PIN cikin nasara.";
                    break;
                  }
                } catch (e) {
                  serverMessage = e?.response?.data?.message || e?.message || "";
                  if (e?.response?.status === 400 || e?.response?.status === 401) {
                    throw new Error(serverMessage);
                  }
                }
              }

              if (!successResult && serverMessage) {
                throw new Error(serverMessage);
              }

              // Adana PIN a waya (Local Cache)
              await AsyncStorage.setItem("transactionPin", newPin.trim());

              const storedUser = await AsyncStorage.getItem("userData");
              if (storedUser) {
                const user = JSON.parse(storedUser);
                const updatedUser = {
                  ...user,
                  has_transaction_pin: true,
                  pin_set: true,
                  hasPin: true,
                  isPinSet: true,
                };
                await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
              }

              Alert.alert(
                "Bellaj Data Hub",
                hasPin
                  ? "An canza lambar PIN ta hada-hadar kuɗi cikin nasara."
                  : "An saita sabuwar lambar PIN cikin nasara.",
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
              Alert.alert("Matsalar PIN", error.message || "An samu cikas wajen canza PIN. Sake gwadawa.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const logout = async () => {
    Alert.alert("Fita daga Asusu", "Shin kana son fita?", [
      { text: "A'a", style: "cancel" },
      {
        text: "Fita",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "token",
            "adminToken",
            "userData",
            "userRole",
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

  if (fetchingStatus) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Ana duba tsaron PIN...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>
            {hasPin ? "Canza Transaction PIN" : "Saita Transaction PIN"}
          </Text>
          <Text style={styles.headerSubtitle}>Kariyar asusunka na Bellaj Data Hub</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="power" size={19} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={hasPin ? "shield-checkmark" : "key"}
              size={32}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {hasPin ? "Kariyar Lambar Sirri (PIN)" : "Saita Sabon PIN"}
            </Text>
            <Text style={styles.heroText}>
              {hasPin
                ? "Sauya lambobin sirri guda 4 da kake amfani da su wajen siyan Data, Airtime, da tura kuɗi."
                : "Ƙirƙiri lambobin sirri guda 4 da za ka riƙa amfani da su wajen tabbatar da kowace ciniki a app."}
            </Text>
          </View>
        </View>

        {/* INPUT CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="shield-key-outline"
              size={22}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>
              {hasPin ? "Shigar da Sabon PIN" : "Ƙirƙiri Sabon PIN"}
            </Text>
          </View>

          {/* TSOHUWAR PIN (IDAN DA MA AKWAI) */}
          {hasPin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tsohuwar Lambar PIN (Current PIN)</Text>
              <View style={styles.pinInputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry={!showOldPin}
                  value={oldPin}
                  onChangeText={(text) => setOldPin(cleanPin(text))}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowOldPin(!showOldPin)}
                >
                  <Ionicons
                    name={showOldPin ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={COLORS.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SABUWAR PIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {hasPin ? "Sabuwar Lambar PIN (New PIN)" : "Saka PIN (Lambobi 4)"}
            </Text>
            <View style={styles.pinInputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showNewPin}
                value={newPin}
                onChangeText={(text) => setNewPin(cleanPin(text))}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowNewPin(!showNewPin)}
              >
                <Ionicons
                  name={showNewPin ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* TABBATAR DA SABUWAR PIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tabbatar da Sabuwar PIN (Confirm PIN)</Text>
            <View style={styles.pinInputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={!showConfirmPin}
                value={confirmPin}
                onChangeText={(text) => setConfirmPin(cleanPin(text))}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirmPin(!showConfirmPin)}
              >
                <Ionicons
                  name={showConfirmPin ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* INFO BOX */}
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.secondary}
            />
            <Text style={styles.infoText}>
              Lambar PIN dole ne ta kasance lambobi 4 cif. Kada ka taɓa bayyana ta ga kowa don kare asusunka.
            </Text>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleProcessPin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons
                  name={hasPin ? "shield-checkmark-outline" : "key-outline"}
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.submitBtnText}>
                  {hasPin ? "SABUNTA TRANSACTION PIN" : "KIRKIRI PIN YANZU"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.secondaryBtnText}>Koma Baya (Cancel)</Text>
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
    fontSize: 13,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 44 : 22,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextBox: { flex: 1 },
  headerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#DCFCE7",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
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
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 18,
    fontWeight: "600",
    fontSize: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: COLORS.dark,
    fontSize: 11.5,
    marginBottom: 6,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  pinInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 16,
    color: COLORS.dark,
    fontSize: 22,
    letterSpacing: 10,
    fontWeight: "900",
    textAlign: "center",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  eyeBtn: {
    padding: 8,
  },
  infoBox: {
    backgroundColor: COLORS.softGreen,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginVertical: 12,
  },
  infoText: {
    color: COLORS.secondary,
    fontWeight: "700",
    lineHeight: 18,
    flex: 1,
    fontSize: 11.5,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  secondaryBtnText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 13,
  },
});

export default UpdatePin;