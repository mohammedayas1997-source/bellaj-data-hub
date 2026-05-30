import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import axios from "axios";
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
  myAgents: "",
};

const AgentManagementScreen = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [targetStats, setTargetStats] = useState({
    totalRegistered: 0,
    totalDataSold: 0,
    monthlyGoal: 10,
    dataGoal: 100,
  });

  const fetchAgentStats = async () => {
    try {
      if (!API_ENDPOINTS.myAgents) {
        setAgents([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(API_ENDPOINTS.myAgents);

      setAgents(response?.data?.agents || []);
      setTargetStats(response?.data?.stats || targetStats);
    } catch (error) {
      console.log("Error loading agents:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgentStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentStats();
  };

  const registeredProgress =
    targetStats.monthlyGoal > 0
      ? Math.min(targetStats.totalRegistered / targetStats.monthlyGoal, 1)
      : 0;

  const dataProgress =
    targetStats.dataGoal > 0
      ? Math.min(targetStats.totalDataSold / targetStats.dataGoal, 1)
      : 0;

  const renderProgressBar = (progress, color) => (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${progress * 100}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );

  const renderAgent = ({ item }) => (
    <View style={styles.agentCard}>
      <View style={styles.agentLeft}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(item?.fullName || "A").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View>
          <Text style={styles.agentName}>{item?.fullName || "Agent"}</Text>
          <Text style={styles.agentInfo}>
            Today's Sale: {item?.todaySales || 0}GB
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewBtn}>
        <Text style={styles.viewText}>View History</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Bellaj agents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Monthly Performance</Text>
      <Text style={styles.subHeader}>Bellaj supervisor agent overview</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>New Agents</Text>
          <Text style={styles.statValue}>
            {targetStats.totalRegistered}/{targetStats.monthlyGoal}
          </Text>
          {renderProgressBar(registeredProgress, COLORS.primary)}
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Data Sold</Text>
          <Text style={styles.statValue}>
            {targetStats.totalDataSold}GB / {targetStats.dataGoal}GB
          </Text>
          {renderProgressBar(dataProgress, COLORS.secondary)}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Agent List & Daily Sales</Text>

      <FlatList
        data={agents}
        keyExtractor={(item, index) => item?._id || index.toString()}
        renderItem={renderAgent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Agents Found</Text>
            <Text style={styles.emptyText}>
              Your Bellaj agents will appear here after the API is connected.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  subHeader: {
    color: COLORS.secondary,
    fontSize: 14,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: COLORS.light,
    padding: 15,
    borderRadius: 15,
    width: "48%",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginTop: 5,
    marginBottom: 10,
  },
  progressTrack: {
    height: 7,
    backgroundColor: COLORS.border,
    borderRadius: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: COLORS.dark,
  },
  agentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  agentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
  agentName: {
    fontWeight: "bold",
    color: COLORS.dark,
  },
  agentInfo: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
  },
  viewBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  viewText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyBox: {
    backgroundColor: COLORS.light,
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 6,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default AgentManagementScreen;
