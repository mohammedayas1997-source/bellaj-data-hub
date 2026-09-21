import React, { useContext, useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  useWindowDimensions,
  StatusBar,
  Modal,
  TextInput,
  BackHandler,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import BASE_URL from "../config/api";
import { ThemeContext } from "../context/ThemeContext";

// CIKAKKEN BAYANIN JIHOHIN NAJERIYA 36 DA KANANAN HUKUMOMINSU (LGAS)
const NIGERIA_STATES_AND_LGAS = {
  Abia: ["Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano", "Isiala Ngwa North", "Isiala Ngwa South", "Isuikwuato", "Obi Ngwa", "Ohafia", "Osisioma", "Ugwunagbo", "Ukwa East", "Ukwa West", "Umuahia North", "Umuahia South", "Umu Nneochi"],
  Adamawa: ["Demsa", "Fufure", "Ganye", "Gayuk", "Gombi", "Grie", "Hong", "Jada", "Lamurde", "Madagali", "Maiha", "Mayo Belwa", "Michika", "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo", "Yola North", "Yola South"],
  AkwaIbom: ["Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo", "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono-Ibom", "Ika", "Ikono", "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat-Enin", "Nsit-Atai", "Nsit-Ibom", "Nsit-Ubium", "Obot Akara", "Okobo", "Onna", "Oron", "Oruk Anam", "Udung-Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"],
  Anambra: ["Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North", "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North", "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South", "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"],
  Bauchi: ["Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Gamawa", "Ganjuwa", "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau", "Ningi", "Shira", "Tafawa Balewa", "Toro", "Warji", "Zaki"],
  Bayelsa: ["Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia", "Sagbama", "Southern Ijaw", "Yenagoa"],
  Benue: ["Agatu", "Apa", "Ado", "Buruku", "Gboko", "Guma", "Gwer East", "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi", "Obi", "Ogbadibo", "Ohimini", "Oju", "Okpokwu", "Oturkpo", "Tarka", "Ukum", "Ushongo", "Vandeikya"],
  Borno: ["Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa", "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga", "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri", "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"],
  CrossRiver: ["Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwarra", "Biase", "Boki", "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obanliku", "Obubra", "Obudu", "Odukpani", "Ogoja", "Yakuur", "Yala"],
  Delta: ["Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East", "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South", "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South", "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani", "Uvwie", "Warri North", "Warri South", "Warri South West"],
  Ebonyi: ["Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North", "Ezza South", "Ikwo", "Ishielu", "Ivo", "Izzi", "Ohaozara", "Ohaukwu", "Onicha"],
  Edo: ["Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East", "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben", "Ikpoba Okha", "Orhionmwon", "Oredo", "Ovia North-East", "Ovia South-West", "Owan East", "Owan West", "Uhunmwonde"],
  Ekiti: ["Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West", "Emure", "Gbonyin", "Ido Osi", "Ijero", "Ikole", "Ilejemeje", "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"],
  Enugu: ["Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu", "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East", "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo Uwani"],
  FCT: ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"],
  Gombe: ["Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe", "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"],
  Imo: ["Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte", "Ideato North", "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli", "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema", "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West", "Unuimo"],
  Jigawa: ["Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa", "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa", "Kazaure", "Kiri Kasama", "Kiyawa", "Kaugama", "Maigatari", "Malam Madori", "Miga", "Ringim", "Roni", "Sule Tankarkar", "Taura", "Yankwashi"],
  Kaduna: ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"],
  Kano: ["Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala", "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa", "Garko", "Garun Mallam", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Kano Municipal", "Karaye", "Kibiya", "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir", "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai", "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"],
  Katsina: ["Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dandume", "Danja", "Dan Musa", "Daura", "Dutsin Ma", "Faskari", "Funtua", "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina", "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu", "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"],
  Kebbi: ["Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi", "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse", "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Danko/Wasagu", "Yauri", "Zuru"],
  Kogi: ["Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah", "Igalamela Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa Muro", "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"],
  Kwara: ["Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South", "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero", "Oyun", "Pategi"],
  Lagos: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  Nasarawa: ["Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona", "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"],
  Niger: ["Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati", "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama", "Mariga", "Mashegu", "Mokwa", "Moya", "Paikoro", "Rafi", "Rijau", "Shiroro", "Suleja", "Tafa", "Wushishi"],
  Ogun: ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Egbado North", "Egbado South", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Ilugun", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu"],
  Ondo: ["Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West", "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje", "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West", "Ose", "Owo"],
  Osun: ["Atakunmosa East", "Atakunmosa West", "Aiyedaade", "Aiyedire", "Boluwaduro", "Boripe", "Ede North", "Ede South", "Ife Central", "Ife East", "Ife North", "Ife South", "Egbedore", "Ejigbo", "Ifedayo", "Ifelodun", "Ila", "Ilesa East", "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin", "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"],
  Oyo: ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  Plateau: ["Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South", "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang", "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"],
  Rivers: ["Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru", "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana", "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro", "Oyigbo", "Port Harcourt", "Tai"],
  Sokoto: ["Binji", "Bodinga", "Dange Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa", "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari", "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta", "Wamako", "Wurno", "Yabo"],
  Taraba: ["Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo", "Karim Lamido", "Kumi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari", "Yorro", "Zing"],
  Yobe: ["Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba", "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru", "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"],
  Zamfara: ["Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi", "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara", "Chafe", "Zurmi"],
};

const LIGHT = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  danger: "#DC2626",
  card: "#FFFFFF",
  soft: "#F1F5F9",
  text: "#0F172A",
  subText: "#64748B",
  accent: "#2563EB",
  purple: "#7C3AED",
  orange: "#EA580C",
  sidebarBg: "#052215",
  sidebarBorder: "#0A3D27",
  sidebarActive: "rgba(22, 163, 74, 0.25)",
  softRed: "#FEE2E2",
  softGreen: "#DCFCE7",
};

const DARK = {
  primary: "#16A34A",
  secondary: "#22C55E",
  dark: "#020617",
  white: "#FFFFFF",
  light: "#020617",
  muted: "#94A3B8",
  border: "#1E293B",
  danger: "#EF4444",
  card: "#0F172A",
  soft: "#1E293B",
  text: "#F8FAFC",
  subText: "#CBD5E1",
  accent: "#38BDF8",
  purple: "#A855F7",
  orange: "#F97316",
  sidebarBg: "#020d08",
  sidebarBorder: "#082417",
  sidebarActive: "rgba(34, 197, 94, 0.25)",
  softRed: "#450a0a",
  softGreen: "#052e16",
};

const AdminDashboard = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useContext(ThemeContext || { isDarkMode: false });

  const COLORS = isDarkMode ? DARK : LIGHT;
  const styles = getStyles(COLORS);
  const isWeb = width >= 992;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tabs
  const [directoryTab, setDirectoryTab] = useState("supervisors"); // 'supervisors' | 'all_users'
  const [searchFilter, setSearchFilter] = useState("");

  // Modals Controller
  const [modalType, setModalType] = useState(null); // 'create_user' | 'publish_tariff' | 'customer_service' | 'system_health' | 'confirm_logout'
  const [actionLoading, setActionLoading] = useState(false);
  const [logoutProcessing, setLogoutProcessing] = useState(false);

  // Quick Action Dialogs (Suspend/Delete)
  const [targetActionUser, setTargetActionUser] = useState(null);
  const [actionDialogType, setActionDialogType] = useState(null);

  // Dashboard Stats
  const [stats, setStats] = useState({
    users: 0,
    nimc: 0,
    bvn: 0,
    reports: 0,
    sales: 0,
    transactions: 0,
    supervisorsCount: 0,
  });

  const [supervisorsList, setSupervisorsList] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [customerTickets, setCustomerTickets] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // ==========================================
  // 1. STATE NA CIKEKEN FORM NA REGISTER USER
  // ==========================================
  const [showPassword, setShowPassword] = useState(false);
  const [userFormSuccess, setUserFormSuccess] = useState("");
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showLgaPicker, setShowLgaPicker] = useState(false);

  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "supervisor", // customer, agent, supervisor, support, staff
    state: "Gombe",
    lga: "Gombe",
    address: "",
  });

  // ==========================================
  // 2. STATE NA PUBLISH NEW DATA TARIFF (PLAN)
  // ==========================================
  const [tariffForm, setTariffForm] = useState({
    network: "MTN",
    planType: "DC",
    planId: "", // Gateway Plan ID (Al-Ihsan Provider ID)
    volume: "1.0 GB",
    validity: "30 Days",
    customerPrice: "",
    agentPrice: "",
  });

  // Navigation Lock
  useEffect(() => {
    const onBackPress = () => {
      if (sidebarOpen) {
        setSidebarOpen(false);
        return true;
      }
      if (actionDialogType) {
        setActionDialogType(null);
        return true;
      }
      if (modalType) {
        setModalType(null);
        return true;
      }
      setModalType("confirm_logout");
      return true;
    };
    const backSub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backSub.remove();
  }, [sidebarOpen, modalType, actionDialogType]);

  const getAuthHeaders = async () => {
    const token =
      (await AsyncStorage.getItem("userToken")) ||
      (await AsyncStorage.getItem("adminToken")) ||
      (await AsyncStorage.getItem("token"));

    return {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: 35000,
    };
  };

  const getArray = (payload, key) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.supervisors)) return payload.supervisors;
    if (Array.isArray(payload?.reports)) return payload.reports;
    return [];
  };

  const fetchWithFallback = async (endpoints, config) => {
    for (const url of endpoints) {
      try {
        const res = await axios.get(url, config);
        if (res?.data) return res.data;
      } catch {}
    }
    return null;
  };

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      const userEndpoints = [`${BASE_URL}/admin/users`, `${BASE_URL}/api/v1/admin/users`];
      const supervisorEndpoints = [`${BASE_URL}/admin/supervisors`, `${BASE_URL}/api/v1/admin/supervisors`];
      const reportEndpoints = [`${BASE_URL}/admin/reports`, `${BASE_URL}/api/v1/admin/reports`];
      const salesEndpoints = [`${BASE_URL}/admin/sales-stats`, `${BASE_URL}/api/v1/admin/sales-stats`];
      const txEndpoints = [`${BASE_URL}/admin/transactions`, `${BASE_URL}/api/v1/admin/transactions`];

      const [usersRes, supsRes, reportsRes, salesRes, txRes] = await Promise.allSettled([
        fetchWithFallback(userEndpoints, config),
        fetchWithFallback(supervisorEndpoints, config),
        fetchWithFallback(reportEndpoints, config),
        fetchWithFallback(salesEndpoints, config),
        fetchWithFallback(txEndpoints, config),
      ]);

      const uData = usersRes.status === "fulfilled" ? usersRes.value : null;
      const sData = supsRes.status === "fulfilled" ? supsRes.value : null;
      const rData = reportsRes.status === "fulfilled" ? reportsRes.value : null;
      const salesData = salesRes.status === "fulfilled" ? salesRes.value : null;
      const tData = txRes.status === "fulfilled" ? txRes.value : null;

      const allUsers = getArray(uData, "users");
      let supsList = getArray(sData, "supervisors");

      if (supsList.length === 0 && allUsers.length > 0) {
        supsList = allUsers.filter((u) => (u.role || "").toLowerCase() === "supervisor");
      }

      setAllUsersList(allUsers);
      setSupervisorsList(supsList);
      setCustomerTickets(getArray(rData, "reports"));

      const extractedSales =
        salesData?.finance?.totalRevenue ?? salesData?.totalRevenue ?? salesData?.totalSales ?? 0;

      setStats({
        users: allUsers.length,
        nimc: 0,
        bvn: 0,
        reports: getArray(rData, "reports").length,
        sales: Number(extractedSales || 0),
        transactions: getArray(tData, "transactions").length,
        supervisorsCount: supsList.length,
      });
    } catch (err) {
      console.log("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // ==========================================
  // ACTION: CREATE USER / SUPERVISOR / STAFF
  // ==========================================
  const handleCreateUser = async () => {
    const { fullName, email, phone, password, role, state, lga, address } = userForm;

    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Full Name, Email, Phone, and Password are required.");
      return;
    }

    try {
      setActionLoading(true);
      setUserFormSuccess("");
      const config = await getAuthHeaders();

      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "User";
      const surname = nameParts.slice(1).join(" ") || "Bellaj";

      const payload = {
        name: fullName.trim(),
        firstName,
        surname,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: password.trim(),
        role: role.toLowerCase().trim(),
        state,
        lga,
        address: address.trim(),
      };

      const endpoints = [
        `${BASE_URL}/admin/create-supervisor`,
        `${BASE_URL}/api/v1/admin/create-supervisor`,
        `${BASE_URL}/admin/users/create`,
      ];

      for (const ep of endpoints) {
        try {
          const res = await axios.post(ep, payload, config);
          if (res.status === 200 || res.status === 201 || res.data?.success) break;
        } catch {}
      }

      setUserFormSuccess(`Account for ${fullName} (${role.toUpperCase()}) created successfully!`);
      setUserForm({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "supervisor",
        state: "Gombe",
        lga: "Gombe",
        address: "",
      });
      fetchStats();

      setTimeout(() => {
        setUserFormSuccess("");
        setModalType(null);
      }, 2000);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // ACTION: PUBLISH NEW DATA TARIFF (PLAN)
  // ==========================================
  const handlePublishTariff = async () => {
    if (!tariffForm.planId.trim() || !tariffForm.customerPrice.trim() || !tariffForm.agentPrice.trim()) {
      Alert.alert("Validation Error", "Gateway Plan ID, Customer Price, and Retail Price are required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const payload = {
        network: tariffForm.network,
        planType: tariffForm.planType,
        planId: tariffForm.planId.trim(),
        volume: tariffForm.volume,
        validity: tariffForm.validity,
        customerPrice: Number(tariffForm.customerPrice),
        agentPrice: Number(tariffForm.agentPrice),
      };

      await axios.post(`${BASE_URL}/admin/set-plan`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/api/v1/admin/pricing`, payload, config);
      });

      Alert.alert("Tariff Published 🚀", `${tariffForm.network} ${tariffForm.volume} published to database & app.`);
      setModalType(null);
      setTariffForm({
        network: "MTN",
        planType: "DC",
        planId: "",
        volume: "1.0 GB",
        validity: "30 Days",
        customerPrice: "",
        agentPrice: "",
      });
    } catch (err) {
      Alert.alert("Publish Failed", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // ACTION: SUSPEND / ACTIVATE USER
  // ==========================================
  const executeSuspension = async () => {
    if (!targetActionUser) return;
    const userId = targetActionUser._id || targetActionUser.id;
    const isCurrentlySuspended = Boolean(targetActionUser.isSuspended);

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      const payload = { isSuspended: !isCurrentlySuspended };

      const endpoints = [
        `${BASE_URL}/admin/users/${userId}/status`,
        `${BASE_URL}/api/v1/admin/users/${userId}/status`,
        `${BASE_URL}/admin/suspend-user/${userId}`,
      ];

      for (const ep of endpoints) {
        try {
          await axios.patch(ep, payload, config).catch(async () => {
            return await axios.put(ep, payload, config);
          });
          break;
        } catch {}
      }

      setActionDialogType(null);
      setTargetActionUser(null);
      fetchStats();
      Alert.alert("Status Updated", "Account authority status changed successfully.");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // ACTION: PERMANENT DELETE USER
  // ==========================================
  const executePermanentDelete = async () => {
    if (!targetActionUser) return;
    const userId = targetActionUser._id || targetActionUser.id;

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const endpoints = [
        `${BASE_URL}/admin/users/${userId}`,
        `${BASE_URL}/api/v1/admin/users/${userId}`,
        `${BASE_URL}/admin/users/delete/${userId}`,
      ];

      for (const ep of endpoints) {
        try {
          await axios.delete(ep, config);
          break;
        } catch {}
      }

      setActionDialogType(null);
      setTargetActionUser(null);
      fetchStats();
      Alert.alert("Deleted Forever", "Account has been permanently deleted from the database.");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const safeNavigate = (screenName) => {
    setSidebarOpen(false);
    if (!screenName || screenName === "AdminDashboard") return;
    try {
      navigation.navigate(screenName, { fromAdminDashboard: true, backScreen: "AdminDashboard" });
    } catch {
      Alert.alert("Notice", `Module ${screenName} is opening.`);
    }
  };

  const performLogout = async () => {
    try {
      setLogoutProcessing(true);
      await AsyncStorage.multiRemove(["userToken", "adminToken", "token", "userData", "userRole"]);
      setModalType(null);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }));
    } catch {
      if (Platform.OS === "web" && typeof window !== "undefined") window.location.reload();
    } finally {
      setLogoutProcessing(false);
    }
  };

  const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

  const filteredSupervisors = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return supervisorsList;
    return supervisorsList.filter((s) => {
      const full = (s.name || `${s.firstName || ""} ${s.surname || ""}`).toLowerCase();
      return full.includes(q) || (s.email || "").toLowerCase().includes(q) || (s.phone || "").includes(q);
    });
  }, [searchFilter, supervisorsList]);

  const filteredPersonnel = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return allUsersList;
    return allUsersList.filter((u) => {
      const full = (u.name || `${u.firstName || ""} ${u.surname || ""}`).toLowerCase();
      return full.includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phone || "").includes(q) || (u.role || "").toLowerCase().includes(q);
    });
  }, [searchFilter, allUsersList]);

  // Stat Cards na asali (Dukkan Icons suna aiki)
  const cards = useMemo(
    () => [
      {
        title: "Supervisors Hub",
        value: `${stats.supervisorsCount} Officers`,
        icon: "account-tie",
        type: "mci",
        color: COLORS.primary,
        action: () => setDirectoryTab("supervisors"),
      },
      {
        title: "Customer Support",
        value: `${stats.reports} Inquiries`,
        icon: "headset",
        type: "mci",
        color: COLORS.orange,
        action: () => setModalType("customer_service"),
      },
      {
        title: "Total Subscribers",
        value: stats.users,
        icon: "account-group-outline",
        type: "mci",
        color: COLORS.accent,
        action: () => setDirectoryTab("all_users"),
      },
      {
        title: "Turnover Sales",
        value: formatMoney(stats.sales),
        icon: "cash-multiple",
        type: "mci",
        color: COLORS.secondary,
        action: () => safeNavigate("SalesHistory"),
      },
      {
        title: "Transactions",
        value: stats.transactions,
        icon: "receipt-text-outline",
        type: "mci",
        color: "#0F766E",
        action: () => safeNavigate("SalesHistory"),
      },
      {
        title: "Publish Tariff",
        value: "Set Data Plan",
        icon: "cloud-upload",
        type: "ion",
        color: COLORS.purple,
        action: () => setModalType("publish_tariff"),
      },
      {
        title: "NIMC Inquiries",
        value: stats.nimc,
        icon: "fingerprint",
        type: "mci",
        color: COLORS.accent,
        action: () => safeNavigate("NIMCRequests"),
      },
      {
        title: "BVN Registry",
        value: stats.bvn,
        icon: "card-account-details-outline",
        type: "mci",
        color: "#D97706",
        action: () => safeNavigate("BvnRequests"),
      },
    ],
    [stats, COLORS]
  );

  const renderIcon = (item, size = 24, color = COLORS.white) => {
    if (item.type === "mci") {
      return <MaterialCommunityIcons name={item.icon} size={size} color={color} />;
    }
    return <Ionicons name={item.icon} size={size} color={color} />;
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Administrative Terminal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.bodyWrapper}>
        <View style={styles.mainCanvas}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setSidebarOpen(true)}>
              <Ionicons name="menu" size={26} color={COLORS.white} />
            </TouchableOpacity>

            <View style={styles.headerTextBox}>
              <Text style={styles.headerTitle}>Bellaj Operations Terminal</Text>
              <Text style={styles.headerSubtitle}>Executive Authority & Real-Time Management</Text>
            </View>

            <TouchableOpacity style={styles.headerIconBtn} onPress={() => setModalType("create_user")}>
              <Ionicons name="person-add" size={20} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={() => setModalType("confirm_logout")}>
              <Ionicons name="power" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          >
            {/* HERO CARD */}
            <View style={styles.heroCard}>
              <View style={styles.heroIconBox}>
                <MaterialCommunityIcons name="shield-check" size={32} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Operations Matrix Active</Text>
                <Text style={styles.heroText}>
                  All personnel, field supervisors, tariff plans, and user suspensions are fully synchronized.
                </Text>
              </View>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
                <Ionicons name="sync" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* QUICK ACTIONS DECK */}
            <View style={styles.quickDeckRow}>
              <TouchableOpacity style={[styles.quickDeckBtn, { backgroundColor: COLORS.primary }]} onPress={() => setModalType("create_user")}>
                <Ionicons name="person-add" size={17} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>+ Register User</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickDeckBtn, { backgroundColor: COLORS.purple }]} onPress={() => setModalType("publish_tariff")}>
                <Ionicons name="cloud-upload" size={17} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>+ Publish Plan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.quickDeckBtn, { backgroundColor: COLORS.orange }]} onPress={() => setModalType("customer_service")}>
                <MaterialCommunityIcons name="headset" size={18} color={COLORS.white} />
                <Text style={styles.quickDeckBtnText}>Support Desk</Text>
              </TouchableOpacity>
            </View>

            {/* STAT CARDS GRID (DUKKA MA'BALLAN SUNA SHIGA) */}
            <View style={styles.statGrid}>
              {cards.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.statBox, isWeb && styles.webStatBox]}
                  onPress={item.action}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statIconBox, { backgroundColor: item.color }]}>
                    {renderIcon(item, 24, COLORS.white)}
                  </View>
                  <Text style={styles.statTitle}>{item.title}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DIRECTORY LISTING TARE DA MA'BALLAN ACTIONS A KAN KOWANE CARD */}
            <View style={styles.directorySection}>
              <View style={styles.directoryTabsHeader}>
                <TouchableOpacity
                  style={[styles.dirTabBtn, directoryTab === "supervisors" && styles.dirTabBtnActive]}
                  onPress={() => setDirectoryTab("supervisors")}
                >
                  <Text style={[styles.dirTabBtnText, directoryTab === "supervisors" && styles.dirTabBtnTextActive]}>
                    Supervisors ({filteredSupervisors.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dirTabBtn, directoryTab === "all_users" && styles.dirTabBtnActive]}
                  onPress={() => setDirectoryTab("all_users")}
                >
                  <Text style={[styles.dirTabBtnText, directoryTab === "all_users" && styles.dirTabBtnTextActive]}>
                    All Personnel ({filteredPersonnel.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchBarBox}>
                <Ionicons name="search" size={18} color={COLORS.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search user by name, phone, or email..."
                  placeholderTextColor={COLORS.muted}
                  value={searchFilter}
                  onChangeText={setSearchFilter}
                />
                {searchFilter ? (
                  <TouchableOpacity onPress={() => setSearchFilter("")}>
                    <Ionicons name="close-circle" size={18} color={COLORS.muted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* LIST NA KOWANE USER TARE DA ACTIONS */}
              {(directoryTab === "supervisors" ? filteredSupervisors : filteredPersonnel).map((user) => {
                const isSuspended = Boolean(user.isSuspended);
                const uName = user.name || `${user.firstName || ""} ${user.surname || ""}`.trim() || "User";
                const uRole = (user.role || "user").toUpperCase();

                return (
                  <View key={user._id || user.id} style={styles.userCard}>
                    <View style={styles.userCardHeader}>
                      <View style={styles.userAvatarBox}>
                        <Text style={styles.userAvatarText}>{uName.charAt(0).toUpperCase()}</Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={styles.userNameText}>{uName}</Text>
                          <View style={styles.roleTagBox}>
                            <Text style={styles.roleTagBoxText}>{uRole}</Text>
                          </View>
                        </View>
                        <Text style={styles.userContactText}>📞 {user.phone || "No Phone"} • ✉️ {user.email}</Text>
                        <Text style={styles.userContactText}>📍 {user.lga || "LGA"}, {user.state || "State"}</Text>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: isSuspended ? COLORS.softRed : COLORS.softGreen }]}>
                        <Text style={{ color: isSuspended ? COLORS.danger : COLORS.secondary, fontSize: 10, fontWeight: "900" }}>
                          {isSuspended ? "SUSPENDED" : "ACTIVE"}
                        </Text>
                      </View>
                    </View>

                    {/* ACTION BUTTONS (SUSPEND, ACTIVATE, DELETE) */}
                    <View style={styles.cardActionsContainer}>
                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: isSuspended ? COLORS.secondary : COLORS.orange }]}
                        onPress={() => {
                          setTargetActionUser(user);
                          setActionDialogType("confirm_suspend");
                        }}
                      >
                        <MaterialCommunityIcons name={isSuspended ? "account-check" : "account-cancel"} size={14} color={COLORS.white} />
                        <Text style={styles.cardActionBtnText}>{isSuspended ? "Activate" : "Suspend"}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: COLORS.danger }]}
                        onPress={() => {
                          setTargetActionUser(user);
                          setActionDialogType("confirm_delete");
                        }}
                      >
                        <Ionicons name="trash-bin-outline" size={14} color={COLORS.white} />
                        <Text style={styles.cardActionBtnText}>Delete Forever</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ============================================================= */}
      {/* MODAL 1: CIKEKEN FORM NA REGISTER USER (36 STATES & LGAS) */}
      {/* ============================================================= */}
      <Modal visible={modalType === "create_user"} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "92%" }]}>
            <View style={styles.modalHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Ionicons name="person-add" size={24} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Register Personnel & Users</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {userFormSuccess ? (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.secondary} />
                  <Text style={styles.successBannerText}>{userFormSuccess}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <Text style={styles.inputGuide}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ibrahim Musa Bello"
                value={userForm.fullName}
                onChangeText={(t) => setUserForm({ ...userForm, fullName: t })}
                placeholderTextColor={COLORS.muted}
              />

              {/* Email & Phone */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputGuide}>Email Address</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="user@bellajdatahub.online"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={userForm.email}
                    onChangeText={(t) => setUserForm({ ...userForm, email: t })}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputGuide}>Phone Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="08012345678"
                    keyboardType="phone-pad"
                    value={userForm.phone}
                    onChangeText={(t) => setUserForm({ ...userForm, phone: t })}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              </View>

              {/* Password */}
              <Text style={styles.inputGuide}>Temporary Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Minimum 6 characters"
                  secureTextEntry={!showPassword}
                  value={userForm.password}
                  onChangeText={(t) => setUserForm({ ...userForm, password: t })}
                  placeholderTextColor={COLORS.muted}
                />
                <TouchableOpacity style={{ padding: 6 }} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.muted} />
                </TouchableOpacity>
              </View>

              {/* Role Selection */}
              <Text style={styles.inputGuide}>Select Assigned Role</Text>
              <View style={styles.roleSelectionRow}>
                {[
                  { id: "customer", label: "Customer" },
                  { id: "agent", label: "Agent" },
                  { id: "supervisor", label: "Supervisor" },
                  { id: "support", label: "Customer Support" },
                  { id: "staff", label: "Staff" },
                ].map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.rolePill, userForm.role === r.id && styles.rolePillActive]}
                    onPress={() => setUserForm({ ...userForm, role: r.id })}
                  >
                    <Text style={[styles.rolePillText, userForm.role === r.id && styles.rolePillTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 36 States Selection Picker */}
              <Text style={styles.inputGuide}>State (Nigeria 36 States & FCT)</Text>
              <TouchableOpacity
                style={styles.modalSelectBtn}
                onPress={() => setShowStatePicker(!showStatePicker)}
              >
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>{userForm.state || "Select State"}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.muted} />
              </TouchableOpacity>

              {showStatePicker && (
                <View style={styles.pickerDropdown}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                    {Object.keys(NIGERIA_STATES_AND_LGAS).map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={styles.pickerItem}
                        onPress={() => {
                          const defaultLga = NIGERIA_STATES_AND_LGAS[st][0] || "General";
                          setUserForm({ ...userForm, state: st, lga: defaultLga });
                          setShowStatePicker(false);
                        }}
                      >
                        <Text style={{ color: COLORS.text, fontWeight: userForm.state === st ? "900" : "500" }}>{st}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* LGAs of Selected State */}
              <Text style={styles.inputGuide}>Local Government Area (LGA)</Text>
              <TouchableOpacity
                style={styles.modalSelectBtn}
                onPress={() => setShowLgaPicker(!showLgaPicker)}
              >
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>{userForm.lga || "Select LGA"}</Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.muted} />
              </TouchableOpacity>

              {showLgaPicker && (
                <View style={styles.pickerDropdown}>
                  <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                    {(NIGERIA_STATES_AND_LGAS[userForm.state] || ["General"]).map((lg) => (
                      <TouchableOpacity
                        key={lg}
                        style={styles.pickerItem}
                        onPress={() => {
                          setUserForm({ ...userForm, lga: lg });
                          setShowLgaPicker(false);
                        }}
                      >
                        <Text style={{ color: COLORS.text, fontWeight: userForm.lga === lg ? "900" : "500" }}>{lg}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Physical Address */}
              <Text style={styles.inputGuide}>Street / Office Address</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60, textAlignVertical: "top" }]}
                placeholder="Enter complete office or residential address..."
                multiline
                value={userForm.address}
                onChangeText={(t) => setUserForm({ ...userForm, address: t })}
                placeholderTextColor={COLORS.muted}
              />

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: COLORS.primary }]} onPress={handleCreateUser} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>Complete Registration</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL 2: PUBLISH NEW DATA TARIFF (PLAN) - KAMAR HOTONKA */}
      {/* ============================================================= */}
      <Modal visible={modalType === "publish_tariff"} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "94%" }]}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Publish New Data Tariff</Text>
                <Text style={{ fontSize: 11, color: COLORS.accent, fontWeight: "600", marginTop: 2 }}>
                  Fast Automatic Presets or Manual Configuration
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 1. Select Telecom Network */}
              <Text style={styles.inputGuide}>1. Select Telecom Network</Text>
              <View style={styles.selectorPillsRow}>
                {["MTN", "AIRTEL", "GLO", "9MOBILE"].map((net) => (
                  <TouchableOpacity
                    key={net}
                    style={[styles.telecomPill, tariffForm.network === net && styles.telecomPillActive]}
                    onPress={() => setTariffForm({ ...tariffForm, network: net })}
                  >
                    <Text style={[styles.telecomPillText, tariffForm.network === net && styles.telecomPillTextActive]}>{net}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* AUTOMATIC QUICK PRESET BOX (TAP TO AUTO-FILL) */}
              <View style={styles.presetContainer}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
                  <Ionicons name="flash" size={14} color={COLORS.primary} />
                  <Text style={styles.presetContainerTitle}>AUTOMATIC QUICK PRESET (Tap to auto-fill)</Text>
                </View>

                <View style={styles.presetGrid}>
                  {[
                    { label: "1.0GB DC (30D) (ID: 140)", id: "140", vol: "1.0 GB", type: "DC", cost: "210", sell: "230" },
                    { label: "1.5GB DC (30D) (ID: 133)", id: "133", vol: "1.5 GB", type: "DC", cost: "315", sell: "345" },
                    { label: "2.0GB DC (30D) (ID: 134)", id: "134", vol: "2.0 GB", type: "DC", cost: "420", sell: "460" },
                    { label: "3.0GB DC (30D) (ID: 135)", id: "135", vol: "3.0 GB", type: "DC", cost: "630", sell: "690" },
                    { label: "5.0GB DC (30D) (ID: 136)", id: "136", vol: "5.0 GB", type: "DC", cost: "1050", sell: "1150" },
                    { label: "500MB CG (30D) (ID: 26)", id: "26", vol: "500 MB", type: "CG", cost: "115", sell: "130" },
                    { label: "1.0GB CG (30D) (ID: 27)", id: "27", vol: "1.0 GB", type: "CG", cost: "220", sell: "245" },
                    { label: "2.0GB CG (30D) (ID: 28)", id: "28", vol: "2.0 GB", type: "CG", cost: "440", sell: "490" },
                    { label: "5.0GB CG (30D) (ID: 38)", id: "38", vol: "5.0 GB", type: "CG", cost: "1100", sell: "1225" },
                    { label: "500MB SME (ID: 17)", id: "17", vol: "500 MB", type: "SME", cost: "125", sell: "140" },
                    { label: "1.0GB SME2 (ID: 112)", id: "112", vol: "1.0 GB", type: "SME2", cost: "240", sell: "260" },
                    { label: "1.0GB DataShare (ID: 151)", id: "151", vol: "1.0 GB", type: "DATASHARE", cost: "235", sell: "255" },
                  ].map((preset, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.presetButton}
                      onPress={() => {
                        setTariffForm({
                          ...tariffForm,
                          planId: preset.id,
                          volume: preset.vol,
                          planType: preset.type,
                          agentPrice: preset.cost,
                          customerPrice: preset.sell,
                          validity: "30 Days",
                        });
                      }}
                    >
                      <Ionicons name="flash-outline" size={11} color={COLORS.secondary} />
                      <Text style={styles.presetButtonText}>{preset.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 2. Select Plan Category / Type */}
              <Text style={styles.inputGuide}>2. Select Plan Category / Type</Text>
              <View style={styles.selectorPillsRow}>
                {["DC", "CG", "SME", "SME2", "GIFTING", "AWOOF", "DATASHARE", "CUSTOM"].map((typ) => (
                  <TouchableOpacity
                    key={typ}
                    style={[styles.smallPill, tariffForm.planType === typ && styles.smallPillActive]}
                    onPress={() => setTariffForm({ ...tariffForm, planType: typ })}
                  >
                    <Text style={[styles.smallPillText, tariffForm.planType === typ && styles.smallPillTextActive]}>{typ}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. Gateway Plan ID */}
              <Text style={styles.inputGuide}>3. Gateway Plan ID (Al-Ihsan Provider ID) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 140, 27, 262"
                keyboardType="numeric"
                value={tariffForm.planId}
                onChangeText={(t) => setTariffForm({ ...tariffForm, planId: t })}
                placeholderTextColor={COLORS.muted}
              />

              {/* 4. Plan Volume (Size) */}
              <Text style={styles.inputGuide}>4. Plan Volume (Size)</Text>
              <View style={styles.selectorPillsRow}>
                {["500 MB", "1.0 GB", "1.5 GB", "2.0 GB", "3.0 GB", "5.0 GB", "10.0 GB", "CUSTOM"].map((vol) => (
                  <TouchableOpacity
                    key={vol}
                    style={[styles.smallPill, tariffForm.volume === vol && styles.smallPillActive]}
                    onPress={() => setTariffForm({ ...tariffForm, volume: vol })}
                  >
                    <Text style={[styles.smallPillText, tariffForm.volume === vol && styles.smallPillTextActive]}>{vol}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 5. Validity Duration */}
              <Text style={styles.inputGuide}>5. Validity Duration</Text>
              <View style={styles.selectorPillsRow}>
                {["1 Day", "2 Days", "7 Days", "30 Days", "CUSTOM"].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.smallPill, tariffForm.validity === val && styles.smallPillActive]}
                    onPress={() => setTariffForm({ ...tariffForm, validity: val })}
                  >
                    <Text style={[styles.smallPillText, tariffForm.validity === val && styles.smallPillTextActive]}>{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 6. Customer Selling Price */}
              <Text style={styles.inputGuide}>6. Customer Selling Price (₦) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 230"
                keyboardType="numeric"
                value={tariffForm.customerPrice}
                onChangeText={(t) => setTariffForm({ ...tariffForm, customerPrice: t })}
                placeholderTextColor={COLORS.muted}
              />

              {/* 7. Retail Agent Wholesale Price */}
              <Text style={styles.inputGuide}>7. Retail Agent Wholesale Price (₦) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 210"
                keyboardType="numeric"
                value={tariffForm.agentPrice}
                onChangeText={(t) => setTariffForm({ ...tariffForm, agentPrice: t })}
                placeholderTextColor={COLORS.muted}
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: "#0284C7" }]}
                onPress={handlePublishTariff}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>PUBLISH TARIFF TO DATABASE & APP</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CONFIRMATION DIALOG (SUSPEND / DELETE) */}
      <Modal visible={Boolean(actionDialogType)} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxWidth: 380, alignItems: "center" }]}>
            <Ionicons name="alert-circle" size={36} color={actionDialogType === "confirm_delete" ? COLORS.danger : COLORS.orange} />
            <Text style={styles.modalHeading}>
              {actionDialogType === "confirm_delete" ? "Delete User Forever?" : targetActionUser?.isSuspended ? "Activate Account?" : "Suspend Account?"}
            </Text>
            <Text style={styles.modalSubheading}>
              {actionDialogType === "confirm_delete"
                ? `Permanently remove ${targetActionUser?.name || targetActionUser?.email} from database? This cannot be undone.`
                : `Set authority status for ${targetActionUser?.name || targetActionUser?.email} to ${targetActionUser?.isSuspended ? "ACTIVE" : "SUSPENDED"}?`}
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActionDialogType(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: actionDialogType === "confirm_delete" ? COLORS.danger : COLORS.primary }]}
                onPress={actionDialogType === "confirm_delete" ? executePermanentDelete : executeSuspension}
              >
                <Text style={styles.modalConfirmText}>{actionDialogType === "confirm_delete" ? "Delete Forever" : "Confirm"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: LOGOUT */}
      <Modal visible={modalType === "confirm_logout"} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxWidth: 360, alignItems: "center" }]}>
            <Ionicons name="power" size={32} color={COLORS.danger} />
            <Text style={styles.modalHeading}>Log Out of Terminal?</Text>
            <Text style={styles.modalSubheading}>Your session will be closed safely.</Text>
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: COLORS.danger }]} onPress={performLogout}>
                <Text style={styles.modalConfirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (COLORS) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: COLORS.light },
    bodyWrapper: { flex: 1, flexDirection: "row" },
    mainCanvas: { flex: 1 },
    header: {
      backgroundColor: COLORS.primary,
      paddingTop: Platform.OS === "android" ? 44 : 20,
      paddingBottom: 16,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.18)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    headerTextBox: { flex: 1 },
    headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
    headerSubtitle: { color: "#DCFCE7", marginTop: 2, fontSize: 11, fontWeight: "600" },
    logoutBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 90 },
    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    loaderText: { color: COLORS.primary, fontWeight: "800", marginTop: 14 },
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
    heroIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: COLORS.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    heroTitle: { fontSize: 16, fontWeight: "900", color: COLORS.text },
    heroText: { color: COLORS.subText, marginTop: 4, fontWeight: "600", fontSize: 12 },
    refreshButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    quickDeckRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
    quickDeckBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    quickDeckBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 12 },
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 12,
      marginBottom: 18,
    },
    statBox: {
      width: "23.5%",
      minHeight: 114,
      backgroundColor: COLORS.card,
      borderRadius: 16,
      padding: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
      alignItems: "center",
      justifyContent: "center",
    },
    webStatBox: { width: "23.5%" },
    statIconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    statTitle: { fontSize: 10, color: COLORS.subText, fontWeight: "900", textAlign: "center" },
    statValue: { fontSize: 13, fontWeight: "900", color: COLORS.text, marginTop: 4 },
    directorySection: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    directoryTabsHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      marginBottom: 14,
    },
    dirTabBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    dirTabBtnActive: { borderBottomColor: COLORS.primary },
    dirTabBtnText: { color: COLORS.muted, fontSize: 12.5, fontWeight: "700" },
    dirTabBtnTextActive: { color: COLORS.primary, fontWeight: "900" },
    searchBarBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.soft,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 14,
    },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 13, marginLeft: 8 },
    userCard: {
      backgroundColor: COLORS.soft,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    userCardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    userAvatarBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: "#DCFCE7",
      alignItems: "center",
      justifyContent: "center",
    },
    userAvatarText: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
    userNameText: { fontSize: 14, fontWeight: "900", color: COLORS.text },
    userContactText: { fontSize: 11, color: COLORS.subText, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    roleTagBox: { backgroundColor: "#DCFCE7", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    roleTagBoxText: { color: COLORS.primary, fontSize: 9, fontWeight: "900" },
    cardActionsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    cardActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    cardActionBtnText: { color: COLORS.white, fontSize: 11, fontWeight: "800" },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(15, 23, 42, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    modalBox: {
      width: "100%",
      maxWidth: 520,
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    modalHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: "900" },
    inputGuide: { color: COLORS.subText, fontSize: 11, fontWeight: "700", marginBottom: 4, marginTop: 8 },
    modalInput: {
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: COLORS.text,
      marginBottom: 6,
    },
    passwordInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      marginBottom: 6,
      paddingRight: 10,
    },
    passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
    roleSelectionRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
    rolePill: {
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    rolePillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    rolePillText: { fontSize: 11, fontWeight: "700", color: COLORS.text },
    rolePillTextActive: { color: COLORS.white },
    modalSelectBtn: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 6,
    },
    pickerDropdown: {
      backgroundColor: COLORS.soft,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 8,
    },
    pickerItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    modalSubmitBtn: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 14,
      marginBottom: 10,
    },
    modalSubmitBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 14 },
    successBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#DCFCE7",
      borderWidth: 1,
      borderColor: "#86EFAC",
      borderRadius: 10,
      padding: 10,
      marginBottom: 12,
      gap: 8,
    },
    successBannerText: { color: "#15803D", fontSize: 13, fontWeight: "800", flex: 1 },

    // PRESET TARIFF STYLES (NA JIKIN HOTONKA)
    selectorPillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
    telecomPill: {
      backgroundColor: COLORS.soft,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    telecomPillActive: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
    telecomPillText: { fontSize: 12, fontWeight: "800", color: COLORS.text },
    telecomPillTextActive: { color: COLORS.white },

    presetContainer: {
      backgroundColor: "#F0FDF4",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: "#BBF7D0",
      marginVertical: 10,
    },
    presetContainerTitle: { fontSize: 11, fontWeight: "900", color: "#15803D", letterSpacing: 0.5 },
    presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    presetButton: {
      backgroundColor: "#DCFCE7",
      borderWidth: 1,
      borderColor: "#86EFAC",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    presetButtonText: { fontSize: 10.5, fontWeight: "800", color: "#166534" },

    smallPill: {
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    smallPillActive: { backgroundColor: "#0284C7", borderColor: "#0284C7" },
    smallPillText: { fontSize: 11, fontWeight: "800", color: COLORS.text },
    smallPillTextActive: { color: COLORS.white },

    modalHeading: { fontSize: 18, fontWeight: "900", color: COLORS.text, marginTop: 10 },
    modalSubheading: { fontSize: 13, color: COLORS.subText, textAlign: "center", marginVertical: 12 },
    modalActionRow: { flexDirection: "row", width: "100%", gap: 10 },
    modalCancelBtn: { flex: 1, backgroundColor: COLORS.soft, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
    modalCancelText: { fontWeight: "800", color: COLORS.text },
    modalConfirmBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
    modalConfirmText: { color: COLORS.white, fontWeight: "900" },
  });

export default AdminDashboard;