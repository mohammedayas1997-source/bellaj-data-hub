import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
  Alert,
} from "react-native";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#121212",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#F1F5F9",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const ContactScreen = () => {
  const phoneNumber = "+2349061244444";
  const emailAddress = "support@bellajdatahub.com";
  const whatsappNumber = "2349061244444";

  const makeCall = () => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openWhatsApp = async () => {
    const message = "Hello Bellaj Data Hub Support, I need help with...";
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(
      message,
    )}`;
    const webUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(
      message,
    )}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open WhatsApp. Please try again.");
    }
  };

  const sendEmail = () => {
    Linking.openURL(
      `mailto:${emailAddress}?subject=Support Request - Bellaj Data Hub`,
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <Text style={styles.headerSub}>How can Bellaj help you today?</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.contactCard} onPress={makeCall}>
          <View
            style={[styles.iconCircle, { backgroundColor: COLORS.softRed }]}
          >
            <Text style={styles.icon}>📞</Text>
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>Call Us</Text>
            <Text style={styles.value}>{phoneNumber}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
          <View
            style={[styles.iconCircle, { backgroundColor: COLORS.softGreen }]}
          >
            <Text style={styles.icon}>💬</Text>
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>WhatsApp Chat</Text>
            <Text style={styles.value}>Chat with Support</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={sendEmail}>
          <View style={[styles.iconCircle, { backgroundColor: "#FFF7ED" }]}>
            <Text style={styles.icon}>✉️</Text>
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{emailAddress}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Bellaj Data Hub response time is usually within 24 hours.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    padding: 30,
    backgroundColor: COLORS.light,
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 5,
  },
  content: {
    padding: 20,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  iconCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 24,
  },
  infoText: {
    marginLeft: 20,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: "bold",
    marginTop: 2,
  },
  footer: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
  },
});

export default ContactScreen;
