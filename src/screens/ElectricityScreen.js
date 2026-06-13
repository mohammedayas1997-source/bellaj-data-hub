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
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
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
  verifyMeter: `${BASE_URL}/electricity/verify`,
  electricityPayment: `${BASE_URL}/electricity/pay`,
  getServiceCharge: `${BASE_URL}/electricity/service-charge`,
  updateServiceCharge: `${BASE_URL}/admin/electricity/service-charge`,
};

const allDiscos = [
  { label: "Abuja Electricity", value: "abuja-electric" },
  { label: "Eko Electricity", value: "eko-electric" },
  { label: "Ikeja Electricity", value: "ikeja-electric" },
  { label: "Kano Electricity", value: "kano-electric" },
  { label: "Port Harcourt", value: "portharcourt-electric" },
  { label: "Jos Electricity", value: "jos-electric" },
  { label: "Enugu Electricity", value: "enugu-electric" },
  { label: "Ibadan Electricity", value: "ibadan-electric" },
  { label: "Kaduna Electricity", value: "kaduna-electric" },
  { label: "Benin Electricity", value: "benin-electric" },
  { label: "Yola Electricity", value: "yola-electric" },
];

const ElectricityScreen = ({ navigation }) => {
  const [disco, setDisco] = useState("");
  const [meterNo, setMeterNo] = useState("");
  const [amount, setAmount] = useState("");
  const [meterType, setMeterType] = useState("prepaid");
  const [customerName, setCustomerName] = useState("");
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [paying, setPaying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fee, setFee] = useState(100);
  const [newFee, setNewFee] = useState("");

  const totalAmount = useMemo(() => {
    return Number(amount || 0) + Number(fee || 0);
  }, [amount, fee]);

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
      const user = await AsyncStorage.getItem("userData");

      if (user) {
        const parsed = JSON.parse(user);
        setIsAdmin(
          parsed?.role === "admin" ||
            parsed?.role === "superadmin" ||
            parsed?.role === "superAdmin"
        );
      }

      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.getServiceCharge, {
        headers,
      });

      const liveFee =
        data?.data?.charge ||
        data?.data?.serviceCharge ||
        data?.charge ||
        data?.serviceCharge;

      if (liveFee !== undefined && liveFee !== null) {
        setFee(Number(liveFee));
      }
    } catch (error) {
      console.log("Using default electricity charge");
    } finally {
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

  const handleAdminUpdate = async () => {
    if (!newFee.trim() || Number(newFee) < 0) {
      Alert.alert("Validation Error", "Enter a valid service charge.");
      return;
    }

    try {
      const headers = await getAuthHeaders();

      const { data } = await axios.post(
        API_ENDPOINTS.updateServiceCharge,
        {
          charge: Number(newFee),
          serviceCharge: Number(newFee),
        },
        { headers }
      );

      if (data?.success === false) {
        Alert.alert("Update Failed", data?.message || "Charge was not updated.");
        return;
      }

      setFee(Number(newFee));
      setNewFee("");

      Alert.alert("Bellaj Data Hub", "Electricity service charge updated.");
    } catch (error) {
      Alert.alert(
        "Update Failed",
        error?.response?.data?.message || "Could not update service charge."
      );
    }
  };

  const verifyMeter = async () => {
    if (!disco || !meterNo.trim()) {
      Alert.alert("Required", "Select DISCO and enter meter number.");
      return;
    }

    try {
      setVerifying(true);
      setCustomerName("");

      const headers = await getAuthHeaders();

      const { data } = await axios.post(
        API_ENDPOINTS.verifyMeter,
        {
          disco,
          meterNumber: meterNo.trim(),
          meterNo: meterNo.trim(),
          meterType,
        },
        { headers }
      );

      if (data?.success === false) {
        Alert.alert("Verification Failed", data?.message || "Meter verification failed.");
        return;
      }

      const name =
        data?.data?.customerName ||
        data?.data?.name ||
        data?.customerName ||
        data?.name ||
        "";

      if (!name) {
        Alert.alert("Verification Failed", "Customer name was not returned.");
        return;
      }

      setCustomerName(name);
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        error?.response?.data?.message || "Meter verification failed."
      );
    } finally {
      setVerifying(false);
    }
  };

  const validatePayment = () => {
    if (!customerName) {
      Alert.alert("Validation Error", "Verify meter details first.");
      return false;
    }

    if (Number(amount || 0) < 500) {
      Alert.alert("Validation Error", "Minimum electricity purchase is ₦500.");
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
      "Confirm Electricity Payment",
      `Pay ₦${Number(totalAmount).toLocaleString()} for ${customerName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pay Now",
          onPress: async () => {
            try {
              setPaying(true);

              const headers = await getAuthHeaders();

              const payload = {
                disco,
                meterNumber: meterNo.trim(),
                meterNo: meterNo.trim(),
                amount: Number(amount),
                fee: Number(fee),
                serviceCharge: Number(fee),
                totalAmount: Number(totalAmount),
                meterType,
                customerName,
                transactionPin: pin,
                pin,
              };

              const { data } = await axios.post(
                API_ENDPOINTS.electricityPayment,
                payload,
                { headers }
              );

              if (data?.success === false) {
                Alert.alert("Transaction Failed", data?.message || "Payment failed.");
                return;
              }

              const token =
                data?.data?.token ||
                data?.token ||
                data?.data?.meterToken ||
                data?.meterToken ||
                "N/A";

              const units = data?.data?.units || data?.units || "N/A";

              Alert.alert(
                "Purchase Successful",
                `Token: ${token}\nUnits: ${units}\nAmount: ₦${Number(amount).toLocaleString()}\nCharge: ₦${Number(fee).toLocaleString()}`,
                [
                  {
                    text: "Copy Token",
                    onPress: async () => {
                      await Clipboard.setStringAsync(String(token));
                      Alert.alert("Copied", "Token copied successfully.");
                    },
                  },
                  {
                    text: "View History",
                    onPress: () => navigation.navigate("SalesHistory"),
                  },
                  {
                    text: "Done",
                    onPress: () => {
                      setDisco("");
                      setMeterNo("");
                      setAmount("");
                      setCustomerName("");
                      setPin("");
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                "Transaction Failed",
                error?.response?.data?.message || "Electricity payment failed."
              );
            } finally {
              setPaying(false);
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
          <Text style={styles.headerTitle}>Electricity Payment</Text>
          <Text style={styles.headerSubtitle}>Verify meter and purchase token</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="lightning-bolt" size={34} color={COLORS.white} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Electricity Token Center</Text>
            <Text style={styles.heroText}>
              Select DISCO, verify meter account and complete electricity payment in real time.
            </Text>
          </View>
        </View>

        {isAdmin && (
          <View style={styles.adminPane}>
            <View style={styles.adminHeader}>
              <MaterialCommunityIcons name="shield-account-outline" size={24} color={COLORS.primary} />
              <View>
                <Text style={styles.adminTitle}>Admin Service Charge</Text>
                <Text style={styles.adminLabel}>
                  Current charge: ₦{Number(fee).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.adminRow}>
              <TextInput
                style={styles.adminInput}
                placeholder="New charge"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newFee}
                onChangeText={setNewFee}
              />

              <TouchableOpacity style={styles.adminUpdate} onPress={handleAdminUpdate}>
                <Text style={styles.adminUpdateText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Meter Classification</Text>

          <View style={styles.typeRow}>
            {["prepaid", "postpaid"].map((type) => {
              const active = meterType === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, active && styles.activeType]}
                  onPress={() => {
                    setMeterType(type);
                    setCustomerName("");
                  }}
                >
                  <MaterialCommunityIcons
                    name={type === "prepaid" ? "flash-outline" : "receipt-text-outline"}
                    size={22}
                    color={active ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[styles.typeText, active && styles.whiteText]}>
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Distribution Company</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {allDiscos.map((item) => {
              const active = disco === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.discoChip, active && styles.activeDisco]}
                  onPress={() => {
                    setDisco(item.value);
                    setCustomerName("");
                  }}
                >
                  <Text style={[styles.chipText, active && styles.whiteText]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Meter Details</Text>

          <Text style={styles.label}>Meter / Account Number</Text>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Enter meter number"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={meterNo}
              onChangeText={(val) => {
                setMeterNo(val);
                setCustomerName("");
              }}
            />

            <TouchableOpacity
              style={styles.inlineVerify}
              onPress={verifyMeter}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.inlineVerifyText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>

          {!!customerName && (
            <View style={styles.nameCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.secondary} />
              <View style={styles.nameDetails}>
                <Text style={styles.nameLabel}>Verified Customer</Text>
                <Text style={styles.nameValue}>{customerName}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <Text style={styles.label}>Amount</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="cash" size={22} color={COLORS.muted} />
            <TextInput
              style={styles.fullInput}
              placeholder="Minimum ₦500"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.unitText}>₦</Text>
          </View>

          <Text style={styles.label}>Transaction PIN</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={22} color={COLORS.muted} />
            <TextInput
              style={styles.fullInput}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>
          <SummaryRow label="DISCO" value={allDiscos.find((d) => d.value === disco)?.label || "Not selected"} />
          <SummaryRow label="Meter Type" value={meterType.toUpperCase()} />
          <SummaryRow label="Meter Number" value={meterNo || "Not entered"} />
          <SummaryRow label="Customer" value={customerName || "Not verified"} />
          <SummaryRow label="Amount" value={`₦${Number(amount || 0).toLocaleString()}`} />
          <SummaryRow label="Service Charge" value={`₦${Number(fee || 0).toLocaleString()}`} />
          <SummaryRow label="Total Payable" value={`₦${Number(totalAmount || 0).toLocaleString()}`} highlight />
        </View>

        <TouchableOpacity
          style={[styles.payBtn, paying && { opacity: 0.7 }]}
          onPress={handlePayment}
          disabled={paying}
        >
          {paying ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons name="send-check-outline" size={21} color={COLORS.white} />
              <Text style={styles.payBtnText}>
                PAY ₦{Number(totalAmount || 0).toLocaleString()}
              </Text>
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
  content: { padding: 16, paddingBottom: 80, flexGrow: 1 },
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
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminPane: {
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
  adminTitle: { color: COLORS.dark, fontWeight: "900", fontSize: 15 },
  adminLabel: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 2,
  },
  adminRow: { flexDirection: "row", gap: 10 },
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
  adminUpdate: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: "center",
    minWidth: 85,
    alignItems: "center",
  },
  adminUpdateText: { color: COLORS.white, fontWeight: "900", fontSize: 12 },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },
  typeRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  typeBtn: {
    flex: 1,
    minHeight: 75,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.light,
  },
  activeType: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeText: { color: COLORS.dark, fontWeight: "900", marginTop: 5 },
  whiteText: { color: COLORS.white },
  discoChip: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: COLORS.light,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeDisco: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  chipText: { color: COLORS.dark, fontWeight: "800", fontSize: 12 },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: "#475569",
    marginBottom: 9,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "800",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  inlineVerify: {
    backgroundColor: COLORS.primary,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 15,
    justifyContent: "center",
  },
  inlineVerifyText: { color: COLORS.white, fontWeight: "900" },
  nameCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softGreen,
    padding: 14,
    borderRadius: 15,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  nameDetails: { marginLeft: 10, flex: 1 },
  nameLabel: { color: COLORS.secondary, fontSize: 11, fontWeight: "900" },
  nameValue: { color: COLORS.secondary, fontWeight: "900", fontSize: 15 },
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
  fullInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "800",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  unitText: { color: COLORS.muted, fontWeight: "900", fontSize: 14 },
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
  summaryLabel: { color: COLORS.muted, fontWeight: "700" },
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

export default ElectricityScreen;