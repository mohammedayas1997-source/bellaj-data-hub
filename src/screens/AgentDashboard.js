import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import CustomDrawerContent from "./src/components/CustomDrawerContent";

// --- IMPORT SCREENS ---
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

// --- AGENT CODES IMPORT (AN GYARA - AN DAURA SHI) ---
import AgentDashboard from "./src/screens/AgentDashboard";

// --- SETTINGS IMPORT ---
import SettingsScreen from "./src/screens/SettingsScreen";
import SuccessScreen from "./src/screens/SuccessScreen";
// --- LEADER & SUPERADMIN SYSTEM ---
import LeaderDashboard from "./src/screens/LeaderDashboard";
import CreateSupervisorScreen from "./src/screens/CreateSupervisorScreen";
import ManageAgentsScreen from "./src/screens/ManageAgentsScreen";

// Import na Superadmin
import UserManagement from "./src/screens/superadmin/UserManagement";
import SuperAdminDashboard from "./src/screens/SuperAdminDashboard";

// --- NIMC & BVN SYSTEM ---
import NIMCModificationScreen from "./src/screens/Services/NIMCModificationScreen";
import NIMCRequests from "./src/screens/Admin/NIMCRequests";
import NIMCHistory from "./src/screens/User/NIMCHistory";
import BVNScreen from "./src/screens/BVNScreen";
import BVNHistory from "./src/screens/User/BVNHistory";
import UpdatePin from "./src/screens/UpdatePin";

// --- SUPPORT ---
import SupportDashboard from "./src/screens/SupportDashboard";
import OnboardingScreen from "./src/screens/OnboardingScreen";

// --- LEGAL & INFO SCREENS (NEW) ---
import AboutScreen from "./src/screens/AboutScreen";
import PrivacyPolicyScreen from "./src/screens/PrivacyPolicyScreen";
import TermsScreen from "./src/screens/TermsScreen";

// --- NIN VALIDATION IMPORT ---
import NINValidation from "./src/screens/NINValidation";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// --- DRAWER NAVIGATOR SECTION ---
function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#38bdf8",
        drawerActiveBackgroundColor: "#1e3a8a",
        drawerActiveTintColor: "#fff",
        drawerLabelStyle: { marginLeft: -10, fontSize: 16 },
        unmountOnBlur: true,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{ title: "Ayax Xpress" }}
      />
      <Drawer.Screen
        name="Wallet History"
        component={HistoryScreen}
        options={{ title: "Transaction History" }}
      />
      <Drawer.Screen
        name="BVN History"
        component={BVNHistory}
        options={{ title: "My BVN Logs" }}
      />
      <Drawer.Screen
        name="NIMC History"
        component={NIMCHistory}
        options={{ title: "My NIMC Logs" }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "App Settings" }}
      />
    </Drawer.Navigator>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
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
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />

        {/* Auth Stack - Fixed Duplicate Entry */}
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
          name="Success"
          component={SuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Reset Password" }}
        />

        {/* Main App Entry Point */}
        <Stack.Screen
          name="Main"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />

        {/* Other Stack Screens */}
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
          name="BVNScreen"
          component={BVNScreen}
          options={{ title: "BVN Verification" }}
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
          name="Contact"
          component={ContactScreen}
          options={{ title: "Help & Support" }}
        />

        {/* Admin & Management Screens */}
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

        {/* AGENT DASHBOARD REGISTERED */}
        <Stack.Screen
          name="AgentDashboard"
          component={AgentDashboard}
          options={{ title: "Agent Control Panel" }}
        />

        <Stack.Screen
          name="AssignTarget"
          component={AssignTargetScreen}
          options={{ title: "Set Target" }}
        />
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
        <Stack.Screen
          name="SuperAdminUsers"
          component={UserManagement}
          options={{ title: "Global User Management" }}
        />
        <Stack.Screen
          name="SuperAdminDashboard"
          component={SuperAdminDashboard}
          options={{ title: "SuperAdmin Control" }}
        />
        <Stack.Screen
          name="SupportDashboard"
          component={SupportDashboard}
          options={{ title: "Support & Tracing" }}
        />
        <Stack.Screen
          name="NIMCRequests"
          component={NIMCRequests}
          options={{ title: "NIMC Pending Tasks" }}
        />
        <Stack.Screen
          name="NIMCModification"
          component={NIMCModificationScreen}
          options={{ title: "NIMC Modification", headerShown: false }}
        />
        <Stack.Screen
          name="UpdatePin"
          component={UpdatePin}
          options={{ headerShown: false }}
        />

        {/* Legal & Info Stack */}
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ title: "About Us" }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{ title: "Privacy Policy" }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{ title: "Terms & Conditions" }}
        />

        {/* NIN VALIDATION SCREEN REGISTRATION */}
        <Stack.Screen
          name="NINValidation"
          component={NINValidation}
          options={{ title: "NIN Validation" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
