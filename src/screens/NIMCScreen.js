import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NIMCScreen = () => {
  const [nin, setNin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleValidate = async () => {
    if (nin.length !== 11) {
      return Alert.alert("Error", "NIN must be 11 digits.");
    }

    setLoading(true);
    setResult(null);

    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/vtu/nimc-validate",
        { nin },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (error) {
      Alert.alert(
        "Validation Failed",
        error.response?.data?.message || "Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerText}>NIMC Verification</Text>
      <Text style={styles.subText}>
        Validate and verify NIN details instantly.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>National Identification Number (NIN)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter 11 digit NIN"
          keyboardType="numeric"
          maxLength={11}
          value={nin}
          onChangeText={setNin}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleValidate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>VERIFY NOW (₦1,000)</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Verification Details</Text>
          <DetailRow label="Full Name" value={result.fullname || "N/A"} />
          <DetailRow label="DOB" value={result.dob || "N/A"} />
          <DetailRow label="Gender" value={result.gender || "N/A"} />
          <DetailRow label="Address" value={result.address || "N/A"} />
        </View>
      )}
    </ScrollView>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 20 },
  headerText: { fontSize: 24, fontWeight: "bold", color: "#1e3a8a" },
  subText: { fontSize: 14, color: "#64748b", marginBottom: 20 },
  card: {
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 2,
  },
  btn: {
    backgroundColor: "#1e3a8a",
    padding: 18,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  resultCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#eff6ff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
    paddingBottom: 5,
  },
  detailLabel: { flex: 1, fontWeight: "bold", color: "#475569" },
  detailValue: { flex: 2, color: "#1e293b" },
});

export default NIMCScreen;
