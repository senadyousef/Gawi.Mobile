import * as React from "react";
import Colors from "../../constants/Colors";
import { handleGetLocalizedField } from "../../helpers";
import { Text, TouchableOpacity } from "../overridedComponents";
import { Image, ImageStyle, StyleProp, StyleSheet, View } from "react-native";
import i18n from "../../localization";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : Colors.secondary,
  muted: dark ? "#888888" : "#777777",
});

interface Props {
  item: any;
  imageStyle: StyleProp<ImageStyle>;
  handleOpenEvent: (e: any) => void;
  isDarkMode?: boolean; // 👈 ADD
}

const ClassCard: React.FC<Props> = ({
  item,
  imageStyle,
  handleOpenEvent,
  isDarkMode, // 👈 ADD
}) => {
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const localizedName = handleGetLocalizedField("nameEn", "nameAr", item);

  const classDate = new Date(item.date);
  const formattedDate = classDate.toLocaleDateString();

  // Compare only the date, not the time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const classDay = new Date(classDate);
  classDay.setHours(0, 0, 0, 0);

  const isEnded = classDay < today;
  const isBooked = item.isBooked;
  // 👇 full = capacity reached and the user hasn't already booked it
  const isFull =
    !isBooked &&
    typeof item.capacity === "number" &&
    typeof item.bookedCount === "number" &&
    item.bookedCount >= item.capacity;

  const badgeLabel = isEnded
    ? i18n.t("ended")
    : isBooked
      ? i18n.t("booked")
      : isFull
        ? i18n.t("class_full_short")
        : i18n.t("available");

  const badgeColor = isEnded
    ? "#9E9E9E" // Gray
    : isBooked
      ? "#FF9800" // Red
      : isFull
        ? "#FF5252" // Orange
        : "#4CAF50"; // Green

  return (
    <TouchableOpacity
      onPress={() => handleOpenEvent(item)}
      // disabled={isFull}
      // style={isFull && { opacity: 0.6 }}
    >
      <View style={s.container}>
        <View>
          <Image
            source={{ uri: `https://gawifit.com/${item.photoUrl}` }}
            style={[s.image, imageStyle]}
            resizeMode="cover"
          />
          <View style={[s.badge, { backgroundColor: badgeColor }]}>
            <Text style={s.badgeText}>{badgeLabel}</Text>
          </View>
        </View>

        <Text style={s.name}>{localizedName}</Text>
        <Text style={s.details}>{formattedDate}</Text>
        <Text style={s.details}>
          {i18n.t("capacity")}: {item.bookedCount ?? 0}/{item.capacity}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ClassCard;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      gap: 5,
      alignItems: "center",
      width: 140,
    },
    image: {
      backgroundColor: theme.surface,
      borderRadius: 10,
      width: 130,
      height: 150,
    },
    name: {
      fontSize: 13,
      textAlign: "center",
      color: theme.ink,
      fontWeight: "600",
    },
    details: {
      fontSize: 11,
      textAlign: "center",
      color: theme.muted,
    },
    badge: {
      position: "absolute",
      top: 8,
      right: 8,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
  });
