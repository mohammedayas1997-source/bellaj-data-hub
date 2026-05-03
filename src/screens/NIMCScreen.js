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

const NIMCScreen = () => {
  const [view, setView] = useState("main"); // 'main', 'mod_list', 'form'
  const [selectedTask, setSelectedTask] = useState(null);
  const [prices, setPrices] = useState({}); // Daga Admin za su fito
  const [formData, setFormData] = useState({ nin: "", pin: "" });

  // 1. NIN Verification (Direct API)
  const handleVerification = async () => {
    // Anan zaka saka API din da kake so kayi amfani da shi
    Alert.alert("NIN Verification", "Connecting to API...");
  };

  // 2. Submit Modification Form (Manual Admin Approval)
  const handleSubmitForm = async () => {
    try {
      // Logic na cire kudi a wallet da submit ma admin
      const res = await axios.post("/api/v1/nimc/submit-request", {
        type: selectedTask.id,
        nin: formData.nin,
        pin: formData.pin,
        amount: prices[selectedTask.id],
      });
      if (res.data.success)
        Alert.alert("Success", "Request submitted to Admin");
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to submit");
    }
  };

  // --- RENDERING LOGIC ---

  // A. Babban Shafin Farko (Icons 2 kacal)
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

  // B. Shafin Modifications (Sub-Icons)
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
          <Ionicons name="arrow-back" size={24} />
          <Text>Back</Text>
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

  // C. Shafin Form (Submit to Admin)
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
          onChangeText={(v) => setFormData({ ...formData, nin: v })}
        />
        <TextInput
          placeholder="App Transaction PIN"
          style={styles.input}
          secureTextEntry
          onChangeText={(v) => setFormData({ ...formData, pin: v })}
        />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitForm}>
          <Text style={styles.submitText}>Submit & Pay</Text>
        </TouchableOpacity>
        // Misali a cikin NIMCScreen.js
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
};
