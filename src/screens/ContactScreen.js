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
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import BASE_URL from "../config/api";

const COLORS = {
  primary: "#E60000",
  secondary: "#0B5E3C",
  dark: "#0F172A",
  white: "#FFFFFF",
  light: "#F8FAFC",
  muted: "#64748B",
  border: "#E2E8F0",
  softRed: "#FFF1F1",
  softGreen: "#EAF7F1",
};

const CONTACT = {
  phone: "+2349075207281",
  whatsapp: "2349075207281",
  email: "bellajdatahub@gmail.com",
  website: "https://bellajdatahub.online",
  displayWebsite: "bellajdatahub.online",
  address: "Kano State, Nigeria",
};

const ContactScreen = ({ navigation }) => {
  const goBack = () => {
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const openMenu = () => {
    const parent = navigation?.getParent?.();

    if (navigation?.openDrawer) {
      navigation.openDrawer();
      return;
    }

    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }

    navigation?.navigate?.("Main");
  };

  const makeCall = async () => {
    try {
      await Linking.openURL(`tel:${CONTACT.phone}`);
    } catch {
      Alert.alert("Error", "Unable to make call.");
    }
  };

  const copyNumber = async () => {
    await Clipboard.setStringAsync(CONTACT.phone);
    Alert.alert("Copied", "Phone number copied successfully.");
  };

  const openWhatsApp = async () => {
    const message = "Hello Bellaj Data Hub Support, I need assistance.";
    const appUrl = `whatsapp://send?phone=${CONTACT.whatsapp}&text=${encodeURIComponent(
      message
    )}`;
    const webUrl = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
      message
    )}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      Alert.alert("Error", "Unable to open WhatsApp.");
    }
  };

  const sendEmail = async () => {
    try {
      await Linking.openURL(
        `mailto:${CONTACT.email}?subject=Bellaj Data Hub Support Request`
      );
    } catch {
      Alert.alert("Error", "Unable to open email app.");
    }
  };

  const openWebsite = async () => {
    try {
      await Linking.openURL(CONTACT.website);
    } catch {
      Alert.alert("Error", "Unable to open website.");
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerIconBtn} onPress={openMenu}>
          <Ionicons name="menu" size={25} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <Text style={styles.headerSubtitle}>Bellaj Data Hub Help Center</Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="headset"
              size={34}
              color={COLORS.white}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>We are here to help</Text>
            <Text style={styles.heroText}>
              Reach Bellaj Data Hub support through call, WhatsApp, email or website.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.contactCard} onPress={makeCall}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.softRed }]}>
            <Ionicons name="call-outline" size={27} color={COLORS.primary} />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>Call Support</Text>
            <Text style={styles.value}>{CONTACT.phone}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={copyNumber}>
          <View style={[styles.iconCircle, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="copy-outline" size={27} color="#4F46E5" />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>Copy Phone Number</Text>
            <Text style={styles.value}>{CONTACT.phone}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.softGreen }]}>
            <Ionicons name="logo-whatsapp" size={28} color={COLORS.secondary} />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>WhatsApp Chat</Text>
            <Text style={styles.value}>Chat with Bellaj Support</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={sendEmail}>
          <View style={[styles.iconCircle, { backgroundColor: "#FFF7ED" }]}>
            <Ionicons name="mail-outline" size={27} color="#EA580C" />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{CONTACT.email}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={openWebsite}>
          <View style={[styles.iconCircle, { backgroundColor: "#DBEAFE" }]}>
            <Ionicons name="globe-outline" size={27} color="#2563EB" />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>Official Website</Text>
            <Text style={styles.value}>{CONTACT.displayWebsite}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </TouchableOpacity>

        <View style={styles.contactCard}>
          <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="location-outline" size={27} color="#D97706" />
          </View>

          <View style={styles.infoText}>
            <Text style={styles.label}>Office Address</Text>
            <Text style={styles.value}>{CONTACT.address}</Text>
          </View>
        </View>

        <View style={styles.supportBox}>
          <Text style={styles.supportTitle}>Support Hours</Text>
          <Text style={styles.supportText}>Monday - Sunday</Text>
          <Text style={styles.supportText}>24 Hours Customer Support</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={makeCall}>
            <Ionicons name="call" size={21} color={COLORS.white} />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={openWhatsApp}>
            <Ionicons name="logo-whatsapp" size={21} color={COLORS.white} />
            <Text style={styles.actionText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={sendEmail}>
            <Ionicons name="mail" size={21} color={COLORS.white} />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Bellaj Data Hub response time is usually fast through WhatsApp support.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? 42 : 22,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTextBox: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#FFE4E4",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
    flexGrow: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroTitle: {
    color: COLORS.dark,
    fontSize: 20,
    fontWeight: "900",
  },
  heroText: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: "600",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    marginLeft: 14,
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: "700",
  },
  value: {
    fontSize: 15,
    color: COLORS.dark,
    fontWeight: "900",
    marginTop: 3,
  },
  supportBox: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    marginTop: 8,
  },
  supportTitle: {
    color: COLORS.dark,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  supportText: {
    color: COLORS.muted,
    fontWeight: "700",
    marginBottom: 3,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    minHeight: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: "900",
    fontSize: 12,
  },
  footerText: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 25,
  },
});

export default ContactScreen;