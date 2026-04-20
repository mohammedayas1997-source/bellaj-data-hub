import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";

const SupervisorDashboard = () => {
  // Samfurin bayanan agents (Mock Data)
  const [agents, setAgents] = useState([
    { id: "1", name: "Bello Musa", todayGB: "12.5GB", status: "Active" },
    { id: "2", name: "Sani Ahmad", todayGB: "8.2GB", status: "Active" },
    { id: "3", name: "Zainab Ali", todayGB: "0GB", status: "Inactive" },
  ]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Supervisor Panel</Text>

      {/* Target Progress Section */}
      <View style={styles.targetCard}>
        <Text style={styles.cardLabel}>Monthly Target Progress</Text>
        <View style={styles.progressRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>7/10</Text>
            <Text style={styles.statSub}>New Agents</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>65/100</Text>
            <Text style={styles.statSub}>GB Sold</Text>
          </View>
        </View>
        {/* Progress Bar (Simple View) */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: "65%" }]} />
        </View>
      </View>

      {/* Agents Daily Tracking */}
      <Text style={styles.sectionTitle}>Daily Agent Performance</Text>
      {agents.map((agent) => (
        <View key={agent.id} style={styles.agentRow}>
          <View>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentStatus}>{agent.status}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.gbText}>{agent.todayGB}</Text>
            <Text style={styles.timeText}>Today</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addAgentBtn}>
        <Text style={styles.addAgentText}>+ Register New Agent</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 20,
    marginTop: 20,
  },
  targetCard: {
    backgroundColor: "#1e3a8a",
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 5,
  },
  cardLabel: { color: "#bfdbfe", fontSize: 14, marginBottom: 15 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statBox: { alignItems: "center" },
  statNum: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  statSub: { color: "#93c5fd", fontSize: 12 },
  divider: { width: 1, height: 40, backgroundColor: "#3b82f6" },
  progressBarBg: { height: 8, backgroundColor: "#1e293b", borderRadius: 4 },
  progressBarFill: { height: 8, backgroundColor: "#38bdf8", borderRadius: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 15,
  },
  agentRow: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  agentName: { fontWeight: "bold", color: "#1e293b", fontSize: 16 },
  agentStatus: { color: "#22c55e", fontSize: 12 },
  gbText: { fontWeight: "bold", color: "#1e3a8a", fontSize: 16 },
  timeText: { color: "#64748b", fontSize: 11 },
  addAgentBtn: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    marginTop: 10,
  },
  addAgentText: { color: "#64748b", fontWeight: "bold" },
});

export default SupervisorDashboard;
