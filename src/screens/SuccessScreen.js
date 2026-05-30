import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  softGreen: "#EAF7F1",
};

const SuccessScreen = ({ navigation }) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    const fetchRegisteredRole = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem("userData");

        if (storedUserData) {
          const user = JSON.parse(storedUserData);

          const detectedRole = (
            user?.role ||
            user?.data?.role ||
            user?.user?.role ||
            ""
          )
            .trim()
            .toLowerCase();

          setUserRole(detectedRole);
        }
      } catch (error) {
        console.log("Error reading user role:", error);
      }
    };

    fetchRegisteredRole();
  }, [scaleValue]);

  const isAgent = userRole === "agent";

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.iconCircle, { transform: [{ scale: scaleValue }] }]}
      >
        <Ionicons
          name="checkmark-done-circle"
          size={105}
          color={COLORS.secondary}
        />
      </Animated.View>

      <Text style={styles.title}>
        {isAgent ? "AGENT ACCOUNT READY" : "ACCOUNT CREATED SUCCESSFULLY"}
      </Text>

      <Text style={styles.subtitle}>
        {isAgent
          ? "Your Bellaj Data Hub agent profile, merchant access, and virtual wallet infrastructure have been successfully created."
          : "Your Bellaj Data Hub profile and virtual wallet infrastructure have been successfully created."}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Login")}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>ACCESS BELLAJ DASHBOARD</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconCircle: {
    marginBottom: 30,
    backgroundColor: COLORS.softGreen,
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
    lineHeight: 22,
    width: "85%",
  },
  button: {
    marginTop: 40,
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 35,
    borderRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
    textAlign: "center",
  },
});

export default SuccessScreen;
