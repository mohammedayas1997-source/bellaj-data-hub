import React, { useState, useEffect } from "react";
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
  Clipboard,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#94A3B8",
  card: "#1E293B",
  border: "#334155",
  softRed: "rgba(230, 0, 0, 0.14)",
  softGreen: "rgba(11, 94, 60, 0.18)",
};

const API_ENDPOINTS = {
  verifyMeter: "",
  electricityPayment: "",
};

const allDiscos = [
  { label: "Abuja Electricity (AEDC)", value: "abuja-electric" },
  { label: "Eko Electricity (EKEDC)", value: "eko-electric" },
  { label: "Ikeja Electricity (IKEDC)", value: "ikeja-electric" },
  { label: "Kano Electricity (KEDCO)", value: "kano-electric" },
  { label: "Port Harcourt (PHED)", value: "portharcourt-electric" },
  { label: "Jos Electricity (JED)", value: "jos-electric" },
  { label: "Enugu Electricity (EEDC)", value: "enugu-electric" },
  { label: "Ibadan Electricity (IBEDC)", value: "ibadan-electric" },
  { label: "Kaduna Electricity (KAEDCO)", value: "kaduna-electric" },
  { label: "Benin Electricity (BEDC)", value: "benin-electric" },
  { label: "Yola Electricity (YEDC)", value: "yola-electric" },
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [fee, setFee] = useState(100);
  const [newFee, setNewFee] = useState("");

  useEffect(() => {
    const checkRole = async () => {
      const user = await AsyncStorage.getItem("userData");

      if (user) {
        const parsed = JSON.parse(user);
        setIsAdmin(parsed?.role === "admin");
      }
    };

    checkRole();
  }, []);

  const handleAdminUpdate = () => {
    if (!newFee.trim()) return;

    setFee(parseInt(newFee, 10));
    setNewFee("");

    Alert.alert("Admin", "Global service charge updated.");
  };

  const verifyMeter = async () => {
    if (!disco || !meterNo.trim()) {
      Alert.alert("Required", "Select DISCO and enter Meter Number.");
      return;
    }

    if (!API_ENDPOINTS.verifyMeter) {
      Alert.alert(
        "Not Configured",
        "Meter verification API is not configured.",
      );
      return;
    }

    setVerifying(true);
    setCustomerName("");

    try {
      const token = await AsyncStorage.getItem("userToken");

      const res = await axios.post(
        API_ENDPOINTS.verifyMeter,
        {
          disco,
          meterNumber: meterNo.trim(),
          meterType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        setCustomerName(res.data.name);
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    if (!customerName) {
      Alert.alert("Error", "Verify meter details first.");
      return;
    }

    if (parseInt(amount || 0, 10) < 500) {
      Alert.alert("Error", "Minimum purchase is ₦500.");
      return;
    }

    if (pin.length < 4) {
      Alert.alert("Error", "Enter your Transaction PIN.");
      return;
    }

    if (!API_ENDPOINTS.electricityPayment) {
      Alert.alert(
        "Not Configured",
        "Electricity payment API is not configured.",
      );
      return;
    }

    setPaying(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      const res = await axios.post(
        API_ENDPOINTS.electricityPayment,
        {
          disco,
          meterNumber: meterNo.trim(),
          amount,
          fee,
          meterType,
          transactionPin: pin,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data.success) {
        Alert.alert(
          "Purchase Successful",
          `Token: ${res.data.token}\nUnits: ${res.data.units}\n\nAmount: ₦${amount}\nCharge: ₦${fee}`,
          [
            {
              text: "Copy Token",
              onPress: () => Clipboard.setString(res.data.token),
            },
            { text: "Done", onPress: () => navigation.goBack() },
          ],
        );
      }
    } catch (e) {
      Alert.alert("Failed", e.response?.data?.message || "Transaction Error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
      </TouchableOpacity>

      <Text style={styles.header}>Electricity Payment</Text>

      {isAdmin && (
        <View style={styles.adminPane}>
          <Text style={styles.adminLabel}>Admin Settings: Service Fee (₦)</Text>

          <View style={styles.adminRow}>
            <TextInput
              style={styles.adminInput}
              placeholder={fee.toString()}
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              value={newFee}
              onChangeText={setNewFee}
            />

            <TouchableOpacity
              style={styles.adminUpdate}
              onPress={handleAdminUpdate}
            >
              <Text style={styles.adminUpdateText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.label}>Select Meter Classification</Text>

      <View style={styles.typeRow}>
        {["prepaid", "postpaid"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, meterType === t && styles.activeType]}
            onPress={() => {
              setMeterType(t);
              setCustomerName("");
            }}
          >
            <Text
              style={[styles.typeText, meterType === t && styles.whiteText]}
            >
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Distribution Company (DISCO)</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.discoRow}
      >
        {allDiscos.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.discoChip,
              disco === item.value && styles.activeDisco,
            ]}
            onPress={() => {
              setDisco(item.value);
              setCustomerName("");
            }}
          >
            <Text
              style={[
                styles.chipText,
                disco === item.value && styles.whiteText,
              ]}
            >
              {item.label.split(" (")[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Meter / Account Number</Text>

      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Enter ID Number"
          placeholderTextColor="#64748B"
          keyboardType="numeric"
          value={meterNo}
          onChangeText={setMeterNo}
        />

        <TouchableOpacity
          style={styles.inlineVerify}
          onPress={verifyMeter}
          disabled={verifying}
        >
          {verifying ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.whiteText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>

      {customerName ? (
        <View style={styles.nameCard}>
          <Ionicons name="flash" size={20} color={COLORS.primary} />

          <View style={styles.nameDetails}>
            <Text style={styles.nameLabel}>Verified Customer</Text>
            <Text style={styles.nameValue}>{customerName}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.billingRow}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.label}>Amount (₦)</Text>

          <TextInput
            style={styles.input}
            placeholder="500+"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Charge (₦)</Text>

          <TextInput
            style={[styles.input, { opacity: 0.8 }]}
            value={fee.toString()}
            editable={false}
          />
        </View>
      </View>

      <Text style={styles.label}>Transaction PIN</Text>

      <TextInput
        style={styles.input}
        placeholder="****"
        placeholderTextColor="#64748B"
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />

      <TouchableOpacity
        style={[styles.payBtn, paying && { opacity: 0.7 }]}
        onPress={handlePayment}
        disabled={paying}
      >
        {paying ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.whiteText}>
            CONFIRM & PAY ₦{(parseInt(amount || 0, 10) + fee).toLocaleString()}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    paddingHorizontal: 20,
  },
  backBtn: {
    marginTop: 50,
    marginBottom: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 30,
  },
  adminPane: {
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  adminLabel: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
  },
  adminRow: {
    flexDirection: "row",
  },
  adminInput: {
    flex: 1,
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminUpdate: {
    backgroundColor: COLORS.primary,
    marginLeft: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: "center",
  },
  adminUpdateText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.muted,
    marginBottom: 8,
    marginTop: 15,
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeBtn: {
    width: "48%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.card,
  },
  activeType: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeText: {
    color: COLORS.muted,
    fontWeight: "bold",
  },
  discoRow: {
    flexDirection: "row",
  },
  discoChip: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeDisco: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  chipText: {
    color: COLORS.muted,
    fontWeight: "bold",
    fontSize: 13,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.white,
    fontSize: 16,
  },
  inlineVerify: {
    backgroundColor: COLORS.primary,
    height: 58,
    paddingHorizontal: 25,
    borderRadius: 12,
    justifyContent: "center",
    marginLeft: 10,
  },
  nameCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softGreen,
    padding: 18,
    borderRadius: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  nameDetails: {
    marginLeft: 15,
  },
  nameLabel: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "bold",
  },
  nameValue: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  payBtn: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 35,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    elevation: 10,
  },
  whiteText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ElectricityScreen;
