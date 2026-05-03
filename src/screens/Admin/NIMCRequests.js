import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import axios from "axios";

const NIMCRequests = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load requests from backend
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get("/api/v1/admin/nimc-requests");
      setRequests(data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleAction = (id, status) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to mark this as ${status}?`,
      [
        { text: "Cancel" },
        { text: "Yes", onPress: () => updateStatus(id, status) },
      ],
    );
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/v1/admin/update-nimc/${id}`, { status });
      setModalVisible(false);
      fetchRequests(); // Refresh list
    } catch (err) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => {
        setSelectedReq(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.userName}>{item.user?.name || "Unknown User"}</Text>
        <Text style={styles.serviceType}>{item.serviceType.toUpperCase()}</Text>
        <Text style={styles.ninNum}>NIN: {item.ninNumber}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{item.status}</Text>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Requests</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
      />

      {/* Modal na Ganin Cikakken Detail */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Request Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>User:</Text>
              <Text style={styles.detailValue}>{selectedReq?.user?.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>NIN Number:</Text>
              <Text style={styles.detailValue}>{selectedReq?.ninNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Modification Type:</Text>
              <Text style={styles.detailValue}>{selectedReq?.serviceType}</Text>
            </View>

            {/* Idan akwai karin bayanan da aka cika (Dynamic) */}
            <View style={styles.formDetails}>
              <Text style={styles.detailLabel}>Submitted Data:</Text>
              <Text style={styles.jsonText}>
                {JSON.stringify(selectedReq?.formData, null, 2)}
              </Text>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#ef4444" }]}
                onPress={() => handleAction(selectedReq._id, "rejected")}
              >
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
              // A cikin Modal na Admin inda yake ganin Details
              <View style={styles.btnRow}>
                {/* 1. Madannin Processing */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#f59e0b" }]}
                  onPress={() =>
                    handleStatusUpdate(selectedReq._id, "processing")
                  }
                >
                  <Text style={styles.btnText}>Start Processing</Text>
                </TouchableOpacity>

                {/* 2. Madannin Approve & Upload */}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
                  onPress={() => handleFileUploadAndApprove(selectedReq._id)}
                >
                  <Text style={styles.btnText}>Upload Slip & Approve</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
                onPress={() => handleAction(selectedReq._id, "completed")}
              >
                <Text style={styles.btnText}>Approve & Done</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
