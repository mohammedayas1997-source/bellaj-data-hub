import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
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
  packages: `${BASE_URL}/cable/packages`,
  validateCable: `${BASE_URL}/cable/validate`,
  payCable: `${BASE_URL}/cable/pay`,
  serviceCharge: `${BASE_URL}/cable/service-charge`,
  updateServiceCharge: `${BASE_URL}/admin/cable-service-charge`,
};

const DEFAULT_PACKAGES = {
  GOTV: [
    { id: "gotv-lite", name: "GOtv Lite", price: 1500 },
    { id: "gotv-value", name: "GOtv Value", price: 2100 },
    { id: "gotv-plus", name: "GOtv Plus", price: 3300 },
    { id: "gotv-max", name: "GOtv Max", price: 4850 },
    { id: "gotv-supa", name: "GOtv Supa", price: 6400 },
  ],
  DSTV: [
    { id: "dstv-padi", name: "DStv Padi", price: 2950 },
    { id: "dstv-yanga", name: "DStv Yanga", price: 4200 },
    { id: "dstv-confam", name: "DStv Confam", price: 7400 },
    { id: "dstv-asia", name: "DStv Asia", price: 9900 },
    { id: "dstv-compact", name: "DStv Compact", price: 12500 },
  ],
  STARTIMES: [
    { id: "nova", name: "Nova Monthly", price: 1500 },
    { id: "basic", name: "Basic Monthly", price: 2600 },
    { id: "smart", name: "Smart Monthly", price: 3500 },
    { id: "classic", name: "Classic Monthly", price: 5000 },
    { id: "super", name: "Super Monthly", price: 7000 },
  ],
};

const providers = [
  { id: "GOTV", title: "GOtv", icon: "television-classic" },
  { id: "DSTV", title: "DStv", icon: "satellite-uplink" },
  { id: "STARTIMES", title: "Startimes", icon: "television-guide" },
];

