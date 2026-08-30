import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../localization";
import { useFocusEffect } from "@react-navigation/native";
import gymHub from "../../services/gymHubConnection"; // 👈
import { handleGetToken } from "../../helpers";

const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  hairline: dark ? "#252525" : "#EDE8DF",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#C8F04A",
});

const AUTO_REFRESH_MS = 10000; // 👈 fallback poll interval, keeps the number moving even if a websocket push is missed
const HOURLY_CHART_HEIGHT = 64;
const HOUR_COL_WIDTH = 34;

interface Props {
  refreshTrigger?: number;
}

interface HourlyEstimate {
  hour: number;
  actualVisits: number;
  estimatedVisits: number;
  isEstimated: boolean;
}

interface AttendanceEstimateResponse {
  date: string;
  currentHour: number;
  actualVisitsSoFar: number;
  estimatedRemainingVisits: number;
  estimatedTotalVisits: number;
  historicalBasisDays: number;
  hours: HourlyEstimate[];
}

function formatHourLabel(hour: number) {
  const period = hour < 12 ? "a" : "p";
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}${period}`;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      i18n.locale?.startsWith("ar") ? "ar" : "en-US",
      { month: "short", day: "numeric", year: "numeric" },
    );
  } catch {
    return "";
  }
}

export default function GymTrafficVisual({ refreshTrigger = 0 }: Props) {
  const { guestMode, isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [traffic, setTraffic] = useState({
    currentMembers: 0,
    maxCapacity: 0,
    occupancyPercentage: 0,
    trafficLevel: "Low",
  });

  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<AttendanceEstimateResponse | null>(
    null,
  );
  const [estimateLoading, setEstimateLoading] = useState(false);

  const hourlyScrollRef = useRef<ScrollView>(null);
  const hasAutoScrolledRef = useRef(false);

  const isArabic = i18n.locale?.startsWith("ar");
  const bars = 28;

  const fetchCurrentUsers = async () => {
    if (guestMode) {
      console.log("👤 [GymTrafficVisual] guestMode true, skipping fetch");
      return;
    }

    setLoading(true);

    try {
      const token = await handleGetToken();
      const MemberId = await AsyncStorage.getItem("MemberId");

      if (!MemberId) throw new Error("MemberId missing");

      const res = await fetch(
        `http://192.168.1.16/api/MemberShips/currentMembersForMemberTraffic?memberId=${MemberId}`,
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

      setTraffic({
        currentMembers: data.currentMembers ?? 0,
        maxCapacity: data.maxCapacity ?? 0,
        occupancyPercentage: data.occupancyPercentage ?? 0,
        trafficLevel: data.trafficLevel ?? "Low",
      });
    } catch (err) {
      console.error("❌ [GymTrafficVisual] Error fetching traffic:", err);
    } finally {
      setLoading(false);
    }
  };

  // 👇 fetches the today-by-hour attendance estimate chart data
  const fetchHourlyEstimate = async () => {
    if (guestMode) {
      console.log(
        "👤 [GymTrafficVisual] guestMode true, skipping estimate fetch",
      );
      return;
    }

    setEstimateLoading(true);

    try {
      const token = await handleGetToken();
      const MemberId = await AsyncStorage.getItem("MemberId");

      if (!MemberId) throw new Error("MemberId missing");

      const res = await fetch(
        `http://192.168.1.16/api/MemberShips/getMemberGymTodayAttendanceEstimate?memberId=${MemberId}`,
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

      const data: AttendanceEstimateResponse = await res.json();
      setEstimate(data);
    } catch (err) {
      console.error(
        "❌ [GymTrafficVisual] Error fetching hourly estimate:",
        err,
      );
    } finally {
      setEstimateLoading(false);
    }
  };

  const fetchRef = useRef(fetchCurrentUsers);
  fetchRef.current = fetchCurrentUsers;

  const fetchEstimateRef = useRef(fetchHourlyEstimate);
  fetchEstimateRef.current = fetchHourlyEstimate;

  useFocusEffect(
    useCallback(() => {
      console.log("🎯 [GymTrafficVisual] screen focused, fetching");
      fetchCurrentUsers();
      fetchHourlyEstimate();
    }, [guestMode]),
  );

  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log(
        "🔁 [GymTrafficVisual] refreshTrigger fired:",
        refreshTrigger,
      );
      fetchCurrentUsers();
      fetchHourlyEstimate();
    }
  }, [refreshTrigger]);

  // 👇 auto-refresh fallback — keeps the number current even if a websocket
  // notification is missed, dropped, or the connection is mid-reconnect
  useEffect(() => {
    if (guestMode) return;

    const interval = setInterval(() => {
      fetchRef.current();
      fetchEstimateRef.current();
    }, AUTO_REFRESH_MS);

    return () => clearInterval(interval);
  }, [guestMode]);

  // 👇 live-refresh traffic whenever anyone checks in/out
  useEffect(() => {
    if (guestMode) {
      console.log(
        "👤 [GymTrafficVisual] guestMode true, skipping gymHub setup",
      );
      return;
    }

    let cancelled = false;
    const dispatch = () => {
      console.log("🔔 [GymTrafficVisual] dispatch fired — refetching traffic");
      fetchRef.current();
      fetchEstimateRef.current();
    };

    (async () => {
      try {
        console.log("▶️ [GymTrafficVisual] calling gymHub.start()");
        await gymHub.start(); // 👈 also joins the stored GymId group internally
        console.log("✅ [GymTrafficVisual] gymHub.start() resolved");

        if (cancelled) {
          console.log(
            "⏹️ [GymTrafficVisual] effect cancelled before listener registration",
          );
          return;
        }

        gymHub.on("ReceiveGymNotification", dispatch);
        console.log(
          "📌 [GymTrafficVisual] listener registered for ReceiveGymNotification",
        );
      } catch (err) {
        console.error("❌ [GymTrafficVisual] SignalR connection error:", err);
      }
    })();

    return () => {
      cancelled = true;
      gymHub.off("ReceiveGymNotification", dispatch); // 👈 only drop the listener — leave the shared connection running
      console.log(
        "🧹 [GymTrafficVisual] listener removed on unmount/dep change",
      );
    };
  }, [guestMode]);

  const maxHourlyValue = useMemo(() => {
    if (!estimate?.hours?.length) return 0;
    return estimate.hours.reduce((max, h) => {
      const v = h.isEstimated ? h.estimatedVisits : h.actualVisits;
      return v > max ? v : max;
    }, 0);
  }, [estimate]);

  // 👇 auto-scroll the hourly chart so the current hour is roughly centered,
  // once per load (doesn't fight the user if they scroll manually afterward)
  useEffect(() => {
    if (!estimate || hasAutoScrolledRef.current) return;
    hasAutoScrolledRef.current = true;

    const targetX = Math.max(
      estimate.currentHour * HOUR_COL_WIDTH - HOUR_COL_WIDTH * 3,
      0,
    );

    requestAnimationFrame(() => {
      hourlyScrollRef.current?.scrollTo({ x: targetX, animated: true });
    });
  }, [estimate]);

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
    <>
      <View style={s.card}>
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

        <Text style={[s.subText, { textAlign: isArabic ? "right" : "left" }]}>
          {`${currentUsers} ${
            currentUsers === 1 ? i18n.t("user") : i18n.t("users")
          } ${i18n.t("inside")} • ${traffic.occupancyPercentage}%`}{" "}
        </Text>
      </View>

      {/* 👇 hourly attendance estimate chart — scrollable, all 24 hours */}
      <View style={s.card}>
        <View
          style={[
            s.headerRow,
            { flexDirection: isArabic ? "row-reverse" : "row" },
          ]}
        >
          <View
            style={{
              flex: 1,
              alignItems: isArabic ? "flex-end" : "flex-start",
            }}
          >
            <Text style={s.eyebrow}>
              {estimateLoading ? "..." : i18n.t("hourly_estimate_title")}
            </Text>
            <Text style={s.cardTitle}>
              {estimate?.estimatedTotalVisits.toFixed() ?? 0} {i18n.t("visits")}
            </Text>
            {estimate?.date && (
              <Text style={s.dateText}>{formatDate(estimate.date)}</Text>
            )}
          </View>
          <View style={s.metricChip}>
            <Text style={s.metricText}>
              {estimate?.actualVisitsSoFar ?? 0} {i18n.t("so_far")}
            </Text>
          </View>
        </View>

        <ScrollView
          ref={hourlyScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.hourlyScrollContent}
        >
          {(estimate?.hours ?? []).map((h) => {
            const value = h.isEstimated ? h.estimatedVisits : h.actualVisits;
            const barHeightPx =
              maxHourlyValue > 0
                ? Math.max(
                    (value / maxHourlyValue) * HOURLY_CHART_HEIGHT,
                    value > 0 ? 4 : 2,
                  )
                : 2;
            const isCurrent = estimate?.currentHour === h.hour;

            return (
              <View key={h.hour} style={s.hourlyCol}>
                <View style={s.hourlyBarWrap}>
                  <View
                    style={{
                      width: "100%",
                      height: barHeightPx,
                      borderRadius: 2,
                      backgroundColor: isCurrent
                        ? theme.accent
                        : h.isEstimated
                          ? theme.muted + "55"
                          : theme.accent + "CC",
                    }}
                  />
                </View>
                <Text
                  style={[s.hourlyLabel, isCurrent && s.hourlyLabelCurrent]}
                >
                  {formatHourLabel(h.hour)}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <View
          style={[
            s.legendRow,
            { flexDirection: isArabic ? "row-reverse" : "row" },
          ]}
        >
          <View style={s.legendItem}>
            <View
              style={[s.legendDot, { backgroundColor: theme.accent + "CC" }]}
            />
            <Text style={s.legendText}>{i18n.t("actual")}</Text>
          </View>
          <View style={s.legendItem}>
            <View
              style={[s.legendDot, { backgroundColor: theme.muted + "55" }]}
            />
            <Text style={s.legendText}>{i18n.t("estimated")}</Text>
          </View>
        </View>
      </View>
    </>
  );
}

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
    dateText: {
      fontSize: 12,
      color: theme.muted,
      fontFamily: "SF-Medium",
      marginTop: 2,
    },
    hourlyScrollContent: {
      alignItems: "flex-end",
      paddingBottom: 4,
      paddingHorizontal: 2,
    },
    hourlyCol: {
      width: HOUR_COL_WIDTH,
      alignItems: "center",
    },
    hourlyBarWrap: {
      width: "100%",
      height: HOURLY_CHART_HEIGHT,
      justifyContent: "flex-end",
      marginBottom: 6,
    },
    hourlyLabel: {
      fontSize: 10,
      color: theme.muted,
      fontFamily: "SF-Medium",
    },
    hourlyLabelCurrent: {
      color: theme.ink,
      fontWeight: "700",
    },
    legendRow: {
      alignItems: "center",
      gap: 16,
      marginTop: 12,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 11,
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
