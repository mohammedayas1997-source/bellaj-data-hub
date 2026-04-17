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

const networks = [
  { id: "01", name: "MTN", color: "#FFCC00" },
  { id: "02", name: "GLO", color: "#2ecc71" },
  { id: "04", name: "Airtel", color: "#e74c3c" },
  { id: "03", name: "9Mobile", color: "#006600" },
];

const AirtimeScreen = () => {
  const [selectedNet, setSelectedNet] = useState("01");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAirtimePurchase = async () => {
    if (!phone || !amount) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    if (parseInt(amount) < 50) {
      return Alert.alert("Error", "Minimum airtime is ₦50");
    }

    setLoading(true);
    try {
      // Get the token for the 'protect' middleware
      const token = await AsyncStorage.getItem("userToken");

      const response = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/vtu/buy-airtime",
        {
          network: selectedNet,
          phoneNumber: phone, // Matches backend controller
          amount: amount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Required for protected routes
          },
        },
      );

      if (response.data.success) {
        Alert.alert("Success!", `₦${amount} airtime sent to ${phone}`);
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
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Text style={styles.headerText}>Buy Airtime</Text>

      {/* Network Selection */}
      <Text style={styles.label}>Select Network</Text>
      <View style={styles.netGrid}>
        {networks.map((net) => (
          <TouchableOpacity
            key={net.id}
            style={[
              styles.netBox,
              {
                backgroundColor: selectedNet === net.id ? net.color : "#f8fafc",
                borderColor: selectedNet === net.id ? "#1e3a8a" : "#f1f5f9",
                borderWidth: selectedNet === net.id ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedNet(net.id)}
          >
            <Text
              style={[
                styles.netText,
                { color: selectedNet === net.id ? "#000" : "#64748b" },
              ]}
            >
              {net.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Phone Number */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="08012345678"
        placeholderTextColor="#cbd5e1"
        keyboardType="numeric"
        value={phone}
        onChangeText={setPhone}
      />

      {/* Amount Input */}
      <Text style={styles.label}>Amount (₦)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 100"
        placeholderTextColor="#cbd5e1"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      {/* Quick Selection Amounts */}
      <View style={styles.quickAmountRow}>
        {["100", "200", "500", "1000"].map((val) => (
          <TouchableOpacity
            key={val}
            style={styles.quickBtn}
            onPress={() => setAmount(val)}
          >
            <Text style={styles.quickText}>₦{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.buyBtn, { opacity: loading ? 0.7 : 1 }]}
        onPress={handleAirtimePurchase}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buyBtnText}>BUY AIRTIME</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 20 },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 25,
    color: "#475569",
  },
  netGrid: { flexDirection: "row", justifyContent: "space-between" },
  netBox: {
    width: "22%",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  netText: { fontWeight: "800", fontSize: 12 },
  input: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    color: "#1e293b",
    marginBottom: 5,
  },
  quickAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  quickBtn: {
    backgroundColor: "#eff6ff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  quickText: { color: "#1e3a8a", fontWeight: "bold", fontSize: 13 },
  buyBtn: {
    backgroundColor: "#1e3a8a",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 40,
    elevation: 4,
  },
  buyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default AirtimeScreen;
