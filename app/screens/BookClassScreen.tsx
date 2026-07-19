import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import i18n from "../localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F6F8FC",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#1E293B",
  muted: dark ? "#64748B" : "#94A3B8",
  arrowColor: dark ? "#94A3B8" : "#FF7002",
  underline: dark ? "#475569" : "#CBD5E1",
  emptyText: dark ? "#F0F0F0" : "#000000",
});

interface GymClass {
  id: number;
  nameAr: string;
  nameEn: string;
  photoUrl: string;
  date: string;
  form: string;
  to: string;
  isBooked: boolean;
  capacity: number;
}

export default function BookClassScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppContext(); // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const isArabic = i18n.locale === "ar";

  const fetchClasses = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const MemberId = await AsyncStorage.getItem("MemberId");

      const response = await fetch(
        `https://gym.useitsmart.com/api/GymClass/getAllGymClassByUser?userId=${MemberId}`,
        { headers: { accept: "text/plain" } },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      setClasses(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses(false);
  };
  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - start.getDay());
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const hasClasses = classes.some(
        (cls) => cls.date.split("T")[0] === dateStr,
      );
      const dayNames = isArabic
        ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      days.push({
        date,
        dateStr,
        day: date.getDate(),
        dayName: dayNames[i],
        hasClasses,
      });
    }
    return days;
  };

  const weekDays = getWeekDays();
  const currentMonth = currentWeekStart.toLocaleDateString(
    isArabic ? "ar" : "en",
    {
      month: "long",
      year: "numeric",
    },
  );
  const displayedClasses = selectedDate
    ? classes.filter((cls) => cls.date.split("T")[0] === selectedDate)
    : classes;

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: theme.ink }}>{i18n.t("loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: "red" }}>{i18n.t("error_loading")}</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={[s.header, { textAlign: isArabic ? "right" : "center" }]}>
        {i18n.t("available_classes")}
      </Text>

      {/* Week Calendar */}
      <View style={s.calendarContainer}>
        {/* Month Navigation */}
        <View style={s.monthHeader}>
          <TouchableOpacity onPress={handlePrevWeek}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color={theme.arrowColor} // 👈
            />
          </TouchableOpacity>
          <Text style={s.monthText}>{currentMonth}</Text>
          <TouchableOpacity onPress={handleNextWeek}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={theme.arrowColor} // 👈
            />
          </TouchableOpacity>
        </View>

        {/* Week Days */}
        <View style={s.weekContainer}>
          {weekDays.map((item) => {
            const classesForDay = classes.filter(
              (cls) => cls.date.split("T")[0] === item.dateStr,
            );
            const hasBooked = classesForDay.some((c) => c.isBooked);
            const hasUnbooked = classesForDay.some((c) => !c.isBooked);

            const dots = [];
            if (hasBooked)
              dots.push(
                <View
                  key="booked"
                  style={[s.dot, { backgroundColor: "#3B82F6" }]}
                />,
              );
            if (hasUnbooked)
              dots.push(
                <View
                  key="unbooked"
                  style={[s.dot, { backgroundColor: "#FF7002" }]}
                />,
              );

            return (
              <View key={item.dateStr} style={s.dayColumn}>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedDate(
                      selectedDate === item.dateStr ? undefined : item.dateStr,
                    )
                  }
                  style={[
                    s.dayCircle,
                    selectedDate === item.dateStr && s.dayCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      s.dayNumber,
                      selectedDate === item.dateStr && s.dayNumberSelected,
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
                <Text style={s.dayName}>{item.dayName}</Text>
                {dots.length > 0 && <View style={s.dotsContainer}>{dots}</View>}
              </View>
            );
          })}
        </View>

        {selectedDate && (
          <View style={s.underlineContainer}>
            <View style={s.underline} />
          </View>
        )}
      </View>
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(undefined)}
          style={{
            backgroundColor: "#FF7002",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            {isArabic ? "جميع الحصص" : "All Classes"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Classes for selected date */}
      {displayedClasses.length > 0 ? (
        <FlatList
          data={displayedClasses}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]} // Android
              tintColor={Colors.primary} // iOS
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.cardContainer}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("ClassDetails", { classId: item.id })
              }
            >
              <ImageBackground
                source={{ uri: `https://gym.useitsmart.com/${item.photoUrl}` }}
                style={s.imageBackground}
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,1)"]}
                  style={s.gradientOverlay}
                />
                <View
                  style={[
                    s.statusLabel,
                    { backgroundColor: item.isBooked ? "#3B82F6" : "#FF7002" },
                  ]}
                >
                  <Text
                    style={[
                      s.statusText,
                      {
                        textAlign: isArabic ? "right" : "left",
                        writingDirection: isArabic ? "rtl" : "ltr",
                      },
                    ]}
                  >
                    {item.isBooked
                      ? i18n.t("already_booked")
                      : i18n.t("available")}
                  </Text>
                </View>
                <View style={s.cardContent}>
                  <Text style={s.classType}>
                    {isArabic ? item.nameAr : item.nameEn}
                  </Text>
                  <View style={s.infoRow}>
                    <MaterialCommunityIcons
                      name="calendar"
                      size={16}
                      color="#FF7002"
                    />
                    <Text
                      style={[
                        s.infoText,
                        {
                          textAlign: isArabic ? "right" : "left",
                          writingDirection: isArabic ? "rtl" : "ltr",
                        },
                      ]}
                    >
                      {item.form}:00 - {item.to}:00
                    </Text>
                  </View>
                  <View style={s.infoRow}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={16}
                      color="#FF7002"
                    />
                    <Text
                      style={[
                        s.infoText,
                        {
                          textAlign: isArabic ? "right" : "left",
                          writingDirection: isArabic ? "rtl" : "ltr",
                        },
                      ]}
                    >
                      {i18n.t("capacity")}: {item.capacity}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      ) : (
        <View style={s.center}>
          <Text
            style={[
              { color: theme.emptyText, marginTop: 20 },
              {
                textAlign: isArabic ? "right" : "center",
                writingDirection: isArabic ? "rtl" : "ltr",
              },
            ]}
          >
            {i18n.t("no_class_on_date")}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.bg, // 👈
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg, // 👈
    },
    header: {
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 16,
      color: theme.ink, // 👈
    },
    calendarContainer: {
      marginBottom: 20,
      borderRadius: 12,
      paddingVertical: 16,
      backgroundColor: theme.surface, // 👈
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    monthHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      marginBottom: 20,
    },
    monthText: {
      fontSize: 18,
      fontWeight: "400",
      letterSpacing: 0.5,
      color: theme.ink, // 👈
    },
    weekContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 8,
      paddingBottom: 16,
    },
    dayColumn: { alignItems: "center", flex: 1 },
    dayCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    dayCircleSelected: { backgroundColor: "#FF7002" },
    dayNumber: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.ink, // 👈
    },
    dayNumberSelected: { color: "#FFFFFF" },
    dayName: {
      fontSize: 13,
      fontWeight: "500",
      marginBottom: 6,
      color: theme.muted, // 👈
    },
    dotsContainer: { flexDirection: "row", gap: 3, marginTop: 2 },
    dot: { width: 5, height: 5, borderRadius: 2.5 },
    underlineContainer: { alignItems: "center", paddingTop: 8 },
    underline: {
      width: 100,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: theme.underline, // 👈
    },
    cardContainer: {
      marginVertical: 12,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 5,
      backgroundColor: theme.surface, // 👈
    },
    imageBackground: { height: 180, justifyContent: "flex-end" },
    gradientOverlay: { ...StyleSheet.absoluteFillObject },
    cardContent: { padding: 16 },
    classType: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: 6,
    },
    infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    infoText: { color: "#FF7002", marginLeft: 6, fontSize: 14 },
    statusLabel: {
      position: "absolute",
      top: 10,
      right: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 10,
    },
    statusText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 12 },
  });
