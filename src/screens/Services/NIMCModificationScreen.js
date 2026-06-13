// src/screens/Services/NIMCModificationScreen.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../../config/api";

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
  nimcPrices: `${BASE_URL}/nimc/prices`,
  requestModification: `${BASE_URL}/nimc/modification`,
};

const modificationOptions = [
  { id: "name", label: "Name", icon: "person-outline" },
  { id: "phone", label: "Phone", icon: "call-outline" },
  { id: "dob", label: "DOB", icon: "calendar-outline" },
  { id: "address", label: "Address", icon: "location-outline" },
  { id: "name_dob", label: "Name & DOB", icon: "id-card-outline" },
  { id: "name_phone", label: "Name & Phone", icon: "person-add-outline" },
];

const NIMCModificationScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [selectedType, setSelectedType] = useState("name");
  const [formData, setFormData] = useState({ ninNumber: "" });
  const [pin, setPin] = useState("");

  useEffect(() => {
    fetchPrices();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const fetchPrices = async () => {
    try {
      const headers = await getAuthHeaders();

      if (!headers) return;

      const { data } = await axios.get(API_ENDPOINTS.nimcPrices, {
        headers,
        timeout: 20000,
      });

      setPrices(data?.prices || data?.data?.prices || data?.data || {});
    } catch {
      setPrices({
        name: 0,
        phone: 0,
        dob: 0,
        address: 0,
        name_dob: 0,
        name_phone: 0,
      });
    } finally {
      setPriceLoading(false);
    }
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation?.navigate?.("Main");
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
            "token",
            "adminToken",
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

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const cleanNumber = (value) => value.replace(/[^0-9]/g, "");

  const validateForm = () => {
    if (!formData.ninNumber || formData.ninNumber.length !== 11) {
      Alert.alert("Invalid NIN", "Please enter a valid 11-digit NIN.");
      return false;
    }

    if (!pin || pin.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter your 4-digit transaction PIN.");
      return false;
    }

    if (selectedType === "name") {
      if (!formData.firstName || !formData.lastName) {
        Alert.alert("Required", "Please enter first name and last name.");
        return false;
      }
    }

    if (selectedType === "phone" && !formData.newPhone) {
      Alert.alert("Required", "Please enter new phone number.");
      return false;
    }

    if (selectedType === "dob" && !formData.newDob) {
      Alert.alert("Required", "Please enter new date of birth.");
      return false;
    }

    if (selectedType === "address") {
      if (!formData.addressLine1 || !formData.townCity || !formData.state) {
        Alert.alert("Required", "Please complete the address fields.");
        return false;
      }
    }

    if (selectedType === "name_dob") {
      if (!formData.newFirstName || !formData.newLastName || !formData.newDob) {
        Alert.alert("Required", "Please complete name and DOB fields.");
        return false;
      }
    }

    if (selectedType === "name_phone") {
      if (
        !formData.newFirstName ||
        !formData.newLastName ||
        !formData.newPhoneNumber
      ) {
        Alert.alert("Required", "Please complete name and phone fields.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Confirm Request",
      `Submit ${selectedType.replace(/_/g, " ").toUpperCase()} modification request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            try {
              setLoading(true);

              const headers = await getAuthHeaders();

              if (!headers) {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Login" }],
                  })
                );
                return;
              }

              const { data } = await axios.post(
                API_ENDPOINTS.requestModification,
                {
                  serviceType: selectedType,
                  type: selectedType,
                  formData,
                  ninNumber: formData.ninNumber,
                  pin,
                  amount: Number(prices[selectedType] || 0),
                },
                {
                  headers,
                  timeout: 30000,
                }
              );

              if (data?.success === false) {
                Alert.alert("Failed", data?.message || "Request failed.");
                return;
              }

              Alert.alert(
                "Bellaj Data Hub",
                data?.message || "Modification request submitted successfully.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
              );

              setFormData({ ninNumber: "" });
              setPin("");
            } catch (err) {
              Alert.alert(
                "Error",
                err?.response?.data?.message || "Something went wrong."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const currentPrice = Number(prices[selectedType] || 0);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={23} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
            <Ionicons name="menu" size={25} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>NIMC Modification</Text>
            <Text style={styles.headerSubtitle}>Bellaj identity services</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}
          >
            {modificationOptions.map((item) => {
              const active = selectedType === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.tabItem, active && styles.activeTabItem]}
                  onPress={() => {
                    setSelectedType(item.id);
                    setFormData({ ninNumber: formData.ninNumber || "" });
                  }}
                  activeOpacity={0.86}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active ? COLORS.white : COLORS.primary}
                  />

                  <Text style={[styles.tabText, active && styles.activeTabText]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="fingerprint"
                size={35}
                color={COLORS.white}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Modification Request</Text>
              <Text style={styles.heroText}>
                Select service type, fill required details and authorize with
                your transaction PIN.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Primary Details</Text>

              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                  {priceLoading
                    ? "Loading..."
                    : `₦${currentPrice.toLocaleString()}`}
                </Text>
              </View>
            </View>

            <InputField
              label="NIN Number"
              placeholder="11-digit NIN"
              keyboardType="number-pad"
              maxLength={11}
              value={formData.ninNumber || ""}
              onChangeText={(v) => handleInputChange("ninNumber", cleanNumber(v))}
            />

            {selectedType === "name" && (
              <>
                <InputField
                  label="First Name"
                  placeholder="New first name"
                  value={formData.firstName || ""}
                  onChangeText={(v) => handleInputChange("firstName", v)}
                />

                <InputField
                  label="Last Name"
                  placeholder="New last name"
                  value={formData.lastName || ""}
                  onChangeText={(v) => handleInputChange("lastName", v)}
                />

                <InputField
                  label="Middle Name"
                  placeholder="New middle name"
                  value={formData.middleName || ""}
                  onChangeText={(v) => handleInputChange("middleName", v)}
                />
              </>
            )}

            {selectedType === "phone" && (
              <>
                <InputField
                  label="Full Name"
                  placeholder="As seen on NIN"
                  value={formData.fullName || ""}
                  onChangeText={(v) => handleInputChange("fullName", v)}
                />

                <InputField
                  label="New Phone Number"
                  placeholder="080..."
                  keyboardType="phone-pad"
                  value={formData.newPhone || ""}
                  onChangeText={(v) => handleInputChange("newPhone", v)}
                />
              </>
            )}

            {selectedType === "dob" && (
              <>
                <InputField
                  label="New Date of Birth"
                  placeholder="DD/MM/YYYY"
                  value={formData.newDob || ""}
                  onChangeText={(v) => handleInputChange("newDob", v)}
                />

                <InputField
                  label="L.G.A of Origin"
                  placeholder="Your LGA"
                  value={formData.lgaOrigin || ""}
                  onChangeText={(v) => handleInputChange("lgaOrigin", v)}
                />

                <InputField
                  label="Place of Birth"
                  placeholder="Hospital or town"
                  value={formData.placeBirth || ""}
                  onChangeText={(v) => handleInputChange("placeBirth", v)}
                />
              </>
            )}

            {selectedType === "address" && (
              <>
                <InputField
                  label="Address Line 1"
                  placeholder="House number / street"
                  value={formData.addressLine1 || ""}
                  onChangeText={(v) => handleInputChange("addressLine1", v)}
                />

                <InputField
                  label="Town / City"
                  placeholder="City name"
                  value={formData.townCity || ""}
                  onChangeText={(v) => handleInputChange("townCity", v)}
                />

                <InputField
                  label="State"
                  placeholder="Current state"
                  value={formData.state || ""}
                  onChangeText={(v) => handleInputChange("state", v)}
                />
              </>
            )}

            {(selectedType === "name_dob" || selectedType === "name_phone") && (
              <>
                <InputField
                  label="New First Name"
                  placeholder="Enter first name"
                  value={formData.newFirstName || ""}
                  onChangeText={(v) => handleInputChange("newFirstName", v)}
                />

                <InputField
                  label="New Last Name"
                  placeholder="Enter last name"
                  value={formData.newLastName || ""}
                  onChangeText={(v) => handleInputChange("newLastName", v)}
                />

                {selectedType === "name_dob" ? (
                  <InputField
                    label="New Date of Birth"
                    placeholder="DD/MM/YYYY"
                    value={formData.newDob || ""}
                    onChangeText={(v) => handleInputChange("newDob", v)}
                  />
                ) : (
                  <InputField
                    label="New Phone Number"
                    placeholder="080..."
                    keyboardType="phone-pad"
                    value={formData.newPhoneNumber || ""}
                    onChangeText={(v) =>
                      handleInputChange("newPhoneNumber", v)
                    }
                  />
                )}
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Authorization</Text>

            <InputField
              label="Transaction PIN"
              placeholder="4-digit security PIN"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              value={pin}
              onChangeText={(v) => setPin(cleanNumber(v))}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.75 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.86}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color={COLORS.white} />
                <Text style={styles.btnText}>SUBMIT MODIFICATION REQUEST</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const InputField = ({ label, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>

    <TextInput
      style={styles.input}
      placeholderTextColor="#94A3B8"
      {...props}
    />
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
  headerTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabScroll: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    marginRight: 9,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.primary,
    marginLeft: 6,
  },
  activeTabText: {
    color: COLORS.white,
  },
  scrollContent: {
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.secondary,
  },
  priceBadge: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  priceText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "900",
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.muted,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    borderRadius: 14,
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "700",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 30,
    flexDirection: "row",
    gap: 8,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
});

export default NIMCModificationScreen;