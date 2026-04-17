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

const SignupScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = async () => {
    // 1. Check if all fields are filled
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    // 2. Check if passwords match
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match!");
    }

    try {
      const response = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/auth/register",
        { fullName, email, phone, password },
      );
      if (response.data.success) {
        Alert.alert("Success", "Account created successfully! Please login.");
        navigation.navigate("Login");
      }
    } catch (error) {
      Alert.alert("Error", "Registration failed. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Fill in your details to get started</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="John Doe"
            placeholderTextColor="#cbd5e1"
            onChangeText={setFullName}
          />
        </View>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="example@mail.com"
            placeholderTextColor="#cbd5e1"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="08012345678"
            placeholderTextColor="#cbd5e1"
            keyboardType="numeric"
            onChangeText={setPhone}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputView}>
          <TextInput
            secureTextEntry
            style={styles.inputText}
            placeholder="••••••••"
            placeholderTextColor="#cbd5e1"
            onChangeText={setPassword}
          />
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputView}>
          <TextInput
            secureTextEntry
            style={styles.inputText}
            placeholder="••••••••"
            placeholderTextColor="#cbd5e1"
            onChangeText={setConfirmPassword}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
        <Text style={styles.signupText}>CREATE ACCOUNT</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    paddingVertical: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 5,
  },
  subtitle: {
    color: "#64748b",
    marginBottom: 30,
    fontSize: 15,
  },
  inputContainer: {
    width: "85%",
  },
  label: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 5,
  },
  inputView: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    height: 55,
    marginBottom: 15,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
  },
  inputText: {
    height: 50,
    color: "#1e293b",
    fontSize: 16,
  },
  signupBtn: {
    width: "85%",
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 4,
  },
  signupText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    marginTop: 30,
  },
  footerText: {
    color: "#64748b",
    fontSize: 15,
  },
  loginLink: {
    color: "#1e3a8a",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default SignupScreen;
