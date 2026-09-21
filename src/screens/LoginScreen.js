import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Linking,
  useWindowDimensions,
  SafeAreaView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
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
  danger: "#DC2626",
};

const LoginScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Prevent blank screen by mounting UI cleanly first
    const init = async () => {
      try {
        await checkLoginStatus();
        await setupBiometrics();
      } catch (err) {
        console.log("Initialization error:", err.message);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

  const detectRole = (payload) => {
    const candidate =
      payload?.role ||
      payload?.user?.role ||
      payload?.data?.role ||
      payload?.data?.user?.role ||
      payload?.userData?.role ||
      "";

    return String(candidate).trim().toLowerCase();
  };

  const getToken = (data) =>
    data?.token ||
    data?.accessToken ||
    data?.data?.token ||
    data?.data?.accessToken ||
    "";

  const getUserPayload = (data) =>
    data?.user || data?.data?.user || data?.data || {};

  const isPinRequiredRole = (role) => {
    const cleanRole = String(role || "user").trim().toLowerCase();
    return cleanRole === "user" || cleanRole === "customer" || cleanRole === "agent";
  };

  const checkHasPin = (userObj) => {
    if (!userObj) return false;

    const rawPin = String(userObj.pin || "").trim();
    if (rawPin && rawPin !== "0000" && rawPin.length === 4) {
      return true;
    }

    if (
      userObj.isPinSet === true ||
      userObj.hasPin === true ||
      userObj.has_transaction_pin === true ||
      userObj.pin_set === true
    ) {
      return true;
    }

    return false;
  };

  const redirectUser = (role) => {
    const normalizedRole = String(role || "user").trim().toLowerCase();

    const roleTargetMap = {
      superadmin: "SuperAdminDashboard",
      admin: "AdminDashboard",
      leader: "LeaderDashboard",
      support: "SupportDashboard",
      supervisor: "SupervisorDashboard",
      agent: "AgentDashboard",
      user: "Dashboard",
      customer: "Dashboard",
    };

    const targetScreen = roleTargetMap[normalizedRole] || "Dashboard";

    try {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: targetScreen }],
        })
      );
    } catch {
      try {
        navigation.navigate(targetScreen);
      } catch (e) {
        console.log("Navigation dispatch failed:", e.message);
      }
    }
  };

  const routeToSetupPin = () => {
    try {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "SetupPin", params: { isFirstTime: true } }],
        })
      );
    } catch {
      navigation.navigate("SetupPin", { isFirstTime: true });
    }
  };

  const checkLoginStatus = async () => {
    try {
      const token =
        (await AsyncStorage.getItem("userToken")) ||
        (await AsyncStorage.getItem("token"));
      const storedUserData = await AsyncStorage.getItem("userData");
      const storedRole = await AsyncStorage.getItem("userRole");

      if (!token) return;

      let userObj = {};
      if (storedUserData) {
        try {
          userObj = JSON.parse(storedUserData);
        } catch {}
      }

      const activeRole = storedRole || detectRole(userObj) || "user";
      redirectUser(activeRole);
    } catch (e) {
      console.log("Startup auth check warning:", e.message);
    }
  };

  const setupBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        setIsBiometricSupported(true);
      }
    } catch (e) {
      console.log("Biometric setup warning:", e.message);
    }
  };

  const handleLogin = async () => {
    setErrorMessage("");
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const endpoints = [
        `${BASE_URL}/api/v1/auth/login`,
        `${BASE_URL}/api/v1/auth/supervisor-login`,
        `${BASE_URL}/auth/login`,
        `${BASE_URL}/auth/supervisor-login`,
        `${BASE_URL}/api/v1/users/login`,
        `${BASE_URL}/users/login`,
      ];

      let response = null;
      let lastErr = null;

      for (const url of endpoints) {
        try {
          const res = await axios.post(
            url,
            { email: cleanEmail, password: String(password).trim() },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 15000,
            }
          );
          if (res?.data?.token || res?.data?.success) {
            response = res;
            break;
          }
        } catch (err) {
          lastErr = err;
          if (err?.response?.status === 403) {
            throw err;
          }
        }
      }

      if (!response && lastErr) {
        throw lastErr;
      }

      if (!response) {
        throw new Error("Unable to establish connection with authentication server.");
      }

      const token = getToken(response.data);
      const userPayload = getUserPayload(response.data);
      let finalRole = detectRole(response.data);

      if (!finalRole && userPayload?.role) {
        finalRole = String(userPayload.role).trim().toLowerCase();
      }

      if (!token) {
        setErrorMessage("Authentication token missing from server response.");
        return;
      }

      const verifiedRole = finalRole || "user";
      const finalUserData = {
        ...userPayload,
        email: userPayload?.email || cleanEmail,
        role: verifiedRole,
      };

      await AsyncStorage.multiRemove([
        "userToken",
        "token",
        "adminToken",
        "userData",
        "userRole",
        "overrideRole",
        "isSuperAdminOverride",
      ]);

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("userData", JSON.stringify(finalUserData));
      await AsyncStorage.setItem("userRole", verifiedRole);

      if (verifiedRole === "admin" || verifiedRole === "superadmin") {
        await AsyncStorage.setItem("adminToken", token);
      }

      // Enforce PIN setup ONLY for Customers and Agents
      if (isPinRequiredRole(verifiedRole)) {
        const hasPinAlready = checkHasPin(finalUserData);
        const cachedPin = await AsyncStorage.getItem("transactionPin");

        if (!hasPinAlready && (!cachedPin || cachedPin === "0000")) {
          routeToSetupPin();
          return;
        }
      }

      if (isBiometricSupported) {
        const biometricSetting = await AsyncStorage.getItem("useBiometricLogin");
        if (biometricSetting !== "true") {
          Alert.alert(
            "Enable Fingerprint Login?",
            "Would you like to use fingerprint / biometrics for instant login next time?",
            [
              {
                text: "No",
                style: "cancel",
                onPress: () => redirectUser(verifiedRole),
              },
              {
                text: "Yes, Enable",
                onPress: async () => {
                  await AsyncStorage.setItem("useBiometricLogin", "true");
                  redirectUser(verifiedRole);
                },
              },
            ]
          );
          return;
        }
      }

      redirectUser(verifiedRole);
    } catch (error) {
      console.error("Login error:", error);
      const status = error?.response?.status;
      const serverMessage =
        error?.response?.data?.message || error?.response?.data?.error;

      if (status === 401) {
        setErrorMessage(serverMessage || "Invalid email address or password.");
      } else if (status === 403) {
        setErrorMessage(serverMessage || "Your account has been suspended. Please contact administrator.");
      } else if (status === 404) {
        setErrorMessage("Login service unavailable. Verify server endpoints.");
      } else {
        setErrorMessage(
          serverMessage || error.message || "Login failed. Please verify credentials."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMessage("");

    try {
      const token =
        (await AsyncStorage.getItem("userToken")) ||
        (await AsyncStorage.getItem("token"));
      const storedUserData = await AsyncStorage.getItem("userData");
      const storedRole = await AsyncStorage.getItem("userRole");

      if (!token) {
        setErrorMessage("Please login with email and password first to enable Touch ID.");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to Bellaj Data Hub",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
        cancelLabel: "Cancel",
      });

      if (!result.success) return;

      let userObj = {};
      if (storedUserData) {
        try {
          userObj = JSON.parse(storedUserData);
        } catch {}
      }

      const activeRole = storedRole || detectRole(userObj) || "user";

      if (isPinRequiredRole(activeRole)) {
        const hasPinAlready = checkHasPin(userObj);
        const cachedPin = await AsyncStorage.getItem("transactionPin");

        if (!hasPinAlready && (!cachedPin || cachedPin === "0000")) {
          routeToSetupPin();
          return;
        }
      }

      redirectUser(activeRole);
    } catch (err) {
      setErrorMessage(err.message || "Biometric login failed. Please use your password.");
    }
  };

  if (!isReady) {
    return (
      <View style={styles.centerLoader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isWeb && styles.webCard]}>
            <View style={styles.headerSection}>
              <View style={styles.logoCircle}>
                <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
              </View>

              <Text style={styles.appName}>Bellaj Data Hub</Text>
              <Text style={styles.tagline}>
                Secure, Fast & Reliable Digital Services
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="example@mail.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.muted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage("");
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              {isBiometricSupported ? (
                <TouchableOpacity
                  style={styles.biometricBtn}
                  onPress={handleBiometricLogin}
                >
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={28}
                    color={COLORS.primary}
                  />
                  <Text style={styles.biometricText}>Touch ID</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginBtnText}>Login to Dashboard</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactContainer}>
              <Text style={styles.contactTitle}>QUICK SUPPORT</Text>
              <View style={styles.iconRow}>
                <TouchableOpacity
                  style={styles.contactIconCircle}
                  onPress={() => Linking.openURL("https://wa.me/2349075207281?text=Hello%20Bellaj%20Support")}
                >
                  <FontAwesome name="whatsapp" size={22} color="#25D366" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactIconCircle, { marginHorizontal: 16 }]}
                  onPress={() => Linking.openURL("tel:+2349075207281")}
                >
                  <Ionicons name="call" size={22} color={COLORS.secondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactIconCircle}
                  onPress={() => Linking.openURL("mailto:support@bellajdatahub.online")}
                >
                  <Ionicons name="mail" size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.phoneNumber}>+234 9075207281</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  centerLoader: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 30 : 16,
    paddingBottom: 60,
    backgroundColor: COLORS.light,
  },
  webScrollContent: {
    alignItems: "center",
    paddingTop: 35,
    paddingBottom: 70,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webCard: {
    padding: 28,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appName: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },
  tagline: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  label: {
    color: "#475569",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 50,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    minHeight: 50,
    color: COLORS.dark,
    fontSize: 15,
  },
  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: "center",
    gap: 8,
  },
  errorBannerText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  biometricText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  forgotBtn: { alignSelf: "center" },
  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
    flexWrap: "wrap",
  },
  noAccountText: { color: COLORS.muted, fontSize: 13.5 },
  signupText: {
    color: COLORS.secondary,
    fontSize: 13.5,
    fontWeight: "900",
  },
  contactContainer: {
    marginTop: 22,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 14,
  },
  contactTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 12,
    letterSpacing: 1,
  },
  iconRow: { flexDirection: "row", alignItems: "center" },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneNumber: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.secondary,
    textAlign: "center",
  },
});

export default LoginScreen;