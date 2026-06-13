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
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#ffffff",
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
        <Stack.Screen name="NewSale" component={SuccessScreen} />
        <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />

        <Stack.Screen name="Dashboard" component={HomeScreen} />
        <Stack.Screen name="BuyAirtime" component={AirtimeScreen} />
        <Stack.Screen name="FundWallet" component={FundWalletScreen} />
        <Stack.Screen name="BuyData" component={BuyDataScreen} />
        <Stack.Screen name="Electricity" component={ElectricityScreen} />
        <Stack.Screen name="NIMC" component={NIMCScreen} />
        <Stack.Screen name="BVNScreen" component={BVNScreen} />
        <Stack.Screen name="Cable" component={CableScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />

        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AgentDashboard" component={AgentDashboard} />
        <Stack.Screen name="SupportDashboard" component={SupportDashboard} />
        <Stack.Screen name="SupervisorDashboard" component={SupervisorDashboard} />
        <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />

        <Stack.Screen name="AdminUserControl" component={AdminControlScreen} />
        <Stack.Screen name="AdminControl" component={AdminControlScreen} />

        <Stack.Screen name="UserManagement" component={UserManagement} />
        <Stack.Screen name="SuperAdminUsers" component={UserManagement} />
        <Stack.Screen name="AllUsers" component={UserManagement} />

        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="AssignTarget" component={AssignTargetScreen} />
        <Stack.Screen name="AssignTargets" component={AssignTargetScreen} />
        <Stack.Screen name="LeaderDashboard" component={LeaderDashboard} />
        <Stack.Screen name="CreateSupervisor" component={CreateSupervisorScreen} />
        <Stack.Screen name="ManageAgents" component={ManageAgentsScreen} />

        <Stack.Screen name="NIMCRequests" component={NIMCRequests} />
        <Stack.Screen name="NimcRequests" component={NIMCRequests} />
        <Stack.Screen name="NIMCModification" component={NIMCModificationScreen} />
        <Stack.Screen name="NIMCHistory" component={NIMCHistory} />
        <Stack.Screen name="BVNHistory" component={BVNHistory} />
        <Stack.Screen name="UpdatePin" component={UpdatePin} />

        <Stack.Screen name="SalesHistory" component={HistoryScreen} />
        <Stack.Screen name="SalesLogs" component={HistoryScreen} />

        <Stack.Screen name="IssueResolution" component={PlaceholderScreen} />
        <Stack.Screen name="PricingSettings" component={PlaceholderScreen} />
        <Stack.Screen name="BvnRequests" component={PlaceholderScreen} />
        <Stack.Screen name="DataPlans" component={PlaceholderScreen} />
        <Stack.Screen name="CableTvPlans" component={PlaceholderScreen} />
        <Stack.Screen name="SupportActivities" component={PlaceholderScreen} />

        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="NINValidation" component={NINValidation} />
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