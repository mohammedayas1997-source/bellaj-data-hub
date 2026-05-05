import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const NIMCScreen = ({ navigation }) => {
  const [view, setView] = useState("main"); // 'main', 'mod_list', 'form', 'result'
  const [selectedTask, setSelectedTask] = useState(null);
  const [prices, setPrices] = useState({});
  const [formData, setFormData] = useState({ nin: "", pin: "" });
  const [lastResult, setLastResult] = useState(null);

  // PDF Generation Logic
  const generatePDF = async (data) => {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; color: #0f172a;">
          <div style="text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 15px;">
            <h1 style="margin: 0;">AYAX DIGITAL SOLUTIONS</h1>
            <p style="font-size: 18px; margin: 5px 0;">Official NIMC Service Receipt</p>
          </div>
          <div style="margin-top: 30px; line-height: 1.6;">
            <p><strong>Service Type:</strong> ${selectedTask ? selectedTask.title : "NIN Verification"}</p>
            <p><strong>NIN Number:</strong> ${formData.nin || "Verified via Widget"}</p>
            <p><strong>Reference ID:</strong> REF-${Date.now()}</p>
            <p><strong>Status:</strong> COMPLETED / PENDING APPROVAL</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div style="margin-top: 40px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0;">Transaction Summary</h3>
            <p>Amount Paid: ₦${prices[selectedTask?.id] || "0"}</p>
            <p>Merchant: Ayax Digital Solutions</p>
          </div>
          <div style="margin-top: 60px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p>This document serves as an official proof of transaction for NIMC services processed via the Ayax Portal.</p>
            <p>© 2026 Ayax Digital Solutions. All Rights Reserved.</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF slip.");
    }
  };

  // 1. NIN Verification via Dojah
  const handleVerification = async () => {
    Alert.alert("NIN Verification", "Initiate NIN verification via Dojah?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Proceed",
        onPress: () => {
          // Logic for Dojah Widget Callback
          const mockResponse = { code: "00", message: "Success" };
          if (mockResponse.code === "00") {
            setLastResult(mockResponse);
            setView("result");
          }
        },
      },
    ]);
  };

  // 2. Submit Modification Form
  const handleSubmitForm = async () => {
    try {
      const res = await axios.post("/api/v1/nimc/submit-request", {
        type: selectedTask.id,
        nin: formData.nin,
        pin: formData.pin,
        amount: prices[selectedTask.id],
      });
      if (res.data.success) {
        setView("result");
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to submit");
    }
  };

  // --- RENDERING ---

  if (view === "main") {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>NIMC Services</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.card} onPress={handleVerification}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name="shield-check"
                size={40}
                color="#fff"
              />
            </View>
            <Text style={styles.cardText}>NIN Verification (API)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setView("mod_list")}
          >
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name="folder-edit"
                size={40}
                color="#fff"
              />
            </View>
            <Text style={styles.cardText}>NIMC Modifications</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (view === "mod_list") {
    const modServices = [
      { id: "validation", title: "NIN Validation", icon: "check-all" },
      { id: "modification", title: "Data Modification", icon: "pencil" },
      { id: "ipe", title: "IPE Clearance", icon: "shield-lock" },
    ];
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          onPress={() => setView("main")}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
          <Text style={{ marginLeft: 5, color: "#0f172a" }}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>Select Modification Type</Text>
        <View style={styles.grid}>
          {modServices.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.subCard}
              onPress={() => {
                setSelectedTask(s);
                setView("form");
              }}
            >
              <MaterialCommunityIcons name={s.icon} size={30} color="#0f172a" />
              <Text style={styles.subText}>{s.title}</Text>
              <Text style={styles.priceTag}>₦{prices[s.id] || "0"}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (view === "form") {
    return (
      <View style={styles.container}>
        <Text style={styles.formTitle}>{selectedTask.title}</Text>
        <Text style={styles.costInfo}>
          Cost: ₦{prices[selectedTask.id] || "0"}
        </Text>
        <TextInput
          placeholder="Enter NIN"
          style={styles.input}
          keyboardType="numeric"
          onChangeText={(v) => setFormData({ ...formData, nin: v })}
        />
        <TextInput
          placeholder="App Transaction PIN"
          style={styles.input}
          secureTextEntry
          keyboardType="numeric"
          onChangeText={(v) => setFormData({ ...formData, pin: v })}
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitForm}>
          <Text style={styles.submitText}>Submit & Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => navigation.navigate("UserNIMCHistory")}
        >
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color="#38bdf8"
          />
          <Text style={{ color: "#38bdf8", marginLeft: 5, fontWeight: "bold" }}>
            Track My Applications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setView("mod_list")}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (view === "result") {
    return (
      <View style={styles.container}>
        <View style={styles.resultBox}>
          <MaterialCommunityIcons
            name="check-circle"
            size={80}
            color="#16a34a"
          />
          <Text style={styles.resultHeading}>Success!</Text>
          <Text style={styles.resultSub}>Your request has been processed.</Text>

          <TouchableOpacity style={styles.downloadBtn} onPress={generatePDF}>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={24}
              color="#fff"
            />
            <Text style={styles.downloadText}>Download PDF Slip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setView("main")}
          >
            <Text style={styles.closeBtnText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8fafc" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0f172a",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#0f172a",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  iconBox: { marginBottom: 10 },
  cardText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  subCard: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  subText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: "500" },
  priceTag: { fontWeight: "bold", color: "#16a34a" },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  formTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  costInfo: { fontSize: 16, color: "#ef4444", marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  submitBtn: {
    backgroundColor: "#0f172a",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  cancelText: { textAlign: "center", marginTop: 20, color: "#64748b" },
  resultBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultHeading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 20,
  },
  resultSub: { fontSize: 16, color: "#64748b", marginBottom: 30 },
  downloadBtn: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    padding: 18,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  downloadText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 16,
  },
  closeBtn: { marginTop: 20 },
  closeBtnText: { color: "#0f172a", fontWeight: "bold" },
});

export default NIMCScreen;
