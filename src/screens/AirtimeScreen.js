import React, { useState } from "react";
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
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
};

const API_ENDPOINTS = {
  buyAirtime: "",
};

const networks = [
  { id: "01", name: "MTN", color: "#FFCC00" },
  { id: "02", name: "GLO", color: "#2ECC71" },
  { id: "04", name: "Airtel", color: "#E74C3C" },
  { id: "03", name: "9Mobile", color: "#006600" },
];

const AirtimeScreen = () => {
  const [selectedNet, setSelectedNet] = useState("01");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAirtimePurchase = async () => {
    if (!phone.trim() || !amount.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (phone.length < 11) {
      Alert.alert("Error", "Enter a valid 11-digit phone number.");
      return;
    }

    if (parseInt(amount, 10) < 50) {
      Alert.alert("Error", "Minimum airtime is ₦50.");
      return;
    }

    if (!API_ENDPOINTS.buyAirtime) {
      Alert.alert("Not Configured", "Buy airtime API is not configured.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await axios.post(
        API_ENDPOINTS.buyAirtime,
        {
          network: selectedNet,
          phoneNumber: phone.trim(),
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        Alert.alert("Bellaj Data Hub", `₦${amount} airtime sent to ${phone}`);

        setPhone("");
        setAmount("");
      }
    } catch (error) {
      Alert.alert(
        "Failed",
        error.response?.data?.message || "Transaction could not be completed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <Text style={styles.headerText}>Buy Airtime</Text>
      <Text style={styles.subHeader}>
        Recharge instantly with Bellaj Data Hub
      </Text>

      <Text style={styles.label}>Select Network</Text>

      <View style={styles.netGrid}>
        {networks.map((net) => {
          const isSelected = selectedNet === net.id;

          return (
            <TouchableOpacity
              key={net.id}
              style={[
                styles.netBox,
                {
                  backgroundColor: isSelected ? net.color : COLORS.light,
                  borderColor: isSelected ? COLORS.primary : COLORS.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedNet(net.id)}
            >
              <Text
                style={[
                  styles.netText,
                  { color: isSelected ? COLORS.dark : COLORS.muted },
                ]}
              >
                {net.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>Phone Number</Text>

      <TextInput
        style={styles.input}
        placeholder="08012345678"
        placeholderTextColor="#CBD5E1"
        keyboardType="numeric"
        value={phone}
        onChangeText={setPhone}
        maxLength={11}
      />

      <Text style={styles.label}>Amount (₦)</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. 100"
        placeholderTextColor="#CBD5E1"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <View style={styles.quickAmountRow}>
        {["100", "200", "500", "1000"].map((val) => (
          <TouchableOpacity
            key={val}
            style={[styles.quickBtn, amount === val && styles.activeQuickBtn]}
            onPress={() => setAmount(val)}
          >
            <Text
              style={[
                styles.quickText,
                amount === val && styles.activeQuickText,
              ]}
            >
              ₦{val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.buyBtn, loading && { opacity: 0.7 }]}
        onPress={handleAirtimePurchase}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buyBtnText}>BUY AIRTIME</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 20,
  },
  subHeader: {
    color: COLORS.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 25,
    color: "#475569",
  },
  netGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  netBox: {
    width: "22%",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  netText: {
    fontWeight: "800",
    fontSize: 12,
  },
  input: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    color: COLORS.dark,
    marginBottom: 5,
  },
  quickAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  quickBtn: {
    backgroundColor: COLORS.softRed,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeQuickBtn: {
    backgroundColor: COLORS.primary,
  },
  quickText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 13,
  },
  activeQuickText: {
    color: COLORS.white,
  },
  buyBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 40,
    elevation: 4,
  },
  buyBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default AirtimeScreen;
