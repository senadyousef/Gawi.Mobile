import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../localization";
import { useFocusEffect } from "@react-navigation/native";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  hairline: dark ? "#252525" : "#EDE8DF",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#C8F04A",
});

interface Props {
  refreshTrigger?: number;
}

export default function GymTrafficVisual({ refreshTrigger = 0 }: Props) {
  const { guestMode, isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const [traffic, setTraffic] = useState({
    currentMembers: 0,
    maxCapacity: 0,
    occupancyPercentage: 0,
    trafficLevel: "Low",
  });

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
        `https://gym.useitsmart.com/api/MemberShips/currentMembersForMemberTraffic?memberId=${MemberId}`,
        {
          headers: {
            Accept: "text/plain",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
       console.log("data" , data)
      setTraffic({
        currentMembers: data.currentMembers ?? 0,
        maxCapacity: data.maxCapacity ?? 0,
        occupancyPercentage: data.occupancyPercentage ?? 0,
        trafficLevel: data.trafficLevel ?? "Low",
      });
    } catch (err) {
      console.error("Error fetching traffic:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCurrentUsers();
    }, [guestMode]),
  );

  useEffect(() => {
    if (refreshTrigger > 0) fetchCurrentUsers();
  }, [refreshTrigger]);

  // ─── Guest state ──────────────────────────────────────────────────────────
  if (guestMode) {
    return (
      <View
        style={[s.guestContainer, isArabic && { flexDirection: "row-reverse" }]}
      >
        <View style={s.guestIconWrap}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.muted} />
        </View>
        <Text style={[s.guestText, { textAlign: isArabic ? "right" : "left" }]}>
          {i18n.t("gym_guest_message")}
        </Text>
      </View>
    );
  }
  const barHeight = 32;
  // ─── Traffic thresholds ───────────────────────────────────────────────────
  const currentUsers = traffic.currentMembers;

  const maxCapacity =
    traffic.maxCapacity > 0 ? traffic.maxCapacity : currentUsers;

  const occupancy = Math.min(traffic.occupancyPercentage / 100, 1);

  const filledBars = Math.round(occupancy * bars);

  let trafficStatus = i18n.t("traffic_low");
  let statusColor = "#4CAF50";

  let chartColor = "#4CAF50";

  switch (traffic.trafficLevel?.toLowerCase()) {
    case "busy":
      trafficStatus = i18n.t("traffic_high");
      statusColor = "#E53935";
      chartColor = "#E53935";
      break;

    case "medium":
      trafficStatus = i18n.t("traffic_medium");
      statusColor = "#F59E0B";
      chartColor = "#F59E0B";
      break;

    default:
      trafficStatus = i18n.t("traffic_low");
      statusColor = "#4CAF50";
      chartColor = "#4CAF50";
  }

  return (
    <View style={s.card}>
      {/* Header row */}
      <View
        style={[
          s.headerRow,
          { flexDirection: isArabic ? "row-reverse" : "row" },
        ]}
      >
        {isArabic ? (
          <>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
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
          </>
        ) : (
          <>
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
          </>
        )}
      </View>

      {/* Bar chart */}
      <View style={s.barsRow}>
        {Array.from({ length: bars }).map((_, i) => {
          const filled = i < filledBars;

          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: barHeight,
               backgroundColor: filled ? chartColor : theme.hairline,
                borderRadius: 2,
              }}
            />
          );
        })}
      </View>

      {/* Sub text */}
      <Text style={[s.subText, { textAlign: isArabic ? "right" : "left" }]}>
        {`${currentUsers} ${
          currentUsers === 1 ? i18n.t("user") : i18n.t("users")
        } ${i18n.t("inside")} • ${traffic.occupancyPercentage}%`}{" "}
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
