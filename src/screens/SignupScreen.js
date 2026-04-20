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
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";

const SignupScreen = ({ navigation }) => {
  // Sunaye
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [otherName, setOtherName] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");

  // Bayanan Agent
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(false);

  // Aikin daukar hoto
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Mun rage ingancin kadan don kada file din ya yi nauyi sosai
      base64: true, // WANNAN SHINE MUHIMMI: Don Admin ya ga hoton
    });

    if (!result.canceled) {
      // Muna hada rubutun Base64 din da nau'in hoton (data:image/jpeg;base64,...)
      const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImage(base64Img);
    }
  };

  const handleSignup = async () => {
    // 1. Validation na kowa da kowa
    if (
      !firstName ||
      !surname ||
      !email ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      return Alert.alert("Error", "Please fill in all basic fields.");
    }

    // 2. Duba Password
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match!");
    }

    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters.");
    }

    // 3. Validation na Agent
    if (role === "agent") {
      if (!state || !lga || !address) {
        return Alert.alert(
          "Error",
          "Agents must provide State, LGA, and Address.",
        );
      }
      if (!image) {
        return Alert.alert(
          "Error",
          "Please upload an Agent Profile/Office photo.",
        );
      }
    }

    setLoading(true);
    try {
      // Shirya data (Payload)
      const payload = {
        firstName,
        surname,
        otherName,
        email,
        phone,
        password,
        role,
        ...(role === "agent" && { state, lga, address, profileImage: image }),
      };

      const response = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/auth/signup",
        payload,
      );

      if (response.data.success) {
        Alert.alert(
          "Success",
          "Account created successfully! Welcome to Ayax Data Xpress.",
        );
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
        <Text style={styles.subtitle}>
          Join Ayax Data Xpress ecosystem today
        </Text>
      </View>

      <View style={styles.inputContainer}>
        {/* Role Selection */}
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

        {/* Names Section */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 5 }}>
            <Text style={styles.label}>Surname</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.inputText}
                placeholder="Surname"
                onChangeText={setSurname}
              />
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 5 }}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.inputText}
                placeholder="First Name"
                onChangeText={setFirstName}
              />
            </View>
          </View>
        </View>

        <Text style={styles.label}>Other Name (Optional)</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="Other Name"
            onChangeText={setOtherName}
          />
        </View>

        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputView}>
          <TextInput
            style={styles.inputText}
            placeholder="example@mail.com"
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

        {/* Agent Only Fields */}
        {role === "agent" && (
          <View style={styles.agentSection}>
            <Text style={styles.agentInfoTitle}>
              Agent Business Verification
            </Text>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <Text style={styles.imagePickerText}>
                  Click to Upload Profile Photo
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>State</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.inputText}
                placeholder="e.g. Kano"
                onChangeText={setState}
              />
            </View>

            <Text style={styles.label}>LGA</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.inputText}
                placeholder="e.g. Tarauni"
                onChangeText={setLga}
              />
            </View>

            <Text style={styles.label}>Office Address</Text>
            <View style={[styles.inputView, { height: 70 }]}>
              <TextInput
                style={styles.inputText}
                placeholder="Detailed Address"
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

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputView}>
          <TextInput
            secureTextEntry
            style={styles.inputText}
            placeholder="••••••••"
            onChangeText={setConfirmPassword}
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
  headerArea: { alignItems: "center", marginBottom: 25 },
  title: { fontSize: 26, fontWeight: "bold", color: "#1e3a8a" },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 5 },
  inputContainer: { width: "88%" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    marginLeft: 4,
  },
  roleContainer: { flexDirection: "row", marginBottom: 15 },
  roleBtn: {
    flex: 1,
    height: 45,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  activeRole: { backgroundColor: "#1e3a8a" },
  roleBtnText: { color: "#475569", fontWeight: "bold" },
  activeRoleText: { color: "#ffffff" },
  inputView: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    height: 48,
    marginBottom: 10,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputText: { color: "#1e293b", fontSize: 14 },
  agentSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f9ff",
    borderRadius: 15,
    marginBottom: 15,
  },
  agentInfoTitle: {
    color: "#1e3a8a",
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 15,
  },
  imagePicker: {
    width: "100%",
    height: 120,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "hidden",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#1e3a8a",
  },
  imagePickerText: { color: "#1e3a8a", fontSize: 12, fontWeight: "bold" },
  previewImage: { width: "100%", height: "100%" },
  signupBtn: {
    width: "88%",
    backgroundColor: "#1e3a8a",
    borderRadius: 10,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  signupText: { color: "white", fontWeight: "bold", fontSize: 16 },
  footer: { flexDirection: "row", marginTop: 20 },
  footerText: { color: "#64748b" },
  loginLink: { color: "#1e3a8a", fontWeight: "bold" },
});

export default SignupScreen;
