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
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const SignupScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [otherName, setOtherName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [address, setAddress] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled) {
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(base64Img);
    }
  };

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    if (
      !firstName.trim() ||
      !surname.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password
    ) {
      Alert.alert(
        "Input Validation Failed",
        "Mandatory data clusters are empty. Populate all required fields.",
      );
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        "Protocol Error",
        "Email address syntax does not conform to standard SMTP routing.",
      );
      return false;
    }
    if (!phoneRegex.test(phone.trim())) {
      Alert.alert(
        "Syntax Error",
        "Phone sequence is mathematically invalid for telecommunication routing.",
      );
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        "Security Mismatch",
        "Cryptographic keys do not align. Verify password parameters.",
      );
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;
    setLoading(true);

    try {
      const registrationData = {
        firstName: firstName.trim(),
        surname: surname.trim(),
        otherName: otherName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password: password,
        role: role || "user",
      };

      if (role === "agent") {
        registrationData.state = state;
        registrationData.lga = lga;
        registrationData.address = address;
        if (supervisorId)
          registrationData.supervisorId = supervisorId.toUpperCase();
        if (image) registrationData.businessImage = image;
      }

      // Execute Network Request
      const response = await axios({
        method: "POST",
        url: "https://ayax-data-xpress-server.onrender.com/api/v1/auth/register",
        data: registrationData,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 60000,
      });

      // Verification of account deployment status
      if (
        response.status === 201 ||
        response.status === 200 ||
        response.data.success
      ) {
        setLoading(false);

        /** * Transitioning from Alert to Success Screen:
         * This removes the manual "OK" button click and moves the user
         * straight to the Success UI for a professional experience.
         */
        navigation.replace("Success");
      }
    } catch (error) {
      setLoading(false);
      const serverMsg =
        error.response?.data?.message ||
        "Terminal rejected deployment parameters.";

      if (error.code === "ECONNABORTED") {
        Alert.alert(
          "Link Timeout",
          "Latency threshold exceeded. Server initialization failed.",
        );
      } else {
        Alert.alert("Registration Refused ❌", serverMsg);
      }

      console.error(
        "Critical Failure Log:",
        error.response?.data || error.message,
      );
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        <View style={styles.headerArea}>
          <Text style={styles.title}>System Registration</Text>
          <Text style={styles.subtitle}>
            Institutional Grade Connectivity for Ayax Data Xpress Architecture
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Access Hierarchy</Text>
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
                Retail User
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
                Operational Agent
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 5 }}>
              <Text style={styles.label}>Legal Surname</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Required"
                  onChangeText={setSurname}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
              <Text style={styles.label}>Given Name</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Required"
                  onChangeText={setFirstName}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Communication Email</Text>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputText}
              placeholder="corporate@protocol.com"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.label}>Telecommunication String</Text>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputText}
              placeholder="080XXXXXXXX"
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {role === "agent" && (
            <View style={styles.agentSection}>
              <Text style={styles.agentInfoTitle}>
                Business Verification Module
              </Text>
              <Text style={styles.label}>Supervisor Referral Code</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Example: AX770"
                  autoCapitalize="characters"
                  onChangeText={setSupervisorId}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imagePickerText}>
                    Upload Business Credentials
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Geographic State</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Primary State"
                  onChangeText={setState}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          )}

          <Text style={styles.label}>Cryptographic Key</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              placeholder="Min. 6 Alpha-Numerics"
              onChangeText={setPassword}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Verify Key Integrity</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              secureTextEntry={!showConfirmPassword}
              style={styles.passwordInput}
              placeholder="Confirm Parameters"
              onChangeText={setConfirmPassword}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
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
            <Text style={styles.signupText}>INITIATE DEPLOYMENT</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Authorized user? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Secure Login Portal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    paddingVertical: 40,
    paddingBottom: 60,
  },
  headerArea: { alignItems: "center", marginBottom: 30 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
    width: "85%",
  },
  inputContainer: { width: "90%" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: {
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
    marginLeft: 2,
    textTransform: "uppercase",
  },
  roleContainer: { flexDirection: "row", marginBottom: 20, gap: 10 },
  roleBtn: {
    flex: 1,
    height: 48,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  activeRole: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  roleBtnText: { color: "#64748b", fontWeight: "700", fontSize: 13 },
  activeRoleText: { color: "#ffffff" },
  inputView: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    height: 52,
    marginBottom: 16,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 16,
  },
  passwordInput: { flex: 1, color: "#0f172a", fontSize: 15 },
  eyeIcon: { padding: 5 },
  inputText: { color: "#0f172a", fontSize: 15 },
  agentSection: {
    marginTop: 10,
    padding: 15,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    marginBottom: 20,
  },
  agentInfoTitle: {
    color: "#1e3a8a",
    fontWeight: "800",
    marginBottom: 12,
    fontSize: 13,
    textTransform: "uppercase",
  },
  imagePicker: {
    width: "100%",
    height: 140,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#cbd5e1",
  },
  imagePickerText: { color: "#64748b", fontSize: 11, fontWeight: "600" },
  previewImage: { width: "100%", height: "100%", borderRadius: 10 },
  signupBtn: {
    width: "90%",
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    elevation: 8,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  signupText: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1.5,
  },
  footer: { flexDirection: "row", marginTop: 25 },
  footerText: { color: "#64748b", fontSize: 14 },
  loginLink: { color: "#1e3a8a", fontWeight: "800", fontSize: 14 },
});

export default SignupScreen;
