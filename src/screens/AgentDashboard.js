import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useColorScheme,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
const AgentDashboard = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [performance, setPerformance] = useState({
    totalGB: 0,
    totalSalesValue: 0,
    commissionsEarned: 0,
    bonusEarned: 0,
    monthlyTargetSales: 0,
  });

  // Logout Function
  const handleLogout = async () => {
    await AsyncStorage.removeItem("userToken");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };
  const [supervisor, setSupervisor] = useState(null);

  const fetchAgentData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // AN GYARA NAN: An sanya asalin URL dinka na Render maimakon ayax-api.com
      const BASE_URL =
        "https://ayax-data-xpress-server.onrender.com/api/v1/agent";

      const [perfRes, supRes] = await Promise.all([
        axios
          .get(`${BASE_URL}/performance`, config)
          .catch((e) => ({ data: { data: null } })),
        axios
          .get(`${BASE_URL}/my-supervisor`, config)
          .catch((e) => ({ data: { data: null } })),
      ]);

      // Idan server bata gama hada endpoints din ba, sanya tsoffin bayanan nan don kada Dashboard din ya karye
      if (perfRes.data?.data) {
        setPerformance(perfRes.data.data);
      } else {
        setPerformance({
          totalGB: 0,
          totalSalesValue: 0,
          commissionsEarned: 0,
          bonusEarned: 0,
          monthlyTargetSales: 100000, // Misali na Target
        });
      }

      if (supRes.data?.data) {
        setSupervisor(supRes.data.data);
      } else {
        setSupervisor("No Supervisor Assigned Yet");
      }
    } catch (err) {
      console.log("Dashboard Metrics Fetch Error:", err);
      // Mun cire murnikin Alert din da ke razana Agent cewa bai yi login ba
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchAgentData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgentData();
  };

  // Calculations for Target Progression
  const currentSales = performance.totalSalesValue || 0;
  const targetSales = performance.monthlyTargetSales || 0;
  const remainingToTarget =
    targetSales - currentSales > 0 ? targetSales - currentSales : 0;
  const achievementPercentage =
    targetSales > 0
      ? Math.min(Math.round((currentSales / targetSales) * 100), 100)
      : 0;

  const StatCard = ({ title, value, unit, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>
        {value} <Text style={styles.statUnit}>{unit}</Text>
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Agent Portal</Text>
          <Text style={styles.subText}>Track your sales</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MENU MODAL */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? "#1e293b" : "#fff" },
            ]}
          >
            <TouchableOpacity
              onPress={() => setMenuVisible(false)}
              style={styles.closeBtn}
            >
              <Ionicons
                name="close"
                size={24}
                color={isDarkMode ? "#fff" : "#000"}
              />
            </TouchableOpacity>

            <Text
              style={[
                styles.menuTitle,
                { color: isDarkMode ? "#fff" : "#000" },
              ]}
            >
              Menu
            </Text>

            {/* My Profile */}
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Profile");
              }}
            >
              <Text
                style={[
                  styles.menuItem,
                  { color: isDarkMode ? "#e2e8f0" : "#334155" },
                ]}
              >
                👤 My Profile
              </Text>
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Settings");
              }}
            >
              <Text
                style={[
                  styles.menuItem,
                  { color: isDarkMode ? "#e2e8f0" : "#334155" },
                ]}
              >
                ⚙️ Settings
              </Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout} style={{ marginTop: 20 }}>
              <Text
                style={[styles.menuItem, { color: "red", fontWeight: "bold" }]}
              >
                🚪 Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* CORE PERFORMANCE METRICS */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Monthly Volume"
          value={performance.totalGB || 0}
          unit="GB"
          color="#2563eb"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₦${currentSales}`}
          unit=""
          color="#059669"
        />
      </View>

      {/* COMMISSIONS & BONUSES SECTION */}
      <View style={styles.statsGridAlt}>
        <StatCard
          title="Commissions Earned"
          value={`₦${performance.commissionsEarned || 0}`}
          unit=""
          color="#d4af37"
        />
        <StatCard
          title="Bonus Earned"
          value={`₦${performance.bonusEarned || 0}`}
          unit=""
          color="#dc2626"
        />
      </View>

      {/* TARGET & PROGRESSION TRACKING */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Target & Performance Tracking</Text>
        <View style={styles.targetCard}>
          <View style={styles.targetRow}>
            <View>
              <Text style={styles.targetLabel}>Monthly Target</Text>
              <Text style={styles.targetValue}>₦{targetSales}</Text>
            </View>
            <View style={styles.rightAlign}>
              <Text style={styles.targetLabel}>Achievement</Text>
              <Text style={styles.percentageText}>
                {achievementPercentage}%
              </Text>
            </View>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${achievementPercentage}%` },
              ]}
            />
          </View>

          <View style={styles.targetRowAlt}>
            <Text style={styles.progressSubText}>
              Current Progress:{" "}
              <Text style={styles.boldText}>₦{currentSales}</Text>
            </Text>
            <Text style={styles.remainingText}>
              Remaining:{" "}
              <Text style={styles.boldTextRed}>₦{remainingToTarget}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* SUPERVISOR INFO SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assigned Supervisor</Text>
        <View style={styles.infoBox}>
          {typeof supervisor === "string" ? (
            <Text style={styles.infoText}>{supervisor}</Text>
          ) : (
            <View>
              <Text style={styles.supName}>{supervisor?.name || "N/A"}</Text>
              <Text style={styles.supPhone}>
                {supervisor?.phone || "No Contact"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("NewSale")}
        >
          <Text style={styles.actionBtnText}>Process New Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("SalesHistory")}
        >
          <Text style={styles.actionBtnText}>View Sales History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.actionBtnText}>Account Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 25,
    backgroundColor: "#1e3a8a",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcome: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subText: { color: "#cbd5e1", marginTop: 5 },
  statsGrid: {
    paddingHorizontal: 20,
    paddingTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statsGridAlt: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 5,
  },
  statUnit: { fontSize: 12, color: "#94a3b8" },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 10,
  },
  targetCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  targetRowAlt: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  targetLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  targetValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e3a8a",
    marginTop: 2,
  },
  rightAlign: { alignItems: "flex-end" },
  percentageText: { fontSize: 20, fontWeight: "800", color: "#059669" },
  progressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    marginTop: 15,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#059669",
    borderRadius: 5,
  },
  progressSubText: { fontSize: 12, color: "#475569" },
  remainingText: { fontSize: 12, color: "#475569" },
  boldText: { fontWeight: "700", color: "#0f172a" },
  boldTextRed: { fontWeight: "700", color: "#dc2626" },
  infoBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoText: { color: "#64748b" },
  supName: { fontSize: 16, fontWeight: "bold", color: "#1e3a8a" },
  supPhone: { fontSize: 14, color: "#475569", marginTop: 2 },
  actionSection: { padding: 20 },
  actionBtn: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  actionBtnText: { fontSize: 15, color: "#1e3a8a", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 30,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "40%",
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#64748b",
  },
  menuItem: { fontSize: 18, marginVertical: 10, color: "#334155" },
  closeBtn: { alignSelf: "flex-end" },
});

export default AgentDashboard;