const CableScreen = ({ navigation }) => {
  const [provider, setProvider] = useState("GOTV");
  const [smartCard, setSmartCard] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pin, setPin] = useState("");

  const [packages, setPackages] = useState(DEFAULT_PACKAGES.GOTV);
  const [serviceCharge, setServiceCharge] = useState(50);
  const [newCharge, setNewCharge] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const totalAmount = useMemo(() => {
    return Number(selectedPackage?.price || 0) + Number(serviceCharge || 0);
  }, [selectedPackage, serviceCharge]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setSelectedPackage(null);
    setCustomerName("");
    loadPackages(provider);
  }, [provider]);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadInitialData = async () => {
    try {
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

      const { data } = await axios.get(API_ENDPOINTS.serviceCharge, { headers });
      const liveCharge =
        data?.data?.charge || data?.charge || data?.serviceCharge || data?.data?.serviceCharge;

      if (liveCharge !== undefined && liveCharge !== null) {
        setServiceCharge(Number(liveCharge));
      }
    } catch (error) {
      console.log("Using default cable service charge");
    } finally {
      setRefreshing(false);
    }
  };

  const getArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.packages)) return payload.packages;
    if (Array.isArray(payload?.data?.packages)) return payload.data.packages;
    return [];
  };

  const loadPackages = async (selectedProvider = provider) => {
    try {
      setLoadingPackages(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.packages, {
        headers,
        params: { provider: selectedProvider },
      });

      const livePackages = getArray(data);

      if (livePackages.length > 0) {
        setPackages(
          livePackages.map((item) => ({
            id: item?.id || item?._id || item?.packageId || item?.code,
            name: item?.name || item?.title || item?.packageName,
            price: Number(item?.price || item?.amount || 0),
          }))
        );
      } else {
        setPackages(DEFAULT_PACKAGES[selectedProvider] || []);
      }
    } catch (error) {
      setPackages(DEFAULT_PACKAGES[selectedProvider] || []);
    } finally {
      setLoadingPackages(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData();
    loadPackages(provider);
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

  const updateGlobalCharge = async () => {
    if (!newCharge.trim() || Number(newCharge) < 0) {
      Alert.alert("Validation Error", "Enter a valid service charge.");
      return;
    }

    Alert.alert("Confirm Update", `Set cable service charge to ₦${newCharge}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        onPress: async () => {
          try {
            setLoadingPackages(true);

            const headers = await getAuthHeaders();

            const { data } = await axios.post(
              API_ENDPOINTS.updateServiceCharge,
              {
                charge: Number(newCharge),
                serviceCharge: Number(newCharge),
              },
              { headers }
            );

            if (data?.success === false) {
              Alert.alert("Update Failed", data?.message || "Charge was not updated.");
              return;
            }

            setServiceCharge(Number(newCharge));
            setNewCharge("");

            Alert.alert("Bellaj Data Hub", "Cable service charge updated successfully.");
          } catch (error) {
            const message =
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              "You do not have permission to update service charge.";

            Alert.alert("Update Failed", message);
          } finally {
            setLoadingPackages(false);
          }
        },
      },
    ]);
  };

  const validateIUC = async () => {
    if (smartCard.trim().length < 9) {
      Alert.alert("Validation Error", "Enter a valid IUC/Smartcard number.");
      return;
    }

    try {
      setValidating(true);
      setCustomerName("");

      const headers = await getAuthHeaders();

      const { data } = await axios.post(
        API_ENDPOINTS.validateCable,
        {
          provider,
          smartCard: smartCard.trim(),
          iuc: smartCard.trim(),
        },
        { headers }
      );

      if (data?.success === false) {
        Alert.alert("Validation Failed", data?.message || "Smartcard validation failed.");
        return;
      }

      const name =
        data?.data?.customerName ||
        data?.customerName ||
        data?.data?.name ||
        data?.name ||
        "Verified Customer";

      setCustomerName(name);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Check the smartcard number and try again.";

      Alert.alert("Validation Error", message);
    } finally {
      setValidating(false);
    }
  };

  const validatePayment = () => {
    if (!smartCard.trim()) {
      Alert.alert("Validation Error", "Enter IUC/Smartcard number.");
      return false;
    }

    if (!customerName) {
      Alert.alert("Validation Error", "Validate the smartcard first.");
      return false;
    }

    if (!selectedPackage) {
      Alert.alert("Validation Error", "Select a cable package.");
      return false;
    }

    if (pin.trim().length !== 4) {
      Alert.alert("Validation Error", "Enter your 4-digit transaction PIN.");
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    Alert.alert(
      "Confirm Cable Subscription",
      `Pay ₦${totalAmount.toLocaleString()} for ${selectedPackage.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: async () => {
            try {
              setLoading(true);

              const headers = await getAuthHeaders();

              const payload = {
                provider,
                smartCard: smartCard.trim(),
                iuc: smartCard.trim(),
                customerName,
                packageId: selectedPackage.id,
                packageName: selectedPackage.name,
                amount: totalAmount,
                serviceCharge: Number(serviceCharge || 0),
                transactionPin: pin,
                pin,
              };

              const { data } = await axios.post(API_ENDPOINTS.payCable, payload, {
                headers,
              });

              if (data?.success === false) {
                Alert.alert(
                  "Transaction Failed",
                  data?.message || "Cable subscription failed."
                );
                return;
              }

              Alert.alert(
                "Bellaj Data Hub",
                "Cable subscription activated successfully.",
                [
                  { text: "View History", onPress: () => navigation.navigate("SalesHistory") },
                  {
                    text: "OK",
                    onPress: () => {
                      setSmartCard("");
                      setCustomerName("");
                      setSelectedPackage(null);
                      setPin("");
                    },
                  },
                ]
              );
            } catch (error) {
              const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Cable subscription could not be completed.";

              Alert.alert("Transaction Failed", message);
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Cable TV</Text>
          <Text style={styles.headerSubtitle}>Validate and renew cable subscription</Text>
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
              name="television-classic"
              size={34}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Cable Subscription Center</Text>
            <Text style={styles.heroText}>
              Verify smartcard, choose package and activate subscription in real time.
            </Text>
          </View>
        </View>

        {isAdmin && (
          <View style={styles.adminSection}>
            <View style={styles.adminHeader}>
              <MaterialCommunityIcons
                name="shield-account-outline"
                size={24}
                color={COLORS.primary}
              />
              <View>
                <Text style={styles.adminTitle}>Admin Service Charge</Text>
                <Text style={styles.adminLabel}>
                  Current charge: ₦{Number(serviceCharge || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.adminRow}>
              <TextInput
                style={styles.adminInput}
                placeholder="New charge"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newCharge}
                onChangeText={setNewCharge}
              />

              <TouchableOpacity
                style={styles.adminBtn}
                onPress={updateGlobalCharge}
                disabled={loadingPackages}
                activeOpacity={0.86}
              >
                {loadingPackages ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.adminBtnText}>SAVE</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Choose Provider</Text>

          <View style={styles.providerGrid}>
            {providers.map((item) => {
              const active = provider === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.providerCard, active && styles.providerCardActive]}
                  onPress={() => setProvider(item.id)}
                  activeOpacity={0.86}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={25}
                    color={active ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[styles.providerText, active && styles.whiteText]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Smartcard Details</Text>

          <Text style={styles.label}>IUC / Smartcard Number</Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="card-account-details-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.mainInput}
              placeholder="e.g. 7012345678"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={smartCard}
              onChangeText={(val) => {
                setSmartCard(val);
                setCustomerName("");
              }}
            />

            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={validateIUC}
              disabled={validating}
              activeOpacity={0.86}
            >
              {validating ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>

          {!!customerName && (
            <View style={styles.customerBox}>
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={COLORS.secondary}
              />
              <Text style={styles.customerText}>{customerName}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Package</Text>

          {loadingPackages ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading packages...</Text>
            </View>
          ) : (
            <View style={styles.packageContainer}>
              {packages.map((pkg) => {
                const active = selectedPackage?.id === pkg.id;

                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={[styles.pkgCard, active && styles.activePkgCard]}
                    onPress={() => setSelectedPackage(pkg)}
                    activeOpacity={0.86}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pkgTitle, active && styles.whiteText]}>
                        {pkg.name}
                      </Text>

                      <Text style={[styles.pkgCaption, active && styles.activeCaption]}>
                        1 Month Validity
                      </Text>
                    </View>

                    <View style={styles.pkgRight}>
                      <Text style={[styles.pkgCost, active && styles.whiteText]}>
                        ₦{Number(pkg.price + serviceCharge).toLocaleString()}
                      </Text>
                      <Text style={[styles.pkgBase, active && styles.activeCaption]}>
                        Base ₦{Number(pkg.price).toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Transaction PIN</Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.pinInput}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>
          <SummaryRow label="Provider" value={provider} />
          <SummaryRow label="Smartcard" value={smartCard || "Not entered"} />
          <SummaryRow label="Customer" value={customerName || "Not verified"} />
          <SummaryRow label="Package" value={selectedPackage?.name || "Not selected"} />
          <SummaryRow
            label="Total Amount"
            value={`₦${Number(totalAmount || 0).toLocaleString()}`}
            highlight
          />
        </View>

        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.7 }]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.86}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="send-check-outline"
                size={21}
                color={COLORS.white}
              />
              <Text style={styles.payBtnText}>ACTIVATE SUBSCRIPTION</Text>
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
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "900" },
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
  adminSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 22,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  adminTitle: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 15,
  },
  adminLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    marginTop: 2,
  },
  adminRow: {
    flexDirection: "row",
    gap: 10,
  },
  adminInput: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.dark,
    fontWeight: "800",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  adminBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: "center",
    minWidth: 85,
    alignItems: "center",
  },
  adminBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },
  providerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  providerCard: {
    flex: 1,
    minHeight: 85,
    borderRadius: 18,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  providerCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  providerText: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 12,
    marginTop: 7,
  },
  whiteText: {
    color: COLORS.white,
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: "#475569",
    marginBottom: 9,
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    borderRadius: 15,
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
  },
  mainInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: "800",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  verifyBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    minHeight: 42,
    justifyContent: "center",
    borderRadius: 12,
  },
  verifyBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
  },
  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softGreen,
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  customerText: {
    marginLeft: 9,
    fontWeight: "900",
    color: COLORS.secondary,
    fontSize: 14,
  },
  loadingBox: {
    backgroundColor: COLORS.light,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    color: COLORS.muted,
    fontWeight: "700",
    marginTop: 8,
  },
  packageContainer: {
    gap: 12,
  },
  pkgCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activePkgCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pkgTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.dark,
  },
  pkgCaption: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
    fontWeight: "700",
  },
  activeCaption: {
    color: "#FFE4E4",
  },
  pkgRight: {
    alignItems: "flex-end",
  },
  pkgCost: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.secondary,
  },
  pkgBase: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  pinInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: "800",
    letterSpacing: 4,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
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
  payBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  payBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.6,
  },
});

export default CableScreen;