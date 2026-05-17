import React from "react";
import { View, Text, StyleSheet, Image, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context";

// ---------------- THEME ----------------
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#ffffff",
  surface: dark ? "#1E1E1E" : "#ffffff",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#888888",
  border: dark ? "#2C2C2C" : "#EEEEEE",

  primary: Colors.primary,
  accent: Colors.tertiary,
});

export default function NewsDetailsScreen() {
  const route = useRoute();
  const { item } = route.params;

  const { isDarkMode } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView style={s.container}>
      <Image source={{ uri: item.photo }} style={s.image} />

      <View style={s.content}>
        <View style={s.dateRow}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={theme.primary}
          />
          <Text style={s.dateText}>{item.date || ""}</Text>
        </View>

        <Text style={s.title}>{item.title}</Text>

        <Text style={s.description}>{item.description}</Text>
      </View>
    </ScrollView>
  );
}

// ---------------- STYLES ----------------
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    image: {
      width: "100%",
      height: 220,
    },

    content: {
      padding: 20,
    },

    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },

    dateText: {
      marginLeft: 6,
      fontSize: 13,
      color: theme.muted,
    },

    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.primary,
      marginBottom: 10,
    },

    description: {
      fontSize: 15,
      color: theme.ink,
      lineHeight: 22,
    },
  });