import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../constants/Colors";
import i18n from "../localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context";
import { handleGetToken } from "../helpers";

const API_BASE = "http://192.168.1.16/api/mobile/workout-schedules";

const WEEKDAY_SHORT = [
  { en: "Su", ar: "أح" },
  { en: "Mo", ar: "اث" },
  { en: "Tu", ar: "ثل" },
  { en: "We", ar: "أر" },
  { en: "Th", ar: "خم" },
  { en: "Fr", ar: "جم" },
  { en: "Sa", ar: "سب" },
];

// ---------------- THEME ----------------
const getTheme = (dark: boolean) => ({
  bg: dark ? "#0F0F0F" : "#F5F6F8",
  surface: dark ? "#1A1A1A" : "#FFFFFF",
  ink: dark ? "#F5F5F5" : "#1C1C1E",
  muted: dark ? "#9A9A9A" : "#6B7280",
  border: dark ? "#262626" : "#ECECEC",
  primary: Colors.primary,
  accent: Colors.tertiary,
  danger: dark ? "#F2665A" : "#D9483C",
  rest: dark ? "#5B6472" : "#9AA3B2",
  heroGradient: (dark
    ? ["#1C1C1C", "#2A1A0C"]
    : ["#FFFFFF", "#FFF2E6"]) as [string, string],
});

// ---------------- TYPES ----------------
interface IExerciseDetail {
  id: number;
  exerciseId: number;
  exerciseNameEn: string;
  exerciseNameAr: string;
  displayOrder: number;
}

interface IMuscleDetail {
  id: number;
  muscleId: number;
  muscleNameEn: string;
  muscleNameAr: string;
  displayOrder: number;
  exercises: IExerciseDetail[];
}

interface IDayDetail {
  id: number;
  dayOfWeek: number;
  dayName: string;
  isRestDay: boolean;
  displayOrder: number;
  note: string;
  muscles: IMuscleDetail[];
}

interface ISchedule {
  id: number;
  gymId: number;
  memberShipId: number;
  memberUserId: number;
  memberNameEn: string;
  memberNameAr: string;
  planType: string;
  sourceTemplateId: number;
  sourceTemplateNameEn: string;
  nameEn: string;
  nameAr: string;
  note: string;
  startDate: string;
  endDate: string;
  assignedByUserId: number;
  assignedByName: string;
  createdOn: string;
  isCurrent: boolean;
  isCancelled: boolean;
  scheduleStatus: string;
  days?: IDayDetail[];
}

const getMuscleIcon = (nameEn: string) => {
  const n = (nameEn || "").toLowerCase();
  if (n.includes("leg")) return "run";
  if (n.includes("cardio")) return "heart-pulse";
  if (n.includes("chest")) return "weight-lifter";
  return "arm-flex";
};

