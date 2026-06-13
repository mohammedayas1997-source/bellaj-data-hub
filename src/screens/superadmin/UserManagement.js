import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  RefreshControl,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import BASE_URL from "../../config/api";

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
  users: `${BASE_URL}/admin/users`,
  manageRole: `${BASE_URL}/admin/manage-role`,
};

const ROLES = ["user", "agent", "supervisor", "leader", "support", "admin", "superadmin"];

const UserManagement = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("adminToken"));

    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  const normalizeUsers = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.data?.users)) return payload.data.users;
    return [];
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();

      if (!headers) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      const { data } = await axios.get(API_ENDPOINTS.users, {
        headers,
        timeout: 30000,
      });

      setUsers(normalizeUsers(data));
    } catch (error) {
      Alert.alert(
        "Unable to Load Users",
        error?.response?.data?.message || "Unable to fetch Bellaj users."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) return navigation.openDrawer();
    if (parent?.openDrawer) return parent.openDrawer();

    navigation?.navigate?.("Main");
  };

  const goBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
    navigation?.navigate?.("SuperAdminDashboard");
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

  const changeRole = async (userId, newRole) => {
    if (!userId || !newRole) return;

    Alert.alert(
      "Confirm Role Update",
      `Are you sure you want to change this user to ${newRole.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            try {
              setUpdatingUserId(userId);

              const headers = await getAuthHeaders();

              if (!headers) {
                Alert.alert("Session Expired", "Please login again.");
                return;
              }

              const { data } = await axios.put(
                API_ENDPOINTS.manageRole,
                { userId, newRole },
                { headers, timeout: 30000 }
              );

              if (data?.success === false) {
                Alert.alert("Failed", data?.message || "Role update failed.");
                return;
              }

              setUsers((prev) =>
                prev.map((user) =>
                  (user?._id || user?.id) === userId
                    ? { ...user, role: newRole }
                    : user
                )
              );

              Alert.alert("Bellaj Data Hub", "User role updated successfully.");
            } catch (error) {
              Alert.alert(
                "Update Failed",
                error?.response?.data?.message || "Failed to update role."
              );
            } finally {
              setUpdatingUserId(null);
            }
          },
        },
      ]
    );
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((user) => {
      const name =
        user?.name ||
        user?.fullName ||
        `${user?.firstName || ""} ${user?.surname || ""}`.trim();

      const matchSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        String(user?.email || "").toLowerCase().includes(q) ||
        String(user?.phone || user?.phoneNumber || "").toLowerCase().includes(q);

      const matchRole =
        selectedRole === "all" ||
        String(user?.role || "user").toLowerCase() === selectedRole;

      return matchSearch && matchRole;
    });
  }, [users, search, selectedRole]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) =>
        ["admin", "superadmin"].includes(String(u?.role || "").toLowerCase())
      ).length,
      agents: users.filter((u) => String(u?.role || "").toLowerCase() === "agent")
        .length,
      supervisors: users.filter(
        (u) => String(u?.role || "").toLowerCase() === "supervisor"
      ).length,
    };
  }, [users]);

  const getName = (user) =>
    user?.name ||
    user?.fullName ||
    `${user?.firstName || ""} ${user?.surname || ""}`.trim() ||
    "Bellaj User";

  const renderUser = ({ item }) => {
    const id = item?._id || item?.id;
    const role = String(item?.role || "user").toLowerCase();
    const isUpdating = updatingUserId === id;

    return (
      <View style={styles.userCard}>
        <View style={styles.userTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getName(item).charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{getName(item)}</Text>
            <Text style={styles.userEmail}>{item?.email || "No email"}</Text>
            <Text style={styles.userPhone}>
              {item?.phone || item?.phoneNumber || "No phone"}
            </Text>
          </View>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        <Text style={styles.changeLabel}>Change Role</Text>

        <View style={styles.roleGrid}>
          {ROLES.map((roleItem) => {
            const active = role === roleItem;

            return (
              <TouchableOpacity
                key={roleItem}
                style={[
                  styles.roleBtn,
                  active && styles.activeRoleBtn,
                  isUpdating && { opacity: 0.5 },
                ]}
                disabled={isUpdating || active}
                onPress={() => changeRole(id, roleItem)}
                activeOpacity={0.86}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text
                    style={[
                      styles.roleBtnText,
                      active && styles.activeRoleBtnText,
                    ]}
                  >
                    {roleItem.toUpperCase()}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Bellaj Users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Role Management</Text>
          <Text style={styles.headerSubtitle}>Manage users, agents and admins</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item, index) => item?._id || item?.id || index.toString()}
        renderItem={renderUser}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons
                  name="account-key-outline"
                  size={36}
                  color={COLORS.white}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Bellaj User Control</Text>
                <Text style={styles.heroText}>
                  Search users, monitor roles and update permissions in real time.
                </Text>
              </View>

              <TouchableOpacity style={styles.refreshBtn} onPress={fetchUsers}>
                <Ionicons name="refresh" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Users" value={stats.total} color={COLORS.primary} />
              <StatCard label="Admins" value={stats.admins} color="#991B1B" />
              <StatCard label="Agents" value={stats.agents} color={COLORS.secondary} />
              <StatCard label="Supervisors" value={stats.supervisors} color="#2563EB" />
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={19} color={COLORS.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, email or phone..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.filterRow}>
              {["all", "user", "agent", "supervisor", "admin"].map((roleItem) => {
                const active = selectedRole === roleItem;

                return (
                  <TouchableOpacity
                    key={roleItem}
                    style={[styles.filterChip, active && styles.activeFilterChip]}
                    onPress={() => setSelectedRole(roleItem)}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.activeFilterText,
                      ]}
                    >
                      {roleItem.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Bellaj Users</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={60}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>No Users Found</Text>
            <Text style={styles.emptyText}>
              No Bellaj user matches your current search or filter.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const StatCard = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.light },
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
  content: {
    padding: 16,
    paddingBottom: 90,
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
    fontWeight: "600",
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
  },
  statValue: {
    color: COLORS.dark,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
    textTransform: "uppercase",
  },
  searchBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.dark,
    fontWeight: "700",
    marginLeft: 8,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  filterText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 11,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  sectionTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  userTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: COLORS.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.dark,
    fontWeight: "900",
    fontSize: 15,
  },
  userEmail: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  userPhone: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: COLORS.softGreen,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleText: {
    color: COLORS.secondary,
    fontWeight: "900",
    fontSize: 10,
    textTransform: "uppercase",
  },
  changeLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 9,
    textTransform: "uppercase",
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  roleBtn: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 75,
    alignItems: "center",
  },
  activeRoleBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleBtnText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 10,
  },
  activeRoleBtnText: {
    color: COLORS.white,
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyTitle: {
    color: COLORS.dark,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 8,
    fontWeight: "600",
  },
});

export default UserManagement;