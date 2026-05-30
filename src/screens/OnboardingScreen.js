import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
};

const OnboardingScreen = ({ navigation }) => {
  return (
    <View style={styles.desktopWrapper}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={["#FFFFFF", "#F8FAFC", "#ECFDF5"]}
        style={styles.background}
      >
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.textCard}>
              <Text style={styles.title}>WELCOME TO BELLAJ DATA HUB</Text>

              <Text style={styles.description}>
                Fast data subscriptions, airtime recharge, electricity payments,
                cable TV subscriptions, BVN/NIN services, and secure digital
                transactions all in one platform.
              </Text>

              <View style={styles.motivationBox}>
                <Text style={styles.motivation}>
                  "Your trusted digital service partner for seamless
                  connectivity and smarter transactions."
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.replace("Login")}
            >
              <LinearGradient
                colors={["#0B5E3C", "#16A34A"]}
                style={styles.button}
              >
                <Text style={styles.buttonText}>GET STARTED</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  desktopWrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  background: {
    flex: 1,
    width: width > 600 ? 600 : "100%",
    alignSelf: "center",
  },

  container: {
    flex: 1,
    paddingHorizontal: 25,
    justifyContent: "space-between",
    paddingBottom: 40,
  },

  logoContainer: {
    flex: 0.3,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },

  logo: {
    width: 120,
    height: 120,
  },

  contentContainer: {
    flex: 0.45,
    justifyContent: "center",
    alignItems: "center",
  },

  textCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1,
  },

  description: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },

  motivationBox: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  motivation: {
    fontSize: 13,
    color: COLORS.dark,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "600",
    lineHeight: 20,
  },

  buttonContainer: {
    flex: 0.15,
    justifyContent: "center",
    paddingBottom: 20,
  },

  button: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    elevation: 8,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});

export default OnboardingScreen;