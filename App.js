import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

// Import Screens
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import BuyDataScreen from "./src/screens/BuyDataScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import ElectricityScreen from "./src/screens/ElectricityScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import NIMCScreen from "./src/screens/NIMCScreen";
import CableScreen from "./src/screens/CableScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import AirtimeScreen from "./src/screens/AirtimeScreen";
import FundWalletScreen from "./src/screens/FundWalletScreen";
import ContactScreen from "./src/screens/ContactScreen";
import SupervisorDashboard from "./src/screens/SupervisorDashboard";
import AdminControlScreen from "./src/screens/AdminControlScreen";
import AssignTargetScreen from "./src/screens/AssignTargetScreen";

// --- SABABBIN IMPORT NA LEADER & SUPERADMIN SYSTEM ---
import LeaderDashboard from "./src/screens/LeaderDashboard";
import CreateSupervisorScreen from "./src/screens/CreateSupervisorScreen";
import ManageAgentsScreen from "./src/screens/ManageAgentsScreen";

// Gyaran Import Path na UserManagement (Tabbatar folder din tana src/screens/)
import UserManagement from "./src/screens/superadmin/UserManagement";
// Idan kana da SuperAdminDashboard shima ka yi import dinsa
import SuperAdminDashboard from "./src/screens/superadmin/SuperAdminDashboard";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#0f172a",
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: "#38bdf8",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Ayax Xpress" }}
        />

        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{ title: "Help & Support" }}
        />

        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Reset Password" }}
        />

        <Stack.Screen
          name="BuyAirtime"
          component={AirtimeScreen}
          options={{ title: "Buy Airtime" }}
        />

        <Stack.Screen
          name="FundWallet"
          component={FundWalletScreen}
          options={{ title: "Fund Your Wallet" }}
        />

        <Stack.Screen
          name="BuyData"
          component={BuyDataScreen}
          options={{ title: "Data Services" }}
        />

        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: "Transaction History" }}
        />

        <Stack.Screen
          name="Electricity"
          component={ElectricityScreen}
          options={{ title: "Utility Bills" }}
        />

        <Stack.Screen
          name="NIMC"
          component={NIMCScreen}
          options={{ title: "NIMC Services" }}
        />

        <Stack.Screen
          name="Cable"
          component={CableScreen}
          options={{ title: "Cable TV Subscription" }}
        />

        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "My Profile" }}
        />

        <Stack.Screen
          name="AdminControl"
          component={AdminControlScreen}
          options={{ title: "Admin Panel" }}
        />

        <Stack.Screen
          name="SupervisorDashboard"
          component={SupervisorDashboard}
          options={{ title: "Supervisor Panel" }}
        />

        <Stack.Screen
          name="AssignTarget"
          component={AssignTargetScreen}
          options={{ title: "Set Target" }}
        />

        {/* --- ROUTES NA LEADER SYSTEM --- */}
        <Stack.Screen
          name="LeaderDashboard"
          component={LeaderDashboard}
          options={{ title: "Leader Control Center" }}
        />

        <Stack.Screen
          name="CreateSupervisor"
          component={CreateSupervisorScreen}
          options={{ title: "Add New Supervisor" }}
        />

        <Stack.Screen
          name="ManageAgents"
          component={ManageAgentsScreen}
          options={{ title: "Manage Agents" }}
        />

        {/* --- ROUTES NA SUPERADMIN (GYARARRE) --- */}
        {/* 
            Lura: A React Native ba mu amfani da <ProtectedRoute> a nan. 
            Muna yin logic din kariya ne a cikin HomeScreen ko LoginScreen 
            domin tura user zuwa shafin da ya dace dangane da role dinsa.
        */}
        <Stack.Screen
          name="SuperAdminUsers"
          component={UserManagement}
          options={{ title: "Global User Management" }}
        />

        {/* Idan kana da shafin Dashboard na Superadmin shima saka shi haka: */}

        <Stack.Screen
          name="SuperAdminDashboard"
          component={SuperAdminDashboard}
          options={{ title: "SuperAdmin Control" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
