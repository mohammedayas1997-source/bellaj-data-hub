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
import BASE_URL from "../config/api";
const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F5F5F5",
  muted: "#64748B",
  border: "#F1F5F9",
};

const API_ENDPOINTS = {
  leaderDashboard: "",
  toggleSupervisorStatus: "",
  downloadFullReport: "",
};

const LeaderDashboard = ({ navigation }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [stats, setStats] = useState({
    totalSupervisors: 0,
    totalAgents: 0,
    overallDataSold: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!API_ENDPOINTS.leaderDashboard) {
        setLoading(false);
        return;
      }

      const response = await axios.get(API_ENDPOINTS.leaderDashboard);

      if (response.data.success) {
        setSupervisors(response.data.supervisors || []);
        setStats(response.data.networkStats || {});
      }
    } catch (error) {
      Alert.alert("Error", "Could not load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = (id, currentStatus) => {
    Alert.alert(
      currentStatus ? "Unsuspend Supervisor" : "Suspend Supervisor",
      `Are you sure you want to ${
        currentStatus ? "activate" : "suspend"
      } this supervisor?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Proceed",
          onPress: async () => {
            try {
              if (!API_ENDPOINTS.toggleSupervisorStatus) {
                Alert.alert("Notice", "Toggle API endpoint is not configured.");
                return;
              }

              await axios.patch(
                `${API_ENDPOINTS.toggleSupervisorStatus}/${id}`,
              );
              fetchDashboardData();
            } catch (e) {
              Alert.alert("Failed", "Action could not be completed");
            }
          },
        },
      ],
    );
  };

  const handleDownloadReport = () => {
    if (!API_ENDPOINTS.downloadFullReport) {
      Alert.alert("Notice", "Report API endpoint is not configured.");
      return;
    }

    Linking.openURL(API_ENDPOINTS.downloadFullReport);
  };

  const renderSupervisor = ({ item }) => (
    <TouchableOpacity
      style={styles.supCard}
      onPress={() =>
        navigation.navigate("SupervisorDetails", { supervisorId: item.id })
      }
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={styles.supInfo}>
          <View style={styles.avatarCircle}>
            <FontAwesome5 name="user-tie" size={22} color={COLORS.primary} />
          </View>

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
            size={34}
            color={item.isSuspended ? COLORS.secondary : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Ionicons name="people" size={16} color={COLORS.secondary} />
          <Text style={styles.miniStatText}>{item.teamSize || 0} Agents</Text>
        </View>

        <View style={styles.miniStat}>
          <MaterialIcons name="storage" size={16} color={COLORS.secondary} />
          <Text style={styles.miniStatText}>
            {item.teamPerformance || 0} GB Sold
          </Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Linking.openURL(`tel:${item.phone}`)}
        >
          <MaterialIcons name="call" size={20} color={COLORS.secondary} />
          <Text style={styles.iconBtnText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Alert.alert("Address", item.address || "No address")}
        >
          <MaterialIcons
            name="location-on"
            size={20}
            color={COLORS.secondary}
          />
          <Text style={styles.iconBtnText}>Address</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            navigation.navigate("AssignTarget", { supervisorId: item.id })
          }
        >
          <MaterialIcons
            name="track-changes"
            size={20}
            color={COLORS.primary}
          />
          <Text style={[styles.iconBtnText, { color: COLORS.primary }]}>
            Target
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={{ flex: 1 }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerStats}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.statBox, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.statLabel}>Supervisors</Text>
            <Text style={styles.statValue}>{stats.totalSupervisors || 0}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: COLORS.secondary }]}>
            <Text style={styles.statLabel}>Total Agents</Text>
            <Text style={styles.statValue}>{stats.totalAgents || 0}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: COLORS.dark }]}>
            <Text style={styles.statLabel}>Total Sales</Text>
            <Text style={styles.statValue}>
              {stats.overallDataSold || 0} GB
            </Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Manage Supervisors</Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("CreateSupervisor")}
        >
          <MaterialIcons name="person-add" size={20} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={supervisors}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderSupervisor}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No Supervisors Found</Text>
            <Text style={styles.emptyText}>
              Supervisors will appear here after your Bellaj API is connected.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={handleDownloadReport}
      >
        <MaterialIcons name="file-download" size={24} color={COLORS.white} />
        <Text style={styles.downloadBtnText}>GENERATE FULL REPORT</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  headerStats: {
    padding: 15,
    flexDirection: "row",
  },
  statBox: {
    padding: 20,
    borderRadius: 15,
    marginRight: 10,
    width: 145,
    elevation: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addBtnText: {
    color: COLORS.white,
    marginLeft: 5,
    fontWeight: "600",
  },
  supCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF1F1",
    justifyContent: "center",
    alignItems: "center",
  },
  supName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  supRole: {
    fontSize: 12,
    color: COLORS.muted,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  miniStatText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 5,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  iconBtnText: {
    marginLeft: 5,
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "600",
  },
  downloadBtn: {
    backgroundColor: COLORS.secondary,
    margin: 20,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  downloadBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    marginLeft: 10,
  },
  emptyBox: {
    marginHorizontal: 20,
    marginTop: 30,
    padding: 24,
    borderRadius: 16,
    backgroundColor: COLORS.white,
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
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default LeaderDashboard;
