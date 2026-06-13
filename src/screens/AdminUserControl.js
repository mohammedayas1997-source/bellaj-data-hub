import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  danger: "#DC2626",
};

const API_ENDPOINTS = {
  blockWallet: `${BASE_URL}/admin/block-wallet`,
  unblockWallet: `${BASE_URL}/admin/unblock-wallet`,
  debitUser: `${BASE_URL}/admin/debit-user`,
  creditUser: `${BASE_URL}/admin/credit-user`,
  userLookup: `${BASE_URL}/admin/user-lookup`,
};

const AdminUserControl = ({ navigation }) => {
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lookupUser, setLookupUser] = useState(null);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("adminToken")) ||
      (await AsyncStorage.getItem("token"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const openMenu = () => {
    const parent = navigation.getParent?.();

    if (navigation.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    Alert.alert("Menu", "Drawer menu is not available on this navigator.");
  };

  const goBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("AdminDashboard");
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
            "adminToken",
            "token",
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

  const resetForm = () => {
    setAmount("");
    setReason("");
    setLookupUser(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setLookupUser(null);
    setTimeout(() => setRefreshing(false), 500);
  };

  const validateTarget = () => {
    if (!targetUserId.trim()) {
      Alert.alert("Validation Error", "Enter User ID, email or phone number.");
      return false;
    }

    return true;
  };

  const validateAmount = () => {
    const parsedAmount = Number(amount);

    if (!amount.trim()) {
      Alert.alert("Validation Error", "Enter amount.");
      return false;
    }

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Validation Error", "Enter a valid amount greater than zero.");
      return false;
    }

    return true;
  };

  const handleLookupUser = async () => {
    if (!validateTarget()) return;

    try {
      setLoadingAction(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.userLookup, {
        headers,
        params: {
          query: targetUserId.trim(),
        },
      });

      const user = data?.data || data?.user || data;

      setLookupUser(user);

      Alert.alert("User Found", "User information loaded successfully.");
    } catch (error) {
      setLookupUser(null);
      Alert.alert("Lookup Failed", "User could not be found.");
    } finally {
      setLoadingAction(false);
    }
  };

  const postAction = async (endpoint, payload, successMessage) => {
    try {
      setLoadingAction(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.post(endpoint, payload, { headers });

      if (data?.success === false) {
        Alert.alert("Failed", data?.message || "Action could not be completed.");
        return;
      }

      Alert.alert("Bellaj Data Hub", successMessage);
      resetForm();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Request failed. Please try again.";

      Alert.alert("Action Failed", message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBlockWallet = async () => {
    if (!validateTarget()) return;

    Alert.alert(
      "Confirm Wallet Block",
      "Are you sure you want to block this user's wallet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block Wallet",
          style: "destructive",
          onPress: () =>
            postAction(
              API_ENDPOINTS.blockWallet,
              {
                userId: targetUserId.trim(),
                reason: reason.trim(),
              },
              "User wallet blocked successfully."
            ),
        },
      ]
    );
  };

  const handleUnblockWallet = async () => {
    if (!validateTarget()) return;

    Alert.alert(
      "Confirm Wallet Unblock",
      "Are you sure you want to unblock this user's wallet?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock Wallet",
          onPress: () =>
            postAction(
              API_ENDPOINTS.unblockWallet,
              {
                userId: targetUserId.trim(),
                reason: reason.trim(),
              },
              "User wallet unblocked successfully."
            ),
        },
      ]
    );
  };

  const handleDebitUser = async () => {
    if (!validateTarget()) return;
    if (!validateAmount()) return;

    Alert.alert(
      "Confirm Debit",
      `Are you sure you want to debit ₦${Number(amount).toLocaleString()} from this user?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Debit User",
          style: "destructive",
          onPress: () =>
            postAction(
              API_ENDPOINTS.debitUser,
              {
                userId: targetUserId.trim(),
                amount: Number(amount),
                reason: reason.trim(),
              },
              "Funds debited successfully."
            ),
        },
      ]
    );
  };

  const handleCreditUser = async () => {
    if (!validateTarget()) return;
    if (!validateAmount()) return;

    Alert.alert(
      "Confirm Credit",
      `Are you sure you want to credit ₦${Number(amount).toLocaleString()} to this user?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Credit User",
          onPress: () =>
            postAction(
              API_ENDPOINTS.creditUser,
              {
                userId: targetUserId.trim(),
                amount: Number(amount),
                reason: reason.trim(),
              },
              "Funds credited successfully."
            ),
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Bellaj Admin Control</Text>
          <Text style={styles.headerSubtitle}>Wallet access and user finance control</Text>
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
              name="shield-account-outline"
              size={32}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>User Wallet Command Center</Text>
            <Text style={styles.heroText}>
              Lookup users, block wallet access, credit accounts and debit accounts
              securely in real time.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Target User</Text>
          <Text style={styles.sectionSubText}>
            Use User ID, email address or phone number.
          </Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter User ID, email or phone"
              placeholderTextColor="#94A3B8"
              value={targetUserId}
              onChangeText={setTargetUserId}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.lookupBtn}
            onPress={handleLookupUser}
            disabled={loadingAction}
            activeOpacity={0.86}
          >
            {loadingAction ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="account-search"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.btnText}>LOOKUP USER</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {lookupUser && (
          <View style={styles.userPreviewCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(lookupUser?.name || lookupUser?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>
                {lookupUser?.name || lookupUser?.fullName || "User"}
              </Text>
              <Text style={styles.previewText}>
                {lookupUser?.email || "No email available"}
              </Text>
              <Text style={styles.previewText}>
                Wallet: ₦
                {Number(
                  lookupUser?.walletBalance || lookupUser?.balance || 0
                ).toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    lookupUser?.walletBlocked || lookupUser?.isWalletBlocked
                      ? COLORS.softRed
                      : COLORS.softGreen,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      lookupUser?.walletBlocked || lookupUser?.isWalletBlocked
                        ? COLORS.primary
                        : COLORS.secondary,
                  },
                ]}
              >
                {lookupUser?.walletBlocked || lookupUser?.isWalletBlocked
                  ? "BLOCKED"
                  : "ACTIVE"}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Wallet Action</Text>
          <Text style={styles.sectionSubText}>
            Enter amount only when crediting or debiting.
          </Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="cash"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount (₦)"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="note-text-outline"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              style={styles.input}
              placeholder="Reason or admin note"
              placeholderTextColor="#94A3B8"
              value={reason}
              onChangeText={setReason}
            />
          </View>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleBlockWallet}
              disabled={loadingAction}
              activeOpacity={0.86}
            >
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.btnText}>BLOCK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
              onPress={handleUnblockWallet}
              disabled={loadingAction}
              activeOpacity={0.86}
            >
              <MaterialCommunityIcons
                name="lock-open-outline"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.btnText}>UNBLOCK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#B91C1C" }]}
              onPress={handleDebitUser}
              disabled={loadingAction}
              activeOpacity={0.86}
            >
              <MaterialCommunityIcons
                name="minus-circle-outline"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.btnText}>DEBIT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#15803D" }]}
              onPress={handleCreditUser}
              disabled={loadingAction}
              activeOpacity={0.86}
            >
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.btnText}>CREDIT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.securityCard}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={28}
            color={COLORS.secondary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.securityTitle}>Secure Admin Action</Text>
            <Text style={styles.securityText}>
              Every action should be protected by backend authorization and logged
              for audit history.
            </Text>
          </View>
        </View>
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
    fontSize: 19,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
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
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
  },
  sectionSubText: {
    color: COLORS.muted,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 19,
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    borderRadius: 15,
    minHeight: 50,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "600",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  lookupBtn: {
    backgroundColor: COLORS.dark,
    minHeight: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  userPreviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 18,
  },
  previewName: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 15,
  },
  previewText: {
    color: COLORS.muted,
    fontWeight: "600",
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  actionBtn: {
    width: "48%",
    minHeight: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  securityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  securityTitle: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 15,
  },
  securityText: {
    color: COLORS.muted,
    fontWeight: "600",
    marginTop: 3,
    lineHeight: 18,
  },
});

export default AdminUserControl;