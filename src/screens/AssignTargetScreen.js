import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  CommonActions,
  DrawerActions,
} from "@react-navigation/native";
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
  danger: "#DC2626",
};

const API_ENDPOINTS = {
  supervisors: `${BASE_URL}/admin/supervisors`,
  assignTarget: `${BASE_URL}/admin/assign-target`,
};

const AssignTargetScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const [targetData, setTargetData] = useState({
    agentGoal: "",
    dataGoal: "",
    salesGoal: "",
    month: "April 2026",
    note: "",
  });

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("adminToken")) ||
      (await AsyncStorage.getItem("token"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getArray = (payload, key) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data?.users)) return payload.data.users;
    return [];
  };

  const normalizeSupervisor = (item, index) => ({
    id: item?._id || item?.id || `${index}`,
    name:
      item?.name ||
      item?.fullName ||
      `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
      "Supervisor",
    email: item?.email || "",
    phone: item?.phone || "",
    agents: item?.totalAgents || item?.agents?.length || 0,
  });

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.supervisors, { headers });
      const list = getArray(data, "supervisors").map(normalizeSupervisor);

      setSupervisors(list);

      const routeSupervisorId = route?.params?.supervisorId;
      const routeSupervisor = list.find((item) => item.id === routeSupervisorId);

      setSelectedSupervisor(routeSupervisor || list[0] || null);
    } catch (error) {
      setSupervisors([]);
      setSelectedSupervisor(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSupervisors();
  };

  const openMenu = () => {
  try {
    navigation.dispatch(DrawerActions.openDrawer());
  } catch {
    const parent = navigation.getParent?.();

    if (navigation.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation.navigate("Main", { screen: "AssignTarget" });
  }
};

  const goBack = () => {
  if (
    route?.params?.fromSuperAdmin ||
    route?.params?.backScreen === "SuperAdminDashboard"
  ) {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Main",
            params: {
              screen: "SuperAdminDashboard",
            },
          },
        ],
      })
    );
    return;
  }

  if (route?.params?.backScreen === "AdminDashboard") {
    navigation.navigate("AdminDashboard");
    return;
  }

  if (navigation.canGoBack?.()) {
    navigation.goBack();
    return;
  }

  navigation.navigate("Main", { screen: "AdminDashboard" });
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
            "adminToken",
            "token",
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

  const validateForm = () => {
    if (!selectedSupervisor?.id) {
      Alert.alert("Required", "Please select a supervisor.");
      return false;
    }

    if (!targetData.agentGoal.trim()) {
      Alert.alert("Required", "Enter agent registration goal.");
      return false;
    }

    if (!targetData.dataGoal.trim()) {
      Alert.alert("Required", "Enter data sales goal.");
      return false;
    }

    if (Number(targetData.agentGoal) <= 0 || Number(targetData.dataGoal) <= 0) {
      Alert.alert("Invalid Target", "Targets must be greater than zero.");
      return false;
    }

    return true;
  };

  const handleAssign = async () => {
    if (!validateForm()) return;

    Alert.alert(
      "Confirm Target",
      `Assign target to ${selectedSupervisor.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate",
          onPress: async () => {
            try {
              setSubmitting(true);
              const headers = await getAuthHeaders();

              const payload = {
                supervisorId: selectedSupervisor.id,
                supervisorName: selectedSupervisor.name,
                agentGoal: Number(targetData.agentGoal),
                dataGoal: Number(targetData.dataGoal),
                salesGoal: Number(targetData.salesGoal || 0),
                month: targetData.month.trim(),
                note: targetData.note.trim(),
              };

              const { data } = await axios.post(
                API_ENDPOINTS.assignTarget,
                payload,
                { headers }
              );

              if (data?.success === false) {
                Alert.alert("Failed", data?.message || "Target was not assigned.");
                return;
              }

              Alert.alert("Bellaj Data Hub", "Target activated successfully.", [
                { text: "OK", onPress: goBack },
              ]);
            } catch (error) {
              const message =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                "Failed to assign target. Please try again.";

              Alert.alert("Action Failed", message);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const selectedSummary = useMemo(() => {
    if (!selectedSupervisor) return "No supervisor selected";
    return `${selectedSupervisor.name}${
      selectedSupervisor.email ? ` • ${selectedSupervisor.email}` : ""
    }`;
  }, [selectedSupervisor]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading target center...</Text>
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
          <Text style={styles.headerTitle}>Set Monthly Target</Text>
          <Text style={styles.headerSubtitle}>Assign goals to Bellaj supervisors</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="target" size={34} color={COLORS.white} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Supervisor Target Center</Text>
              <Text style={styles.heroText}>
                Set monthly agent registration, data sales and revenue goals in real time.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Selected Supervisor</Text>
            <Text style={styles.sectionSubText}>{selectedSummary}</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.supervisorList}
            >
              {supervisors.length === 0 ? (
                <View style={styles.emptySupervisor}>
                  <Text style={styles.emptyText}>No supervisors returned from API.</Text>
                </View>
              ) : (
                supervisors.map((item) => {
                  const active = selectedSupervisor?.id === item.id;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.supervisorChip,
                        active && styles.supervisorChipActive,
                      ]}
                      onPress={() => setSelectedSupervisor(item)}
                      activeOpacity={0.86}
                    >
                      <View
                        style={[
                          styles.supervisorAvatar,
                          active && { backgroundColor: COLORS.white },
                        ]}
                      >
                        <Text
                          style={[
                            styles.supervisorAvatarText,
                            active && { color: COLORS.primary },
                          ]}
                        >
                          {(item.name || "S").charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.supervisorName,
                          active && { color: COLORS.white },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={[
                          styles.supervisorMeta,
                          active && { color: "#FFE4E4" },
                        ]}
                      >
                        {item.agents} agents
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <Text style={styles.label}>New Agents Registration Goal</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 10"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={targetData.agentGoal}
                onChangeText={(text) =>
                  setTargetData({ ...targetData, agentGoal: text })
                }
              />
              <Text style={styles.unitText}>Agents</Text>
            </View>

            <Text style={styles.label}>Data Sales Goal</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="database-arrow-up-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 100"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={targetData.dataGoal}
                onChangeText={(text) =>
                  setTargetData({ ...targetData, dataGoal: text })
                }
              />
              <Text style={styles.unitText}>GB</Text>
            </View>

            <Text style={styles.label}>Revenue Goal</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 500000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={targetData.salesGoal}
                onChangeText={(text) =>
                  setTargetData({ ...targetData, salesGoal: text })
                }
              />
              <Text style={styles.unitText}>₦</Text>
            </View>

            <Text style={styles.label}>Target Period</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="April 2026"
                placeholderTextColor="#94A3B8"
                value={targetData.month}
                onChangeText={(text) =>
                  setTargetData({ ...targetData, month: text })
                }
              />
            </View>

            <Text style={styles.label}>Admin Note</Text>
            <View style={[styles.inputWrapper, styles.noteWrapper]}>
              <MaterialCommunityIcons
                name="note-text-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="Optional target note"
                placeholderTextColor="#94A3B8"
                value={targetData.note}
                multiline
                onChangeText={(text) =>
                  setTargetData({ ...targetData, note: text })
                }
              />
            </View>

            <TouchableOpacity
              style={styles.assignBtn}
              onPress={handleAssign}
              disabled={submitting}
              activeOpacity={0.86}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="target"
                    size={21}
                    color={COLORS.white}
                  />
                  <Text style={styles.assignBtnText}>ACTIVATE TARGET</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={goBack}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
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
  headerTitle: { color: COLORS.white, fontSize: 19, fontWeight: "900" },
  headerSubtitle: {
    color: "#FFE4E4",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderText: {
    color: COLORS.primary,
    fontWeight: "800",
    marginTop: 12,
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
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionSubText: {
    color: COLORS.muted,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 19,
  },
  supervisorList: {
    paddingBottom: 16,
    gap: 10,
  },
  emptySupervisor: {
    backgroundColor: COLORS.light,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.muted,
    fontWeight: "700",
  },
  supervisorChip: {
    width: 150,
    backgroundColor: COLORS.light,
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supervisorChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  supervisorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  supervisorAvatarText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: "900",
  },
  supervisorName: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: "900",
  },
  supervisorMeta: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "900",
    color: "#475569",
    marginBottom: 9,
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    paddingHorizontal: 13,
    minHeight: 52,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  unitText: {
    color: COLORS.muted,
    fontWeight: "900",
    fontSize: 13,
  },
  noteWrapper: {
    alignItems: "flex-start",
    paddingTop: 12,
  },
  noteInput: {
    minHeight: 75,
    textAlignVertical: "top",
  },
  assignBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  assignBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  cancelBtn: {
    marginTop: 18,
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
  },
});

export default AssignTargetScreen;