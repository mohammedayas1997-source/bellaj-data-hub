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
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  register: `${BASE_URL}/auth/register`,
};

const SignupScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

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
  const REGISTER_URL = `${BASE_URL}/auth/register`;
  const showAlert = (title, message, buttons = []) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
      if (buttons.length > 0 && buttons[0].onPress) buttons[0].onPress();
    } else {
      Alert.alert(title, message, buttons.length > 0 ? buttons : undefined, {
        cancelable: false,
      });
    }
  };

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "Sorry, we need camera roll permissions to upload an image."
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
    }
  };

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    if (!firstName.trim() || !surname.trim() || !email.trim() || !phone.trim() || !password) {
      showAlert("Missing Fields", "Please fill all compulsory fields.");
      return false;
    }

    if (!emailRegex.test(email.trim())) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return false;
    }

    if (!phoneRegex.test(phone.trim())) {
      showAlert("Invalid Phone Number", "Please enter a valid phone number.");
      return false;
    }

    if (password.length < 6) {
      showAlert("Password Too Short", "Password must be at least 6 characters.");
      return false;
    }

    if (password !== confirmPassword) {
      showAlert("Password Mismatch", "The two passwords do not match.");
      return false;
    }

    if (role === "agent" && (!state.trim() || !lga.trim() || !address.trim())) {
      showAlert(
        "Agent Verification Missing",
        "As an Agent, your State, LGA, and Business Address are compulsory."
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
        // An sabunta URL ɗin zuwa na Bellaj
        url: "https://bellaj-data-server1.vercel.app/api/v1/auth/register",
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.mainWrapper}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent,
          ]}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

          <View style={[styles.card, isWeb && styles.webCard]}>
            <View style={styles.headerArea}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join Bellaj Data Hub to enjoy affordable data, airtime, bills
                and digital services.
              </Text>
            </View>

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
              <View style={styles.halfInputLeft}>
                <Text style={styles.label}>Surname</Text>
                <View style={styles.inputView}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Compulsory"
                    value={surname}
                    onChangeText={setSurname}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={styles.halfInputRight}>
                <Text style={styles.label}>First Name</Text>
                <View style={styles.inputView}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Compulsory"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.label}>Middle Name Optional</Text>
            <View style={styles.inputView}>
              <TextInput
                style={styles.inputText}
                placeholder="Enter Middle Name"
                value={otherName}
                onChangeText={setOtherName}
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
              />
            </View>

            {role === "agent" && (
              <View style={styles.agentSection}>
                <Text style={styles.agentInfoTitle}>
                  Business Verification Details
                </Text>

                <Text style={styles.label}>Supervisor Referral Code Optional</Text>
                <View style={styles.inputView}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="e.g. BD770"
                    autoCapitalize="characters"
                    value={supervisorId}
                    onChangeText={setSupervisorId}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <Text style={styles.label}>Shop / Office Address</Text>
                <View style={styles.inputView}>
                  <TextInput
                    style={styles.inputText}
                    placeholder="Enter full business address"
                    value={address}
                    onChangeText={setAddress}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.row}>
                  <View style={styles.halfInputLeft}>
                    <Text style={styles.label}>State</Text>
                    <View style={styles.inputView}>
                      <TextInput
                        style={styles.inputText}
                        placeholder="e.g. Kano"
                        value={state}
                        onChangeText={setState}
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View style={styles.halfInputRight}>
                    <Text style={styles.label}>LGA</Text>
                    <View style={styles.inputView}>
                      <TextInput
                        style={styles.inputText}
                        placeholder="Local Govt"
                        value={lga}
                        onChangeText={setLga}
                        placeholderTextColor="#94A3B8"
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
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.muted}
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
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.muted}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signupBtn, loading && { opacity: 0.75 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  mainWrapper: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 35 : 20,
    paddingBottom: 80,
    backgroundColor: COLORS.light,
  },
  webScrollContent: {
    alignItems: "center",
    paddingTop: 35,
    paddingBottom: 90,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webCard: {
    padding: 30,
    elevation: 8,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 25,
    width: "100%",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.primary,
  },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    width: "100%",
    lineHeight: 18,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    width: "100%",
  },
  halfInputLeft: {
    flex: 1,
    marginRight: 5,
  },
  halfInputRight: {
    flex: 1,
    marginLeft: 5,
  },
  label: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    marginLeft: 2,
    textTransform: "uppercase",
  },
  roleContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
    width: "100%",
  },
  roleBtn: {
    flex: 1,
    minHeight: 45,
    backgroundColor: COLORS.light,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
  },
  activeRole: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleBtnText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
  },
  activeRoleText: {
    color: COLORS.white,
  },
  inputView: {
    width: "100%",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    minHeight: 50,
    marginBottom: 14,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputText: {
    color: COLORS.dark,
    fontSize: 14,
    width: "100%",
    minHeight: 50,
    outlineStyle: "none",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    minHeight: 50,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 14,
    minHeight: 50,
    outlineStyle: "none",
  },
  eyeIcon: {
    padding: 5,
  },
  agentSection: {
    marginTop: 5,
    padding: 12,
    backgroundColor: COLORS.softGreen,
    borderRadius: 14,
    marginBottom: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  agentInfoTitle: {
    color: COLORS.secondary,
    fontWeight: "900",
    marginBottom: 10,
    fontSize: 12,
    textTransform: "uppercase",
  },
  imagePicker: {
    width: "100%",
    minHeight: 120,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: 8,
    overflow: "hidden",
  },
  imagePickerText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  previewImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
  },
  signupBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    elevation: 4,
  },
  signupText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1.2,
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 10,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  loginLink: {
    color: COLORS.secondary,
    fontWeight: "900",
    fontSize: 13,
  },
});

export default SignupScreen;