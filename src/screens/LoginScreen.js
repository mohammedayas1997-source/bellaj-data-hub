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
  Dimensions,
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
const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F5F5F5",
  muted: "#64748B",
  border: "#E2E8F0",
};

const API_ENDPOINTS = {
  userLogin: "",
  supervisorLogin: "",
};

const LoginScreen = ({ navigation }) => {
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

      if (token && storedUserData) {
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
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
        }
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
      "whatsapp://send?phone=+2349075207281&text=Hello Bellaj Data Hub Support",
    );
  };

  const openEmail = () => {
    Linking.openURL("mailto:support@bellajdatahub.com");
  };

  const makeCall = () => {
    Linking.openURL("tel:+2349075207281");
  };

  const redirectUser = (role) => {
    const normalizedRole = role?.trim()?.toLowerCase();

    if (isSupervisor) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "SupervisorDashboard" }],
        }),
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
        }),
      );
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Main" }],
        }),
      );
    }
  };

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    const loginUrl = isSupervisor
      ? API_ENDPOINTS.supervisorLogin
      : API_ENDPOINTS.userLogin;

    if (!loginUrl) {
      setErrorMessage("Login API endpoint has not been configured.");
      return;
    }

    setLoading(true);

    try {
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
      if (error.response) {
        const status = error.response.status;
        const backendMessage =
          error.response.data?.message || "Invalid credentials.";

        setErrorMessage(
          status === 401 ? "Invalid email or password." : backendMessage,
        );
      } else {
        setErrorMessage("Network error. Please check your connection.");
      }
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.desktopContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/bellaj_logo.png")}
                style={styles.logoImg}
              />
            </View>

            <Text style={styles.appName}>Bellaj Data Hub</Text>
            <Text style={styles.tagline}>
              Secure, Fast & Reliable Digital Services
            </Text>
          </View>

          <View style={styles.formSection}>
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={COLORS.primary}
                />
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
              {isBiometricEnabled && (
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
              <Text style={styles.noAccountText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>
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

            <Text style={styles.phoneNumber}>+234 906 124 4444</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 40,
    width: "100%",
    alignItems: "center",
  },
  contentWrapper: {
    width: width > 600 ? 500 : "90%",
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 25,
    elevation: 8,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoCircle: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImg: {
    width: 72,
    height: 72,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 5,
    textAlign: "center",
  },
  formSection: {
    width: "100%",
  },
  label: {
    color: "#475569",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.dark,
    fontSize: 16,
  },
  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
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
    marginBottom: 20,
  },
  supervisorText: {
    marginLeft: 8,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
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
    fontWeight: "600",
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
    width: "100%",
    flexWrap: "wrap",
  },
  linkText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
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
    marginTop: 25,
  },
  noAccountText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  signupText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "bold",
  },
  contactContainer: {
    marginTop: 35,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 20,
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: "700",
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
    fontWeight: "bold",
    color: COLORS.secondary,
    textAlign: "center",
  },
});

export default LoginScreen;
