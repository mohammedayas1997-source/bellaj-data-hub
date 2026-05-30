import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { trackTx, getAllReports, resolveIssue } from "../api/adminApi";
import BASE_URL from "../config/api";
const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F5F5F5",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const IssueResolution = () => {
  const [searchId, setSearchId] = useState("");
  const [foundData, setFoundData] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await getAllReports();
      setReports(res?.data?.requests || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchId.trim()) {
      Alert.alert("Input Required", "Please enter a Transaction ID.");
      return;
    }

    setLoading(true);

    try {
      const res = await trackTx(searchId.trim());
      setFoundData(res.data);
    } catch (err) {
      setFoundData(null);
      Alert.alert("Not Found", "This ID does not exist in the system records.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await resolveIssue({
        requestId: id,
        action,
        adminNote: "Resolved via Bellaj Data Hub Admin Portal",
      });

      Alert.alert("Success", `Ticket has been ${action}ed successfully.`);
      loadReports();
    } catch (err) {
      Alert.alert(
        "Operation Failed",
        "Could not complete the request. Please try again.",
      );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Bellaj Issue Resolution</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Track Transaction</Text>

        <TextInput
          placeholder="Enter Transaction ID or Reference..."
          placeholderTextColor="#94A3B8"
          style={styles.input}
          value={searchId}
          onChangeText={setSearchId}
        />

        <TouchableOpacity
          style={styles.btnSearch}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>INVESTIGATE ID</Text>
          )}
        </TouchableOpacity>
      </View>

      {foundData && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Search Result Details</Text>

          <View style={styles.resultRow}>
            <Text style={styles.label}>User Name:</Text>
            <Text style={styles.value}>
              {foundData?.userData?.name || "N/A"}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>
              ₦{foundData?.transaction?.amount || "0.00"}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { color: COLORS.secondary }]}>
              {foundData?.transaction?.status || "Unknown"}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.subTitle}>Pending Support Reports</Text>

      {reports.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No active support requests found.
          </Text>
        </View>
      ) : (
        reports.map((item) => (
          <View key={item._id} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportId}>
                TX ID: {item.transactionId || "N/A"}
              </Text>

              <Text style={styles.timestamp}>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : "N/A"}
              </Text>
            </View>

            <Text style={styles.reasonTitle}>Reason for Dispute:</Text>
            <Text style={styles.reasonText}>{item.reason || "No reason"}</Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.btnApprove}
                onPress={() => handleAction(item._id, "resolve")}
              >
                <Text style={styles.btnText}>APPROVE REFUND</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnReject}
                onPress={() => handleAction(item._id, "reject")}
              >
                <Text style={styles.btnText}>REJECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: COLORS.dark,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnSearch: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  resultCard: {
    backgroundColor: COLORS.softGreen,
    padding: 15,
    marginTop: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B7E4CD",
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: {
    color: COLORS.muted,
    fontSize: 13,
  },
  value: {
    color: COLORS.dark,
    fontWeight: "bold",
    fontSize: 13,
  },
  reportCard: {
    backgroundColor: COLORS.white,
    padding: 18,
    marginTop: 15,
    borderRadius: 15,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.secondary,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reportId: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  timestamp: {
    fontSize: 11,
    color: "#94A3B8",
  },
  reasonTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    fontStyle: "italic",
  },
  btnApprove: {
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  btnReject: {
    backgroundColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    marginTop: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginTop: 30,
    marginBottom: 10,
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 14,
  },
});

export default IssueResolution;
