import React, { useEffect, useMemo, useState } from "react";
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
  trackTx: `${BASE_URL}/admin/track-transaction`,
  reports: `${BASE_URL}/admin/reports`,
  resolveIssue: `${BASE_URL}/admin/resolve-issue`,
};

const IssueResolution = ({ navigation }) => {
  const [searchId, setSearchId] = useState("");
  const [foundData, setFoundData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingReports, setLoadingReports] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("adminToken")) ||
      (await AsyncStorage.getItem("token"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.requests)) return payload.requests;
    if (Array.isArray(payload?.reports)) return payload.reports;
    if (Array.isArray(payload?.data?.requests)) return payload.data.requests;
    if (Array.isArray(payload?.data?.reports)) return payload.data.reports;
    return [];
  };

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.reports, { headers });
      setReports(getArray(data));
    } catch (error) {
      Alert.alert("Connection Error", "Failed to load support reports.");
    } finally {
      setLoadingReports(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
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

  const handleSearch = async () => {
    if (!searchId.trim()) {
      Alert.alert("Input Required", "Please enter a Transaction ID or reference.");
      return;
    }

    try {
      setLoadingSearch(true);
      setFoundData(null);

      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.trackTx, {
        headers,
        params: { reference: searchId.trim(), transactionId: searchId.trim() },
      });

      setFoundData(data?.data || data);
    } catch (error) {
      setFoundData(null);
      Alert.alert("Not Found", "This transaction was not found.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAction = async (id, action) => {
    Alert.alert(
      action === "resolve" ? "Approve Refund" : "Reject Report",
      `Are you sure you want to ${action} this support report?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "resolve" ? "Approve" : "Reject",
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            try {
              setActiveActionId(id);
              const headers = await getAuthHeaders();

              const { data } = await axios.post(
                API_ENDPOINTS.resolveIssue,
                {
                  requestId: id,
                  action,
                  adminNote: "Resolved via Bellaj Data Hub Admin Portal",
                },
                { headers }
              );

              if (data?.success === false) {
                Alert.alert("Failed", data?.message || "Action failed.");
                return;
              }

              Alert.alert(
                "Success",
                action === "resolve"
                  ? "Refund approved successfully."
                  : "Report rejected successfully."
              );

              loadReports();
            } catch (error) {
              Alert.alert("Operation Failed", "Could not complete the request.");
            } finally {
              setActiveActionId(null);
            }
          },
        },
      ]
    );
  };

  const stats = useMemo(() => {
    const pending = reports.filter(
      (item) =>
        !item?.status ||
        item?.status?.toLowerCase() === "pending" ||
        item?.status?.toLowerCase() === "open"
    ).length;

    const resolved = reports.filter(
      (item) => item?.status?.toLowerCase() === "resolved"
    ).length;

    return {
      total: reports.length,
      pending,
      resolved,
    };
  }, [reports]);

  const transaction = foundData?.transaction || foundData;
  const userData = foundData?.userData || foundData?.user || {};

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
  style={styles.headerIconBtn}
  onPress={goBack}
>
  <Ionicons
    name="arrow-back"
    size={23}
    color={COLORS.white}
  />
</TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Issue Resolution</Text>
          <Text style={styles.headerSubtitle}>Track transactions and resolve disputes</Text>
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
              name="lifebuoy"
              size={34}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Support Command Center</Text>
            <Text style={styles.heroText}>
              Investigate transaction references, approve refunds and close customer
              support reports in real time.
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
            <Text style={styles.statLabel}>Total Reports</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: "#F59E0B" }]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{stats.pending}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}>
            <Text style={styles.statLabel}>Resolved</Text>
            <Text style={styles.statValue}>{stats.resolved}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Track Transaction</Text>
          <Text style={styles.sectionText}>
            Enter transaction ID, reference number or system reference.
          </Text>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={COLORS.muted}
            />
            <TextInput
              placeholder="Enter Transaction ID or Reference..."
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={searchId}
              onChangeText={setSearchId}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.btnSearch}
            onPress={handleSearch}
            disabled={loadingSearch}
            activeOpacity={0.86}
          >
            {loadingSearch ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="shield-search"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.btnText}>INVESTIGATE ID</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {foundData && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons
                name="check-decagram-outline"
                size={25}
                color={COLORS.secondary}
              />
              <Text style={styles.resultTitle}>Search Result Details</Text>
            </View>

            <InfoRow label="User Name" value={userData?.name || userData?.fullName || "N/A"} />
            <InfoRow label="Email" value={userData?.email || "N/A"} />
            <InfoRow
              label="Amount"
              value={`₦${Number(transaction?.amount || 0).toLocaleString()}`}
            />
            <InfoRow label="Status" value={transaction?.status || "Unknown"} />
            <InfoRow
              label="Reference"
              value={transaction?.reference || transaction?.transactionId || "N/A"}
            />
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.subTitle}>Pending Support Reports</Text>

          <TouchableOpacity style={styles.reloadBtn} onPress={loadReports}>
            <Ionicons name="refresh" size={17} color={COLORS.white} />
            <Text style={styles.reloadText}>Reload</Text>
          </TouchableOpacity>
        </View>

        {loadingReports ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading support reports...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={40}
              color={COLORS.muted}
            />
            <Text style={styles.emptyTitle}>No Active Reports</Text>
            <Text style={styles.emptyText}>
              Support requests will appear here when customers submit disputes.
            </Text>
          </View>
        ) : (
          reports.map((item) => (
            <View key={item._id || item.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportId}>
                    TX ID: {item.transactionId || item.reference || "N/A"}
                  </Text>
                  <Text style={styles.timestamp}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "N/A"}
                  </Text>
                </View>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status || "pending"}</Text>
                </View>
              </View>

              <Text style={styles.reasonTitle}>Reason for Dispute</Text>
              <Text style={styles.reasonText}>{item.reason || "No reason provided"}</Text>

              {!!item.userEmail && (
                <Text style={styles.customerText}>Customer: {item.userEmail}</Text>
              )}

              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.btnApprove}
                  onPress={() => handleAction(item._id || item.id, "resolve")}
                  disabled={activeActionId === (item._id || item.id)}
                  activeOpacity={0.86}
                >
                  {activeActionId === (item._id || item.id) ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.btnText}>APPROVE REFUND</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnReject}
                  onPress={() => handleAction(item._id || item.id, "reject")}
                  disabled={activeActionId === (item._id || item.id)}
                  activeOpacity={0.86}
                >
                  <Text style={styles.btnText}>REJECT</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.resultRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
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
  headerTitle: { color: COLORS.white, fontSize: 19, fontWeight: "900" },
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
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80, flexGrow: 1 },
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
  heroTitle: { color: COLORS.dark, fontSize: 20, fontWeight: "900" },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
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
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: COLORS.dark },
  sectionText: {
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
  btnSearch: {
    backgroundColor: COLORS.primary,
    minHeight: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#B7E4CD",
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  resultTitle: { fontSize: 15, fontWeight: "900", color: COLORS.secondary },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  label: { color: COLORS.muted, fontSize: 13, fontWeight: "700" },
  value: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subTitle: { fontSize: 18, fontWeight: "900", color: COLORS.dark },
  reloadBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reloadText: { color: COLORS.white, fontWeight: "900", fontSize: 12 },
  loadingBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  loadingText: { color: COLORS.muted, marginTop: 8, fontWeight: "700" },
  reportCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 14,
    borderRadius: 20,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  reportId: { fontSize: 13, fontWeight: "900", color: COLORS.dark },
  timestamp: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
  statusBadge: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  reasonTitle: { fontSize: 12, fontWeight: "900", color: COLORS.secondary },
  reasonText: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    fontWeight: "600",
    lineHeight: 19,
  },
  customerText: {
    color: COLORS.dark,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  row: { flexDirection: "row", marginTop: 16, gap: 10 },
  btnApprove: {
    backgroundColor: COLORS.secondary,
    padding: 13,
    borderRadius: 13,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnReject: {
    backgroundColor: COLORS.primary,
    padding: 13,
    borderRadius: 13,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    padding: 25,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 20,
  },
});

export default IssueResolution;