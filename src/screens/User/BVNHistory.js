import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
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
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
};

const API_ENDPOINTS = {
  history: `${BASE_URL}/verification/bvn-history`,
};

const BVNHistory = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printingId, setPrintingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const normalizeHistory = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.history)) return payload.history;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.data?.history)) return payload.data.history;
    if (Array.isArray(payload?.data?.records)) return payload.data.records;
    return [];
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      if (!headers) {
        navigation?.dispatch?.(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const { data } = await axios.get(API_ENDPOINTS.history, {
        headers,
        timeout: 30000,
      });

      setHistory(normalizeHistory(data));
    } catch (err) {
      Alert.alert(
        "History Error",
        err?.response?.data?.message || "Failed to fetch BVN history."
      );
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
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

  const getFullName = (item) => {
    return (
      item?.fullName ||
      item?.name ||
      item?.formData?.fullName ||
      `${item?.formData?.firstName || ""} ${item?.formData?.lastName || ""}`.trim() ||
      `${item?.user?.firstName || ""} ${item?.user?.surname || ""}`.trim() ||
      item?.user?.name ||
      "N/A"
    );
  };

  const downloadExistingSlip = async (item) => {
    try {
      const id = item?._id || item?.id;
      setPrintingId(id);

      const status = item?.status || "Successful";
      const serviceType =
        item?.serviceType ||
        item?.service ||
        item?.type ||
        "BVN Verification";

      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 35px; color: #0F172A;">
            <div style="border: 2px solid #E60000; border-radius: 18px; padding: 25px;">
              <div style="text-align:center;">
                <h1 style="color:#E60000; margin-bottom: 4px;">BELLAJ DATA HUB</h1>
                <p style="color:#0B5E3C; font-weight: bold;">Verification Service Portal</p>
              </div>

              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 25px 0;" />

              <h2 style="color:#121212;">BVN Verification Slip</h2>

              <p><strong>Name:</strong> ${getFullName(item)}</p>
              <p><strong>Service:</strong> ${String(serviceType).replace(/_/g, " ").toUpperCase()}</p>
              <p><strong>BVN:</strong> ${
                item?.bvnNumber ||
                item?.bvn ||
                item?.formData?.bvn ||
                item?.identifier ||
                "N/A"
              }</p>
              <p><strong>Reference:</strong> ${
                item?.reference || item?.transactionId || item?._id || "N/A"
              }</p>
              <p><strong>Date:</strong> ${
                item?.createdAt ? new Date(item.createdAt).toLocaleString() : new Date().toLocaleString()
              }</p>
              <p><strong>Status:</strong> ${String(status).toUpperCase()}</p>

              <br />

              <div style="background:#EAF7F1; padding:15px; border-left:4px solid #0B5E3C; border-radius: 8px;">
                Verification completed successfully via Bellaj Data Hub.
              </div>

              <p style="margin-top: 30px; font-size: 12px; color: #64748B;">
                This slip was generated electronically by Bellaj Data Hub.
              </p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Print Error", "Unable to generate BVN verification slip.");
    } finally {
      setPrintingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const id = item?._id || item?.id;
    const status = item?.status || "Completed";
    const serviceType =
      item?.serviceType || item?.service || item?.type || "BVN Verification";
    const statusColor = getStatusColor(status);

    return (
      <View style={styles.historyCard}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name="card-account-details-outline"
            size={26}
            color={COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.serviceTitle}>
            {String(serviceType).replace(/_/g, " ").toUpperCase()}
          </Text>

          <Text style={styles.nameText}>{getFullName(item)}</Text>

          <Text style={styles.refText}>
            Ref: {item?.reference || item?.transactionId || id || "N/A"}
          </Text>

          <Text style={styles.dateText}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleString() : "--"}
          </Text>

          <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {String(status).toUpperCase()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => downloadExistingSlip(item)}
          disabled={printingId === id}
          activeOpacity={0.86}
        >
          {printingId === id ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <MaterialCommunityIcons
              name="file-download-outline"
              size={28}
              color={COLORS.primary}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Bellaj BVN History...</Text>
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
          <Text style={styles.headerTitle}>BVN History</Text>
          <Text style={styles.headerSubtitle}>Verification records and slips</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
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
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="history"
                size={34}
                color={COLORS.white}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>BVN Verification Records</Text>
              <Text style={styles.heroText}>
                View completed BVN requests and download printable verification slips.
              </Text>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={fetchHistory}>
              <Ionicons name="refresh" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={80} color="#CBD5E1" />

            <Text style={styles.emptyTitle}>No BVN History Found</Text>

            <Text style={styles.emptySub}>
              Completed BVN verification records will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  listContent: {
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
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  historyCard: {
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
  serviceTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.dark,
  },
  nameText: {
    color: COLORS.secondary,
    fontWeight: "800",
    marginTop: 3,
    fontSize: 13,
  },
  refText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
    fontWeight: "600",
  },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  downloadBtn: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
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
    marginTop: 15,
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
  },
  emptySub: {
    marginTop: 6,
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },
});

export default BVNHistory;