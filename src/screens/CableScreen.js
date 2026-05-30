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
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
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
  validateCable: "",
  payCable: "",
};

const cableData = {
  GOTV: [
    { id: "gotv-lite", name: "GOtv Lite", price: 1500 },
    { id: "gotv-value", name: "GOtv Value", price: 2100 },
    { id: "gotv-plus", name: "GOtv Plus", price: 3300 },
    { id: "gotv-max", name: "GOtv Max", price: 4850 },
    { id: "gotv-supa", name: "GOtv Supa", price: 6400 },
  ],
  DSTV: [
    { id: "dstv-padi", name: "DStv Padi", price: 2950 },
    { id: "dstv-yanga", name: "DStv Yanga", price: 4200 },
    { id: "dstv-confam", name: "DStv Confam", price: 7400 },
    { id: "dstv-asia", name: "DStv Asia", price: 9900 },
    { id: "dstv-compact", name: "DStv Compact", price: 12500 },
  ],
  STARTIMES: [
    { id: "nova", name: "Nova Monthly", price: 1500 },
    { id: "basic", name: "Basic Monthly", price: 2600 },
    { id: "smart", name: "Smart Monthly", price: 3500 },
    { id: "classic", name: "Classic Monthly", price: 5000 },
    { id: "super", name: "Super Monthly", price: 7000 },
  ],
};

