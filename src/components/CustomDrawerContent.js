import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native"; // Na kara wannan don karfin navigation

const CustomDrawerContent = (props) => {
  // MUST stay inside the component to access 'props'
  const handleLogout = async () => {
    console.log("Logout function triggered");

    try {
      // 1. Share dukkan bayanan sirri nan take ba tare da jiran Alert ba
      // Wannan zai hana wancan kiran API din (Profile) ya sake faruwa
      await AsyncStorage.clear();

      // 2. Yi amfani da Reset don komawa Login
      props.navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        }),
      );

      console.log("Navigation to Login executed");
    } catch (error) {
      console.error("Logout Error:", error);
      props.navigation.navigate("Login");
    }
  };
  const navigateTo = (screenName) => {
    props.navigation.closeDrawer();
    props.navigation.navigate(screenName);
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.drawerHeader}>
          <Image source={require("../assets/Logo.png")} style={styles.logo} />
          <Text style={styles.version}>v2.0.1</Text>
        </View>

        {/* Navigation Items */}
        <View style={styles.drawerItemsContainer}>
          <DrawerItem
            label="Dashboard"
            labelStyle={styles.labelStyle}
            icon={() => (
              <Ionicons name="grid-outline" size={22} color="#1e3a8a" />
            )}
            onPress={() => navigateTo("Dashboard")}
          />

          <DrawerItem
            label="Wallet History"
            labelStyle={styles.labelStyle}
            icon={() => (
              <MaterialCommunityIcons
                name="history"
                size={22}
                color="#1e3a8a"
              />
            )}
            onPress={() => navigateTo("Wallet History")}
          />

          <DrawerItem
            label="BVN Logs"
            labelStyle={styles.labelStyle}
            icon={() => (
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={22}
                color="#1e3a8a"
              />
            )}
            onPress={() => navigateTo("BVN History")}
          />

          <DrawerItem
            label="NIMC Logs"
            labelStyle={styles.labelStyle}
            icon={() => (
              <Ionicons name="id-card-outline" size={22} color="#1e3a8a" />
            )}
            onPress={() => navigateTo("NIMC History")}
          />

          <View style={styles.divider} />

          <DrawerItem
            label="Settings"
            labelStyle={styles.labelStyle}
            icon={() => (
              <Ionicons name="settings-outline" size={22} color="#1e3a8a" />
            )}
            onPress={() => navigateTo("Settings")}
          />
        </View>
      </DrawerContentScrollView>

      {/* Footer Logout Button - AN GYARA STYLES ANAN */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.logoutSection}
          onPress={() => handleLogout()}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: 0 },
  drawerHeader: {
    padding: 30,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 10,
  },
  logo: { width: 140, height: 50, resizeMode: "contain" },
  version: { fontSize: 10, color: "#94a3b8", marginTop: 5, fontWeight: "600" },
  drawerItemsContainer: { flex: 1 },
  labelStyle: { fontWeight: "600", color: "#334155", marginLeft: -10 },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  footerContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  logoutSection: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    zIndex: 999, // Tabbatar maballin yana sama
  },
  logoutText: {
    marginLeft: 15,
    color: "#ef4444",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default CustomDrawerContent;
