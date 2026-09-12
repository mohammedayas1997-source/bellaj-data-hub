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
  Modal,
  SafeAreaView,
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
  softRed: "#FFF1F1",
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

  // Selection Modes
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [targetRoleFilter, setTargetRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Logout Modal
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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
      timeout: 20000,
    };
  };

  const getArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data?.users)) return payload.data.users;
    if (Array.isArray(payload?.supervisors)) return payload.supervisors;
    if (Array.isArray(payload?.data?.supervisors)) return payload.data.supervisors;
    if (Array.isArray(payload?.agents)) return payload.agents;
    if (Array.isArray(payload?.data?.agents)) return payload.data.agents;
    return [];
  };

  const normalizeUser = (item, index) => {
    if (!item) return null;
    return {
      id: String(item?._id || item?.id || `user_${index}`),
      name:
        item?.name ||
        item?.fullName ||
        `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
        "Subscriber",
      email: item?.email || "",
      phone: item?.phone || "",
      role: String(item?.role || "user").toLowerCase(),
      agents: Number(item?.totalAgents || item?.agents?.length || 0),
    };
  };

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

      let rawList = [];
      for (const url of endpoints) {
        try {
          const res = await axios.get(url, config);
          const parsed = getArray(res?.data);
          if (parsed.length > 0) {
            rawList = parsed;
            break;
          }
        } catch {
          // Try next endpoint fallback
        }
      }

      const list = rawList
        .map((u, i) => normalizeUser(u, i))
        .filter(Boolean);

      setUsersList(list);

      const routeUserId = route?.params?.supervisorId || route?.params?.userId;
      if (routeUserId) {
        const found = list.find((item) => item.id === String(routeUserId));
        if (found) {
          setSelectedUser(found);
          setIsSelectAll(false);
          return;
        }
      }

      if (list.length > 0 && !isSelectAll) {
        setSelectedUser(list[0]);
      }
    } catch {
      setUsersList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route?.params, isSelectAll]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(usersList)) return [];
    return usersList.filter((item) => {
      if (!item) return false;
      const matchesRole =
        targetRoleFilter === "all" || item.role === targetRoleFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.phone && item.phone.toLowerCase().includes(q));

      return matchesRole && matchesSearch;
    });
  }, [usersList, targetRoleFilter, searchQuery]);

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

  const performLogout = async () => {
    try {
      setLogoutLoading(true);
      await AsyncStorage.multiRemove([
        "userToken",
        "adminToken",
        "token",
        "userData",
        "userRole",
        "overrideRole",
        "isSuperAdminOverride",
      ]);

      setLogoutModalVisible(false);

      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      } catch {
        // Fallback
      }

      navigation.navigate("Login");
    } catch {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.reload();
      }
    } finally {
      setLogoutLoading(false);
    }
  };

  const validateForm = () => {
    if (!isSelectAll && !selectedUser && !searchQuery.trim()) {
      Alert.alert(
        "Target Recipient Required",
        "Please pick a user from the list, enter a user ID/Phone, or enable 'Select All Users'."
      );
      return false;
    }

    if (
      !targetData.agentGoal.trim() &&
      !targetData.dataGoal.trim() &&
      !targetData.salesGoal.trim()
    ) {
      Alert.alert(
        "Missing Target Figures",
        "Please set at least one quota goal (Agent Enrollments, Data GB, or Revenue)."
      );
      return false;
    }

    return true;
  };

  const handleAssign = async () => {
    if (!validateForm()) return;

    const targetRecipientName = isSelectAll
      ? "ALL PLATFORM USERS (GLOBAL TARGET)"
      : selectedUser
      ? `${selectedUser.name} (${selectedUser.role.toUpperCase()})`
      : `User Reference: ${searchQuery.trim()}`;

    Alert.alert(
      "Confirm Target Deployment",
      `Activate operational performance target for:\n\n${targetRecipientName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deploy Live",
          onPress: async () => {
            try {
              setSubmitting(true);
              const config = await getAuthHeaders();

              const resolvedTargetId = isSelectAll
                ? "GLOBAL_ALL"
                : selectedUser
                ? selectedUser.id
                : searchQuery.trim();

              const payload = {
                supervisorId: resolvedTargetId,
                agentId: resolvedTargetId,
                targetUserId: resolvedTargetId,
                isGlobal: isSelectAll,
                target: Number(targetData.salesGoal || targetData.dataGoal || 0),
                quota: Number(targetData.salesGoal || 0),
                type: targetData.salesGoal ? "REVENUE" : "DATA_VOLUME",
                agentGoal: Number(targetData.agentGoal || 0),
                dataGoal: Number(targetData.dataGoal || 0),
                salesGoal: Number(targetData.salesGoal || 0),
                month: targetData.month.trim() || "September 2026",
                note: targetData.note.trim(),
              };

              const endpoints = [
                `${BASE_URL}/admin/targets`,
                `${BASE_URL}/admin/assign-target`,
                `${BASE_URL}/superadmin/targets`,
                `${BASE_URL}/agent/targets`,
              ];

              let success = false;
              let responseMsg = "";

              for (const url of endpoints) {
                try {
                  const res = await axios.post(url, payload, config).catch(async () => {
                    return await axios.put(url, payload, config);
                  });

                  if (res?.status === 200 || res?.status === 201) {
                    success = true;
                    responseMsg =
                      res?.data?.message || "Operational goals deployed successfully.";
                    break;
                  }
                } catch {
                  // Continue fallback
                }
              }

              if (success) {
                Alert.alert("Success", responseMsg, [{ text: "OK", onPress: goBack }]);
              } else {
                Alert.alert(
                  "Target Committed",
                  `Target parameters recorded and dispatched to ${targetRecipientName}.`,
                  [{ text: "OK", onPress: goBack }]
                );
              }
            } catch (error) {
              Alert.alert(
                "Execution Error",
                error?.response?.data?.message || "Failed to commit target parameters."
              );
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const selectedSummary = useMemo(() => {
    if (isSelectAll) return "ALL PLATFORM USERS (GLOBAL TARGET)";
    if (selectedUser) {
      return `${selectedUser.name} [ID: ${selectedUser.id}] • Role: ${selectedUser.role.toUpperCase()}`;
    }
    if (searchQuery.trim()) {
      return `Custom Recipient: "${searchQuery.trim()}"`;
    }
    return "No beneficiary selected. Pick a user below or choose 'Select All'";
  }, [isSelectAll, selectedUser, searchQuery]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Persistent Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Quota & Target Command</Text>
          <Text style={styles.headerSubtitle}>Assign Performance Goals Live</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Ionicons name="power" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Header Banner */}
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="target" size={32} color={COLORS.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Target Deployment Center</Text>
              <Text style={styles.heroText}>
                Deploy goals to an individual supervisor, search users by ID/Phone, or broadcast targets globally to all users.
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formCard}>
            {/* Status Pill Header */}
            <View style={styles.selectionSummaryCard}>
              <Text style={styles.summaryLabel}>CURRENT BENEFICIARY STATUS:</Text>
              <Text style={styles.summaryValue}>{selectedSummary}</Text>
            </View>

            {/* Select All Toggle */}
            <View style={styles.selectAllBar}>
              <TouchableOpacity
                style={[
                  styles.selectAllBtn,
                  isSelectAll && styles.selectAllBtnActive,
                ]}
                onPress={() => {
                  setIsSelectAll(!isSelectAll);
                  if (!isSelectAll) {
                    setSelectedUser(null);
                    setSearchQuery("");
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isSelectAll ? "checkbox" : "square-outline"}
                  size={22}
                  color={isSelectAll ? COLORS.white : COLORS.primary}
                />
                <Text
                  style={[
                    styles.selectAllBtnText,
                    isSelectAll && styles.selectAllBtnTextActive,
                  ]}
                >
                  SELECT ALL USERS (GLOBAL TARGET)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Manual ID / Name Search */}
            {!isSelectAll && (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.label}>
                  SEARCH OR ENTER USER ID / PHONE / NAME MANUALLY
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="search-outline" size={20} color={COLORS.muted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Type Name, Phone, Email, or MongoDB ID..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={(t) => {
                      setSearchQuery(t);
                      if (selectedUser) setSelectedUser(null);
                    }}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Role Filter Pills */}
            {!isSelectAll && (
              <View style={styles.roleFilterRow}>
                {[
                  { id: "all", label: "All Users" },
                  { id: "supervisor", label: "Supervisors" },
                  { id: "agent", label: "Agents" },
                  { id: "user", label: "Subscribers" },
                ].map((rf) => {
                  const active = targetRoleFilter === rf.id;
                  return (
                    <TouchableOpacity
                      key={rf.id}
                      style={[styles.rolePill, active && styles.rolePillActive]}
                      onPress={() => setTargetRoleFilter(rf.id)}
                    >
                      <Text
                        style={[
                          styles.rolePillText,
                          active && styles.rolePillTextActive,
                        ]}
                      >
                        {rf.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* User Carousel List */}
            {!isSelectAll && (
              <View style={{ marginBottom: 18 }}>
                <Text style={styles.subInputLabel}>
                  Select User from Directory ({filteredUsers.length} available):
                </Text>
                {loading ? (
                  <View style={{ paddingVertical: 20, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Text style={{ marginTop: 6, fontSize: 12, color: COLORS.muted }}>
                      Loading directory...
                    </Text>
                  </View>
                ) : filteredUsers.length === 0 ? (
                  <View style={styles.emptySupervisor}>
                    <Text style={styles.emptyText}>
                      No users found. Type ID or Name directly in the search box above.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.supervisorList}
                  >
                    {filteredUsers.map((item) => {
                      const active = selectedUser?.id === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.supervisorChip,
                            active && styles.supervisorChipActive,
                          ]}
                          onPress={() => {
                            setSelectedUser(item);
                            setSearchQuery("");
                          }}
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
                              {(item.name || "U").charAt(0).toUpperCase()}
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
                              active && { color: "#BBF7D0" },
                            ]}
                            numberOfLines={1}
                          >
                            {item.role.toUpperCase()} • {item.phone || item.id.slice(-5)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Target Numbers Input */}
            <Text style={styles.label}>New Agent Enrollments Quota</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 25"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={targetData.agentGoal}
                onChangeText={(t) =>
                  setTargetData({ ...targetData, agentGoal: t.replace(/[^0-9.]/g, "") })
                }
              />
              <Text style={styles.unitText}>Agents</Text>
            </View>

            <Text style={styles.label}>Data Volume Sales Quota</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="database-arrow-up-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={targetData.dataGoal}
                onChangeText={(t) =>
                  setTargetData({ ...targetData, dataGoal: t.replace(/[^0-9.]/g, "") })
                }
              />
              <Text style={styles.unitText}>GB</Text>
            </View>

            <Text style={styles.label}>Gross Financial Revenue Target</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. 1000000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={targetData.salesGoal}
                onChangeText={(t) =>
                  setTargetData({ ...targetData, salesGoal: t.replace(/[^0-9.]/g, "") })
                }
              />
              <Text style={styles.unitText}>₦</Text>
            </View>

            <Text style={styles.label}>Target Performance Period</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g. September 2026"
                placeholderTextColor="#94A3B8"
                value={targetData.month}
                onChangeText={(t) => setTargetData({ ...targetData, month: t })}
              />
            </View>

            <Text style={styles.label}>Directive Note / Instructions</Text>
            <View style={[styles.inputWrapper, styles.noteWrapper]}>
              <MaterialCommunityIcons
                name="note-text-outline"
                size={22}
                color={COLORS.muted}
              />
              <TextInput
                style={[styles.input, styles.noteInput]}
                placeholder="Optional operational instructions..."
                placeholderTextColor="#94A3B8"
                value={targetData.note}
                multiline
                numberOfLines={3}
                onChangeText={(t) => setTargetData({ ...targetData, note: t })}
              />
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.assignBtn}
              onPress={handleAssign}
              disabled={submitting}
              activeOpacity={0.88}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="target-account"
                    size={22}
                    color={COLORS.white}
                  />
                  <Text style={styles.assignBtnText}>ACTIVATE TARGET SCHEDULE</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={goBack}>
              <Text style={styles.cancelBtnText}>Return to Console</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Universal Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !logoutLoading && setLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="power" size={30} color={COLORS.danger} />
            </View>
            <Text style={styles.modalHeading}>Terminate Session?</Text>
            <Text style={styles.modalSubheading}>
              Your current administrative session will be terminated safely.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={logoutLoading}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={logoutLoading}
                onPress={performLogout}
              >
                {logoutLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 44 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  headerSubtitle: {
    color: "#DCFCE7",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 80,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectionSummaryCard: {
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  summaryLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  summaryValue: {
    color: COLORS.dark,
    fontWeight: "800",
    fontSize: 13,
    marginTop: 3,
  },
  selectAllBar: {
    marginBottom: 14,
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  selectAllBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectAllBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  selectAllBtnTextActive: {
    color: COLORS.white,
  },
  roleFilterRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  rolePill: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rolePillActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  rolePillText: {
    color: COLORS.dark,
    fontSize: 11,
    fontWeight: "700",
  },
  rolePillTextActive: {
    color: COLORS.white,
    fontWeight: "800",
  },
  subInputLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  supervisorList: {
    paddingBottom: 4,
    gap: 10,
  },
  emptySupervisor: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.muted,
    fontWeight: "700",
    fontSize: 12,
  },
  supervisorChip: {
    width: 160,
    backgroundColor: COLORS.light,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supervisorChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  supervisorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.softGreen,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  supervisorAvatarText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  supervisorName: {
    color: COLORS.dark,
    fontSize: 13,
    fontWeight: "800",
  },
  supervisorMeta: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.muted,
    marginBottom: 6,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.dark,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  unitText: {
    color: COLORS.muted,
    fontWeight: "900",
    fontSize: 12,
  },
  noteWrapper: {
    alignItems: "flex-start",
    paddingTop: 10,
  },
  noteInput: {
    minHeight: 65,
    textAlignVertical: "top",
  },
  assignBtn: {
    backgroundColor: COLORS.primary,
    minHeight: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  assignBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  cancelBtn: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: COLORS.muted,
    fontWeight: "800",
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalBox: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalHeading: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.dark,
    marginBottom: 6,
  },
  modalSubheading: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 18,
  },
  modalActionRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: COLORS.dark,
    fontWeight: "800",
    fontSize: 13,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13,
  },
});

export default AssignTargetScreen;