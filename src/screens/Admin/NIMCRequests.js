import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

const API_BASE_URL = "";

const NIMCRequests = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      if (!API_BASE_URL) {
        setRequests([]);
        return;
      }

      const { data } = await axios.get(`${API_BASE_URL}/admin/nimc-requests`);
      setRequests(data?.data || []);
    } catch (err) {
      console.log("Bellaj NIMC fetch error:", err);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (!API_BASE_URL) {
      Alert.alert("Not Configured", "NIMC admin API is not configured.");
      return;
    }

    try {
      await axios.put(`${API_BASE_URL}/admin/update-nimc/${id}`, { status });

      Alert.alert("Bellaj Data Hub", `Request marked as ${status}`);
      setModalVisible(false);
      fetchRequests();
    } catch (err) {
      Alert.alert("Error", "Action failed.");
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return COLORS.secondary;
      case "processing":
        return "#F59E0B";
      case "rejected":
        return COLORS.primary;
      default:
        return "#F59E0B";
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => {
        setSelectedReq(item);
        setModalVisible(true);
      }}
      activeOpacity={0.85}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>
          {item.user?.name ||
            `${item.user?.firstName || ""} ${item.user?.surname || ""}` ||
            "User"}
        </Text>

        <Text style={styles.serviceType}>
          {item.serviceType?.toUpperCase() || "NIMC REQUEST"}
        </Text>
      </View>

      <View style={styles.statusBox}>
        <Text
          style={[
            styles.statusText,
            {
              color: getStatusColor(item.status),
            },
          ]}
        >
          {item.status || "pending"}
        </Text>

        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Bellaj NIMC Requests</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item, index) => item?._id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={80} color="#CBD5E1" />

            <Text style={styles.emptyTitle}>No Requests Found</Text>

            <Text style={styles.emptyText}>
              Bellaj NIMC requests will appear here.
            </Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>
              Details for {selectedReq?.serviceType?.toUpperCase() || "NIMC"}
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              <DetailRow label="NIN Number" value={selectedReq?.ninNumber} />

              {selectedReq?.formData &&
                Object.entries(selectedReq.formData).map(([key, value]) => (
                  <DetailRow
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1")}
                    value={value}
                  />
                ))}
            </ScrollView>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                onPress={() => handleStatusUpdate(selectedReq?._id, "rejected")}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#F59E0B" }]}
                onPress={() =>
                  handleStatusUpdate(selectedReq?._id, "processing")
                }
              >
                <Text style={styles.btnText}>Process</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: COLORS.secondary },
                ]}
                onPress={() =>
                  handleStatusUpdate(selectedReq?._id, "completed")
                }
              >
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>

    <Text style={styles.detailValue}>
      {value === undefined || value === null || value === "" ? "N/A" : value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 25,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 15,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  userName: {
    fontWeight: "bold",
    fontSize: 16,
    color: COLORS.dark,
  },
  serviceType: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 5,
    textTransform: "capitalize",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: COLORS.dark,
  },
  emptyText: {
    color: COLORS.muted,
    marginTop: 5,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLORS.primary,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    gap: 15,
  },
  detailLabel: {
    color: COLORS.muted,
    fontSize: 13,
    textTransform: "capitalize",
    flex: 1,
  },
  detailValue: {
    fontWeight: "bold",
    color: COLORS.dark,
    flex: 1,
    textAlign: "right",
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionBtn: {
    padding: 12,
    borderRadius: 10,
    width: "31%",
    alignItems: "center",
  },
  btnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
  },
  closeBtn: {
    marginTop: 20,
    alignItems: "center",
  },
  closeText: {
    color: COLORS.muted,
    fontWeight: "bold",
  },
});

export default NIMCRequests;
