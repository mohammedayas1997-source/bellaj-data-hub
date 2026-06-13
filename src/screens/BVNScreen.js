import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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
  verifyIdentity: `${BASE_URL}/verification/verify`,
  prices: `${BASE_URL}/verification/prices`,
  updatePrice: `${BASE_URL}/admin/verification-price`,
};

const SERVICES = [
  {
    id: "phone_verify",
    title: "Phone Number Verification",
    icon: "phone-check",
    inputLabel: "Phone Number",
    maxLength: 11,
    keyboardType: "numeric",
  },
  {
    id: "bvn_basic",
    title: "BVN Basic Search",
    icon: "bank-outline",
    inputLabel: "BVN Number",
    maxLength: 11,
    keyboardType: "numeric",
  },
  {
    id: "bvn_full",
    title: "Full BVN Details",
    icon: "bank-check",
    inputLabel: "BVN Number",
    maxLength: 11,
    keyboardType: "numeric",
  },
  {
    id: "face_id",
    title: "Face ID Recognition",
    icon: "face-recognition",
    inputLabel: "Enrollment ID",
    maxLength: 15,
    keyboardType: "default",
  },
];

const VerificationScreen = ({ navigation }) => {
  const [view, setView] = useState("list");
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [newPrice, setNewPrice] = useState("");

  const [prices, setPrices] = useState({
    bvn_full: 500,
    bvn_basic: 200,
    face_id: 800,
    phone_verify: 300,
  });

  const [formData, setFormData] = useState({
    searchValue: "",
    pin: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadInitialData = async () => {
    try {
      setPriceLoading(true);

      const storedUser = await AsyncStorage.getItem("userData");

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setIsAdmin(
          parsed?.role === "admin" ||
            parsed?.role === "superadmin" ||
            parsed?.role === "superAdmin"
        );
      }

      const headers = await getAuthHeaders();
      const { data } = await axios.get(API_ENDPOINTS.prices, { headers });

      const livePrices = data?.data || data?.prices || data;

      if (livePrices && typeof livePrices === "object") {
        setPrices((prev) => ({ ...prev, ...livePrices }));
      }
    } catch (error) {
      console.log("Using default verification prices");
    } finally {
      setPriceLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData();
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
    if (view === "result") {
      setView("list");
      setVerificationResult(null);
      return;
    }

    if (view === "form") {
      setView("list");
      setSelectedTask(null);
      setVerificationResult(null);
      return;
    }

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

  const handleUpdatePrice = async (serviceId) => {
    if (!newPrice.trim() || Number(newPrice) <= 0) {
      Alert.alert("Validation Error", "Enter a valid price.");
      return;
    }

    Alert.alert("Confirm Price Update", `Set price to ₦${newPrice}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        onPress: async () => {
          try {
            setPriceLoading(true);

            const headers = await getAuthHeaders();

            const { data } = await axios.post(
              API_ENDPOINTS.updatePrice,
              {
                serviceId,
                price: Number(newPrice),
              },
              { headers }
            );

            if (data?.success === false) {
              Alert.alert("Update Failed", data?.message || "Price was not updated.");
              return;
            }

            setPrices((prev) => ({
              ...prev,
              [serviceId]: Number(newPrice),
            }));

            setNewPrice("");

            Alert.alert("Bellaj Data Hub", "Verification price updated successfully.");
          } catch (error) {
            const message =
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              "You do not have permission to update this price.";

            Alert.alert("Update Failed", message);
          } finally {
            setPriceLoading(false);
          }
        },
      },
    ]);
  };

  const validateForm = () => {
    if (!selectedTask) {
      Alert.alert("Validation Error", "Please select a verification service.");
      return false;
    }

    if (!formData.searchValue.trim() || !formData.pin.trim()) {
      Alert.alert("Validation Error", "Please fill all fields.");
      return false;
    }

    if (
      selectedTask.id !== "face_id" &&
      formData.searchValue.trim().length !== selectedTask.maxLength
    ) {
      Alert.alert(
        "Validation Error",
        `Enter a valid ${selectedTask.maxLength}-digit ${selectedTask.inputLabel}.`
      );
      return false;
    }

    if (formData.pin.length !== 4) {
      Alert.alert("Validation Error", "Enter your 4-digit transaction PIN.");
      return false;
    }

    return true;
  };

  const handleVerify = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Confirm Verification",
      `Verify ${selectedTask.title} for ₦${Number(
        prices[selectedTask.id] || 0
      ).toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Verify",
          onPress: async () => {
            try {
              setLoading(true);

              const headers = await getAuthHeaders();

              const payload = {
                type: selectedTask.id,
                serviceType: selectedTask.id,
                value: formData.searchValue.trim(),
                searchValue: formData.searchValue.trim(),
                pin: formData.pin,
                transactionPin: formData.pin,
                charge: Number(prices[selectedTask.id] || 0),
              };

              const { data } = await axios.post(
                API_ENDPOINTS.verifyIdentity,
                payload,
                { headers }
              );

              if (data?.success === false) {
                Alert.alert(
                  "Verification Failed",
                  data?.message || "Verification could not be completed."
                );
                return;
              }

              setVerificationResult(data?.data || data?.result || data);
              setView("result");
            } catch (error) {
              const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Verification could not be completed.";

              Alert.alert("Verification Failed", message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const generatePDF = async (data) => {
    try {
      const fullName =
        data?.fullName ||
        `${data?.firstName || ""} ${data?.lastName || ""}`.trim() ||
        data?.name ||
        "Verified Customer";

      const reference =
        data?.reference ||
        data?.transactionId ||
        Math.random().toString(36).substring(2, 10).toUpperCase();

      const html = `
        <html>
          <body style="padding: 40px; font-family: Arial, sans-serif; color:#0F172A;">
            <div style="border:2px solid #E60000; padding:30px; border-radius:16px;">
              <h1 style="text-align:center; color:#E60000;">BELLAJ DATA HUB</h1>
              <h2 style="text-align:center; color:#0B5E3C;">VERIFICATION SLIP</h2>
              <hr/>
              <p><b>Service:</b> ${selectedTask?.title || "Verification"}</p>
              <p><b>Name:</b> ${fullName}</p>
              <p><b>ID Used:</b> ${formData.searchValue}</p>
              <p><b>Reference:</b> ${reference}</p>
              <p><b>Date:</b> ${new Date().toLocaleString()}</p>
              <div style="margin-top:30px; border:1px solid #0B5E3C; padding:18px; border-radius:12px;">
                <p>Verification Status: <b style="color:#0B5E3C;">VERIFIED</b></p>
              </div>
              <p style="margin-top:35px; font-size:12px; color:#64748B;">
                Generated securely by Bellaj Data Hub.
              </p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("PDF Error", "Could not generate verification slip.");
    }
  };

  const selectedPrice = selectedTask ? Number(prices[selectedTask.id] || 0) : 0;

  const resultName = useMemo(() => {
    return (
      verificationResult?.fullName ||
      `${verificationResult?.firstName || ""} ${
        verificationResult?.lastName || ""
      }`.trim() ||
      verificationResult?.name ||
      "Verified Customer"
    );
  }, [verificationResult]);

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
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <Text style={styles.headerSubtitle}>
            Bellaj Data Hub verification services
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {view === "list" && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
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
                name="shield-account-outline"
                size={34}
                color={COLORS.white}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Verification Center</Text>
              <Text style={styles.heroText}>
                Verify phone numbers, BVN records and identity information in real time.
              </Text>
            </View>
          </View>

          {SERVICES.map((service) => (
            <View key={service.id} style={styles.serviceWrapper}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.86}
                onPress={() => {
                  setSelectedTask(service);
                  setFormData({ searchValue: "", pin: "" });
                  setVerificationResult(null);
                  setView("form");
                }}
              >
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons
                    name={service.icon}
                    size={28}
                    color={COLORS.primary}
                  />
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{service.title}</Text>
                  <Text style={styles.cardPrice}>
                    Fee: ₦{Number(prices[service.id] || 0).toLocaleString()}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>

              {isAdmin && (
                <View style={styles.adminRow}>
                  <TextInput
                    style={styles.adminInput}
                    placeholder="New Price"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newPrice}
                    onChangeText={setNewPrice}
                  />

                  <TouchableOpacity
                    style={styles.updateBtn}
                    onPress={() => handleUpdatePrice(service.id)}
                    disabled={priceLoading}
                  >
                    {priceLoading ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={styles.updateBtnText}>SET</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {view === "form" && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{selectedTask?.title}</Text>
            <Text style={styles.formPrice}>
              Service Charge: ₦{selectedPrice.toLocaleString()}
            </Text>

            <Text style={styles.inputLabel}>{selectedTask?.inputLabel}</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="card-search-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder={`Enter ${selectedTask?.inputLabel}`}
                placeholderTextColor="#94A3B8"
                keyboardType={selectedTask?.keyboardType || "numeric"}
                maxLength={selectedTask?.maxLength}
                value={formData.searchValue}
                onChangeText={(v) =>
                  setFormData({ ...formData, searchValue: v })
                }
              />
            </View>

            <Text style={styles.inputLabel}>Transaction PIN</Text>
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
                onChangeText={(v) => setFormData({ ...formData, pin: v })}
              />
            </View>

            <View style={styles.summaryCard}>
              <SummaryRow label="Service" value={selectedTask?.title || "N/A"} />
              <SummaryRow
                label="Charge"
                value={`₦${selectedPrice.toLocaleString()}`}
              />
              <SummaryRow
                label="Search Value"
                value={formData.searchValue || "Not entered"}
              />
            </View>

            <TouchableOpacity
              style={[styles.mainBtn, loading && { opacity: 0.7 }]}
              onPress={handleVerify}
              disabled={loading}
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
                  <Text style={styles.mainBtnText}>VERIFY IDENTITY</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {view === "result" && (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
        >
          <View style={styles.successCard}>
            <Ionicons
              name="checkmark-circle"
              size={82}
              color={COLORS.secondary}
            />

            <Text style={styles.successTitle}>Verification Successful</Text>

            <View style={styles.resData}>
              <SummaryRow label="Service" value={selectedTask?.title || "Verification"} />
              <SummaryRow label="Name" value={resultName} />
              <SummaryRow
                label="Reference"
                value={
                  verificationResult?.reference ||
                  verificationResult?.transactionId ||
                  "Generated"
                }
              />
              <SummaryRow label="ID Used" value={formData.searchValue} />
            </View>

            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={() => generatePDF(verificationResult)}
              activeOpacity={0.86}
            >
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={24}
                color={COLORS.white}
              />
              <Text style={styles.pdfBtnText}>DOWNLOAD SLIP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setView("list");
                setSelectedTask(null);
                setVerificationResult(null);
              }}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const SummaryRow = ({ label, value }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
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
  heroTitle: { color: COLORS.dark, fontSize: 20, fontWeight: "900" },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  serviceWrapper: { marginBottom: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 15, fontWeight: "900", color: COLORS.dark },
  cardPrice: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: "800",
    marginTop: 3,
  },
  adminRow: {
    flexDirection: "row",
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminInput: {
    flex: 1,
    minHeight: 42,
    backgroundColor: COLORS.light,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.dark,
    fontWeight: "700",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    marginLeft: 10,
    borderRadius: 10,
    justifyContent: "center",
    minWidth: 70,
    alignItems: "center",
  },
  updateBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.dark,
  },
  formPrice: {
    fontSize: 15,
    color: COLORS.secondary,
    marginTop: 5,
    marginBottom: 20,
    fontWeight: "800",
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 8,
    fontWeight: "900",
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    borderRadius: 15,
    minHeight: 52,
    marginBottom: 14,
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
  summaryCard: {
    backgroundColor: COLORS.light,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
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
  mainBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  mainBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },
  successCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.secondary,
    marginTop: 12,
  },
  resData: {
    width: "100%",
    backgroundColor: COLORS.light,
    padding: 14,
    borderRadius: 18,
    marginTop: 24,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pdfBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    padding: 17,
    borderRadius: 16,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  pdfBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    marginLeft: 10,
  },
  closeBtn: {
    marginTop: 20,
    padding: 10,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
});

export default VerificationScreen;