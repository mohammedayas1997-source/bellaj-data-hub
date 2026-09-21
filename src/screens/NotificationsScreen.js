import React, { useEffect, useMemo, useState, useCallback } from "react";
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
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#DCFCE7",
  softRed: "#FEE2E2",
  danger: "#DC2626",
  warning: "#D97706",
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

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 25000,
    };
  };

  const normalizeNotifications = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.notifications)) return payload.notifications;
    if (Array.isArray(payload?.data?.notifications)) {
      return payload.data.notifications;
    }
    if (Array.isArray(payload?.user?.notifications)) {
      return payload.user.notifications;
    }
    return [];
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      // Gwada jerin hanyoyin backend don tabbatar da samun sanarwa a kowace hanya
      const endpoints = [
        `${BASE_URL}/notifications/my-notifications`,
        `${BASE_URL}/api/v1/notifications/my-notifications`,
        `${BASE_URL}/notifications`,
        `${BASE_URL}/api/v1/notifications`,
        `${BASE_URL}/users/profile`,
        `${BASE_URL}/api/v1/users/me`,
      ];

      let rawList = [];

      for (const url of endpoints) {
        try {
          const res = await axios.get(url, config);
          const normalized = normalizeNotifications(res.data);
          if (normalized.length > 0) {
            rawList = normalized;
            break;
          }
        } catch {
          // Gwada ta gaba
        }
      }

      // Daidaita kowace sanarwa ta yadda take da ingantaccen ID da status na karantawa
      const formatted = rawList.map((item, idx) => ({
        _id: item._id || item.id || `notif_${idx}_${Date.now()}`,
        id: item._id || item.id || `notif_${idx}_${Date.now()}`,
        title: item.title || "Bellaj Update",
        message: item.message || item.body || item.details || "No details provided.",
        read: Boolean(item.isRead || item.read),
        createdAt: item.createdAt || item.date || new Date().toISOString(),
        category: item.category || "SYSTEM",
      }));

      setNotifications(formatted);
    } catch (error) {
      console.log("Notification Fetch Error:", error.message);
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

  const markAsRead = async (id) => {
    if (!id) return;

    try {
      setWorkingId(id);
      const config = await getAuthHeaders();

      const endpoints = [
        `${BASE_URL}/notifications/read/${id}`,
        `${BASE_URL}/api/v1/notifications/read/${id}`,
        `${BASE_URL}/notifications/${id}/read`,
      ];

      for (const url of endpoints) {
        try {
          await axios.put(url, {}, config).catch(async () => {
            return await axios.patch(url, {}, config);
          });
          break;
        } catch {
          // Ci gaba
        }
      }

      // Sabuntawa a UI nan take
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id || item.id === id ? { ...item, read: true } : item
        )
      );
    } catch {
      // Ko da network ya samu cikas, canza shi a UI
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id || item.id === id ? { ...item, read: true } : item
        )
      );
    } finally {
      setWorkingId(null);
    }
  };

  const deleteNotification = (id) => {
    if (!id) return;

    Alert.alert(
      "Dismiss Notification",
      "Are you sure you want to remove this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setWorkingId(id);
              const config = await getAuthHeaders();

              const endpoints = [
                `${BASE_URL}/notifications/${id}`,
                `${BASE_URL}/api/v1/notifications/${id}`,
                `${BASE_URL}/notifications/delete/${id}`,
              ];

              for (const url of endpoints) {
                try {
                  await axios.delete(url, config);
                  break;
                } catch {
                  // Ci gaba
                }
              }

              setNotifications((prev) =>
                prev.filter((item) => item._id !== id && item.id !== id)
              );
            } catch {
              setNotifications((prev) =>
                prev.filter((item) => item._id !== id && item.id !== id)
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
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const renderNotification = ({ item }) => {
    const id = item._id || item.id;
    const isUnread = !item.read;
    const isWorking = workingId === id;

    return (
      <View style={[styles.card, isUnread && styles.unreadCard]}>
        <View style={[styles.iconContainer, { backgroundColor: isUnread ? COLORS.softGreen : COLORS.light }]}>
          <MaterialCommunityIcons
            name={isUnread ? "bell-ring-outline" : "bell-check-outline"}
            size={22}
            color={isUnread ? COLORS.primary : COLORS.muted}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>

            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text style={styles.message}>{item.message}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.date}>
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now"}
            </Text>

            {item.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{item.category}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            {isUnread && (
              <TouchableOpacity
                style={styles.readBtn}
                onPress={() => markAsRead(id)}
                disabled={isWorking}
                activeOpacity={0.8}
              >
                {isWorking ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={15} color={COLORS.white} />
                    <Text style={styles.actionText}>Mark Read</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteNotification(id)}
              disabled={isWorking}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
              <Text style={[styles.actionText, { color: COLORS.danger }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Syncing Notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>Official alerts & updates</Text>
        </View>

        <TouchableOpacity style={styles.refreshHeaderBtn} onPress={fetchNotifications}>
          <Ionicons name="refresh" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons name="bell-ring-outline" size={30} color={COLORS.white} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Notification Center</Text>
              <Text style={styles.heroText}>
                {unreadCount > 0
                  ? `You have ${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}.`
                  : "All notifications are caught up."}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              Platform announcements, operational updates, and system receipts will appear here.
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
    paddingTop: Platform.OS === "android" ? 44 : 22,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextBox: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "900" },
  headerSubtitle: { color: "#DCFCE7", fontSize: 11, fontWeight: "600", marginTop: 2 },
  refreshHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
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
    fontSize: 13,
  },
  listContent: {
    padding: 14,
    paddingBottom: 90,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTitle: { color: COLORS.dark, fontSize: 16, fontWeight: "900" },
  heroText: { color: COLORS.muted, marginTop: 4, lineHeight: 18, fontSize: 12, fontWeight: "600" },

  card: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
    backgroundColor: "#FCFDFE",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.dark,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginLeft: 6,
  },
  message: {
    color: "#334155",
    lineHeight: 18,
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  date: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },
  categoryBadge: {
    backgroundColor: COLORS.light,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: COLORS.muted,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    justifyContent: "flex-end",
  },
  readBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: "center",
    gap: 4,
  },
  deleteBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.softRed,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 11,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.dark,
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    fontSize: 12,
    fontWeight: "600",
  },
});

export default NotificationScreen;