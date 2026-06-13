import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
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
  warning: "#F59E0B",
};

const API_ENDPOINTS = {
  getPricing: `${BASE_URL}/admin/pricing`,
  updatePricing: `${BASE_URL}/admin/pricing`,
};

const DEFAULT_PRICING = {
  nimc: {
    validation: "1300",
    modification: "1700",
    name: "0",
    phone: "0",
    dob: "0",
    address: "0",
    name_dob: "0",
    name_phone: "0",
  },
  bvn: {
    verification: "0",
    retrieval: "0",
    correction: "0",
  },
  services: {
    airtimeCharge: "0",
    dataCharge: "0",
    cableCharge: "0",
    electricityCharge: "0",
  },
};

const PricingSettings = ({ navigation }) => {
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("nimc");

  useEffect(() => {
    fetchPricing();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const normalizePricing = (payload) => {
    const data = payload?.data || payload || {};

    return {
      nimc: {
        ...DEFAULT_PRICING.nimc,
        ...(data?.nimc || data?.NIMCPrice || data?.nimcPrices || {}),
      },
      bvn: {
        ...DEFAULT_PRICING.bvn,
        ...(data?.bvn || data?.BVNPrice || data?.bvnPrices || {}),
      },
      services: {
        ...DEFAULT_PRICING.services,
        ...(data?.services || data?.serviceCharges || {}),
      },
    };
  };

  const fetchPricing = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      if (!headers) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const { data } = await axios.get(API_ENDPOINTS.getPricing, {
        headers,
        timeout: 30000,
      });

      setPricing(normalizePricing(data));
    } catch (error) {
      setPricing(DEFAULT_PRICING);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPricing();
  };

  const updateValue = (section, key, value) => {
    const cleanValue = value.replace(/[^0-9.]/g, "");

    setPricing((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: cleanValue,
      },
    }));
  };

  const savePricing = async () => {
    Alert.alert("Update Pricing", "Are you sure you want to save these prices?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save",
        onPress: async () => {
          try {
            setSaving(true);

            const headers = await getAuthHeaders();

            if (!headers) {
              Alert.alert("Session Expired", "Please login again.");
              return;
            }

            const payload = {
              nimc: pricing.nimc,
              bvn: pricing.bvn,
              services: pricing.services,
            };

            const { data } = await axios.put(
              API_ENDPOINTS.updatePricing,
              payload,
              {
                headers,
                timeout: 30000,
              }
            );

            if (data?.success === false) {
              Alert.alert("Failed", data?.message || "Pricing update failed.");
              return;
            }

            Alert.alert("Bellaj Data Hub", "Pricing updated successfully.");
            fetchPricing();
          } catch (error) {
            Alert.alert(
              "Update Failed",
              error?.response?.data?.message || "Unable to update pricing."
            );
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation?.navigate?.("AdminDashboard");
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

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

  const totalConfigured = useMemo(() => {
    const values = [
      ...Object.values(pricing.nimc),
      ...Object.values(pricing.bvn),
      ...Object.values(pricing.services),
    ];

    return values.filter((v) => Number(v || 0) > 0).length;
  }, [pricing]);

  const renderFields = () => {
    const section = activeTab;
    const fields = pricing[section] || {};

    return Object.entries(fields).map(([key, value]) => (
      <View key={key} style={styles.inputGroup}>
        <Text style={styles.label}>{key.replace(/_/g, " ").toUpperCase()}</Text>

        <View style={styles.inputBox}>
          <Text style={styles.currency}>₦</Text>

          <TextInput
            style={styles.input}
            value={String(value)}
            onChangeText={(text) => updateValue(section, key, text)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Pricing Settings...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Pricing Settings</Text>
          <Text style={styles.headerSubtitle}>Manage service prices</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
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
              name="cash-cog"
              size={35}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Bellaj Price Control</Text>
            <Text style={styles.heroText}>
              Update NIMC, BVN and service charges directly from admin panel.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchPricing}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalConfigured}</Text>
            <Text style={styles.statLabel}>Configured Prices</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Pricing Groups</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {[
            { id: "nimc", label: "NIMC", icon: "fingerprint" },
            { id: "bvn", label: "BVN", icon: "card-account-details-outline" },
            { id: "services", label: "Services", icon: "cog-outline" },
          ].map((tab) => {
            const active = activeTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabBtn, active && styles.activeTabBtn]}
                onPress={() => setActiveTab(tab.id)}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={18}
                  color={active ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.tabText, active && styles.activeTabText]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {activeTab.toUpperCase()} PRICE LIST
            </Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>LIVE</Text>
            </View>
          </View>

          {renderFields()}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.75 }]}
          onPress={savePricing}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="save-outline" size={21} color={COLORS.white} />
              <Text style={styles.saveText}>SAVE PRICING SETTINGS</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.noteCard}>
          <Ionicons
            name="information-circle-outline"
            size={22}
            color={COLORS.secondary}
          />
          <Text style={styles.noteText}>
            These prices will affect live service requests after backend pricing
            routes are connected.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 90,
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.primary,
    fontWeight: "800",
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
  headerTextBox: { flex: 1 },
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
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  activeTabBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  activeTabText: {
    color: COLORS.white,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  formTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
  },
  badge: {
    backgroundColor: COLORS.softGreen,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "900",
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
  },
  inputBox: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 55,
    paddingHorizontal: 14,
  },
  currency: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: COLORS.dark,
    fontSize: 17,
    fontWeight: "900",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  saveText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },
  noteCard: {
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 8,
  },
  noteText: {
    color: COLORS.secondary,
    flex: 1,
    fontWeight: "700",
    lineHeight: 19,
    fontSize: 12,
  },
});

export default PricingSettings;