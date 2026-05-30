import React from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";

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

const PrivacyPolicyScreen = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.headerTitle}>Privacy Policy</Text>

      <Text style={styles.date}>Effective Date: May 2026</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>

        <Text style={styles.bodyText}>
          Bellaj Data Hub collects information necessary to provide digital
          services efficiently and securely. This may include your full name,
          phone number, email address, transaction records, account details, and
          service usage information.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>

        <Text style={styles.bodyText}>
          Your information is used to process transactions, verify identities,
          provide customer support, improve our services, maintain platform
          security, and comply with regulatory requirements where applicable.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. Security Measures</Text>

        <Text style={styles.bodyText}>
          Security is a top priority at Bellaj Data Hub. We utilize
          industry-standard encryption, secure authentication methods, and
          protected infrastructure to safeguard customer data and financial
          transactions.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Biometric Authentication</Text>

        <Text style={styles.bodyText}>
          Where biometric login features such as Face ID or Fingerprint
          Authentication are enabled, biometric information remains securely
          managed by your device and is not stored on Bellaj Data Hub servers.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Third-Party Services</Text>

        <Text style={styles.bodyText}>
          Bellaj Data Hub may share limited information with trusted service
          providers, payment processors, telecommunication networks, and utility
          providers solely for the purpose of completing requested services and
          transactions.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>6. Data Protection Commitment</Text>

        <Text style={styles.bodyText}>
          We do not sell customer personal information. Customer data is handled
          responsibly and protected in accordance with applicable privacy and
          data protection standards.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>7. Policy Updates</Text>

        <Text style={styles.bodyText}>
          Bellaj Data Hub reserves the right to update this Privacy Policy when
          necessary. Updated versions will be made available within the
          application and become effective immediately after publication.
        </Text>
      </View>

      <View style={styles.noticeBox}>
        <Text style={styles.noticeTitle}>Your Privacy Matters</Text>

        <Text style={styles.noticeText}>
          We are committed to protecting your information and providing a secure
          digital experience every time you use Bellaj Data Hub.
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
    padding: 20,
    paddingBottom: 50,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 5,
  },

  date: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 20,
    fontWeight: "bold",
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
  },

  noticeBox: {
    backgroundColor: COLORS.softGreen,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    marginTop: 5,
  },

  noticeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.secondary,
    marginBottom: 8,
    textAlign: "center",
  },

  noticeText: {
    color: COLORS.dark,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default PrivacyPolicyScreen;
