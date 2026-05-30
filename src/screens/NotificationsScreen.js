import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  softRed: "#FFF1F1",
};

const API_ENDPOINTS = {
  notifications: "",
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      if (!API_ENDPOINTS.notifications) {
        setNotifications([]);
        return;
      }

      const response = await axios.get(API_ENDPOINTS.notifications);

      setNotifications(response.data || []);
    } catch (error) {
      console.log("Notification Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const renderNotification = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="bell-ring-outline"
          size={22}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{item.title || "Bellaj Notification"}</Text>

        <Text style={styles.message}>
          {item.message || "No message available"}
        </Text>

        {item.createdAt && (
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bellaj Notifications</Text>

          <Text style={styles.headerSub}>
            Updates and important announcements
          </Text>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close-circle" size={34} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="bell-off-outline"
            size={70}
            color="#CBD5E1"
          />

          <Text style={styles.emptyTitle}>No Notifications Yet</Text>

          <Text style={styles.emptyText}>
            New updates from Bellaj Data Hub will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) =>
            item._id || item.id || index.toString()
          }
          renderItem={renderNotification}
          contentContainerStyle={{ padding: 15 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },

  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },

  headerSub: {
    color: "#FFE4E4",
    marginTop: 4,
    fontSize: 13,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.light,
  },

  loadingText: {
    marginTop: 10,
    color: COLORS.muted,
  },

  card: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 15,
    marginBottom: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 2,
  },

  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 4,
  },

  message: {
    color: "#475569",
    lineHeight: 20,
    marginBottom: 6,
  },

  date: {
    fontSize: 11,
    color: "#94A3B8",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginTop: 15,
  },

  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});

export default NotificationScreen;
