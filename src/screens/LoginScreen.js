import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
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

const { width } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // State to display inline errors on the screen

  useEffect(() => {
    checkLoginStatus();
    checkBiometricStatus();
  }, []);

  const checkLoginStatus = async () => {
    const token = await AsyncStorage.getItem("userToken");
    const storedUserData = await AsyncStorage.getItem("userData");

    if (token) {
      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        // Robust check across multiple common payload structures for persistence routing
        const detectedRole = user?.role || user?.data?.role || "";
        if (detectedRole.trim().toLowerCase() === "agent") {
          navigation.replace("AgentDashboard");
          return;
        }
      }
      navigation.replace("Main");
    }
  };

  const checkBiometricStatus = async () => {
    const isEnabled = await AsyncStorage.getItem("useBiometricLogin");
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (isEnabled === "true" && hasHardware && isEnrolled) {
      setIsBiometricEnabled(true);
    }
  };

  const openWhatsApp = () => {
    Linking.openURL(
      "whatsapp://send?phone=+2349061244444&text=Hello Ayax Xpress Support",
    );
  };

  const openEmail = () => {
    Linking.openURL("mailto:support@ayaxxpress.com");
  };

  const makeCall = () => {
    Linking.openURL("tel:+2349061244444");
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login to Ayax Xpress",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLoading(true);
        const token = await AsyncStorage.getItem("userToken");
        const storedUserData = await AsyncStorage.getItem("userData");

        if (token) {
          if (storedUserData) {
            const user = JSON.parse(storedUserData);
            const detectedRole = user?.role || user?.data?.role || "";
            if (detectedRole.trim().toLowerCase() === "agent") {
              navigation.replace("AgentDashboard");
              return;
            }
          }
          navigation.replace("Main");
        } else {
          setErrorMessage(
            "Please login with password once to enable biometrics.",
          );
        }
      }
    } catch (error) {
      setErrorMessage("Biometric authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage(""); // Clear any existing errors on visual terminal
    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://ayax-data-xpress-server.onrender.com/api/v1/auth/login",
        {
          email: email.trim().toLowerCase(),
          password: password,
        },
      );

      if (response.data.status === "success" || response.data.token) {
        const token = response.data.token;

        // Deep verification fallback logic for nested object payloads
        const userPayload =
          response.data.user ||
          response.data.data?.user ||
          response.data.data ||
          {};
        const userData = JSON.stringify(userPayload);

        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userData", userData);

        // Comprehensive verification checks for agent assignment values
        const finalRole = userPayload?.role || response.data.role || "";

        if (finalRole.trim().toLowerCase() === "agent") {
          navigation.replace("AgentDashboard");
        } else {
          navigation.replace("Main");
        }
      } else {
        setErrorMessage(
          response.data.message || "Invalid login credentials details.",
        );
      }
    } catch (error) {
      console.log("Login Error Details:", error.response?.data);

      // Capture 401 or backend validation messages directly onto the screen layout
      if (error.response?.status === 401) {
        setErrorMessage(
          "Invalid email or password. Please double-check your credentials.",
        );
      } else {
        const errorMsg =
          error.response?.data?.message ||
          "Network connection issue. Please verify your internet connection and try again.";
        setErrorMessage(errorMsg);
      }
    } finally {
      setLoading(false);
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
      >
        <View style={styles.contentWrapper}>
          <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/Logo.png")}
                style={styles.logoImg}
              />
            </View>
            <Text style={styles.appName}>Ayax Xpress</Text>
            <Text style={styles.tagline}>
              Swift & Reliable Utility Payments
            </Text>
          </View>

          <View style={styles.formSection}>
            {/* Inline Error Container Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#b91c1c" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#64748b"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="example@mail.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage(""); // Clear error when typing
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
                color="#64748b"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage(""); // Clear error when typing
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              {isBiometricEnabled && (
                <TouchableOpacity
                  style={styles.biometricBtn}
                  onPress={handleBiometricLogin}
                >
                  <MaterialCommunityIcons
                    name="fingerprint"
                    size={35}
                    color="#0a1d37"
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
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Login to Dashboard</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("About")}
              >
                <Text style={styles.linkText}>About Us</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("PrivacyPolicy")}
              >
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Terms")}
              >
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
            <Text style={styles.contactTitle}>Quick Support</Text>
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
                <Ionicons name="call" size={24} color="#0a1d37" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactIconCircle}
                onPress={openEmail}
              >
                <Ionicons name="mail" size={24} color="#EA4335" />
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
    backgroundColor: "#f8fafc",
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
    backgroundColor: "#ffffff",
    borderRadius: 25,
    padding: 25,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  headerSection: { alignItems: "center", marginBottom: 30 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  logoImg: { width: 60, height: 60, resizeMode: "contain" },
  appName: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
  tagline: { fontSize: 14, color: "#64748b", marginTop: 5 },
  formSection: { width: "100%" },
  label: { color: "#475569", fontSize: 14, marginBottom: 8, fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: "#0f172a", fontSize: 16 },
  errorBanner: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    borderColor: "#fee2e2",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  errorBannerText: {
    color: "#991b1b",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  biometricBtn: { alignItems: "center" },
  biometricText: {
    fontSize: 10,
    color: "#0a1d37",
    fontWeight: "bold",
    marginTop: 2,
  },
  forgotBtn: { alignSelf: "center" },
  forgotText: { color: "#0a1d37", fontSize: 14, fontWeight: "600" },
  loginBtn: {
    backgroundColor: "#0a1d37",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  noAccountText: { color: "#64748b", fontSize: 14 },
  signupText: { color: "#0a1d37", fontSize: 14, fontWeight: "bold" },
  contactContainer: {
    marginTop: 35,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 20,
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 15,
    letterSpacing: 1,
  },
  iconRow: { flexDirection: "row", alignItems: "center" },
  contactIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  phoneNumber: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: "bold",
    color: "#0a1d37",
    textAlign: "center",
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
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    textDecorationLine: "underline",
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "#cbd5e1",
    marginHorizontal: 8,
  },
});

export default LoginScreen;
