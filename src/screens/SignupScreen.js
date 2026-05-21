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
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  // Tsarin nuna sanarwa na musamman don dacewa da kowace na'ura (Waya da PC)
  const showAlert = (title, message, buttons = []) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
      if (buttons.length > 0 && buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else {
      Alert.alert(title, message, buttons.length > 0 ? buttons : undefined, {
        cancelable: false,
      });
    }
  };

  const pickImage = async () => {
    // Neman izini ga masu amfani da wayoyin hannu
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to make this work!",
        );
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      let base64Img = asset.base64;

      // Gyara na musamman don tabbatar da Base64 yana aiki a PC browser idan babu flag
      if (!base64Img && asset.uri.startsWith("data:")) {
        setImage(asset.uri);
      } else if (base64Img) {
        setImage(`data:image/jpeg;base64,${base64Img}`);
      } else {
        setImage(asset.uri);
      }
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
      showAlert(
        "Missing Fields",
        "Please fill all the compulsory fields before proceeding.",
      );
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      showAlert(
        "Invalid Email",
        "The email address enter format is wrong. Check it well.",
      );
      return false;
    }
    if (!phoneRegex.test(phone.trim())) {
      showAlert(
        "Invalid Phone Number",
        "Please enter a valid Nigerian phone number.",
      );
      return false;
    }
    if (password.length < 6) {
      showAlert(
        "Password Too Short",
        "Your password must be at least 6 characters long.",
      );
      return false;
    }
    if (password !== confirmPassword) {
      showAlert(
        "Password Mismatch",
        "The two passwords do not match. Please re-enter.",
      );
      return false;
    }
    if (role === "agent" && (!state.trim() || !lga.trim() || !address.trim())) {
      showAlert(
        "Agent Verification Missing",
        "As an Agent, your State, LGA, and Business Address are compulsory.",
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
        role: role.trim().toLowerCase(),
      };

      if (role === "agent") {
        registrationData.state = state.trim();
        registrationData.lga = lga.trim();
        registrationData.address = address.trim();
        if (supervisorId)
          registrationData.supervisorId = supervisorId.toUpperCase().trim();
        if (image) registrationData.businessImage = image;
      }

      const response = await axios({
        method: "POST",
        url: "https://ayax-data-xpress-server.onrender.com/api/v1/auth/register",
        data: registrationData,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 200000,
      });

      const isSuccess =
        response.status === 201 ||
        response.status === 200 ||
        response.data?.success === true ||
        response.data?.status === "success";

      if (isSuccess) {
        const userPayload = response.data.user ||
          response.data.data?.user ||
          response.data.data || { role: role.trim().toLowerCase() };

        await AsyncStorage.setItem("userData", JSON.stringify(userPayload));
        if (response.data.token) {
          await AsyncStorage.setItem("userToken", response.data.token);
        }

        setLoading(false);

        showAlert(
          "Account Created 🎉",
          "Your registration has been completed successfully! Click OK to proceed.",
          [
            {
              text: "OK",
              onPress: () => navigation.replace("Success"),
            },
          ],
        );
      } else {
        setLoading(false);
        showAlert(
          "Registration Alert",
          response.data?.message ||
            "Unexpected response from server. Please check.",
        );
      }
    } catch (error) {
      setLoading(false);
      const serverMsg =
        error.response?.data?.message ||
        "Network connection issue. Please try again.";

      if (error.code === "ECONNABORTED") {
        showAlert(
          "Network Timeout",
          "Connection took too long to respond. Check your internet connection.",
        );
      } else {
        showAlert("Registration Failed ❌", serverMsg);
      }

      console.error(
        "Registration Log Error:",
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Ayax Data Xpress to start enjoying affordable VTU and Data
            services.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Account Type</Text>
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
                Customer / User
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
                Sub-Agent / Reseller
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 5 }}>
              <Text style={styles.label}>Surname (Last Name)</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Compulsory"
                  value={surname}
                  onChangeText={setSurname}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 5 }}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Compulsory"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>Middle Name (Optional)</Text>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputText}
              placeholder="Enter Middle Name"
              value={otherName}
              onChangeText={setOtherName}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputText}
              placeholder="example@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.label}>Active Phone Number</Text>
          <View style={styles.inputView}>
            <TextInput
              style={styles.inputText}
              placeholder="080XXXXXXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {role === "agent" && (
            <View style={styles.agentSection}>
              <Text style={styles.agentInfoTitle}>
                Business Verification Details
              </Text>

              <Text style={styles.label}>
                Supervisor Referral Code (Optional)
              </Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="e.g. AX770"
                  autoCapitalize="characters"
                  value={supervisorId}
                  onChangeText={setSupervisorId}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <Text style={styles.label}>Shop / Office Address</Text>
              <View style={styles.inputView}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter full business address"
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 5 }}>
                  <Text style={styles.label}>State</Text>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.inputText}
                      placeholder="e.g. Kano"
                      value={state}
                      onChangeText={setState}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <Text style={styles.label}>LGA</Text>
                  <View style={styles.inputView}>
                    <TextInput
                      style={styles.inputText}
                      placeholder="Local Govt"
                      value={lga}
                      onChangeText={setLga}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <Text style={styles.imagePickerText}>
                    Upload Utility Bill or Shop Image
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>Create Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
              placeholder="Minimum of 6 characters"
              value={password}
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

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              secureTextEntry={!showConfirmPassword}
              style={styles.passwordInput}
              placeholder="Repeat your password"
              value={confirmPassword}
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
            <Text style={styles.signupText}>REGISTER ACCOUNT</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Login Here</Text>
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
  headerArea: { alignItems: "center", marginBottom: 30, width: "90%" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
    width: "95%",
    lineHeight: 18,
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
    cursor: Platform.OS === "web" ? "pointer" : "auto", // Gyara don PC Web pointers
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
  eyeIcon: { padding: 5, cursor: Platform.OS === "web" ? "pointer" : "auto" },
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
    marginTop: 10,
    cursor: Platform.OS === "web" ? "pointer" : "auto",
  },
  imagePickerText: { color: "#64748b", fontSize: 12, fontWeight: "600" },
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
    cursor: Platform.OS === "web" ? "pointer" : "auto",
  },
  signupText: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1.5,
  },
  footer: { flexDirection: "row", marginTop: 25, marginBottom: 20 },
  footerText: { color: "#64748b", fontSize: 14 },
  loginLink: { color: "#1e3a8a", fontWeight: "800", fontSize: 14 },
});

export default SignupScreen;
