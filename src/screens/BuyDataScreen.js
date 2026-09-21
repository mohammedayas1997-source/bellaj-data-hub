import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#DCFCE7",
  softRed: "#FEE2E2",
  danger: "#DC2626",
  warning: "#D97706",
  card: "#FFFFFF",
};

// NETWORKS TARE DA AINIHIN NETWORK IDs
const NETWORKS = [
  { id: 1, code: "MTN", name: "MTN", color: "#FFCC00", textColor: "#000000" },
  { id: 2, code: "GLO", name: "GLO", color: "#2ECC71", textColor: "#FFFFFF" },
  { id: 3, code: "9MOBILE", name: "9Mobile", color: "#006600", textColor: "#FFFFFF" },
  { id: 4, code: "AIRTEL", name: "Airtel", color: "#E74C3C", textColor: "#FFFFFF" },
];

// DEFAULT DATA PLANS (TUSHEN AL-IHSAN/API PRESETS TARE DA PLAN IDs)
const DEFAULT_DATA_PLANS = [
  // MTN (Network ID: 1)
  { id: "140", planId: "140", networkId: 1, network: "MTN", type: "DC", name: "1.0GB DC", volume: "1.0 GB", validity: "30 Days", price: 230 },
  { id: "133", planId: "133", networkId: 1, network: "MTN", type: "DC", name: "1.5GB DC", volume: "1.5 GB", validity: "30 Days", price: 345 },
  { id: "134", planId: "134", networkId: 1, network: "MTN", type: "DC", name: "2.0GB DC", volume: "2.0 GB", validity: "30 Days", price: 460 },
  { id: "135", planId: "135", networkId: 1, network: "MTN", type: "DC", name: "3.0GB DC", volume: "3.0 GB", validity: "30 Days", price: 690 },
  { id: "136", planId: "136", networkId: 1, network: "MTN", type: "DC", name: "5.0GB DC", volume: "5.0 GB", validity: "30 Days", price: 1150 },
  { id: "26", planId: "26", networkId: 1, network: "MTN", type: "CG", name: "500MB CG", volume: "500 MB", validity: "30 Days", price: 130 },
  { id: "27", planId: "27", networkId: 1, network: "MTN", type: "CG", name: "1.0GB CG", volume: "1.0 GB", validity: "30 Days", price: 245 },
  { id: "28", planId: "28", networkId: 1, network: "MTN", type: "CG", name: "2.0GB CG", volume: "2.0 GB", validity: "30 Days", price: 490 },
  { id: "38", planId: "38", networkId: 1, network: "MTN", type: "CG", name: "5.0GB CG", volume: "5.0 GB", validity: "30 Days", price: 1225 },
  { id: "17", planId: "17", networkId: 1, network: "MTN", type: "SME", name: "500MB SME", volume: "500 MB", validity: "30 Days", price: 140 },
  { id: "112", planId: "112", networkId: 1, network: "MTN", type: "SME2", name: "1.0GB SME2", volume: "1.0 GB", validity: "30 Days", price: 260 },
  { id: "151", planId: "151", networkId: 1, network: "MTN", type: "DATASHARE", name: "1.0GB DataShare", volume: "1.0 GB", validity: "30 Days", price: 255 },

  // AIRTEL (Network ID: 4)
  { id: "201", planId: "201", networkId: 4, network: "AIRTEL", type: "CG", name: "500MB CG", volume: "500 MB", validity: "30 Days", price: 140 },
  { id: "202", planId: "202", networkId: 4, network: "AIRTEL", type: "CG", name: "1.0GB CG", volume: "1.0 GB", validity: "30 Days", price: 270 },
  { id: "203", planId: "203", networkId: 4, network: "AIRTEL", type: "CG", name: "2.0GB CG", volume: "2.0 GB", validity: "540", price: 540 },
  { id: "205", planId: "205", networkId: 4, network: "AIRTEL", type: "CG", name: "5.0GB CG", volume: "5.0 GB", validity: "30 Days", price: 1350 },

  // GLO (Network ID: 2)
  { id: "301", planId: "301", networkId: 2, network: "GLO", type: "CG", name: "500MB CG", volume: "500 MB", validity: "30 Days", price: 145 },
  { id: "302", planId: "302", networkId: 2, network: "GLO", type: "CG", name: "1.0GB CG", volume: "1.0 GB", validity: "30 Days", price: 265 },
  { id: "303", planId: "303", networkId: 2, network: "GLO", type: "CG", name: "2.0GB CG", volume: "2.0 GB", validity: "30 Days", price: 530 },

  // 9MOBILE (Network ID: 3)
  { id: "401", planId: "401", networkId: 3, network: "9MOBILE", type: "SME", name: "1.0GB SME", volume: "1.0 GB", validity: "30 Days", price: 210 },
  { id: "402", planId: "402", networkId: 3, network: "9MOBILE", type: "SME", name: "2.0GB SME", volume: "2.0 GB", validity: "30 Days", price: 420 },
];

