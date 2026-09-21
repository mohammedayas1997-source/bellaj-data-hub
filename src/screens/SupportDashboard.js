import React, { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  RefreshControl,
  Platform,
  useWindowDimensions,
  Animated,
  Modal,
  ScrollView,
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
  softYellow: "#FEF3C7",
  success: "#16A34A",
  danger: "#DC2626",
  warning: "#D97706",
  sidebarBg: "#052215",
  sidebarBorder: "#0A3D27",
  card: "#FFFFFF",
};

const API_ENDPOINTS = {
  searchUser: `${BASE_URL}/support/search-user`,
  traceService: `${BASE_URL}/support/trace-service`,
};

const SERVICE_TYPES = [
  { id: "data", label: "Data", icon: "wifi" },
  { id: "airtime", label: "Airtime", icon: "cellphone-wireless" },
  { id: "bvn", label: "BVN", icon: "card-account-details-outline" },
  { id: "nimc", label: "NIMC", icon: "fingerprint" },
  { id: "cable", label: "Cable TV", icon: "television-classic" },
  { id: "utility", label: "Electricity", icon: "lightning-bolt" },
];

const SupportDashboard = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 1024;

  const [identifier, setIdentifier] = useState("");
  const [type, setType] = useState("data");
  const [userData, setUserData] = useState(null);
  const [traceData, setTraceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Sidebar Drawer Controller
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarWidth = Math.min(width * 0.82, 340);
  const sidebarAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  // Dialog na Aiki a kan mai amfani (Suspend/Delete)
  const [actionLoading, setActionLoading] = useState(false);

  const toggleSidebar = (open) => {
    if (open) {
      setSidebarOpen(true);
      Animated.spring(sidebarAnim, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: -sidebarWidth,
        duration: 220,
        useNativeDriver: false,
      }).start(() => setSidebarOpen(false));
    }
  };

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
      timeout: 30000,
    };
  };

  const normalizeUser = (payload) => {
    return payload?.data?.user || payload?.data || payload?.user || payload || null;
  };

  const normalizeArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.records)) return payload.records;
    if (Array.isArray(payload?.transactions)) return payload.transactions;
    if (Array.isArray(payload?.data?.records)) return payload.data.records;
    if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
    return [];
  };

  // 1. NEMO MAI AMFANI TARE DA FALLBACKS
  const handleUserSearch = async () => {
    if (!identifier.trim()) {
      Alert.alert("Bayanin Bincike", "Don Allah saka Email, Phone number, NIN, ko Reference ID.");
      return;
    }

    try {
      setLoading(true);
      const config = await getAuthHeaders();

      const searchTerms = encodeURIComponent(identifier.trim());
      const endpoints = [
        `${API_ENDPOINTS.searchUser}/${searchTerms}`,
        `${BASE_URL}/admin/track-transaction/${searchTerms}`,
        `${BASE_URL}/api/v1/users/profile`,
      ];

      let found = null;
      for (const url of endpoints) {
        try {
          const res = await axios.get(url, config);
          const u = normalizeUser(res.data);
          if (u) {
            found = u;
            break;
          }
        } catch {}
      }

      if (found) {
        setUserData(found);
        setTraceData([]);
      } else {
        Alert.alert("Ba a Samu Ba", "Babu mai amfani da ya dace da wannan bayanin.");
      }
    } catch (error) {
      Alert.alert("Matsalar Bincike", error?.response?.data?.message || "Ba a samu bayanan mai amfani ba.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. BINCIKO AINIHIN AIKI (TRACE SERVICE / TRANSACTION)
  const handleTrace = async () => {
    if (!identifier.trim()) {
      Alert.alert("Bayanin Bincike", "Don Allah saka Reference ID ko lambar waya don gudanar da bincike.");
      return;
    }

    try {
      setLoading(true);
      const config = await getAuthHeaders();
      const searchTerms = encodeURIComponent(identifier.trim());

      const endpoints = [
        `${API_ENDPOINTS.traceService}/${type}/${searchTerms}`,
        `${BASE_URL}/admin/transactions?search=${searchTerms}`,
        `${BASE_URL}/admin/track-transaction/${searchTerms}`,
      ];

      let records = [];
      for (const url of endpoints) {
        try {
          const res = await axios.get(url, config);
          const list = normalizeArray(res.data);
          if (list.length > 0) {
            records = list;
            break;
          }
        } catch {}
      }

      setTraceData(records);
      setUserData(null);

      if (records.length === 0) {
        Alert.alert("Babu Bayani", `Babu bayanan hada-hadar ${type.toUpperCase()} da suka dace.`);
      }
    } catch (error) {
      setTraceData([]);
      Alert.alert("Babu Bayani", error?.response?.data?.message || "Ba a samu hada-hadar ba.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 3. DAKATARWA KO KUNNA MAI AMFANI (INLINE SUSPEND / ACTIVATE)
  const handleToggleSuspension = async (user) => {
    const userId = user._id || user.id;
    const isCurrentlySuspended = Boolean(user.isSuspended);
    const actionLabel = isCurrentlySuspended ? "Activate (Kunna)" : "Suspend (Dakatar)";

    Alert.alert(
      `${actionLabel} Account`,
      `Shin kana son sauya matsayin asusun ${user.name || user.email} zuwa ${
        isCurrentlySuspended ? "ACTIVE" : "SUSPENDED"
      }?`,
      [
        { text: "Fasa (Cancel)", style: "cancel" },
        {
          text: actionLabel,
          style: isCurrentlySuspended ? "default" : "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const config = await getAuthHeaders();
              const payload = { isSuspended: !isCurrentlySuspended };

              await axios.patch(`${BASE_URL}/admin/users/${userId}/status`, payload, config).catch(async () => {
                return await axios.put(`${BASE_URL}/admin/users/${userId}/status`, payload, config);
              });

              Alert.alert("An Sabunta", "Matsayin asusun ya sauya cikin nasara.");
              handleUserSearch();
            } catch (err) {
              Alert.alert("Kuskure", err.message || "An kasa sauya matsayin asusun.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // 4. GOGE MAI AMFANI HAR ABADA
  const handlePermanentDelete = (user) => {
    const userId = user._id || user.id;
    const userName = user.name || user.email;

    Alert.alert(
      "⚠️ GOGE HAR ABADA",
      `Shin ka tabbata kana son goge asusun "${userName}" daga database har abada? Wannan aikin ba za a iya dawo da shi ba!`,
      [
        { text: "Fasa (Cancel)", style: "cancel" },
        {
          text: "Goge Har Abada",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const config = await getAuthHeaders();
              await axios.delete(`${BASE_URL}/admin/users/${userId}`, config);

              Alert.alert("An Goge", "An goge asusun gaba daya daga database.");
              setUserData(null);
            } catch (err) {
              Alert.alert("Kuskure", err.message || "An kasa goge asusun.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (userData) handleUserSearch();
    else if (identifier) handleTrace();
    else setRefreshing(false);
  };

  // Kariya: Komawa ta tsaya a Admin Dashboard kawai ba tare da faɗawa wani dashboard ba
  const goBackToAdmin = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "AdminDashboard" }],
      })
    );
  };

  const safeNavigate = (screenName) => {
    toggleSidebar(false);
    if (!screenName || screenName === "SupportDashboard") return;
    try {
      navigation.navigate(screenName, { fromSupport: true, backScreen: "SupportDashboard" });
    } catch {
      Alert.alert("Notice", `Ana bude ${screenName}...`);
    }
  };

  const logout = async () => {
    Alert.alert("Fita daga Console", "Shin kana son rufe wannan zangon aikin?", [
      { text: "A'a", style: "cancel" },
      {
        text: "Fita (Logout)",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "token",
            "adminToken",
            "userData",
            "userRole",
            "overrideRole",
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

  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();
    if (["success", "successful", "completed", "approved"].includes(value)) {
      return COLORS.success;
    }
    if (["failed", "declined", "rejected"].includes(value)) {
      return COLORS.danger;
    }
    return COLORS.warning;
  };

  const profile = userData?.profile || userData || {};
  const recentTransactions =
    userData?.recentTransactions ||
    userData?.transactions ||
    userData?.data?.recentTransactions ||
    [];

  const stats = useMemo(() => {
    const totalAmount = traceData.reduce(
      (sum, item) => sum + Number(item?.amount || item?.totalAmount || 0),
      0
    );

    const successCount = traceData.filter((item) =>
      ["success", "successful", "completed", "approved"].includes(
        String(item?.status || "").toLowerCase()
      )
    ).length;

    return {
      total: traceData.length,
      success: successCount,
      amount: totalAmount,
    };
  }, [traceData]);

  const renderTraceItem = ({ item }) => {
    const status = item?.status || "Pending";
    const idNumber =
      item?.bvnNumber ||
      item?.ninNumber ||
      item?.identifier ||
      item?.phoneNumber ||
      item?.phone ||
      item?.reference ||
      "N/A";

    const userName =
      item?.user?.name ||
      item?.user?.fullName ||
      `${item?.user?.firstName || ""} ${item?.user?.surname || ""}`.trim() ||
      item?.customerName ||
      "Bellaj User";

    return (
      <View style={styles.recordCard}>
        <View style={styles.recordTop}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(status)}20` },
            ]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
              {String(status).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleString() : "--"}
          </Text>
        </View>

        <InfoLine label="User" value={userName} />
        <InfoLine label="ID / MSISDN" value={idNumber} />
        <InfoLine label="Service" value={item?.serviceType || item?.service || type.toUpperCase()} />
        <InfoLine label="Reference" value={item?.reference || item?.transactionId || "N/A"} />
        <InfoLine label="Kudi" value={`₦${Number(item?.amount || 0).toLocaleString()}`} />
      </View>
    );
  };

  const renderTransaction = ({ item }) => {
    const status = item?.status || "Pending";

    return (
      <View style={styles.txRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.txRef}>{item?.reference || item?.transactionId || "N/A"}</Text>
          <Text style={styles.txDate}>
            {item?.createdAt || item?.date ? new Date(item?.createdAt || item?.date).toLocaleString() : "--"}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.txAmount}>
            ₦{Number(item?.amount || item?.totalAmount || 0).toLocaleString()}
          </Text>
          <Text style={[styles.txStatus, { color: getStatusColor(status) }]}>
            {String(status).toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* TOP COMMAND HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBackToAdmin}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={() => toggleSidebar(true)}>
          <Ionicons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Customer Care Matrix</Text>
          <Text style={styles.headerSubtitle}>User tracing & support console</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="power" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={traceData}
        keyExtractor={(item, index) => item?._id || item?.id || index.toString()}
        renderItem={renderTraceItem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {/* HERO CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <MaterialCommunityIcons name="headset" size={32} color={COLORS.white} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Support Operations Center</Text>
                <Text style={styles.heroText}>
                  Binciko mai amfani, duba asusunsa, dakatar ko goge asusunsa, tare da binciko hada-hadar data da airtime a fili.
                </Text>
              </View>
            </View>

            {/* SEARCH & TRACE INPUT CARD */}
            <View style={styles.searchCard}>
              <Text style={styles.label}>Bayanin Bincike (Identifier)</Text>

              <View style={styles.inputWrapper}>
                <Ionicons name="search" size={20} color={COLORS.muted} />
                <TextInput
                  style={styles.input}
                  placeholder="Email / Phone / NIN / BVN / Ref ID"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
                {identifier ? (
                  <TouchableOpacity onPress={() => setIdentifier("")}>
                    <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.label}>Nau'in Sabis (Service Type)</Text>

              <View style={styles.serviceGrid}>
                {SERVICE_TYPES.map((service) => {
                  const active = type === service.id;

                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[styles.serviceChip, active && styles.activeServiceChip]}
                      onPress={() => setType(service.id)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={service.icon}
                        size={16}
                        color={active ? COLORS.white : COLORS.primary}
                      />
                      <Text style={[styles.serviceChipText, active && styles.activeServiceChipText]}>
                        {service.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ACTION BUTTONS (SEARCH & TRACE) */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                  onPress={handleUserSearch}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="person-search" size={18} color={COLORS.white} />
                      <Text style={styles.actionText}>Search User</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: COLORS.secondary }]}
                  onPress={handleTrace}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="database-search" size={18} color={COLORS.white} />
                      <Text style={styles.actionText}>Trace Records</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* SASHIN SAKAMAKON MAI AMFANI (USER PROFILE DETAILS) */}
            {userData && (
              <View style={styles.userSection}>
                <View style={styles.profileCard}>
                  <View style={styles.profileIcon}>
                    <Ionicons name="person" size={28} color={COLORS.white} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>
                      {profile?.name ||
                        `${profile?.firstName || ""} ${profile?.surname || ""}`.trim() ||
                        "Bellaj Subscriber"}
                    </Text>
                    <Text style={styles.profileEmail}>✉️ {profile?.email || "No email"}</Text>
                    <Text style={styles.profileSub}>📞 {profile?.phone || "No phone"}</Text>
                    <Text style={styles.profileSub}>
                      📍 {profile?.lga || "LGA"}, {profile?.state || "State"} • Role: {(profile?.role || "user").toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: profile.isSuspended ? COLORS.softRed : COLORS.softGreen },
                    ]}
                  >
                    <Text
                      style={{
                        color: profile.isSuspended ? COLORS.danger : COLORS.secondary,
                        fontSize: 10,
                        fontWeight: "900",
                      }}
                    >
                      {profile.isSuspended ? "SUSPENDED" : "ACTIVE"}
                    </Text>
                  </View>
                </View>

                {/* INLINE ACTIONS GA WANNAN MAI AMFANIN */}
                <View style={styles.userActionButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.userInlineBtn,
                      { backgroundColor: profile.isSuspended ? COLORS.secondary : COLORS.warning },
                    ]}
                    onPress={() => handleToggleSuspension(profile)}
                    disabled={actionLoading}
                  >
                    <MaterialCommunityIcons
                      name={profile.isSuspended ? "account-check" : "account-cancel"}
                      size={16}
                      color={COLORS.white}
                    />
                    <Text style={styles.userInlineBtnText}>
                      {profile.isSuspended ? "Unsuspend Account" : "Suspend Account"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.userInlineBtn, { backgroundColor: COLORS.danger }]}
                    onPress={() => handlePermanentDelete(profile)}
                    disabled={actionLoading}
                  >
                    <Ionicons name="trash-bin-outline" size={16} color={COLORS.white} />
                    <Text style={styles.userInlineBtnText}>Delete Forever</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.statsGrid}>
                  <StatCard label="Phone" value={profile?.phone || "N/A"} />
                  <StatCard
                    label="Wallet Balance"
                    value={`₦${Number(profile?.walletBalance || profile?.balance || 0).toLocaleString()}`}
                  />
                </View>

                <Text style={styles.sectionTitle}>Recent Account Transactions</Text>

                {recentTransactions.length === 0 ? (
                  <View style={styles.emptyMini}>
                    <Text style={styles.emptyText}>Babu tarihin kwanan nan na wannan asusun.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={recentTransactions}
                    keyExtractor={(item, index) => item?._id || item?.id || index.toString()}
                    renderItem={renderTransaction}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}

            {/* TRACE SUMMARY METRICS */}
            {traceData.length > 0 && (
              <>
                <View style={styles.statsGrid}>
                  <StatCard label="Jimilla" value={stats.total} />
                  <StatCard label="Nasara" value={stats.success} />
                  <StatCard label="Kudin Sabis" value={`₦${Number(stats.amount || 0).toLocaleString()}`} />
                </View>

                <Text style={styles.sectionTitle}>{type.toUpperCase()} Trace Ledger</Text>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          !userData && !loading ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="database-search-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Babu Sakamakon Tabbatarwa</Text>
              <Text style={styles.emptyText}>
                Saka lambar waya, email, ko reference ID domin bincike ko gano ainihin hada-hadar mai amfani.
              </Text>
            </View>
          ) : null
        }
      />

      {/* ============================================================= */}
      {/* SIDEBAR DRAWER COMPONENT (MODERN & CONNECTED) */}
      {/* ============================================================= */}
      {sidebarOpen && (
        <TouchableOpacity
          style={styles.sidebarBackdrop}
          activeOpacity={1}
          onPress={() => toggleSidebar(false)}
        >
          <Animated.View
            style={[
              styles.sidebarContainer,
              { width: sidebarWidth, transform: [{ translateX: sidebarAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarBrandRow}>
                <View style={styles.sidebarBadgeBox}>
                  <MaterialCommunityIcons name="shield-crown" size={24} color={COLORS.white} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.sidebarBrandTitle}>Bellaj Data Hub</Text>
                  <Text style={styles.sidebarBrandTag}>Executive Support Console</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleSidebar(false)} style={styles.sidebarCloseBtn}>
                <Feather name="x" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.sidebarSectionTitle}>Governance & Operations</Text>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("AdminDashboard")}
              >
                <MaterialCommunityIcons name="view-dashboard-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Operations Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("AdminControlScreen")}
              >
                <MaterialCommunityIcons name="shield-account-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Global Admin Matrix</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sidebarMenuItem, styles.sidebarMenuItemActive]}
                onPress={() => toggleSidebar(false)}
              >
                <MaterialCommunityIcons name="headset" size={18} color={COLORS.white} />
                <Text style={[styles.sidebarMenuText, styles.sidebarMenuTextActive]}>
                  Support & Tracing Desk
                </Text>
              </TouchableOpacity>

              <Text style={styles.sidebarSectionTitle}>Field & Transactions</Text>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("SalesHistory")}
              >
                <MaterialCommunityIcons name="receipt-text-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Transaction Ledger</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("ManageAgents")}
              >
                <MaterialCommunityIcons name="account-tie-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Supervisors & Agents</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("NIMCRequests")}
              >
                <MaterialCommunityIcons name="fingerprint" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>NIMC Queue</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.sidebarLogoutBtn} onPress={logout}>
                <Feather name="log-out" size={18} color="#FCA5A5" />
                <Text style={styles.sidebarLogoutText}>Sign Out of Support Console</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const InfoLine = ({ label, value }) => (
  <View style={styles.infoLine}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

const StatCard = ({ label, value }) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

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
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 14, paddingBottom: 90 },

  heroCard: {
    backgroundColor: COLORS.card,
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
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroTitle: { color: COLORS.dark, fontSize: 16, fontWeight: "900" },
  heroText: { color: COLORS.muted, marginTop: 4, lineHeight: 18, fontSize: 12, fontWeight: "600" },

  searchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputWrapper: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 48,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: COLORS.dark,
    fontSize: 13.5,
    fontWeight: "700",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  serviceChip: {
    backgroundColor: COLORS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeServiceChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  serviceChipText: { color: COLORS.muted, fontWeight: "800", fontSize: 11 },
  activeServiceChipText: { color: COLORS.white },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionText: { color: COLORS.white, fontWeight: "900", fontSize: 13 },

  userSection: { marginBottom: 14 },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  profileName: { color: COLORS.dark, fontWeight: "900", fontSize: 15 },
  profileEmail: { color: COLORS.primary, marginTop: 2, fontWeight: "700", fontSize: 12 },
  profileSub: { color: COLORS.muted, marginTop: 2, fontSize: 11, fontWeight: "600" },

  userActionButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  userInlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  userInlineBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  statLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  statValue: { color: COLORS.dark, fontWeight: "900", fontSize: 15, marginTop: 3 },
  sectionTitle: { color: COLORS.dark, fontSize: 15, fontWeight: "900", marginBottom: 10, marginTop: 6 },
  txRow: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    flexDirection: "row",
  },
  txRef: { color: COLORS.dark, fontWeight: "800", fontSize: 12 },
  txDate: { color: COLORS.muted, fontSize: 10.5, marginTop: 2 },
  txAmount: { color: COLORS.secondary, fontWeight: "900", fontSize: 13 },
  txStatus: { fontSize: 10, fontWeight: "800", marginTop: 2 },

  recordCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 10,
  },
  recordTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 9.5, fontWeight: "900" },
  dateText: { color: COLORS.muted, fontSize: 10.5, fontWeight: "600" },
  infoLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: 1, borderTopColor: COLORS.light },
  infoLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  infoValue: { color: COLORS.dark, fontSize: 12, fontWeight: "800" },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10,
  },
  emptyMini: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  emptyTitle: { color: COLORS.dark, fontSize: 16, fontWeight: "900", marginTop: 10 },
  emptyText: { color: COLORS.muted, textAlign: "center", marginTop: 4, fontSize: 12, fontWeight: "600" },

  // SIDEBAR STYLES
  sidebarBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    zIndex: 999,
  },
  sidebarContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.sidebarBg,
    paddingTop: Platform.OS === "android" ? 44 : 26,
    borderRightWidth: 1,
    borderRightColor: COLORS.sidebarBorder,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sidebarBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sidebarBrandRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  sidebarBadgeBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarBrandTitle: { color: COLORS.white, fontSize: 15, fontWeight: "900" },
  sidebarBrandTag: { color: "#86EFAC", fontSize: 10, fontWeight: "600", marginTop: 2 },
  sidebarCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sidebarScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  sidebarSectionTitle: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
    textTransform: "uppercase",
    paddingHorizontal: 6,
  },
  sidebarMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  sidebarMenuItemActive: { backgroundColor: "rgba(22, 163, 74, 0.22)" },
  sidebarMenuText: { color: "#CBD5E1", fontSize: 12.5, fontWeight: "700", marginLeft: 10 },
  sidebarMenuTextActive: { color: COLORS.white, fontWeight: "900" },
  sidebarFooter: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.sidebarBorder,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sidebarLogoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(220, 38, 38, 0.16)",
  },
  sidebarLogoutText: { color: "#FCA5A5", fontSize: 12, fontWeight: "800", marginLeft: 8 },
});

export default SupportDashboard;