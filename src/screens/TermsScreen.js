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
      <View style={styles.page}>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <Text style={styles.headerSub}>Bellaj Data Hub User Agreement</Text>

        <View style={styles.scrollBox}>
          <ScrollView
            style={styles.innerScroll}
            contentContainerStyle={styles.innerContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {[
              [
                "1. Acceptance of Terms",
                "By creating an account or using Bellaj Data Hub services, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions. Continued use of the platform constitutes acceptance of all applicable rules and policies.",
              ],
              [
                "2. Account Responsibility",
                "Users are solely responsible for maintaining the security of their login credentials, transaction PINs, and device access. Any activity carried out through your account shall be considered authorized by the account owner.",
              ],
              [
                "3. Transaction Policy",
                "All purchases of airtime, data subscriptions, cable TV services, electricity units, and identity verification services should be carefully reviewed before confirmation. Successfully completed digital transactions are generally non-refundable except where service failure is verified by Bellaj Data Hub.",
              ],
              [
                "4. Service Availability",
                "While Bellaj Data Hub strives to provide uninterrupted services, temporary outages may occur due to maintenance, network provider issues, banking disruptions, or events beyond our reasonable control.",
              ],
              [
                "5. Prohibited Activities",
                "Users must not engage in fraudulent transactions, unauthorized access attempts, identity theft, money laundering, abuse of promotional offers, or any activity that violates applicable laws and regulations.",
              ],
              [
                "6. Limitation of Liability",
                "Bellaj Data Hub shall not be liable for indirect, consequential, incidental, or special damages resulting from service interruptions, network failures, banking delays, or third-party system malfunctions beyond our operational control.",
              ],
              [
                "7. Policy Updates",
                "Bellaj Data Hub reserves the right to modify these Terms and Conditions at any time. Updated versions will become effective immediately after publication within the application.",
              ],
            ].map(([title, body]) => (
              <View style={styles.card} key={title}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.bodyText}>{body}</Text>
              </View>
            ))}

            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>Important Notice</Text>
              <Text style={styles.noticeText}>
                By continuing to use Bellaj Data Hub, you agree to comply with
                all platform policies, security requirements, and applicable
                financial regulations.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.light },
  page: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 35 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 29,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
  },
  headerSub: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 16,
  },
  scrollBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    elevation: 3,
  },
  innerScroll: { flex: 1 },
  innerContent: {
    padding: 16,
    paddingBottom: 35,
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

export default TermsScreen;
