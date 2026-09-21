import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Platform,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  softYellow: "#FEF3C7",
  danger: "#DC2626",
  warning: "#D97706",
  card: "#FFFFFF",
};

const SalesHistoryScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("ALL"); // 'ALL' | 'DATA' | 'AIRTIME' | 'FUND'
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 25000,
    };
  };

  const normalizeTransactions = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.transactions)) return payload.transactions;
    if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
    if (Array.isArray(payload?.user?.transactions)) return payload.user.transactions;
    return [];
  };

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      // Bincikar duk hanyoyin da backend ke ajiye tarihin transactions
      const endpoints = [
        `${BASE_URL}/transactions/my-history`,
        `${BASE_URL}/api/v1/transactions/my-history`,
        `${BASE_URL}/transactions`,
        `${BASE_URL}/api/v1/transactions`,
        `${BASE_URL}/admin/transactions`,
        `${BASE_URL}/users/profile`,
        `${BASE_URL}/api/v1/users/me`,
      ];

      let rawList = [];

      for (const url of endpoints) {
        try {
          const res = await axios.get(url, config);
          const list = normalizeTransactions(res.data);
          if (list.length > 0) {
            rawList = list;
            break;
          }
        } catch {
          // Gwada ta gaba
        }
      }

      // Tsara bayanan kowanne transaction daidai
      const formatted = rawList.map((item, index) => {
        const id = item._id || item.id || item.transactionId || `tx_${index}_${Date.now()}`;
        const txType = String(item.type || item.category || item.service || "data").toUpperCase();
        const status = String(item.status || "success").toLowerCase();

        return {
          _id: id,
          id: id,
          reference: item.reference || item.transactionId || `REF-${id.slice(-6).toUpperCase()}`,
          type: txType,
          amount: Number(item.amount || 0),
          status: status,
          recipient: item.phoneNumber || item.phone || item.recipient || item.details?.recipient || "N/A",
          description: item.narration || item.description || item.details?.planLabel || `${txType} Transaction`,
          network: item.details?.networkName || item.details?.network || item.network || "TELECOM",
          planId: item.details?.planId || item.planId || null,
          date: item.createdAt || item.date || new Date().toISOString(),
          previousBalance: item.details?.previousBalance || null,
          newBalance: item.details?.newBalance || null,
        };
      });

      setTransactions(formatted);
    } catch (error) {
      console.log("Error loading transaction ledger:", error.message);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // Tace transactions ta hanyar bincike da rukuni
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.recipient.includes(searchQuery) ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase());

      if (selectedFilter === "ALL") return matchSearch;
      if (selectedFilter === "DATA") return matchSearch && tx.type.includes("DATA");
      if (selectedFilter === "AIRTIME") return matchSearch && tx.type.includes("AIRTIME");
      if (selectedFilter === "FUND") return matchSearch && (tx.type.includes("FUND") || tx.type.includes("CREDIT") || tx.type.includes("REFUND"));

      return matchSearch;
    });
  }, [transactions, searchQuery, selectedFilter]);

  const renderStatusBadge = (status) => {
    let bg = COLORS.softGreen;
    let txt = COLORS.secondary;
    let label = "SUCCESS";

    if (status.includes("fail")) {
      bg = COLORS.softRed;
      txt = COLORS.danger;
      label = "FAILED";
    } else if (status.includes("pend") || status.includes("process")) {
      bg = COLORS.softYellow;
      txt = COLORS.warning;
      label = "PENDING";
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color: txt }]}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const isData = item.type.includes("DATA");
    const isAirtime = item.type.includes("AIRTIME");
    const isFailed = item.status.includes("fail");

    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => setSelectedTx(item)}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.txIconBox,
            {
              backgroundColor: isFailed
                ? COLORS.softRed
                : isData
                ? COLORS.softGreen
                : isAirtime
                ? "#FEF3C7"
                : "#E0F2FE",
            },
          ]}
        >
          <MaterialCommunityIcons
            name={
              isFailed
                ? "alert-circle-outline"
                : isData
                ? "wifi"
                : isAirtime
                ? "cellphone-wireless"
                : "wallet-outline"
            }
            size={22}
            color={
              isFailed
                ? COLORS.danger
                : isData
                ? COLORS.primary
                : isAirtime
                ? COLORS.warning
                : "#0284C7"
            }
          />
        </View>

        <View style={styles.txMainInfo}>
          <Text style={styles.txTitleText} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.txSubText}>
            📞 {item.recipient} {item.planId ? `• Plan ID: ${item.planId}` : ""}
          </Text>
          <Text style={styles.txDateText}>
            {new Date(item.date).toLocaleString()}
          </Text>
        </View>

        <View style={styles.txRightInfo}>
          <Text style={[styles.txAmountText, isFailed && { color: COLORS.danger }]}>
            ₦{Number(item.amount).toLocaleString()}
          </Text>
          {renderStatusBadge(item.status)}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Transaction Records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Sales & Transaction Ledger</Text>
          <Text style={styles.headerSubtitle}>
            Real-time audit history of purchases and deposits
          </Text>
        </View>

        <TouchableOpacity style={styles.headerIconBtn} onPress={onRefresh}>
          <Ionicons name="sync" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* SEARCH & FILTERS */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by phone, reference, or description..."
            placeholderTextColor={COLORS.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {[
            { id: "ALL", label: `All (${transactions.length})` },
            { id: "DATA", label: "Data Only" },
            { id: "AIRTIME", label: "Airtime" },
            { id: "FUND", label: "Wallet / Funds" },
          ].map((flt) => (
            <TouchableOpacity
              key={flt.id}
              style={[
                styles.filterPill,
                selectedFilter === flt.id && styles.filterPillActive,
              ]}
              onPress={() => setSelectedFilter(flt.id)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedFilter === flt.id && styles.filterPillTextActive,
                ]}
              >
                {flt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* TRANSACTION LIST */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="receipt-text-remove-outline"
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No Transactions Found</Text>
            <Text style={styles.emptySubText}>
              Any airtime recharge, data purchase, or wallet deposit executed will immediately appear here.
            </Text>
          </View>
        }
      />

      {/* MODAL: TRANSACTION RECEIPT & DETAILS */}
      <Modal
        visible={Boolean(selectedTx)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalReceiptCard}>
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptBrand}>BELLAJ DATA HUB</Text>
              <Text style={styles.receiptTitle}>Electronic Transaction Receipt</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedTx(null)}
              >
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptAmountRow}>
              <Text style={styles.receiptAmountLabel}>Transaction Amount</Text>
              <Text style={styles.receiptAmountValue}>
                ₦{Number(selectedTx?.amount || 0).toLocaleString()}
              </Text>
              {selectedTx && renderStatusBadge(selectedTx.status)}
            </View>

            <View style={styles.receiptDetailsTable}>
              <ReceiptRow label="Service Type" value={selectedTx?.type} />
              <ReceiptRow label="Description" value={selectedTx?.description} />
              <ReceiptRow label="Recipient Number" value={selectedTx?.recipient} />
              {selectedTx?.planId ? (
                <ReceiptRow label="Gateway Plan ID" value={selectedTx.planId} />
              ) : null}
              <ReceiptRow label="Reference ID" value={selectedTx?.reference} />
              <ReceiptRow
                label="Date & Time"
                value={
                  selectedTx?.date
                    ? new Date(selectedTx.date).toLocaleString()
                    : "N/A"
                }
              />
            </View>

            <TouchableOpacity
              style={styles.closeReceiptBtn}
              onPress={() => setSelectedTx(null)}
            >
              <Text style={styles.closeReceiptBtnText}>Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ReceiptRow = ({ label, value }) => (
  <View style={styles.receiptRow}>
    <Text style={styles.receiptRowLabel}>{label}:</Text>
    <Text style={styles.receiptRowValue}>{value || "N/A"}</Text>
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
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  headerSubtitle: { color: "#DCFCE7", fontSize: 11, fontWeight: "600", marginTop: 2 },

  filterSection: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.dark,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  filterPillsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  filterPill: {
    backgroundColor: COLORS.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterPillText: { fontSize: 11.5, color: COLORS.muted, fontWeight: "700" },
  filterPillTextActive: { color: COLORS.white, fontWeight: "900" },

  listContent: { padding: 14, paddingBottom: 90 },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txMainInfo: { flex: 1, marginRight: 8 },
  txTitleText: { fontSize: 13.5, fontWeight: "900", color: COLORS.dark },
  txSubText: { fontSize: 11.5, color: COLORS.muted, marginTop: 2, fontWeight: "600" },
  txDateText: { fontSize: 10.5, color: "#94A3B8", marginTop: 4 },
  txRightInfo: { alignItems: "flex-end" },
  txAmountText: { fontSize: 14.5, fontWeight: "900", color: COLORS.secondary, marginBottom: 4 },

  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  statusBadgeText: { fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },

  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { color: COLORS.primary, fontWeight: "800", marginTop: 12 },
  emptyContainer: { padding: 30, alignItems: "center", justifyContent: "center", marginTop: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: COLORS.dark, marginTop: 12 },
  emptySubText: { fontSize: 12, color: COLORS.muted, textAlign: "center", marginTop: 6, lineHeight: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalReceiptCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  receiptHeader: {
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    position: "relative",
  },
  receiptBrand: { color: COLORS.primary, fontSize: 16, fontWeight: "900", letterSpacing: 1 },
  receiptTitle: { color: COLORS.muted, fontSize: 12, fontWeight: "600", marginTop: 2 },
  closeBtn: { position: "absolute", right: 0, top: 0 },
  receiptAmountRow: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  receiptAmountLabel: { fontSize: 11, color: COLORS.muted, fontWeight: "700", textTransform: "uppercase" },
  receiptAmountValue: { fontSize: 26, fontWeight: "900", color: COLORS.dark, marginVertical: 4 },
  receiptDetailsTable: { paddingVertical: 12 },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  receiptRowLabel: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  receiptRowValue: { fontSize: 12, color: COLORS.dark, fontWeight: "800", flex: 1, textAlign: "right", marginLeft: 10 },
  closeReceiptBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  closeReceiptBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 13 },
});

export default SalesHistoryScreen;