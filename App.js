import React, { useContext } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";

import { ThemeProvider, ThemeContext } from "./src/context/ThemeContext";

import CustomDrawerContent from "./src/components/CustomDrawerContent";
import NotificationsScreen from "./src/screens/NotificationsScreen";

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
import SuccessScreen from "./src/screens/SuccessScreen";
import AirtimeScreen from "./src/screens/AirtimeScreen";
import FundWalletScreen from "./src/screens/FundWalletScreen";
import ContactScreen from "./src/screens/ContactScreen";
import SetupPinScreen from "./src/screens/SetupPinScreen";
import SupervisorDashboard from "./src/screens/SupervisorDashboard";
import AdminControlScreen from "./src/screens/AdminControlScreen";
import AssignTargetScreen from "./src/screens/AssignTargetScreen";
import AgentDashboard from "./src/screens/AgentDashboard";
import SettingsScreen from "./src/screens/SettingsScreen";
import LeaderDashboard from "./src/screens/LeaderDashboard";
import CreateSupervisorScreen from "./src/screens/CreateSupervisorScreen";
import ManageAgentsScreen from "./src/screens/ManageAgentsScreen";
import UserManagement from "./src/screens/superadmin/UserManagement";
import SuperAdminDashboard from "./src/screens/SuperAdminDashboard";
import SupportDashboard from "./src/screens/SupportDashboard";
import AdminDashboard from "./src/screens/AdminDashboard";

import NIMCModificationScreen from "./src/screens/Services/NIMCModificationScreen";
import NIMCRequests from "./src/screens/Admin/NIMCRequests";
import NIMCHistory from "./src/screens/User/NIMCHistory";
import BVNScreen from "./src/screens/BVNScreen";
import BVNHistory from "./src/screens/User/BVNHistory";
import UpdatePin from "./src/screens/UpdatePin";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import AboutScreen from "./src/screens/AboutScreen";
import PrivacyPolicyScreen from "./src/screens/PrivacyPolicyScreen";
import TermsScreen from "./src/screens/TermsScreen";
import NINValidation from "./src/screens/NINValidation";
import PricingSettings from "./src/screens/PricingSettings";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function PlaceholderScreen() {
  return null;
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#ffffff",
        drawerActiveTintColor: "#0B5E3C",
        drawerInactiveTintColor: "#64748B",
      }}
    >
      <Drawer.Screen name="Dashboard" component={HomeScreen} />
      <Drawer.Screen name="AdminDashboard" component={AdminDashboard} />
      <Drawer.Screen name="AgentDashboard" component={AgentDashboard} />
      <Drawer.Screen name="SupportDashboard" component={SupportDashboard} />
      <Drawer.Screen name="SupervisorDashboard" component={SupervisorDashboard} />
      <Drawer.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />
      <Drawer.Screen name="Wallet History" component={HistoryScreen} />
      <Drawer.Screen name="BVNHistory" component={BVNHistory} />
      <Drawer.Screen name="NIMCHistory" component={NIMCHistory} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

