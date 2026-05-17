import * as React from "react";
import { width } from "../../constants";
import Colors from "../../constants/Colors";
import { Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "../overridedComponents";
import i18n from "../../localization";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  border: dark ? "#2C2C2C" : "#EEEEEE",
  ink: dark ? "#F0F0F0" : Colors.primary,
  muted: dark ? "#888888" : Colors.gray,
  body: dark ? "#CCCCCC" : Colors.secondary,
});

interface Props {
  item: {
    id: number;
    nameAr: string;
    nameEn: string;
    photoUrl: string;
    contentAr: string;
    contentEn: string;
    newsDate?: string;
  };
  isExpanded?: boolean;
  isDarkMode?: boolean; // 👈 ADD
}

const BASE_URL = "https://gym.useitsmart.com";

const NewsCard: React.FC<Props> = ({
  item,
  isExpanded = false,
  isDarkMode,
}) => {
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const navigation = useNavigation();
  const language = i18n.locale;

  const title = language === "ar" ? item.nameAr : item.nameEn;
  const content = language === "ar" ? item.contentAr : item.contentEn;

  const imageUrl = item.photoUrl?.startsWith("http")
    ? item.photoUrl
    : `${BASE_URL}${item.photoUrl}`;

  return (
    <TouchableOpacity
      activeOpacity={isExpanded ? 1 : 0.7}
      onPress={() =>
        navigation.navigate("NewsDetails", {
          item: { title, photo: imageUrl, description: content },
        })
      }
    >
      <View style={[s.container]}>
        <Image source={{ uri: imageUrl }} style={s.image} resizeMode="cover" />
        <View
          style={[
            s.innerContainer,
            { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
          ]}
        >
          <Text style={s.title}>{title}</Text>

          {item.newsDate && (
            <View style={s.dateWrapper}>
              <MaterialCommunityIcons
                size={14}
                color={theme.muted}
                name="calendar-month-outline"
              />
              <Text style={s.dateText}>{item.newsDate}</Text>
            </View>
          )}

          {isExpanded && <Text style={s.paragraph}>{content}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NewsCard;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: theme.surface,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    image: {
      height: 120,
      width: width - 32,
    },
    innerContainer: {
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.ink,
      fontFamily: "SF-Medium",
    },
    dateWrapper: {
      gap: 4,
      flexDirection: "row",
      alignItems: "center",
    },
    dateText: {
      fontSize: 12,
      color: theme.muted,
      fontFamily: "SF-Thin",
    },
    paragraph: {
      fontSize: 14,
      paddingTop: 6,
      color: theme.body,
      lineHeight: 20,
      textAlign: "justify",
      fontFamily: "SF-Medium",
    },
  });
