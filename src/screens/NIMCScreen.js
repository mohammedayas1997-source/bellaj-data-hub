import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  RefreshControl,
  Platform,
  Linking,
} from "react-native";
import {
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import BASE_URL from "../config/api";

const { width } = Dimensions.get("window");

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
  verifyAndCharge: `${BASE_URL}/nimc/verify`,
};

const SERVICES = [
  { id: "nin", title: "NIN Verification", icon: "fingerprint" },
  { id: "phone", title: "Phone Search", icon: "phone-alt" },
  { id: "trackingId", title: "Tracking ID", icon: "barcode" },
  { id: "premiumCard", title: "Premium ID Card", icon: "id-card" },
  { id: "standardSlip", title: "Standard Slip", icon: "file-alt" },
  { id: "basicSlip", title: "Basic NIMC Slip", icon: "print" },
];

const DEFAULT_PRICES = {
  nin: 0,
  phone: 0,
  trackingId: 0,
  premiumCard: 0,
  standardSlip: 0,
  basicSlip: 0,
};

const NIMCScreen = ({ navigation }) => {
  const [view, setView] = useState("main");
  const [searchType, setSearchType] = useState(null);
  const [formData, setFormData] = useState({ searchValue: "", pin: "" });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [fetchingPrices, setFetchingPrices] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      setFetchingPrices(true);
      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.nimcPrices, {
        headers: headers || {},
        timeout: 20000,
      });

      const livePrices = data?.prices || data?.data?.prices || data?.data || data;

      if (livePrices && typeof livePrices === "object") {
        setPrices((prev) => ({ ...prev, ...livePrices }));
      }
    } catch (err) {
      console.log("NIMC price error:", err?.response?.data || err.message);
    } finally {
      setFetchingPrices(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrices();
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (view === "result") {
      setView("main");
      setUserData(null);
      return;
    }

    if (searchType) {
      setSearchType(null);
      setFormData({ searchValue: "", pin: "" });
      return;
    }

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

  const selectedPrice = useMemo(() => {
    return searchType ? Number(prices?.[searchType.id] || 0) : 0;
  }, [prices, searchType]);

  const validateForm = () => {
    if (!searchType) {
      Alert.alert("Required", "Please select a NIMC service.");
      return false;
    }

    if (!formData.searchValue.trim()) {
      Alert.alert("Required", "Please enter ID number or search value.");
      return false;
    }

    if (!formData.pin.trim() || formData.pin.length !== 4) {
      Alert.alert("Required", "Please enter your 4-digit transaction PIN.");
      return false;
    }

    return true;
  };

  const handleVerification = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Confirm NIMC Request",
      `Proceed with ${searchType.name} for ₦${selectedPrice.toLocaleString()}?`,
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
                API_ENDPOINTS.verifyAndCharge,
                {
                  searchValue: formData.searchValue.trim(),
                  searchType: searchType.id,
                  serviceType: searchType.id,
                  pin: formData.pin,
                  transactionPin: formData.pin,
                  amount: selectedPrice,
                },
                {
                  headers,
                  timeout: 30000,
                }
              );

              if (data?.success === false) {
                Alert.alert(
                  "Verification Failed",
                  data?.message || "NIMC request failed."
                );
                return;
              }

              setUserData(data?.data || data?.result || data);
              setView("result");
            } catch (err) {
              Alert.alert(
                "Verification Failed",
                err?.response?.data?.message ||
                  err?.response?.data?.error ||
                  "Unable to complete NIMC verification."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const generatePDF = async () => {
    try {
      if (!userData) return;

      if (userData?.pdfUrl || userData?.slipUrl) {
        await Linking.openURL(userData.pdfUrl || userData.slipUrl);
        return;
      }

      const html = `
        <html>
          <body style="font-family: Arial; padding: 30px; color: #0F172A;">
            <div style="border: 2px solid #E60000; border-radius: 16px; padding: 25px;">
              <h1 style="text-align:center;color:#E60000;">BELLAJ DATA HUB</h1>
              <h2 style="text-align:center;color:#0B5E3C;">NIMC PRINTING SLIP</h2>
              <hr />
              <p><b>Service:</b> ${searchType?.name || "NIMC Service"}</p>
              <p><b>Full Name:</b> ${userData?.fullName || userData?.name || "N/A"}</p>
              <p><b>NIN Number:</b> ${userData?.nin || "N/A"}</p>
              <p><b>Tracking ID:</b> ${userData?.trackingId || "N/A"}</p>
              <p><b>Reference:</b> ${userData?.reference || userData?.transactionId || "N/A"}</p>
              <p><b>Date:</b> ${new Date().toLocaleString()}</p>
              <p style="margin-top:30px;font-size:12px;color:#64748B;">
                Generated securely by Bellaj Data Hub.
              </p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("PDF Error", "Unable to generate printing slip.");
    }
  };

  const renderHeader = (title, subtitle) => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
        <Ionicons name="arrow-back" size={23} color={COLORS.white} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
        <Ionicons name="menu" size={25} color={COLORS.white} />
      </TouchableOpacity>

      <View style={styles.headerTextBox}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  if (!searchType && view === "main") {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        {renderHeader("NIMC Services", "Verification, search and printing")}

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
          <View style={styles.bannerCard}>
            <MaterialCommunityIcons
              name="printer-check"
              size={40}
              color={COLORS.white}
            />

            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.bannerText}>Print NIMC Slips</Text>
              <Text style={styles.bannerSub}>
                Verify and download NIMC slips in real time.
              </Text>
            </View>

            {fetchingPrices && (
              <ActivityIndicator color={COLORS.white} size="small" />
            )}
          </View>

          <Text style={styles.sectionLabel}>Verification & Printing Options</Text>

          <View style={styles.grid}>
            {SERVICES.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                icon={service.icon}
                price={prices?.[service.id] || 0}
                onPress={() =>
                  setSearchType({ id: service.id, name: service.title })
                }
              />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (searchType && view === "main") {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        {renderHeader(searchType.name, "Enter details and transaction PIN")}

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Identification Number / Search Value</Text>

            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="card-search-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                placeholder="Enter ID, NIN, Phone or Tracking ID"
                placeholderTextColor="#94A3B8"
                style={styles.input}
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
                placeholder="Enter 4-digit PIN"
                placeholderTextColor="#94A3B8"
                style={styles.input}
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                value={formData.pin}
                onChangeText={(v) => setFormData({ ...formData, pin: v })}
              />
            </View>

            <View style={styles.priceTag}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>
                ₦{Number(selectedPrice || 0).toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.75 }]}
              onPress={handleVerification}
              disabled={loading}
              activeOpacity={0.86}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="shield-check-outline"
                    size={22}
                    color={COLORS.white}
                  />
                  <Text style={styles.submitText}>VERIFY & PRINT</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {renderHeader("Verification Success", "NIMC record found")}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
      >
        <View style={styles.resultCard}>
          {userData?.photo ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${userData.photo}` }}
              style={styles.userPhoto}
            />
          ) : (
            <View style={styles.photoFallback}>
              <Ionicons name="person" size={55} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.infoBox}>
            <InfoRow label="Full Name" value={userData?.fullName || userData?.name} />
            <InfoRow label="NIN Number" value={userData?.nin} />
            <InfoRow label="Tracking ID" value={userData?.trackingId} />
            <InfoRow
              label="Reference"
              value={userData?.reference || userData?.transactionId}
            />
          </View>

          <TouchableOpacity style={styles.downloadBtn} onPress={generatePDF}>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={24}
              color={COLORS.white}
            />
            <Text style={styles.downloadText}>Download Printing Slip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => {
              setView("main");
              setSearchType(null);
              setUserData(null);
              setFormData({ searchValue: "", pin: "" });
            }}
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const ServiceCard = ({ title, icon, price, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.iconCircle}>
      <FontAwesome5 name={icon} size={20} color={COLORS.primary} />
    </View>

    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardPrice}>₦{Number(price || 0).toLocaleString()}</Text>
  </TouchableOpacity>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
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
  bannerCard: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  bannerText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  bannerSub: {
    color: "#FFE4E4",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  card: {
    backgroundColor: COLORS.white,
    width: (width - 46) / 2,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconCircle: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.softRed,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    textAlign: "center",
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.secondary,
    marginTop: 6,
  },
  formCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.muted,
    marginBottom: 9,
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    borderRadius: 15,
    minHeight: 54,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.dark,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  priceTag: {
    backgroundColor: COLORS.softGreen,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  priceLabel: { fontWeight: "900", color: COLORS.secondary },
  priceValue: { fontWeight: "900", color: COLORS.secondary, fontSize: 16 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  submitText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 15,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userPhoto: {
    width: 125,
    height: 125,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  photoFallback: {
    width: 125,
    height: 125,
    borderRadius: 18,
    marginBottom: 20,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  infoBox: {
    width: "100%",
    backgroundColor: COLORS.light,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: { marginBottom: 14 },
  infoLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: "900",
    marginTop: 3,
  },
  downloadBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    width: "100%",
    minHeight: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  downloadText: {
    color: COLORS.white,
    fontWeight: "900",
    marginLeft: 10,
  },
  doneBtn: {
    marginTop: 16,
    paddingVertical: 10,
  },
  doneText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 15,
  },
});

export default NIMCScreen;