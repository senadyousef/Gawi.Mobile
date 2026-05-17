import React from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import Colors from "../constants/Colors";
import i18n from "../localization";
import { useAppContext } from "../context";

// ---------------- THEME ----------------
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#ffffff",
  surface: dark ? "#1E1E1E" : "#ffffff",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#444444",
  border: dark ? "#2C2C2C" : "#EEEEEE",

  primary: Colors.primary,
  accent: Colors.tertiary,
});

// ---------------- TYPES ----------------
interface OfferDetailsProps {
  offer: {
    id: number;
    nameAr: string;
    nameEn: string;
    photoUrl: string;
    isViewForAll: boolean;
    contentAr: string;
    contentEn: string;
  };
}

// ---------------- COMPONENT ----------------
export default function OfferDetailsScreen() {
  const BASE_URL = "https://gym.useitsmart.com";

  const route = useRoute<RouteProp<{ params: OfferDetailsProps }, "params">>();
  const { offer } = route.params;

  const { isDarkMode } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const isArabic = i18n.locale === "ar";

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Image source={{ uri: `${BASE_URL}${offer.photoUrl}` }} style={s.image} />

      <Text
        style={[
          s.title,
          isArabic && { textAlign: "right", writingDirection: "rtl" },
        ]}
      >
        {isArabic ? offer.nameAr : offer.nameEn}
      </Text>

      <Text
        style={[
          s.description,
          isArabic && { textAlign: "right", writingDirection: "rtl" },
        ]}
      >
        {isArabic ? offer.contentAr : offer.contentEn}
      </Text>
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

    content: {
      padding: 20,
    },

    image: {
      width: "100%",
      height: 200,
      borderRadius: 12,
      marginBottom: 20,
    },

    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.primary,
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginTop: 15,
      marginBottom: 6,
      color: theme.primary,
    },

    description: {
      fontSize: 14,
      color: theme.ink,
      lineHeight: 22,
    },
  });
