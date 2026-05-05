import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const BVNHistory = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get("/api/v1/verification/bvn-history");
      setHistory(res.data.data);
    } catch (err) {
      console.error("Failed to fetch history");
    } finally {
      setLoading(false);
    }
  };

  const downloadExistingSlip = async (item) => {
    const htmlContent = `
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h1 style="text-align: center; color: #0f172a;">AYAX DIGITAL SOLUTIONS</h1>
          <hr/>
          <h3>BVN Verification Slip</h3>
          <p><strong>Name:</strong> ${item.formData?.firstName || "N/A"} ${item.formData?.lastName || ""}</p>
          <p><strong>Service:</strong> ${item.serviceType}</p>
          <p><strong>Date:</strong> ${new Date(item.createdAt).toLocaleDateString()}</p>
          <p><strong>Status:</strong> SUCCESSFUL</p>
        </body>
      </html>
    `;
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri);
  };

  if (loading)
    return (
      <ActivityIndicator size="large" color="#38bdf8" style={{ flex: 1 }} />
    );

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>
                {item.serviceType.replace("_", " ").toUpperCase()}
              </Text>
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.statusText}>Status: Completed</Text>
            </View>
            <TouchableOpacity onPress={() => downloadExistingSlip(item)}>
              <MaterialCommunityIcons
                name="file-download"
                size={28}
                color="#ef4444"
              />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No BVN history found.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 15 },
  historyCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  serviceTitle: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },
  dateText: { fontSize: 12, color: "#64748b", marginVertical: 2 },
  statusText: { fontSize: 13, color: "#16a34a", fontWeight: "bold" },
});

export default BVNHistory;
