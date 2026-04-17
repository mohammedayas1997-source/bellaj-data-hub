import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Dukkan DISCOs na Najeriya (36 States Coverage)
const allDiscos = [
  { label: "Abuja Electricity (AEDC)", value: "01" },
  { label: "Eko Electricity (EKEDC)", value: "02" },
  { label: "Ikeja Electricity (IKEDC)", value: "03" },
  { label: "Kano Electricity (KEDCO)", value: "04" },
  { label: "Port Harcourt (PHED)", value: "05" },
  { label: "Jos Electricity (JED)", value: "06" },
  { label: "Enugu Electricity (EEDC)", value: "07" },
  { label: "Ibadan Electricity (IBEDC)", value: "08" },
  { label: "Kaduna Electricity (KAEDCO)", value: "09" },
  { label: "Benin Electricity (BEDC)", value: "10" },
  { label: "Yola Electricity (YEDC)", value: "11" },
];

const ElectricityScreen = () => {
  const [disco, setDisco] = useState("");
  const [meterNo, setMeterNo] = useState("");
  const [amount, setAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [paying, setPaying] = useState(false);

  const verifyMeter = async () => {
    if (!disco) return Alert.alert("Error", "Please select a DISCO");
    if (meterNo.length < 5)
      return Alert.alert("Error", "Enter a valid Meter Number");

    setVerifying(true);
    setCustomerName("");
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/vtu/verify-meter",
        { disco, meterNumber: meterNo, meterType: "01" }, // 01 for Prepaid
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        setCustomerName(res.data.name);
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Meter not found");
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    if (!customerName || !amount)
      return Alert.alert("Error", "Verify meter and enter amount");

    setPaying(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/vtu/electricity",
        { disco, meterNumber: meterNo, amount, meterType: "01" },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        Alert.alert(
          "Payment Successful",
          `Token: ${res.data.token || "Check History"}`,
        );
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Payment Failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Pay Electricity Bill</Text>

      <Text style={styles.label}>Select Your DISCO/Region:</Text>
      <View style={styles.discoContainer}>
        {allDiscos.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.discoItem,
              disco === item.value && styles.activeDisco,
            ]}
            onPress={() => {
              setDisco(item.value);
              setCustomerName("");
            }}
          >
            <Text
              style={disco === item.value ? styles.whiteText : styles.grayText}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Enter Meter Number"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={meterNo}
          onChangeText={setMeterNo}
        />

        <TouchableOpacity style={styles.verifyBtn} onPress={verifyMeter}>
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.whiteText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>

      {customerName ? (
        <View style={styles.nameContainer}>
          <Text style={styles.nameLabel}>Customer Details Found:</Text>
          <Text style={styles.nameValue}>{customerName}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Amount (₦)"
        placeholderTextColor="#94a3b8"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity
        style={styles.payBtn}
        onPress={handlePayment}
        disabled={paying}
      >
        {paying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.whiteText}>PROCEED TO PAY</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#38bdf8",
    marginBottom: 20,
  },
  label: { fontWeight: "bold", marginBottom: 12, color: "#f8fafc" },
  discoContainer: { marginBottom: 20 },
  discoItem: {
    padding: 15,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  activeDisco: { backgroundColor: "#1e3a8a", borderColor: "#38bdf8" },
  inputWrapper: { marginBottom: 15 },
  input: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
    color: "#fff",
    fontSize: 16,
  },
  verifyBtn: {
    backgroundColor: "#0ea5e9",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  payBtn: {
    backgroundColor: "#1d4ed8",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#38bdf8",
    shadowOpacity: 0.3,
    elevation: 8,
  },
  whiteText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  grayText: { color: "#94a3b8", fontWeight: "600" },
  nameContainer: {
    backgroundColor: "#064e3b",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: "#22c55e",
  },
  nameLabel: { color: "#86efac", fontSize: 12, marginBottom: 5 },
  nameValue: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default ElectricityScreen;
