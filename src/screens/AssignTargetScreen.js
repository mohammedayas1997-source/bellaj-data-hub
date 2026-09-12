import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  SafeAreaView,
  StatusBar,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, DrawerActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#EAF7F1",
  danger: "#DC2626",
  accent: "#2563EB",
};

const AssignTargetScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isSelectAll, setIsSelectAll] = useState(false);
  const [targetRoleFilter, setTargetRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [targetData, setTargetData] = useState({
    agentGoal: "",
    dataGoal: "",
    salesGoal: "",
    month: "September 2026",
    note: "",
  });

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("adminToken")) ||
      (await AsyncStorage.getItem("token"));

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 30000,
    };
  };

  const getArray = (payload, key) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.supervisors)) return payload.supervisors;
    if (Array.isArray(payload?.agents)) return payload.agents;
    return [];
  };

  const normalizeUser = (item, index) => ({
    id: item?._id || item?.id || `usr_${index}`,
    name:
      item?.name ||
      item?.fullName ||
      `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
      "User",
    email: item?.email || "",
    phone: item?.phone || "",
    role: (item?.role || "user").toLowerCase(),
    agents: item?.totalAgents || item?.agents?.length || 0,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      const endpoints = [
        `${BASE_URL}/admin/supervisors`,
        `${BASE_URL}/admin/users`,
        `${BASE_URL}/superadmin/users`,
        `${BASE_URL}/users`,
      ];

      let raw = [];
      for (const url of endpoints) {
        try {
          const res = await axios.get(url, config);
          if (res?.data) {
            const arr =
              getArray(res.data, "supervisors").length > 0
                ? getArray(res.data, "supervisors")
                : getArray(res.data, "users");
            if (arr.length > 0) {
              raw = arr;
              break;
            }
          }
        } catch {
          // Fallback
        }
      }

      const list = raw.map(normalizeUser);
      setUsersList(list);

      const routeId = route?.params?.supervisorId || route?.params?.userId;
      if (routeId) {
        const found = list.find((u) => u.id === routeId);
        if (found) {
          setSelectedUser(found);
          setIsSelectAll(false);
        }
      } else if (list.length > 0 && !selectedUser && !isSelectAll) {
        setSelectedUser(list[0]);
      }
    } catch {
      setUsersList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route?.params, isSelectAll, selectedUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
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
              params: { screen: "SuperAdminDashboard" },
            },
          ],
        })
      );
      return;
    }

    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Main");
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((item) => {
      const matchesRole =
        targetRoleFilter === "all" || item.role === targetRoleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q);

      return matchesRole && matchesSearch;
    });
  }, [usersList, targetRoleFilter, searchQuery]);

  const handleAssign = async () => {
    const resolvedTargetId = isSelectAll
      ? "GLOBAL_ALL"
      : selectedUser
      ? selectedUser.id
      : searchQuery.trim();

    if (!resolvedTargetId) {
      Alert.alert("Target Required", "Please choose a beneficiary or select 'Select All'.");
      return;
    }

    if (!targetData.agentGoal && !targetData.dataGoal && !targetData.salesGoal) {
      Alert.alert("Goal Required", "Please enter at least one goal metric.");
      return;
    }

    try {
      setSubmitting(true);
      const config = await getAuthHeaders();

      const payload = {
        supervisorId: resolvedTargetId,
        agentId: resolvedTargetId,
        targetUserId: resolvedTargetId,
        isGlobal: isSelectAll,
        target: Number(targetData.salesGoal || targetData.dataGoal || 0),
        quota: Number(targetData.salesGoal || 0),
        agentGoal: Number(targetData.agentGoal || 0),
        dataGoal: Number(targetData.dataGoal || 0),
        salesGoal: Number(targetData.salesGoal || 0),
        month: targetData.month.trim(),
        note: targetData.note.trim(),
      };

      await axios.post(`${BASE_URL}/admin/targets`, payload, config).catch(async () => {
        return await axios.put(`${BASE_URL}/admin/assign-target`, payload, config);
      });

      Alert.alert("Target Activated", "Target deployed successfully.", [
        { text: "OK", onPress: goBack },
      ]);
    } catch (err) {
      Alert.alert("Target Failed", err.response?.data?.message || "Failed to commit target.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Assign Target Center</Text>
          <Text style={styles.headerSubtitle}>Set performance goals live</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
          }
        >
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.card}>
              {/* Select All Toggle */}
              <TouchableOpacity
                style={[styles.selectAllBtn, isSelectAll && styles.selectAllBtnActive]}
                onPress={() => {
                  setIsSelectAll(!isSelectAll);
                  if (!isSelectAll) setSelectedUser(null);
                }}
              >
                <Ionicons
                  name={isSelectAll ? "checkbox" : "square-outline"}
                  size={22}
                  color={isSelectAll ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.selectAllText, isSelectAll && styles.selectAllTextActive]}>
                  SELECT ALL USERS (GLOBAL TARGET)
                </Text>
              </TouchableOpacity>

              {/* Manual Search */}
              {!isSelectAll && (
                <View style={styles.searchWrapper}>
                  <Ionicons name="search-outline" size={20} color={COLORS.muted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search User by Name, Email, or ID..."
                    placeholderTextColor={COLORS.muted}
                    value={searchQuery}
                    onChangeText={(t) => {
                      setSearchQuery(t);
                      if (selectedUser) setSelectedUser(null);
                    }}
                  />
                </View>
              )}

              {/* User Selection List */}
              {!isSelectAll && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  {filteredUsers.map((u) => {
                    const active = selectedUser?.id === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[styles.userChip, active && styles.userChipActive]}
                        onPress={() => {
                          setSelectedUser(u);
                          setSearchQuery("");
                        }}
                      >
                        <Text style={[styles.userName, active && styles.userNameActive]}>
                          {u.name}
                        </Text>
                        <Text style={[styles.userMeta, active && styles.userMetaActive]}>
                          {u.role.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Goal Inputs */}
              <Text style={styles.label}>Agents Registration Goal</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 20"
                keyboardType="numeric"
                value={targetData.agentGoal}
                onChangeText={(t) => setTargetData({ ...targetData, agentGoal: t })}
              />

              <Text style={styles.label}>Data Volume Goal (GB)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 300"
                keyboardType="numeric"
                value={targetData.dataGoal}
                onChangeText={(t) => setTargetData({ ...targetData, dataGoal: t })}
              />

              <Text style={styles.label}>Revenue Target (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500000"
                keyboardType="numeric"
                value={targetData.salesGoal}
                onChangeText={(t) => setTargetData({ ...targetData, salesGoal: t })}
              />

              <Text style={styles.label}>Target Month</Text>
              <TextInput
                style={styles.input}
                placeholder="September 2026"
                value={targetData.month}
                onChangeText={(t) => setTargetData({ ...targetData, month: t })}
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAssign}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>DEPLOY TARGET LIVE</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 44 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: { marginRight: 12 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  headerSubtitle: { color: "#BBF7D0", fontSize: 12, fontWeight: "600" },
  container: { flex: 1 },
  content: { padding: 16, maxWidth: 800, width: "100%", alignSelf: "center" },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 14,
  },
  selectAllBtnActive: { backgroundColor: COLORS.primary },
  selectAllText: { color: COLORS.primary, fontWeight: "800", fontSize: 13 },
  selectAllTextActive: { color: COLORS.white },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, fontSize: 14 },
  userChip: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    borderRadius: 10,
    marginRight: 8,
    minWidth: 120,
  },
  userChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  userName: { color: COLORS.dark, fontWeight: "800", fontSize: 12 },
  userNameActive: { color: COLORS.white },
  userMeta: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  userMetaActive: { color: "#BBF7D0" },
  label: { color: COLORS.muted, fontSize: 11, fontWeight: "800", marginBottom: 4, marginTop: 6 },
  input: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 14 },
});

export default AssignTargetScreen;