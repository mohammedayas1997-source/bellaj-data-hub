import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, DrawerActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  createSupervisor: `${BASE_URL}/admin/create-supervisor`,
};

const CreateSupervisorScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    phone: "",
    state: "",
    lga: "",
    address: "",
    password: "Password2026",
    pin: "0000",
  });

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("adminToken")) ||
      (await AsyncStorage.getItem("token"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fromSuperAdmin =
    route?.params?.fromSuperAdmin ||
    route?.params?.backScreen === "SuperAdminDashboard";

  const openMenu = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      const parent = navigation.getParent?.();
      if (navigation.openDrawer) return navigation.openDrawer();
      if (parent?.openDrawer) return parent.openDrawer();
      navigation.navigate("Main", { screen: "CreateSupervisor" });
    }
  };

  const goBack = () => {
    if (fromSuperAdmin) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Main", params: { screen: "SuperAdminDashboard" } }],
        })
      );
      return;
    }

    if (route?.params?.backScreen === "AdminDashboard") {
      navigation.navigate("AdminDashboard");
      return;
    }

    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main", { screen: "AdminDashboard" });
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "adminToken",
            "token",
            "userData",
            "userRole",
            "overrideRole",
            "isSuperAdminOverride",
          ]);

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        },
      },
    ]);
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const validateForm = () => {
    if (!form.firstName.trim()) {
      Alert.alert("Required", "Enter supervisor first name.");
      return false;
    }

    if (!form.surname.trim()) {
      Alert.alert("Required", "Enter supervisor surname.");
      return false;
    }

    if (!form.email.trim()) {
      Alert.alert("Required", "Enter supervisor email.");
      return false;
    }

    if (!form.phone.trim()) {
      Alert.alert("Required", "Enter supervisor phone number.");
      return false;
    }

    if (form.password.trim().length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters.");
      return false;
    }

    if (form.pin.trim().length !== 4) {
      Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
      return false;
    }

    return true;
  };

  const handleCreateSupervisor = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Create Supervisor",
      `Create supervisor account for ${form.firstName} ${form.surname}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: async () => {
            try {
              setLoading(true);
              const headers = await getAuthHeaders();

              const payload = {
                firstName: form.firstName.trim(),
                surname: form.surname.trim(),
                otherName: "",
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim(),
                password: form.password.trim(),
                pin: form.pin.trim(),
                role: "supervisor",
                state: form.state.trim(),
                lga: form.lga.trim(),
                address: form.address.trim(),
                walletBalance: 0,
                isSuspended: false,
              };

              const { data } = await axios.post(
                API_ENDPOINTS.createSupervisor,
                payload,
                { headers }
              );

              if (data?.success === false) {
                Alert.alert("Failed", data?.message || "Supervisor was not created.");
                return;
              }

              Alert.alert("Bellaj Data Hub", "Supervisor created successfully.", [
                { text: "OK", onPress: goBack },
              ]);

              setForm({
                firstName: "",
                surname: "",
                email: "",
                phone: "",
                state: "",
                lga: "",
                address: "",
                password: "Password2026",
                pin: "0000",
              });
            } catch (error) {
              const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Unable to create supervisor.";

              Alert.alert("Create Failed", message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Create Supervisor</Text>
          <Text style={styles.headerSubtitle}>Add new Bellaj supervisor account</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="account-supervisor-circle"
              size={35}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Supervisor Account Setup</Text>
            <Text style={styles.heroText}>
              Create a live supervisor login that can manage agents and targets.
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <InputBox
            icon="account-outline"
            label="First Name"
            value={form.firstName}
            onChangeText={(v) => updateField("firstName", v)}
            placeholder="Bellaj"
          />

          <InputBox
            icon="account-outline"
            label="Surname"
            value={form.surname}
            onChangeText={(v) => updateField("surname", v)}
            placeholder="Supervisor"
          />

          <InputBox
            icon="email-outline"
            label="Email"
            value={form.email}
            onChangeText={(v) => updateField("email", v)}
            placeholder="supervisor@bellajdatahub.online"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputBox
            icon="phone-outline"
            label="Phone"
            value={form.phone}
            onChangeText={(v) => updateField("phone", v)}
            placeholder="09000000000"
            keyboardType="phone-pad"
          />

          <Text style={styles.sectionTitle}>Location</Text>

          <InputBox
            icon="map-marker-outline"
            label="State"
            value={form.state}
            onChangeText={(v) => updateField("state", v)}
            placeholder="Kano"
          />

          <InputBox
            icon="map-outline"
            label="LGA"
            value={form.lga}
            onChangeText={(v) => updateField("lga", v)}
            placeholder="Kano Municipal"
          />

          <InputBox
            icon="home-outline"
            label="Address"
            value={form.address}
            onChangeText={(v) => updateField("address", v)}
            placeholder="Bellaj Data Hub"
          />

          <Text style={styles.sectionTitle}>Login Security</Text>

          <InputBox
            icon="lock-outline"
            label="Default Password"
            value={form.password}
            onChangeText={(v) => updateField("password", v)}
            placeholder="Password2026"
          />

          <InputBox
            icon="shield-key-outline"
            label="Default PIN"
            value={form.pin}
            onChangeText={(v) => updateField("pin", v)}
            placeholder="0000"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.createBtn, loading && { opacity: 0.7 }]}
            onPress={handleCreateSupervisor}
            disabled={loading}
            activeOpacity={0.86}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={22}
                  color={COLORS.white}
                />
                <Text style={styles.createBtnText}>CREATE SUPERVISOR</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const InputBox = ({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "words",
  secureTextEntry = false,
  maxLength,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>

    <View style={styles.inputWrapper}>
      <MaterialCommunityIcons name={icon} size={22} color={COLORS.muted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 19, fontWeight: "900" },
  headerSubtitle: {
    color: "#FFE4E4",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 90,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: "#475569",
    fontWeight: "900",
    fontSize: 13,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 53,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },
  input: {
    flex: 1,
    color: COLORS.dark,
    fontWeight: "800",
    paddingVertical: 13,
    paddingHorizontal: 10,
    fontSize: 15,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  createBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.6,
  },
});

export default CreateSupervisorScreen;