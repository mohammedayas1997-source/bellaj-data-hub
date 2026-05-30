import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  success: "#16A34A",
  danger: "#DC2626",
};

const API_ENDPOINTS = {
  transactionHistory: "", // Add Bellaj API here
};

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (!API_ENDPOINTS.transactionHistory) {
        setHistory([]);
        return;
      }

      const response = await axios.get(API_ENDPOINTS.transactionHistory, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setHistory(response?.data?.data || []);
    } catch (error) {
      console.log("History Error:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }) => {
    const isSuccess = item?.status?.toLowerCase() === "success";

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.type}>
              {(item?.type || "Transaction").toUpperCase()}
            </Text>
          </View>

          <Text
            style={[
              styles.status,
              {
                color: isSuccess ? COLORS.success : COLORS.danger,
              },
            ]}
          >
            {item?.status || "Pending"}
          </Text>
        </View>

        <Text style={styles.detail}>
          {item?.phoneNumber || item?.reference || "No Reference"}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.date}>
            {item?.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : "--"}
          </Text>

          <Text style={styles.amount}>₦{item?.amount || "0.00"}</Text>
        </View>
      </View>
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
    <View style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>

      <FlatList
        data={history}
        keyExtractor={(item, index) => item?._id || index.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📜</Text>

            <Text style={styles.emptyTitle}>No Transactions Yet</Text>

            <Text style={styles.emptyText}>
              Your Bellaj Data Hub transaction history will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 15,
  },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 15,
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
  },

  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  typeBadge: {
    backgroundColor: "#FFF1F1",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  type: {
    fontWeight: "bold",
    fontSize: 13,
    color: COLORS.primary,
  },

  status: {
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "capitalize",
  },

  detail: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 10,
  },

  date: {
    color: "#94A3B8",
    fontSize: 12,
  },

  amount: {
    fontWeight: "bold",
    fontSize: 18,
    color: COLORS.secondary,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 6,
  },

  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    lineHeight: 22,
  },
});

export default HistoryScreen;
