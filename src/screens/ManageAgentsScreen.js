import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  TextInput,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  allAgents: `${BASE_URL}/admin/agents`,
  supervisors: `${BASE_URL}/admin/supervisors`,
  assignAgent: `${BASE_URL}/admin/assign-agent`,
};

const ManageAgentsScreen = ({ navigation }) => {
  const [agents, setAgents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeArray = (payload, key) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data?.users)) return payload.data.users;
    return [];
  };

  const normalizeAgent = (item, index) => ({
    id: item?._id || item?.id || `${index}`,
    name:
      item?.name ||
      item?.fullName ||
      `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
      "Agent",
    email: item?.email || "",
    phone: item?.phone || item?.phoneNumber || "",
    status: item?.status || "active",
    walletBalance: item?.walletBalance || item?.balance || 0,
    totalSales: item?.totalSales || item?.totalSalesValue || 0,
    assignedSupervisor:
      item?.assignedSupervisor ||
      item?.supervisor ||
      item?.supervisorData ||
      null,
  });

  const normalizeSupervisor = (item, index) => ({
    id: item?._id || item?.id || `${index}`,
    name:
      item?.name ||
      item?.fullName ||
      `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
      "Supervisor",
    email: item?.email || "",
    phone: item?.phone || item?.phoneNumber || "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      const [agentsRes, supervisorsRes] = await Promise.allSettled([
        axios.get(API_ENDPOINTS.allAgents, { headers }),
        axios.get(API_ENDPOINTS.supervisors, { headers }),
      ]);

      if (agentsRes.status === "fulfilled") {
        setAgents(
          normalizeArray(agentsRes.value.data, "agents").map(normalizeAgent)
        );
      } else {
        setAgents([]);
      }

      if (supervisorsRes.status === "fulfilled") {
        setSupervisors(
          normalizeArray(supervisorsRes.value.data, "supervisors").map(
            normalizeSupervisor
          )
        );
      } else {
        setSupervisors([]);
      }
    } catch (error) {
      Alert.alert("Connection Error", "Could not fetch agents or supervisors.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("LeaderDashboard");
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "token",
            "adminToken",
            "userData",
            "userRole",
            "overrideRole",
            "isSuperAdminOverride",
          ]);

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        },
      },
    ]);
  };

  const handleAssign = async (agentId, supervisorId) => {
    if (!supervisorId) {
      Alert.alert("Required", "Please select a supervisor first.");
      return;
    }

    Alert.alert("Confirm Assignment", "Assign this agent to selected supervisor?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Assign",
        onPress: async () => {
          try {
            setAssigningId(agentId);

            const headers = await getAuthHeaders();

            const { data } = await axios.post(
              API_ENDPOINTS.assignAgent,
              { agentId, supervisorId },
              { headers }
            );

            if (data?.success === false) {
              Alert.alert("Failed", data?.message || "Agent was not assigned.");
              return;
            }

            Alert.alert("Bellaj Data Hub", "Agent reassigned successfully.");
            fetchData();
          } catch (error) {
            Alert.alert(
              "Action Failed",
              error?.response?.data?.message || "Failed to reassign agent."
            );
          } finally {
            setAssigningId(null);
          }
        },
      },
    ]);
  };

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return agents;

    return agents.filter(
      (agent) =>
        agent.name?.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query) ||
        agent.phone?.toLowerCase().includes(query)
    );
  }, [agents, search]);

  const stats = useMemo(() => {
    const assigned = agents.filter((agent) => agent.assignedSupervisor).length;

    return {
      totalAgents: agents.length,
      assigned,
      unassigned: agents.length - assigned,
      supervisors: supervisors.length,
    };
  }, [agents, supervisors]);

  const renderAgent = ({ item }) => {
    const isAssigned = Boolean(item?.assignedSupervisor);
    const currentSupervisorName =
      item?.assignedSupervisor?.name ||
      item?.assignedSupervisor?.fullName ||
      item?.assignedSupervisorName ||
      "Unassigned";

    return (
      <View style={styles.agentCard}>
        <View style={styles.agentHeader}>
          <View style={styles.agentInfoRow}>
            <View style={styles.avatarCircle}>
              <FontAwesome5 name="user-alt" size={18} color={COLORS.primary} />
            </View>

            <View style={styles.agentTextBox}>
              <Text style={styles.agentName}>{item.name}</Text>
              <Text style={styles.agentPhone}>
                {item.phone || item.email || "No contact available"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isAssigned ? COLORS.softGreen : COLORS.softRed },
            ]}
          >
            <MaterialIcons
              name={isAssigned ? "verified" : "warning"}
              size={17}
              color={isAssigned ? COLORS.secondary : COLORS.primary}
            />
            <Text
              style={[
                styles.statusText,
                { color: isAssigned ? COLORS.secondary : COLORS.primary },
              ]}
            >
              {isAssigned ? "Assigned" : "Open"}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Wallet</Text>
            <Text style={styles.metricValue}>
              ₦{Number(item.walletBalance || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Sales</Text>
            <Text style={styles.metricValue}>
              ₦{Number(item.totalSales || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={styles.currentSup}>
          Current Supervisor:{" "}
          <Text style={styles.currentSupValue}>{currentSupervisorName}</Text>
        </Text>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSupervisor[item.id] || ""}
            onValueChange={(value) =>
              setSelectedSupervisor((prev) => ({
                ...prev,
                [item.id]: value,
              }))
            }
            style={styles.picker}
          >
            <Picker.Item label="Select New Supervisor..." value="" />

            {supervisors.map((sup) => (
              <Picker.Item key={sup.id} label={sup.name} value={sup.id} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.transferBtn}
          onPress={() => handleAssign(item.id, selectedSupervisor[item.id])}
          disabled={assigningId === item.id}
          activeOpacity={0.86}
        >
          {assigningId === item.id ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialIcons name="swap-horiz" size={23} color={COLORS.white} />
              <Text style={styles.transferText}>ASSIGN AGENT</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Agent Network...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Network Management</Text>
          <Text style={styles.headerSubtitle}>
            Assign or transfer agents between supervisors
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAgents}
        keyExtractor={(item, index) => item?.id || String(index)}
        renderItem={renderAgent}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <MaterialIcons
                  name="groups"
                  size={35}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Agent Control Center</Text>
                <Text style={styles.heroText}>
                  Manage agents, supervisor assignment and network structure in
                  real time.
                </Text>
              </View>

              <TouchableOpacity style={styles.reloadBtn} onPress={fetchData}>
                <Ionicons name="refresh" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Agents" value={stats.totalAgents} color={COLORS.primary} />
              <StatCard label="Assigned" value={stats.assigned} color={COLORS.secondary} />
              <StatCard label="Open" value={stats.unassigned} color="#EA580C" />
              <StatCard label="Supervisors" value={stats.supervisors} color="#2563EB" />
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search agent by name, phone or email..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.sectionTitle}>Agents List</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="groups" size={46} color={COLORS.muted} />
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

const StatCard = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.primary,
    fontWeight: "800",
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextBox: { flex: 1 },
  headerTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  reloadBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  searchBar: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: COLORS.dark,
    fontWeight: "700",
    marginLeft: 8,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  agentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  agentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  agentInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
  },
  agentTextBox: {
    marginLeft: 12,
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
  },
  agentPhone: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.light,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  metricValue: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3,
  },
  currentSup: {
    fontSize: 13,
    marginTop: 14,
    color: "#475569",
    fontWeight: "700",
  },
  currentSupValue: {
    fontWeight: "900",
    color: COLORS.secondary,
  },
  pickerContainer: {
    marginTop: 12,
    backgroundColor: COLORS.light,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  picker: {
    height: 52,
    color: COLORS.dark,
  },
  transferBtn: {
    backgroundColor: COLORS.secondary,
    minHeight: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  transferText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 10,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
});

export default ManageAgentsScreen;