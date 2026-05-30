import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
};

const CustomDrawerContent = (props) => {
  const { navigation, state } = props;
  const [userRole, setUserRole] = useState(null);
  const activeRoute = state?.routeNames[state?.index];

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        }),
      );
    } catch (error) {
      console.log("Logout Error:", error);
      navigation.navigate("Login");
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      const userData = await AsyncStorage.getItem("userData");

      if (userData) {
        const parsedData = JSON.parse(userData);
        const role = parsedData?.role || parsedData?.data?.role || "";
        setUserRole(role.trim().toLowerCase());
      }
    };

    fetchUserRole();
  }, []);

  const navigateTo = (screen) => {
    navigation.closeDrawer();
    navigation.navigate(screen);
  };

  const isActive = (routeName) => activeRoute === routeName;

  const activeColor = COLORS.primary;
  const inactiveColor = COLORS.muted;

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image
            source={require("../assets/Logo.png")}
            style={styles.logo}
          />
          <Text style={styles.appName}>Bellaj Data Hub</Text>
          <Text style={styles.version}>v2.0.1</Text>
        </View>

        <View style={styles.menu}>
          {userRole === "agent" ? (
            <DrawerItem
              label="Agent Dashboard"
              icon={() => (
                <MaterialCommunityIcons
                  name="account-tie"
                  size={22}
                  color={
                    isActive("AgentDashboard") ? activeColor : inactiveColor
                  }
                />
              )}
              labelStyle={[
                styles.label,
                isActive("AgentDashboard") && styles.activeLabel,
              ]}
              onPress={() => navigateTo("AgentDashboard")}
            />
          ) : (
            <DrawerItem
              label="Dashboard"
              icon={() => (
                <Ionicons
                  name="grid-outline"
                  size={22}
                  color={isActive("Dashboard") ? activeColor : inactiveColor}
                />
              )}
              labelStyle={[
                styles.label,
                isActive("Dashboard") && styles.activeLabel,
              ]}
              onPress={() => navigateTo("Dashboard")}
            />
          )}

          <DrawerItem
            label="Wallet History"
            icon={() => (
              <MaterialCommunityIcons
                name="history"
                size={22}
                color={isActive("Wallet History") ? activeColor : inactiveColor}
              />
            )}
            labelStyle={[
              styles.label,
              isActive("Wallet History") && styles.activeLabel,
            ]}
            onPress={() =>
              navigation.navigate("Main", { screen: "Wallet History" })
            }
          />

          <DrawerItem
            label="BVN Logs"
            icon={() => (
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={22}
                color={isActive("BVN History") ? activeColor : inactiveColor}
              />
            )}
            labelStyle={[
              styles.label,
              isActive("BVN History") && styles.activeLabel,
            ]}
            onPress={() => navigateTo("BVN History")}
          />

          <DrawerItem
            label="NIMC Logs"
            icon={() => (
              <Ionicons
                name="id-card-outline"
                size={22}
                color={isActive("NIMC History") ? activeColor : inactiveColor}
              />
            )}
            labelStyle={[
              styles.label,
              isActive("NIMC History") && styles.activeLabel,
            ]}
            onPress={() => navigateTo("NIMC History")}
          />

          <View style={styles.divider} />

          <DrawerItem
            label="Settings"
            icon={() => (
              <Ionicons
                name="settings-outline"
                size={22}
                color={isActive("Settings") ? activeColor : inactiveColor}
              />
            )}
            labelStyle={[
              styles.label,
              isActive("Settings") && styles.activeLabel,
            ]}
            onPress={() => navigateTo("Settings")}
          />
        </View>
      </DrawerContentScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.primary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 0,
  },
  header: {
    padding: 25,
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  logo: {
    width: 120,
    height: 60,
    resizeMode: "contain",
  },
  appName: {
    marginTop: 6,
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 16,
  },
  version: {
    fontSize: 11,
    marginTop: 3,
    color: COLORS.muted,
    fontWeight: "600",
  },
  menu: {
    flex: 1,
    paddingTop: 10,
  },
  label: {
    fontWeight: "600",
    color: COLORS.muted,
    marginLeft: -10,
  },
  activeLabel: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    backgroundColor: COLORS.white,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  logoutText: {
    marginLeft: 12,
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default CustomDrawerContent;
