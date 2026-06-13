import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#EAF7F1",
  softRed: "#FFF1F1",
};

const SuccessScreen = ({ navigation }) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  const [userRole, setUserRole] = useState("user");
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    fetchRegisteredRole();
  }, []);

  const fetchRegisteredRole = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem("userData");
      const storedRole = await AsyncStorage.getItem("userRole");

      let detectedRole = storedRole || "user";

      if (storedUserData) {
        const user = JSON.parse(storedUserData);

        detectedRole =
          user?.role ||
          user?.data?.role ||
          user?.user?.role ||
          user?.accountType ||
          storedRole ||
          "user";
      }

      setUserRole(String(detectedRole).trim().toLowerCase());
    } catch {
      setUserRole("user");
    } finally {
      setLoadingRole(false);
    }
  };

  const goToDashboard = () => {
    const role = String(userRole || "user").toLowerCase();

    let targetScreen = "Main";

    if (role === "agent") targetScreen = "AgentDashboard";
    if (role === "support") targetScreen = "SupportDashboard";
    if (role === "supervisor") targetScreen = "SupervisorDashboard";
    if (role === "admin") targetScreen = "AdminDashboard";
    if (role === "superadmin" || role === "super_admin") {
      targetScreen = "SuperAdminDashboard";
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: targetScreen }],
      })
    );
  };

  const goToLogin = async () => {
    await AsyncStorage.multiRemove([
      "userToken",
      "token",
      "adminToken",
      "overrideRole",
      "isSuperAdminOverride",
    ]);

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
  };

  const roleTitle = () => {
    if (userRole === "agent") return "AGENT ACCOUNT READY";
    if (userRole === "support") return "SUPPORT ACCOUNT READY";
    if (userRole === "supervisor") return "SUPERVISOR ACCOUNT READY";
    if (userRole === "admin") return "ADMIN ACCOUNT READY";
    if (userRole === "superadmin" || userRole === "super_admin") {
      return "SUPER ADMIN ACCESS READY";
    }

    return "ACCOUNT CREATED SUCCESSFULLY";
  };

  const roleMessage = () => {
    if (userRole === "agent") {
      return "Your Bellaj Data Hub agent profile, merchant access and wallet infrastructure have been created successfully.";
    }

    if (userRole === "support") {
      return "Your Bellaj Data Hub support profile is ready. You can now access support activities and customer service tools.";
    }

    if (userRole === "supervisor") {
      return "Your Bellaj Data Hub supervisor profile is ready. You can now manage agents, targets and performance.";
    }

    if (userRole === "admin") {
      return "Your Bellaj Data Hub admin profile is ready. You can now access admin management tools.";
    }

    if (userRole === "superadmin" || userRole === "super_admin") {
      return "Your Bellaj Data Hub super admin access is ready. You can now manage the full platform.";
    }

    return "Your Bellaj Data Hub profile and wallet infrastructure have been created successfully.";
  };

  if (loadingRole) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Preparing your account...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      <Animated.View
        style={[
          styles.successCard,
          {
            opacity: fadeValue,
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        <View style={styles.iconCircle}>
          <Ionicons
            name="checkmark-done-circle"
            size={105}
            color={COLORS.secondary}
          />
        </View>

        <Text style={styles.title}>{roleTitle()}</Text>

        <Text style={styles.subtitle}>{roleMessage()}</Text>

        <View style={styles.roleBadge}>
          <MaterialCommunityIcons
            name="shield-account-outline"
            size={18}
            color={COLORS.secondary}
          />
          <Text style={styles.roleText}>
            {String(userRole || "user").replace("_", " ").toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={goToDashboard}
          activeOpacity={0.85}
        >
          <Ionicons name="grid-outline" size={20} color={COLORS.white} />
          <Text style={styles.buttonText}>ACCESS BELLAJ DASHBOARD</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={goToLogin}>
          <Text style={styles.loginText}>Go to Login Instead</Text>
        </TouchableOpacity>
      </Animated.View>
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
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.light,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: COLORS.primary,
    fontWeight: "800",
  },
  successCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  iconCircle: {
    marginBottom: 26,
    backgroundColor: COLORS.softGreen,
    width: 132,
    height: 132,
    borderRadius: 66,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.7,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 14,
    marginTop: 12,
    lineHeight: 22,
  },
  roleBadge: {
    marginTop: 18,
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleText: {
    color: COLORS.secondary,
    fontWeight: "900",
    fontSize: 11,
  },
  button: {
    marginTop: 34,
    backgroundColor: COLORS.primary,
    minHeight: 56,
    width: "100%",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.8,
    textAlign: "center",
  },
  loginBtn: {
    marginTop: 18,
    paddingVertical: 8,
  },
  loginText: {
    color: COLORS.secondary,
    fontWeight: "900",
    fontSize: 13,
  },
});

export default SuccessScreen;