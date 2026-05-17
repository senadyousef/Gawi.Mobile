import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../localization";
import { useFocusEffect } from "@react-navigation/native";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg:      dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border:  dark ? "#2C2C2C" : "#E8E0D0",
  hairline:dark ? "#252525" : "#EDE8DF",
  ink:     dark ? "#F0F0F0" : "#1A1A1A",
  muted:   dark ? "#888888" : "#8A8070",
  accent:  "#C8F04A",
});

interface Props {
  refreshTrigger?: number;
}

export default function GymTrafficVisual({ refreshTrigger = 0 }: Props) {
  const { guestMode, isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);             // 👈 reactive styles

  const [currentUsers, setCurrentUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const isArabic = i18n.locale?.startsWith("ar");
  const bars = 28;

  const fetchCurrentUsers = async () => {
    if (guestMode) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      const MemberId = await AsyncStorage.getItem("MemberId");
      if (!MemberId) throw new Error("MemberId missing");

      const res = await fetch(
        `https://gym.useitsmart.com/api/MemberShips/currentMembersForMember?memberId=${MemberId}`,
        {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const result = await res.json();

      const realUsers =
        typeof result === "number"
          ? result
          : Array.isArray(result)
          ? result.length
          : result?.count || 0;

      setCurrentUsers(realUsers);
    } catch (err) {
      console.error("Error fetching current users:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCurrentUsers();
    }, [guestMode])
  );

  useEffect(() => {
    if (refreshTrigger > 0) fetchCurrentUsers();
  }, [refreshTrigger]);

  // ─── Guest state ──────────────────────────────────────────────────────────
  if (guestMode) {
    return (
      <View style={[s.guestContainer, isArabic && { flexDirection: "row-reverse" }]}>
        <View style={s.guestIconWrap}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.muted} />
        </View>
        <Text style={[s.guestText, { textAlign: isArabic ? "right" : "left" }]}>
          {i18n.t("gym_guest_message")}
        </Text>
      </View>
    );
  }

  // ─── Traffic thresholds ───────────────────────────────────────────────────
  const maxCapacity = 100;
  const occupancy = Math.min(currentUsers / maxCapacity, 1);
  const filledBars = Math.round(occupancy * bars);

  let trafficStatus = i18n.t("traffic_low");
  let statusColor = "#4CAF50";
  if (currentUsers >= 50) {
    trafficStatus = i18n.t("traffic_high");
    statusColor = "#E53935";
  } else if (currentUsers >= 10) {
    trafficStatus = i18n.t("traffic_medium");
    statusColor = "#F59E0B";
  }

  return (
    <View style={s.card}>
      {/* Header row */}
      <View style={[s.headerRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>
            {loading ? "..." : "Live · " + i18n.t("gym_traffic_title")}
          </Text>
          <Text style={s.cardTitle}>{trafficStatus}</Text>
        </View>
        <View style={s.metricChip}>
          <View style={[s.dot, { backgroundColor: statusColor }]} />
          <Text style={s.metricText}>
            {currentUsers} / {maxCapacity}
          </Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={s.barsRow}>
        {Array.from({ length: bars }).map((_, i) => {
          const filled = i < filledBars;
          const h = Math.max(
            8,
            14 + Math.sin(i * 0.7) * 8 + (i % 5 === 0 ? 12 : 0) + (filled ? 10 : 0)
          );
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: h,
                backgroundColor: filled ? theme.ink : theme.hairline,
                borderRadius: 2,
              }}
            />
          );
        })}
      </View>

      {/* Time labels */}
      <View style={s.timeRow}>
        {["6a", "10a", "2p", "6p", "10p"].map((t) => (
          <Text key={t} style={s.timeLabel}>{t}</Text>
        ))}
      </View>

      {/* Sub text */}
      <Text style={[s.subText, { textAlign: isArabic ? "right" : "left" }]}>
        {`${currentUsers} ${currentUsers === 1 ? i18n.t("user") : i18n.t("users")} ${i18n.t("inside")}`}
      </Text>
    </View>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    card: {
      marginVertical: 10,
      marginTop: 20,
      padding: 20,
      borderRadius: 24,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerRow: {
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    eyebrow: {
      fontSize: 11,
      color: theme.muted,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      fontFamily: "SF-Medium",
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.ink,
      letterSpacing: -0.3,
      marginTop: 2,
    },
    metricChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: theme.bg,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    metricText: {
      fontFamily: "SF-Medium",
      fontSize: 12,
      color: theme.ink,
    },
    barsRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      height: 44,
      gap: 3,
      marginBottom: 8,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    timeLabel: {
      fontSize: 11,
      color: theme.muted,
      fontFamily: "SF-Medium",
    },
    subText: {
      fontSize: 12,
      color: theme.muted,
      fontFamily: "SF-Medium",
    },
    guestContainer: {
      borderRadius: 24,
      padding: 20,
      marginVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    guestIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    guestText: {
      flex: 1,
      fontSize: 13,
      color: theme.muted,
      fontFamily: "SF-Medium",
      lineHeight: 18,
    },
  });