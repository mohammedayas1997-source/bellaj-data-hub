import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
};

const API_ENDPOINTS = {
  createSupervisor: "",
};

const CreateSupervisorScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.password.trim() ||
      !formData.address.trim()
    ) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!API_ENDPOINTS.createSupervisor) {
      Alert.alert("Not Configured", "Create supervisor API is not configured.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(API_ENDPOINTS.createSupervisor, {
        ...formData,
        email: formData.email.trim().toLowerCase(),
      });

      if (response.data.success) {
        Alert.alert("Success", "New Supervisor added successfully!");
        navigation.goBack();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Something went wrong";
      Alert.alert("Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <FontAwesome5 name="user-plus" size={36} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Register Supervisor</Text>
        <Text style={styles.subtitle}>Bellaj Data Hub management account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <MaterialIcons name="person" size={20} color={COLORS.primary} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#94A3B8"
            value={formData.name}
            onChangeText={(txt) => setFormData({ ...formData, name: txt })}
          />
        </View>

        <View style={styles.inputGroup}>
          <MaterialIcons name="email" size={20} color={COLORS.primary} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(txt) => setFormData({ ...formData, email: txt })}
          />
        </View>

        <View style={styles.inputGroup}>
          <MaterialIcons name="phone" size={20} color={COLORS.primary} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(txt) => setFormData({ ...formData, phone: txt })}
          />
        </View>

        <View style={[styles.inputGroup, styles.addressInputGroup]}>
          <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
          <TextInput
            style={[styles.input, styles.addressInput]}
            placeholder="Office/Home Address"
            placeholderTextColor="#94A3B8"
            multiline
            value={formData.address}
            onChangeText={(txt) => setFormData({ ...formData, address: txt })}
          />
        </View>

        <View style={styles.inputGroup}>
          <MaterialIcons name="lock" size={20} color={COLORS.primary} />
          <TextInput
            style={styles.input}
            placeholder="Secure Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={formData.password}
            onChangeText={(txt) => setFormData({ ...formData, password: txt })}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.75 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialIcons
                name="check-circle"
                size={20}
                color={COLORS.white}
              />
              <Text style={styles.submitBtnText}>CREATE ACCOUNT</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.dark,
    padding: 30,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: COLORS.secondary,
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    padding: 20,
    marginTop: 10,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 55,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  addressInputGroup: {
    minHeight: 80,
    alignItems: "flex-start",
    paddingTop: 15,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.dark,
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 55,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
});

export default CreateSupervisorScreen;
