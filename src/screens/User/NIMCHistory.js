// src/screens/User/NIMCHistory.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import axios from "axios";

const NIMCHistory = ({ navigation }) => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyHistory = async () => {
    try {
      // Tabbatar URL din nan ya yi daidai da na backend dinka
      const { data } = await axios.get("/api/v1/nimc/my-requests");
      setMyRequests(data.data);
    } catch (err) {
      console.log("Error fetching history", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMyHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyHistory();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#64748b"; // Grey
      case "processing":
        return "#f59e0b"; // Orange
      case "completed":
        return "#10b981"; // Green
      case "rejected":
        return "#ef4444"; // Red
      default:
        return "#94a3b8";
    }
  };

  const downloadFile = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Couldn't load page", err),
      );
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.serviceType}>
            {item.serviceType?.toUpperCase()}
          </Text>
          <Text style={styles.dateText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : "Date N/A"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={item.status === "completed" ? "check-circle" : "clock-outline"}
          size={24}
          color={getStatusColor(item.status)}
        />
      </View>

      <View
        style={[
          styles.statusTag,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.statusText}>
          {item.status === "processing"
            ? "🕒 PROCESSING..."
            : item.status?.toUpperCase()}
        </Text>
      </View>

      {/* Wannan shine wajen Download idan Admin ya saka file */}
      {item.status === "completed" && item.slipUrl && (
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => downloadFile(item.slipUrl)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="file-download" size={20} color="#fff" />
          <Text style={styles.downloadText}>Download Result Slip</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application History</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={{ marginTop: 10, color: "#64748b" }}>
            Loading history...
          </Text>
        </View>
      ) : (
        <FlatList
          data={myRequests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="folder-open-outline"
                size={80}
                color="#e2e8f0"
              />
              <Text style={styles.emptyText}>
                Baka da wani aiki a halin yanzu.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerContainer: {
    backgroundColor: "#0f172a",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  historyCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceType: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  dateText: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  statusTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  downloadBtn: {
    backgroundColor: "#1e3a8a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
  },
  downloadText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: { flex: 1, alignItems: "center", marginTop: 100 },
  emptyText: { color: "#94a3b8", marginTop: 15, fontSize: 16 },
});

export default NIMCHistory;
