import React from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
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

const PrivacyPolicyScreen = () => {
  const privacySections = [
    [
      "1. Information We Collect",
      "Bellaj Data Hub collects information necessary to provide digital services efficiently and securely. This may include your full name, phone number, email address, transaction records, account details, and service usage information.",
    ],
    [
      "2. How We Use Your Information",
      "Your information is used to process transactions, verify identities, provide customer support, improve our services, maintain platform security, and comply with regulatory requirements where applicable.",
    ],
    [
      "3. Security Measures",
      "Security is a top priority at Bellaj Data Hub. We utilize industry-standard encryption, secure authentication methods, and protected infrastructure to safeguard customer data and financial transactions.",
    ],
    [
      "4. Biometric Authentication",
      "Where biometric login features such as Face ID or Fingerprint Authentication are enabled, biometric information remains securely managed by your device and is not stored on Bellaj Data Hub servers.",
    ],
    [
      "5. Third-Party Services",
      "Bellaj Data Hub may share limited information with trusted service providers, payment processors, telecommunication networks, and utility providers solely for the purpose of completing requested services and transactions.",
    ],
    [
      "6. Data Protection Commitment",
      "We do not sell customer personal information. Customer data is handled responsibly and protected in accordance with applicable privacy and data protection standards.",
    ],
    [
      "7. Policy Updates",
      "Bellaj Data Hub reserves the right to update this Privacy Policy when necessary. Updated versions will be made available within the application and become effective immediately after publication.",
    ],
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.date}>Effective Date: May 2026</Text>
        </View>

        <View style={styles.contentCard}>
          {privacySections.map(([title, body]) => (
            <View style={styles.card} key={title}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.bodyText}>{body}</Text>
            </View>
          ))}

          <View style={styles.noticeBox}>
            <Text style={styles.noticeTitle}>Your Privacy Matters</Text>

            <Text style={styles.noticeText}>
              We are committed to protecting your information and providing a
              secure digital experience every time you use Bellaj Data Hub.
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

  header: {
    alignItems: "center",
    marginBottom: 18,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },

  date: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "700",
  },

  contentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    elevation: 3,
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

  noticeBox: {
    backgroundColor: COLORS.softGreen,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 5,
  },

  noticeTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: "center",
  },

  noticeText: {
    color: COLORS.dark,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
});

export default PrivacyPolicyScreen;