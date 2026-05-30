import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ThemeContext = createContext();

export const LIGHT_THEME = {
  name: "light",

  colors: {
    primary: "#E60000",
    secondary: "#0B5E3C",

    background: "#F8FAFC",
    card: "#FFFFFF",

    text: "#121212",
    subText: "#64748B",

    border: "#E2E8F0",

    success: "#0B5E3C",
    danger: "#E60000",
    warning: "#F59E0B",

    white: "#FFFFFF",
  },
};

export const DARK_THEME = {
  name: "dark",

  colors: {
    primary: "#FF4D4D",
    secondary: "#14A44D",

    background: "#0F172A",
    card: "#1E293B",

    text: "#FFFFFF",
    subText: "#CBD5E1",

    border: "#334155",

    success: "#22C55E",
    danger: "#EF4444",
    warning: "#F59E0B",

    white: "#FFFFFF",
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("bellaj_dark_mode");

      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.log("Bellaj Theme Load Error:", error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newValue = !isDarkMode;

      setIsDarkMode(newValue);

      await AsyncStorage.setItem("bellaj_dark_mode", JSON.stringify(newValue));
    } catch (error) {
      console.log("Bellaj Theme Save Error:", error);
    }
  };

  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        toggleTheme,
        theme,
        colors: theme.colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
