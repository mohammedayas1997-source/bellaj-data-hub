import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../../config/api";

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
  requests: `${BASE_URL}/admin/nimc-requests`,
  update: `${BASE_URL}/admin/update-nimc`,
};

const NIMCRequests = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const normalizeRequests = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.requests)) return payload.requests;
    if (Array.isArray(payload?.data?.requests)) return payload.data.requests;
    return [];
  };

  const fetchRequests = async () => {
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

      const { data } = await axios.get(API_ENDPOINTS.requests, {
        headers,
        timeout: 30000,
      });

      setRequests(normalizeRequests(data));
    } catch (err) {
      Alert.alert(
        "NIMC Error",
        err?.response?.data?.message || "Unable to load NIMC requests."
      );
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation?.navigate?.("AdminDashboard");
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

  const handleStatusUpdate = async (id, status) => {
    if (!id) {
      Alert.alert("Invalid Request", "Request ID is missing.");
      return;
    }

    Alert.alert(
      "Confirm Update",
      `Mark this request as ${status.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            try {
              setUpdating(true);

              const headers = await getAuthHeaders();

              if (!headers) {
                Alert.alert("Session Expired", "Please login again.");
                return;
              }

              const { data } = await axios.put(
                `${API_ENDPOINTS.update}/${id}`,
                { status },
                { headers, timeout: 30000 }
              );

              if (data?.success === false) {
                Alert.alert("Failed", data?.message || "Action failed.");
                return;
              }

              Alert.alert("Bellaj Data Hub", `Request marked as ${status}.`);
              setModalVisible(false);
              setSelectedReq(null);
              fetchRequests();
            } catch (err) {
              Alert.alert(
                "Update Failed",
                err?.response?.data?.message || "Action failed."
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();

    if (["completed", "success", "successful", "approved"].includes(value)) {
      return COLORS.success;
    }

    if (["processing", "in-progress"].includes(value)) return COLORS.warning;

    if (["rejected", "failed", "declined"].includes(value)) return COLORS.danger;

    return COLORS.muted;
  };

  const getStatusIcon = (status) => {
    const value = String(status || "").toLowerCase();

    if (["completed", "success", "successful", "approved"].includes(value)) {
      return "check-circle";
    }

    if (["processing", "in-progress"].includes(value)) return "progress-clock";

    if (["rejected", "failed", "declined"].includes(value)) {
      return "close-circle";
    }

    return "clock-outline";
  };

  const getUserName = (item) => {
    return (
      item?.user?.name ||
      item?.user?.fullName ||
      `${item?.user?.firstName || ""} ${item?.user?.surname || ""}`.trim() ||
      item?.formData?.fullName ||
      "Bellaj User"
    );
  };

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(
        (r) => String(r?.status || "pending").toLowerCase() === "pending"
      ).length,
      processing: requests.filter(
        (r) => String(r?.status || "").toLowerCase() === "processing"
      ).length,
      completed: requests.filter((r) =>
        ["completed", "success", "successful", "approved"].includes(
          String(r?.status || "").toLowerCase()
        )
      ).length,
    };
  }, [requests]);

  const renderItem = ({ item }) => {
    const status = item?.status || "pending";
    const statusColor = getStatusColor(status);

    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => {
          setSelectedReq(item);
          setModalVisible(true);
        }}
        activeOpacity={0.86}
      >
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name="fingerprint"
            size={27}
            color={COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{getUserName(item)}</Text>

          <Text style={styles.serviceType}>
            {(item?.serviceType || item?.type || "NIMC REQUEST")
              .replace(/_/g, " ")
              .toUpperCase()}
          </Text>

          <Text style={styles.dateText}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleString() : "--"}
          </Text>
        </View>

        <View style={styles.statusBox}>
          <MaterialCommunityIcons
            name={getStatusIcon(status)}
            size={22}
            color={statusColor}
          />

          <Text style={[styles.statusText, { color: statusColor }]}>
            {status}
          </Text>

          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading NIMC Requests...</Text>
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
          <Text style={styles.headerTitle}>NIMC Requests</Text>
          <Text style={styles.headerSubtitle}>Admin service approval center</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item, index) => item?._id || item?.id || index.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator
        contentContainerStyle={styles.listContent}
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
                  name="account-details-outline"
                  size={34}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Bellaj NIMC Control</Text>
                <Text style={styles.heroText}>
                  Review, process, reject and approve NIMC service requests in
                  real time.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshBtn} onPress={fetchRequests}>
                <Ionicons name="refresh" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Total" value={stats.total} color={COLORS.primary} />
              <StatCard label="Pending" value={stats.pending} color={COLORS.muted} />
              <StatCard label="Processing" value={stats.processing} color={COLORS.warning} />
              <StatCard label="Completed" value={stats.completed} color={COLORS.secondary} />
            </View>

            <Text style={styles.sectionTitle}>Requests</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={80} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Requests Found</Text>
            <Text style={styles.emptyText}>
              Bellaj NIMC requests will appear here.
            </Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalHeader}>
              {(selectedReq?.serviceType || selectedReq?.type || "NIMC")
                .replace(/_/g, " ")
                .toUpperCase()}{" "}
              DETAILS
            </Text>

            <ScrollView style={{ maxHeight: 430 }} showsVerticalScrollIndicator>
              <DetailRow label="User" value={selectedReq ? getUserName(selectedReq) : ""} />
              <DetailRow label="Email" value={selectedReq?.user?.email} />
              <DetailRow label="Phone" value={selectedReq?.user?.phone || selectedReq?.user?.phoneNumber} />
              <DetailRow label="NIN Number" value={selectedReq?.ninNumber || selectedReq?.nin || selectedReq?.formData?.ninNumber} />
              <DetailRow label="Reference" value={selectedReq?.reference || selectedReq?.transactionId || selectedReq?._id} />
              <DetailRow label="Status" value={selectedReq?.status || "pending"} />
              <DetailRow
                label="Date"
                value={
                  selectedReq?.createdAt
                    ? new Date(selectedReq.createdAt).toLocaleString()
                    : "N/A"
                }
              />

              {selectedReq?.formData &&
                Object.entries(selectedReq.formData).map(([key, value]) => (
                  <DetailRow
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1")}
                    value={typeof value === "object" ? JSON.stringify(value) : value}
                  />
                ))}
            </ScrollView>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => handleStatusUpdate(selectedReq?._id || selectedReq?.id, "rejected")}
                disabled={updating}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.warning }]}
                onPress={() => handleStatusUpdate(selectedReq?._id || selectedReq?.id, "processing")}
                disabled={updating}
              >
                <Text style={styles.btnText}>Process</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
                onPress={() => handleStatusUpdate(selectedReq?._id || selectedReq?.id, "completed")}
                disabled={updating}
              >
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
            </View>

            {updating && (
              <ActivityIndicator
                color={COLORS.primary}
                style={{ marginTop: 15 }}
              />
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setModalVisible(false);
                setSelectedReq(null);
              }}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>

    <Text style={styles.detailValue}>
      {value === undefined || value === null || value === "" ? "N/A" : String(value)}
    </Text>
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
  listContent: {
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
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userName: {
    fontWeight: "900",
    fontSize: 15,
    color: COLORS.dark,
  },
  serviceType: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 4,
    fontWeight: "800",
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "600",
  },
  statusBox: {
    alignItems: "center",
    gap: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
    color: COLORS.dark,
  },
  emptyText: {
    color: COLORS.muted,
    marginTop: 7,
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 21,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: "88%",
  },
  modalHandle: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 18,
    color: COLORS.primary,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    gap: 15,
  },
  detailLabel: {
    color: COLORS.muted,
    fontSize: 12,
    textTransform: "capitalize",
    flex: 1,
    fontWeight: "800",
  },
  detailValue: {
    fontWeight: "900",
    color: COLORS.dark,
    flex: 1,
    textAlign: "right",
    fontSize: 12,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 8,
  },
  actionBtn: {
    padding: 13,
    borderRadius: 13,
    flex: 1,
    alignItems: "center",
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
  },
  closeBtn: {
    marginTop: 18,
    alignItems: "center",
    paddingVertical: 8,
  },
  closeText: {
    color: COLORS.primary,
    fontWeight: "900",
  },
});

export default NIMCRequests;