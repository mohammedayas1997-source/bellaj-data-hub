// src/screens/NotificationsScreen.js
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

const NotificationsScreen = () => {
  // Anan zaka kwaso sakonnin daga Server (API)
  const notifications = [
    {
      id: "1",
      title: "Admin Update",
      message: "Kada a manta da sabon farashin data",
    },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text>{item.message}</Text>
          </View>
        )}
      />
    </View>
  );
};
