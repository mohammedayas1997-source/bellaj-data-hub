import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AgentDashboard = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalSalesValue: 0,
  });
  const [supervisor, setSupervisor] = useState(null);

  const fetchAgentData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const BASE_URL = "https://ayax-api.com/api/v1/agent"; // Replace with your actual Agent URL

      const [perfRes, supRes] = await Promise.all([
        axios.get(`${BASE_URL}/performance`, config),
        axios.get(`${BASE_URL}/my-supervisor`, config),
      ]);

      setPerformance(perfRes.data.data);
      setSupervisor(supRes.data.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to retrieve agent metrics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentData();
  };

  const StatCard = ({ title, value, unit, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>
        {value} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Agent Portal</Text>
        <Text style={styles.subText}>Track your sales and performance</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Monthly Volume"
          value={performance.totalGB || 0}
          unit="GB"
          color="#2563eb"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₦${performance.totalSalesValue || 0}`}
          unit=""
          color="#059669"
        />
      </View>

      {/* SUPERVISOR INFO SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assigned Supervisor</Text>
        <View style={styles.infoBox}>
          {typeof supervisor === "string" ? (
            <Text style={styles.infoText}>{supervisor}</Text>
          ) : (
            <View>
              <Text style={styles.supName}>{supervisor?.name || "N/A"}</Text>
              <Text style={styles.supPhone}>
                {supervisor?.phone || "No Contact"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("NewSale")}
        >
          <Text style={styles.actionBtnText}>Process New Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("SalesHistory")}
        >
          <Text style={styles.actionBtnText}>View Sales History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.actionBtnText}>Account Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 25,
    backgroundColor: "#1e3a8a",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcome: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subText: { color: "#cbd5e1", marginTop: 5 },
  statsGrid: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 6,
    elevation: 3,
  },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 5,
  },
  statUnit: { fontSize: 12, color: "#94a3b8" },
  section: { paddingHorizontal: 20, marginTop: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoText: { color: "#64748b" },
  supName: { fontSize: 16, fontWeight: "bold", color: "#1e3a8a" },
  supPhone: { fontSize: 14, color: "#475569", marginTop: 2 },
  actionSection: { padding: 20 },
  actionBtn: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  actionBtnText: { fontSize: 15, color: "#1e3a8a", fontWeight: "600" },
});

export default AgentDashboard;
