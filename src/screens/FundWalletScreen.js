import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Paystack } from "react-native-paystack-webview";

const FundWalletScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Nemo bayanan user daga Server
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        const res = await axios.get(
          "https://ayax-data-xpress-server.vercel.app/api/v1/auth/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUserData(res.data.data);
      } catch (e) {
        console.log("Error fetching account details");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const copyToClipboard = () => {
    if (userData?.accountNumber) {
      Clipboard.setString(userData.accountNumber);
      Alert.alert("Success", "Account number copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  // Inside your FundWallet component
  <Paystack
    paystackKey="pk_live_991624fc58b3d5fbebeb512819a3976c6b936ad7"
    amount={amount} // e.g., "2000.00"
    billingEmail={userEmail} // Important: Must be the logged-in user's email
    currency="NGN"
    activityIndexColor="#38bdf8"
    onCancel={(e) => {
      Alert.alert("Cancelled", "Payment was not completed.");
    }}
    onSuccess={(res) => {
      // res.transactionRef is the key to verifying the payment on your backend
      verifyPaymentOnBackend(res.transactionRef);
    }}
    autoStart={true}
  />;

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Automatic Bank Transfer</Text>
        <Text style={styles.infoSub}>
          Transfer money to the account below to fund your wallet instantly.
        </Text>
      </View>

      <View style={styles.bankCard}>
        {/* Idan babu account number tukuna, sai mu nuna "Processing" */}
        <Text style={styles.bankName}>{userData?.bankName || "WEMA BANK"}</Text>
        <Text style={styles.accountNumber}>
          {userData?.accountNumber || "Generating..."}
        </Text>
        <Text style={styles.accountName}>
          {userData?.accountName || "AYAX-DATA-XPRESS USER"}
        </Text>
      </View>

      <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
        <Text style={styles.copyText}>Copy Account Number</Text>
      </TouchableOpacity>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️ Note: Paystack may charge a small fee for this automated service
          (usually ₦50).
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 20 },
  infoCard: {
    backgroundColor: "#eff6ff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  infoTitle: { color: "#1e3a8a", fontWeight: "bold", fontSize: 16 },
  infoSub: { color: "#64748b", marginTop: 5, fontSize: 13 },
  bankCard: {
    backgroundColor: "#1e3a8a",
    padding: 30,
    borderRadius: 25,
    alignItems: "center",
    elevation: 10,
  },
  bankName: {
    color: "#38bdf8",
    fontWeight: "bold",
    fontSize: 14,
    textTransform: "uppercase",
  },
  accountNumber: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    marginVertical: 10,
    letterSpacing: 2,
  },
  accountName: {
    color: "#bfdbfe",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  copyBtn: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  copyText: { color: "#1e3a8a", fontWeight: "700" },
  warningBox: {
    marginTop: 40,
    padding: 15,
    backgroundColor: "#fff7ed",
    borderRadius: 10,
  },
  warningText: { color: "#9a3412", fontSize: 11, textAlign: "center" },
});

export default FundWalletScreen;
