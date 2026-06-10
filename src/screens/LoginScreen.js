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

const API_ENDPOINTS = {
  userLogin: `${BASE_URL}/auth/login`,
  supervisorLogin: `${BASE_URL}/auth/login`,
};

const LoginScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const isWeb = width >= 768;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    checkLoginStatus();
    checkBiometricStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const storedUserData = await AsyncStorage.getItem("userData");

      if (!token || !storedUserData) return;

      const user = JSON.parse(storedUserData);
      const detectedRole = (
        user?.role ||
        user?.user?.role ||
        user?.data?.user?.role ||
        user?.data?.role ||
        ""
      )
        .trim()
        .toLowerCase();

      if (detectedRole === "agent") {
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Main",
              state: { routes: [{ name: "AgentDashboard" }] },
            },
          ],
        });
      } else if (detectedRole === "supervisor") {
        navigation.reset({
          index: 0,
          routes: [{ name: "SupervisorDashboard" }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      }
    } catch (e) {
      console.log("Startup auth error:", e.message);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const isEnabled = await AsyncStorage.getItem("useBiometricLogin");
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (isEnabled === "true" && hasHardware && isEnrolled) {
        setIsBiometricEnabled(true);
      }
    } catch (e) {
      console.log("Biometric check error:", e.message);
    }
  };

  const openWhatsApp = () => {
    Linking.openURL(
      "https://wa.me/2349075207281?text=Hello%20Bellaj%20Data%20Hub%20Support"
    );
  };

  const openEmail = () => {
    Linking.openURL("mailto:support@bellajdatahub.online");
  };

  const makeCall = () => {
    Linking.openURL("tel:+2349075207281");
  };

  const redirectUser = (role) => {
    const normalizedRole = role?.trim()?.toLowerCase();

    if (isSupervisor || normalizedRole === "supervisor") {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "SupervisorDashboard" }],
        })
      );
    } else if (normalizedRole === "agent") {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "Main",
              state: {
                index: 0,
                routes: [{ name: "AgentDashboard" }],
              },
            },
          ],
        })
      );
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Main" }],
        })
      );
    }
  };

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const loginUrl = isSupervisor
        ? API_ENDPOINTS.supervisorLogin
        : API_ENDPOINTS.userLogin;

      const response = await axios.post(loginUrl, {
        email: email.trim().toLowerCase(),
        password,
      });

      const token =
        response?.data?.token ||
        response?.data?.accessToken ||
        response?.data?.data?.token ||
        "";

      const userPayload =
        response?.data?.user ||
        response?.data?.data?.user ||
        response?.data?.data ||
        {};

      const finalRole =
        userPayload?.role ||
        response?.data?.role ||
        response?.data?.data?.role ||
        "";

      if (!token) {
        setErrorMessage("Authentication token missing from server.");
        return;
      }

      await AsyncStorage.setItem("userToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(userPayload));

      setTimeout(() => redirectUser(finalRole), 300);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login to Bellaj Data Hub",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      if (!result.success) return;

      const storedUserData = await AsyncStorage.getItem("userData");
      const token = await AsyncStorage.getItem("userToken");

      if (!token || !storedUserData) {
        setErrorMessage("Please login with password first.");
        return;
      }

      const user = JSON.parse(storedUserData);
      const role = user?.role || user?.data?.role || "";

      redirectUser(role);
    } catch (error) {
      setErrorMessage("Biometric login failed. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent,
            { minHeight: height },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={[styles.card, isWeb && styles.webCard]}>
            <View style={styles.headerSection}>
              <View style={styles.logoCircle}>
                <Image
                  source={require("../assets/Logo.png")}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
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

            <TouchableOpacity
              style={styles.supervisorRow}
              onPress={() => setIsSupervisor(!isSupervisor)}
            >
              <Ionicons
                name={isSupervisor ? "checkbox" : "square-outline"}
                size={24}
                color={isSupervisor ? COLORS.primary : COLORS.muted}
              />
              <Text
                style={[
                  styles.supervisorText,
                  { color: isSupervisor ? COLORS.primary : COLORS.muted },
                ]}
              >
                Login as Supervisor
              </Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              {isBiometricEnabled ? (
                <TouchableOpacity
                  style={styles.biometricBtn}
                  onPress={handleBiometricLogin}
                >
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={35}
                    color={COLORS.secondary}
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
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginBtnText}>Login to Dashboard</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <TouchableOpacity onPress={() => navigation.navigate("About")}>
                <Text style={styles.linkText}>About Us</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                onPress={() => navigation.navigate("PrivacyPolicy")}
              >
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity onPress={() => navigation.navigate("Terms")}>
                <Text style={styles.linkText}>Terms</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.noAccountText}>
                Don&apos;t have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactContainer}>
              <Text style={styles.contactTitle}>QUICK SUPPORT</Text>

              <View style={styles.iconRow}>
                <TouchableOpacity
                  style={styles.contactIconCircle}
                  onPress={openWhatsApp}
                >
                  <FontAwesome name="whatsapp" size={24} color="#25D366" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.contactIconCircle, { marginHorizontal: 20 }]}
                  onPress={makeCall}
                >
                  <Ionicons name="call" size={24} color={COLORS.secondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.contactIconCircle}
                  onPress={openEmail}
                >
                  <Ionicons name="mail" size={24} color={COLORS.primary} />
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 35 : 20,
    paddingBottom: 28,
    backgroundColor: COLORS.light,
  },
  webScrollContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
  },
  card: {
    width: "100%",
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    justifyContent: "flex-start",
  },
  webCard: {
    flexGrow: 0,
    width: "100%",
    maxWidth: 520,
    borderRadius: 24,
    padding: 28,
    elevation: 8,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImg: {
    width: 72,
    height: 72,
  },
  appName: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  label: {
    color: "#475569",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "700",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 13,
    paddingHorizontal: 15,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    minHeight: 52,
    color: COLORS.dark,
    fontSize: 16,
    outlineStyle: "none",
  },
  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 18,
    alignItems: "center",
    gap: 8,
  },
  errorBannerText: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  supervisorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  supervisorText: {
    marginLeft: 8,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  biometricBtn: {
    alignItems: "center",
  },
  biometricText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: "bold",
    marginTop: 2,
  },
  forgotBtn: {
    alignSelf: "center",
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    width: "100%",
    flexWrap: "wrap",
  },
  linkText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
    flexWrap: "wrap",
  },
  noAccountText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  signupText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "900",
  },
  contactContainer: {
    marginTop: 28,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 18,
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    marginBottom: 15,
    letterSpacing: 1,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneNumber: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.secondary,
    textAlign: "center",
  },
});

export default LoginScreen;