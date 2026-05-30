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
} from "react-native";
import * as Clipboard from "expo-clipboard";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
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
  walletDetails: "",
  generateVirtualAccount: "",
};

const FundWalletScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchWalletDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!API_ENDPOINTS.walletDetails) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await axios.get(API_ENDPOINTS.walletDetails, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const data = res.data.data;
        setUserData(data);

        if (!data.virtualAccounts || data.virtualAccounts.length === 0) {
          handleGenerateAccount();
        }
      }
    } catch (e) {
      Alert.alert(
        "Connection Error",
        "Unable to sync wallet details. Please pull down to retry.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleGenerateAccount = async () => {
    setGenerating(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!API_ENDPOINTS.generateVirtualAccount) {
        setGenerating(false);
        return;
      }

      const res = await axios.post(
        API_ENDPOINTS.generateVirtualAccount,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setUserData(res.data.data);
      }
    } catch (error) {
      console.log("Virtual account processing or KYC required");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletDetails();
  };

  const copyToClipboard = async (text, label) => {
    if (text) {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", `${label} copied to clipboard!`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Syncing Bellaj Secure Accounts...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={26} color={COLORS.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Fund Your Wallet</Text>
      </View>

      <View style={styles.heroSection}>
        <View style={styles.infoBadge}>
          <MaterialCommunityIcons
            name="shield-check"
            size={16}
            color={COLORS.secondary}
          />
          <Text style={styles.badgeText}>Automated Funding</Text>
        </View>

        <Text style={styles.heroSubtitle}>
          Funds transferred to the account details below will reflect in your
          Bellaj Data Hub wallet instantly.
        </Text>
      </View>

      {userData?.virtualAccounts && userData.virtualAccounts.length > 0 ? (
        userData.virtualAccounts.map((acc, index) => (
          <View key={index} style={styles.bankCard}>
            <View style={styles.bankHeader}>
              <View>
                <Text style={styles.bankTag}>PROVIDER</Text>
                <Text style={styles.bankName}>
                  {acc?.bankName?.toUpperCase() || "BANK"}
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
                  copyToClipboard(acc.accountNumber, "Account Number")
                }
              >
                <Text style={styles.accountNumberText}>
                  {acc.accountNumber}
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
              <Text style={styles.accountNameText}>{acc.accountName}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          {generating ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="account-clock"
                size={40}
                color={COLORS.muted}
              />

              <Text style={styles.emptyText}>
                Processing your dedicated Bellaj bank account...
              </Text>

              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryText}>Check Status</Text>
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
          Processing fee may apply to automated transfers. Minimum deposit:
          ₦100.
        </Text>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
    paddingHorizontal: 20,
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
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 25,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 15,
    color: COLORS.white,
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
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 5,
  },
  heroSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
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
    fontWeight: "800",
    letterSpacing: 1,
  },
  bankName: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  accContainer: {
    marginBottom: 15,
  },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountNumberText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "800",
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
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    padding: 40,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 15,
    fontSize: 14,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: COLORS.softRed,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  alternativeSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
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
    borderRadius: 12,
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
    fontWeight: "bold",
  },
  cardBtnSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
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
  },
});

export default FundWalletScreen;
