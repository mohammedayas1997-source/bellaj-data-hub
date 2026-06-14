import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CommonActions,
  DrawerActions,
} from "@react-navigation/native";
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
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
};

const API_ENDPOINTS = {
  searchUser: `${BASE_URL}/support/search-user`,
  traceService: `${BASE_URL}/support/trace-service`,
};

const SERVICE_TYPES = [
  { id: "bvn", label: "BVN", icon: "card-account-details-outline" },
  { id: "nimc", label: "NIMC", icon: "fingerprint" },
  { id: "data", label: "Data", icon: "wifi" },
  { id: "airtime", label: "Airtime", icon: "cellphone" },
  { id: "cable", label: "Cable", icon: "television-classic" },
  { id: "utility", label: "Utility", icon: "lightning-bolt" },
];

const SupportDashboard = ({ navigation }) => {
  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState("bvn");
  const [userData, setUserData] = useState(null);
  const [traceData, setTraceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const normalizeArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.transactions)) return payload.transactions;
    if (Array.isArray(payload?.data?.records)) return payload.data.records;
    if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
    return [];
  };

  const handleUserSearch = async () => {
    if (!identifier.trim()) {
      Alert.alert("Required", "Please enter email, phone, NIN or BVN.");
      return;
    }

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

      const { data } = await axios.get(
        `${API_ENDPOINTS.searchUser}/${encodeURIComponent(identifier.trim())}`,
        { headers, timeout: 30000 }
      );

      setUserData(normalizeUser(data));
      setTraceData([]);
    } catch (error) {
      Alert.alert(
        "User Not Found",
        error?.response?.data?.message || "No user found with this identifier."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTrace = async () => {
    if (!identifier.trim()) {
      Alert.alert("Required", "Please enter an identifier.");
      return;
    }

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

      const { data } = await axios.get(
        `${API_ENDPOINTS.traceService}/${type}/${encodeURIComponent(
          identifier.trim()
        )}`,
        { headers, timeout: 30000 }
      );

      setTraceData(normalizeArray(data));
      setUserData(null);
    } catch (error) {
      setTraceData([]);
      Alert.alert(
        "No Records",
        error?.response?.data?.message || "No records found for this ID."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (userData) handleUserSearch();
    else handleTrace();
  };

  const openMenu = () => {
  try {
    navigation.dispatch(DrawerActions.openDrawer());
  } catch (error) {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) {
      return navigation.openDrawer();
    }

    if (parent?.openDrawer) {
      return parent.openDrawer();
    }

    navigation.navigate("Main", {
      screen: "SuperAdminDashboard",
    });
  }
};

  const goBack = () => {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: "Main",
          params: {
            screen: "SuperAdminDashboard",
          },
        },
      ],
    })
  );
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

  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();

    if (["success", "successful", "completed", "approved"].includes(value)) {
      return COLORS.success;
    }

    if (["failed", "declined", "rejected"].includes(value)) {
      return COLORS.danger;
    }

    return COLORS.warning;
  };

  const profile = userData?.profile || userData || {};
  const recentTransactions =
    userData?.recentTransactions ||
    userData?.transactions ||
    userData?.data?.recentTransactions ||
    [];

  const stats = useMemo(() => {
    const totalAmount = traceData.reduce(
      (sum, item) => sum + Number(item?.amount || item?.totalAmount || 0),
      0
    );

    const successCount = traceData.filter((item) =>
      ["success", "successful", "completed", "approved"].includes(
        String(item?.status || "").toLowerCase()
      )
    ).length;

    return {
      total: traceData.length,
      success: successCount,
      amount: totalAmount,
    };
  }, [traceData]);

  const renderTraceItem = ({ item, index }) => {
    const status = item?.status || "Pending";
    const idNumber =
      item?.bvnNumber ||
      item?.ninNumber ||
      item?.identifier ||
      item?.phoneNumber ||
      item?.reference ||
      "N/A";

    const userName =
      item?.user?.name ||
      item?.user?.fullName ||
      `${item?.user?.firstName || ""} ${item?.user?.surname || ""}`.trim() ||
      item?.customerName ||
      "Unknown User";

    return (
      <View style={styles.recordCard}>
        <View style={styles.recordTop}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(status)}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {String(status).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleString() : "--"}
          </Text>
        </View>

        <InfoLine label="User" value={userName} />
        <InfoLine label="ID Number" value={idNumber} />
        <InfoLine label="Service" value={item?.serviceType || item?.service || type} />
        <InfoLine label="Reference" value={item?.reference || item?.transactionId || "N/A"} />
      </View>
    );
  };

  const renderTransaction = ({ item }) => {
    const status = item?.status || "Pending";

    return (
      <View style={styles.txRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.txRef}>{item?.reference || item?.transactionId || "N/A"}</Text>
          <Text style={styles.txDate}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleString() : "--"}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.txAmount}>
            ₦{Number(item?.amount || item?.totalAmount || 0).toLocaleString()}
          </Text>
          <Text style={[styles.txStatus, { color: getStatusColor(status) }]}>
            {status}
          </Text>
        </View>
      </View>
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
          <Text style={styles.headerTitle}>Support Portal</Text>
          <Text style={styles.headerSubtitle}>Tracing and customer support center</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={traceData}
        keyExtractor={(item, index) => item?._id || item?.id || index.toString()}
        renderItem={renderTraceItem}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name="headset"
                  size={36}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Bellaj Support Command</Text>
                <Text style={styles.heroText}>
                  Search users, trace services and monitor transaction records in real time.
                </Text>
              </View>
            </View>

            <View style={styles.searchCard}>
              <Text style={styles.label}>Identifier</Text>

              <View style={styles.inputWrapper}>
                <Ionicons name="search" size={20} color={COLORS.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="Email / Phone / NIN / BVN / Reference"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.label}>Service Type</Text>

              <View style={styles.serviceGrid}>
                {SERVICE_TYPES.map((service) => {
                  const active = type === service.id;

                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[styles.serviceChip, active && styles.activeServiceChip]}
                      onPress={() => setType(service.id)}
                      activeOpacity={0.86}
                    >
                      <MaterialCommunityIcons
                        name={service.icon}
                        size={17}
                        color={active ? COLORS.white : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.serviceChipText,
                          active && styles.activeServiceChipText,
                        ]}
                      >
                        {service.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                  onPress={handleUserSearch}
                  disabled={loading}
                  activeOpacity={0.86}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="person-circle-outline" size={20} color={COLORS.white} />
                      <Text style={styles.actionText}>Search User</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
                  onPress={handleTrace}
                  disabled={loading}
                  activeOpacity={0.86}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="database-search-outline"
                        size={20}
                        color={COLORS.white}
                      />
                      <Text style={styles.actionText}>Trace ID</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {userData && (
              <View style={styles.userSection}>
                <View style={styles.profileCard}>
                  <View style={styles.profileIcon}>
                    <Ionicons name="person" size={30} color={COLORS.white} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>
                      {profile?.name ||
                        profile?.fullName ||
                        `${profile?.firstName || ""} ${profile?.surname || ""}`.trim() ||
                        "Bellaj User"}
                    </Text>
                    <Text style={styles.profileEmail}>{profile?.email || "No email"}</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <StatCard label="Phone" value={profile?.phone || profile?.phoneNumber || "N/A"} />
                  <StatCard
                    label="Wallet"
                    value={`₦${Number(profile?.walletBalance || profile?.balance || 0).toLocaleString()}`}
                  />
                </View>

                <Text style={styles.sectionTitle}>Recent Transactions</Text>

                {recentTransactions.length === 0 ? (
                  <View style={styles.emptyMini}>
                    <Text style={styles.emptyText}>No recent transactions found.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={recentTransactions}
                    keyExtractor={(item, index) => item?._id || index.toString()}
                    renderItem={renderTransaction}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}

            {traceData.length > 0 && (
              <>
                <View style={styles.statsGrid}>
                  <StatCard label="Records" value={stats.total} />
                  <StatCard label="Success" value={stats.success} />
                  <StatCard
                    label="Value"
                    value={`₦${Number(stats.amount || 0).toLocaleString()}`}
                  />
                </View>

                <Text style={styles.sectionTitle}>
                  {type.toUpperCase()} Verification Records
                </Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          !userData && !loading ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons
                name="database-search-outline"
                size={60}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>No Support Records</Text>
              <Text style={styles.emptyText}>
                Enter an identifier, then search user or trace service records.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const InfoLine = ({ label, value }) => (
  <View style={styles.infoLine}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
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
  content: {
    padding: 16,
    paddingBottom: 90,
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
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  label: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    borderRadius: 15,
    minHeight: 54,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "700",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  serviceChip: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeServiceChip: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  serviceChipText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 11,
  },
  activeServiceChipText: {
    color: COLORS.white,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
  },
  userSection: {
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  profileIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileName: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 17,
  },
  profileEmail: {
    color: COLORS.muted,
    marginTop: 3,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 14,
    marginTop: 5,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  txRow: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    flexDirection: "row",
    gap: 10,
  },
  txRef: {
    color: COLORS.dark,
    fontWeight: "900",
  },
  txDate: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
    fontWeight: "600",
  },
  txAmount: {
    color: COLORS.secondary,
    fontWeight: "900",
  },
  txStatus: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 3,
  },
  recordCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 12,
  },
  recordTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  dateText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  infoLine: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 9,
    marginTop: 8,
  },
  infoLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoValue: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyMini: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    fontWeight: "600",
  },
});

export default SupportDashboard;