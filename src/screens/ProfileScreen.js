import React, { useCallback, useMemo, useState, useEffect } from "react";
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
  Switch,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import * as LocalAuthentication from "expo-local-authentication";
import axios from "axios";
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
};

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Biometrics States
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricActive, setIsBiometricActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      checkBiometricSettings();
    }, [])
  );

  const checkBiometricSettings = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        setIsBiometricSupported(true);
        const enabled = await AsyncStorage.getItem("useBiometricLogin");
        setIsBiometricActive(enabled === "true");
      } else {
        setIsBiometricSupported(false);
      }
    } catch (e) {
      console.log("Biometric check failed:", e.message);
    }
  };

  const handleToggleBiometrics = async (value) => {
    if (value) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Confirm Fingerprint / Biometrics to Enable",
          fallbackLabel: "Cancel",
          disableDeviceFallback: true,
        });

        if (result.success) {
          await AsyncStorage.setItem("useBiometricLogin", "true");
          setIsBiometricActive(true);
          Alert.alert("Success", "Fingerprint login activated successfully!");
        } else {
          setIsBiometricActive(false);
        }
      } catch (err) {
        Alert.alert("Authentication Failed", err.message);
        setIsBiometricActive(false);
      }
    } else {
      await AsyncStorage.setItem("useBiometricLogin", "false");
      setIsBiometricActive(false);
      Alert.alert("Disabled", "Fingerprint login has been disabled.");
    }
  };

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
      const token =
        (await AsyncStorage.getItem("userToken")) ||
        (await AsyncStorage.getItem("token")) ||
        (await AsyncStorage.getItem("adminToken"));

      if (!token) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const storedUser = await AsyncStorage.getItem("userData");
      if (storedUser) {
        try {
          setUserData(JSON.parse(storedUser));
        } catch {}
      }

      // Gwada hanyoyi daban-daban na API
      const profileEndpoints = [
        `${BASE_URL}/users/profile`,
        `${BASE_URL}/api/v1/users/me`,
        `${BASE_URL}/user/profile`,
        `${BASE_URL}/api/v1/user/profile`,
      ];

      const walletEndpoints = [
        `${BASE_URL}/wallet/details`,
        `${BASE_URL}/api/v1/wallet`,
        `${BASE_URL}/wallet`,
      ];

      let profileResolved = null;
      for (const url of profileEndpoints) {
        try {
          const res = await axios.get(url, { headers, timeout: 15000 });
          const userObj = normalizeUser(res.data);
          if (userObj) {
            profileResolved = userObj;
            break;
          }
        } catch {}
      }

      if (profileResolved) {
        setUserData(profileResolved);
        await AsyncStorage.setItem("userData", JSON.stringify(profileResolved));
      }

      let walletResolved = null;
      for (const url of walletEndpoints) {
        try {
          const res = await axios.get(url, { headers, timeout: 15000 });
          const wObj = normalizeUser(res.data);
          if (wObj) {
            walletResolved = wObj;
            break;
          }
        } catch {}
      }

      if (walletResolved) {
        setWalletData(walletResolved);
      }
    } catch (error) {
      console.log("Error loading profile:", error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
    checkBiometricSettings();
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation?.navigate?.("Dashboard");
  };

  const logout = async () => {
    Alert.alert("Fita Daga Asusu", "Shin ka tabbata kana son fita daga asusunka?", [
      { text: "A'a (Cancel)", style: "cancel" },
      {
        text: "Fita (Logout)",
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
            "transactionPin",
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
      "Bellaj Subscriber"
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
    walletData?.bankName || accounts?.[0]?.bankName || userData?.bankName || "Moniepoint / Wema";

  const accountNumber =
    walletData?.accountNumber ||
    accounts?.[0]?.accountNumber ||
    userData?.accountNumber ||
    "Not Assigned";

  if (loading && !userData) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Ana loda bayanan asusu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Account Profile</Text>
          <Text style={styles.headerSubtitle}>Bayanan asusunka na Bellaj Data Hub</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="power" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* PROFILE CARD */}
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
          <Text style={styles.email}>{userData?.email || "user@bellajdatahub.online"}</Text>

          <View style={styles.roleBadge}>
            <MaterialCommunityIcons
              name="shield-check"
              size={16}
              color={COLORS.secondary}
            />
            <Text style={styles.roleText}>{String(role).toUpperCase()}</Text>
          </View>
        </View>

        {/* BALANCE & STATS */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
            <Text style={styles.statLabel}>Kudin Wallet</Text>
            <Text style={styles.statValue}>₦{balance.toLocaleString()}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}>
            <Text style={styles.statLabel}>Ayyukan da Aka Yi</Text>
            <Text style={styles.statValue}>
              {userData?.totalTransactions || walletData?.totalTransactions || 0}
            </Text>
          </View>
        </View>

        {/* FINGERPRINT / BIOMETRICS */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Tsaro & Biometrics</Text>

          <View style={styles.infoBox}>
            <View style={styles.switchRow}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={26}
                  color={isBiometricActive ? COLORS.secondary : COLORS.muted}
                />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={styles.switchTitle}>Fingerprint Login</Text>
                  <Text style={styles.switchSubtitle}>
                    {isBiometricSupported
                      ? isBiometricActive
                        ? "An kunna shiga da yatsa (Active)"
                        : "Danna don kunna Fingerprint"
                      : "Wayar ba ta da Fingerprint"}
                  </Text>
                </View>
              </View>

              <Switch
                value={isBiometricActive}
                onValueChange={handleToggleBiometrics}
                disabled={!isBiometricSupported}
                trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
                thumbColor={isBiometricActive ? COLORS.secondary : "#F1F5F9"}
              />
            </View>
          </View>
        </View>

        {/* PROFILE DETAILS */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Bayanan Mai Asusu</Text>

          <View style={styles.infoBox}>
            <InfoItem
              icon="call-outline"
              title="Lambar Waya"
              value={userData?.phone || userData?.phoneNumber || "Babu"}
            />

            <InfoItem
              icon="mail-outline"
              title="Email Address"
              value={userData?.email || "Babu"}
            />

            <InfoItem
              icon="location-outline"
              title="Jiha & Karamar Hukuma"
              value={`${userData?.lga || "LGA"}, ${userData?.state || "State"}`}
            />

            <InfoItem
              icon="home-outline"
              title="Adireshi"
              value={userData?.address || "Address not provided"}
              last
            />
          </View>
        </View>

        {/* DEDICATED VIRTUAL ACCOUNT */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionLabel}>Asusun Ajiya na Musamman (Virtual Account)</Text>

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

        {/* SECURITY & PIN BUTTONS */}
        <TouchableOpacity
          style={styles.pinBtn}
          onPress={() => navigation.navigate("UpdatePin")}
          activeOpacity={0.85}
        >
          <Ionicons name="key-outline" size={20} color={COLORS.white} />
          <Text style={styles.pinBtnText}>SAITA / CANZA TRANSACTION PIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate("SalesHistory")}
          activeOpacity={0.85}
        >
          <Ionicons name="receipt-outline" size={19} color={COLORS.primary} />
          <Text style={styles.historyBtnText}>Duba Tarihin Hada-Hadar Kudi</Text>
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>Bellaj Data Hub Platform • v2.6</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const InfoItem = ({ icon, title, value, last }) => (
  <View style={[styles.infoItem, last && { borderBottomWidth: 0 }]}>
    <Ionicons name={icon} size={20} color={COLORS.primary} />
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
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#DCFCE7",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 90,
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
    paddingVertical: 24,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 14,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: COLORS.softGreen,
  },
  profileImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: "900",
  },
  name: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 12,
    color: COLORS.dark,
    textAlign: "center",
  },
  email: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
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
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 10.5,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  infoSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: "900",
    color: COLORS.secondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  switchTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: COLORS.dark,
  },
  switchSubtitle: {
    fontSize: 11.5,
    color: COLORS.muted,
    marginTop: 2,
    fontWeight: "600",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoText: {
    marginLeft: 14,
    flex: 1,
  },
  infoTitle: {
    fontSize: 10.5,
    color: COLORS.muted,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: "800",
    color: COLORS.dark,
    marginTop: 2,
  },
  pinBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  pinBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13.5,
    letterSpacing: 0.5,
  },
  historyBtn: {
    backgroundColor: COLORS.white,
    minHeight: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyBtnText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  footerNote: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default ProfileScreen;