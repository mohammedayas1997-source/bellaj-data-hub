import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
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
  supervisorProfile: "",
};

const SupervisorDashboard = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const [supervisorData, setSupervisorData] = useState({
    name: "Bellaj Supervisor",
    referralId: "BD0000",
    agents: [
      { id: "1", name: "Bello Musa", todayGB: "12.5GB", status: "Active" },
      { id: "2", name: "Sani Ahmad", todayGB: "8.2GB", status: "Active" },
      { id: "3", name: "Zainab Ali", todayGB: "0GB", status: "Inactive" },
    ],
  });

  const fetchSupervisorContext = async () => {
    try {
      if (!API_ENDPOINTS.supervisorProfile) return;

      setLoading(true);

      const response = await axios.get(API_ENDPOINTS.supervisorProfile);

      if (response.data.success) {
        setSupervisorData(response.data.data);
      }
    } catch (error) {
      console.error("Bellaj supervisor context error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisorContext();
  }, []);

  const copyReferralId = async () => {
    await Clipboard.setStringAsync(supervisorData.referralId);
    Alert.alert("Bellaj Data Hub", `ID ${supervisorData.referralId} copied.`);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Supervisor Panel</Text>
          <Text style={styles.welcomeText}>
            Welcome back, {supervisorData.name}
          </Text>
        </View>

        <TouchableOpacity style={styles.profileBadge}>
          <Ionicons name="person-circle" size={42} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.idCard}>
        <View style={styles.idInfo}>
          <Text style={styles.idLabel}>OFFICIAL REFERRAL ID</Text>
          <Text style={styles.idValue}>{supervisorData.referralId}</Text>
        </View>

        <TouchableOpacity style={styles.copyBtn} onPress={copyReferralId}>
          <Ionicons name="copy-outline" size={20} color={COLORS.white} />
          <Text style={styles.copyText}>COPY</Text>
        </TouchableOpacity>
      </View>

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

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: "65%" }]} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Agent Performance</Text>

        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {supervisorData.agents.map((agent) => (
        <View key={agent.id} style={styles.agentRow}>
          <View style={styles.agentLeft}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    agent.status === "Active"
                      ? COLORS.secondary
                      : COLORS.primary,
                },
              ]}
            />

            <View>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentStatus}>{agent.status}</Text>
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.gbText}>{agent.todayGB}</Text>
            <Text style={styles.timeText}>Data Consumed</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.addAgentBtn}
        onPress={() => navigation.navigate("Signup")}
      >
        <Ionicons
          name="person-add"
          size={20}
          color={COLORS.primary}
          style={{ marginRight: 10 }}
        />

        <Text style={styles.addAgentText}>Register New Agent</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 20,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -1,
  },
  welcomeText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  profileBadge: {
    padding: 5,
  },
  idCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  idLabel: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  idValue: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  copyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 5,
  },
  targetCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    elevation: 8,
  },
  cardLabel: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 15,
    textTransform: "uppercase",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statBox: {
    alignItems: "center",
  },
  statNum: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "900",
  },
  statSub: {
    color: "#FFE4E4",
    fontSize: 11,
    fontWeight: "600",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 5,
  },
  progressBarFill: {
    height: 10,
    backgroundColor: COLORS.secondary,
    borderRadius: 5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.dark,
  },
  viewAll: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  agentRow: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  agentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  agentName: {
    fontWeight: "700",
    color: COLORS.dark,
    fontSize: 16,
  },
  agentStatus: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "500",
  },
  gbText: {
    fontWeight: "900",
    color: COLORS.secondary,
    fontSize: 17,
  },
  timeText: {
    color: "#94A3B8",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  addAgentBtn: {
    backgroundColor: COLORS.softRed,
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: 10,
  },
  addAgentText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 15,
  },
});

export default SupervisorDashboard;
