import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import axios from "axios";
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
  ninValidate: `${BASE_URL}/nin/validate`,
};

const validationTypes = [
  { id: 1, name: "No Record Found", cost: 1300, icon: "database-alert-outline" },
  { id: 2, name: "SIM Validation", cost: 1300, icon: "sim-outline" },
  { id: 3, name: "vNIN Validation", cost: 1300, icon: "shield-account-outline" },
  { id: 4, name: "Update Records Validation", cost: 1300, icon: "account-edit-outline" },
  { id: 5, name: "Bank Validation", cost: 1300, icon: "bank-check" },
  { id: 6, name: "Modification Validation", cost: 1700, icon: "file-document-edit-outline" },
  { id: 7, name: "Photographic Error", cost: 1400, icon: "image-alert-outline" },
];

const NINValidation = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState("No Record Found");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState({ nin: "", pin: "" });

  const currentType = useMemo(
    () => validationTypes.find((t) => t.name === selectedType) || validationTypes[0],
    [selectedType]
  );

  const currentCost = currentType?.cost || 0;

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

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

  const validateForm = () => {
    if (!formData.nin.trim()) {
      Alert.alert("Required", "Please enter NIN number.");
      return false;
    }

    if (!/^\d{11}$/.test(formData.nin.trim())) {
      Alert.alert("Invalid NIN", "NIN must be exactly 11 digits.");
      return false;
    }

    if (!formData.pin.trim()) {
      Alert.alert("Required", "Please enter transaction PIN.");
      return false;
    }

    if (!/^\d{4}$/.test(formData.pin.trim())) {
      Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
      return false;
    }

    if (!isAuthorized) {
      Alert.alert(
        "Authorization Required",
        "You must confirm that you have obtained authorization from the NIN owner."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Confirm NIN Validation",
      `Proceed with ${selectedType} for ₦${Number(currentCost).toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          onPress: async () => {
            try {
              setLoading(true);

              const headers = await getAuthHeaders();

              if (!headers) {
                Alert.alert("Session Expired", "Please login again.", [
                  { text: "Login", onPress: () => navigation.navigate("Login") },
                ]);
                return;
              }

              const { data } = await axios.post(
                API_ENDPOINTS.ninValidate,
                {
                  nin: formData.nin.trim(),
                  validationType: selectedType,
                  type: selectedType,
                  amount: Number(currentCost),
                  pin: formData.pin.trim(),
                  transactionPin: formData.pin.trim(),
                  authorizationConfirmed: true,
                  timestamp: new Date().toISOString(),
                },
                {
                  headers,
                  timeout: 30000,
                }
              );

              if (data?.success === false) {
                Alert.alert(
                  "Validation Failed",
                  data?.message || "Unable to process validation."
                );
                return;
              }

              Alert.alert(
                "Bellaj Data Hub",
                data?.message || "Validation request submitted successfully.",
                [
                  {
                    text: "View History",
                    onPress: () => navigation.navigate("NIMCHistory"),
                  },
                  {
                    text: "OK",
                    onPress: () => {
                      setFormData({ nin: "", pin: "" });
                      setIsAuthorized(false);
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                "Validation Failed",
                error?.response?.data?.message ||
                  error?.response?.data?.error ||
                  error?.message ||
                  "Something went wrong."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const showConsentText = () => {
    Alert.alert(
      "Authorization Consent",
      "By continuing, you confirm that the NIN owner has authorized this validation request and that the information provided is accurate."
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>NIN Validation</Text>
          <Text style={styles.headerSubtitle}>Bellaj identity verification center</Text>
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
              name="fingerprint"
              size={36}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Validation Request Center</Text>
            <Text style={styles.heroText}>
              Select the validation category, enter NIN details, confirm consent and submit your request securely.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleBox}>
              <Ionicons name="list" size={20} color={COLORS.primary} />
              <Text style={styles.title}>Select Validation Type</Text>
            </View>

            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>
                ₦{Number(currentCost).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.chipContainer}>
            {validationTypes.map((type) => {
              const selected = selectedType === type.name;

              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.chip, selected && styles.selectedChip]}
                  onPress={() => setSelectedType(type.name)}
                  activeOpacity={0.86}
                >
                  <MaterialCommunityIcons
                    name={type.icon}
                    size={18}
                    color={selected ? COLORS.primary : COLORS.muted}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.selectedChipText,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>NIN Details</Text>

          <Text style={styles.label}>NIN Number</Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter 11-digit NIN"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={11}
              value={formData.nin}
              onChangeText={(v) =>
                setFormData({
                  ...formData,
                  nin: v.replace(/[^0-9]/g, ""),
                })
              }
            />
          </View>

          <Text style={styles.label}>Transaction PIN</Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={formData.pin}
              onChangeText={(v) =>
                setFormData({
                  ...formData,
                  pin: v.replace(/[^0-9]/g, ""),
                })
              }
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.authHeader}>
            <MaterialCommunityIcons
              name="shield-check"
              size={20}
              color={COLORS.secondary}
            />
            <Text style={styles.authTitle}>Authorization</Text>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsAuthorized(!isAuthorized)}
            activeOpacity={0.86}
          >
            <MaterialCommunityIcons
              name={isAuthorized ? "checkbox-marked" : "checkbox-blank-outline"}
              size={26}
              color={isAuthorized ? COLORS.secondary : "#CBD5E1"}
            />

            <Text style={styles.authText}>
              I confirm that I have obtained authorization from the NIN owner to submit this validation request.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={showConsentText}>
            <Text style={styles.linkText}>View full consent text</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Request Summary</Text>
          <SummaryRow label="Validation Type" value={selectedType} />
          <SummaryRow label="NIN Number" value={formData.nin || "Not entered"} />
          <SummaryRow
            label="Service Fee"
            value={`₦${Number(currentCost).toLocaleString()}`}
            highlight
          />
          <SummaryRow
            label="Authorization"
            value={isAuthorized ? "Confirmed" : "Not confirmed"}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!isAuthorized || loading) && styles.disabledBtn,
          ]}
          onPress={handleSubmit}
          disabled={!isAuthorized || loading}
          activeOpacity={0.86}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={21}
                color={COLORS.white}
              />
              <Text style={styles.submitBtnText}>VALIDATE NIN</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const SummaryRow = ({ label, value, highlight }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, highlight && { color: COLORS.primary }]}>
      {value}
    </Text>
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
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 80,
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
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 10,
    alignItems: "center",
  },
  sectionTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
    color: COLORS.dark,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 15,
  },
  priceBadge: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 11,
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
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: COLORS.light,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectedChip: {
    backgroundColor: COLORS.softRed,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "700",
  },
  selectedChipText: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 9,
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    borderRadius: 15,
    minHeight: 54,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "700",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  authHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  authTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
    color: COLORS.secondary,
  },
  checkboxRow: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "flex-start",
  },
  authText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
    fontWeight: "600",
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 13,
    marginTop: 8,
    marginLeft: 36,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  summaryTitle: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 9,
    gap: 12,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontWeight: "700",
  },
  summaryValue: {
    color: COLORS.dark,
    fontWeight: "900",
    flex: 1,
    textAlign: "right",
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  disabledBtn: {
    backgroundColor: "#CBD5E1",
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 15,
  },
});

export default NINValidation;