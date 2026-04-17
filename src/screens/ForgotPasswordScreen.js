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
} from "react-native";
import axios from "axios";

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      return Alert.alert(
        "Error",
        "Please enter your registered email address.",
      );
    }

    setLoading(true);
    try {
      // Wannan layin zai yi magana da API dinka
      const response = await axios.post(
        "https://ayax-api.vercel.app/api/v1/auth/forgot-password",
        { email },
      );

      Alert.alert(
        "Success",
        "Reset instructions have been sent to your email.",
      );
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert(
        "Error",
        "Something went wrong. Please check the email and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>?</Text>
      </View>

      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you instructions to reset your
        password.
      </Text>

      <View style={styles.inputView}>
        <TextInput
          style={styles.inputText}
          placeholder="Email Address"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
        />
      </View>

      <TouchableOpacity
        style={styles.resetBtn}
        onPress={handleReset}
        disabled={loading}
      >
        <Text style={styles.resetText}>
          {loading ? "SENDING..." : "RESET PASSWORD"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1e293b",
    borderWidth: 2,
    borderColor: "#38bdf8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconText: { color: "#38bdf8", fontSize: 40, fontWeight: "bold" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#f8fafc",
    marginBottom: 10,
  },
  subtitle: {
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  inputView: {
    width: "100%",
    backgroundColor: "#1e293b",
    borderRadius: 15,
    height: 55,
    marginBottom: 20,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#334155",
  },
  inputText: { height: 50, color: "#f8fafc" },
  resetBtn: {
    width: "100%",
    backgroundColor: "#1e3a8a",
    borderRadius: 15,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    elevation: 5,
  },
  resetText: { color: "white", fontWeight: "bold", fontSize: 16 },
  backBtn: { marginTop: 25 },
  backText: { color: "#38bdf8", fontWeight: "bold" },
});

export default ForgotPasswordScreen;
