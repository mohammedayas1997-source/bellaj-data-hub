import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  success: "#16A34A",
  warning: "#F59E0B",
};

const API_ENDPOINTS = {
  supervisorProfile: `${BASE_URL}/supervisor/profile`,
  supervisorDashboard: `${BASE_URL}/supervisor/dashboard`,
};

const DEFAULT_DATA = {
  name: "Bellaj Supervisor",
  referralId: "BD0000",
  targets: {
    agentGoal: 0,
    registeredAgents: 0,
    dataGoal: 0,
    dataSold: 0,
  },
  agents: [],
};

const SupervisorDashboard = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supervisorData, setSupervisorData] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetchSupervisorContext();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const normalizeDashboard = (payload) => {
    const data = payload?.data?.data || payload?.data || payload || {};

    return {
      name:
        data?.name ||
        data?.fullName ||
        data?.supervisor?.name ||
        data?.supervisor?.fullName ||
        "Bellaj Supervisor",

      referralId:
        data?.referralId ||
        data?.referralCode ||
        data?.supervisor?.referralId ||
        data?.supervisor?.referralCode ||
        "BD0000",

      targets: {
        agentGoal:
          data?.targets?.agentGoal ||
          data?.target?.agentGoal ||
          data?.monthlyGoal ||
          0,
        registeredAgents:
          data?.targets?.registeredAgents ||
          data?.target?.registeredAgents ||
          data?.totalRegistered ||
          data?.agents?.length ||
          0,
        dataGoal:
          data?.targets?.dataGoal ||
          data?.target?.dataGoal ||
          data?.dataGoal ||
          0,
        dataSold:
          data?.targets?.dataSold ||
          data?.target?.dataSold ||
          data?.totalDataSold ||
          data?.totalGB ||
          0,
      },

      agents:
        data?.agents ||
        data?.myAgents ||
        data?.data?.agents ||
        [],
    };
  };

  const fetchSupervisorContext = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      if (!headers) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const dashboardReq = axios.get(API_ENDPOINTS.supervisorDashboard, {
        headers,
        timeout: 25000,
      });

      const profileReq = axios.get(API_ENDPOINTS.supervisorProfile, {
        headers,
        timeout: 25000,
      });

      const [dashboardRes, profileRes] = await Promise.allSettled([
        dashboardReq,
        profileReq,
      ]);

      if (dashboardRes.status === "fulfilled") {
        setSupervisorData(normalizeDashboard(dashboardRes.value.data));
        return;
      }

      if (profileRes.status === "fulfilled") {
        setSupervisorData(normalizeDashboard(profileRes.value.data));
        return;
      }

      setSupervisorData(DEFAULT_DATA);
    } catch (error) {
      Alert.alert(
        "Connection Error",
        error?.response?.data?.message ||
          "Unable to load supervisor dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSupervisorContext();
  };

  const openMenu = () => {
  try {
    navigation.dispatch(DrawerActions.openDrawer());
  } catch {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation.navigate("Main", {
      screen: "SuperAdminDashboard",
    });
  }
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

  const copyReferralId = async () => {
    await Clipboard.setStringAsync(supervisorData.referralId || "BD0000");
    Alert.alert(
      "Copied",
      `Referral ID ${supervisorData.referralId || "BD0000"} copied.`
    );
  };

  const agentProgress = useMemo(() => {
    const goal = Number(supervisorData?.targets?.agentGoal || 0);
    const done = Number(supervisorData?.targets?.registeredAgents || 0);

    if (!goal) return 0;
    return Math.min((done / goal) * 100, 100);
  }, [supervisorData]);

  const dataProgress = useMemo(() => {
    const goal = Number(supervisorData?.targets?.dataGoal || 0);
    const done = Number(supervisorData?.targets?.dataSold || 0);

    if (!goal) return 0;
    return Math.min((done / goal) * 100, 100);
  }, [supervisorData]);

  const overallProgress = Math.round((agentProgress + dataProgress) / 2);

  const agents = Array.isArray(supervisorData?.agents)
    ? supervisorData.agents
    : [];

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Supervisor Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Supervisor Panel</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {supervisorData.name}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
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
            <MaterialCommunityIcons
              name="account-supervisor-outline"
              size={34}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Team Control Center</Text>
            <Text style={styles.heroText}>
              Monitor agents, monthly targets, referral activity and daily
              performance.
            </Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={fetchSupervisorContext}>
            <Ionicons name="refresh" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.idCard}>
          <View style={styles.idInfo}>
            <Text style={styles.idLabel}>OFFICIAL REFERRAL ID</Text>
            <Text style={styles.idValue}>{supervisorData.referralId}</Text>
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={copyReferralId}>
            <Ionicons name="copy-outline" size={20} color={COLORS.white} />
            <Text style={styles.copyText}>COPY</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <View>
              <Text style={styles.cardLabel}>Monthly Target Progress</Text>
              <Text style={styles.progressPercent}>{overallProgress}%</Text>
            </View>

            <View style={styles.progressCircle}>
              <Text style={styles.progressCircleText}>{overallProgress}%</Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                {supervisorData.targets.registeredAgents}/
                {supervisorData.targets.agentGoal}
              </Text>
              <Text style={styles.statSub}>New Agents</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statBox}>
              <Text style={styles.statNum}>
                {supervisorData.targets.dataSold}/
                {supervisorData.targets.dataGoal}
              </Text>
              <Text style={styles.statSub}>GB Sold</Text>
            </View>
          </View>

          <Text style={styles.progressLabel}>Agent Target</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${agentProgress}%` },
              ]}
            />
          </View>

          <Text style={styles.progressLabel}>Data Sales Target</Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFillGreen,
                { width: `${dataProgress}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Agents"
            value={agents.length}
            icon="people-outline"
            color={COLORS.primary}
          />

          <StatCard
            label="Active"
            value={
              agents.filter(
                (agent) =>
                  String(agent?.status || "").toLowerCase() === "active"
              ).length
            }
            icon="checkmark-circle-outline"
            color={COLORS.secondary}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Agent Performance</Text>

          <TouchableOpacity
  onPress={() =>
    navigation.navigate("ManageAgents", {
      backScreen: "SuperAdminDashboard",
    })
  }
