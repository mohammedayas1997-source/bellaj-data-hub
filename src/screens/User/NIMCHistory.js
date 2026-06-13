// src/screens/User/NIMCHistory.js

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
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
  myRequests: `${BASE_URL}/nimc/my-requests`,
};

const NIMCHistory = ({ navigation }) => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyHistory();
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
    if (Array.isArray(payload?.myRequests)) return payload.myRequests;
    if (Array.isArray(payload?.data?.requests)) return payload.data.requests;
    return [];
  };

  const fetchMyHistory = async () => {
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

      const { data } = await axios.get(API_ENDPOINTS.myRequests, {
        headers,
        timeout: 30000,
      });

      setMyRequests(normalizeRequests(data));
    } catch (err) {
      Alert.alert(
        "History Error",
        err?.response?.data?.message || "Unable to load NIMC history."
      );
      setMyRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyHistory();
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

    if (["completed", "success", "successful", "approved"].includes(value)) {
      return COLORS.success;
    }

    if (["processing", "in-progress"].includes(value)) {
      return COLORS.warning;
    }

    if (["rejected", "failed", "declined"].includes(value)) {
      return COLORS.danger;
    }

    return COLORS.muted;
  };

  const getStatusIcon = (status) => {
    const value = String(status || "").toLowerCase();

    if (["completed", "success", "successful", "approved"].includes(value)) {
      return "check-circle";
    }

    if (["processing", "in-progress"].includes(value)) {
      return "progress-clock";
    }

    if (["rejected", "failed", "declined"].includes(value)) {
      return "close-circle";
    }

    return "clock-outline";
  };

  const downloadFile = async (url) => {
    if (!url) {
      Alert.alert("No File", "Result slip is not available yet.");
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open this file link.");
      }
    } catch {
      Alert.alert("Error", "Could not open result slip.");
    }
  };

  const renderItem = ({ item }) => {
    const status = item?.status || "pending";
    const statusColor = getStatusColor(status);
    const serviceType =
      item?.serviceType || item?.type || item?.service || "NIMC Request";

    return (
      <View style={styles.historyCard}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name="fingerprint"
            size={28}
            color={COLORS.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceType}>
                {String(serviceType).replace(/_/g, " ").toUpperCase()}
              </Text>

              <Text style={styles.dateText}>
                {item?.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "Date Not Available"}
              </Text>
            </View>

            <MaterialCommunityIcons
              name={getStatusIcon(status)}
              size={27}
              color={statusColor}
            />
          </View>

          <Text style={styles.refText}>
            Ref: {item?.reference || item?.transactionId || item?._id || "N/A"}
          </Text>

          <Text style={styles.detailText}>
            NIN: {item?.nin || item?.ninNumber || item?.formData?.nin || "N/A"}
          </Text>

          <View style={[styles.statusTag, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {String(status).toUpperCase()}
            </Text>
          </View>

          {["completed", "success", "successful", "approved"].includes(
            String(status).toLowerCase()
          ) && (
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => downloadFile(item?.slipUrl || item?.resultUrl)}
              activeOpacity={0.86}
            >
              <MaterialCommunityIcons
                name="file-download-outline"
                size={20}
                color={COLORS.white}
              />

              <Text style={styles.downloadText}>Download Result Slip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Bellaj NIMC History...</Text>
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
          <Text style={styles.headerTitle}>NIMC History</Text>
          <Text style={styles.headerSubtitle}>Service requests and results</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={myRequests}
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
                name="folder-clock-outline"
                size={34}
                color={COLORS.white}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Bellaj Service History</Text>
              <Text style={styles.heroText}>
                Track pending, processing, completed and rejected NIMC service
                requests.
              </Text>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={fetchMyHistory}>
              <Ionicons name="refresh" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="folder-open-outline"
              size={82}
              color="#CBD5E1"
            />

            <Text style={styles.emptyText}>No service requests found yet.</Text>

            <Text style={styles.emptySubText}>
              Your completed and pending NIMC requests will appear here.
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
  loader: {
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    flexDirection: "row",
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  serviceType: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.dark,
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 3,
    fontWeight: "600",
  },
  refText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },
  detailText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  statusTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  downloadBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 13,
    borderRadius: 13,
    marginTop: 12,
  },
  downloadText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: "900",
    fontSize: 13,
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
  emptyText: {
    color: COLORS.dark,
    marginTop: 15,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  emptySubText: {
    color: COLORS.muted,
    marginTop: 7,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },
});

export default NIMCHistory;