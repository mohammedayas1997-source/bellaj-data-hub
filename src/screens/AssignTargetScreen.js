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

const AssignTargetScreen = ({ navigation }) => {
  const [targetData, setTargetData] = useState({
    supervisorName: "Sir Idris Bapetel", // Wannan zai iya zuwa daga dropdown a gaba
    agentGoal: "",
    dataGoal: "",
    month: "April 2026",
  });

  const handleAssign = () => {
    if (!targetData.agentGoal || !targetData.dataGoal) {
      return Alert.alert("Required", "Don Allah cika dukkan bayanan target.");
    }

    // A nan ne zamu kira API din Backend a gaba
    Alert.alert(
      "Target Set!",
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
          <Text style={styles.subtitle}>Assign goals to your supervisors</Text>
        </View>

        <View style={styles.formCard}>
          {/* Supervisor Selection (Static for now) */}
          <Text style={styles.label}>Selected Supervisor</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.readOnlyText}>{targetData.supervisorName}</Text>
          </View>

          {/* Agent Registration Target */}
          <Text style={styles.label}>New Agents Registration Goal</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              keyboardType="numeric"
              value={targetData.agentGoal}
              onChangeText={(text) =>
                setTargetData({ ...targetData, agentGoal: text })
              }
            />
            <Text style={styles.unitText}>Agents</Text>
          </View>

          {/* Data Sales Target */}
          <Text style={styles.label}>Data Sales Goal (GB)</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 100"
              keyboardType="numeric"
              value={targetData.dataGoal}
              onChangeText={(text) =>
                setTargetData({ ...targetData, dataGoal: text })
              }
            />
            <Text style={styles.unitText}>GB</Text>
          </View>

          {/* Target Period */}
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
  container: { flex: 1, backgroundColor: "#ffffff" },
  scrollContainer: { padding: 25, flexGrow: 1, justifyContent: "center" },
  header: { marginBottom: 30 },
  title: { fontSize: 26, fontWeight: "bold", color: "#1e3a8a" },
  subtitle: { fontSize: 15, color: "#64748b", marginTop: 5 },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 10,
  },
  readOnlyBox: {
    backgroundColor: "#f8fafc",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  readOnlyText: { color: "#1e3a8a", fontWeight: "bold", fontSize: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  unitText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  assignBtn: {
    backgroundColor: "#1e3a8a",
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  assignBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  cancelBtn: { marginTop: 20, alignItems: "center" },
  cancelBtnText: { color: "#ef4444", fontWeight: "600" },
});

export default AssignTargetScreen;
