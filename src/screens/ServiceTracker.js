import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  RefreshControl,
  Platform,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
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
  warning: "#F59E0B",
  success: "#16A34A",
  danger: "#DC2626",
};

const API_ENDPOINTS = {
  traceService: `${BASE_URL}/admin/service-tracker/trace`,
  refund: `${BASE_URL}/admin/service-tracker/refund`,
};

const SERVICE_TYPES = [
  { id: "data", label: "DATA", icon: "wifi" },
  { id: "airtime", label: "AIRTIME", icon: "cellphone" },
  { id: "nimc", label: "NIMC", icon: "fingerprint" },
  { id: "bvn", label: "BVN", icon: "card-account-details-outline" },
  { id: "electricity", label: "POWER", icon: "lightning-bolt" },
  { id: "cable", label: "CABLE", icon: "television-classic" },
];

const ServiceTracker = ({ navigation }) => {
  const [identifier, setIdentifier] = useState("");
  const [serviceType, setServiceType] = useState("data");
  const [loading, setLoading] = useState(false);
  const [refundLoadingId, setRefundLoadingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState([]);
  const [lastSearch, setLastSearch] = useState("");

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const normalizeResults = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.transactions)) return payload.transactions;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
    return [];
  };

  const handleTrace = async () => {
    if (!identifier.trim()) {
      Alert.alert("Required", "Please enter a phone number, transaction ID or reference.");
      return;
    }

    try {
      setLoading(true);
      setLastSearch(identifier.trim());

      const headers = await getAuthHeaders();

      if (!headers) {
        Alert.alert("Session Expired", "Please login again.", [
          { text: "Login", onPress: () => navigation?.navigate?.("Login") },
        ]);
        return;
      }

      const { data } = await axios.get(
        `${API_ENDPOINTS.traceService}/${serviceType}/${encodeURIComponent(
          identifier.trim()
        )}`,
        {
          headers,
          timeout: 30000,
        }
      );

      const records = normalizeResults(data);
      setResults(records);

      if (records.length === 0) {
        Alert.alert(
          "No Records",
          `No records found for ${identifier.trim()} in ${serviceType.toUpperCase()}.`
        );
      }
    } catch (error) {
      setResults([]);
      Alert.alert(
        "Trace Failed",
        error?.response?.data?.message ||
          `No records found for ${identifier.trim()} in ${serviceType.toUpperCase()}.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (!lastSearch) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    handleTrace();
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

          navigation?.dispatch?.(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        },
      },
    ]);
  };

  const initiateRefund = (transactionId) => {
    if (!transactionId) {
      Alert.alert("Invalid Transaction", "Transaction ID is missing.");
      return;
    }

    const submitRefund = async (reason = "Refund requested from service tracker") => {
      try {
        setRefundLoadingId(transactionId);

        const headers = await getAuthHeaders();

        if (!headers) {
          Alert.alert("Session Expired", "Please login again.");
          return;
        }

        const { data } = await axios.post(
          API_ENDPOINTS.refund,
          {
            transactionId,
            reason: reason || "Refund requested from service tracker",
            serviceType,
          },
          {
            headers,
            timeout: 30000,
          }
        );

        if (data?.success === false) {
          Alert.alert("Refund Failed", data?.message || "Refund request failed.");
          return;
        }

        Alert.alert("Bellaj Data Hub", data?.message || "Refund request has been logged.");
        handleTrace();
      } catch (error) {
        Alert.alert(
          "Refund Failed",
          error?.response?.data?.message || "Could not process refund."
        );
      } finally {
        setRefundLoadingId(null);
      }
    };

    if (Platform.OS === "ios" && Alert.prompt) {
      Alert.prompt("Confirm Refund Request", "Enter the reason for this refund:", [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: submitRefund },
      ]);
      return;
    }

    Alert.alert(
      "Confirm Refund Request",
      "Submit refund request for this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: () => submitRefund("Refund requested from service tracker"),
        },
      ]
    );
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

  const stats = useMemo(() => {
    const totalValue = results.reduce(
      (sum, item) => sum + Number(item?.amount || item?.totalAmount || 0),
      0
    );

    return {
      total: results.length,
      successful: results.filter((item) =>
        ["success", "successful", "completed", "approved"].includes(
          String(item?.status || "").toLowerCase()
        )
      ).length,
      totalValue,
    };
  }, [results]);

  const renderResultItem = ({ item }) => {
    const transactionId = item?._id || item?.id || item?.transactionId;
    const status = item?.status || "Pending";
    const amount = item?.amount || item?.totalAmount || 0;
    const reference =
      item?.reference ||
      item?.transactionId ||
      item?.requestId ||
      item?.phoneNumber ||
      item?.nin ||
      "N/A";

    const userName =
      item?.user?.name ||
      item?.user?.fullName ||
      `${item?.user?.firstName || ""} ${item?.user?.surname || ""}`.trim() ||
      item?.customerName ||
      "Unknown User";

    const isRefunding = refundLoadingId === transactionId;

    return (
      <View style={styles.resultCard}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${getStatusColor(status)}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {status}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleString() : "No date"}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountText}>
            {amount ? `₦${Number(amount).toLocaleString()}` : `${item?.dataAmountGB || 0} GB`}
          </Text>

          <MaterialCommunityIcons
            name="receipt-text-outline"
            size={25}
            color={COLORS.primary}
          />
        </View>

        <InfoLine label="Reference" value={reference} />
        <InfoLine label="User" value={userName} />
        <InfoLine
          label="Service"
          value={item?.type || item?.service || serviceType.toUpperCase()}
        />
        <InfoLine label="Phone / ID" value={item?.phoneNumber || item?.identifier || identifier || "N/A"} />

        <TouchableOpacity
          style={[styles.refundBtn, isRefunding && { opacity: 0.7 }]}
          onPress={() => initiateRefund(transactionId)}
          disabled={isRefunding}
          activeOpacity={0.86}
        >
          {isRefunding ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="cash-refund"
                size={19}
                color={COLORS.primary}
              />
              <Text style={styles.refundBtnText}>Initiate Refund</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Service Investigation</Text>
          <Text style={styles.headerSubtitle}>
            Trace NIMC, BVN, Data and utility transactions
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={(item, index) =>
          item?._id || item?.id || item?.transactionId || index.toString()
        }
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name="magnify-scan"
                  size={34}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Investigation Center</Text>
                <Text style={styles.heroText}>
                  Search records by phone number, transaction ID, reference or identity number.
                </Text>
              </View>
            </View>

            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Select Service Type</Text>

              <View style={styles.tabContainer}>
                {SERVICE_TYPES.map((type) => {
                  const active = serviceType === type.id;

                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.tab, active && styles.activeTab]}
                      onPress={() => setServiceType(type.id)}
                      activeOpacity={0.86}
                    >
                      <MaterialCommunityIcons
                        name={type.icon}
                        size={17}
                        color={active ? COLORS.white : COLORS.primary}
                      />
                      <Text style={[styles.tabText, active && styles.activeTabText]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>Search Identifier</Text>

              <View style={styles.inputWrapper}>
                <Ionicons name="search" size={20} color={COLORS.muted} />
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${serviceType} phone, reference or ID...`}
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.searchBtn, loading && { opacity: 0.75 }]}
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
                      size={21}
                      color={COLORS.white}
                    />
                    <Text style={styles.searchBtnText}>TRACE REQUEST</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {results.length > 0 && (
              <View style={styles.statsRow}>
                <StatCard label="Records" value={stats.total} color={COLORS.primary} />
                <StatCard label="Success" value={stats.successful} color={COLORS.secondary} />
                <StatCard
                  label="Value"
                  value={`₦${Number(stats.totalValue || 0).toLocaleString()}`}
                  color={COLORS.dark}
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="database-search-outline"
                size={60}
                color="#CBD5E1"
              />
              <Text style={styles.emptyTitle}>No Investigation Records</Text>
              <Text style={styles.emptyText}>
                Enter an identifier and tap trace request to begin Bellaj investigation.
              </Text>
            </View>
          )
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

const StatCard = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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
    fontSize: 19,
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
  listPadding: {
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
  searchSection: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 13,
  },
  tabContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeTab: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  tabText: {
    fontSize: 10,
    fontWeight: "900",
    color: COLORS.primary,
  },
  activeTabText: {
    color: COLORS.white,
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
    marginBottom: 13,
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
  searchBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  searchBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 14,
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
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 17,
    fontWeight: "900",
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  resultCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  amountText: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.dark,
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
  refundBtn: {
    marginTop: 15,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.softRed,
    flexDirection: "row",
    gap: 7,
  },
  refundBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 12,
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
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

export default ServiceTracker;