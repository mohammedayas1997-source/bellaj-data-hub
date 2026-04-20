import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import axios from "axios";

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // Default shi ne Customer (user)

  // Bayanan wuri don Agent kawai
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // Basic Validation
    if (!name || !email || !phone || !password) {
      return Alert.alert("Error", "Please fill in all basic fields.");
    }

    // Idan Agent ne, dole ya cika address
    if (role === "agent" && (!state || !lga || !address)) {
      return Alert.alert(
        "Error",
        "Agents must provide State, LGA, and Address.",
      );
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        phone,
        password,
        role,
        // Wadannan za su tafi ne kawai idan mutum ya zabi Agent
        ...(role === "agent" && { state, lga, address }),
      };

      const response = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/auth/signup",
        payload,
      );

      if (response.data.success) {
        Alert.alert("Success", "Account created successfully! Please login.");
        navigation.navigate("Login");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Signup failed. Try again.";
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.headerArea}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Ayax Xpress ecosystem today</Text>
      </View>

      <View style={styles.inputContainer}>
        {/* Role Selection Buttons */}
        <Text style={styles.label}>Register As:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleBtn, role === "user" && styles.activeRole]}
            onPress={() => setRole("user")}
          >
            <Text
              style={[
                styles.roleBtnText,
                role === "user" && styles.activeRoleText,
              ]}
            >
              Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === "agent" && styles.activeRole]}
            onPress={() => setRole("agent")}
          >
            <Text
              style={[
                styles.roleBtnText,
                role === "agent" && styles.activeRoleText,
              ]}
            >
              Agent
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="John Doe"
            onChangeText={setName}
          />
        </View>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="john@mail.com"
            keyboardType="email-address"
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="08012345678"
            keyboardType="phone-pad"
            onChangeText={setPhone}
          />
        </View>

        {/* Conditional Fields for Agent Only */}
        {role === "agent" && (
          <View>
            <Text style={styles.agentInfoTitle}>Agent Location Details</Text>

            <Text style={styles.label}>State</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.inputText}
                placeholder="e.g. Adamawa"
                onChangeText={setState}
              />
            </View>

            <Text style={styles.label}>LGA</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.inputText}
                placeholder="e.g. Yola South"
                onChangeText={setLga}
              />
            </View>

            <Text style={styles.label}>Full Office/Home Address</Text>
            <View style={[styles.inputView, { height: 80 }]}>
              <TextInput
                style={styles.inputText}
                placeholder="No 12, Opposite Skyward College..."
                multiline
                onChangeText={setAddress}
              />
            </View>
          </View>
        )}

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputView}>
          <TextInput
            secureTextEntry
            style={styles.inputText}
            placeholder="••••••••"
            onChangeText={setPassword}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.signupBtn}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.signupText}>CREATE ACCOUNT</Text>
        )}
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
    paddingVertical: 40,
  },
  headerArea: { alignItems: "center", marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1e3a8a" },
  subtitle: { color: "#64748b", fontSize: 14, marginTop: 5 },
  inputContainer: { width: "85%" },
  label: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 5,
    marginLeft: 5,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  roleBtn: {
    flex: 1,
    height: 45,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  activeRole: { backgroundColor: "#1e3a8a" },
  roleBtnText: { color: "#475569", fontWeight: "bold" },
  activeRoleText: { color: "#ffffff" },
  inputView: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    height: 50,
    marginBottom: 12,
    justifyContent: "center",
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  inputText: { color: "#1e293b", fontSize: 15 },
  agentInfoTitle: {
    color: "#1e3a8a",
    fontWeight: "bold",
    marginVertical: 10,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 5,
  },
  signupBtn: {
    width: "85%",
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: { color: "white", fontWeight: "bold", fontSize: 16 },
  footer: { flexDirection: "row", marginTop: 25 },
  footerText: { color: "#64748b" },
  loginLink: { color: "#1e3a8a", fontWeight: "bold" },
});

export default SignupScreen;
