import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

const ProfileScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <Text style={styles.name}>Abdulrahman Mohammed</Text>
        <Text style={styles.email}>ayax@digital.solutions</Text>
      </View>

      <View style={styles.menuList}>
        <ProfileMenu
          title="Wallet History"
          icon="💳"
          onPress={() => navigation.navigate("History")}
        />
        <ProfileMenu title="Change Password" icon="🔒" onPress={() => {}} />
        <ProfileMenu title="Support / Tuntuba" icon="📞" onPress={() => {}} />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.logoutText}>Fita (Logout)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ProfileMenu = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={styles.menuTitle}>{title}</Text>
    <Text style={styles.arrow}>❯</Text>
  </TouchableOpacity>
);
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  profileHeader: { alignItems: "center", marginVertical: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1e3a8a",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  name: { fontSize: 20, fontWeight: "bold", marginTop: 10 },
  email: { color: "#64748b" },
  menuList: { marginTop: 20 },
  menuItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  menuTitle: { flex: 1, marginLeft: 15, fontWeight: "500" },
  menuIcon: { fontSize: 20 },
  arrow: { color: "#cbd5e1" },
  logoutBtn: { marginTop: 30, alignItems: "center" },
  logoutText: { color: "#ef4444", fontWeight: "bold" },
});

export default ProfileScreen;
