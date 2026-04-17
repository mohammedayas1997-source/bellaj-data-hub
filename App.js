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
import ContactScreen from "./src/screens/ContactScreen"; // Added this import

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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
