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
import BASE_URL from "../config/api";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const OnboardingScreen = ({ navigation }) => {
  return (
    <View style={styles.desktopWrapper}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={[COLORS.primary, "#990000", COLORS.secondary]}
        style={styles.background}
      >
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/bellaj_logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.contentContainer}>
            <LinearGradient
              colors={["rgba(255,255,255,0.98)", "rgba(255,255,255,0.88)"]}
              style={styles.textCard}
            >
              <Text style={styles.title}>WELCOME TO BELLAJ DATA HUB</Text>

              <Text style={styles.description}>
                Fast data, airtime, bill payments, and digital services at your
                fingertips.
              </Text>

              <View style={styles.motivationBox}>
                <Text style={styles.motivation}>
                  "Stay connected, pay smarter, and enjoy reliable digital
                  services with Bellaj Data Hub."
                </Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.replace("Login")}
            >
              <LinearGradient
                colors={[COLORS.secondary, "#063B26"]}
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
    backgroundColor: COLORS.dark,
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
    flex: 0.28,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  logoCircle: {
    width: 145,
    height: 145,
    borderRadius: 72.5,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
  },
  logo: {
    width: 115,
    height: 115,
  },
  contentContainer: {
    flex: 0.48,
    justifyContent: "center",
    alignItems: "center",
  },
  textCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.white,
    width: "95%",
    elevation: 20,
  },
  title: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: "#334155",
    textAlign: "center",
    lineHeight: 21,
    fontWeight: "600",
    marginBottom: 10,
  },
  motivationBox: {
    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
    paddingTop: 10,
  },
  motivation: {
    fontSize: 12,
    color: COLORS.dark,
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "700",
    lineHeight: 18,
  },
  buttonContainer: {
    flex: 0.15,
    justifyContent: "center",
    paddingBottom: 20,
  },
  button: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    elevation: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});

export default OnboardingScreen;
