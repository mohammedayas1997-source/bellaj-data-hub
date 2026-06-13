import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  danger: "#DC2626",
};

const API_ENDPOINTS = {
  myAgents: `${BASE_URL}/supervisor/my-agents`,
  supervisorStats: `${BASE_URL}/supervisor/agent-stats`,
  agentHistory: `${BASE_URL}/supervisor/agent-history`,
};

const AgentManagementScreen = ({ navigation }) => {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [targetStats, setTargetStats] = useState({
    totalRegistered: 0,
    totalDataSold: 0,
    monthlyGoal: 10,
    dataGoal: 100,
    totalSalesValue: 0,
    activeAgents: 0,
  });

  useEffect(() => {
    fetchAgentStats();
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
    if (Array.isArray(payload?.agents)) return payload.agents;
    if (Array.isArray(payload?.data?.agents)) return payload.data.agents;
    return [];
  };

  const normalizeAgent = (item, index) => ({
    id: item?._id || item?.id || `${index}`,
    fullName:
      item?.fullName ||
      item?.name ||
      `${item?.firstName || ""} ${item?.surname || ""}`.trim() ||
      "Agent",
    email: item?.email || "",
    phone: item?.phone || "",
    todaySales: Number(item?.todaySales || item?.todayGB || item?.dailyGB || 0),
    totalGB: Number(item?.totalGB || item?.monthlyGB || item?.volumeGB || 0),
    salesValue: Number(item?.salesValue || item?.totalSalesValue || 0),
    walletBalance: Number(item?.walletBalance || item?.balance || 0),
    status: item?.status || item?.accountStatus || "active",
    raw: item,
  });

  const fetchAgentStats = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      const results = await Promise.allSettled([
        axios.get(API_ENDPOINTS.myAgents, { headers }),
        axios.get(API_ENDPOINTS.supervisorStats, { headers }),
      ]);

      const agentsPayload =
        results[0].status === "fulfilled" ? results[0].value.data : {};
      const statsPayload =
        results[1].status === "fulfilled" ? results[1].value.data : {};

      const normalizedAgents = getArray(agentsPayload, "agents").map(
        normalizeAgent
      );

      const apiStats = statsPayload?.data || statsPayload?.stats || statsPayload;

      const totalRegistered =
        apiStats?.totalRegistered ||
        apiStats?.totalAgents ||
        normalizedAgents.length ||
        0;

      const totalDataSold =
        apiStats?.totalDataSold ||
        apiStats?.totalGB ||
        normalizedAgents.reduce((sum, agent) => sum + Number(agent.totalGB || 0), 0);

      const totalSalesValue =
        apiStats?.totalSalesValue ||
        apiStats?.revenue ||
        normalizedAgents.reduce(
          (sum, agent) => sum + Number(agent.salesValue || 0),
          0
        );

      setAgents(normalizedAgents);

      setTargetStats({
        totalRegistered,
        totalDataSold,
        monthlyGoal: apiStats?.monthlyGoal || apiStats?.agentGoal || 10,
        dataGoal: apiStats?.dataGoal || apiStats?.monthlyDataGoal || 100,
        totalSalesValue,
        activeAgents:
          apiStats?.activeAgents ||
          normalizedAgents.filter(
            (agent) => agent.status?.toLowerCase() !== "blocked"
          ).length,
      });
    } catch (error) {
      Alert.alert("Connection Error", "Failed to load live agent data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentStats();
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
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("SupervisorDashboard");
  };

  const safeNavigate = (screenName, params = {}) => {
    try {
      navigation.navigate(screenName, {
        fromAgentManagement: true,
        backScreen: "ManageAgents",
        ...params,
      });
    } catch (error) {
      Alert.alert("Navigation Error", `${screenName} is not registered.`);
    }
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

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return agents;

    return agents.filter((agent) => {
      return (
        agent.fullName?.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query) ||
        agent.phone?.toLowerCase().includes(query)
      );
    });
  }, [search, agents]);

  const registeredProgress =
    targetStats.monthlyGoal > 0
      ? Math.min(targetStats.totalRegistered / targetStats.monthlyGoal, 1)
      : 0;

  const dataProgress =
    targetStats.dataGoal > 0
      ? Math.min(targetStats.totalDataSold / targetStats.dataGoal, 1)
      : 0;

  const renderProgressBar = (progress, color) => (
    <View style={styles.progressTrack}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${progress * 100}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );

  const renderAgent = ({ item }) => (
    <TouchableOpacity
      style={styles.agentCard}
      activeOpacity={0.86}
      onPress={() =>
        safeNavigate("SalesHistory", {
          agentId: item.id,
          agentName: item.fullName,
        })
      }
    >
      <View style={styles.agentLeft}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(item?.fullName || "A").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.agentInfoBox}>
          <Text style={styles.agentName}>{item.fullName}</Text>
          {!!item.email && <Text style={styles.agentMeta}>{item.email}</Text>}
          <Text style={styles.agentInfo}>Today: {item.todaySales}GB</Text>
        </View>
      </View>

      <View style={styles.agentRight}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status?.toLowerCase() === "blocked"
                  ? COLORS.softRed
                  : COLORS.softGreen,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status?.toLowerCase() === "blocked"
                    ? COLORS.primary
                    : COLORS.secondary,
              },
            ]}
          >
            {item.status}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() =>
            safeNavigate("SalesHistory", {
              agentId: item.id,
              agentName: item.fullName,
            })
          }
        >
          <Text style={styles.viewText}>View</Text>
          <Ionicons name="chevron-forward" size={15} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Bellaj agents...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={23} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
            <Ionicons name="menu" size={25} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.header}>Agent Management</Text>
            <Text style={styles.subHeader}>Supervisor agent overview</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#FCA5A5" />
          <TextInput
            placeholder="Search agent, email or phone..."
            placeholderTextColor="#FCA5A5"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
        </View>
      </View>

      <FlatList
        data={filteredAgents}
        keyExtractor={(item, index) => item?.id || index.toString()}
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
                <MaterialCommunityIcons
                  name="account-tie-outline"
                  size={32}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Monthly Performance</Text>
                <Text style={styles.heroText}>
                  Track agent registration, data sales, active agents and supervisor
                  progress in real time.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshBtn} onPress={fetchAgentStats}>
                <Ionicons name="refresh" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
                <View style={styles.statIconTop}>
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={22}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.statLabel}>New Agents</Text>
                <Text style={styles.statValue}>
                  {targetStats.totalRegistered}/{targetStats.monthlyGoal}
                </Text>
                {renderProgressBar(registeredProgress, COLORS.primary)}
              </View>

              <View
                style={[styles.statCard, { borderLeftColor: COLORS.secondary }]}
              >
                <View style={styles.statIconTop}>
                  <MaterialCommunityIcons
                    name="database-arrow-up-outline"
                    size={22}
                    color={COLORS.secondary}
                  />
                </View>
                <Text style={styles.statLabel}>Data Sold</Text>
                <Text style={styles.statValue}>
                  {Number(targetStats.totalDataSold || 0).toLocaleString()}GB /{" "}
                  {targetStats.dataGoal}GB
                </Text>
                {renderProgressBar(dataProgress, COLORS.secondary)}
              </View>
            </View>

            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <MaterialCommunityIcons
                  name="account-check-outline"
                  size={24}
                  color={COLORS.secondary}
                />
                <Text style={styles.overviewValue}>{targetStats.activeAgents}</Text>
                <Text style={styles.overviewLabel}>Active Agents</Text>
              </View>

              <View style={styles.overviewCard}>
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={24}
                  color={COLORS.primary}
                />
                <Text style={styles.overviewValue}>
                  ₦{Number(targetStats.totalSalesValue || 0).toLocaleString()}
                </Text>
                <Text style={styles.overviewLabel}>Sales Value</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Agent List & Daily Sales</Text>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => safeNavigate("CreateSupervisor")}
              >
                <MaterialCommunityIcons
                  name="account-plus-outline"
                  size={16}
                  color={COLORS.white}
                />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={42}
              color={COLORS.muted}
            />
            <Text style={styles.emptyTitle}>No Agents Found</Text>
            <Text style={styles.emptyText}>
              Your Bellaj agents will appear here once the live API returns data.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
    fontWeight: "700",
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 18,
    paddingHorizontal: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
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
  headerTitleBox: {
    flex: 1,
  },
  subHeader: {
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
  searchBar: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    color: COLORS.white,
    flex: 1,
    marginLeft: 8,
    fontWeight: "600",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
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
    paddingRight: 8,
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 10,
  },
  statCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 18,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statIconTop: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 9,
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 5,
    marginBottom: 10,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 20,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 20,
  },
  overviewGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  overviewValue: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 7,
  },
  overviewLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
  },
  addBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },
  agentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  agentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 17,
  },
  agentInfoBox: {
    flex: 1,
  },
  agentName: {
    fontWeight: "900",
    color: COLORS.dark,
    fontSize: 15,
  },
  agentMeta: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  agentInfo: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: "700",
  },
  agentRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 7,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  viewBtn: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    padding: 25,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 8,
    marginBottom: 6,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "600",
  },
});

export default AgentManagementScreen;