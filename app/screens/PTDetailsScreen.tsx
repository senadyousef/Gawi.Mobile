import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { handleGetToken } from "../helpers";
import i18n from "../localization";
import { useAppContext } from "../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F6FA",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#555555",
  subtle: dark ? "#888888" : "#777777",
  empty: dark ? "#666666" : "#999999",
  dayText: dark ? "#F0F0F0" : "#000000",
  border: dark ? "#2C2C2C" : "transparent",
  icon: dark ? "#F0F0F0" : "#000000",
});

export default function PTDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { trainer }: any = route.params || {};
  const { isDarkMode } = useAppContext(); // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const isAr = i18n.locale === "ar";

  if (!trainer) {
    return (
      <View style={s.container}>
        <Text style={s.emptyText}>{i18n.t("no_trainer_data")}</Text>
      </View>
    );
  }
  const DAY_SHORT_TO_FULL = {
    sun: "sunday",
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
  };

  const normalizeApiDay = (day) => {
    if (!day) return "";
    return DAY_SHORT_TO_FULL[day.toLowerCase()] || day;
  };
  const handleCancelClass = async (cls: any) => {
    Alert.alert(
      i18n.t("cancel_class"),
      `${i18n.t("cancel_confirmation")} ${cls.fromHour} - ${cls.toHour}?`,
      [
        { text: i18n.t("no") },
        {
          text: i18n.t("yes"),
          onPress: async () => {
            try {
              const token = await handleGetToken();
              const response = await fetch(
                `https://gym.useitsmart.com/api/PTClass/${cls.ptClassId}`,
                {
                  method: "DELETE",
                  headers: { accept: "*/*", Authorization: `Bearer ${token}` },
                },
              );
              if (!response.ok)
                throw new Error(`Failed to cancel class: ${response.status}`);
              trainer.ptWithUserAllClassDto =
                trainer.ptWithUserAllClassDto.filter(
                  (c: any) => c.ptClassId !== cls.ptClassId,
                );
              navigation.setParams({ trainer: { ...trainer } });
              alert(i18n.t("class_canceled_success"));
            } catch (error) {
              alert(i18n.t("class_cancel_failed"));
            }
          },
        },
      ],
    );
  };

  const myClasses = trainer.ptWithUserAllClassDto?.filter(
    (c: any) => c.isMyClass,
  );
  const otherClasses = trainer.ptWithUserAllClassDto?.filter(
    (c: any) => !c.isMyClass,
  );

  const parseDateTime = (dateStr: string, timeStr: string) => {
    if (!timeStr) return new Date(dateStr);
    let hour = 0,
      min = 0,
      period = "AM";
    if (timeStr.includes(" ")) {
      const [hourMin, ampm] = timeStr.split(" ");
      period = ampm;
      const parts = hourMin.split(":");
      hour = Number(parts[0]);
      min = parts[1] ? Number(parts[1]) : 0;
    } else if (timeStr.includes(":")) {
      const parts = timeStr.split(":");
      hour = Number(parts[0]);
      min = parts[1] ? Number(parts[1]) : 0;
    } else {
      hour = Number(timeStr);
    }
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    const dateObj = new Date(dateStr);
    dateObj.setHours(hour, min, 0, 0);
    return dateObj;
  };

  const formatTimeAMPM = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const renderClassCard = (cls: any, isMyClass: boolean, index: number) => {
    const fromDate = parseDateTime(cls.date, cls.fromHour);
    const toDate = parseDateTime(cls.date, cls.toHour);
    const formattedDate = fromDate.toDateString();
    const formattedTime = `${formatTimeAMPM(fromDate)} - ${formatTimeAMPM(toDate)}`;

    return (
      <TouchableOpacity
        key={index}
        style={[
          s.classCard,
          isMyClass ? s.myClassCard : s.otherClassCard,
          { flexDirection: isAr ? "row-reverse" : "row" },
        ]}
        onPress={() => isMyClass && handleCancelClass(cls)}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              s.classDate,
              {
                textAlign: isAr ? "right" : "left",
                writingDirection: isAr ? "rtl" : "ltr",
              },
            ]}
          >
            {formattedDate}
          </Text>
          <Text
            style={[
              s.classTime,
              {
                textAlign: isAr ? "right" : "left",
                writingDirection: isAr ? "rtl" : "ltr",
              },
            ]}
          >
            {formattedTime}
          </Text>
          {isMyClass && (
            <Text
              style={[
                s.tapText,
                {
                  textAlign: isAr ? "right" : "left",
                  writingDirection: isAr ? "rtl" : "ltr",
                },
              ]}
            >
              {i18n.t("tap_to_cancel")}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={s.container}>
      {/* Header Image */}
      <View style={s.headerContainer}>
        <Image
          source={{ uri: `https://gym.useitsmart.com${trainer.url}` }}
          style={s.headerImage}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "transparent"]}
          style={s.headerOverlay}
        />
        <Text
          style={[
            s.ptName,
            {
              textAlign: isAr ? "right" : "left",
              writingDirection: isAr ? "rtl" : "ltr",
              left: isAr ? undefined : 16,
              right: isAr ? 16 : undefined,
            },
          ]}
        >
          {trainer.ptName}
        </Text>
      </View>

      <View style={s.infoContainer}>
        {/* Working Days */}
        <View style={[s.section, { direction: isAr ? "rtl" : "ltr" }]}>
          <Text
            style={[
              s.sectionTitle,
              {
                textAlign: isAr ? "right" : "left",
                writingDirection: isAr ? "rtl" : "ltr",
              },
            ]}
          >
            {i18n.t("working_days")}
          </Text>
          <View style={s.daysContainer}>
            {trainer.ptDaysDto?.map((day: any, index: number) => (
              <View
                key={index}
                style={[
                  s.dayCard,
                  { flexDirection: isAr ? "row-reverse" : "row" },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={16}
                  color={theme.icon} // 👈
                  style={{
                    marginRight: isAr ? 0 : 6,
                    marginLeft: isAr ? 6 : 0,
                  }}
                />
                <View>
                  <Text
                    style={[
                      s.dayText,
                      {
                        textAlign: isAr ? "right" : "left",
                        writingDirection: isAr ? "rtl" : "ltr",
                      },
                    ]}
                  >
                    {normalizeApiDay(day.day)}
                  </Text>
                  <Text
                    style={[
                      s.timeText,
                      {
                        textAlign: isAr ? "right" : "left",
                        writingDirection: isAr ? "rtl" : "ltr",
                      },
                    ]}
                  >
                    {day.fromHour} - {day.toHour}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* My Classes */}
        <View style={s.section}>
          <Text
            style={[
              s.sectionTitle,
              {
                textAlign: isAr ? "right" : "left",
                writingDirection: isAr ? "rtl" : "ltr",
              },
            ]}
          >
            {i18n.t("my_bookings")}
          </Text>
          {myClasses?.length ? (
            myClasses.map((cls: any, index: number) =>
              renderClassCard(cls, true, index),
            )
          ) : (
            <Text style={s.emptyText}>{i18n.t("no_booked_classes")}</Text>
          )}
        </View>

        {/* Other Classes */}
        <View style={s.section}>
          <Text
            style={[
              s.sectionTitle,
              {
                textAlign: isAr ? "right" : "left",
                writingDirection: isAr ? "rtl" : "ltr",
              },
            ]}
          >
            {i18n.t("other_bookings")}
          </Text>
          {otherClasses?.length ? (
            otherClasses.map((cls: any, index: number) =>
              renderClassCard(cls, false, index),
            )
          ) : (
            <Text style={s.emptyText}>{i18n.t("no_other_booked_classes")}</Text>
          )}
        </View>

        {/* Book Trainer Button */}
        <TouchableOpacity
          style={s.bookButton}
          onPress={() => navigation.navigate("BookPT", { trainer })}
        >
          <LinearGradient
            colors={["#FF8C00", "#FF8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bookGradient}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 16,
                textAlign: "center",
                writingDirection: isAr ? "rtl" : "ltr",
              }}
            >
              {i18n.t("book_this_trainer")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg, // 👈
    },
    headerContainer: { position: "relative" },
    headerImage: {
      width: "100%",
      height: 220,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      resizeMode:"contain"
    },
    headerOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    ptName: {
      position: "absolute",
      bottom: 16,
      fontSize: 26,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    infoContainer: { padding: 16 },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 12,
      color: theme.ink, // 👈
    },
    daysContainer: { flexDirection: "row", flexWrap: "wrap" },
    dayCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface, // 👈
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginRight: 10,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 0.5,
      borderColor: theme.border, // 👈
    },
    dayText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.dayText, // 👈
    },
    timeText: {
      fontSize: 12,
      color: theme.dayText, // 👈
    },
    classCard: {
      padding: 16,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 3,
      backgroundColor: theme.surface, // 👈
      borderWidth: 0.5,
      borderColor: theme.border, // 👈
    },
    myClassCard: { borderLeftWidth: 6, borderLeftColor: "#4CAF50" },
    otherClassCard: { borderLeftWidth: 6, borderLeftColor: "#E53935" },
    classDate: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 4,
      color: theme.ink, // 👈
    },
    classTime: {
      fontSize: 13,
      fontWeight: "500",
      marginBottom: 2,
      color: theme.muted, // 👈
    },
    tapText: {
      fontSize: 12,
      color: theme.subtle, // 👈
    },
    emptyText: {
      fontSize: 14,
      fontStyle: "italic",
      color: theme.empty, // 👈
    },
    bookButton: { borderRadius: 20, overflow: "hidden", marginTop: 12 },
    bookGradient: { paddingVertical: 16, alignItems: "center" },
  });
