import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
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
  allAgents: "",
  leaderDashboard: "",
  assignAgent: "",
};

const ManageAgentsScreen = () => {
  const [agents, setAgents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedSupervisor, setSelectedSupervisor] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!API_ENDPOINTS.allAgents && !API_ENDPOINTS.leaderDashboard) {
        setAgents([]);
        setSupervisors([]);
        return;
      }

      const [agentsRes, supsRes] = await Promise.all([
        API_ENDPOINTS.allAgents
          ? axios.get(API_ENDPOINTS.allAgents)
          : Promise.resolve({ data: { agents: [] } }),

        API_ENDPOINTS.leaderDashboard
          ? axios.get(API_ENDPOINTS.leaderDashboard)
          : Promise.resolve({ data: { supervisors: [] } }),
      ]);

      setAgents(agentsRes?.data?.agents || []);
      setSupervisors(supsRes?.data?.supervisors || []);
    } catch (error) {
      Alert.alert("Error", "Could not fetch agents or supervisors");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAssign = async (agentId, supervisorId) => {
    if (!supervisorId) {
      Alert.alert("Notice", "Please select a supervisor first");
      return;
    }

    if (!API_ENDPOINTS.assignAgent) {
      Alert.alert("Not Configured", "Assign agent API is not configured.");
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.assignAgent, {
        agentId,
        supervisorId,
      });

      if (response.data.success) {
        Alert.alert("Bellaj Data Hub", "Agent reassigned successfully");
        fetchData();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to reassign agent");
    }
  };

  const renderAgent = ({ item }) => {
    const isAssigned = Boolean(item?.assignedSupervisor);

    return (
      <View style={styles.agentCard}>
        <View style={styles.agentHeader}>
          <View style={styles.agentInfoRow}>
            <View style={styles.avatarCircle}>
              <FontAwesome5 name="user-alt" size={18} color={COLORS.primary} />
            </View>

            <View style={{ marginLeft: 12 }}>
              <Text style={styles.agentName}>{item?.name || "Agent"}</Text>
              <Text style={styles.agentPhone}>{item?.phone || "No phone"}</Text>
            </View>
          </View>

          <MaterialIcons
            name="verified"
            size={22}
            color={isAssigned ? COLORS.secondary : "#94A3B8"}
          />
        </View>

        <Text style={styles.currentSup}>
          Current Supervisor:{" "}
          <Text style={styles.currentSupValue}>
            {item?.assignedSupervisor?.name || "Unassigned"}
          </Text>
        </Text>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSupervisor[item?._id]}
            onValueChange={(value) =>
              setSelectedSupervisor({
                ...selectedSupervisor,
                [item?._id]: value,
              })
            }
            style={styles.picker}
          >
            <Picker.Item label="Select New Supervisor..." value="" />

            {supervisors.map((sup) => (
              <Picker.Item
                key={sup?.id || sup?._id}
                label={sup?.name || "Supervisor"}
                value={sup?.id || sup?._id}
              />
            ))}
          </Picker>

          <TouchableOpacity
            style={styles.transferBtn}
            onPress={() =>
              handleAssign(item?._id, selectedSupervisor[item?._id])
            }
          >
            <MaterialIcons name="swap-horiz" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>Bellaj Network Management</Text>
        <Text style={styles.headerSubtitle}>
          Assign or transfer agents between supervisors
        </Text>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(item, index) => item?._id || String(index)}
        renderItem={renderAgent}
        contentContainerStyle={{ padding: 15, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
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
              Bellaj agents will appear here after API connection.
            </Text>
          </View>
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
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 13,
    marginTop: 5,
  },
  agentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  agentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentInfoRow: {
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
  },
  agentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  agentPhone: {
    fontSize: 12,
    color: COLORS.muted,
  },
  currentSup: {
    fontSize: 13,
    marginTop: 12,
    color: "#475569",
  },
  currentSupValue: {
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: COLORS.light,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  picker: {
    flex: 1,
    height: 50,
    color: COLORS.dark,
  },
  transferBtn: {
    backgroundColor: COLORS.secondary,
    padding: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 24,
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
  },
});

export default ManageAgentsScreen;
