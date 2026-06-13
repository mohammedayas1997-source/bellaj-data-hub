import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import axios from "axios";
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
  profile: `${BASE_URL}/user/profile`,
  wallet: `${BASE_URL}/wallet/details`,
};

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const normalizeUser = (payload) => {
    return payload?.data?.user || payload?.data || payload?.user || payload || null;
  };

  const fetchProfile = async () => {
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

      const storedUser = await AsyncStorage.getItem("userData");
      if (storedUser) {
        setUserData(JSON.parse(storedUser));
      }

      const [profileRes, walletRes] = await Promise.allSettled([
        axios.get(API_ENDPOINTS.profile, { headers }),
        axios.get(API_ENDPOINTS.wallet, { headers }),
      ]);

      if (profileRes.status === "fulfilled") {
        const profile = normalizeUser(profileRes.value.data);
        setUserData(profile);
        await AsyncStorage.setItem("userData", JSON.stringify(profile));
      }

      if (walletRes.status === "fulfilled") {
        setWalletData(normalizeUser(walletRes.value.data));
      }
    } catch (error) {
      Alert.alert(
        "Connection Error",
        error?.response?.data?.message || "Unable to load profile data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
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

  const userName = useMemo(() => {
    return (
      userData?.name ||
      userData?.fullName ||
      `${userData?.firstName || ""} ${userData?.surname || ""}`.trim() ||
      "Bellaj User"
    );
  }, [userData]);

  const initials = useMemo(() => {
    const parts = userName.trim().split(" ");
    const first = parts?.[0]?.[0] || "B";
    const second = parts?.[1]?.[0] || "";
    return `${first}${second}`.toUpperCase();
  }, [userName]);

  const role = userData?.role || userData?.accountType || "User";
  const balance = Number(
    walletData?.walletBalance ||
      walletData?.balance ||
      userData?.walletBalance ||
      userData?.balance ||
      0
  );

  const accounts =
    walletData?.virtualAccounts ||
    walletData?.accounts ||
    walletData?.bankAccounts ||
    userData?.virtualAccounts ||
    [];

  const bankName =
    walletData?.bankName || accounts?.[0]?.bankName || userData?.bankName || "Not Generated";

  const accountNumber =
    walletData?.accountNumber ||
    accounts?.[0]?.accountNumber ||
    userData?.accountNumber ||
    "Not Generated";

  if (loading && !userData) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Profile...</Text>
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
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Bellaj account information</Text>
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
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {userData?.profileImage || userData?.avatar ? (
              <Image
                source={{ uri: userData?.profileImage || userData?.avatar }}
                style={styles.profileImg}
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>

          <Text style={styles.name}>{userName}</Text>

          <Text style={styles.email}>
            {userData?.email || "user@bellajdatahub.online"}
          </Text>

          <View style={styles.roleBadge}>
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={17}
              color={COLORS.secondary}
            />
            <Text style={styles.roleText}>{String(role).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
            <Text style={styles.statLabel}>Wallet Balance</Text>
            <Text style={styles.statValue}>₦{balance.toLocaleString()}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>
              {userData?.totalTransactions || walletData?.totalTransactions || 0}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Profile Data</Text>

          <View style={styles.infoBox}>
            <InfoItem
              icon="call-outline"
              title="Primary Contact"
              value={userData?.phone || userData?.phoneNumber || "Not Configured"}
            />

            <InfoItem
              icon="mail-outline"
              title="Email Address"
              value={userData?.email || "Not Provided"}
            />

            <InfoItem
              icon="calendar-outline"
              title="Date of Birth"
              value={userData?.dob || userData?.dateOfBirth || "Not Provided"}
            />

            <InfoItem
              icon="location-outline"
              title="Registered Address"
              value={userData?.address || "Location data not synchronized"}
              last
            />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Wallet Account</Text>

          <View style={styles.infoBox}>
            <InfoItem
              icon="business-outline"
              title="Bank Name"
              value={bankName}
            />

            <InfoItem
              icon="card-outline"
              title="Account Number"
              value={accountNumber}
            />

            <InfoItem
              icon="person-circle-outline"
              title="Account Name"
              value={accounts?.[0]?.accountName || walletData?.accountName || userName}
              last
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate("EditProfile")}
          activeOpacity={0.86}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.white} />
          <Text style={styles.editBtnText}>MODIFY PROFILE CREDENTIALS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pinBtn}
          onPress={() => navigation.navigate("UpdatePin")}
          activeOpacity={0.86}
        >
          <Ionicons name="key-outline" size={20} color={COLORS.primary} />
          <Text style={styles.pinBtnText}>Update Transaction PIN</Text>
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>Bellaj Data Hub Terminal v2.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const InfoItem = ({ icon, title, value, last }) => (
  <View style={[styles.infoItem, last && { borderBottomWidth: 0 }]}>
    <Ionicons name={icon} size={21} color={COLORS.primary} />

    <View style={styles.infoText}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
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
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 80,
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
  profileHeader: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: COLORS.softRed,
  },
  profileImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 38,
    fontWeight: "900",
  },
  name: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 15,
    color: COLORS.dark,
    textAlign: "center",
  },
  email: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  roleText: {
    color: COLORS.secondary,
    fontWeight: "900",
    fontSize: 11,
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
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.secondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoText: {
    marginLeft: 16,
    flex: 1,
  },
  infoTitle: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase",
    fontWeight: "900",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.dark,
    marginTop: 3,
  },
  editBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  editBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14,
  },
  pinBtn: {
    backgroundColor: COLORS.white,
    minHeight: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pinBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 14,
  },
  footerNote: {
    alignItems: "center",
    marginVertical: 20,
  },
  footerText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default ProfileScreen;