import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const API_ENDPOINTS = {
  notifications: `${BASE_URL}/notifications`,
  markRead: `${BASE_URL}/notifications/read`,
  deleteNotification: `${BASE_URL}/notifications/delete`,
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeNotifications = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.notifications)) return payload.notifications;
    if (Array.isArray(payload?.data?.notifications)) {
      return payload.data.notifications;
    }
    return [];
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      const { data } = await axios.get(API_ENDPOINTS.notifications, {
        headers,
      });

      setNotifications(normalizeNotifications(data));
    } catch (error) {
      console.log("Notification Error:", error?.response?.data || error.message);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const logout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "token",
            "adminToken",
            "userData",
            "userRole",
            "overrideRole",
            "isSuperAdminOverride",
          ]);

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          );
        },
      },
    ]);
  };

  const markAsRead = async (id) => {
    if (!id) return;

    try {
      setWorkingId(id);

      const headers = await getAuthHeaders();

      await axios.put(`${API_ENDPOINTS.markRead}/${id}`, {}, { headers });

      setNotifications((prev) =>
        prev.map((item) =>
          (item?._id || item?.id) === id ? { ...item, read: true } : item
        )
      );
    } catch (error) {
      Alert.alert(
        "Action Failed",
        error?.response?.data?.message ||
          "Unable to mark notification as read."
      );
    } finally {
      setWorkingId(null);
    }
  };

  const deleteNotification = async (id) => {
    if (!id) return;

    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setWorkingId(id);

              const headers = await getAuthHeaders();

              await axios.delete(`${API_ENDPOINTS.deleteNotification}/${id}`, {
                headers,
              });

              setNotifications((prev) =>
                prev.filter((item) => (item?._id || item?.id) !== id)
              );
            } catch (error) {
              Alert.alert(
                "Delete Failed",
                error?.response?.data?.message ||
                  "Failed to delete notification."
              );
            } finally {
              setWorkingId(null);
            }
          },
        },
      ]
    );
  };

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item?.read).length,
    [notifications]
  );

  const renderNotification = ({ item }) => {
    const id = item?._id || item?.id;
    const isUnread = !item?.read;
    const isWorking = workingId === id;

    return (
      <View style={[styles.card, isUnread && styles.unreadCard]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isUnread ? "bell-ring-outline" : "bell-check-outline"}
            size={24}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {item?.title || "Bellaj Notification"}
            </Text>

            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message}>
            {item?.message || "No message available"}
          </Text>

          <Text style={styles.date}>
            {item?.createdAt
              ? new Date(item.createdAt).toLocaleString()
              : "No date"}
          </Text>

          <View style={styles.actionRow}>
            {isUnread && (
              <TouchableOpacity
                style={styles.readBtn}
                onPress={() => markAsRead(id)}
                disabled={isWorking}
                activeOpacity={0.86}
              >
                {isWorking ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-done"
                      size={16}
                      color={COLORS.white}
                    />
                    <Text style={styles.actionText}>Mark Read</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteNotification(id)}
              disabled={isWorking}
              activeOpacity={0.86}
            >
              <Ionicons name="trash-outline" size={16} color={COLORS.white} />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Bellaj Data Hub updates</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item, index) => item?._id || item?.id || index.toString()}
        renderItem={renderNotification}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={34}
                color={COLORS.white}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Notification Center</Text>
              <Text style={styles.heroText}>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount > 1 ? "s" : ""
                    }`
                  : "You are all caught up"}
              </Text>
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={fetchNotifications}>
              <Ionicons name="refresh" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={76}
              color="#CBD5E1"
            />

            <Text style={styles.emptyTitle}>No Notifications</Text>

            <Text style={styles.emptyText}>
              New Bellaj Data Hub updates and announcements will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextBox: { flex: 1 },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "700",
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.dark,
    flex: 1,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  message: {
    color: "#475569",
    lineHeight: 20,
    marginTop: 5,
    fontWeight: "600",
  },
  date: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  readBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 105,
    justifyContent: "center",
  },
  deleteBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  actionText: {
    color: COLORS.white,
    marginLeft: 5,
    fontWeight: "900",
    fontSize: 12,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 15,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    fontWeight: "600",
  },
});

export default NotificationScreen;