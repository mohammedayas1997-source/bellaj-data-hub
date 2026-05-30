import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#94A3B8",
  card: "#1E293B",
  border: "#334155",
  softRed: "rgba(230, 0, 0, 0.12)",
};

const API_ENDPOINTS = {
  forgotPassword: "",
};

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (text) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    return reg.test(text);
  };

  const handleReset = async () => {
    if (!email.trim()) {
      return Alert.alert("Required", "Please enter your email address.");
    }

    if (!validateEmail(email.trim())) {
      return Alert.alert(
        "Invalid Email",
        "Please enter a valid email address format.",
      );
    }

    if (!API_ENDPOINTS.forgotPassword) {
      return Alert.alert(
        "Not Configured",
        "Forgot password API endpoint has not been configured.",
      );
    }

    setLoading(true);

    try {
      const response = await axios.post(
        API_ENDPOINTS.forgotPassword,
        { email: email.trim().toLowerCase() },
        { timeout: 15000 },
      );

      if (response.data.success || response.status === 200) {
        Alert.alert(
          "Check Your Inbox",
          "If an account exists with that email, you will receive password reset instructions shortly.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }],
        );
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Unable to connect to the server. Please check your internet and try again.";

      Alert.alert("Request Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

        <TouchableOpacity
          style={styles.backArrow}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Ionicons name="lock-open-outline" size={45} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Forgot Password?</Text>

        <Text style={styles.subtitle}>
          No worries! Enter your registered email address and Bellaj Data Hub
          will send you a link to reset your password.
        </Text>

        <View style={styles.inputWrapper}>
          <Ionicons
            name="mail-outline"
            size={20}
            color={COLORS.muted}
            style={styles.inputIcon}
          />

          <TextInput
            style={styles.inputText}
            placeholder="Email Address"
            placeholderTextColor="#64748B"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <TouchableOpacity
          style={[styles.resetBtn, loading && { opacity: 0.8 }]}
          onPress={handleReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.resetText}>SEND RESET LINK</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  backArrow: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
    fontSize: 15,
    paddingHorizontal: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    height: 60,
    marginBottom: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    height: "100%",
    color: COLORS.light,
    fontSize: 16,
  },
  resetBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 15,
  },
  loginLink: {
    color: COLORS.secondary,
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default ForgotPasswordScreen;
