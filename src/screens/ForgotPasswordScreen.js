import React, { useState } from "react";
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
  SafeAreaView,
  Alert,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
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
  softGreen: "#EAF7F1",
};

const ForgotPasswordScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  // Step 1 = Request OTP, Step 2 = Verify OTP & Set New Password
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showAlert = (title, msg, onOk) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${msg}`);
      if (onOk) onOk();
    } else {
      Alert.alert(title, msg, [{ text: "OK", onPress: onOk }]);
    }
  };

  // Mataki na 1: Tura OTP
  const handleRequestOtp = async () => {
    setErrorMessage("");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: cleanEmail,
      });

      if (res.data?.success) {
        showAlert("OTP Sent", "A 6-digit OTP code has been sent to your email.", () => {
          setStep(2);
        });
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to send reset code. Verify your email."
      );
    } finally {
      setLoading(false);
    }
  };

  // Mataki na 2: Tantancewa da Canza Password
  const handleResetPassword = async () => {
    setErrorMessage("");

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/auth/reset-password`, {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });

      if (res.data?.success) {
        showAlert(
          "Success!",
          "Your password has been reset successfully. Please login with your new password.",
          () => navigation.navigate("Login")
        );
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Invalid or expired OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWeb && styles.webScrollContent]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isWeb && styles.webCard]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
            </TouchableOpacity>

            <View style={styles.headerArea}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={step === 1 ? "mail-unread-outline" : "key-outline"}
                  size={36}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.title}>
                {step === 1 ? "Forgot Password?" : "Reset Password"}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1
                  ? "Enter your email address and we will send you a 6-digit OTP code to reset your password."
                  : `Enter the 6-digit code sent to ${email} and choose a new password.`}
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              // STEP 1 UI
              <View>
                <Text style={styles.label}>Registered Email Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={COLORS.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="example@gmail.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.mainBtn, loading && { opacity: 0.7 }]}
                  onPress={handleRequestOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.mainBtnText}>SEND OTP CODE</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // STEP 2 UI
              <View>
                <Text style={styles.label}>6-Digit OTP Code</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.muted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { letterSpacing: 4, fontWeight: "900" }]}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimum 6 characters"
                    placeholderTextColor="#94A3B8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.muted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm New Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.mainBtn, loading && { opacity: 0.7 }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.mainBtnText}>RESET PASSWORD</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.resendBtn} onPress={() => setStep(1)}>
                  <Text style={styles.resendText}>Change Email or Resend OTP</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.light },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  webScrollContent: {
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webCard: {
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.light,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.softGreen,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.muted,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 50,
    marginBottom: 14,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 15,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  mainBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  mainBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  resendBtn: {
    alignItems: "center",
    marginTop: 14,
  },
  resendText: {
    color: COLORS.secondary,
    fontWeight: "800",
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 13,
  },
});

export default ForgotPasswordScreen;