// ---------------- COMPONENT ----------------
export default function WorkoutSchedulesScreen() {
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const isArabic = i18n.locale === "ar";
  const t = (en: string, ar: string) => (isArabic ? ar : en);

  const [userId, setUserId] = useState<string | null>(null);
  const [current, setCurrent] = useState<ISchedule | null>(null);
  const [history, setHistory] = useState<ISchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState<ISchedule | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeDayId, setActiveDayId] = useState<number | null>(null);

  // ---------------- FETCH ----------------
  const loadAll = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const MemberId = await AsyncStorage.getItem("MemberId");
      setUserId(MemberId);
      const token = await handleGetToken();
      const headers = {
        accept: "text/plain",
        Authorization: `Bearer ${token}`,
      };

      const [currentRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/current?userId=${MemberId}`, { headers }),
        fetch(`${API_BASE}/history?userId=${MemberId}`, { headers }),
      ]);

      setCurrent(currentRes.ok ? await currentRes.json() : null);
      setHistory(historyRes.ok ? (await historyRes.json()) || [] : []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (selected?.days?.length) {
      const firstWorkout = selected.days.find((d) => !d.isRestDay);
      setActiveDayId((firstWorkout || selected.days[0]).id);
    }
  }, [selected]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll(false);
  };

  const openDetails = async (schedule: ISchedule) => {
    setModalVisible(true);

    if (schedule.days && schedule.days.length > 0) {
      setSelected(schedule);
      return;
    }

    try {
      setDetailsLoading(true);
      const token = await handleGetToken();
      const res = await fetch(`${API_BASE}/${schedule.id}?userId=${userId}`, {
        headers: { accept: "text/plain", Authorization: `Bearer ${token}` },
      });
      setSelected(res.ok ? await res.json() : schedule);
    } catch (err) {
      console.log(err);
      setSelected(schedule);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelected(null);
    setActiveDayId(null);
  };

  // ---------------- FORMAT DATE ----------------
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(isArabic ? "ar-EG" : "en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  // ---------------- RENDER: HERO (current) ----------------
  const renderHero = (schedule: ISchedule) => {
    const days = schedule.days || [];
    const workoutCount = days.filter((d) => !d.isRestDay).length;
    const restCount = days.length - workoutCount;

    return (
      <TouchableOpacity activeOpacity={0.9} onPress={() => openDetails(schedule)}>
        <LinearGradient
          colors={theme.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          <View style={[s.heroTopRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
            <Text style={s.heroEyebrow}>{t("Active Program", "البرنامج الحالي")}</Text>
            <View style={s.heroBadge}>
              <MaterialCommunityIcons name="dumbbell" size={16} color={theme.bg} />
            </View>
          </View>

          <Text style={[s.heroTitle, { textAlign: isArabic ? "right" : "left" }]}>
            {isArabic ? schedule.nameAr : schedule.nameEn}
          </Text>
          <Text style={[s.heroMeta, { textAlign: isArabic ? "right" : "left" }]}>
            {formatDate(schedule.startDate)} — {formatDate(schedule.endDate)}
          </Text>
          {!!schedule.assignedByName && (
            <Text style={[s.heroMeta, { textAlign: isArabic ? "right" : "left" }]}>
              {t("Coach", "المدرب")} · {schedule.assignedByName}
            </Text>
          )}

          {!!days.length && (
            <>
              <View style={[s.weekStrip, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
                {[...days]
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((day) => (
                    <View
                      key={day.id}
                      style={[s.weekChip, day.isRestDay ? s.weekChipRest : s.weekChipActive]}
                    >
                      <Text
                        style={[
                          s.weekChipLabel,
                          day.isRestDay ? s.weekChipLabelRest : s.weekChipLabelActive,
                        ]}
                      >
                        {isArabic ? WEEKDAY_SHORT[day.dayOfWeek]?.ar : WEEKDAY_SHORT[day.dayOfWeek]?.en}
                      </Text>
                    </View>
                  ))}
              </View>
              <Text style={[s.heroStats, { textAlign: isArabic ? "right" : "left" }]}>
                {t(
                  `${workoutCount} training · ${restCount} rest`,
                  `${workoutCount} تدريب · ${restCount} راحة`,
                )}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // ---------------- RENDER: HISTORY ROW ----------------
  const renderHistoryRow = (schedule: ISchedule, isLast: boolean) => {
    const statusColor = schedule.isCancelled ? theme.danger : theme.accent;
    return (
      <TouchableOpacity
        key={schedule.id}
        onPress={() => openDetails(schedule)}
        style={[
          s.historyRow,
          { flexDirection: isArabic ? "row-reverse" : "row" },
          !isLast && s.historyRowDivider,
        ]}
      >
        <View style={[s.statusDot, { backgroundColor: statusColor }]} />
        <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
          <Text style={s.historyName}>{isArabic ? schedule.nameAr : schedule.nameEn}</Text>
          <Text style={s.historyMeta}>
            {formatDate(schedule.startDate)} — {formatDate(schedule.endDate)}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={isArabic ? "chevron-left" : "chevron-right"}
          size={20}
          color={theme.muted}
        />
      </TouchableOpacity>
    );
  };

  // ---------------- RENDER: MODAL ----------------
  const renderExercise = (exercise: IExerciseDetail) => (
    <View
      key={exercise.id}
      style={[s.exerciseRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}
    >
      <View style={s.exerciseIcon}>
        <MaterialCommunityIcons name="dumbbell" size={16} color={theme.accent} />
      </View>
      <Text style={s.exerciseName}>
        {isArabic ? exercise.exerciseNameAr : exercise.exerciseNameEn}
      </Text>
    </View>
  );

  const renderMuscle = (muscle: IMuscleDetail) => (
    <View key={muscle.id} style={s.muscleSection}>
      <View style={[s.muscleTitleRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
        <MaterialCommunityIcons
          name={getMuscleIcon(muscle.muscleNameEn) as any}
          size={14}
          color={theme.muted}
        />
        <Text style={s.muscleTitle}>
          {isArabic ? muscle.muscleNameAr : muscle.muscleNameEn}
        </Text>
      </View>
      {muscle.exercises.map(renderExercise)}
    </View>
  );

  const activeDay = selected?.days?.find((d) => d.id === activeDayId) || null;

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ---------------- UI ----------------
  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {current ? (
          renderHero(current)
        ) : (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="dumbbell" size={22} color={theme.muted} />
            <Text style={s.emptyTitle}>{t("No active program", "لا يوجد برنامج حالي")}</Text>
            <Text style={s.emptyText}>
              {t("Your coach hasn't assigned one yet.", "لم يقم مدربك بتعيين برنامج بعد.")}
            </Text>
          </View>
        )}

        <Text style={[s.sectionEyebrow, { textAlign: isArabic ? "right" : "left" }]}>
          {t("Program History", "سجل البرامج")}
        </Text>

        {history.length === 0 ? (
          <View style={s.emptyBox}>
            <MaterialCommunityIcons name="history" size={22} color={theme.muted} />
            <Text style={s.emptyText}>{t("No previous programs yet.", "لا يوجد سجل سابق.")}</Text>
          </View>
        ) : (
          <View style={s.historyCard}>
            {history.map((schedule, i) => renderHistoryRow(schedule, i === history.length - 1))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <View style={s.dragHandle} />

            <View style={[s.modalHeaderRow, { flexDirection: isArabic ? "row-reverse" : "row" }]}>
              <Text style={s.modalTitle} numberOfLines={1}>
                {selected ? (isArabic ? selected.nameAr : selected.nameEn) : ""}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={22} color={theme.ink} />
              </TouchableOpacity>
            </View>

            {selected && (
              <Text style={[s.modalMeta, { textAlign: isArabic ? "right" : "left" }]}>
                {formatDate(selected.startDate)} — {formatDate(selected.endDate)}
              </Text>
            )}

            {detailsLoading ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : (
              <>
                {!!selected?.days?.length && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      s.dayTabsRow,
                      { flexDirection: isArabic ? "row-reverse" : "row" },
                    ]}
                  >
                    {[...selected.days]
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((day) => {
                        const isActive = day.id === activeDayId;
                        return (
                          <TouchableOpacity
                            key={day.id}
                            onPress={() => setActiveDayId(day.id)}
                            style={[
                              s.dayTab,
                              day.isRestDay && s.dayTabRest,
                              isActive && (day.isRestDay ? s.dayTabRestActive : s.dayTabActive),
                            ]}
                          >
                            <Text style={[s.dayTabLabel, isActive && s.dayTabLabelActive]}>
                              {isArabic
                                ? WEEKDAY_SHORT[day.dayOfWeek]?.ar
                                : WEEKDAY_SHORT[day.dayOfWeek]?.en}
                            </Text>
                            {day.isRestDay && <View style={s.restDot} />}
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                )}

                <ScrollView contentContainerStyle={s.dayPanel}>
                  {activeDay?.isRestDay ? (
                    <View style={s.restPanel}>
                      <MaterialCommunityIcons name="weather-night" size={28} color={theme.muted} />
                      <Text style={s.restPanelText}>{t("Rest day", "يوم راحة")}</Text>
                    </View>
                  ) : (
                    activeDay?.muscles.map(renderMuscle)
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.bg },
    listContainer: { padding: 16 },

    sectionEyebrow: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1.5,
      color: theme.muted,
      textTransform: "uppercase",
      marginTop: 26,
      marginBottom: 10,
    },

    // hero
    hero: {
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.accent + "55",
    },
    heroTopRow: { justifyContent: "space-between", alignItems: "center" },
    heroEyebrow: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.5,
      color: theme.accent,
      textTransform: "uppercase",
    },
    heroBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    heroTitle: { fontSize: 22, fontWeight: "800", color: theme.ink, marginTop: 12 },
    heroMeta: { fontSize: 13, color: theme.muted, marginTop: 4 },

    weekStrip: { justifyContent: "space-between", marginTop: 18 },
    weekChip: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    weekChipActive: { backgroundColor: theme.accent },
    weekChipRest: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.border,
    },
    weekChipLabel: { fontSize: 11, fontWeight: "700" },
    weekChipLabelActive: { color: theme.bg },
    weekChipLabelRest: { color: theme.muted },
    heroStats: { fontSize: 12, fontWeight: "600", color: theme.muted, marginTop: 12 },

    // empty
    emptyBox: {
      padding: 22,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
    },
    emptyTitle: { fontSize: 14, fontWeight: "700", color: theme.ink, marginTop: 8 },
    emptyText: { fontSize: 12, color: theme.muted, marginTop: 4, textAlign: "center" },

    // history
    historyCard: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    historyRow: { alignItems: "center", padding: 14 },
    historyRowDivider: { borderBottomWidth: 1, borderBottomColor: theme.border },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 12 },
    historyName: { fontSize: 15, fontWeight: "700", color: theme.ink },
    historyMeta: { fontSize: 12, color: theme.muted, marginTop: 2 },

    // modal
    modalOverlay: { flex: 1, backgroundColor: "#00000077", justifyContent: "flex-end" },
    modalSheet: {
      maxHeight: "88%",
      backgroundColor: theme.bg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
    },
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      alignSelf: "center",
      marginBottom: 14,
    },
    modalHeaderRow: {
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    modalTitle: { fontSize: 19, fontWeight: "800", color: theme.ink, flexShrink: 1 },
    modalMeta: { fontSize: 13, color: theme.muted, paddingHorizontal: 20, marginTop: 4 },

    dayTabsRow: { paddingHorizontal: 16, marginTop: 18, paddingBottom: 6 },
    dayTab: {
      minWidth: 48,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      marginHorizontal: 4,
      alignItems: "center",
    },
    dayTabRest: { borderStyle: "dashed" },
    dayTabActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    dayTabRestActive: { backgroundColor: theme.rest, borderColor: theme.rest },
    dayTabLabel: { fontSize: 12, fontWeight: "700", color: theme.muted },
    dayTabLabelActive: { color: theme.bg },
    restDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.muted, marginTop: 4 },

    dayPanel: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 30 },

    muscleSection: { marginBottom: 16 },
    muscleTitleRow: { alignItems: "center", gap: 6, marginBottom: 8 },
    muscleTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.muted,
      letterSpacing: 1,
      textTransform: "uppercase",
    },

    exerciseRow: {
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      marginBottom: 8,
    },
    exerciseIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 10,
      backgroundColor: theme.accent + "22",
    },
    exerciseName: { fontSize: 14, fontWeight: "600", color: theme.ink },

    restPanel: { alignItems: "center", paddingVertical: 40 },
    restPanelText: { fontSize: 14, fontWeight: "600", color: theme.muted, marginTop: 10 },
  });