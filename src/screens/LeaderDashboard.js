import React, { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
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
  leaderDashboard: `${BASE_URL}/admin/leader-dashboard`,
  supervisors: `${BASE_URL}/admin/supervisors`,
  toggleSupervisorStatus: `${BASE_URL}/admin/supervisors/toggle-status`,
  downloadFullReport: `${BASE_URL}/admin/reports/full`,
};

const LeaderDashboard = ({ navigation }) => {
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

  useEffect(() => {
    fetchDashboardData();
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
    if (Array.isArray(payload?.supervisors)) return payload.supervisors;
    if (Array.isArray(payload?.data?.supervisors)) return payload.data.supervisors;
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const results = await Promise.allSettled([
        axios.get(API_ENDPOINTS.leaderDashboard, { headers }),
        axios.get(API_ENDPOINTS.supervisors, { headers }),
      ]);

      const dashboardRes =
        results[0].status === "fulfilled" ? results[0].value.data : {};
      const supervisorsRes =
        results[1].status === "fulfilled" ? results[1].value.data : {};

      const dashboardSupervisors = getArray(dashboardRes, "supervisors");
      const apiSupervisors = getArray(supervisorsRes, "supervisors");

      const list =
        dashboardSupervisors.length > 0 ? dashboardSupervisors : apiSupervisors;

      const normalized = list.map(normalizeSupervisor);
      setSupervisors(normalized);

      const networkStats =
        dashboardRes?.data?.networkStats ||
        dashboardRes?.networkStats ||
        dashboardRes?.data ||
        dashboardRes ||
        {};

      setStats({
        totalSupervisors:
          networkStats?.totalSupervisors || normalized.length || 0,
        totalAgents:
          networkStats?.totalAgents ||
          normalized.reduce((sum, item) => sum + Number(item.teamSize || 0), 0),
        overallDataSold:
          networkStats?.overallDataSold ||
          networkStats?.totalGB ||
          normalized.reduce(
            (sum, item) => sum + Number(item.teamPerformance || 0),
            0
          ),
        totalRevenue:
          networkStats?.totalRevenue ||
          networkStats?.revenue ||
          normalized.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
      });
    } catch (error) {
      Alert.alert("Connection Error", "Could not load live leader dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const openMenu = () => {
    const parent = navigation.getParent?.();

    if (navigation.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    Alert.alert("Menu", "Drawer menu is not available on this navigator.");
  };

  const goBack = () => {
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

  const safeNavigate = (screenName, params = {}) => {
    try {
      navigation.navigate(screenName, {
        fromLeaderDashboard: true,
        backScreen: "LeaderDashboard",
        ...params,
      });
    } catch {
      Alert.alert("Navigation Error", `${screenName} is not registered.`);
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
              const headers = await getAuthHeaders();

              await axios.patch(
                `${API_ENDPOINTS.toggleSupervisorStatus}/${id}`,
                { isSuspended: !currentStatus },
                { headers }
              );

              Alert.alert("Success", "Supervisor status updated successfully.");
              fetchDashboardData();
            } catch {
              Alert.alert("Failed", "Action could not be completed.");
            }
          },
        },
      ]
    );
  };

  const handleDownloadReport = async () => {
    try {
      const headers = await getAuthHeaders();
      const token = headers.Authorization?.replace("Bearer ", "");

      const url = token
        ? `${API_ENDPOINTS.downloadFullReport}?token=${encodeURIComponent(token)}`
        : API_ENDPOINTS.downloadFullReport;

      await Linking.openURL(url);
    } catch {
      Alert.alert("Report Error", "Could not open report link.");
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
    <TouchableOpacity
      style={styles.supCard}
      onPress={() =>
        safeNavigate("ManageAgents", {
          supervisorId: item.id,
          supervisorName: item.name,
        })
      }
      activeOpacity={0.86}
    >
      <View style={styles.cardHeader}>
        <View style={styles.supInfo}>
          <View style={styles.avatarCircle}>
            <FontAwesome5 name="user-tie" size={21} color={COLORS.primary} />
          </View>

          <View style={styles.supTextBox}>
            <Text style={styles.supName}>{item.name}</Text>
            <Text style={styles.supRole}>
              {item.email || item.phone || "Supervisor"}
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
            name={item.isSuspended ? "play-circle-filled" : "pause-circle-filled"}
            size={28}
            color={item.isSuspended ? COLORS.secondary : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Ionicons name="people" size={17} color={COLORS.secondary} />
          <Text style={styles.miniStatText}>{item.teamSize || 0} Agents</Text>
        </View>

        <View style={styles.miniStat}>
          <MaterialIcons name="storage" size={17} color={COLORS.secondary} />
          <Text style={styles.miniStatText}>
            {Number(item.teamPerformance || 0).toLocaleString()} GB
          </Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            item.phone
              ? Linking.openURL(`tel:${item.phone}`)
              : Alert.alert("No Phone", "No phone number available.")
          }
        >
          <MaterialIcons name="call" size={20} color={COLORS.secondary} />
          <Text style={styles.iconBtnText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => Alert.alert("Address", item.address || "No address")}
        >
          <MaterialIcons name="location-on" size={20} color={COLORS.secondary} />
          <Text style={styles.iconBtnText}>Address</Text>
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
          <MaterialIcons name="track-changes" size={20} color={COLORS.primary} />
          <Text style={[styles.iconBtnText, { color: COLORS.primary }]}>
            Target
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Leader Dashboard...</Text>
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
          <Text style={styles.headerTitle}>Leader Dashboard</Text>
          <Text style={styles.headerSubtitle}>Supervisor network control center</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredSupervisors}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={renderSupervisor}
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
                <MaterialIcons name="admin-panel-settings" size={34} color={COLORS.white} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Executive Network Overview</Text>
                <Text style={styles.heroText}>
                  Monitor supervisors, agents, sales volume, targets and network performance in real time.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshBtn} onPress={fetchDashboardData}>
                <Ionicons name="refresh" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.statGrid}>
              <StatBox
                label="Supervisors"
                value={stats.totalSupervisors || 0}
                icon="account-supervisor-outline"
                color={COLORS.primary}
              />

              <StatBox
                label="Total Agents"
                value={stats.totalAgents || 0}
                icon="account-group-outline"
                color={COLORS.secondary}
              />

              <StatBox
                label="Data Sold"
                value={`${Number(stats.overallDataSold || 0).toLocaleString()}GB`}
                icon="database-arrow-up-outline"
                color={COLORS.dark}
              />

              <StatBox
                label="Revenue"
                value={`₦${Number(stats.totalRevenue || 0).toLocaleString()}`}
                icon="cash-multiple"
                color="#7C3AED"
              />
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={COLORS.muted} />
              <TextInput
                placeholder="Search supervisor, email or phone..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Manage Supervisors</Text>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => safeNavigate("CreateSupervisor")}
              >
                <MaterialIcons name="person-add" size={20} color={COLORS.white} />
                <Text style={styles.addBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="groups" size={42} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No Supervisors Found</Text>
            <Text style={styles.emptyText}>
              Supervisors will appear here after your Bellaj API is connected.
            </Text>
          </View>
        }
        ListFooterComponent={
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadReport}>
            <MaterialIcons name="file-download" size={24} color={COLORS.white} />
            <Text style={styles.downloadBtnText}>GENERATE FULL REPORT</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const StatBox = ({ label, value, icon, color }) => (
  <View style={[styles.statBox, { borderLeftColor: color }]}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <MaterialIconsMapper name={icon} color={COLORS.white} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const MaterialIconsMapper = ({ name, color }) => {
  const mciIcons = [
    "account-supervisor-outline",
    "account-group-outline",
    "database-arrow-up-outline",
    "cash-multiple",
  ];

  if (mciIcons.includes(name)) {
    return <FontAwesome5 name="chart-line" size={18} color={color} />;
  }

  return <MaterialIcons name={name} size={18} color={color} />;
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
  listContent: {
    padding: 16,
    paddingBottom: 90,
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
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
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
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 5,
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
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  addBtnText: {
    color: COLORS.white,
    marginLeft: 5,
    fontWeight: "900",
    fontSize: 12,
  },
  supCard: {
    backgroundColor: COLORS.white,
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
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
    marginLeft: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
  },
  supName: {
    fontSize: 16,
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
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
    gap: 18,
  },
  miniStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  miniStatText: {
    fontSize: 13,
    color: "#475569",
    marginLeft: 5,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 7,
  },
  iconBtnText: {
    marginLeft: 5,
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "900",
  },
  downloadBtn: {
    backgroundColor: COLORS.secondary,
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  downloadBtnText: {
    color: COLORS.white,
    fontWeight: "900",
    marginLeft: 10,
  },
  emptyBox: {
    marginTop: 20,
    padding: 25,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 8,
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

export default LeaderDashboard;