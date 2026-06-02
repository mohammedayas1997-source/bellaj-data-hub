import React from "react";
import {
  ScrollView,
  Text,
  StyleSheet,
  View,
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

const TermsScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <Text style={styles.headerSub}>Bellaj Data Hub User Agreement</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.bodyText}>
            By creating an account or using Bellaj Data Hub services, you
            acknowledge that you have read, understood, and agreed to be bound
            by these Terms and Conditions. Continued use of the platform
            constitutes acceptance of all applicable rules and policies.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Account Responsibility</Text>
          <Text style={styles.bodyText}>
            Users are solely responsible for maintaining the security of their
            login credentials, transaction PINs, and device access. Any activity
            carried out through your account shall be considered authorized by
            the account owner.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Transaction Policy</Text>
          <Text style={styles.bodyText}>
            All purchases of airtime, data subscriptions, cable TV services,
            electricity units, and identity verification services should be
            carefully reviewed before confirmation. Successfully completed
            digital transactions are generally non-refundable except where
            service failure is verified by Bellaj Data Hub.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Service Availability</Text>
          <Text style={styles.bodyText}>
            While Bellaj Data Hub strives to provide uninterrupted services,
            temporary outages may occur due to maintenance, network provider
            issues, banking disruptions, or events beyond our reasonable
            control.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>5. Prohibited Activities</Text>
          <Text style={styles.bodyText}>
            Users must not engage in fraudulent transactions, unauthorized
            access attempts, identity theft, money laundering, abuse of
            promotional offers, or any activity that violates applicable laws
            and regulations.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
          <Text style={styles.bodyText}>
            Bellaj Data Hub shall not be liable for indirect, consequential,
            incidental, or special damages resulting from service interruptions,
            network failures, banking delays, or third-party system malfunctions
            beyond our operational control.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>7. Policy Updates</Text>
          <Text style={styles.bodyText}>
            Bellaj Data Hub reserves the right to modify these Terms and
            Conditions at any time. Updated versions will become effective
            immediately after publication within the application.
          </Text>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>Important Notice</Text>
          <Text style={styles.noticeText}>
            By continuing to use Bellaj Data Hub, you agree to comply with all
            platform policies, security requirements, and applicable financial
            regulations.
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
  headerTitle: {
    fontSize: 29,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 5,
  },
  headerSub: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 22,
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
  noticeBox: {
    width: "100%",
    backgroundColor: COLORS.softGreen,
    padding: 20,
    borderRadius: 16,
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
  bottomSpace: {
    height: 35,
  },
});

export default TermsScreen;
