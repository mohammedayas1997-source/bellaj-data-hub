import React, { useMemo, useState } from "react";
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
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  buyAirtime: `${BASE_URL}/airtime/buy`,
};

const networks = [
  { id: "01", name: "MTN", color: "#FFCC00" },
  { id: "02", name: "GLO", color: "#2ECC71" },
  { id: "04", name: "Airtel", color: "#E74C3C" },
  { id: "03", name: "9Mobile", color: "#006600" },
];

const quickAmounts = ["100", "200", "500", "1000", "2000", "5000"];

const AirtimeScreen = ({ navigation }) => {
  const [selectedNet, setSelectedNet] = useState("01");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const selectedNetwork = useMemo(
    () => networks.find((net) => net.id === selectedNet),
    [selectedNet]
  );

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "token",
            "adminToken",
            "userData",
            "userRole",
            "overrideRole",
            "isSuperAdminOverride",
          ]);

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPhone("");
    setAmount("");
    setTimeout(() => setRefreshing(false), 500);
  };

  const validateForm = () => {
    const cleanPhone = phone.trim();
    const numericAmount = Number(amount);

    if (!cleanPhone || !amount.trim()) {
      Alert.alert("Validation Error", "Please fill in all fields.");
      return false;
    }

    if (!/^0\d{10}$/.test(cleanPhone)) {
      Alert.alert("Validation Error", "Enter a valid 11-digit phone number.");
      return false;
    }

    if (!numericAmount || numericAmount < 50) {
      Alert.alert("Validation Error", "Minimum airtime purchase is ₦50.");
      return false;
    }

    return true;
  };

  const handleAirtimePurchase = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Confirm Airtime Purchase",
      `Buy ₦${Number(amount).toLocaleString()} ${selectedNetwork?.name} airtime for ${phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Buy Now",
          onPress: async () => {
            try {
              setLoading(true);

              const headers = await getAuthHeaders();

              const payload = {
                network: selectedNet,
                networkName: selectedNetwork?.name,
                phoneNumber: phone.trim(),
                amount: Number(amount),
              };

              const { data } = await axios.post(
                API_ENDPOINTS.buyAirtime,
                payload,
                { headers }
              );

              if (data?.success === false) {
                Alert.alert(
                  "Transaction Failed",
                  data?.message || "Airtime purchase failed."
                );
                return;
              }

              Alert.alert(
                "Bellaj Data Hub",
                `₦${Number(amount).toLocaleString()} airtime sent to ${phone}.`,
                [
                  {
                    text: "View History",
                    onPress: () => navigation.navigate("SalesHistory"),
                  },
                  {
                    text: "OK",
                    onPress: () => {
                      setPhone("");
                      setAmount("");
                    },
                  },
                ]
              );
            } catch (error) {
              const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Transaction could not be completed.";

              Alert.alert("Failed", message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Buy Airtime</Text>
          <Text style={styles.headerSubtitle}>
            Instant recharge with Bellaj Data Hub
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="cellphone-wireless"
              size={34}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Airtime Top-up Center</Text>
            <Text style={styles.heroText}>
              Select network, enter customer number and complete recharge in real
              time.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Network</Text>

          <View style={styles.netGrid}>
            {networks.map((net) => {
              const isSelected = selectedNet === net.id;

              return (
                <TouchableOpacity
                  key={net.id}
                  style={[
                    styles.netBox,
                    isSelected && {
                      borderColor: net.color,
                      backgroundColor: "#FFFFFF",
                    },
                  ]}
                  onPress={() => setSelectedNet(net.id)}
                  activeOpacity={0.86}
                >
                  <View
                    style={[
                      styles.netIcon,
                      { backgroundColor: isSelected ? net.color : COLORS.light },
                    ]}
                  >
                    <Text
                      style={[
                        styles.netIconText,
                        { color: isSelected ? COLORS.dark : COLORS.muted },
                      ]}
                    >
                      {net.name.charAt(0)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.netText,
                      { color: isSelected ? COLORS.dark : COLORS.muted },
                    ]}
                  >
                    {net.name}
                  </Text>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.secondary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Details</Text>

          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="08012345678"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>

          <Text style={styles.label}>Amount</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="cash"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. 100"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.unitText}>₦</Text>
          </View>

          <View style={styles.quickAmountRow}>
            {quickAmounts.map((val) => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.quickBtn,
                  amount === val && styles.activeQuickBtn,
                ]}
                onPress={() => setAmount(val)}
                activeOpacity={0.86}
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
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Transaction Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network</Text>
            <Text style={styles.summaryValue}>
              {selectedNetwork?.name || "N/A"}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone</Text>
            <Text style={styles.summaryValue}>{phone || "Not entered"}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>
              ₦{Number(amount || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.buyBtn, loading && { opacity: 0.7 }]}
          onPress={handleAirtimePurchase}
          disabled={loading}
          activeOpacity={0.86}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="send-check-outline"
                size={21}
                color={COLORS.white}
              />
              <Text style={styles.buyBtnText}>BUY AIRTIME</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },
  netGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  netBox: {
    width: "48%",
    minHeight: 95,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.light,
    padding: 13,
  },
  netIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  netIconText: {
    fontSize: 17,
    fontWeight: "900",
  },
  netText: {
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 9,
    color: "#475569",
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    borderRadius: 15,
    minHeight: 52,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "800",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  unitText: {
    color: COLORS.muted,
    fontWeight: "900",
    fontSize: 14,
  },
  quickAmountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
  },
  quickBtn: {
    backgroundColor: COLORS.softRed,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeQuickBtn: {
    backgroundColor: COLORS.primary,
  },
  quickText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 13,
  },
  activeQuickText: {
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  summaryTitle: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 9,
    gap: 12,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontWeight: "700",
  },
  summaryValue: {
    color: COLORS.dark,
    fontWeight: "900",
    flex: 1,
    textAlign: "right",
  },
  buyBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buyBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default AirtimeScreen;