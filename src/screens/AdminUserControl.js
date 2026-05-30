import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import axios from "axios";
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
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  blockWallet: "",
  debitUser: "",
};

const AdminUserControl = () => {
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");

  const handleBlockWallet = async () => {
    if (!targetUserId.trim()) {
      Alert.alert("Error", "Enter User ID or Phone Number.");
      return;
    }

    if (!API_ENDPOINTS.blockWallet) {
      Alert.alert("Not Configured", "Block wallet API is not configured.");
      return;
    }

    try {
      const res = await axios.post(API_ENDPOINTS.blockWallet, {
        userId: targetUserId.trim(),
      });

      if (res.data.success) {
        Alert.alert("Bellaj Data Hub", "User wallet blocked successfully!");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to block wallet.");
    }
  };

  const handleDebitUser = async () => {
    if (!targetUserId.trim()) {
      Alert.alert("Error", "Enter User ID or Phone Number.");
      return;
    }

    if (!amount.trim()) {
      Alert.alert("Error", "Enter amount to debit.");
      return;
    }

    if (!API_ENDPOINTS.debitUser) {
      Alert.alert("Not Configured", "Debit user API is not configured.");
      return;
    }

    Alert.alert(
      "Confirm Transaction",
      `Are you sure you want to debit ₦${amount} from this user?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Debit",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await axios.post(API_ENDPOINTS.debitUser, {
                userId: targetUserId.trim(),
                amount: parseFloat(amount),
              });

              if (res.data.success) {
                Alert.alert("Bellaj Data Hub", "Funds debited successfully!");
                setAmount("");
              }
            } catch (err) {
              Alert.alert("Error", "Could not debit user.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bellaj Admin Control</Text>
      <Text style={styles.subtitle}>Manage wallet access and user debit</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Target User</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter User ID or Phone"
          placeholderTextColor="#94A3B8"
          value={targetUserId}
          onChangeText={setTargetUserId}
        />

        <TouchableOpacity style={styles.blockBtn} onPress={handleBlockWallet}>
          <Text style={styles.btnText}>BLOCK WALLET</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Debit User Wallet</Text>

        <TextInput
          style={styles.input}
          placeholder="Amount to Debit (₦)"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity style={styles.debitBtn} onPress={handleDebitUser}>
          <Text style={styles.btnText}>CONFIRM DEBIT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.light,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
    marginBottom: 25,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.muted,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.light,
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    color: COLORS.dark,
    fontSize: 15,
  },
  blockBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  debitBtn: {
    backgroundColor: COLORS.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default AdminUserControl;
