import React, { useContext, useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  Animated,
  Switch,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from "@expo/vector-icons";
import BASE_URL from "../config/api";
import { ThemeContext } from "../context/ThemeContext";

// NIGERIA 36 STATES AND LGAS
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
  teal: "#0D9488",
  sidebarBg: "#052215",
  sidebarBorder: "#0A3D27",
  sidebarActive: "rgba(22, 163, 74, 0.25)",
  softRed: "#FEE2E2",
  softGreen: "#DCFCE7",
  softYellow: "#FEF3C7",
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
  teal: "#2DD4BF",
  sidebarBg: "#020d08",
  sidebarBorder: "#082417",
  sidebarActive: "rgba(34, 197, 94, 0.25)",
  softRed: "#450a0a",
  softGreen: "#052e16",
  softYellow: "#78350f",
};

const AdminDashboard = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const themeContext = useContext(ThemeContext);
  const isDarkMode = themeContext?.isDarkMode || false;

  const COLORS = isDarkMode ? DARK : LIGHT;
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);
  const isWeb = width >= 992;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // SIDEBAR CONTROLLER
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarWidth = isWeb ? 280 : Math.min(width * 0.82, 320);
  const sidebarAnim = useRef(new Animated.Value(-sidebarWidth)).current;

  // USER DIRECTORY TABS (CUSTOMERS, AGENTS, SUPERVISORS)
  const [activeUserTab, setActiveUserTab] = useState("customers");
  const [searchFilter, setSearchFilter] = useState("");

  // MODALS STATE
  const [modalType, setModalType] = useState(null); 
  const [actionLoading, setActionLoading] = useState(false);

  // QUICK DIALOG (SUSPEND / DELETE)
  const [targetActionUser, setTargetActionUser] = useState(null);
  const [actionDialogType, setActionDialogType] = useState(null);

  // SUPERVISOR TEAM INSPECTION MODAL
  const [selectedSupervisorTeam, setSelectedSupervisorTeam] = useState(null);

  // FINANCIALS, LIVE METRICS & STATS
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalSupervisors: 0,
    totalInflow: 0,
    totalOutflow: 0,
    totalRefunds: 0,
    activeOrders: 0,
    totalDataSoldGB: 0,
    totalAirtimeSold: 0,
    totalServiceRequests: 0,
  });

  const [allUsersList, setAllUsersList] = useState([]);
  const [allAgentsList, setAllAgentsList] = useState([]);
  const [supervisorsList, setSupervisorsList] = useState([]);

  // ==========================================
  // FORM STATES
  // ==========================================
  const [servicePricingForm, setServicePricingForm] = useState({
    service: "NIMC_SLIP_VERIFICATION",
    serviceName: "NIMC Slip Verification",
    baseRate: "150",
    retailPrice: "200",
    agentPrice: "180",
  });

  const [refundForm, setRefundForm] = useState({
    userId: "",
    userIdentifier: "",
    amount: "",
    reason: "Transaction Reversal",
  });

  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
    state: "Gombe",
    lga: "Gombe",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showLgaPicker, setShowLgaPicker] = useState(false);

  const [tariffForm, setTariffForm] = useState({
    network: "MTN",
    planType: "DC",
    planId: "140",
    volume: "1.0 GB",
    validity: "30 Days",
    customerPrice: "230",
    agentPrice: "210",
  });

  const [targetForm, setTargetForm] = useState({
    targetUserId: "ALL",
    salesGoal: "500000",
    dataGoal: "1000",
    agentGoal: "10",
    month: "October 2026",
    isGlobal: true,
  });

  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    message: "",
    targetAudience: "ALL",
    sendEmail: true,
  });

  const toggleSidebar = (open) => {
    if (open) {
      setSidebarOpen(true);
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(sidebarAnim, {
        toValue: -sidebarWidth,
        duration: 220,
        useNativeDriver: false,
      }).start(() => setSidebarOpen(false));
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (sidebarOpen) {
        toggleSidebar(false);
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

  // FETCH LIVE DATA WITH DATA GB, AIRTIME & SERVICE REQUEST METRICS
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const config = await getAuthHeaders();

      const [usersRes, supsRes, agentsRes, statsRes, txRes, nimcRes, bvnRes] = await Promise.allSettled([
        axios.get(`${BASE_URL}/admin/users`, config).catch(() => ({ data: {} })),
        axios.get(`${BASE_URL}/admin/supervisors`, config).catch(() => ({ data: {} })),
        axios.get(`${BASE_URL}/admin/agents`, config).catch(() => ({ data: {} })),
        axios.get(`${BASE_URL}/admin/dashboard-stats`, config).catch(() => ({ data: {} })),
        axios.get(`${BASE_URL}/admin/transactions`, config).catch(() => ({ data: {} })),
        axios.get(`${BASE_URL}/admin/nimc-requests`, config).catch(() => ({ data: {} })),
        axios.get(`${BASE_URL}/admin/bvn-requests`, config).catch(() => ({ data: {} })),
      ]);

      const rawUsers = usersRes.value?.data?.users || usersRes.value?.data?.data || [];
      const rawSups = supsRes.value?.data?.supervisors || supsRes.value?.data?.data || [];
      const rawAgents = agentsRes.value?.data?.agents || agentsRes.value?.data?.data || [];
      const txData = txRes.value?.data?.transactions || txRes.value?.data?.data || [];
      const dashStats = statsRes.value?.data || {};
      const nimcData = nimcRes.value?.data?.requests || nimcRes.value?.data?.data || [];
      const bvnData = bvnRes.value?.data?.requests || bvnRes.value?.data?.data || [];

      const customers = rawUsers.filter((u) => (u.role || "").toLowerCase() === "user" || (u.role || "").toLowerCase() === "customer");
      const agents = rawAgents.length > 0 ? rawAgents : rawUsers.filter((u) => (u.role || "").toLowerCase() === "agent");
      const supervisors = rawSups.length > 0 ? rawSups : rawUsers.filter((u) => (u.role || "").toLowerCase() === "supervisor");

      setAllUsersList(customers);
      setAllAgentsList(agents);
      setSupervisorsList(supervisors);

      let inflow = 0;
      let outflow = 0;
      let refunds = 0;
      let calculatedDataGB = 0;
      let calculatedAirtimeAmount = 0;
      let serviceRequestsCount = (nimcData.length || 0) + (bvnData.length || 0);

      txData.forEach((tx) => {
        const amt = Number(tx.amount || 0);
        const t = String(tx.type || tx.category || tx.service || "").toLowerCase();
        const desc = String(tx.description || tx.narration || tx.planName || "").toLowerCase();

        if (t.includes("fund") || t.includes("deposit") || t.includes("credit")) {
          inflow += amt;
        } else if (t.includes("refund")) {
          refunds += amt;
        } else {
          outflow += amt;
        }

        // Calculate Data GB
        if (t.includes("data") || desc.includes("gb") || desc.includes("mb")) {
          const matchGB = desc.match(/(\d+(\.\d+)?)\s*gb/i);
          const matchMB = desc.match(/(\d+(\.\d+)?)\s*mb/i);
          if (matchGB) {
            calculatedDataGB += parseFloat(matchGB[1]);
          } else if (matchMB) {
            calculatedDataGB += parseFloat(matchMB[1]) / 1024;
          } else if (tx.volume) {
            calculatedDataGB += parseFloat(tx.volume) || 1;
          } else {
            calculatedDataGB += 1;
          }
        }

        // Calculate Airtime Sales
        if (t.includes("airtime") || desc.includes("airtime") || desc.includes("vtu")) {
          calculatedAirtimeAmount += amt;
        }

        // Count Utility / Identity Services
        if (t.includes("nimc") || t.includes("bvn") || t.includes("cable") || t.includes("electricity")) {
          serviceRequestsCount += 1;
        }
      });

      if (inflow === 0 && dashStats?.finance?.totalRevenue) {
        inflow = Number(dashStats.finance.totalRevenue);
      }

      setStats({
        totalUsers: customers.length,
        totalAgents: agents.length,
        totalSupervisors: supervisors.length,
        totalInflow: inflow,
        totalOutflow: outflow,
        totalRefunds: refunds,
        activeOrders: txData.length,
        totalDataSoldGB: parseFloat(calculatedDataGB.toFixed(2)),
        totalAirtimeSold: calculatedAirtimeAmount,
        totalServiceRequests: serviceRequestsCount,
      });
    } catch (err) {
      console.log("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleSaveServicePricing = async () => {
    if (!servicePricingForm.baseRate || !servicePricingForm.retailPrice) {
      Alert.alert("Error", "Please fill in base cost and customer price.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      const payload = {
        service: servicePricingForm.service,
        serviceType: servicePricingForm.service,
        serviceName: servicePricingForm.serviceName,
        baseRate: Number(servicePricingForm.baseRate),
        rate: Number(servicePricingForm.baseRate),
        retailPrice: Number(servicePricingForm.retailPrice),
        agentPrice: Number(servicePricingForm.agentPrice || servicePricingForm.retailPrice),
        margin: Number(servicePricingForm.retailPrice) - Number(servicePricingForm.baseRate),
      };

      await axios.put(`${BASE_URL}/admin/pricing`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/admin/pricing`, payload, config);
      });

      Alert.alert("Pricing Updated", `${servicePricingForm.serviceName} live pricing deployed successfully.`);
      setModalType(null);
    } catch (err) {
      Alert.alert("Update Error", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteRefund = async () => {
    if (!refundForm.userIdentifier.trim() || !refundForm.amount.trim()) {
      Alert.alert("Validation Error", "User Email/Phone and Refund Amount are required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      const payload = {
        email: refundForm.userIdentifier.trim(),
        userId: refundForm.userIdentifier.trim(),
        amount: Number(refundForm.amount),
        reason: refundForm.reason.trim() || "Manual Admin Refund",
      };

      await axios.post(`${BASE_URL}/admin/wallet/refund`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/admin/refund`, payload, config);
      });

      Alert.alert("Refund Successful 💸", `₦${Number(refundForm.amount).toLocaleString()} refunded to ${refundForm.userIdentifier}.`);
      setModalType(null);
      setRefundForm({ userId: "", userIdentifier: "", amount: "", reason: "Transaction Reversal" });
      fetchDashboardData();
    } catch (err) {
      Alert.alert("Refund Failed", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const { fullName, email, phone, password, role, state, lga, address } = userForm;
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Full Name, Email, Phone, and Password are required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      const nameParts = fullName.trim().split(" ");

      const payload = {
        name: fullName.trim(),
        firstName: nameParts[0] || "User",
        surname: nameParts.slice(1).join(" ") || "Bellaj",
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: password.trim(),
        role: role.toLowerCase().trim(),
        state,
        lga,
        address: address.trim(),
      };

      await axios.post(`${BASE_URL}/admin/users/create`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/admin/create-supervisor`, payload, config);
      });

      Alert.alert("Success", `${role.toUpperCase()} ${fullName} created successfully.`);
      setModalType(null);
      fetchDashboardData();
    } catch (err) {
      Alert.alert("Creation Error", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishTariff = async () => {
    if (!tariffForm.planId.trim() || !tariffForm.customerPrice.trim()) {
      Alert.alert("Validation Error", "Gateway Plan ID and Customer Price are required.");
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
        agentPrice: Number(tariffForm.agentPrice || tariffForm.customerPrice),
      };

      await axios.post(`${BASE_URL}/admin/set-plan`, payload, config);
      Alert.alert("Tariff Published", `${tariffForm.network} ${tariffForm.volume} published live.`);
      setModalType(null);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeployTarget = async () => {
    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const payload = {
        targetUserId: targetForm.isGlobal ? "ALL" : targetForm.targetUserId,
        salesGoal: Number(targetForm.salesGoal || 0),
        amount: Number(targetForm.salesGoal || 0),
        dataGoal: Number(targetForm.dataGoal || 0),
        agentGoal: Number(targetForm.agentGoal || 0),
        month: targetForm.month,
        isGlobal: targetForm.isGlobal,
      };

      await axios.post(`${BASE_URL}/admin/assign-target`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/admin/targets`, payload, config);
      });

      Alert.alert(
        "Target Allocated",
        `Operational goals deployed successfully for ${targetForm.month}.`
      );
      setModalType(null);
    } catch (err) {
      Alert.alert("Target Error", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatchBroadcast = async () => {
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      Alert.alert("Validation Error", "Title and announcement content are required.");
      return;
    }

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();

      const payload = {
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
        target: broadcastForm.targetAudience,
        targetAudience: broadcastForm.targetAudience,
        sendEmail: broadcastForm.sendEmail,
      };

      await axios.post(`${BASE_URL}/admin/notifications/broadcast`, payload, config).catch(async () => {
        return await axios.post(`${BASE_URL}/admin/broadcast`, payload, config);
      });

      Alert.alert("Broadcast Dispatched", `Notification dispatched to audience: ${broadcastForm.targetAudience}.`);
      setModalType(null);
      setBroadcastForm({ title: "", message: "", targetAudience: "ALL", sendEmail: true });
    } catch (err) {
      Alert.alert("Dispatch Error", err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const executeSuspension = async () => {
    if (!targetActionUser) return;
    const userId = targetActionUser._id || targetActionUser.id;
    const isSuspended = Boolean(targetActionUser.isSuspended);

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      await axios.patch(`${BASE_URL}/admin/users/${userId}/status`, { isSuspended: !isSuspended }, config);

      Alert.alert("Status Updated", "User status changed successfully.");
      setActionDialogType(null);
      setTargetActionUser(null);
      fetchDashboardData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const executePermanentDelete = async () => {
    if (!targetActionUser) return;
    const userId = targetActionUser._id || targetActionUser.id;

    try {
      setActionLoading(true);
      const config = await getAuthHeaders();
      await axios.delete(`${BASE_URL}/admin/users/${userId}`, config);

      Alert.alert("Deleted", "User deleted permanently from database.");
      setActionDialogType(null);
      setTargetActionUser(null);
      fetchDashboardData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const safeNavigate = (screenName) => {
    toggleSidebar(false);
    if (!screenName || screenName === "AdminDashboard") return;
    try {
      navigation.navigate(screenName, { fromAdminDashboard: true });
    } catch {
      Alert.alert("Navigation", `Opening ${screenName}...`);
    }
  };

  const displayedUsersList = useMemo(() => {
    let source = [];
    if (activeUserTab === "customers") source = allUsersList;
    else if (activeUserTab === "agents") source = allAgentsList;
    else if (activeUserTab === "supervisors") source = supervisorsList;

    const q = searchFilter.trim().toLowerCase();
    if (!q) return source;
    return source.filter((u) => {
      const full = (u.name || `${u.firstName || ""} ${u.surname || ""}`).toLowerCase();
      return full.includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phone || "").includes(q);
    });
  }, [activeUserTab, allUsersList, allAgentsList, supervisorsList, searchFilter]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Loading Bellaj Admin Terminal...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* TOP COMMAND HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => toggleSidebar(true)}>
          <Ionicons name="menu" size={26} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Bellaj Operations Terminal</Text>
          <Text style={styles.headerSubtitle}>Real-Time Master Governance Console</Text>
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
        {/* FINANCIAL SUMMARY */}
        <View style={styles.financialCard}>
          <View style={styles.financialHeaderRow}>
            <View>
              <Text style={styles.financialBadge}>COMPANY FINANCIAL LEDGER</Text>
              <Text style={styles.financialTotalInflow}>₦{stats.totalInflow.toLocaleString()}</Text>
              <Text style={styles.financialSubText}>Total Inflow (Deposits & Revenue)</Text>
            </View>
            <TouchableOpacity
              style={styles.refundMoneyTopBtn}
              onPress={() => setModalType("refund_money")}
            >
              <MaterialCommunityIcons name="cash-refund" size={18} color={COLORS.white} />
              <Text style={styles.refundMoneyTopBtnText}>Issue Refund</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.financialDivider} />

          <View style={styles.financialMetricsGrid}>
            <View style={styles.finMetricBox}>
              <Text style={styles.finMetricLabel}>Total Outflow (Purchases)</Text>
              <Text style={[styles.finMetricVal, { color: COLORS.danger }]}>₦{stats.totalOutflow.toLocaleString()}</Text>
            </View>
            <View style={styles.finMetricBox}>
              <Text style={styles.finMetricLabel}>Total Refunded</Text>
              <Text style={[styles.finMetricVal, { color: COLORS.orange }]}>₦{stats.totalRefunds.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* LIVE DISPATCH METRICS: DATA GB, AIRTIME AMOUNT & REQUESTS */}
        <View style={styles.liveMetricsContainer}>
          <View style={styles.liveMetricCard}>
            <View style={[styles.liveMetricIconBox, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="wifi" size={18} color="#2563EB" />
            </View>
            <Text style={styles.liveMetricNumber}>{stats.totalDataSoldGB.toLocaleString()} GB</Text>
            <Text style={styles.liveMetricLabel}>Data Delivered</Text>
          </View>

          <View style={styles.liveMetricCard}>
            <View style={[styles.liveMetricIconBox, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="call" size={18} color="#16A34A" />
            </View>
            <Text style={styles.liveMetricNumber}>₦{stats.totalAirtimeSold.toLocaleString()}</Text>
            <Text style={styles.liveMetricLabel}>Airtime Topups</Text>
          </View>

          <View style={styles.liveMetricCard}>
            <View style={[styles.liveMetricIconBox, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons name="layers" size={18} color="#9333EA" />
            </View>
            <Text style={styles.liveMetricNumber}>{stats.totalServiceRequests.toLocaleString()}</Text>
            <Text style={styles.liveMetricLabel}>VAS / Requests</Text>
          </View>
        </View>

        {/* QUICK CONTROL BUTTONS - INCLUDING DEDICATED SUPPORT DESK ICON */}
        <View style={styles.quickDeckRow}>
          <TouchableOpacity style={[styles.quickDeckBtn, { backgroundColor: COLORS.teal }]} onPress={() => safeNavigate("SupportDashboard")}>
            <Ionicons name="headset" size={15} color={COLORS.white} />
            <Text style={styles.quickDeckBtnText}>Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickDeckBtn, { backgroundColor: COLORS.purple }]} onPress={() => setModalType("publish_tariff")}>
            <Ionicons name="cloud-upload" size={15} color={COLORS.white} />
            <Text style={styles.quickDeckBtnText}>Tariff</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickDeckBtn, { backgroundColor: COLORS.accent }]} onPress={() => setModalType("assign_target")}>
            <Ionicons name="trophy" size={15} color={COLORS.white} />
            <Text style={styles.quickDeckBtnText}>Target</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickDeckBtn, { backgroundColor: COLORS.orange }]} onPress={() => setModalType("broadcast_notification")}>
            <Ionicons name="megaphone" size={15} color={COLORS.white} />
            <Text style={styles.quickDeckBtnText}>Notice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickDeckBtn, { backgroundColor: COLORS.primary }]} onPress={() => setModalType("create_user")}>
            <Ionicons name="person-add" size={15} color={COLORS.white} />
            <Text style={styles.quickDeckBtnText}>+ User</Text>
          </TouchableOpacity>
        </View>

        {/* THREE CATEGORY PILLS */}
        <View style={styles.categoryPillsWrapper}>
          <TouchableOpacity
            style={[styles.categoryBtnPill, activeUserTab === "customers" && styles.categoryBtnPillActive]}
            onPress={() => setActiveUserTab("customers")}
          >
            <Ionicons name="people" size={18} color={activeUserTab === "customers" ? COLORS.white : COLORS.primary} />
            <Text style={[styles.categoryBtnPillText, activeUserTab === "customers" && styles.categoryBtnPillTextActive]}>
              Customers ({allUsersList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtnPill, activeUserTab === "agents" && styles.categoryBtnPillActive]}
            onPress={() => setActiveUserTab("agents")}
          >
            <FontAwesome5 name="store" size={15} color={activeUserTab === "agents" ? COLORS.white : COLORS.primary} />
            <Text style={[styles.categoryBtnPillText, activeUserTab === "agents" && styles.categoryBtnPillTextActive]}>
              Agents ({allAgentsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.categoryBtnPill, activeUserTab === "supervisors" && styles.categoryBtnPillActive]}
            onPress={() => setActiveUserTab("supervisors")}
          >
            <MaterialCommunityIcons name="account-tie" size={20} color={activeUserTab === "supervisors" ? COLORS.white : COLORS.primary} />
            <Text style={[styles.categoryBtnPillText, activeUserTab === "supervisors" && styles.categoryBtnPillTextActive]}>
              Supervisors ({supervisorsList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBarBox}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeUserTab} by name, phone, or email...`}
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

        {/* LIVE USER DIRECTORY FEED */}
        <View style={styles.directorySection}>
          {displayedUsersList.length === 0 ? (
            <View style={styles.emptyFeed}>
              <MaterialCommunityIcons name="account-off-outline" size={40} color={COLORS.muted} />
              <Text style={styles.emptyFeedText}>No {activeUserTab} found.</Text>
            </View>
          ) : (
            displayedUsersList.map((user) => {
              const isSuspended = Boolean(user.isSuspended);
              const uName = user.name || `${user.firstName || ""} ${user.surname || ""}`.trim() || "User";
              const uWallet = Number(user.walletBalance || user.balance || 0);
              const uTotalSpent = Number(user.totalSpent || user.totalSales || 0);

              return (
                <View key={user._id || user.id} style={styles.userCard}>
                  <View style={styles.userCardHeader}>
                    <View style={styles.userAvatarBox}>
                      <Text style={styles.userAvatarText}>{uName.charAt(0).toUpperCase()}</Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.userNameText}>{uName}</Text>
                      <Text style={styles.userContactText}>📞 {user.phone || "No Phone"} • ✉️ {user.email}</Text>
                      <Text style={styles.userContactText}>📍 {user.lga || "Gombe"}, {user.state || "Gombe"}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: isSuspended ? COLORS.softRed : COLORS.softGreen }]}>
                      <Text style={{ color: isSuspended ? COLORS.danger : COLORS.secondary, fontSize: 10, fontWeight: "900" }}>
                        {isSuspended ? "SUSPENDED" : "ACTIVE"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.userAuditBox}>
                    {activeUserTab === "supervisors" ? (
                      <>
                        <View style={styles.auditRow}>
                          <Text style={styles.auditLabel}>Assigned Agents Count:</Text>
                          <Text style={styles.auditValue}>{user.teamSize || user.agents?.length || 0} Outlets</Text>
                        </View>
                        <View style={styles.auditRow}>
                          <Text style={styles.auditLabel}>Team Volume Sold:</Text>
                          <Text style={[styles.auditValue, { color: COLORS.secondary }]}>
                            {user.teamPerformance || user.dataVolumeSold || 0} GB
                          </Text>
                        </View>
                        <View style={styles.auditRow}>
                          <Text style={styles.auditLabel}>Supervisor Float:</Text>
                          <Text style={[styles.auditValue, { color: COLORS.primary }]}>₦{uWallet.toLocaleString()}</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.auditRow}>
                          <Text style={styles.auditLabel}>Current Wallet Balance:</Text>
                          <Text style={[styles.auditValue, { color: COLORS.primary }]}>₦{uWallet.toLocaleString()}</Text>
                        </View>
                        <View style={styles.auditRow}>
                          <Text style={styles.auditLabel}>Total Volume Purchased / Sold:</Text>
                          <Text style={[styles.auditValue, { color: COLORS.secondary }]}>
                            ₦{uTotalSpent > 0 ? uTotalSpent.toLocaleString() : (uWallet * 2).toLocaleString()}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  <View style={styles.cardActionsContainer}>
                    {activeUserTab === "supervisors" && (
                      <TouchableOpacity
                        style={[styles.cardActionBtn, { backgroundColor: COLORS.primary }]}
                        onPress={() => {
                          const under = allAgentsList.filter(
                            (ag) => String(ag.assignedSupervisor?._id || ag.assignedSupervisor || ag.supervisorId) === String(user._id || user.id)
                          );
                          setSelectedSupervisorTeam({ supervisor: user, agents: under });
                        }}
                      >
                        <MaterialCommunityIcons name="account-group" size={14} color={COLORS.white} />
                        <Text style={styles.cardActionBtnText}>Inspect Outlets</Text>
                      </TouchableOpacity>
                    )}

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
            })
          )}
        </View>
      </ScrollView>

      {/* SIDEBAR DRAWER */}
      {sidebarOpen && (
        <TouchableOpacity
          style={styles.sidebarBackdrop}
          activeOpacity={1}
          onPress={() => toggleSidebar(false)}
        >
          <Animated.View
            style={[styles.sidebarContainer, { width: sidebarWidth, transform: [{ translateX: sidebarAnim }] }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarBrandRow}>
                <View style={styles.sidebarBadgeBox}>
                  <MaterialCommunityIcons name="shield-crown" size={24} color={COLORS.white} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.sidebarBrandTitle}>Bellaj Data Hub</Text>
                  <Text style={styles.sidebarBrandTag}>Executive Control Console</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => toggleSidebar(false)} style={styles.sidebarCloseBtn}>
                <Feather name="x" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.sidebarSectionTitle}>Customer Care & Tickets</Text>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("SupportDashboard")}
              >
                <Ionicons name="headset-outline" size={18} color="#2DD4BF" />
                <Text style={[styles.sidebarMenuText, { color: "#2DD4BF" }]}>Support Desk Terminal</Text>
              </TouchableOpacity>

              <Text style={styles.sidebarSectionTitle}>Personnel Directorate</Text>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => {
                  toggleSidebar(false);
                  setActiveUserTab("customers");
                }}
              >
                <Ionicons name="people-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Customers Directory</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => {
                  toggleSidebar(false);
                  setActiveUserTab("agents");
                }}
              >
                <FontAwesome5 name="store" size={14} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Retail Agents Network</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => {
                  toggleSidebar(false);
                  setActiveUserTab("supervisors");
                }}
              >
                <MaterialCommunityIcons name="account-tie" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Field Supervisors</Text>
              </TouchableOpacity>

              <Text style={styles.sidebarSectionTitle}>Operational Governance</Text>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => {
                  toggleSidebar(false);
                  setModalType("assign_target");
                }}
              >
                <Ionicons name="trophy-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Assign Quota / Target</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => {
                  toggleSidebar(false);
                  setModalType("broadcast_notification");
                }}
              >
                <Ionicons name="megaphone-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Dispatch Broadcast</Text>
              </TouchableOpacity>

              <Text style={styles.sidebarSectionTitle}>Commercial Controls</Text>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => {
                  toggleSidebar(false);
                  setModalType("publish_tariff");
                }}
              >
                <Ionicons name="cloud-upload-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Publish Data Tariff</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => {
                  toggleSidebar(false);
                  setModalType("set_service_price");
                }}
              >
                <MaterialCommunityIcons name="cog-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>NIMC, BVN & Cable Pricing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => {
                  toggleSidebar(false);
                  setModalType("refund_money");
                }}
              >
                <MaterialCommunityIcons name="cash-refund" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Issue Direct Wallet Refund</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarMenuItem}
                onPress={() => safeNavigate("SalesHistory")}
              >
                <MaterialCommunityIcons name="receipt-text-outline" size={18} color="#94A3B8" />
                <Text style={styles.sidebarMenuText}>Transactions & Audits</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.sidebarLogoutBtn} onPress={() => setModalType("confirm_logout")}>
                <Feather name="log-out" size={18} color="#FCA5A5" />
                <Text style={styles.sidebarLogoutText}>Sign Out of Console</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* MODAL 1: SERVICE PRICING */}
      <Modal visible={modalType === "set_service_price"} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "90%" }]}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Service Pricing Calibration</Text>
                <Text style={styles.modalSubtitle}>NIMC, Slip Verification, BVN & Cable TV</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputGuide}>Select Service Channel</Text>
              <View style={styles.serviceSelectorRow}>
                {[
                  { id: "NIMC_SLIP_VERIFICATION", label: "NIMC Slip", name: "NIMC Slip Verification" },
                  { id: "NIN_VALIDATION", label: "NIN Validation", name: "NIN Identity Validation" },
                  { id: "BVN_VERIFICATION", label: "BVN Verify", name: "BVN Identity Verification" },
                  { id: "CABLE_GOTV_STARTIMES", label: "Cable TV Plans", name: "Cable TV Subscriptions" },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.servicePill, servicePricingForm.service === s.id && styles.servicePillActive]}
                    onPress={() => setServicePricingForm({ ...servicePricingForm, service: s.id, serviceName: s.name })}
                  >
                    <Text style={[styles.servicePillText, servicePricingForm.service === s.id && styles.servicePillTextActive]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputGuide}>API Provider Cost Base Rate (₦)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={servicePricingForm.baseRate}
                onChangeText={(t) => setServicePricingForm({ ...servicePricingForm, baseRate: t })}
                placeholder="e.g. 150"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.inputGuide}>Customer Retail Selling Price (₦)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={servicePricingForm.retailPrice}
                onChangeText={(t) => setServicePricingForm({ ...servicePricingForm, retailPrice: t })}
                placeholder="e.g. 200"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.inputGuide}>Retail Agent Wholesale Price (₦)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={servicePricingForm.agentPrice}
                onChangeText={(t) => setServicePricingForm({ ...servicePricingForm, agentPrice: t })}
                placeholder="e.g. 180"
                placeholderTextColor={COLORS.muted}
              />

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: COLORS.orange }]} onPress={handleSaveServicePricing} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>SAVE PRICING MATRIX</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: DIRECT REFUND */}
      <Modal visible={modalType === "refund_money"} transparent animationType="fade" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Issue Direct Wallet Refund</Text>
                <Text style={styles.modalSubtitle}>Credit user wallet with immediate ledger reversal</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputGuide}>Recipient Email or Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. customer@bellajdatahub.online"
              value={refundForm.userIdentifier}
              onChangeText={(t) => setRefundForm({ ...refundForm, userIdentifier: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Refund Amount (₦)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2500"
              keyboardType="numeric"
              value={refundForm.amount}
              onChangeText={(t) => setRefundForm({ ...refundForm, amount: t })}
              placeholderTextColor={COLORS.muted}
            />

            <Text style={styles.inputGuide}>Reason for Refund</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Failed service reversal"
              value={refundForm.reason}
              onChangeText={(t) => setRefundForm({ ...refundForm, reason: t })}
              placeholderTextColor={COLORS.muted}
            />

            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: COLORS.primary }]} onPress={handleExecuteRefund} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>CREDIT WALLET REFUND</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: CREATE USER */}
      <Modal visible={modalType === "create_user"} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "92%" }]}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Register Personnel & Outlets</Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputGuide}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Ibrahim Musa Bello"
                value={userForm.fullName}
                onChangeText={(t) => setUserForm({ ...userForm, fullName: t })}
                placeholderTextColor={COLORS.muted}
              />

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputGuide}>Email Address</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="user@bellaj.online"
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

              <Text style={styles.inputGuide}>Password</Text>
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

              <Text style={styles.inputGuide}>Select Role</Text>
              <View style={styles.roleSelectionRow}>
                {[
                  { id: "customer", label: "Customer" },
                  { id: "agent", label: "Retail Agent" },
                  { id: "supervisor", label: "Supervisor" },
                  { id: "support", label: "Customer Support" },
                  { id: "staff", label: "Admin Staff" },
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

              <Text style={styles.inputGuide}>State (Nigeria 36 States & FCT)</Text>
              <TouchableOpacity style={styles.modalSelectBtn} onPress={() => setShowStatePicker(!showStatePicker)}>
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

              <Text style={styles.inputGuide}>Local Government Area (LGA)</Text>
              <TouchableOpacity style={styles.modalSelectBtn} onPress={() => setShowLgaPicker(!showLgaPicker)}>
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

              <Text style={styles.inputGuide}>Address</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60, textAlignVertical: "top" }]}
                placeholder="Office or residential address..."
                multiline
                value={userForm.address}
                onChangeText={(t) => setUserForm({ ...userForm, address: t })}
                placeholderTextColor={COLORS.muted}
              />

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: COLORS.primary }]} onPress={handleCreateUser} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>REGISTER PROFILE</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: PUBLISH TARIFF[cite: 1] */}
      <Modal visible={modalType === "publish_tariff"} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "94%" }]}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Publish New Data Tariff</Text>
                <Text style={styles.modalSubtitle}>Fast Automatic Presets or Manual Configuration</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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

              {/* AUTOMATIC QUICK PRESET */}
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

              <Text style={styles.inputGuide}>3. Gateway Plan ID (Al-Ihsan Provider ID) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 140"
                keyboardType="numeric"
                value={tariffForm.planId}
                onChangeText={(t) => setTariffForm({ ...tariffForm, planId: t })}
                placeholderTextColor={COLORS.muted}
              />

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputGuide}>Volume</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tariffForm.volume}
                    onChangeText={(t) => setTariffForm({ ...tariffForm, volume: t })}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputGuide}>Validity</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tariffForm.validity}
                    onChangeText={(t) => setTariffForm({ ...tariffForm, validity: t })}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputGuide}>Customer Price (₦)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={tariffForm.customerPrice}
                    onChangeText={(t) => setTariffForm({ ...tariffForm, customerPrice: t })}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputGuide}>Agent Price (₦)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={tariffForm.agentPrice}
                    onChangeText={(t) => setTariffForm({ ...tariffForm, agentPrice: t })}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
              </View>

              <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: "#0284C7" }]} onPress={handlePublishTariff} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>PUBLISH TARIFF LIVE</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: ASSIGN TARGET */}
      <Modal visible={modalType === "assign_target"} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "90%" }]}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Deploy Operational Targets</Text>
                <Text style={styles.modalSubtitle}>Monthly Performance Quotas for Team Outlets</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputGuide}>Target Month / Operational Cycle</Text>
              <TextInput
                style={styles.modalInput}
                value={targetForm.month}
                onChangeText={(t) => setTargetForm({ ...targetForm, month: t })}
                placeholder="e.g. October 2026"
                placeholderTextColor={COLORS.muted}
              />

              <View style={styles.switchRowContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "800", color: COLORS.text }}>Global Deployment</Text>
                  <Text style={{ fontSize: 11, color: COLORS.muted }}>Apply quota to all active field agents and supervisors</Text>
                </View>
                <Switch
                  value={targetForm.isGlobal}
                  onValueChange={(v) => setTargetForm({ ...targetForm, isGlobal: v })}
                  trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
                  thumbColor={targetForm.isGlobal ? COLORS.secondary : "#F1F5F9"}
                />
              </View>

              {!targetForm.isGlobal && (
                <>
                  <Text style={styles.inputGuide}>Target Recipient Identifier (Email / ID / Phone)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter beneficiary agent or supervisor reference"
                    value={targetForm.targetUserId}
                    onChangeText={(t) => setTargetForm({ ...targetForm, targetUserId: t })}
                    placeholderTextColor={COLORS.muted}
                  />
                </>
              )}

              <Text style={styles.inputGuide}>Financial Sales Quota (₦)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={targetForm.salesGoal}
                onChangeText={(t) => setTargetForm({ ...targetForm, salesGoal: t })}
                placeholder="e.g. 500000"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.inputGuide}>Data Volume Target (GB)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={targetForm.dataGoal}
                onChangeText={(t) => setTargetForm({ ...targetForm, dataGoal: t })}
                placeholder="e.g. 1000"
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.inputGuide}>Team Expansion / Agent Acquisition Quota</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={targetForm.agentGoal}
                onChangeText={(t) => setTargetForm({ ...targetForm, agentGoal: t })}
                placeholder="e.g. 10"
                placeholderTextColor={COLORS.muted}
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: COLORS.accent }]}
                onPress={handleDeployTarget}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>COMMIT AND DEPLOY TARGET</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 6: BROADCAST NOTIFICATION */}
      <Modal visible={modalType === "broadcast_notification"} transparent animationType="slide" onRequestClose={() => setModalType(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "90%" }]}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>Dispatch Push Broadcast</Text>
                <Text style={styles.modalSubtitle}>In-App Notifications & Automated Emails</Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputGuide}>Target Audience Scope</Text>
              <View style={styles.serviceSelectorRow}>
                {[
                  { id: "ALL", label: "All Users" },
                  { id: "AGENTS", label: "Agents Only" },
                  { id: "SUPERVISORS", label: "Supervisors" },
                  { id: "USERS", label: "Customers" },
                ].map((aud) => (
                  <TouchableOpacity
                    key={aud.id}
                    style={[styles.servicePill, broadcastForm.targetAudience === aud.id && styles.servicePillActive]}
                    onPress={() => setBroadcastForm({ ...broadcastForm, targetAudience: aud.id })}
                  >
                    <Text style={[styles.servicePillText, broadcastForm.targetAudience === aud.id && styles.servicePillTextActive]}>{aud.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputGuide}>Announcement Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. System Maintenance or Data Tariff Update"
                value={broadcastForm.title}
                onChangeText={(t) => setBroadcastForm({ ...broadcastForm, title: t })}
                placeholderTextColor={COLORS.muted}
              />

              <Text style={styles.inputGuide}>Announcement Body</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 90, textAlignVertical: "top" }]}
                placeholder="Compose announcement message..."
                multiline
                value={broadcastForm.message}
                onChangeText={(t) => setBroadcastForm({ ...broadcastForm, message: t })}
                placeholderTextColor={COLORS.muted}
              />

              <View style={styles.switchRowContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: "800", color: COLORS.text }}>Send Direct Email Copies</Text>
                  <Text style={{ fontSize: 11, color: COLORS.muted }}>Deliver copies to registered email accounts via SMTP</Text>
                </View>
                <Switch
                  value={broadcastForm.sendEmail}
                  onValueChange={(v) => setBroadcastForm({ ...broadcastForm, sendEmail: v })}
                  trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
                  thumbColor={broadcastForm.sendEmail ? COLORS.secondary : "#F1F5F9"}
                />
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: COLORS.orange }]}
                onPress={handleDispatchBroadcast}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitBtnText}>DISPATCH BROADCAST NOW</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 7: INSPECT SUPERVISOR OUTLETS */}
      <Modal visible={Boolean(selectedSupervisorTeam)} transparent animationType="slide" onRequestClose={() => setSelectedSupervisorTeam(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { maxHeight: "88%" }]}>
            <View style={styles.modalHead}>
              <View>
                <Text style={styles.modalTitle}>{selectedSupervisorTeam?.supervisor?.name}'s Team</Text>
                <Text style={styles.modalSubtitle}>Supervised Grassroot Retail Outlets</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSupervisorTeam(null)}>
                <Ionicons name="close" size={24} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedSupervisorTeam?.agents?.length === 0 ? (
                <View style={styles.emptyFeed}>
                  <Text style={styles.emptyFeedText}>No agents assigned under this supervisor.</Text>
                </View>
              ) : (
                selectedSupervisorTeam?.agents?.map((ag) => (
                  <View key={ag._id || ag.id} style={styles.agentMiniCard}>
                    <Text style={styles.agentMiniName}>{ag.name || ag.email}</Text>
                    <Text style={styles.agentMiniSub}>📞 {ag.phone} | Bal: ₦{(ag.walletBalance || 0).toLocaleString()}</Text>
                    <Text style={styles.agentMiniSub}>Volume Sold: {ag.dataVolumeSold || ag.dataSold || 0} GB</Text>
                  </View>
                ))
              )}
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
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: COLORS.danger }]}
                onPress={async () => {
                  await AsyncStorage.clear();
                  navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }));
                }}
              >
                <Text style={styles.modalConfirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ==========================================
// STYLES BUILDER
// ==========================================
const getStyles = (COLORS) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: COLORS.light,
      ...(Platform.OS === "web" ? { minHeight: "100vh", height: "100%" } : {}),
    },
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
    headerTitle: { color: COLORS.white, fontSize: 17, fontWeight: "900" },
    headerSubtitle: { color: "#DCFCE7", marginTop: 2, fontSize: 11, fontWeight: "600" },
    logoutBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: COLORS.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 90 },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: COLORS.light,
    },
    loaderText: { color: COLORS.primary, fontWeight: "800", marginTop: 14 },

    financialCard: {
      backgroundColor: COLORS.sidebarBg,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: COLORS.sidebarBorder,
      borderLeftWidth: 5,
      borderLeftColor: COLORS.secondary,
      marginBottom: 12,
    },
    financialHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    financialBadge: { color: "#86EFAC", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
    financialTotalInflow: { color: COLORS.white, fontSize: 26, fontWeight: "900", marginVertical: 2 },
    financialSubText: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
    refundMoneyTopBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.danger,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 4,
    },
    refundMoneyTopBtnText: { color: COLORS.white, fontSize: 11, fontWeight: "900" },
    financialDivider: { height: 1, backgroundColor: COLORS.sidebarBorder, marginVertical: 12 },
    financialMetricsGrid: { flexDirection: "row", justifyContent: "space-between" },
    finMetricBox: { flex: 1 },
    finMetricLabel: { color: COLORS.muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
    finMetricVal: { fontSize: 16, fontWeight: "900", marginTop: 3 },

    // LIVE OPERATIONAL METRICS (DATA GB, AIRTIME, REQUESTS)
    liveMetricsContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },
    liveMetricCard: {
      flex: 1,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    liveMetricIconBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    liveMetricNumber: {
      fontSize: 13,
      fontWeight: "900",
      color: COLORS.text,
      textAlign: "center",
    },
    liveMetricLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: COLORS.muted,
      marginTop: 2,
      textAlign: "center",
    },

    quickDeckRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
    quickDeckBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    quickDeckBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 10 },

    categoryPillsWrapper: { flexDirection: "row", gap: 8, marginBottom: 12 },
    categoryBtnPill: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.card,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.border,
      gap: 6,
    },
    categoryBtnPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    categoryBtnPillText: { fontSize: 11, fontWeight: "800", color: COLORS.muted },
    categoryBtnPillTextActive: { color: COLORS.white },

    searchBarBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 14,
    },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 13, marginLeft: 8 },

    directorySection: {
      backgroundColor: COLORS.card,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
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
      backgroundColor: COLORS.softGreen,
      alignItems: "center",
      justifyContent: "center",
    },
    userAvatarText: { fontSize: 16, fontWeight: "900", color: COLORS.primary },
    userNameText: { fontSize: 14, fontWeight: "900", color: COLORS.text },
    userContactText: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

    userAuditBox: {
      backgroundColor: COLORS.card,
      borderRadius: 10,
      padding: 10,
      marginTop: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    auditRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
    auditLabel: { fontSize: 11, color: COLORS.muted, fontWeight: "700" },
    auditValue: { fontSize: 11.5, fontWeight: "900", color: COLORS.text },

    cardActionsContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 10,
      paddingTop: 8,
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
    emptyFeed: { padding: 24, alignItems: "center", justifyContent: "center" },
    emptyFeedText: { color: COLORS.muted, fontSize: 12, marginTop: 8, textAlign: "center" },

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
      color: COLORS.muted,
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
    sidebarMenuText: { color: "#CBD5E1", fontSize: 12.5, fontWeight: "700", marginLeft: 10 },
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
      marginBottom: 14,
    },
    modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
    modalSubtitle: { color: COLORS.primary, fontSize: 11, fontWeight: "600", marginTop: 2 },
    inputGuide: { color: COLORS.muted, fontSize: 11, fontWeight: "700", marginBottom: 4, marginTop: 8 },
    modalInput: {
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13.5,
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
    passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, color: COLORS.text },
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
    rolePillText: { fontSize: 11, fontWeight: "700", color: COLORS.muted },
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
    modalSubmitBtnText: { color: COLORS.white, fontWeight: "900", fontSize: 13.5 },

    serviceSelectorRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
    servicePill: {
      backgroundColor: COLORS.soft,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    servicePillActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
    servicePillText: { fontSize: 11, fontWeight: "800", color: COLORS.muted },
    servicePillTextActive: { color: COLORS.white },

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
    telecomPillText: { fontSize: 12, fontWeight: "800", color: COLORS.muted },
    telecomPillTextActive: { color: COLORS.white },
    presetContainer: {
      backgroundColor: "#F0FDF4",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: "#BBF7D0",
      marginVertical: 10,
    },
    presetContainerTitle: { fontSize: 11, fontWeight: "900", color: "#15803D" },
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
    smallPillText: { fontSize: 11, fontWeight: "800", color: COLORS.muted },
    smallPillTextActive: { color: COLORS.white },

    switchRowContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: COLORS.border,
      marginVertical: 8,
    },

    agentMiniCard: {
      backgroundColor: COLORS.soft,
      borderRadius: 10,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    agentMiniName: { fontSize: 13, fontWeight: "800", color: COLORS.text },
    agentMiniSub: { fontSize: 11, color: COLORS.muted, marginTop: 2 },

    modalHeading: { fontSize: 17, fontWeight: "900", color: COLORS.text, marginTop: 10 },
    modalSubheading: { fontSize: 12.5, color: COLORS.muted, textAlign: "center", marginVertical: 12 },
    modalActionRow: { flexDirection: "row", width: "100%", gap: 10 },
    modalCancelBtn: { flex: 1, backgroundColor: COLORS.soft, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
    modalCancelText: { fontWeight: "800", color: COLORS.text },
    modalConfirmBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
    modalConfirmText: { color: COLORS.white, fontWeight: "900" },
  });

export default AdminDashboard;