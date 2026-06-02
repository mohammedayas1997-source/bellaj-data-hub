import React from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Image,
  SafeAreaView,
  Platform,
} from "react-native";

const COLORS = {
  primary: "#0B5E3C",
  secondary: "#16A34A",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softGreen: "#EAF7F1",
};

const AboutScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../assets/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
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
            To become one of Nigeria&apos;s most trusted digital utility
            platforms by providing innovative technology solutions, exceptional
            customer service, and dependable transaction processing nationwide.
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
            Bellaj Data Hub is designed to provide seamless digital services
            with speed, transparency, and reliability you can trust.
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.light,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },

  contentContainer: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 35 : 20,
    paddingBottom: 45,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },

  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5,
  },

  logo: {
    width: 90,
    height: 90,
  },

  headerTitle: {
    fontSize: 27,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 22,
    textAlign: "center",
  },

  card: {
    width: "100%",
    backgroundColor: COLORS.white,
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 10,
  },

  bodyText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    fontWeight: "500",
  },

  highlightBox: {
    width: "100%",
    backgroundColor: COLORS.softGreen,
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  highlightTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: "center",
  },

  highlightText: {
    color: COLORS.dark,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },

  bottomSpace: {
    height: 35,
  },
});

export default AboutScreen;
