import React, { useMemo, useState, useEffect } from "react";
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
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#DCFCE7",
  softRed: "#FEE2E2",
  danger: "#DC2626",
  card: "#FFFFFF",
};

// TSARIN TELECOM NETWORKS TARE DA AINIHIN NETWORK IDs (API STANDARDS)
const NETWORKS = [
  { id: 1, networkId: 1, code: "MTN", name: "MTN", color: "#FFCC00", textColor: "#000000" },
  { id: 2, networkId: 2, code: "GLO", name: "GLO", color: "#2ECC71", textColor: "#FFFFFF" },
  { id: 3, networkId: 3, code: "9MOBILE", name: "9Mobile", color: "#006600", textColor: "#FFFFFF" },
  { id: 4, networkId: 4, code: "AIRTEL", name: "Airtel", color: "#E74C3C", textColor: "#FFFFFF" },
];

const quickAmounts = ["100", "200", "500", "1000", "2000", "5000"];

const AirtimeScreen = ({ navigation }) => {
  const [selectedNetworkId, setSelectedNetworkId] = useState(1); // Default: MTN (ID: 1)
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  const selectedNetwork = useMemo(
    () => NETWORKS.find((net) => net.networkId === selectedNetworkId) || NETWORKS[0],
    [selectedNetworkId]
  );

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 25000,
    };
  };

  const loadWalletBalance = async () => {
    try {
      const config = await getAuthHeaders();
      const res = await axios.get(`${BASE_URL}/users/profile`, config).catch(async () => {
        return await axios.get(`${BASE_URL}/api/v1/users/me`, config);
      });

      if (res?.data?.user) {
        const u = res.data.user;
        setWalletBalance(Number(u.walletBalance || u.balance || 0));
      }
    } catch {
      // Ignore
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletBalance();
  };

  const validateForm = () => {
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const numericAmount = Number(amount);

    if (!cleanPhone || !amount.trim()) {
      Alert.alert("Validation Error", "Please provide recipient phone number and recharge amount.");
      return false;
    }

    if (!/^0\d{10}$/.test(cleanPhone)) {
      Alert.alert("Invalid Phone Number", "Enter a valid 11-digit phone number (e.g. 08012345678).");
      return false;
    }

    if (!numericAmount || numericAmount < 50) {
      Alert.alert("Invalid Amount", "Minimum airtime purchase is ₦50.");
      return false;
    }

    if (pin.length !== 4) {
      Alert.alert("Security PIN", "Enter your 4-digit transaction PIN.");
      return false;
    }

    if (walletBalance < numericAmount) {
      Alert.alert(
        "Insufficient Balance",
        `Your wallet balance (₦${walletBalance.toLocaleString()}) is insufficient for this purchase of ₦${numericAmount.toLocaleString()}.`
      );
      return false;
    }

    return true;
  };

  const handleAirtimePurchase = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Confirm Airtime Purchase",
      `Buy ₦${Number(amount).toLocaleString()} ${selectedNetwork?.name} (Network ID: ${selectedNetwork?.networkId}) airtime for ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purchase Now",
          onPress: async () => {
            try {
              setLoading(true);
              const config = await getAuthHeaders();

              // PAYLOAD MAI NETWORK ID DA TELECOM SPECIFICATIONS
              const payload = {
                networkId: selectedNetwork.networkId,
                network_id: selectedNetwork.networkId,
                network: selectedNetwork.networkId,
                networkCode: selectedNetwork.code,
                networkName: selectedNetwork.name,
                phoneNumber: phone.trim().replace(/\s+/g, ""),
                phone: phone.trim().replace(/\s+/g, ""),
                amount: Number(amount),
                transactionPin: pin.trim(),
                pin: pin.trim(),
              };

              const endpoints = [
                `${BASE_URL}/airtime/buy`,
                `${BASE_URL}/api/v1/airtime/buy`,
                `${BASE_URL}/airtime/purchase`,
              ];

              let result = null;
              let errMsg = "";

              for (const url of endpoints) {
                try {
                  const res = await axios.post(url, payload, config);
                  if (res?.status === 200 || res?.status === 201 || res?.data?.success) {
                    result = res.data;
                    break;
                  }
                } catch (err) {
                  errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
                  if (err.response?.status === 400 || err.response?.status === 401) {
                    throw new Error(errMsg);
                  }
                }
              }

              if (!result && errMsg) {
                throw new Error(errMsg);
              }

              Alert.alert(
                "Recharge Successful! 🎉",
                `₦${Number(amount).toLocaleString()} ${selectedNetwork.name} airtime dispatched to ${phone}.`,
                [
                  {
                    text: "View Ledger",
                    onPress: () => navigation.navigate("SalesHistory"),
                  },
                  {
                    text: "OK",
                    onPress: () => {
                      setPhone("");
                      setAmount("");
                      setPin("");
                      loadWalletBalance();
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert("Transaction Failed", error.message || "Airtime recharge could not be completed.");
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

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Buy Airtime</Text>
          <Text style={styles.headerSubtitle}>Instant telecom VTU recharge</Text>
        </View>

        <View style={styles.walletBadge}>
          <Ionicons name="wallet-outline" size={14} color="#86EFAC" />
          <Text style={styles.walletBadgeText}>₦{walletBalance.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* HERO CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="cellphone-wireless" size={32} color={COLORS.white} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Airtime Dispatch Matrix</Text>
            <Text style={styles.heroText}>
              Select network provider by Network ID, enter destination MSISDN, and complete recharge.
            </Text>
          </View>
        </View>

        {/* 1. NETWORK SELECTION WITH NETWORK ID */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Select Network Provider (Network ID)</Text>

          <View style={styles.netGrid}>
            {NETWORKS.map((net) => {
              const isSelected = selectedNetworkId === net.networkId;

              return (
                <TouchableOpacity
                  key={net.id}
                  style={[
                    styles.netBox,
                    isSelected && {
                      borderColor: net.color,
                      backgroundColor: "#F0FDF4",
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedNetworkId(net.networkId)}
                  activeOpacity={0.86}
                >
                  <View style={[styles.netIcon, { backgroundColor: net.color }]}>
                    <Text style={[styles.netIconText, { color: net.textColor }]}>
                      {net.name.charAt(0)}
                    </Text>
                  </View>

                  <Text style={[styles.netText, isSelected && { color: COLORS.primary, fontWeight: "900" }]}>
                    {net.name}
                  </Text>

                  <Text style={styles.netIdTag}>ID: {net.networkId}</Text>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.secondary}
                      style={{ position: "absolute", top: 8, right: 8 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. RECHARGE DETAILS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Beneficiary & Amount</Text>

          <Text style={styles.label}>Recipient Mobile Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="08012345678"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>

          <Text style={styles.label}>Recharge Amount (₦)</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="cash" size={20} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="Min ₦50"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.unitText}>₦</Text>
          </View>

          <View style={styles.quickAmountRow}>
            {quickAmounts.map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.quickBtn, amount === val && styles.activeQuickBtn]}
                onPress={() => setAmount(val)}
                activeOpacity={0.86}
              >
                <Text style={[styles.quickText, amount === val && styles.activeQuickText]}>
                  ₦{val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 8 }]}>4-Digit Transaction PIN</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.muted} />
            <TextInput
              style={styles.input}
              placeholder="Enter PIN"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              secureTextEntry
              value={pin}
              onChangeText={setPin}
              maxLength={4}
            />
          </View>
        </View>

        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Breakdown</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network:</Text>
            <Text style={styles.summaryValue}>
              {selectedNetwork?.name} (Network ID: {selectedNetwork?.networkId})
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Recipient:</Text>
            <Text style={styles.summaryValue}>{phone || "Not specified"}</Text>
          </View>

          <View style={[styles.summaryRow, { borderBottomWidth: 0, marginTop: 4 }]}>
            <Text style={[styles.summaryLabel, { fontWeight: "900", color: COLORS.dark }]}>Total Payable:</Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary, fontSize: 18 }]}>
              ₦{Number(amount || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* PURCHASE BUTTON */}
        <TouchableOpacity
          style={[styles.buyBtn, loading && { opacity: 0.7 }]}
          onPress={handleAirtimePurchase}
          disabled={loading}
          activeOpacity={0.86}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="send-check-outline" size={21} color={COLORS.white} />
              <Text style={styles.buyBtnText}>
                {amount ? `RECHARGE ₦${Number(amount).toLocaleString()}` : "PROCEED TO RECHARGE"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 44 : 22,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  headerSubtitle: { color: "#DCFCE7", fontSize: 11, fontWeight: "600", marginTop: 2 },
  walletBadge: {
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  walletBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 90 },

  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTitle: { color: COLORS.dark, fontSize: 16, fontWeight: "900" },
  heroText: { color: COLORS.muted, marginTop: 4, lineHeight: 18, fontSize: 12 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.dark, fontSize: 13.5, fontWeight: "900", marginBottom: 12 },
  netGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  netBox: {
    width: "23.5%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.light,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  netIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  netIconText: { fontSize: 16, fontWeight: "900" },
  netText: { fontSize: 11.5, fontWeight: "800", color: COLORS.muted },
  netIdTag: { fontSize: 9.5, color: COLORS.muted, marginTop: 2, fontWeight: "700" },

  label: { fontSize: 11.5, fontWeight: "800", color: COLORS.muted, marginBottom: 5, marginTop: 4 },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 48,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "700",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  unitText: { color: COLORS.muted, fontWeight: "900", fontSize: 14 },
  quickAmountRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  quickBtn: {
    backgroundColor: COLORS.light,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeQuickBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickText: { color: COLORS.muted, fontWeight: "800", fontSize: 12 },
  activeQuickText: { color: COLORS.white },

  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  summaryTitle: { fontSize: 13, fontWeight: "900", color: COLORS.dark, marginBottom: 8 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  summaryLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  summaryValue: { fontSize: 12.5, color: COLORS.dark, fontWeight: "800" },

  buyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    elevation: 3,
  },
  buyBtnText: { color: COLORS.white, fontSize: 14, fontWeight: "900", letterSpacing: 0.5 },
});

export default AirtimeScreen;