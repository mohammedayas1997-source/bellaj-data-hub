import React from "react";
import { ScrollView, Text, StyleSheet, View, Image } from "react-native";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const AboutScreen = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.headerTitle}>About Bellaj Data Hub</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Our Identity</Text>

        <Text style={styles.bodyText}>
          Bellaj Data Hub is a modern digital service platform committed to
          delivering affordable data subscriptions, airtime purchases,
          electricity payments, cable TV subscriptions, identity verification
          services, and other essential digital solutions across Nigeria.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Our Mission</Text>

        <Text style={styles.bodyText}>
          Our mission is to make digital services faster, cheaper, safer, and
          accessible to everyone. We believe every Nigerian deserves reliable
          connectivity and convenient access to digital solutions without
          unnecessary stress or high costs.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Our Vision</Text>

        <Text style={styles.bodyText}>
          To become one of Nigeria's most trusted digital utility platforms by
          providing innovative technology solutions, exceptional customer
          service, and dependable transaction processing nationwide.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Why Choose Bellaj Data Hub?</Text>

        <Text style={styles.bodyText}>
          • Instant Transaction Processing{"\n"}• Affordable Data & Airtime
          Rates{"\n"}• Secure Payment Infrastructure{"\n"}• Reliable Utility
          Services{"\n"}• Professional Customer Support{"\n"}• User-Friendly
          Experience{"\n"}• Trusted Digital Solutions
        </Text>
      </View>

      <View style={styles.highlightBox}>
        <Text style={styles.highlightTitle}>Fast • Secure • Reliable</Text>

        <Text style={styles.highlightText}>
          Bellaj Data Hub is designed to provide seamless digital services with
          speed, transparency, and reliability you can trust.
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },

  contentContainer: {
    padding: 25,
    paddingBottom: 50,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },

  logo: {
    width: 120,
    height: 120,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },

  card: {
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.secondary,
    marginBottom: 10,
  },

  bodyText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    fontWeight: "500",
  },

  highlightBox: {
    backgroundColor: COLORS.softGreen,
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },

  highlightTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 8,
    textAlign: "center",
  },

  highlightText: {
    color: COLORS.dark,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default AboutScreen;
