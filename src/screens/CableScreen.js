import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

const CableScreen = () => {
  const [provider, setProvider] = useState("GOTV");
  const [smartCard, setSmartCard] = useState("");

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Zabi Mai Kawo Sabis (Provider):</Text>
      <View style={styles.row}>
        {["GOTV", "DSTV", "STARTIMES"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, provider === item && styles.activeChip]}
            onPress={() => setProvider(item)}
          >
            <Text
              style={provider === item ? styles.whiteText : styles.blackText}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="IUC / Smartcard Number"
        keyboardType="numeric"
        onChangeText={setSmartCard}
      />

      <TouchableOpacity style={styles.verifyBtn}>
        <Text style={styles.whiteText}>Tantance Suna (Validate)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.payBtn}>
        <Text style={styles.whiteText}>BIYA YANZU</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 10,
  },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 20 },
  label: { fontWeight: "bold", marginBottom: 10, marginTop: 10 },
  input: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#1e3a8a",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  chip: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
  },
  activeChip: { backgroundColor: "#1e3a8a", borderColor: "#1e3a8a" },
  whiteText: { color: "#fff", fontWeight: "bold" },
  blackText: { color: "#000" },
  verifyBtn: {
    backgroundColor: "#64748b",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  payBtn: {
    backgroundColor: "#1e3a8a",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  resultBox: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#f0f9ff",
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#0ea5e9",
  },
  resultText: { fontSize: 16, fontWeight: "600", marginBottom: 5 },
  downloadBtn: {
    marginTop: 15,
    backgroundColor: "#0ea5e9",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  downloadText: { color: "#fff", fontWeight: "bold" },
});

export default CableScreen;
