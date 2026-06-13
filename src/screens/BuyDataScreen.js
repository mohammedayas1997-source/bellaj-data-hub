import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  dataRate: `${BASE_URL}/data/rate`,
  updateDataRate: `${BASE_URL}/admin/data-rate`,
  buyDataCustom: `${BASE_URL}/data/buy`,
};

const networks = [
  { id: "01", name: "MTN", color: "#FFCC00" },
  { id: "02", name: "GLO", color: "#2ECC71" },
  { id: "04", name: "Airtel", color: "#E74C3C" },
  { id: "03", name: "9Mobile", color: "#006600" },
];

const quickGB = ["1", "2", "3", "5", "10"];

const BuyDataScreen = ({ navigation }) => {
  const [selectedNet, setSelectedNet] = useState("01");
  const [phone, setPhone] = useState("");
  const [gbAmount, setGbAmount] = useState("");
  const [pin, setPin] = useState("");
  const [pricePerGb, setPricePerGb] = useState(280);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const selectedNetwork = useMemo(
    () => networks.find((net) => net.id === selectedNet),
    [selectedNet]
  );

  const totalPrice = useMemo(() => {
    const amount = Number(gbAmount || 0);
    return amount * Number(pricePerGb || 0);
  }, [gbAmount, pricePerGb]);

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
      setRateLoading(true);

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
      const { data } = await axios.get(API_ENDPOINTS.dataRate, { headers });

      const liveRate =
        data?.rate ||
        data?.data?.rate ||
        data?.pricePerGb ||
        data?.data?.pricePerGb;

      if (liveRate) {
        setPricePerGb(Number(liveRate));
      }
    } catch (error) {
      console.log("Using default data rate");
    } finally {
      setRateLoading(false);
      setRefreshing(false);
    }
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

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData();
  };

  const validatePurchase = () => {
    if (!phone.trim() || !gbAmount.trim() || !pin.trim()) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return false;
    }

    if (!/^0\d{10}$/.test(phone.trim())) {
      Alert.alert("Validation Error", "Enter a valid 11-digit phone number.");
      return false;
    }

    if (Number(gbAmount) <= 0) {
      Alert.alert("Validation Error", "Enter a valid data quantity.");
      return false;
    }

    if (pin.length !== 4) {
      Alert.alert("Validation Error", "Enter your 4-digit transaction PIN.");
      return false;
    }

    return true;
  };

  const handleUpdateRate = async () => {
    if (!newRate.trim() || Number(newRate) <= 0) {
      Alert.alert("Validation Error", "Enter a valid new rate per GB.");
      return;
    }

    Alert.alert("Confirm Rate Update", `Set data rate to ₦${newRate}/GB?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        onPress: async () => {
          try {
            setRateLoading(true);
            const headers = await getAuthHeaders();

            const { data } = await axios.post(
              API_ENDPOINTS.updateDataRate,
              { rate: Number(newRate), pricePerGb: Number(newRate) },
              { headers }
            );

            if (data?.success === false) {
              Alert.alert("Update Failed", data?.message || "Rate was not updated.");
              return;
            }

            setPricePerGb(Number(newRate));
            setNewRate("");
            Alert.alert("Bellaj Data Hub", "Data rate updated successfully.");
          } catch (error) {
            const message =
              error?.response?.data?.message ||
              error?.response?.data?.error ||
              "You do not have permission to update data rate.";

            Alert.alert("Update Failed", message);
          } finally {
            setRateLoading(false);
          }
        },
      },
    ]);
  };

  const handlePurchase = async () => {
    if (!validatePurchase()) return;

    Alert.alert(
      "Confirm Data Purchase",
      `Buy ${gbAmount}GB ${selectedNetwork?.name} data for ${phone} at ₦${totalPrice.toLocaleString()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy Now",
          onPress: async () => {
            try {
              setLoading(true);

              const headers = await getAuthHeaders();

              const payload = {
                networkId: selectedNet,
                network: selectedNet,
                networkName: selectedNetwork?.name,
                gbQuantity: Number(gbAmount),
                quantity: Number(gbAmount),
                phoneNumber: phone.trim(),
                amount: totalPrice,
                transactionPin: pin,
              };

              const { data } = await axios.post(
                API_ENDPOINTS.buyDataCustom,
                payload,
                { headers }
              );

              if (data?.success === false) {
                Alert.alert(
                  "Transaction Failed",
                  data?.message || "Data purchase failed."
                );
                return;
              }

              Alert.alert(
                "Bellaj Data Hub",
                `${gbAmount}GB has been sent to ${phone}.`,
                [
                  {
                    text: "View History",
                    onPress: () => navigation.navigate("SalesHistory"),
                  },
                  {
                    text: "OK",
                    onPress: () => {
                      setPhone("");
                      setGbAmount("");
                      setPin("");
                    },
                  },
                ]
              );
            } catch (error) {
              const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Transaction could not be completed.";

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
          <Text style={styles.headerTitle}>Data Purchase</Text>
          <Text style={styles.headerSubtitle}>Buy instant data on Bellaj Data Hub</Text>
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
            <MaterialCommunityIcons name="wifi" size={34} color={COLORS.white} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Data Top-up Center</Text>
            <Text style={styles.heroText}>
              Select network, enter customer number, choose data quantity and complete
              purchase in real time.
            </Text>
          </View>
        </View>

        {isAdmin && (
          <View style={styles.adminPanel}>
            <View style={styles.adminHeader}>
              <MaterialCommunityIcons
                name="shield-account-outline"
                size={24}
                color={COLORS.primary}
              />
              <View>
                <Text style={styles.adminTitle}>Admin Pricing Control</Text>
                <Text style={styles.adminSubText}>
                  Current rate: ₦{Number(pricePerGb).toLocaleString()} per GB
                </Text>
              </View>
            </View>

            <View style={styles.adminRow}>
              <View style={styles.adminInputWrapper}>
                <TextInput
                  style={styles.adminInput}
                  placeholder="New rate"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={newRate}
                  onChangeText={setNewRate}
                />
              </View>

              <TouchableOpacity
                style={styles.updateBtn}
                onPress={handleUpdateRate}
                disabled={rateLoading}
                activeOpacity={0.86}
              >
                {rateLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.updateBtnText}>UPDATE</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Network</Text>

          <View style={styles.netGrid}>
            {networks.map((net) => {
              const isSelected = selectedNet === net.id;

              return (
                <TouchableOpacity
                  key={net.id}
                  style={[
                    styles.netBox,
                    isSelected && {
                      borderColor: net.color,
                      backgroundColor: COLORS.white,
                    },
                  ]}
                  onPress={() => setSelectedNet(net.id)}
                  activeOpacity={0.86}
                >
                  <View
                    style={[
                      styles.netIcon,
                      { backgroundColor: isSelected ? net.color : COLORS.light },
                    ]}
                  >
                    <Text
                      style={[
                        styles.netIconText,
                        { color: isSelected ? COLORS.dark : COLORS.muted },
                      ]}
                    >
                      {net.name.charAt(0)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.netText,
                      { color: isSelected ? COLORS.dark : COLORS.muted },
                    ]}
                  >
                    {net.name}
                  </Text>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.secondary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Details</Text>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="08012345678"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>

          <Text style={styles.label}>Data Quantity</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="database-plus-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. 5"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={gbAmount}
              onChangeText={setGbAmount}
            />
            <Text style={styles.unitText}>GB</Text>
          </View>

          <View style={styles.quickRow}>
            {quickGB.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.quickBtn, gbAmount === val && styles.activeQuickBtn]}
                onPress={() => setGbAmount(val)}
                activeOpacity={0.86}
              >
                <Text
                  style={[
                    styles.quickText,
                    gbAmount === val && styles.activeQuickText,
                  ]}
                >
                  {val}GB
                </Text>
              </TouchableOpacity>
            ))}
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
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              secureTextEntry
              value={pin}
              onChangeText={setPin}
              maxLength={4}
            />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>

          <SummaryRow label="Network" value={selectedNetwork?.name || "N/A"} />
          <SummaryRow label="Phone" value={phone || "Not entered"} />
          <SummaryRow label="Quantity" value={`${gbAmount || "0"}GB`} />
          <SummaryRow
            label="Rate"
            value={`₦${Number(pricePerGb || 0).toLocaleString()} / GB`}
          />
          <SummaryRow
            label="Total Cost"
            value={`₦${Number(totalPrice || 0).toLocaleString()}`}
            bold
          />
        </View>

        <TouchableOpacity
          style={[styles.buyBtn, loading && { opacity: 0.7 }]}
          onPress={handlePurchase}
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
              <Text style={styles.buyBtnText}>PROCEED TO PAYMENT</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const SummaryRow = ({ label, value, bold }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, bold && { color: COLORS.primary }]}>
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
  adminPanel: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  adminHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 13,
  },
  adminTitle: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 15,
  },
  adminSubText: {
    color: COLORS.muted,
    fontWeight: "600",
    fontSize: 12,
    marginTop: 2,
  },
  adminRow: { flexDirection: "row", gap: 10 },
  adminInputWrapper: {
    flex: 1,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    justifyContent: "center",
  },
  adminInput: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: COLORS.dark,
    fontWeight: "800",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 15,
    justifyContent: "center",
    minWidth: 95,
    alignItems: "center",
  },
  updateBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
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
  netGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  netBox: {
    width: "48%",
    minHeight: 95,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.light,
    padding: 13,
  },
  netIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  netIconText: { fontSize: 17, fontWeight: "900" },
  netText: {
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 9,
    color: "#475569",
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
    fontSize: 16,
    fontWeight: "800",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  unitText: {
    color: COLORS.muted,
    fontWeight: "900",
    fontSize: 14,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  quickBtn: {
    backgroundColor: COLORS.softRed,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeQuickBtn: { backgroundColor: COLORS.primary },
  quickText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 13,
  },
  activeQuickText: { color: COLORS.white },
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
  buyBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buyBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default BuyDataScreen;