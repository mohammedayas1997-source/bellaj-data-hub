import React from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        bounces
      >
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>About Bellaj Data Hub</Text>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../assets/Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Our Identity</Text>
            <Text style={styles.bodyText}>
              Bellaj Data Hub is a modern digital service platform committed to
              delivering affordable data subscriptions, airtime purchases,
              electricity payments, cable TV subscriptions, identity
              verification services, and other essential digital solutions
              across Nigeria.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.bodyText}>
              Our mission is to make digital services faster, cheaper, safer,
              and accessible to everyone. We believe every Nigerian deserves
              reliable connectivity and convenient access to digital solutions
              without unnecessary stress or high costs.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Our Vision</Text>
            <Text style={styles.bodyText}>
              To become one of Nigeria&apos;s most trusted digital utility
              platforms by providing innovative technology solutions,
              exceptional customer service, and dependable transaction
              processing nationwide.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Why Choose Bellaj Data Hub?</Text>

            <Text style={styles.bodyText}>
              • Instant Transaction Processing{"\n"}• Affordable Data & Airtime
              Rates{"\n"}• Secure Payment Infrastructure{"\n"}• Reliable Utility
              Services{"\n"}• Professional Customer Support{"\n"}•
              User-Friendly Experience{"\n"}• Trusted Digital Solutions
            </Text>
          </View>

          <View style={styles.highlightBox}>
            <Text style={styles.highlightTitle}>Fast • Secure • Reliable</Text>

            <Text style={styles.highlightText}>
              Bellaj Data Hub is designed to provide seamless digital services
              with speed, transparency, and reliability you can trust.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 35 : 20,
    paddingBottom: 60,
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",
  },
  headerBox: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },
  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    elevation: 4,
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
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
  card: {
    backgroundColor: COLORS.light,
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
    fontWeight: "500",
  },
  highlightBox: {
    backgroundColor: COLORS.softGreen,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 5,
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
});

export default AboutScreen;