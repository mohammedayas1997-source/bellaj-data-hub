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
import BASE_URL from "../../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
};

const NIMCHistory = ({ navigation }) => {
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyHistory = async () => {
    try {
      const { data } = await axios.get("/api/v1/nimc/my-requests");
      setMyRequests(data.data || []);
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
        return "#64748B";
      case "processing":
        return "#F59E0B";
      case "completed":
        return COLORS.secondary;
      case "rejected":
        return COLORS.primary;
      default:
        return "#94A3B8";
    }
  };

  const downloadFile = (url) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Couldn't open file", err),
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
              : "Date Not Available"}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={item.status === "completed" ? "check-circle" : "clock-outline"}
          size={26}
          color={getStatusColor(item.status)}
        />
      </View>

      <View
        style={[
          styles.statusTag,
          {
            backgroundColor: getStatusColor(item.status),
          },
        ]}
      >
        <Text style={styles.statusText}>
          {item.status === "processing"
            ? "🕒 PROCESSING..."
            : item.status?.toUpperCase()}
        </Text>
      </View>

      {item.status === "completed" && item.slipUrl && (
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={() => downloadFile(item.slipUrl)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="file-download" size={20} color="#fff" />

          <Text style={styles.downloadText}>Download Result Slip</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bellaj Service History</Text>

        <View style={{ width: 25 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingText}>Loading Bellaj history...</Text>
        </View>
      ) : (
        <FlatList
          data={myRequests}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="folder-open-outline"
                size={85}
                color="#CBD5E1"
              />

              <Text style={styles.emptyText}>
                No service requests found yet.
              </Text>

              <Text style={styles.emptySubText}>
                Your completed and pending requests will appear here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },

  headerContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.white,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
  },

  historyCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 18,
    marginBottom: 15,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  serviceType: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.dark,
  },

  dateText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 3,
  },

  statusTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 12,
  },

  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  downloadBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    marginTop: 5,
  },

  downloadText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 14,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    marginTop: 100,
  },

  emptyText: {
    color: COLORS.dark,
    marginTop: 15,
    fontSize: 17,
    fontWeight: "700",
  },

  emptySubText: {
    color: COLORS.muted,
    marginTop: 5,
    textAlign: "center",
    fontSize: 13,
  },
});

export default NIMCHistory;
