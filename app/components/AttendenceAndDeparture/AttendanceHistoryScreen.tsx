import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import i18n from "../../localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : Colors.background || "#F5F5F5",
  bgEnd: dark ? "#1E1E1E" : "#FFFFFF",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  border: dark ? "#2C2C2C" : Colors.primary || "#007AFF",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#555555",
  date: dark ? "#CCCCCC" : "#333333",
  loadingBg: dark ? "#121212" : "#FFFFFF",
});

interface AttendanceItem {
  id: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

export default function AttendanceHistoryScreen() {
  const { isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const [attendanceData, setAttendanceData] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceHistory = async () => {
    try {
      const memberId = await AsyncStorage.getItem("MemberId");
      if (!memberId) {
        Alert.alert(i18n.t("error"), i18n.t("member_id_not_found"));
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://gym.useitsmart.com/api/MemberShips/getMemberAttendanceHistory?id=${memberId}`,
      );

      if (!response.ok) {
        const text = await response.text();
        Alert.alert(i18n.t("error"), text || i18n.t("an_error_occured"));
        setLoading(false);
        return;
      }

      const data: AttendanceItem[] = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error("Attendance fetch error:", error);
      Alert.alert(i18n.t("error"), i18n.t("an_error_occured"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  if (loading) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: theme.loadingBg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10, color: theme.muted }}>
          {i18n.t("loading")}
        </Text>
      </View>
    );
  }

  if (!attendanceData.length) {
    return (
      <View style={[s.loadingContainer, { backgroundColor: theme.loadingBg }]}>
        <Text style={{ color: theme.muted }}>
          {i18n.t("no_attendance_data")}
        </Text>
      </View>
    );
  }
  const formatTo12Hour = (timeStr: string): string => {
    if (!timeStr) return i18n.t("no_data");
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr || "00";
    const period = hour >= 12 ? "PM" : "AM";
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${hour.toString().padStart(2, "0")}:${minute} ${period}`;
  };

  return (
    // 👇 gradient adapts to dark mode
    <LinearGradient colors={[theme.bg, theme.bgEnd]} style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContent}>
        <Text style={s.headerTitle}>{i18n.t("attendance_history")}</Text>

        {attendanceData.map((item) => {
          const isRTL = i18n.locale === "ar";
          const formattedDate = new Date(item.date).toLocaleDateString(
            isRTL ? "ar-EG" : "en-US",
            { year: "numeric", month: "long", day: "numeric" },
          );

          return (
            <View key={item.id} style={s.card}>
              {/* Card header */}
              <View
                style={[
                  s.cardHeader,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={24}
                  color={Colors.primary || "#007AFF"}
                />
                <Text
                  style={[
                    s.dateText,
                    {
                      textAlign: isRTL ? "right" : "left",
                      marginLeft: isRTL ? 0 : 8,
                      marginRight: isRTL ? 8 : 0,
                    },
                  ]}
                >
                  {formattedDate}
                </Text>
              </View>

              {/* Check in row */}
              <View
                style={[
                  s.row,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <Text style={s.label}>{i18n.t("check_in_label")}</Text>
                <Text
                  style={[s.value, { textAlign: isRTL ? "left" : "right" }]}
                >
                  {formatTo12Hour(item.fromHour)}
                </Text>
              </View>

              <View
                style={[
                  s.row,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <Text style={s.label}>{i18n.t("check_out_label")}</Text>
                <Text
                  style={[s.value, { textAlign: isRTL ? "left" : "right" }]}
                >
                  {formatTo12Hour(item.toHour)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors.primary || "#007AFF",
      marginBottom: 20,
      textAlign: "center",
    },
    card: {
      backgroundColor: theme.surface, // 👈
      borderRadius: 12,
      padding: 16,
      marginBottom: 15,
      borderWidth: 2,
      borderColor: theme.border, // 👈
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    dateText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.date, // 👈
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    label: {
      fontSize: 14,
      color: theme.muted, // 👈
    },
    value: {
      fontSize: 14,
      color: theme.ink, // 👈
      fontWeight: "600",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
