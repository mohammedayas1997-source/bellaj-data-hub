import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
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
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  traceService: "",
  refund: "",
};

const ServiceTracker = () => {
  const [identifier, setIdentifier] = useState("");
  const [serviceType, setServiceType] = useState("data");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleTrace = async () => {
    if (!identifier.trim()) {
      Alert.alert("Required", "Please enter a phone number or ID");
      return;
    }

    if (!API_ENDPOINTS.traceService) {
      Alert.alert("Not Configured", "Trace service API is not configured.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(
        `${API_ENDPOINTS.traceService}/${serviceType}/${identifier.trim()}`,
        config,
      );

      setResults(response?.data?.data || []);
    } catch (err) {
      setResults([]);
      Alert.alert(
        "Not Found",
        `No records found for ${identifier} in ${serviceType.toUpperCase()}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const initiateRefund = (transactionId) => {
    Alert.prompt(
      "Confirm Refund Request",
      "Enter the reason for this refund:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async (reason) => {
            if (!API_ENDPOINTS.refund) {
              Alert.alert("Not Configured", "Refund API is not configured.");
              return;
            }

            try {
              const token = await AsyncStorage.getItem("userToken");

              await axios.post(
                API_ENDPOINTS.refund,
                { transactionId, reason },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              Alert.alert("Bellaj Data Hub", "Refund request has been logged.");
            } catch (err) {
              Alert.alert("Error", "Could not process refund.");
            }
          },
        },
      ],
    );
  };

  const renderResultItem = ({ item }) => (
    <View style={styles.resultCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.statusBadge}>{item?.status || "Completed"}</Text>

        <Text style={styles.dateText}>
          {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
        </Text>
      </View>

      <Text style={styles.amountText}>
        {item?.amount ? `₦${item.amount}` : `${item?.dataAmountGB || 0} GB`}
      </Text>

      <Text style={styles.detailText}>
        Ref: {item?.reference || item?.transactionId || "N/A"}
      </Text>

      <Text style={styles.detailText}>
        User: {item?.user?.firstName || ""} {item?.user?.surname || ""}
      </Text>

      <TouchableOpacity
        style={styles.refundBtn}
        onPress={() => initiateRefund(item?._id)}
      >
        <Text style={styles.refundBtnText}>Initiate Refund</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bellaj Service Investigation</Text>
        <Text style={styles.subtitle}>
          Trace NIMC, BVN, Data & Utility transactions
        </Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.tabContainer}>
          {["data", "nimc", "bvn", "vtu"].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.tab, serviceType === type && styles.activeTab]}
              onPress={() => setServiceType(type)}
            >
              <Text
                style={[
                  styles.tabText,
                  serviceType === type && styles.activeTabText,
                ]}
              >
                {type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder={`Enter ${serviceType} number or Phone...`}
          placeholderTextColor="#94A3B8"
          value={identifier}
          onChangeText={setIdentifier}
        />

        <TouchableOpacity style={styles.searchBtn} onPress={handleTrace}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.searchBtnText}>Trace Request</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={(item, index) => item?._id || index.toString()}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.emptyText}>
              Enter an identifier to begin Bellaj investigation.
            </Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 12,
    color: "#FFE4E4",
    marginTop: 4,
  },
  searchSection: {
    padding: 20,
    backgroundColor: COLORS.white,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  tabText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.muted,
  },
  activeTabText: {
    color: COLORS.white,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    color: COLORS.dark,
    backgroundColor: COLORS.light,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  searchBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  listPadding: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.secondary,
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 5,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  refundBtn: {
    marginTop: 15,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    backgroundColor: COLORS.softRed,
  },
  refundBtnText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    marginTop: 50,
  },
});

export default ServiceTracker;
