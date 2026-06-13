import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#94A3B8",
  card: "#1E293B",
  border: "#334155",
  softGreen: "rgba(11, 94, 60, 0.18)",
  softRed: "rgba(230, 0, 0, 0.12)",
};

const API_ENDPOINTS = {
  walletDetails: `${BASE_URL}/wallet/details`,
  generateVirtualAccount: `${BASE_URL}/wallet/generate-virtual-account`,
};

const FundWalletScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeWallet = (payload) => {
    return payload?.data?.user || payload?.data || payload?.user || payload || null;
  };

  const fetchWalletDetails = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.walletDetails, { headers });
      const wallet = normalizeWallet(data);

      setUserData(wallet);

      const accounts =
        wallet?.virtualAccounts ||
        wallet?.accounts ||
        wallet?.bankAccounts ||
        [];

      if (!accounts || accounts.length === 0) {
        await handleGenerateAccount(false);
      }
    } catch (e) {
      Alert.alert(
        "Connection Error",
        e?.response?.data?.message ||
          "Unable to sync wallet details. Please pull down to retry."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerateAccount = async (showAlert = true) => {
    try {
      setGenerating(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.post(
        API_ENDPOINTS.generateVirtualAccount,
        {},
        { headers }
      );

      const wallet = normalizeWallet(data);
      setUserData(wallet);

      if (showAlert) {
        Alert.alert("Bellaj Data Hub", "Virtual account generated successfully.");
      }
    } catch (error) {
      if (showAlert) {
        Alert.alert(
          "Account Pending",
          error?.response?.data?.message ||
            "Virtual account is still processing or KYC is required."
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletDetails();
  };

  const copyToClipboard = async (text, label) => {
    if (!text) return;

    await Clipboard.setStringAsync(String(text));
    Alert.alert("Copied", `${label} copied to clipboard.`);
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

    navigation.navigate("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main");
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

  const virtualAccounts =
    userData?.virtualAccounts ||
    userData?.accounts ||
    userData?.bankAccounts ||
    [];

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Syncing Bellaj Secure Accounts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={26} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Fund Wallet</Text>
          <Text style={styles.headerSubtitle}>Automated account funding</Text>
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
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.heroSection}>
          <View style={styles.infoBadge}>
            <MaterialCommunityIcons
              name="shield-check"
              size={16}
              color={COLORS.secondary}
            />
            <Text style={styles.badgeText}>Automated Funding</Text>
          </View>

          <Text style={styles.heroTitle}>Bellaj Secure Wallet</Text>

          <Text style={styles.heroSubtitle}>
            Funds transferred to your dedicated account will reflect in your
            Bellaj Data Hub wallet automatically.
          </Text>
        </View>

        {virtualAccounts && virtualAccounts.length > 0 ? (
          virtualAccounts.map((acc, index) => (
            <View key={acc?._id || acc?.accountNumber || index} style={styles.bankCard}>
              <View style={styles.bankHeader}>
                <View>
                  <Text style={styles.bankTag}>PROVIDER</Text>
                  <Text style={styles.bankName}>
                    {(acc?.bankName || acc?.bank || "BANK").toUpperCase()}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="bank-outline"
                  size={28}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.accContainer}>
                <Text style={styles.label}>Account Number</Text>

                <TouchableOpacity
                  style={styles.numberRow}
                  onPress={() =>
                    copyToClipboard(acc?.accountNumber || acc?.accountNo, "Account Number")
                  }
                  activeOpacity={0.86}
                >
                  <Text style={styles.accountNumberText}>
                    {acc?.accountNumber || acc?.accountNo || "N/A"}
                  </Text>

                  <MaterialCommunityIcons
                    name="content-copy"
                    size={20}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.nameContainer}>
                <Text style={styles.label}>Account Name</Text>
                <Text style={styles.accountNameText}>
                  {acc?.accountName || userData?.name || "Bellaj Data Hub User"}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            {generating ? (
              <>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.emptyText}>Generating virtual account...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="account-clock"
                  size={42}
                  color={COLORS.muted}
                />

                <Text style={styles.emptyTitle}>Virtual Account Pending</Text>

                <Text style={styles.emptyText}>
                  Your dedicated Bellaj bank account is still processing.
                </Text>

                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => handleGenerateAccount(true)}
                  activeOpacity={0.86}
                >
                  <Text style={styles.retryText}>Generate Account</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View style={styles.alternativeSection}>
          <Text style={styles.sectionTitle}>Other Payment Options</Text>

          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => navigation.navigate("PaystackWebview")}
            activeOpacity={0.86}
          >
            <View style={styles.cardBtnIcon}>
              <MaterialCommunityIcons
                name="credit-card-plus"
                size={24}
                color={COLORS.white}
              />
            </View>

            <View style={styles.cardBtnTextCont}>
              <Text style={styles.cardBtnTitle}>Card / USSD / QR</Text>
              <Text style={styles.cardBtnSub}>
                Instant funding via secure checkout
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.noticeBox}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />

          <Text style={styles.noticeText}>
            Processing fee may apply to automated transfers. Minimum deposit is ₦100.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.dark },
  header: {
    backgroundColor: COLORS.dark,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTextBox: { flex: 1 },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1, backgroundColor: COLORS.dark },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 80,
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.dark,
  },
  loaderText: {
    marginTop: 15,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  heroSection: {
    marginBottom: 25,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softGreen,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 5,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  bankCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  bankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  bankTag: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bankName: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  accContainer: { marginBottom: 15 },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountNumberText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 18,
  },
  accountNameText: {
    color: COLORS.light,
    fontSize: 16,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    padding: 34,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.softRed,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  alternativeSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 15,
  },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardBtnIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBtnTextCont: {
    flex: 1,
    marginLeft: 15,
  },
  cardBtnTitle: {
    color: COLORS.light,
    fontSize: 15,
    fontWeight: "900",
  },
  cardBtnSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  noticeBox: {
    flexDirection: "row",
    backgroundColor: COLORS.softRed,
    padding: 15,
    borderRadius: 15,
    marginTop: 30,
    alignItems: "center",
  },
  noticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    marginLeft: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
});

export default FundWalletScreen;