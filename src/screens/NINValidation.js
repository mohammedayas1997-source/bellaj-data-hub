import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
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
  ninValidate: "",
};

const NINValidation = () => {
  const [selectedType, setSelectedType] = useState("No Record Found");
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [formData, setFormData] = useState({ nin: "", pin: "" });

  const validationTypes = [
    { id: 1, name: "No Record Found", cost: 1300 },
    { id: 2, name: "SIM Validation", cost: 1300 },
    { id: 3, name: "vNIN Validation", cost: 1300 },
    { id: 4, name: "Update Records Validation", cost: 1300 },
    { id: 5, name: "Bank Validation", cost: 1300 },
    { id: 6, name: "Modification Validation", cost: 1700 },
    { id: 7, name: "Photographic Error", cost: 1400 },
  ];

  const currentCost =
    validationTypes.find((t) => t.name === selectedType)?.cost || 0;

  const handleSubmit = async () => {
    if (!formData.nin.trim() || !formData.pin.trim() || !isAuthorized) {
      Alert.alert(
        "Error",
        "Da fatan ka cika dukkan gurabe sannan ka yarda da Authorization.",
      );
      return;
    }

    if (formData.nin.trim().length !== 11) {
      Alert.alert("Error", "Enter valid 11-digit NIN number.");
      return;
    }

    if (formData.pin.trim().length !== 4) {
      Alert.alert("Error", "Enter valid 4-digit transaction PIN.");
      return;
    }

    if (!API_ENDPOINTS.ninValidate) {
      Alert.alert("Not Configured", "NIN validation API is not configured.");
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch(API_ENDPOINTS.ninValidate, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedType,
          nin: formData.nin.trim(),
          pin: formData.pin.trim(),
          amount: currentCost,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          "Bellaj Data Hub",
          "An aika da validation dinka cikin nasara.",
        );
        setFormData({ nin: "", pin: "" });
        setIsAuthorized(false);
      } else {
        throw new Error(result.message || "Akwai matsala gurin aikawa.");
      }
    } catch (error) {
      Alert.alert("Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="list" size={20} color={COLORS.primary} />
            <Text style={styles.title}>Select the validation you want</Text>
          </View>

          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>
              Cost: ₦{currentCost.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.chipContainer}>
          {validationTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.chip,
                selectedType === type.name && styles.selectedChip,
              ]}
              onPress={() => setSelectedType(type.name)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedType === type.name && styles.selectedChipText,
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>NIN Number</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 11-digit NIN"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          maxLength={11}
          value={formData.nin}
          onChangeText={(v) => setFormData({ ...formData, nin: v })}
        />

        <Text style={[styles.label, { marginTop: 15 }]}>Transaction PIN</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 4-digit PIN"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          keyboardType="numeric"
          maxLength={4}
          value={formData.pin}
          onChangeText={(v) => setFormData({ ...formData, pin: v })}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name="shield-check"
            size={18}
            color={COLORS.secondary}
          />

          <Text style={styles.authTitle}>Authorization</Text>
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsAuthorized(!isAuthorized)}
        >
          <MaterialCommunityIcons
            name={isAuthorized ? "checkbox-marked" : "checkbox-blank-outline"}
            size={24}
            color={isAuthorized ? COLORS.secondary : "#CBD5E1"}
          />

          <Text style={styles.authText}>
            I confirm that I have obtained authorization from the NIN owner.
          </Text>
        </TouchableOpacity>

        <Text style={styles.linkText}>View full consent text</Text>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!isAuthorized || loading) && styles.disabledBtn,
          ]}
          onPress={handleSubmit}
          disabled={!isAuthorized || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>Submit Validation Request</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    padding: 15,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    color: COLORS.dark,
  },
  priceBadge: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  priceText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "bold",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 10,
    backgroundColor: COLORS.white,
  },
  selectedChip: {
    backgroundColor: COLORS.softRed,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  selectedChipText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 13,
    backgroundColor: COLORS.light,
    color: COLORS.dark,
  },
  authTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    color: COLORS.secondary,
  },
  checkboxRow: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "flex-start",
  },
  authText: {
    fontSize: 12,
    color: "#444",
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 35,
    textDecorationLine: "underline",
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  disabledBtn: {
    backgroundColor: "#CBD5E1",
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
});

export default NINValidation;
