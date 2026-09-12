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
  Modal,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
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
};

const SignupScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    otherName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "user",
    state: "",
    lga: "",
    address: "",
    supervisorCode: "",
  });

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success Screen State
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const REGISTER_URL = `${BASE_URL}/auth/register`;

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const showAlert = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation.navigate("Login");
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showAlert("Permission Denied", "Image upload permission is required.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.25,
        base64: true,
      });

      if (!result.canceled) {
        const asset = result.assets?.[0];
        setImage(asset?.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset?.uri);
      }
    } catch {
      showAlert("Upload Failed", "Unable to select image.");
    }
  };

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanPhone = form.phone.replace(/\D/g, "");

    if (
      !form.firstName.trim() ||
      !form.surname.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password
    ) {
      showAlert("Missing Fields", "Please fill all compulsory fields.");
      return false;
    }

    if (!emailRegex.test(form.email.trim())) {
      showAlert("Invalid Email", "Please enter a valid email address.");
      return false;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      showAlert("Invalid Phone", "Please enter a valid phone number.");
      return false;
    }

    if (form.password.length < 6) {
      showAlert("Password Too Short", "Password must be at least 6 characters.");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      showAlert("Password Mismatch", "The two passwords do not match.");
      return false;
    }

    if (
      form.role === "agent" &&
      (!form.state.trim() || !form.lga.trim() || !form.address.trim())
    ) {
      showAlert(
        "Agent Details Required",
        "For agent account, State, LGA and Business Address are required."
      );
      return false;
    }

    return true;
  };

  const handleProceedAfterSuccess = () => {
    setSuccessModalVisible(false);
    
    // Tabbatar an koma Login ko Dashboard lafiya
    try {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    } catch {
      navigation.navigate("Login");
    }
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;

    setLoading(true);

    try {
      const cleanRole = form.role.trim().toLowerCase();
      const fullName = `${form.surname.trim()} ${form.firstName.trim()} ${form.otherName.trim()}`
        .replace(/\s+/g, " ")
        .trim();

      const payload = {
        surname: form.surname.trim(),
        firstName: form.firstName.trim(),
        otherName: form.otherName.trim(),
        name: `${form.firstName.trim()} ${form.surname.trim()}`.trim(),
        fullName,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        phoneNumber: form.phone.trim(),
        password: form.password,
        role: cleanRole,
      };

      if (cleanRole === "agent") {
        payload.state = form.state.trim();
        payload.lga = form.lga.trim();
        payload.address = form.address.trim();
        payload.businessAddress = form.address.trim();

        const code = form.supervisorCode.trim().toUpperCase();
        if (code) {
          payload.referralCode = code;
          payload.supervisorCode = code;
          payload.supervisorReferralCode = code;
          if (/^[0-9a-fA-F]{24}$/.test(code)) {
            payload.supervisorId = code;
          }
        }

        if (image) {
          payload.businessImage = image;
          payload.profileImage = image;
        }
      }

      const response = await axios.post(REGISTER_URL, payload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 30000,
      });

      const data = response?.data || {};

      if (data?.success === false) {
        showAlert("Registration Failed", data?.message || "Could not create account.");
        return;
      }

      const user =
        data?.user ||
        data?.data?.user ||
        data?.data ||
        {
          ...payload,
          password: undefined,
        };

      const token = data?.token || data?.data?.token;

      await AsyncStorage.setItem("userData", JSON.stringify(user));
      await AsyncStorage.setItem("userRole", user?.role || cleanRole);

      if (token) {
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("token", token);
      }

      // Adana bayanan mai rijista sannan nuna Success Screen
      setRegisteredUser(user);
      setSuccessModalVisible(true);
    } catch (error) {
      console.log("Signup Error:", error?.response?.data || error.message);
      showAlert(
        "Registration Failed",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Registration failed. Please check your network and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      <KeyboardAvoidingView
        style={styles.mainWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
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
                style={[styles.roleBtn, form.role === "user" && styles.activeRole]}
                onPress={() => updateField("role", "user")}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={form.role === "user" ? COLORS.white : COLORS.muted}
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    form.role === "user" && styles.activeRoleText,
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleBtn, form.role === "agent" && styles.activeRole]}
                onPress={() => updateField("role", "agent")}
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={form.role === "agent" ? COLORS.white : COLORS.muted}
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    form.role === "agent" && styles.activeRoleText,
                  ]}
                >
                  Agent
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInputLeft}>
                <Text style={styles.label}>Surname</Text>
                <Input
                  placeholder="Compulsory"
                  value={form.surname}
                  onChangeText={(v) => updateField("surname", v)}
                />
              </View>

              <View style={styles.halfInputRight}>
                <Text style={styles.label}>First Name</Text>
                <Input
                  placeholder="Compulsory"
                  value={form.firstName}
                  onChangeText={(v) => updateField("firstName", v)}
                />
              </View>
            </View>

            <Text style={styles.label}>Middle Name Optional</Text>
            <Input
              placeholder="Enter Middle Name"
              value={form.otherName}
              onChangeText={(v) => updateField("otherName", v)}
            />

            <Text style={styles.label}>Email Address</Text>
            <Input
              placeholder="example@gmail.com"
              value={form.email}
              onChangeText={(v) => updateField("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Active Phone Number</Text>
            <Input
              placeholder="080XXXXXXXX"
              value={form.phone}
              onChangeText={(v) => updateField("phone", v)}
              keyboardType="phone-pad"
            />

            {form.role === "agent" && (
              <View style={styles.agentSection}>
                <Text style={styles.agentInfoTitle}>Agent Business Details</Text>

                <Text style={styles.label}>Supervisor Referral Code Optional</Text>
                <Input
                  placeholder="e.g. BD770"
                  value={form.supervisorCode}
                  onChangeText={(v) => updateField("supervisorCode", v)}
                  autoCapitalize="characters"
                />

                <Text style={styles.label}>Shop / Office Address</Text>
                <Input
                  placeholder="Enter full business address"
                  value={form.address}
                  onChangeText={(v) => updateField("address", v)}
                />

                <View style={styles.row}>
                  <View style={styles.halfInputLeft}>
                    <Text style={styles.label}>State</Text>
                    <Input
                      placeholder="e.g. Kano"
                      value={form.state}
                      onChangeText={(v) => updateField("state", v)}
                    />
                  </View>

                  <View style={styles.halfInputRight}>
                    <Text style={styles.label}>LGA</Text>
                    <Input
                      placeholder="Local Govt"
                      value={form.lga}
                      onChangeText={(v) => updateField("lga", v)}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
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
                        Upload Utility Bill or Shop Image Optional
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.label}>Create Password</Text>
            <PasswordInput
              value={form.password}
              onChangeText={(v) => updateField("password", v)}
              show={showPassword}
              setShow={setShowPassword}
              placeholder="Minimum of 6 characters"
            />

            <Text style={styles.label}>Confirm Password</Text>
            <PasswordInput
              value={form.confirmPassword}
              onChangeText={(v) => updateField("confirmPassword", v)}
              show={showConfirmPassword}
              setShow={setShowConfirmPassword}
              placeholder="Repeat your password"
            />

            <TouchableOpacity
              style={[styles.signupBtn, loading && { opacity: 0.75 }]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="person-add-outline"
                    size={20}
                    color={COLORS.white}
                  />
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

      {/* FULL LIVE SUCCESS SCREEN MODAL */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleProceedAfterSuccess}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.successCard, isWeb && { maxWidth: 440 }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={58} color={COLORS.secondary} />
            </View>

            <Text style={styles.successHeading}>Registration Successful!</Text>
            
            <Text style={styles.successSubtext}>
              Welcome to Bellaj Data Hub,{" "}
              <Text style={{ fontWeight: "900", color: COLORS.dark }}>
                {registeredUser?.firstName || form.firstName}
              </Text>
              ! Your {form.role === "agent" ? "Agent" : "Customer"} account has been setup and activated live.
            </Text>

            <View style={styles.accountDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Registered Email:</Text>
                <Text style={styles.detailVal}>{registeredUser?.email || form.email}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Phone Number:</Text>
                <Text style={styles.detailVal}>{registeredUser?.phone || form.phone}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Account Status:</Text>
                <Text style={[styles.detailVal, { color: COLORS.secondary, fontWeight: "900" }]}>
                  ACTIVE
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.proceedBtn}
              onPress={handleProceedAfterSuccess}
              activeOpacity={0.88}
            >
              <Text style={styles.proceedBtnText}>LOGIN TO DASHBOARD</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Input = ({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  autoCorrect = true,
}) => (
  <View style={styles.inputView}>
    <TextInput
      style={styles.inputText}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#94A3B8"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
    />
  </View>
);

const PasswordInput = ({ value, onChangeText, show, setShow, placeholder }) => (
  <View style={styles.passwordWrapper}>
    <TextInput
      secureTextEntry={!show}
      style={styles.passwordInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#94A3B8"
    />

    <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeIcon}>
      <Ionicons
        name={show ? "eye-off-outline" : "eye-outline"}
        size={20}
        color={COLORS.muted}
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.light },
  mainWrapper: { flex: 1, backgroundColor: COLORS.light },
  scrollView: { flex: 1, backgroundColor: COLORS.light },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 35 : 20,
    paddingBottom: 60,
    width: "100%",
    backgroundColor: COLORS.light,
  },
  webScrollContent: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 80,
  },
  card: {
    width: "100%",
    maxWidth: 560,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  successCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.softGreen,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtext: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  accountDetailsBox: {
    width: "100%",
    backgroundColor: COLORS.light,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailKey: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  detailVal: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: "800",
  },
  proceedBtn: {
    width: "100%",
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  proceedBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

export default SignupScreen;