const BuyDataScreen = ({ navigation }) => {
  const [selectedNetworkId, setSelectedNetworkId] = useState(1); // Default MTN
  const [selectedType, setSelectedType] = useState("ALL"); // 'ALL' | 'DC' | 'CG' | 'SME' | etc
  const [phone, setPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pin, setPin] = useState("");

  const [walletBalance, setWalletBalance] = useState(0);
  const [allPlans, setAllPlans] = useState(DEFAULT_DATA_PLANS);

  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 25000,
    };
  };

  const loadDashboardData = async () => {
    try {
      setPlansLoading(true);
      const config = await getAuthHeaders();

      // 1. Dauko Balance na User
      const profileRes = await axios.get(`${BASE_URL}/users/profile`, config).catch(async () => {
        return await axios.get(`${BASE_URL}/api/v1/users/me`, config);
      });

      if (profileRes?.data?.user) {
        const u = profileRes.data.user;
        setWalletBalance(Number(u.walletBalance || u.balance || 0));
      }

      // 2. Dauko Live Data Plans daga Server (idan akwai)
      const plansRes = await axios.get(`${BASE_URL}/admin/data-plans`, config).catch(async () => {
        return await axios.get(`${BASE_URL}/data/plans`, config);
      });

      const serverPlans = plansRes?.data?.data || plansRes?.data?.plans || [];
      if (Array.isArray(serverPlans) && serverPlans.length > 0) {
        // Haɗa su ta yadda kowanne zai sami networkId da planId
        const normalized = serverPlans.map((sp, idx) => ({
          id: sp._id || sp.id || sp.planId || String(idx),
          planId: String(sp.planId || sp.id || idx),
          networkId: Number(sp.networkId || (sp.network === "MTN" ? 1 : sp.network === "GLO" ? 2 : sp.network === "9MOBILE" ? 3 : 4)),
          network: String(sp.network || "MTN").toUpperCase(),
          type: String(sp.planType || sp.type || "SME").toUpperCase(),
          name: sp.name || `${sp.volume || "1GB"} ${sp.planType || ""}`,
          volume: sp.volume || `${sp.size || 1} GB`,
          validity: sp.validity || "30 Days",
          price: Number(sp.customerPrice || sp.price || sp.retailPrice || 230),
        }));
        setAllPlans(normalized);
      }
    } catch (err) {
      console.log("Using cached tariff matrix");
    } finally {
      setPlansLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Tace Network da aka zaɓa
  const activeNetwork = useMemo(() => {
    return NETWORKS.find((net) => net.id === selectedNetworkId) || NETWORKS[0];
  }, [selectedNetworkId]);

  // Jerin Nau'o'in Plans na wannan Network ɗin (Types: DC, CG, SME, da sauransu)
  const availableTypes = useMemo(() => {
    const networkPlans = allPlans.filter((p) => p.networkId === selectedNetworkId);
    const typesSet = new Set(networkPlans.map((p) => p.type));
    return ["ALL", ...Array.from(typesSet)];
  }, [allPlans, selectedNetworkId]);

  // Plans ɗin da suka dace da Network da kuma Nau'in da aka zaɓa
  const filteredPlans = useMemo(() => {
    return allPlans.filter((p) => {
      const matchNet = p.networkId === selectedNetworkId;
      const matchType = selectedType === "ALL" || p.type === selectedType;
      return matchNet && matchType;
    });
  }, [allPlans, selectedNetworkId, selectedType]);

  // Lokacin da aka canza Network, cire plan ɗin da aka zaɓa a baya
  const handleSelectNetwork = (netId) => {
    setSelectedNetworkId(netId);
    setSelectedType("ALL");
    setSelectedPlan(null);
  };

  // Tabbatar da shigar da bayanan
  const validatePurchase = () => {
    if (!phone.trim() || !selectedPlan) {
      Alert.alert("Bayani Ya Ragawa", "Don Allah zaɓi Data Plan kuma ka saka lambar waya.");
      return false;
    }

    const cleanPhone = phone.trim().replace(/\s+/g, "");
    if (!/^0\d{10}$/.test(cleanPhone)) {
      Alert.alert("Lambar Waya Ba Daidai Ba", "Lambar wayar dole ne ta kasance lambobi 11 (misali: 08012345678).");
      return false;
    }

    if (pin.length !== 4) {
      Alert.alert("Security PIN", "Saka lambobin PIN guda 4 na asusunka.");
      return false;
    }

    if (walletBalance < Number(selectedPlan.price)) {
      Alert.alert(
        "Kudin Wallet Bai Isa Ba",
        `Kudin da ke asusunka (₦${walletBalance.toLocaleString()}) bai isa siyan wannan plan din na ₦${Number(selectedPlan.price).toLocaleString()} ba. Don Allah fara saka kudi.`
      );
      return false;
    }

    return true;
  };

  // Tura siyan data
  const handlePurchase = async () => {
    if (!validatePurchase()) return;

    Alert.alert(
      "Tabbatar da Siyan Data",
      `Shin kana son siyan ${selectedPlan.volume} (${selectedPlan.network} ${selectedPlan.type}) akan ₦${Number(selectedPlan.price).toLocaleString()} zuwa ga ${phone}?\n\nPlan ID: ${selectedPlan.planId}`,
      [
        { text: "Fasa (Cancel)", style: "cancel" },
        {
          text: "Sayi Yanzu (Buy)",
          onPress: async () => {
            try {
              setLoading(true);
              const config = await getAuthHeaders();

              // TSARIN DA YAKE BI DA NETWORK ID DA PLAN ID
              const payload = {
                networkId: selectedPlan.networkId,
                network: selectedPlan.network,
                planId: selectedPlan.planId,
                plan_id: selectedPlan.planId,
                packageId: selectedPlan.planId,
                data_plan: selectedPlan.planId,
                planType: selectedPlan.type,
                volume: selectedPlan.volume,
                phoneNumber: phone.trim().replace(/\s+/g, ""),
                phone: phone.trim().replace(/\s+/g, ""),
                amount: Number(selectedPlan.price),
                transactionPin: pin.trim(),
                pin: pin.trim(),
              };

              const endpoints = [
                `${BASE_URL}/data/buy`,
                `${BASE_URL}/api/v1/data/buy`,
                `${BASE_URL}/data/purchase`,
              ];

              let result = null;
              let errMsg = "";

              for (const url of endpoints) {
                try {
                  const res = await axios.post(url, payload, config);
                  if (res?.status === 200 || res?.status === 201 || res?.data?.success) {
                    result = res.data;
                    break;
                  }
                } catch (err) {
                  errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
                  // Idan kuskuren PIN ne ko Wallet, tsaya nan take
                  if (err.response?.status === 400 || err.response?.status === 401) {
                    throw new Error(errMsg);
                  }
                }
              }

              if (!result && errMsg) {
                throw new Error(errMsg);
              }

              Alert.alert(
                "An Siya Cikin Nasara! 🎉",
                `${selectedPlan.volume} an tura shi zuwa ga ${phone}.`,
                [
                  {
                    text: "Duba Transactions",
                    onPress: () => navigation.navigate("SalesHistory"),
                  },
                  {
                    text: "OK",
                    onPress: () => {
                      setPhone("");
                      setPin("");
                      setSelectedPlan(null);
                      loadDashboardData();
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert("Siyan Data Ya Fadi", error.message || "An samu matsala wajen siyan data. Sake gwadawa.");
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

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Siyan Data (Data Top-up)</Text>
          <Text style={styles.headerSubtitle}>Sauki, Saurin Isarwa & Inganci</Text>
        </View>

        <View style={styles.walletBadge}>
          <Ionicons name="wallet-outline" size={14} color="#86EFAC" />
          <Text style={styles.walletBadgeText}>₦{walletBalance.toLocaleString()}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* 1. SELECT NETWORK (TARE DA NETWORK ID) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Zabi Telecom Network (Network ID)</Text>

          <View style={styles.netGrid}>
            {NETWORKS.map((net) => {
              const isSelected = selectedNetworkId === net.id;
              return (
                <TouchableOpacity
                  key={net.id}
                  style={[
                    styles.netBox,
                    isSelected && { borderColor: net.color, backgroundColor: "#F0FDF4", borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectNetwork(net.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.netIcon, { backgroundColor: net.color }]}>
                    <Text style={[styles.netIconText, { color: net.textColor }]}>
                      {net.name.charAt(0)}
                    </Text>
                  </View>

                  <Text style={[styles.netText, isSelected && { color: COLORS.primary, fontWeight: "900" }]}>
                    {net.name}
                  </Text>

                  <Text style={styles.netIdTag}>ID: {net.id}</Text>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.secondary}
                      style={{ position: "absolute", top: 8, right: 8 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. SELECT PLAN CATEGORY / TYPE */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Zabi Nau'in Data (Data Type)</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {availableTypes.map((type) => {
                const isSelected = selectedType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typePill, isSelected && styles.typePillActive]}
                    onPress={() => {
                      setSelectedType(type);
                      setSelectedPlan(null);
                    }}
                  >
                    <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* 3. SELECT DATA PLAN (TARE DA PLAN ID DA PRICE) */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>3. Zabi Data Plan & Plan ID</Text>
            <Text style={styles.planCountTag}>{filteredPlans.length} Plans Akwai</Text>
          </View>

          {plansLoading ? (
            <View style={{ padding: 25, alignItems: "center" }}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={{ marginTop: 8, color: COLORS.muted, fontSize: 12 }}>Ana loda plans...</Text>
            </View>
          ) : filteredPlans.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="database-off" size={32} color={COLORS.muted} />
              <Text style={styles.emptyBoxText}>Babu data plan a karkashin wannan rukuni.</Text>
            </View>
          ) : (
            <View style={styles.planGrid}>
              {filteredPlans.map((item) => {
                const isSelected = selectedPlan?.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.planCard,
                      isSelected && { borderColor: COLORS.primary, backgroundColor: "#DCFCE7", borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedPlan(item)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={[styles.planVolumeText, isSelected && { color: COLORS.primary }]}>
                        {item.volume}
                      </Text>
                      <View style={styles.planIdBadge}>
                        <Text style={styles.planIdBadgeText}>ID: {item.planId}</Text>
                      </View>
                    </View>

                    <Text style={styles.planValidityText}>{item.validity} • {item.type}</Text>

                    <Text style={[styles.planPriceText, isSelected && { color: COLORS.primary }]}>
                      ₦{Number(item.price).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* 4. CUSTOMER PHONE & TRANSACTION PIN */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Bayanan Mai Karba & Tsaro</Text>

          <Text style={styles.inputLabel}>Lambar Waya (Phone Number)</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={COLORS.muted} />
            <TextInput
              style={styles.textInput}
              placeholder="08012345678"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={11}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text style={styles.inputLabel}>Transaction PIN (Lambobi 4)</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.muted} />
            <TextInput
              style={styles.textInput}
              placeholder="Saka lambobin PIN guda 4"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
          </View>
        </View>

        {/* SUMMARY CARD */}
        {selectedPlan ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Karin Bayanin Sayayya</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Network:</Text>
              <Text style={styles.summaryValue}>{selectedPlan.network} (ID: {selectedPlan.networkId})</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan ID:</Text>
              <Text style={styles.summaryValue}>{selectedPlan.planId}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Package:</Text>
              <Text style={styles.summaryValue}>{selectedPlan.volume} ({selectedPlan.type})</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lambar Karba:</Text>
              <Text style={styles.summaryValue}>{phone || "Ba a shigar ba"}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomWidth: 0, marginTop: 4 }]}>
              <Text style={[styles.summaryLabel, { fontWeight: "900", color: COLORS.dark }]}>Jimillar Kudin:</Text>
              <Text style={[styles.summaryValue, { color: COLORS.primary, fontSize: 18 }]}>
                ₦{Number(selectedPlan.price).toLocaleString()}
              </Text>
            </View>
          </View>
        ) : null}

        {/* MA'BALLIN SAYI (BUY BUTTON) */}
        <TouchableOpacity
          style={[styles.buyBtn, (!selectedPlan || loading) && { opacity: 0.6 }]}
          onPress={handlePurchase}
          disabled={!selectedPlan || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="send-check" size={20} color={COLORS.white} />
              <Text style={styles.buyBtnText}>
                {selectedPlan
                  ? `SAYI YANZU (₦${Number(selectedPlan.price).toLocaleString()})`
                  : "ZABI DATA PLAN DA FARKO"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 44 : 22,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
  headerSubtitle: { color: "#DCFCE7", fontSize: 11, fontWeight: "600", marginTop: 2 },
  walletBadge: {
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  walletBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: "900" },
  container: { flex: 1 },
  content: { padding: 14, paddingBottom: 90 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 13.5,
    fontWeight: "900",
    marginBottom: 10,
  },
  netGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  netBox: {
    width: "23.5%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.light,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  netIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  netIconText: { fontSize: 16, fontWeight: "900" },
  netText: { fontSize: 11.5, fontWeight: "800", color: COLORS.muted },
  netIdTag: { fontSize: 9.5, color: COLORS.muted, marginTop: 2, fontWeight: "700" },

  typePill: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  typePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typePillText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.muted,
  },
  typePillTextActive: {
    color: COLORS.white,
  },

  planCountTag: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: "800",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  planCard: {
    width: "48.5%",
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
  },
  planVolumeText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.dark,
  },
  planIdBadge: {
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planIdBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.muted,
  },
  planValidityText: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "600",
    marginVertical: 4,
  },
  planPriceText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.secondary,
    marginTop: 2,
  },

  emptyBox: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBoxText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },

  inputLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.muted,
    marginBottom: 5,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },

  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  summaryLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  summaryValue: { fontSize: 12.5, color: COLORS.dark, fontWeight: "800" },

  buyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 20,
    elevation: 3,
  },
  buyBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});

export default BuyDataScreen;