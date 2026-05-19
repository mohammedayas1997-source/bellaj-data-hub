import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SuccessScreen = ({ navigation }) => {
  const scaleValue = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.iconCircle, { transform: [{ scale: scaleValue }] }]}
      >
        <Ionicons name="checkmark-done-circle" size={100} color="#10b981" />
      </Animated.View>

      <Text style={styles.title}>DEPLOYMENT COMPLETE</Text>
      <Text style={styles.subtitle}>
        Your profile and virtual banking infrastructure have been successfully
        integrated into the Ayax architecture.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonText}>ACCESS TERMINAL</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconCircle: { marginBottom: 30 },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#64748b",
    textAlign: "center",
    fontSize: 14,
    marginTop: 10,
    lineHeight: 22,
    width: "80%",
  },
  button: {
    marginTop: 40,
    backgroundColor: "#1e3a8a",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 5,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1,
  },
});

export default SuccessScreen;