>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {agents.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={48}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No Agents Yet</Text>
            <Text style={styles.emptyText}>
              Agents assigned to you will appear here.
            </Text>
          </View>
        ) : (
          agents.map((agent, index) => {
            const status = agent?.status || "Active";
            const isActive = String(status).toLowerCase() === "active";

            return (
              <View key={agent?._id || agent?.id || index} style={styles.agentRow}>
                <View style={styles.agentLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isActive
                          ? COLORS.secondary
                          : COLORS.primary,
                      },
                    ]}
                  />

                  <View>
                    <Text style={styles.agentName}>
                      {agent?.name ||
                        agent?.fullName ||
                        `${agent?.firstName || ""} ${agent?.surname || ""}`.trim() ||
                        "Agent"}
                    </Text>
                    <Text style={styles.agentStatus}>{status}</Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.gbText}>
                    {agent?.todayGB ||
                      agent?.todaySales ||
                      agent?.totalGB ||
                      "0GB"}
                  </Text>
                  <Text style={styles.timeText}>Data Sold</Text>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.addAgentBtn}
          onPress={() =>
  navigation.navigate("Signup", {
    backScreen: "SuperAdminDashboard",
  })
}
        >
          <Ionicons
            name="person-add"
            size={20}
            color={COLORS.primary}
            style={{ marginRight: 10 }}
          />

          <Text style={styles.addAgentText}>Register New Agent</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <View style={[styles.smallStatCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.smallStatValue}>{value}</Text>
    <Text style={styles.smallStatLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
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
  idCard: {
    backgroundColor: COLORS.dark,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  idInfo: { flex: 1 },
  idLabel: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  idValue: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "900",
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
  },
  copyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 5,
  },
  targetCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  targetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  cardLabel: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  progressPercent: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  progressCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  progressCircleText: {
    color: COLORS.white,
    fontWeight: "900",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 18,
  },
  statBox: { alignItems: "center", flex: 1 },
  statNum: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "900",
  },
  statSub: {
    color: "#FFE4E4",
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 42,
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  progressLabel: {
    color: "#FFE4E4",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 8,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
  },
  progressBarFillGreen: {
    height: 10,
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  smallStatCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  smallStatValue: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  smallStatLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
    textTransform: "uppercase",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.dark,
  },
  viewAll: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 13,
  },
  agentRow: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  agentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 12,
  },
  agentName: {
    fontWeight: "900",
    color: COLORS.dark,
    fontSize: 15,
  },
  agentStatus: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  gbText: {
    fontWeight: "900",
    color: COLORS.secondary,
    fontSize: 16,
  },
  timeText: {
    color: "#94A3B8",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "900",
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },
  addAgentBtn: {
    backgroundColor: COLORS.softRed,
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginTop: 10,
  },
  addAgentText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 15,
  },
});

export default SupervisorDashboard;