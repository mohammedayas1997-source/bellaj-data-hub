import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      // Fetch Wallet Balance
      const balanceRes = await axios.get(
        "https://ayax-data-xpress-server.vercel.app/api/v1/wallet/balance",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Fetch Latest Active Notification
      const notifyRes = await axios.get(
        "https://ayax-data-xpress-server.vercel.app/api/v1/vtu/get-notifications",
      );

      if (balanceRes.data.success) {
        setBalance(balanceRes.data.balance);
      }

      if (notifyRes.data.success && notifyRes.data.data.length > 0) {
        setNotification(notifyRes.data.data[0]);
      }
    } catch (error) {
      console.log("Error fetching data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Image
            source={require("../../assets/Logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.supportBtn}
            onPress={() => navigation.navigate("Contact")}
          >
            <Text style={styles.supportIcon}>🎧</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>Welcome back, Ayax! 👋</Text>
      </View>

      {/* Notification Banner */}
      {notification && (
        <View
          style={[
            styles.banner,
            notification.type === "warning"
              ? styles.warningBanner
              : styles.infoBanner,
          ]}
        >
          <View style={styles.bannerHeader}>
            <Text style={styles.bannerIcon}>
              {notification.type === "warning" ? "⚠️" : "📢"}
            </Text>
            <Text style={styles.bannerTitle}>{notification.title}</Text>
          </View>
          <Text style={styles.bannerMessage}>{notification.message}</Text>
        </View>
      )}

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Available Balance</Text>
        {loading ? (
          <ActivityIndicator color="#ffffff" style={{ marginVertical: 10 }} />
        ) : (
          <Text style={styles.walletAmount}>₦{balance.toLocaleString()}</Text>
        )}
        <TouchableOpacity
          style={styles.fundBtn}
          onPress={() => navigation.navigate("FundWallet")}
        >
          <Text style={styles.fundText}>+ Fund Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Services Grid */}
      <Text style={styles.sectionTitle}>Main Services</Text>
      <View style={styles.grid}>
        <ServiceIcon
          title="Buy Data"
          icon="📶"
          color="#f8fafc"
          onPress={() => navigation.navigate("BuyData")}
        />
        <ServiceIcon
          title="Airtime"
          icon="📲"
          color="#f8fafc"
          onPress={() => navigation.navigate("BuyAirtime")}
        />
        <ServiceIcon
          title="Electricity"
          icon="💡"
          color="#f8fafc"
          onPress={() => navigation.navigate("Electricity")}
        />
        <ServiceIcon
          title="Cable TV"
          icon="📺"
          color="#f8fafc"
          onPress={() => navigation.navigate("Cable")}
        />
        <ServiceIcon
          title="NIMC Print"
          icon="🆔"
          color="#f8fafc"
          onPress={() => navigation.navigate("NIMC")}
        />
        <ServiceIcon
          title="History"
          icon="📝"
          color="#f8fafc"
          onPress={() => navigation.navigate("History")}
        />
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const ServiceIcon = ({ title, icon, onPress, color }) => (
  <TouchableOpacity
    style={[styles.iconBox, { backgroundColor: color }]}
    onPress={onPress}
  >
    <Text style={styles.iconStyle}>{icon}</Text>
    <Text style={styles.iconText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 50,
  },
  supportBtn: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  supportIcon: {
    fontSize: 20,
  },
  userName: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 10,
    fontWeight: "500",
  },
  banner: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 25,
    borderLeftWidth: 4,
  },
  infoBanner: {
    backgroundColor: "#f0f9ff",
    borderLeftColor: "#0ea5e9",
  },
  warningBanner: {
    backgroundColor: "#fff7ed",
    borderLeftColor: "#f97316",
  },
  bannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  bannerIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  bannerMessage: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
  },
  walletCard: {
    backgroundColor: "#1e3a8a",
    padding: 25,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 35,
    elevation: 8,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  walletLabel: {
    color: "#bfdbfe",
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: "600",
  },
  walletAmount: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 10,
  },
  fundBtn: {
    backgroundColor: "#38bdf8",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 5,
  },
  fundText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 20,
    paddingLeft: 5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  iconBox: {
    width: "47%",
    paddingVertical: 25,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  iconStyle: {
    fontSize: 32,
    marginBottom: 12,
  },
  iconText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
});

export default HomeScreen;
