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

const BVNScreen = ({ navigation }) => {
  const [view, setView] = useState("list"); // 'list', 'form', or 'result'
  const [selectedTask, setSelectedTask] = useState(null);
  const [prices, setPrices] = useState({});
  const [formData, setFormData] = useState({ bvn: "", pin: "" });
  const [verificationResult, setVerificationResult] = useState(null);

  const bvnServices = [
    { id: "bvn_full", title: "BVN Verification (Full)", icon: "bank-check" },
    { id: "bvn_basic", title: "BVN Basic", icon: "bank-outline" },
    {
      id: "bvn_face",
      title: "BVN With Face Verification",
      icon: "face-recognition",
    },
    { id: "bvn_phone", title: "BVN with Phone Advance", icon: "phone-check" },
  ];

  // Generate and Download PDF Slip
  const downloadPdfSlip = async (data) => {
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
          <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px;">
            <h1 style="color: #0f172a; margin: 0;">AYAX DIGITAL SOLUTIONS</h1>
            <p style="margin: 5px 0;">Transaction Receipt - BVN Verification</p>
          </div>
          <div style="margin-top: 30px;">
            <p><strong>Service Type:</strong> ${selectedTask.title}</p>
            <p><strong>Reference:</strong> ${data.reference || "N/A"}</p>
            <p><strong>Status:</strong> SUCCESSFUL</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f8fafc;">
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Field</th>
              <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left;">Details</th>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Full Name</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${data.firstName || ""} ${data.lastName || ""}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">BVN Number</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${formData.bvn}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Phone Number</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${data.phoneNumber || "N/A"}</td>
            </tr>
          </table>
          <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #64748b;">
            <p>This is a computer-generated slip and requires no signature.</p>
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
      Alert.alert("Error", "Could not generate PDF slip");
    }
  };

  const handleSubmitVerification = async () => {
    try {
      const res = await axios.post("/api/v1/verification/bvn", {
        type: selectedTask.id,
        bvn: formData.bvn,
        pin: formData.pin,
        amount: prices[selectedTask.id],
      });

      if (res.data.success) {
        setVerificationResult(res.data.data);
        setView("result");
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Verification failed",
      );
    }
  };

  if (view === "list") {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.header}>BVN Verification Services</Text>
        <View style={styles.grid}>
          {bvnServices.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.subCard}
              onPress={() => {
                setSelectedTask(s);
                setView("form");
              }}
            >
              <MaterialCommunityIcons name={s.icon} size={30} color="#0f172a" />
              <View style={styles.textContainer}>
                <Text style={styles.subText}>{s.title}</Text>
                <Text style={styles.priceTag}>₦{prices[s.id] || "0"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (view === "form") {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => setView("list")}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
          <Text style={styles.backText}>Back to List</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>{selectedTask.title}</Text>
        <Text style={styles.costInfo}>
          Service Fee: ₦{prices[selectedTask.id] || "0"}
        </Text>
        <TextInput
          placeholder="Enter BVN Number"
          style={styles.input}
          keyboardType="numeric"
          onChangeText={(v) => setFormData({ ...formData, bvn: v })}
        />
        <TextInput
          placeholder="Transaction PIN"
          style={styles.input}
          secureTextEntry
          keyboardType="numeric"
          onChangeText={(v) => setFormData({ ...formData, pin: v })}
        />
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmitVerification}
        >
          <Text style={styles.submitText}>Verify Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (view === "result") {
    return (
      <View style={styles.container}>
        <View style={styles.resultCard}>
          <MaterialCommunityIcons
            name="check-circle"
            size={60}
            color="#16a34a"
          />
          <Text style={styles.resultTitle}>Verification Successful</Text>
          <Text style={styles.resultName}>
            {verificationResult?.firstName} {verificationResult?.lastName}
          </Text>
          <Text style={styles.resultDetail}>BVN: {formData.bvn}</Text>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() => downloadPdfSlip(verificationResult)}
          >
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={24}
              color="#fff"
            />
            <Text style={styles.downloadText}>Download Result Slip (PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneText}>Close</Text>
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
    marginBottom: 25,
    color: "#0f172a",
    textAlign: "center",
  },
  grid: { gap: 12 },
  subCard: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },
  textContainer: { flex: 1, marginLeft: 15 },
  subText: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  priceTag: { color: "#16a34a", fontWeight: "bold", marginTop: 2 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backText: { marginLeft: 5, fontSize: 16, color: "#0f172a" },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 5,
  },
  costInfo: {
    fontSize: 16,
    color: "#ef4444",
    marginBottom: 25,
    fontWeight: "500",
  },
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
    marginTop: 10,
  },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  resultCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 15,
  },
  resultName: {
    fontSize: 18,
    color: "#0f172a",
    marginTop: 10,
    fontWeight: "600",
  },
  resultDetail: { fontSize: 14, color: "#64748b", marginTop: 5 },
  downloadBtn: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
  },
  downloadText: { color: "#fff", fontWeight: "bold", marginLeft: 10 },
  doneBtn: { marginTop: 20, padding: 10 },
  doneText: { color: "#0f172a", fontWeight: "bold" },
});

export default BVNScreen;
