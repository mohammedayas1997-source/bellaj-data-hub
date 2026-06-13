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
  danger: "#E60000",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#EAF7F1",
  softRed: "#FFF1F1",
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
      if (buttons.length > 0 && buttons[0]?.onPress) buttons[0].onPress();
      return;
    }

    Alert.alert(title, message, buttons.length > 0 ? buttons : undefined, {
      cancelable: false,
    });
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Login");
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
          showAlert(
            "Permission Denied",
            "Camera roll permission is required to upload business verification image."
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.35,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setImage(
          asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri
        );
      }
    } catch {
      showAlert("Upload Failed", "Unable to select image. Please try again.");
    }
  };

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanPhone = phone.replace(/\D/g, "");

    if (
      !firstName.trim() ||
      !surname.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password
    ) {
      showAlert("Missing Fields", "Please fill all compulsory fields.");
      return false;
    }

    if (!emailRegex.test(email.trim())) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return false;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
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
        "As an agent, State, LGA and Business Address are compulsory."
      );
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFirstName("");
    setSurname("");
    setOtherName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setRole("user");
    setState("");
    setLga("");
    setAddress("");
    setSupervisorId("");
    setImage(null);
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;

    setLoading(true);

    try {
      const registrationData = {
        firstName: firstName.trim(),
        surname: surname.trim(),
        otherName: otherName.trim(),
        name: `${firstName.trim()} ${surname.trim()}`.trim(),
        fullName: `${surname.trim()} ${firstName.trim()} ${otherName.trim()}`
          .replace(/\s+/g, " ")
          .trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        password,
        role: role.trim().toLowerCase(),
      };

      if (role === "agent") {
        registrationData.state = state.trim();
        registrationData.lga = lga.trim();
        registrationData.address = address.trim();

        if (supervisorId.trim()) {
          registrationData.supervisorId = supervisorId.toUpperCase().trim();
          registrationData.referralCode = supervisorId.toUpperCase().trim();
        }

        if (image) {
          registrationData.businessImage = image;
          registrationData.profileImage = image;
        }
      }

      const response = await axios.post(REGISTER_URL, registrationData, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });

      const payload = response?.data || {};
      const userPayload =
        payload?.user || payload?.data?.user || payload?.data || {
          ...registrationData,
          password: undefined,
        };

      const token = payload?.token || payload?.data?.token;

      await AsyncStorage.setItem("userData", JSON.stringify(userPayload));
      await AsyncStorage.setItem("userRole", userPayload?.role || role);

      if (token) {
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("token", token);
      }

      resetForm();

      showAlert("Success", "Account created successfully!", [
        {
          text: "Continue",
          onPress: () => navigation.replace("Success"),
        },
      ]);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Registration failed. Please check your connection and try again.";

      console.log("Signup Error:", error?.response?.data || error.message);
      showAlert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.mainWrapper}
      >
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent,
          ]}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isWeb && styles.webCard]}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                <Ionicons name="arrow-back" size={24} color={COLORS.dark} />
              </TouchableOpacity>

              <View style={styles.logoBadge}>
                <Text style={styles.logoText}>BDH</Text>
              </View>
            </View>

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
                activeOpacity={0.86}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={role === "user" ? COLORS.white : COLORS.muted}
                />
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
                activeOpacity={0.86}
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={role === "agent" ? COLORS.white : COLORS.muted}
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    role === "agent" && styles.activeRoleText,
                  ]}
                >
                  Agent / Reseller
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
                autoCorrect={false}
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

                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={pickImage}
                  activeOpacity={0.86}
                >
                  {image ? (
                    <Image source={{ uri: image }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.uploadBox}>
                      <Ionicons
                        name="cloud-upload-outline"
                        size={30}
                        color={COLORS.primary}
                      />
                      <Text style={styles.imagePickerText}>
                        Upload Utility Bill or Shop Image
                      </Text>
                    </View>
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
              activeOpacity={0.86}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color={COLORS.white} />
                  <Text style={styles.signupText}>REGISTER ACCOUNT</Text>
                </>
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
  safeArea: { flex: 1, backgroundColor: COLORS.light },
  mainWrapper: { flex: 1, backgroundColor: COLORS.light },
  scrollView: { flex: 1, backgroundColor: COLORS.light },
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
    maxWidth: 540,
    alignSelf: "center",
    backgroundColor: COLORS.white,
    borderRadius: 24,
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.light,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoBadge: {
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  logoText: {
    color: COLORS.primary,
    fontWeight: "900",
    letterSpacing: 1,
  },
  headerArea: {
    alignItems: "center",
    marginBottom: 25,
    width: "100%",
  },
  title: {
    fontSize: 27,
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
    fontWeight: "900",
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
    minHeight: 48,
    backgroundColor: COLORS.light,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    flexDirection: "row",
    gap: 6,
  },
  activeRole: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleBtnText: {
    color: COLORS.muted,
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },
  activeRoleText: {
    color: COLORS.white,
  },
  inputView: {
    width: "100%",
    backgroundColor: COLORS.light,
    borderRadius: 13,
    minHeight: 52,
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
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: COLORS.light,
    borderRadius: 13,
    minHeight: 52,
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
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  eyeIcon: {
    padding: 5,
  },
  agentSection: {
    marginTop: 5,
    padding: 13,
    backgroundColor: COLORS.softGreen,
    borderRadius: 16,
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
    minHeight: 122,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: 8,
    overflow: "hidden",
  },
  uploadBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  imagePickerText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },
  previewImage: {
    width: "100%",
    height: 122,
    borderRadius: 12,
  },
  signupBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    elevation: 4,
    flexDirection: "row",
    gap: 8,
  },
  signupText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
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