import React, { useState } from "react";
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
} from "react-native";
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

const AssignTargetScreen = ({ navigation }) => {
  const [targetData, setTargetData] = useState({
    supervisorName: "Bellaj Supervisor",
    agentGoal: "",
    dataGoal: "",
    month: "April 2026",
  });

  const handleAssign = () => {
    if (!targetData.agentGoal || !targetData.dataGoal) {
      Alert.alert("Required", "Don Allah cika dukkan bayanan target.");
      return;
    }

    Alert.alert(
      "Bellaj Data Hub",
      `An bawa ${targetData.supervisorName} target din register agents ${targetData.agentGoal} da kuma sayar da ${targetData.dataGoal}GB a watan ${targetData.month}.`,
      [{ text: "OK", onPress: () => navigation.goBack() }],
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Monthly Target</Text>
          <Text style={styles.subtitle}>
            Assign goals to Bellaj supervisors
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Selected Supervisor</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.readOnlyText}>{targetData.supervisorName}</Text>
          </View>

          <Text style={styles.label}>New Agents Registration Goal</Text>
          <View style={styles.inputWrapper}>
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

          <Text style={styles.label}>Data Sales Goal (GB)</Text>
          <View style={styles.inputWrapper}>
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

          <Text style={styles.label}>Target Period</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.readOnlyText}>{targetData.month}</Text>
          </View>

          <TouchableOpacity style={styles.assignBtn} onPress={handleAssign}>
            <Text style={styles.assignBtnText}>ACTIVATE TARGET</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    padding: 25,
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.secondary,
    marginTop: 5,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.dark,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 10,
  },
  readOnlyBox: {
    backgroundColor: COLORS.softGreen,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  readOnlyText: {
    color: COLORS.secondary,
    fontWeight: "bold",
    fontSize: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  unitText: {
    color: COLORS.muted,
    fontWeight: "600",
    fontSize: 14,
  },
  assignBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  assignBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  cancelBtn: {
    marginTop: 20,
    alignItems: "center",
  },
  cancelBtnText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});

export default AssignTargetScreen;
