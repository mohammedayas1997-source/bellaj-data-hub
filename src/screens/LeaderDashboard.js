import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "../constants";

const LeaderDashboard = ({ navigation }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [stats, setStats] = useState({
    totalSupervisors: 0,
    totalAgents: 0,
    overallData: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_URL}/leader/dashboard`);
      if (response.data.success) {
        setSupervisors(response.data.supervisors);
        setStats(response.data.networkStats);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = (id, currentStatus) => {
    Alert.alert(
      currentStatus ? "Unsuspend" : "Suspend",
      `Are you sure you want to ${currentStatus ? "activate" : "suspend"} this supervisor?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Proceed",
          onPress: async () => {
            try {
              await axios.patch(`${API_URL}/leader/toggle-status/${id}`);
              fetchDashboardData(); // Refresh data
            } catch (e) {
              Alert.alert("Failed", "Action could not be completed");
            }
          },
        },
      ],
    );
  };

  const renderSupervisor = ({ item }) => (
    <TouchableOpacity
      style={styles.supCard}
      onPress={() =>
        navigation.navigate("SupervisorDetails", { supervisorId: item.id })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.supInfo}>
          <FontAwesome5 name="user-tie" size={24} color="#1e3a8a" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.supName}>{item.name}</Text>
            <Text style={styles.supRole}>Supervisor</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleSuspend(item.id, item.isSuspended)}
        >
          <MaterialIcons
            name={
              item.isSuspended ? "play-circle-filled" : "pause-circle-filled"
            }
            size={32}
            color={item.isSuspended ? "#22c55e" : "#ef4444"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Ionicons name="people" size={16} color="#d4af37" />
          <Text style={styles.miniStatText}>{item.teamSize} Agents</Text>
        </View>
        <View style={styles.miniStat}>
          <MaterialIcons name="storage" size={16} color="#d4af37" />
          <Text style={styles.miniStatText}>
            {item.teamPerformance} GB Sold
          </Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Linking.openURL(`tel:${item.phone}`)}
        >
          <MaterialIcons name="call" size={20} color="#1e3a8a" />
          <Text style={styles.iconBtnText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Alert.alert("Address", item.address)}
        >
          <MaterialIcons name="location-on" size={20} color="#1e3a8a" />
          <Text style={styles.iconBtnText}>Address</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            navigation.navigate("AssignTarget", { supervisorId: item.id })
          }
        >
          <MaterialIcons name="track-changes" size={20} color="#d4af37" />
          <Text style={[styles.iconBtnText, { color: "#d4af37" }]}>Target</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading)
    return (
      <ActivityIndicator size="large" color="#1e3a8a" style={{ flex: 1 }} />
    );

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.statBox, { backgroundColor: "#1e3a8a" }]}>
            <Text style={styles.statLabel}>Supervisors</Text>
            <Text style={styles.statValue}>{stats.totalSupervisors}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#d4af37" }]}>
            <Text style={styles.statLabel}>Total Agents</Text>
            <Text style={styles.statValue}>{stats.totalAgents}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#1e293b" }]}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>{stats.overallDataSold} GB</Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Manage Supervisors</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("CreateSupervisor")}
        >
          <MaterialIcons name="person-add" size={20} color="white" />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={supervisors}
        keyExtractor={(item) => item.id}
        renderItem={renderSupervisor}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() =>
          Linking.openURL(`${API_URL}/leader/download-full-report`)
        }
      >
        <MaterialIcons name="file-download" size={24} color="white" />
        <Text style={styles.downloadBtnText}>GENERATE FULL REPORT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  headerStats: { padding: 15, flexDirection: "row" },
  statBox: {
    padding: 20,
    borderRadius: 15,
    marginRight: 10,
    width: 140,
    elevation: 4,
  },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  statValue: { color: "white", fontSize: 22, fontWeight: "bold", marginTop: 5 },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
    marginVertical: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1e3a8a" },
  addBtn: {
    backgroundColor: "#1e3a8a",
    flexDirection: "row",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  addBtnText: { color: "white", marginLeft: 5, fontWeight: "600" },
  supCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supInfo: { flexDirection: "row", alignItems: "center" },
  supName: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  supRole: { fontSize: 12, color: "#64748b" },
  statsRow: {
    flexDirection: "row",
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 10,
  },
  miniStat: { flexDirection: "row", alignItems: "center", marginRight: 20 },
  miniStatText: { fontSize: 13, color: "#475569", marginLeft: 5 },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  iconBtn: { flexDirection: "row", alignItems: "center", padding: 5 },
  iconBtnText: {
    marginLeft: 5,
    fontSize: 12,
    color: "#1e3a8a",
    fontWeight: "600",
  },
  downloadBtn: {
    backgroundColor: "#1e293b",
    margin: 20,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  downloadBtnText: { color: "white", fontWeight: "bold", marginLeft: 10 },
});

export default LeaderDashboard;
