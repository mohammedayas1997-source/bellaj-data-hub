import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ProgressBarAndroid, // Ko ProgressView na iOS
} from "react-native";
import axios from "axios";

const AgentManagementScreen = () => {
  const [agents, setAgents] = useState([]);
  const [targetStats, setTargetStats] = useState({
    totalRegistered: 0,
    totalDataSold: 0,
    monthlyGoal: 10,
    dataGoal: 100, // GB
  });

  // Wannan zai dauko bayanan Agents karkashin wannan Supervisor din
  const fetchAgentStats = async () => {
    try {
      const response = await axios.get(
        "https://ayax-data-xpress-server.vercel.app/api/v1/supervisor/my-agents",
      );
      setAgents(response.data.agents);
      setTargetStats(response.data.stats);
    } catch (error) {
      console.log("Error loading agents:", error);
    }
  };

  useEffect(() => {
    fetchAgentStats();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Monthly Performance</Text>

      {/* Target Progress Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>New Agents</Text>
          <Text style={styles.statValue}>
            {targetStats.totalRegistered}/{targetStats.monthlyGoal}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Data Sold</Text>
          <Text style={styles.statValue}>
            {targetStats.totalDataSold}GB / {targetStats.dataGoal}GB
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Agent List & Daily Sales</Text>
      <FlatList
        data={agents}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.agentCard}>
            <View>
              <Text style={styles.agentName}>{item.fullName}</Text>
              <Text style={styles.agentInfo}>
                Today's Sale: {item.todaySales}GB
              </Text>
            </View>
            <TouchableOpacity style={styles.viewBtn}>
              <Text style={styles.viewText}>View History</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 20 },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 15,
    width: "48%",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statLabel: { color: "#64748b", fontSize: 12 },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  agentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  agentName: { fontWeight: "bold", color: "#1e293b" },
  agentInfo: { color: "#64748b", fontSize: 13 },
  viewBtn: { backgroundColor: "#38bdf8", padding: 8, borderRadius: 8 },
  viewText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
});

export default AgentManagementScreen;
