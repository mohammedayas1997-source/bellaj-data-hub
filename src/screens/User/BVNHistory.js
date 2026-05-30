import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
};

const BVNHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("/api/v1/verification/bvn-history");
      setHistory(res.data?.data || []);
    } catch (err) {
      console.log("Failed to fetch BVN history", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadExistingSlip = async (item) => {
    const htmlContent = `
      <html>
        <body style="font-family: Arial; padding:40px;">
          <div style="text-align:center;">
            <h1 style="color:#E60000;">
              BELLAJ DATA HUB
            </h1>
            <p style="color:#0B5E3C;">
              Verification Service Portal
            </p>
          </div>

          <hr/>

          <h2 style="color:#121212;">
            BVN Verification Slip
          </h2>

          <p>
            <strong>Name:</strong>
            ${item.formData?.firstName || "N/A"} ${
              item.formData?.lastName || ""
            }
          </p>

          <p>
            <strong>Service:</strong>
            ${item.serviceType}
          </p>

          <p>
            <strong>Date:</strong>
            ${new Date(item.createdAt).toLocaleDateString()}
          </p>

          <p>
            <strong>Status:</strong>
            SUCCESSFUL
          </p>

          <br/>

          <div
            style="
              background:#EAF7F1;
              padding:15px;
              border-left:4px solid #0B5E3C;
            "
          >
            Verification completed successfully via
            Bellaj Data Hub.
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
    });

    await Sharing.shareAsync(uri);
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
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>
                {item.serviceType?.replace("_", " ")?.toUpperCase()}
              </Text>

              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>

              <Text style={styles.statusText}>✓ COMPLETED</Text>
            </View>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => downloadExistingSlip(item)}
            >
              <MaterialCommunityIcons
                name="file-download"
                size={28}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        )}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 15,
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
  },

  historyCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 3,
  },

  serviceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
  },

  dateText: {
    fontSize: 12,
    color: COLORS.muted,
    marginVertical: 4,
  },

  statusText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: "bold",
  },

  downloadBtn: {
    padding: 10,
  },

  emptyState: {
    marginTop: 100,
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },

  emptySub: {
    marginTop: 6,
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 13,
  },
});

export default BVNHistory;
