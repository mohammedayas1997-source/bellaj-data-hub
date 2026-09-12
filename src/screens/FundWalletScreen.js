import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  ToastAndroid,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  danger: "#E60000",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  card: "#FFFFFF",
  border: "#E2E8F0",
  softGreen: "#EAF7F1",
  softRed: "#FEF2F2",
};

const FundWalletScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  const normalizeWallet = (payload) => {
    return (
      payload?.data?.user ||
      payload?.data?.profile ||
      payload?.data ||
      payload?.user ||
      payload?.profile ||
      payload ||
      null
    );
  };

  const fetchWalletDetails = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      // Read local cache immediately
      const cached = await AsyncStorage.getItem("userData");
      if (cached) {
        try {
          setUserData(JSON.parse(cached));
        } catch {}
      }

      const endpoints = [
        `${BASE_URL}/wallet/details`,
        `${BASE_URL}/wallet/balance`,
        `${BASE_URL}/user/profile`,
        `${BASE_URL}/auth/me`,
      ];

      let resolved = null;
      for (const url of endpoints) {
        try {
          const res = await axios.get(url, config);
          if (res?.data) {
            resolved = normalizeWallet(res.data);
            if (resolved?.accountNumber || resolved?.walletBalance !== undefined) {
              break;
            }
          }
        } catch {
          // Continue to fallback endpoint
        }
      }

      if (resolved) {
        setUserData((prev) => ({ ...(prev || {}), ...resolved }));
        await AsyncStorage.setItem("userData", JSON.stringify(resolved));
      }
    } catch (e) {
      // Retain state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletDetails();
  }, [fetchWalletDetails]);

  const handleGenerateAccount = async (showAlert = true) => {
    try {
      setGenerating(true);
      const config = await getAuthHeaders();

      const endpoints = [
        `${BASE_URL}/wallet/generate-account`,
        `${BASE_URL}/wallet/generate-virtual-account`,
        `${BASE_URL}/auth/generate-account`,
      ];

      let generated = null;
      for (const url of endpoints) {
        try {
          const res = await axios.post(url, {}, config);
          if (res?.data?.success || res?.data?.data) {
            generated = res.data;
            break;
          }
        } catch {
          // Next
        }
      }

      await fetchWalletDetails();

      if (showAlert) {
        if (generated) {
          Alert.alert(
            "Bellaj Data Hub",
            generated?.message || "Virtual account setup initiated successfully."
          );
        } else {
          Alert.alert(
            "Account Processing",
            "Your virtual account request is currently being processed by Paystack & Wema Bank."
          );
        }
      }
    } catch (error) {
      if (showAlert) {
        Alert.alert(
          "Account Pending",
          error?.response?.data?.message ||
            "Virtual account request is queued. Please pull down to refresh in a few moments."
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
    if (!text || text === "Generating..." || text === "Initialization Pending") return;

    await Clipboard.setStringAsync(String(text));

    if (Platform.OS === "android") {
      ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", `${label} copied to clipboard.`);
    }
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

  // Compile all available virtual accounts (including top-level profile numbers)
  const resolvedAccounts = useMemo(() => {
    const list =
      userData?.virtualAccounts ||
      userData?.accounts ||
      userData?.bankAccounts ||
      [];

    const out = [...list];

    const directAccount = userData?.accountNumber || userData?.accountNo;
    if (
      directAccount &&
      !out.some((a) => (a?.accountNumber || a?.accountNo) === directAccount)
    ) {
      out.unshift({
        bankName: userData?.bankName || userData?.bank || "Wema Bank",
        accountNumber: directAccount,
        accountName:
          userData?.accountName ||
          userData?.name ||
          `${userData?.firstName || ""} ${userData?.surname || ""}`.trim() ||
          "Bellaj Subscriber",
      });
    }

    return out.filter(
      (a) =>
        a?.accountNumber &&
        a?.accountNumber !== "Generating..." &&
        a?.accountNumber !== "Initialization Pending"
    );
  }, [userData]);

  if (loading && !userData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Syncing Bellaj Dedicated Accounts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Fund Wallet</Text>
          <Text style={styles.headerSubtitle}>Automated Dedicated Transfer</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
            <Text style={styles.badgeText}>Instant Auto-Funding</Text>
          </View>

          <Text style={styles.heroTitle}>Dedicated Bank Accounts</Text>
          <Text style={styles.heroSubtitle}>
            Any money transferred from any banking app to your dedicated account
            below will automatically fund your wallet within seconds.
          </Text>
        </View>

        {resolvedAccounts.length > 0 ? (
          resolvedAccounts.map((acc, index) => (
            <View
              key={acc?._id || acc?.accountNumber || index}
              style={styles.bankCard}
            >
              <View style={styles.bankHeader}>
                <View>
                  <Text style={styles.bankTag}>SETTLEMENT BANK</Text>
                  <Text style={styles.bankName}>
                    {(acc?.bankName || acc?.bank || "WEMA BANK").toUpperCase()}
                  </Text>
                </View>

                <View style={styles.bankIconWrap}>
                  <MaterialCommunityIcons
                    name="bank"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
              </View>

              <View style={styles.accContainer}>
                <Text style={styles.label}>Account Number</Text>
                <TouchableOpacity
                  style={styles.numberRow}
                  onPress={() =>
                    copyToClipboard(
                      acc?.accountNumber || acc?.accountNo,
                      "Account Number"
                    )
                  }
                  activeOpacity={0.85}
                >
                  <Text style={styles.accountNumberText}>
                    {acc?.accountNumber || acc?.accountNo}
                  </Text>

                  <View style={styles.copyPill}>
                    <MaterialCommunityIcons
                      name="content-copy"
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.copyText}>COPY</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.nameContainer}>
                <Text style={styles.label}>Account Name</Text>
                <Text style={styles.accountNameText}>
                  {acc?.accountName ||
                    userData?.accountName ||
                    userData?.name ||
                    "Bellaj Subscriber"}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            {generating ? (
              <>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.emptyTitle}>Provisioning Virtual Account...</Text>
                <Text style={styles.emptyText}>
                  Connecting with Paystack & Wema Bank to create your account.
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="bank-plus"
                  size={46}
                  color={COLORS.secondary}
                />
                <Text style={styles.emptyTitle}>Virtual Account Pending</Text>
                <Text style={styles.emptyText}>
                  Your dedicated virtual account is not active yet. Tap below to
                  generate your personal account immediately.
                </Text>

                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => handleGenerateAccount(true)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.retryText}>GENERATE ACCOUNT NOW</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View style={styles.alternativeSection}>
          <Text style={styles.sectionTitle}>Alternative Payment Options</Text>

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
              <Text style={styles.cardBtnTitle}>Card / USSD / Bank Transfer Checkout</Text>
              <Text style={styles.cardBtnSub}>
                Instant dynamic top-up via Paystack online checkout
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.noticeBox}>
          <Ionicons name="information-circle" size={22} color={COLORS.secondary} />
          <Text style={styles.noticeText}>
            Dedicated accounts are 100% automated. Minimum transfer amount is ₦100.
            Transferred funds credit your wallet balance instantly.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 44 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextBox: { flex: 1 },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#DCFCE7",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 80,
    maxWidth: 800,
    width: "100%",
    alignSelf: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  heroSection: {
    marginBottom: 18,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softGreen,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 5,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  bankCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  bankTag: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bankName: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },
  bankIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  accContainer: { marginBottom: 12 },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountNumberText: {
    color: COLORS.dark,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  accountNameText: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 18,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 320,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  alternativeSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12,
  },
  cardBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBtnTextCont: {
    flex: 1,
    marginLeft: 12,
  },
  cardBtnTitle: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "900",
  },
  cardBtnSub: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  noticeBox: {
    flexDirection: "row",
    backgroundColor: COLORS.softGreen,
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  noticeText: {
    flex: 1,
    color: COLORS.primary,
    fontSize: 11,
    marginLeft: 10,
    lineHeight: 16,
    fontWeight: "700",
  },
});

export default FundWalletScreen;