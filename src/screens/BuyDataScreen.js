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
} from "react-native";
import axios from "axios";

// 1. Bayanan Network (Modern Colors)
const networks = [
  { id: "01", name: "MTN", color: "#FFCC00" },
  { id: "02", name: "GLO", color: "#2ecc71" },
  { id: "04", name: "Airtel", color: "#e74c3c" },
  { id: "03", name: "9Mobile", color: "#006600" },
];

const dataBundles = {
  "01": [
    { id: "1001", label: "MTN SME 500MB - ₦150", price: 150 },
    { id: "1002", label: "MTN SME 1GB - ₦280", price: 280 },
    { id: "1003", label: "MTN SME 2GB - ₦560", price: 560 },
  ],
  "02": [
    { id: "2001", label: "GLO 1GB - ₦250", price: 250 },
    { id: "2002", label: "GLO 2.9GB - ₦500", price: 500 },
  ],
  "04": [{ id: "4001", label: "Airtel 1.5GB - ₦500", price: 500 }],
  "03": [{ id: "3001", label: "9Mobile 1GB - ₦300", price: 300 }],
};

const BuyDataScreen = () => {
  const [selectedNet, setSelectedNet] = useState("01");
  const [phone, setPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("user");

  const currentPlans = dataBundles[selectedNet] || [];

  const handlePurchase = async () => {
    if (!phone || !selectedPlan) {
      return Alert.alert(
        "Error",
        "Please enter phone number and select a plan.",
      );
    }

    const dataPlans = [
      { id: 1, size: "1GB", userPrice: 300, agentPrice: 240 },
      { id: 2, size: "2GB", userPrice: 600, agentPrice: 480 },
    ];

    const planDetails = currentPlans.find((p) => p.id === selectedPlan);

    setLoading(true);
    try {
      // Mun sauya link din nan ya koma zuwa ainihin API dinka na Vercel
      const response = await axios.post(
        "https://ayax-data-xpress-server.vercel.app/api/v1/vtu/buy-data",
        {
          network: selectedNet,
          planId: selectedPlan,
          phoneNumber: phone,
          amount: planDetails.price,
        },
      );

      if (response.data.success) {
        Alert.alert("Success!", "Data purchase successful.");
        setPhone("");
        setSelectedPlan("");
      }
    } catch (error) {
      Alert.alert(
        "Transaction Failed",
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <Text style={styles.headerText}>Purchase Data Bundle</Text>

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
            onPress={() => {
              setSelectedNet(net.id);
              setSelectedPlan("");
            }}
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

      {/* Input Number */}
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="08012345678"
        placeholderTextColor="#cbd5e1"
        keyboardType="numeric"
        value={phone}
        onChangeText={setPhone}
      />

      {/* Plan Selection */}
      <Text style={styles.label}>Choose Data Plan</Text>
      <View style={styles.pickerContainer}>
        {currentPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planOption,
              {
                borderColor: selectedPlan === plan.id ? "#1e3a8a" : "#f1f5f9",
                backgroundColor:
                  selectedPlan === plan.id ? "#eff6ff" : "#f8fafc",
              },
            ]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            <View style={styles.planInfo}>
              <Text
                style={[
                  styles.planLabel,
                  { color: selectedPlan === plan.id ? "#1e3a8a" : "#334155" },
                ]}
              >
                {plan.label}
              </Text>
              {selectedPlan === plan.id && (
                <Text style={styles.checkIcon}>✓</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.buyBtn, { opacity: loading ? 0.7 : 1 }]}
        onPress={handlePurchase}
        disabled={loading}
      >
        <Text style={styles.buyBtnText}>
          {loading ? "PROCESSING..." : "PURCHASE NOW"}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};
return (
  <View style={styles.container}>
    {dataPlans.map((plan) => (
      <TouchableOpacity key={plan.id} style={styles.planCard}>
        <Text style={styles.planSize}>{plan.size}</Text>

        {/* Nan ne logic din yake: */}
        <Text style={styles.priceText}>
          Price: ₦{userRole === "agent" ? plan.agentPrice : plan.userPrice}
        </Text>

        {userRole === "agent" && (
          <Text style={styles.savingsText}>
            You save ₦{plan.userPrice - plan.agentPrice}!
          </Text>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

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
    letterSpacing: 0.5,
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
  netText: { fontWeight: "800", fontSize: 12 },
  input: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    color: "#1e293b",
  },
  pickerContainer: { marginTop: 5 },
  planOption: {
    padding: 18,
    borderWidth: 1.5,
    borderRadius: 15,
    marginBottom: 12,
  },
  planInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planLabel: { fontSize: 15, fontWeight: "600" },
  checkIcon: { color: "#1e3a8a", fontWeight: "bold" },
  buyBtn: {
    backgroundColor: "#1e3a8a",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
    elevation: 4,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buyBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default BuyDataScreen;
