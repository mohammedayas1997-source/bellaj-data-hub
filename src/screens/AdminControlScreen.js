import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

const AdminControlScreen = ({ navigation }) => {
  const [search, setSearch] = useState("");

  const [supervisors] = useState([
    {
      id: "1",
      name: "Bellaj Supervisor",
      totalAgents: 15,
      performance: "85%",
      totalGB: "450GB",
    },
    {
      id: "2",
      name: "Abdulrahman Mohammed",
      totalAgents: 12,
      performance: "60%",
      totalGB: "210GB",
    },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bellaj Global Control</Text>

        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search Agent or Supervisor..."
            placeholderTextColor="#FCA5A5"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.nimcSection}>
          <Text style={styles.sectionTitle}>NIMC Service Monitor</Text>

          <View style={styles.nimcGrid}>
            <TouchableOpacity
              style={[styles.nimcCard, { borderLeftColor: COLORS.primary }]}
              onPress={() => navigation.navigate("NIMCRequests")}
            >
              <MaterialCommunityIcons
                name="file-document-edit-outline"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.nimcCardValue}>12</Text>
              <Text style={styles.nimcCardLabel}>Pending Forms</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.nimcCard, { borderLeftColor: COLORS.secondary }]}
              onPress={() => navigation.navigate("NIMCHistory")}
            >
              <MaterialCommunityIcons
                name="history"
                size={24}
                color={COLORS.secondary}
              />
              <Text style={styles.nimcCardValue}>145</Text>
              <Text style={styles.nimcCardLabel}>Total History</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.globalStatsCard}>
          <Text style={styles.cardLabel}>Company-Wide Sales (Monthly)</Text>
          <Text style={styles.globalGB}>1,240.50 GB</Text>

          <View style={styles.statRow}>
            <View>
              <Text style={styles.subStatLabel}>Active Agents</Text>
              <Text style={styles.subStatValue}>124</Text>
            </View>

            <View style={styles.vDivider} />

            <View>
              <Text style={styles.subStatLabel}>Target Met</Text>
              <Text style={styles.subStatValue}>72%</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Supervisors Performance</Text>

          <TouchableOpacity onPress={() => navigation.navigate("AssignTarget")}>
            <Text style={styles.actionLink}>Set Targets</Text>
          </TouchableOpacity>
        </View>

        {supervisors.map((sup) => (
          <TouchableOpacity key={sup.id} style={styles.supCard}>
            <View style={styles.supInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{sup.name[0]}</Text>
              </View>

              <View style={{ marginLeft: 15 }}>
                <Text style={styles.supName}>{sup.name}</Text>
                <Text style={styles.supSubText}>
                  {sup.totalAgents} Agents Managed
                </Text>
              </View>
            </View>

            <View style={styles.supStats}>
              <View style={styles.perfBadge}>
                <Text style={styles.perfText}>{sup.performance}</Text>
              </View>

              <Text style={styles.supGB}>{sup.totalGB}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={() => navigation.navigate("CreateSupervisor")}
          >
            <Text style={styles.mainActionText}>Add New Supervisor</Text>
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
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 15,
  },
  searchBar: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
    justifyContent: "center",
  },
  searchInput: {
    color: COLORS.white,
  },
  nimcSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  nimcGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  nimcCard: {
    backgroundColor: COLORS.white,
    width: "48%",
    padding: 15,
    borderRadius: 15,
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.08,
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nimcCardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.dark,
    marginTop: 5,
  },
  nimcCardLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  globalStatsCard: {
    margin: 20,
    backgroundColor: COLORS.light,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLabel: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  globalGB: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginVertical: 10,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 15,
  },
  subStatLabel: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  subStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.secondary,
  },
  vDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  actionLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  supCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 18,
  },
  supName: {
    fontWeight: "bold",
    color: COLORS.dark,
    fontSize: 15,
  },
  supSubText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  supStats: {
    alignItems: "flex-end",
  },
  perfBadge: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 5,
  },
  perfText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: "bold",
  },
  supGB: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  actionContainer: {
    padding: 20,
  },
  mainActionBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 15,
    alignItems: "center",
  },
  mainActionText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default AdminControlScreen;
