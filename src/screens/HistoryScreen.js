import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
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
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
};

const API_ENDPOINTS = {
  transactionHistory: `${BASE_URL}/transactions/history`,
};

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeTransactions = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.transactions)) return payload.transactions;
    if (Array.isArray(payload?.history)) return payload.history;
    if (Array.isArray(payload?.data?.transactions)) {
      return payload.data.transactions;
    }
    if (Array.isArray(payload?.data?.history)) {
      return payload.data.history;
    }
    return [];
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.transactionHistory, {
        headers,
      });

      setHistory(normalizeTransactions(data));
    } catch (error) {
      Alert.alert(
        "Connection Error",
        error?.response?.data?.message ||
          "Unable to load transaction history."
      );
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

  const getIcon = (type) => {
    switch ((type || "").toLowerCase()) {
      case "airtime":
        return "cellphone";
      case "data":
        return "wifi";
      case "electricity":
        return "lightning-bolt";
      case "cable":
        return "television-classic";
      case "bvn":
        return "card-account-details-outline";
      case "nimc":
      case "nin":
        return "fingerprint";
      case "wallet":
      case "funding":
        return "wallet-outline";
      default:
        return "receipt-text-outline";
    }
  };

  const getStatusColor = (status) => {
    const value = (status || "").toLowerCase();

    if (["success", "successful", "completed", "approved"].includes(value)) {
      return COLORS.success;
    }

    if (["failed", "rejected", "declined"].includes(value)) {
      return COLORS.danger;
    }

    return COLORS.warning;
  };

  const stats = useMemo(() => {
    const totalAmount = history.reduce(
      (sum, item) => sum + Number(item?.amount || item?.totalAmount || 0),
      0
    );

    const successful = history.filter((item) =>
      ["success", "successful", "completed", "approved"].includes(
        (item?.status || "").toLowerCase()
      )
    ).length;

    return {
      total: history.length,
      successful,
      totalAmount,
    };
  }, [history]);

  const renderItem = ({ item }) => {
    const status = item?.status || "Pending";
    const amount = item?.amount || item?.totalAmount || 0;
    const type = item?.type || item?.service || "Transaction";
    const reference =
      item?.reference ||
      item?.transactionId ||
      item?.phoneNumber ||
      item?.meterNumber ||
      item?.smartCard ||
      "No Reference";

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.86}>
        <View style={styles.topRow}>
          <View style={styles.leftBox}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name={getIcon(type)}
                size={24}
                color={COLORS.primary}
              />
            </View>

            <View>
              <Text style={styles.type}>{String(type).toUpperCase()}</Text>
              <Text style={styles.detail}>{reference}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(status)}20` },
            ]}
          >
            <Text style={[styles.status, { color: getStatusColor(status) }]}>
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.date}>
            {item?.createdAt
              ? new Date(item.createdAt).toLocaleString()
              : "--"}
          </Text>

          <Text style={styles.amount}>
            ₦{Number(amount || 0).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Transactions...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Transaction History</Text>
          <Text style={styles.headerSubtitle}>Bellaj Data Hub activity logs</Text>
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
        keyboardShouldPersistTaps="handled"
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
                  name="receipt-text-outline"
                  size={34}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Transaction Center</Text>
                <Text style={styles.heroText}>
                  View airtime, data, wallet, electricity, cable and identity
                  service records in real time.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshBtn} onPress={fetchHistory}>
                <Ionicons name="refresh" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
                <Text style={styles.statLabel}>Total Records</Text>
                <Text style={styles.statValue}>{stats.total}</Text>
              </View>

              <View
                style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}
              >
                <Text style={styles.statLabel}>Successful</Text>
                <Text style={styles.statValue}>{stats.successful}</Text>
              </View>

              <View style={[styles.statCard, { borderLeftColor: COLORS.dark }]}>
                <Text style={styles.statLabel}>Total Value</Text>
                <Text style={styles.statValueSmall}>
                  ₦{Number(stats.totalAmount || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-text-clock-outline"
              size={54}
              color={COLORS.muted}
            />

            <Text style={styles.emptyTitle}>No Transactions Yet</Text>

            <Text style={styles.emptyText}>
              Your Bellaj Data Hub transaction history will appear here.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
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
    paddingBottom: 80,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontWeight: "700",
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
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
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
  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
  },
  statValueSmall: {
    color: COLORS.dark,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 13,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  leftBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "#FFF1F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  type: {
    fontWeight: "900",
    fontSize: 13,
    color: COLORS.dark,
  },
  detail: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  status: {
    fontWeight: "900",
    fontSize: 10,
    textTransform: "uppercase",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 10,
  },
  date: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  amount: {
    fontWeight: "900",
    fontSize: 17,
    color: COLORS.secondary,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 70,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    padding: 26,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    lineHeight: 22,
    fontWeight: "600",
  },
});

export default HistoryScreen;