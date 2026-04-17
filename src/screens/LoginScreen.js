import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Image,
  ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage"; // 1. Don adana login

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // Don nuna alamar aiki

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill in all fields");
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/auth/login",
        { email, password },
      );

      if (response.data.success) {
        // 2. Adana Token da bayanan mutum a wayar
        await AsyncStorage.setItem("userToken", response.data.token);
        if (response.data.user) {
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(response.data.user),
          );
        }

        navigation.replace("Home"); // Replace don kar ya koma baya zuwa login
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Invalid Email or Password";
      Alert.alert("Login Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 1. LOGO SECTION */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/Logo.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>Data Xpress</Text>
      </View>

      {/* 2. INPUT FIELDS */}
      <View style={styles.inputContainer}>
        <Text style={styles.fieldLabel}>Email Address</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="e.g. user@ayax.com"
            placeholderTextColor="#cbd5e1"
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.inputView}>
          <TextInput
            secureTextEntry
            style={styles.inputText}
            placeholder="••••••••"
            placeholderTextColor="#cbd5e1"
            onChangeText={setPassword}
          />
        </View>
      </View>

      {/* 3. FORGOT PASSWORD */}
      <TouchableOpacity
        style={styles.forgotBtn}
        onPress={() => navigation.navigate("ForgotPassword")}
      >
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* 4. LOGIN BUTTON */}
      <TouchableOpacity
        style={[styles.loginBtn, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>
          {loading ? "AUTHENTICATING..." : "SIGN IN"}
        </Text>
      </TouchableOpacity>

      {/* 5. CREATE ACCOUNT SECTION */}
      <View style={styles.footer}>
        <Text style={styles.noAccountText}>New to Ayax Xpress? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.signupText}>Create Account</Text>
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
    justifyContent: "center",
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoImage: {
    width: 150,
    height: 100,
  },
  logoText: {
    fontWeight: "800",
    fontSize: 32,
    color: "#0f172a",
    letterSpacing: 1.5,
    marginTop: -10,
  },
  inputContainer: {
    width: "85%",
  },
  fieldLabel: {
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
    height: 58,
    marginBottom: 20,
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
  forgotBtn: {
    alignSelf: "flex-end",
    marginRight: "8%",
    marginBottom: 30,
  },
  forgotText: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "600",
  },
  loginBtn: {
    width: "85%",
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    marginTop: 40,
  },
  noAccountText: {
    color: "#64748b",
    fontSize: 15,
  },
  signupText: {
    color: "#1e3a8a",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default LoginScreen;
