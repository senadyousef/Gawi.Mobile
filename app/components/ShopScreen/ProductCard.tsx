import * as React from "react";
import { shadowStyle, width } from "../../constants";
import { IshopItem } from "../../types";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "../overridedComponents";
import { Image, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { handleGetLocalizedField } from "../../helpers";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  imageBg: dark ? "#2C2C2C" : "#F5F5F5",
  ink: dark ? "#F0F0F0" : Colors.secondary,
  primary: dark ? "#C8F04A" : Colors.primary,
  iconBg: dark ? "#2C2C2C" : Colors.tertiary,
  iconColor: dark ? "#F0F0F0" : Colors.secondary,
});

interface Props {
  item: IshopItem;
  containerStyles?: StyleProp<ViewStyle>;
  handleShowProductDetails: (e: IshopItem) => void;
  isDarkMode?: boolean; // 👈 ADD
}

const CARD_HEIGHT = 250;

const ProductCard: React.FC<Props> = ({
  item,
  containerStyles,
  handleShowProductDetails,
  isDarkMode, // 👈 ADD
}) => {
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const { isArabic, getDirection } = useI18n();

  const imageUrl =
    item.photoUrl && item.photoUrl.trim() !== ""
      ? item.photoUrl
      : "https://via.placeholder.com/300x300.png?text=No+Image";

  return (
    <TouchableOpacity
      onPress={() => handleShowProductDetails(item)}
      style={[shadowStyle, s.cardWrapper, containerStyles]}
    >
      <View style={[s.container, { height: CARD_HEIGHT }]}>
        {/* Image */}
        <View style={s.imageWrapper}>
          <Image
            style={s.image}
            source={{ uri: imageUrl }}
            resizeMode="cover"
          />
        </View>

        {/* Info */}
        <View
          style={[
            s.infoWrapper,
            getDirection(),
            { backgroundColor: isDarkMode ? "#000" : "#fff" },
          ]}
        >
          <View
            style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }}
          >
            <Text style={s.title} numberOfLines={2} ellipsizeMode="tail">
              {handleGetLocalizedField("nameEn", "nameAr", item)}
            </Text>
            <Text style={s.typeText}>{item.type || "—"}</Text>
          </View>
          <View style={[s.iconWrapper]}>
            <MaterialCommunityIcons
              size={16}
              color={theme.iconColor}
              name={isArabic() ? "chevron-left" : "chevron-right"}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProductCard;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    cardWrapper: {
      marginBottom: 15,
    },
    container: {
      width: (width - 47) / 2,
      borderRadius: 12,
      backgroundColor: theme.surface,
      justifyContent: "space-between",
      overflow: "hidden",
    },
    imageWrapper: {
      width: "100%",
      height: "65%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.imageBg,
    },
    image: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    infoWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
    title: {
      fontSize: 12,
      fontFamily: "SF-Medium",
      color: theme.ink,
      marginBottom: 4,
    },
    typeText: {
      fontSize: 13,
      color: theme.primary,
      fontFamily: "SF-Semibold",
    },
    iconWrapper: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.iconBg,
    },
  });