const CableScreen = ({ navigation }) => {
  const [provider, setProvider] = useState("GOTV");
  const [smartCard, setSmartCard] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pin, setPin] = useState("");
  const [packages, setPackages] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [serviceCharge, setServiceCharge] = useState(50);
  const [newCharge, setNewCharge] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await AsyncStorage.getItem("userData");

      if (user) {
        const parsed = JSON.parse(user);
        setIsAdmin(parsed?.role === "admin");
      }
    };

    checkAdmin();
    setPackages(cableData[provider]);
    setSelectedPackage(null);
    setCustomerName("");
  }, [provider]);

  const updateGlobalCharge = async () => {
    if (!newCharge.trim()) {
      Alert.alert("Error", "Enter amount");
      return;
    }

    setServiceCharge(parseInt(newCharge, 10));
    setNewCharge("");

    Alert.alert("Bellaj Data Hub", "Service charge updated for this session.");
  };

  const validateIUC = async () => {
    if (smartCard.length < 9) {
      Alert.alert("Error", "Enter a valid IUC/Smartcard Number.");
      return;
    }

    if (!API_ENDPOINTS.validateCable) {
      Alert.alert("Not Configured", "Cable validation API is not configured.");
      return;
    }

    setValidating(true);
    setCustomerName("");

    try {
      const token = await AsyncStorage.getItem("userToken");

      const res = await axios.post(
        API_ENDPOINTS.validateCable,
        { provider, smartCard },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setCustomerName(res.data.customerName);
      }
    } catch (err) {
      Alert.alert("Validation Error", "Check the number and try again.");
    } finally {
      setValidating(false);
    }
  };

  const handlePayment = async () => {
    if (!smartCard || !selectedPackage || !pin) {
      Alert.alert("Error", "Please fill in all details.");
      return;
    }

    if (!customerName) {
      Alert.alert("Error", "Validate the Smartcard first.");
      return;
    }

    if (!API_ENDPOINTS.payCable) {
      Alert.alert("Not Configured", "Cable payment API is not configured.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      const res = await axios.post(
        API_ENDPOINTS.payCable,
        {
          provider,
          smartCard,
          packageId: selectedPackage.id,
          amount: selectedPackage.price + serviceCharge,
          transactionPin: pin,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        Alert.alert(
          "Bellaj Data Hub",
          "Cable subscription activated successfully!",
        );
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert(
        "Transaction Failed",
        err.response?.data?.message || "Internal Error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.header}>Cable TV</Text>
      </View>

      {isAdmin && (
        <View style={styles.adminSection}>
          <Text style={styles.adminLabel}>
            Admin: Adjust Service Charge (₦)
          </Text>

          <View style={styles.adminRow}>
            <TextInput
              style={styles.adminInput}
              placeholder={serviceCharge.toString()}
              placeholderTextColor={COLORS.muted}
              keyboardType="numeric"
              value={newCharge}
              onChangeText={setNewCharge}
            />

            <TouchableOpacity
              style={styles.adminBtn}
              onPress={updateGlobalCharge}
            >
              <Text style={styles.adminBtnText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.label}>Choose Provider</Text>

      <View style={styles.providerRow}>
        {["GOTV", "DSTV", "STARTIMES"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, provider === item && styles.activeChip]}
            onPress={() => setProvider(item)}
          >
            <Text
              style={[styles.chipText, provider === item && styles.whiteText]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>IUC / Smartcard Number</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.mainInput}
          placeholder="e.g. 7012345678"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={smartCard}
          onChangeText={(val) => {
            setSmartCard(val);
            setCustomerName("");
          }}
        />

        <TouchableOpacity
          style={styles.verifyBtn}
          onPress={validateIUC}
          disabled={validating}
        >
          {validating ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify</Text>
          )}
        </TouchableOpacity>
      </View>

      {customerName ? (
        <View style={styles.customerBox}>
          <Ionicons
            name="person-circle-outline"
            size={22}
            color={COLORS.secondary}
          />

          <Text style={styles.customerText}>{customerName}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Select Desired Package</Text>

      <View style={styles.packageContainer}>
        {packages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.pkgCard,
              selectedPackage?.id === pkg.id && styles.activePkgCard,
            ]}
            onPress={() => setSelectedPackage(pkg)}
          >
            <View>
              <Text
                style={[
                  styles.pkgTitle,
                  selectedPackage?.id === pkg.id && styles.whiteText,
                ]}
              >
                {pkg.name}
              </Text>

              <Text
                style={[
                  styles.pkgCaption,
                  selectedPackage?.id === pkg.id && styles.activeCaption,
                ]}
              >
                1 Month Validity
              </Text>
            </View>

            <Text
              style={[
                styles.pkgCost,
                selectedPackage?.id === pkg.id && styles.whiteText,
              ]}
            >
              ₦{(pkg.price + serviceCharge).toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Transaction PIN</Text>

      <TextInput
        style={styles.pinInput}
        placeholder="****"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        keyboardType="numeric"
        maxLength={4}
        value={pin}
        onChangeText={setPin}
      />

      <TouchableOpacity
        style={[styles.payBtn, loading && { opacity: 0.7 }]}
        onPress={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.payBtnText}>ACTIVATE SUBSCRIPTION</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 45,
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginLeft: 15,
  },
  adminSection: {
    backgroundColor: COLORS.softRed,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adminLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
  },
  adminRow: {
    flexDirection: "row",
  },
  adminInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.dark,
  },
  adminBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    marginLeft: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  adminBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 12,
    marginTop: 20,
  },
  providerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chip: {
    paddingVertical: 12,
    borderRadius: 12,
    width: "31%",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontWeight: "bold",
    color: COLORS.muted,
  },
  whiteText: {
    color: COLORS.white,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainInput: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.dark,
  },
  verifyBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    height: 58,
    justifyContent: "center",
    borderRadius: 12,
    marginLeft: 10,
  },
  verifyBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softGreen,
    padding: 15,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  customerText: {
    marginLeft: 10,
    fontWeight: "bold",
    color: COLORS.secondary,
    fontSize: 15,
  },
  packageContainer: {
    marginTop: 10,
  },
  pkgCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.light,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activePkgCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pkgTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  pkgCaption: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  activeCaption: {
    color: "#FFE4E4",
  },
  pkgCost: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  pinInput: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 5,
    color: COLORS.dark,
  },
  payBtn: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 35,
    elevation: 5,
  },
  payBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CableScreen;
