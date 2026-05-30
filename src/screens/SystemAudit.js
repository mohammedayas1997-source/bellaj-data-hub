import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  stats: "",
  auditLogs: "",
};

const SystemAudit = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const fetchAuditData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (!API_ENDPOINTS.stats || !API_ENDPOINTS.auditLogs) {
        setLoading(false);
        return;
      }

      const [statsRes, logsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.stats, config),
        axios.get(API_ENDPOINTS.auditLogs, config),
      ]);

      setStats(statsRes?.data?.data);
      setAuditLogs(logsRes?.data?.data || []);
    } catch (err) {
      Alert.alert(
        "Bellaj Data Hub",
        "Unable to load administrative audit records.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuditData();
  };

  const LogItem = ({ item }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.staffName}>
          {item.staffId?.firstName} {item.staffId?.surname}
          <Text style={styles.staffRole}> ({item.staffId?.role})</Text>
        </Text>

        <Text style={styles.logTime}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>

      <Text style={styles.actionText}>{item.action}</Text>

      <Text style={styles.logDetail}>{item.details}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bellaj Audit Center</Text>

          <Text style={styles.subtitle}>
            Platform Governance, Security & Administrative Monitoring
          </Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsGrid}>
          <View style={styles.mainStat}>
            <Text style={styles.statLabel}>Total Revenue</Text>

            <Text style={styles.revenueText}>
              ₦{stats?.finance?.totalRevenue?.toLocaleString() || "0"}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.miniStat, styles.redCard]}>
              <Text style={styles.miniLabel}>Total Users</Text>

              <Text style={styles.miniValue}>
                {stats?.users?.totalUsers || 0}
              </Text>
            </View>

            <View style={[styles.miniStat, styles.greenCard]}>
              <Text style={styles.miniLabel}>Administrators</Text>

              <Text style={styles.miniValue}>
                {stats?.users?.totalAdmins || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Audit Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administrative Audit Logs</Text>

          {auditLogs.length === 0 ? (
            <Text style={styles.emptyText}>
              No recent administrative activity available.
            </Text>
          ) : (
            auditLogs.map((log) => <LogItem key={log._id} item={log} />)
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() =>
              Alert.alert(
                "Bellaj Data Hub",
                "Navigate to Global Transaction Ledger",
              )
            }
          >
            <Text style={styles.primaryActionText}>
              View Global Transaction Ledger
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() =>
              Alert.alert(
                "Bellaj Data Hub",
                "Navigate to Role & Permission Management",
              )
            }
          >
            <Text style={styles.secondaryActionText}>
              Manage Roles & Permissions
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },

  header: {
    padding: 25,
    backgroundColor: COLORS.dark,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.primary,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.white,
  },

  subtitle: {
    fontSize: 13,
    color: "#CBD5E1",
    marginTop: 5,
  },

  statsGrid: {
    padding: 20,
  },

  mainStat: {
    backgroundColor: COLORS.primary,
    padding: 22,
    borderRadius: 18,
    marginBottom: 15,
    alignItems: "center",
  },

  statLabel: {
    color: "#FFE4E4",
    fontSize: 14,
    fontWeight: "600",
  },

  revenueText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  miniStat: {
    width: "48%",
    padding: 16,
    borderRadius: 14,
  },

  redCard: {
    backgroundColor: COLORS.softRed,
  },

  greenCard: {
    backgroundColor: COLORS.softGreen,
  },

  miniLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: "700",
  },

  miniValue: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 4,
  },

  section: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 15,
  },

  logCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },

  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  staffName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.dark,
  },

  staffRole: {
    color: COLORS.secondary,
    fontSize: 12,
  },

  logTime: {
    fontSize: 11,
    color: "#94A3B8",
  },

  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.dark,
    marginTop: 6,
  },

  logDetail: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
    lineHeight: 18,
  },

  actionSection: {
    padding: 20,
  },

  primaryActionBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryActionText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },

  secondaryActionBtn: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    alignItems: "center",
  },

  secondaryActionText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    color: COLORS.muted,
    marginTop: 20,
  },
});

export default SystemAudit;
