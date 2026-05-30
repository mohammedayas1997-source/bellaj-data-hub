import React, { useState, useEffect } from "react";
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
  dataRate: "",
  updateDataRate: "",
  buyDataCustom: "",
};

const networks = [
  { id: "01", name: "MTN", color: "#FFCC00" },
  { id: "02", name: "GLO", color: "#2ECC71" },
  { id: "04", name: "Airtel", color: "#E74C3C" },
  { id: "03", name: "9Mobile", color: "#006600" },
];

const BuyDataScreen = ({ navigation }) => {
  const [selectedNet, setSelectedNet] = useState("01");
  const [phone, setPhone] = useState("");
  const [gbAmount, setGbAmount] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");

  const [pricePerGb, setPricePerGb] = useState(280);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newRate, setNewRate] = useState("");

  useEffect(() => {
    const checkUserStatus = async () => {
      const storedUser = await AsyncStorage.getItem("userData");

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setIsAdmin(parsed?.role === "admin");
      }

      try {
        if (!API_ENDPOINTS.dataRate) return;

        const response = await axios.get(API_ENDPOINTS.dataRate);

        if (response.data.rate) {
          setPricePerGb(response.data.rate);
        }
      } catch (e) {
        console.log("Using default rate");
      }
    };

    checkUserStatus();
  }, []);

  useEffect(() => {
    const amount = parseFloat(gbAmount) || 0;
    setTotalPrice(amount * pricePerGb);
  }, [gbAmount, pricePerGb]);

  const handleUpdateRate = async () => {
    if (!newRate.trim()) {
      Alert.alert("Error", "Enter new rate per GB");
      return;
    }

    if (!API_ENDPOINTS.updateDataRate) {
      Alert.alert("Not Configured", "Update data rate API is not configured.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("userToken");

      await axios.post(
        API_ENDPOINTS.updateDataRate,
        { rate: parseFloat(newRate) },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setPricePerGb(parseFloat(newRate));
      setNewRate("");

      Alert.alert("Bellaj Data Hub", "Rate updated for all users.");
    } catch (error) {
      Alert.alert("Update Failed", "You do not have permission.");
    }
  };

  const handlePurchase = async () => {
    if (!phone.trim() || !gbAmount.trim() || !pin.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (phone.length < 11) {
      Alert.alert("Error", "Enter a valid 11-digit phone number.");
      return;
    }

    if (pin.length < 4) {
      Alert.alert("Error", "Enter your 4-digit Transaction PIN.");
      return;
    }

    if (!API_ENDPOINTS.buyDataCustom) {
      Alert.alert("Not Configured", "Buy data API is not configured.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await axios.post(
        API_ENDPOINTS.buyDataCustom,
        {
          networkId: selectedNet,
          gbQuantity: gbAmount,
          phoneNumber: phone,
          amount: totalPrice,
          transactionPin: pin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        Alert.alert(
          "Bellaj Data Hub",
          `${gbAmount}GB has been sent to ${phone}`,
        );

        setPhone("");
        setGbAmount("");
        setPin("");
      }
    } catch (error) {
      Alert.alert(
        "Transaction Failed",
        error.response?.data?.message || "Server Error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <Text style={styles.headerText}>Data Purchase</Text>
      <Text style={styles.subHeader}>Buy instant data on Bellaj Data Hub</Text>

      {isAdmin && (
        <View style={styles.adminPanel}>
          <Text style={styles.adminLabel}>Admin: Set Price per GB (₦)</Text>

          <View style={styles.adminRow}>
            <TextInput
              style={styles.adminInput}
              placeholder="e.g. 250"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={newRate}
              onChangeText={setNewRate}
            />

            <TouchableOpacity
              style={styles.updateBtn}
              onPress={handleUpdateRate}
            >
              <Text style={styles.updateBtnText}>UPDATE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
                  {
                    color: isSelected ? COLORS.dark : COLORS.muted,
                  },
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

      <Text style={styles.label}>Enter Data Quantity (GB)</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. 5"
        placeholderTextColor="#CBD5E1"
        keyboardType="numeric"
        value={gbAmount}
        onChangeText={setGbAmount}
      />

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Total Cost:</Text>
        <Text style={styles.priceValue}>₦{totalPrice.toLocaleString()}</Text>
      </View>

      <Text style={styles.label}>Transaction PIN</Text>

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

      <TouchableOpacity
        style={[styles.buyBtn, loading && { opacity: 0.7 }]}
        onPress={handlePurchase}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buyBtnText}>PROCEED TO PAYMENT</Text>
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
  adminPanel: {
    backgroundColor: COLORS.softRed,
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  adminLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  adminRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  adminInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.dark,
  },
  updateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: "center",
    marginLeft: 10,
  },
  updateBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
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
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
  },
  priceLabel: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.9,
  },
  priceValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "bold",
  },
  buyBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
    elevation: 4,
  },
  buyBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default BuyDataScreen;
