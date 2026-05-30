import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../../config/api";

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
  nimcPrices: "",
  requestModification: "",
};

const NIMCModification = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState({});
  const [selectedType, setSelectedType] = useState("name");
  const [formData, setFormData] = useState({});
  const [pin, setPin] = useState("");

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      if (!API_ENDPOINTS.nimcPrices) return;

      const { data } = await axios.get(API_ENDPOINTS.nimcPrices);

      if (data.success) {
        setPrices(data.prices || {});
      }
    } catch (err) {
      console.log("Error fetching Bellaj NIMC prices:", err);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    if (!pin || !formData.ninNumber) {
      Alert.alert("Error", "Please fill in your NIN and Transaction PIN.");
      return;
    }

    if (formData.ninNumber.length !== 11) {
      Alert.alert("Error", "Please enter a valid 11-digit NIN.");
      return;
    }

    if (pin.length !== 4) {
      Alert.alert("Error", "Please enter your 4-digit transaction PIN.");
      return;
    }

    if (!API_ENDPOINTS.requestModification) {
      Alert.alert(
        "Not Configured",
        "NIMC modification API endpoint is not configured.",
      );
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await axios.post(
        API_ENDPOINTS.requestModification,
        {
          serviceType: selectedType,
          formData,
          ninNumber: formData.ninNumber,
          pin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        Alert.alert(
          "Bellaj Data Hub",
          "Modification request submitted successfully.",
        );
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  const modificationOptions = [
    { id: "name", label: "Name", icon: "person-outline" },
    { id: "phone", label: "Phone", icon: "call-outline" },
    { id: "dob", label: "DOB", icon: "calendar-outline" },
    { id: "address", label: "Address", icon: "location-outline" },
    { id: "name_dob", label: "Name & DOB", icon: "id-card-outline" },
    { id: "name_phone", label: "Name & Phone", icon: "person-add-outline" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Bellaj NIMC Modification</Text>
        </View>

        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}
          >
            {modificationOptions.map((item) => {
              const active = selectedType === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.tabItem, active && styles.activeTabItem]}
                  onPress={() => {
                    setSelectedType(item.id);
                    setFormData({
                      ninNumber: formData.ninNumber,
                    });
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active ? COLORS.white : COLORS.muted}
                  />

                  <Text
                    style={[styles.tabText, active && styles.activeTabText]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Primary Details</Text>

              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>
                  Cost: ₦{prices[selectedType] || "0.00"}
                </Text>
              </View>
            </View>

            <InputField
              label="NIN Number"
              placeholder="11-digit NIN"
              keyboardType="numeric"
              maxLength={11}
              value={formData.ninNumber || ""}
              onChangeText={(v) => handleInputChange("ninNumber", v)}
            />

            {selectedType === "name" && (
              <>
                <InputField
                  label="First Name"
                  placeholder="New first name"
                  onChangeText={(v) => handleInputChange("firstName", v)}
                />

                <InputField
                  label="Last Name"
                  placeholder="New last name"
                  onChangeText={(v) => handleInputChange("lastName", v)}
                />

                <InputField
                  label="Middle Name"
                  placeholder="New middle name"
                  onChangeText={(v) => handleInputChange("middleName", v)}
                />
              </>
            )}

            {selectedType === "phone" && (
              <>
                <InputField
                  label="Full Name"
                  placeholder="As seen on NIN"
                  onChangeText={(v) => handleInputChange("fullName", v)}
                />

                <InputField
                  label="New Phone Number"
                  placeholder="080..."
                  keyboardType="phone-pad"
                  onChangeText={(v) => handleInputChange("newPhone", v)}
                />
              </>
            )}

            {selectedType === "dob" && (
              <>
                <InputField
                  label="New Date of Birth"
                  placeholder="DD/MM/YYYY"
                  onChangeText={(v) => handleInputChange("newDob", v)}
                />

                <InputField
                  label="L.G.A of Origin"
                  placeholder="Your LGA"
                  onChangeText={(v) => handleInputChange("lgaOrigin", v)}
                />

                <InputField
                  label="Place of Birth"
                  placeholder="Hospital or Town"
                  onChangeText={(v) => handleInputChange("placeBirth", v)}
                />
              </>
            )}

            {selectedType === "address" && (
              <>
                <InputField
                  label="Address Line 1"
                  placeholder="House number / Street"
                  onChangeText={(v) => handleInputChange("addressLine1", v)}
                />

                <InputField
                  label="Town / City"
                  placeholder="City name"
                  onChangeText={(v) => handleInputChange("townCity", v)}
                />

                <InputField
                  label="State"
                  placeholder="Current state"
                  onChangeText={(v) => handleInputChange("state", v)}
                />
              </>
            )}

            {(selectedType === "name_dob" || selectedType === "name_phone") && (
              <>
                <InputField
                  label="New First Name"
                  placeholder="Enter first name"
                  onChangeText={(v) => handleInputChange("newFirstName", v)}
                />

                <InputField
                  label="New Last Name"
                  placeholder="Enter last name"
                  onChangeText={(v) => handleInputChange("newLastName", v)}
                />

                {selectedType === "name_dob" ? (
                  <InputField
                    label="New Date of Birth"
                    placeholder="DD/MM/YYYY"
                    onChangeText={(v) => handleInputChange("newDob", v)}
                  />
                ) : (
                  <InputField
                    label="New Phone Number"
                    placeholder="080..."
                    keyboardType="phone-pad"
                    onChangeText={(v) => handleInputChange("newPhoneNumber", v)}
                  />
                )}
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Authorization</Text>

            <InputField
              label="Transaction PIN"
              placeholder="4-digit security PIN"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.75 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.btnText}>Submit Modification Request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const InputField = ({ label, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} placeholderTextColor="#94A3B8" {...props} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 15,
  },
  tabContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabScroll: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
    marginLeft: 6,
  },
  activeTabText: {
    color: COLORS.white,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.secondary,
    marginBottom: 15,
  },
  priceBadge: {
    backgroundColor: COLORS.softGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: "800",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.muted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    color: COLORS.dark,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
});

export default NIMCModification;