function AppContent() {
  const context = useContext(ThemeContext);
  const isDarkMode = context ? context.isDarkMode : false;

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#ffffff",
        }}
      >
        {/* SHAFUKAN SHIGA NA FARKO */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
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
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Forgot Password" }}
        />

        {/* SHAFIN SET TRANSACTION PIN GA CUSTOMER DA AGENT */}
        <Stack.Screen
          name="SetupPin"
          component={SetupPinScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="SetupPinScreen"
          component={SetupPinScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="SetupPinSuccess"
          component={SuccessScreen}
          options={{ headerShown: false }}
        />

        {/* BABBAN DRAWER NA APP */}
        <Stack.Screen
          name="Main"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />

        {/* SHAFUKAN DASHBOARDS */}
        <Stack.Screen
          name="Dashboard"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AgentDashboard"
          component={AgentDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SupportDashboard"
          component={SupportDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SupervisorDashboard"
          component={SupervisorDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SuperAdminDashboard"
          component={SuperAdminDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LeaderDashboard"
          component={LeaderDashboard}
          options={{ headerShown: false }}
        />

        {/* AYYUKAN KUDI DA SAYEN DATA/AIRTIME */}
        <Stack.Screen name="BuyAirtime" component={AirtimeScreen} options={{ title: "Buy Airtime" }} />
        <Stack.Screen name="FundWallet" component={FundWalletScreen} options={{ title: "Fund Wallet" }} />
        <Stack.Screen name="BuyData" component={BuyDataScreen} options={{ title: "Buy Data Bundle" }} />
        <Stack.Screen name="Electricity" component={ElectricityScreen} options={{ title: "Electricity Bills" }} />
        <Stack.Screen name="Cable" component={CableScreen} options={{ title: "Cable TV Subscription" }} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="NewSale" component={SuccessScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SalesHistory" component={HistoryScreen} options={{ title: "Transaction History" }} />
        <Stack.Screen name="SalesLogs" component={HistoryScreen} options={{ title: "Sales Logs" }} />

        {/* PROFILE DA SECURITY */}
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UpdatePin" component={UpdatePin} options={{ headerShown: false }} />
        <Stack.Screen name="Contact" component={ContactScreen} options={{ title: "Contact Support" }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "App Settings" }} />

        {/* IDENTITY: NIMC & BVN */}
        <Stack.Screen name="NIMC" component={NIMCScreen} options={{ title: "NIMC Services" }} />
        <Stack.Screen name="BVNScreen" component={BVNScreen} options={{ title: "BVN Verification" }} />
        <Stack.Screen name="NIMCRequests" component={NIMCRequests} options={{ title: "NIMC Processing Queue" }} />
        <Stack.Screen name="NimcRequests" component={NIMCRequests} options={{ title: "NIMC Requests" }} />
        <Stack.Screen name="NIMCModification" component={NIMCModificationScreen} options={{ title: "NIMC Modification" }} />
        <Stack.Screen name="NIMCHistory" component={NIMCHistory} options={{ title: "NIMC Request History" }} />
        <Stack.Screen name="BVNHistory" component={BVNHistory} options={{ title: "BVN History" }} />
        <Stack.Screen name="NINValidation" component={NINValidation} options={{ title: "NIN Validation" }} />

        {/* ADMIN & SUPERVISOR TOOLS */}
        <Stack.Screen name="AdminUserControl" component={AdminControlScreen} options={{ title: "Admin User Controls" }} />
        <Stack.Screen name="AdminControl" component={AdminControlScreen} options={{ title: "System Controls" }} />
        <Stack.Screen name="UserManagement" component={UserManagement} options={{ title: "User Directory" }} />
        <Stack.Screen name="SuperAdminUsers" component={UserManagement} options={{ title: "SuperAdmin Users" }} />
        <Stack.Screen name="AllUsers" component={UserManagement} options={{ title: "All Registered Accounts" }} />
        <Stack.Screen name="AssignTarget" component={AssignTargetScreen} options={{ title: "Assign Targets" }} />
        <Stack.Screen name="AssignTargets" component={AssignTargetScreen} options={{ title: "Target Allocation" }} />
        <Stack.Screen name="CreateSupervisor" component={CreateSupervisorScreen} options={{ title: "Enroll Supervisor" }} />
        <Stack.Screen name="ManageAgents" component={ManageAgentsScreen} options={{ title: "Manage Agent Outlets" }} />
        <Stack.Screen name="PricingSettings" component={PricingSettings} options={{ title: "Pricing Engine Configuration" }} />

        {/* PLACEHOLDERS & EXTRA SCREENS */}
        <Stack.Screen name="IssueResolution" component={PlaceholderScreen} />
        <Stack.Screen name="BvnRequests" component={PlaceholderScreen} />
        <Stack.Screen name="DataPlans" component={PlaceholderScreen} />
        <Stack.Screen name="CableTvPlans" component={PlaceholderScreen} />
        <Stack.Screen name="SupportActivities" component={PlaceholderScreen} />

        {/* LEGAL & POLICIES */}
        <Stack.Screen name="About" component={AboutScreen} options={{ title: "About Bellaj Data Hub" }} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: "Privacy Policy" }} />
        <Stack.Screen name="Terms" component={TermsScreen} options={{ title: "Terms of Service" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}