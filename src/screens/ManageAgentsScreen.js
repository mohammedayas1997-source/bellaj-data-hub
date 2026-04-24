import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { API_URL } from "../constants";

const ManageAgentsScreen = () => {
  const [agents, setAgents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupervisor, setSelectedSupervisor] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [agentsRes, supsRes] = await Promise.all([
        axios.get(`${API_URL}/leader/all-agents`), // Ka tabbatar kana da wannan route din
        axios.get(`${API_URL}/leader/dashboard`), // Don samun list na supervisors
      ]);
      setAgents(agentsRes.data.agents);
      setSupervisors(supsRes.data.supervisors);
    } catch (error) {
      Alert.alert("Error", "Could not fetch agents or supervisors");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (agentId, supervisorId) => {
    if (!supervisorId) {
      Alert.alert("Notice", "Please select a supervisor first");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/leader/assign-agent`, {
        agentId,
        supervisorId,
      });

      if (response.data.success) {
        Alert.alert("Success", "Agent reassigned successfully");
        fetchData(); // Refresh list
      }
    } catch (error) {
      Alert.alert("Error", "Failed to reassign agent");
    }
  };

  const renderAgent = ({ item }) => (
    <View style={styles.agentCard}>
      <View style={styles.agentHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <FontAwesome5 name="user-alt" size={20} color="#1e3a8a" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.agentName}>{item.name}</Text>
            <Text style={styles.agentPhone}>{item.phone}</Text>
          </View>
        </View>
        <MaterialIcons
          name="verified"
          size={20}
          color={item.assignedSupervisor ? "#22c55e" : "#94a3b8"}
        />
      </View>

      <Text style={styles.currentSup}>
        Current Supervisor:{" "}
        <Text style={{ fontWeight: "bold", color: "#d4af37" }}>
          {item.assignedSupervisor?.name || "Unassigned"}
        </Text>
      </Text>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedSupervisor[item._id]}
          onValueChange={(value) =>
            setSelectedSupervisor({ ...selectedSupervisor, [item._id]: value })
          }
          style={styles.picker}
        >
          <Picker.Item label="Select New Supervisor..." value="" />
          {supervisors.map((sup) => (
            <Picker.Item key={sup.id} label={sup.name} value={sup.id} />
          ))}
        </Picker>

        <TouchableOpacity
          style={styles.transferBtn}
          onPress={() => handleAssign(item._id, selectedSupervisor[item._id])}
        >
          <MaterialIcons name="swap-horiz" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading)
    return (
      <ActivityIndicator size="large" color="#1e3a8a" style={{ flex: 1 }} />
    );

  return (
    <View style={styles.container}>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>Network Management</Text>
        <Text style={styles.headerSubtitle}>
          Assign or Transfer agents between supervisors
        </Text>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(item) => item._id}
        renderItem={renderAgent}
        contentContainerStyle={{ padding: 15 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  headerInfo: {
    backgroundColor: "#0f172a",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { color: "white", fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: "#38bdf8", fontSize: 13, marginTop: 5 },
  agentCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  agentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentName: { fontSize: 16, fontWeight: "bold", color: "#1e293b" },
  agentPhone: { fontSize: 12, color: "#64748b" },
  currentSup: { fontSize: 13, marginTop: 10, color: "#475569" },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  picker: { flex: 1, height: 50 },
  transferBtn: {
    backgroundColor: "#1e3a8a",
    padding: 12,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
});

export default ManageAgentsScreen;
