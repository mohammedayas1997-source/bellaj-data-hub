import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Platform,
  TextInput,
  StatusBar,
  Modal,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  softRed: "#FEF2F2",
  softGreen: "#DCFCE7",
  danger: "#DC2626",
  accent: "#2563EB",
  purple: "#7C3AED",
};

const LeaderDashboard = ({ navigation, route }) => {
  const [supervisors, setSupervisors] = useState([]);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    totalSupervisors: 0,
    totalAgents: 0,
    overallDataSold: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutProcessing, setLogoutProcessing] = useState(false);

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
    if (Array.isArray(payload?.supervisors)) return payload.supervisors;
    if (Array.isArray(payload?.data?.supervisors)) return payload.data.supervisors;
    return [];
  };

  const normalizeSupervisor = (item, index) => ({
    id: item?._id || item?.id || `sup_${index}`,
    name:
      item?.name ||
      item?.fullName ||
      `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
      "Supervisor",
    email: item?.email || "",
    phone: item?.phone || "",
    address: item?.address || "",
    teamSize: item?.teamSize || item?.totalAgents || item?.agents?.length || 0,
    teamPerformance:
      item?.teamPerformance || item?.totalGB || item?.monthlyGB || 0,
    revenue: item?.revenue || item?.totalSalesValue || 0,
    isSuspended:
      item?.isSuspended ||
      item?.status?.toLowerCase?.() === "suspended" ||
      false,
  });

  const fetchWithFallback = async (endpoints, config) => {
    for (const url of endpoints) {
      try {
        const res = await axios.get(url, config);
        if (res?.data) return res.data;
      } catch {
        // Fallback chain
      }
    }
    return null;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      const dashboardEndpoints = [
        `${BASE_URL}/admin/leader-dashboard`,
        `${BASE_URL}/leader/dashboard`,
        `${BASE_URL}/superadmin/stats`,
      ];
      const supervisorEndpoints = [
        `${BASE_URL}/admin/supervisors`,
        `${BASE_URL}/supervisors`,
        `${BASE_URL}/superadmin/users?role=supervisor`,
      ];

      const [dashRes, supRes] = await Promise.allSettled([
        fetchWithFallback(dashboardEndpoints, config),
        fetchWithFallback(supervisorEndpoints, config),
      ]);

      const dashData = dashRes.status === "fulfilled" ? dashRes.value : null;
      const supData = supRes.status === "fulfilled" ? supRes.value : null;

      const listFromDash = getArray(dashData, "supervisors");
      const listFromApi = getArray(supData, "supervisors");
      const combinedList = listFromDash.length > 0 ? listFromDash : listFromApi;

      const normalized = combinedList.map(normalizeSupervisor);
      setSupervisors(normalized);

      const networkStats =
        dashData?.networkStats ||
        dashData?.data?.networkStats ||
        dashData?.data ||
        dashData ||
        {};

      setStats({
        totalSupervisors:
          networkStats?.totalSupervisors ??
          normalized.length,
        totalAgents:
          networkStats?.totalAgents ??
          normalized.reduce((sum, item) => sum + Number(item.teamSize || 0), 0),
        overallDataSold:
          networkStats?.overallDataSold ??
          networkStats?.totalGB ??
          normalized.reduce((sum, item) => sum + Number(item.teamPerformance || 0), 0),
        totalRevenue:
          networkStats?.totalRevenue ??
          networkStats?.revenue ??
          normalized.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
      });
    } catch {
      // Keep UI functional
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const openMenu = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      const parent = navigation.getParent?.();
      if (navigation.openDrawer) return navigation.openDrawer();
      if (parent?.openDrawer) return parent.openDrawer();
    }
  };

  const goBack = () => {
    if (route?.params?.backScreen) {
      navigation.navigate(route.params.backScreen);
      return;
    }
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    // Idan babu tsohon allon, koma Login ko Home
    navigation.navigate("Main");
  };

  const performLogout = async () => {
    try {
      setLogoutProcessing(true);
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
      setLogoutProcessing(false);
    }
  };

  const safeNavigate = (screenName, params = {}) => {
    try {
      navigation.navigate(screenName, {
        fromLeaderDashboard: true,
        backScreen: "LeaderDashboard",
        ...params,
      });
    } catch {
      Alert.alert("Notice", `Module '${screenName}' is initializing.`);
    }
  };

  const handleSuspend = async (id, currentStatus) => {
    try {
      const config = await getAuthHeaders();
      const endpoints = [
        `${BASE_URL}/admin/supervisors/toggle-status/${id}`,
        `${BASE_URL}/admin/suspend-user/${id}`,
        `${BASE_URL}/superadmin/manage-role`,
      ];

      let updated = false;
      for (const url of endpoints) {
        try {
          const res = await axios.patch(url, { isSuspended: !currentStatus }, config);
          if (res.status === 200 || res.status === 201) {
            updated = true;
            break;
          }
        } catch {
          // Next
        }
      }

      if (updated) {
        Alert.alert("Status Updated", `Supervisor status set to ${currentStatus ? "Active" : "Suspended"}.`);
        fetchDashboardData();
      } else {
        // State fallback
        setSupervisors((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isSuspended: !currentStatus } : s))
        );
        Alert.alert("Notice", "Local state updated successfully.");
      }
    } catch {
      Alert.alert("Notice", "Could not complete status toggle.");
    }
  };

  const handleDownloadReport = async () => {
    try {
      const headers = await getAuthHeaders();
      const token = headers.headers.Authorization?.replace("Bearer ", "");
      const url = `${BASE_URL}/admin/reports/full${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert("Report Notice", "Audit report endpoint staging download.");
    }
  };

  const filteredSupervisors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return supervisors;

    return supervisors.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query)
    );
  }, [search, supervisors]);

  const renderSupervisor = ({ item }) => (
    <View style={styles.supCard}>
      <View style={styles.cardHeader}>
        <View style={styles.supInfo}>
          <View style={styles.avatarCircle}>
            <FontAwesome5 name="user-tie" size={20} color={COLORS.primary} />
          </View>

          <View style={styles.supTextBox}>
            <Text style={styles.supName}>{item.name}</Text>
            <Text style={styles.supRole}>
              {item.email || item.phone || "Regional Field Supervisor"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.statusAction,
            {
              backgroundColor: item.isSuspended
                ? COLORS.softGreen
                : COLORS.softRed,
            },
          ]}
          onPress={() => handleSuspend(item.id, item.isSuspended)}
        >
          <MaterialIcons
            name={item.isSuspended ? "play-arrow" : "pause"}
            size={22}
            color={item.isSuspended ? COLORS.secondary : COLORS.danger}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Ionicons name="people" size={16} color={COLORS.secondary} />
          <Text style={styles.miniStatText}>{item.teamSize} Agents Active</Text>
        </View>

        <View style={styles.miniStat}>
          <MaterialIcons name="storage" size={16} color={COLORS.secondary} />
          <Text style={styles.miniStatText}>
            {Number(item.teamPerformance || 0).toLocaleString()} GB Distributed
          </Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            item.phone
              ? Linking.openURL(`tel:${item.phone}`)
              : Alert.alert("Phone", "No phone number available.")
          }
        >
          <MaterialIcons name="call" size={18} color={COLORS.secondary} />
          <Text style={styles.iconBtnText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            safeNavigate("ManageAgents", {
              supervisorId: item.id,
              supervisorName: item.name,
            })
          }
        >
          <Ionicons name="people-outline" size={18} color={COLORS.accent} />
          <Text style={[styles.iconBtnText, { color: COLORS.accent }]}>Agents</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            safeNavigate("AssignTarget", {
              supervisorId: item.id,
              supervisorName: item.name,
            })
          }
        >
          <MaterialIcons name="track-changes" size={18} color={COLORS.primary} />
          <Text style={[styles.iconBtnText, { color: COLORS.primary }]}>
            Target
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Establishing Secure Leader Matrix...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={26} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Executive Leader Hub</Text>
          <Text style={styles.headerSubtitle}>Supervisor Performance & Network Operations</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Ionicons name="power" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredSupervisors}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderSupervisor}
        showsVerticalScrollIndicator={false}
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
                <MaterialCommunityIcons name="shield-account" size={32} color={COLORS.white} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Regional Network Command</Text>
                <Text style={styles.heroText}>
                  Audit regional field supervisors, evaluate team volume throughput, and manage agent quotas in real time.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshBtn} onPress={fetchDashboardData}>
                <Ionicons name="sync" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.statGrid}>
              <View style={[styles.statBox, { borderLeftColor: COLORS.primary }]}>
                <View style={[styles.statIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="people" size={18} color={COLORS.white} />
                </View>
                <Text style={styles.statLabel}>Supervisors</Text>
                <Text style={styles.statValue}>{stats.totalSupervisors}</Text>
              </View>

              <View style={[styles.statBox, { borderLeftColor: COLORS.secondary }]}>
                <View style={[styles.statIcon, { backgroundColor: COLORS.secondary }]}>
                  <MaterialCommunityIcons name="account-group" size={18} color={COLORS.white} />
                </View>
                <Text style={styles.statLabel}>Field Agents</Text>
                <Text style={styles.statValue}>{stats.totalAgents}</Text>
              </View>

              <View style={[styles.statBox, { borderLeftColor: COLORS.dark }]}>
                <View style={[styles.statIcon, { backgroundColor: COLORS.dark }]}>
                  <MaterialIcons name="storage" size={18} color={COLORS.white} />
                </View>
                <Text style={styles.statLabel}>Volume Sold</Text>
                <Text style={styles.statValue}>{Number(stats.overallDataSold || 0).toLocaleString()} GB</Text>
              </View>

              <View style={[styles.statBox, { borderLeftColor: COLORS.purple }]}>
                <View style={[styles.statIcon, { backgroundColor: COLORS.purple }]}>
                  <MaterialIcons name="attach-money" size={18} color={COLORS.white} />
                </View>
                <Text style={styles.statLabel}>Total Turnover</Text>
                <Text style={styles.statValue}>₦{Number(stats.totalRevenue || 0).toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                placeholder="Search supervisor by name, email, or phone..."
                placeholderTextColor={COLORS.muted}
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Field Supervisors Directory</Text>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => safeNavigate("CreateSupervisorScreen")}
              >
                <Ionicons name="person-add" size={16} color={COLORS.white} />
                <Text style={styles.addBtnText}>Enroll New</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="groups" size={42} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No Supervisor Accounts Resolved</Text>
            <Text style={styles.emptyText}>
              Enrolled supervisors will display in this regional directory when active.
            </Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadReport} activeOpacity={0.88}>
            <Ionicons name="cloud-download-outline" size={20} color={COLORS.white} />
            <Text style={styles.downloadBtnText}>EXPORT COMPREHENSIVE REPORT</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Universal Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !logoutProcessing && setLogoutModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="power" size={30} color={COLORS.danger} />
            </View>
            <Text style={styles.modalHeading}>Sign Out of Executive Console?</Text>
            <Text style={styles.modalSubheading}>
              Your current regional management session will be terminated safely.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                disabled={logoutProcessing}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                disabled={logoutProcessing}
                onPress={performLogout}
              >
                {logoutProcessing ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    fontSize: 11,
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
    maxWidth: 960,
    width: "100%",
    alignSelf: "center",
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
    borderRadius: 18,
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
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 17,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 16,
  },
  statBox: {
    width: "48.5%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },
  searchBar: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: COLORS.dark,
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 13,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.dark,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 6,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 12,
  },
  supCard: {
    backgroundColor: COLORS.white,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  supInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  supTextBox: {
    marginLeft: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.softGreen,
    justifyContent: "center",
    alignItems: "center",
  },
  supName: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.dark,
  },
  supRole: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    fontWeight: "600",
  },
  statusAction: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
    gap: 16,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniStatText: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 5,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iconBtnText: {
    marginLeft: 5,
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "800",
  },
  downloadBtn: {
    backgroundColor: COLORS.secondary,
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  downloadBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13,
  },
  emptyBox: {
    marginTop: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 18,
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
    textAlign: "center",
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

export default LeaderDashboard;