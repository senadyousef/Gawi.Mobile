import * as React from "react";
import { Istore } from "../../types";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { shadowStyle, width } from "../../constants";
import { handleGetLocalizedField } from "../../helpers";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "../overridedComponents";
import { Image, StyleProp, StyleSheet, ViewStyle } from "react-native";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : Colors.secondary,
  primary: dark ? "#C8F04A" : Colors.primary,
  iconBg: dark ? "#2C2C2C" : Colors.tertiary,
  iconColor: dark ? "#F0F0F0" : Colors.secondary,
});

interface Props {
  item: Istore;
  onPress: (e: Istore) => void;
  containerStyles?: StyleProp<ViewStyle>;
  isDarkMode?: boolean; // 👈 ADD
}

const CARD_HEIGHT = 250;

const StoreCard: React.FC<Props> = ({
  item,
  onPress,
  containerStyles,
  isDarkMode, // 👈 ADD
}) => {
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const { isArabic, getDirection } = useI18n();

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={[shadowStyle, s.cardWrapper, containerStyles]}
    >
      <View style={[s.container, { height: CARD_HEIGHT }]}>
        {/* Image */}
        <Image
          style={s.image}
          source={{
            uri:
              item.photoUrl && item.photoUrl.trim() !== ""
                ? item.photoUrl
                : "https://via.placeholder.com/300x300.png?text=No+Image",
          }}
        />

        {/* Info */}
        <View
          style={[
            s.infoContainer,
            getDirection(),
            { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
          ]}
        >
          <View
            style={[
              s.textSection,
              { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
            ]}
          >
            <Text style={s.title} numberOfLines={2} ellipsizeMode="tail">
              {handleGetLocalizedField("nameEn", "nameAr", item)}
            </Text>
            <Text style={s.typeText}>{item.type || "—"}</Text>
          </View>

          <View style={s.iconWrapper}>
            <MaterialCommunityIcons
              size={16}
              color={theme.iconColor} // 👈
              name={isArabic() ? "chevron-left" : "chevron-right"}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default StoreCard;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    cardWrapper: {
      marginBottom: 15,
    },
    container: {
      borderRadius: 14,
      width: (width - 47) / 2,
      backgroundColor: theme.surface, // 👈
      overflow: "hidden",
      justifyContent: "space-between",
    },
    image: {
      width: "100%",
      height: "65%",
      resizeMode: "cover",
    },
    infoContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    textSection: {
      flex: 1,
      paddingRight: 8,
    },
    title: {
      fontSize: 12,
      fontFamily: "SF-Medium",
      color: theme.ink, // 👈
      textAlign: "left",
      marginBottom: 4,
      minHeight: 32,
      flexShrink: 1,
    },
    typeText: {
      fontSize: 13,
      fontFamily: "SF-Semibold",
      color: theme.primary, // 👈
    },
    iconWrapper: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.iconBg, // 👈
    },
  });
