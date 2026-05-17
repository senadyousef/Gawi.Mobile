import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import i18n from "../localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context";

// ---------------- THEME ----------------
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#f3f5f8",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#666666",
  border: dark ? "#2C2C2C" : "#EEEEEE",

  primary: Colors.primary,
  accent: Colors.tertiary,
});

// ---------------- TYPES ----------------
interface IExercise {
  exerciseId: number;
  exerciseName: string;
  exerciseNameAr: string;
  rounds: number;
  oneRoundCount: number;
}

interface IMuscle {
  muscleId: number;
  muscleName: string;
  muscleNameAr: string;
  exercises: IExercise[];
}

interface IDay {
  dayId: number;
  dayName: string;
  muscles: IMuscle[];
}

// ---------------- COMPONENT ----------------
export default function WorkoutScheduleAlt() {
  const { isDarkMode } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [days, setDays] = useState<IDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const isArabic = i18n.locale === "ar";

  // ---------------- FETCH ----------------
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const MemberId = await AsyncStorage.getItem("MemberId");

        const response = await fetch(
          `https://gym.useitsmart.com/api/MSSMExercises/getallMSSMExersesforUser?userId=${MemberId}`,
          { headers: { accept: "text/plain" } }
        );

        if (!response.ok) throw new Error("Failed to load schedule");

        const data = await response.json();

        setDays(data.days || []);

        if (data.from && data.to) {
          setDateRange({
            from: data.from,
            to: data.to,
          });
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

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

  // ---------------- RENDER ----------------
  const renderExercise = (exercise: IExercise) => (
    <TouchableOpacity
      key={exercise.exerciseId}
      style={[
        s.exerciseCard,
        { flexDirection: isArabic ? "row-reverse" : "row" },
      ]}
    >
      <View style={s.iconCircle}>
        <MaterialCommunityIcons
          name="dumbbell"
          size={18}
          color={theme.accent}
        />
      </View>

      <View style={{ flex: 1, alignItems: isArabic ? "flex-end" : "flex-start" }}>
        <Text style={s.exerciseName}>
          {isArabic ? exercise.exerciseNameAr : exercise.exerciseName}
        </Text>

        <Text style={s.repsText}>
          {i18n.t("sets")}: {exercise.rounds} | {i18n.t("reps")}: {exercise.oneRoundCount}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMuscleGroup = (muscle: IMuscle) => (
    <View key={muscle.muscleId} style={s.muscleSection}>
      <Text style={[s.muscleTitle, { textAlign: isArabic ? "right" : "left" }]}>
        {isArabic ? muscle.muscleNameAr : muscle.muscleName}
      </Text>
      {muscle.exercises.map(renderExercise)}
    </View>
  );

  const renderDay = ({ item }: { item: IDay }) => (
    <View style={s.dayCard}>
      <View style={s.sideBar} />

      <View style={s.dayContent}>
        <Text
          style={[
            s.dayTitle,
            { textAlign: isArabic ? "right" : "left" },
          ]}
        >
          {item.dayName}
        </Text>

        {item.muscles.map(renderMuscleGroup)}
      </View>
    </View>
  );

  // ---------------- LOADING ----------------
  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );

  // ---------------- UI ----------------
  return (
    <SafeAreaView style={s.container}>
      <Text style={s.header}>
        {i18n.t("weekly_schedule")}
      </Text>

      {dateRange && (
        <Text style={s.dateRange}>
          {formatDate(dateRange.from)} — {formatDate(dateRange.to)}
        </Text>
      )}

      <FlatList
        data={days}
        keyExtractor={(item) => item.dayId.toString()}
        renderItem={renderDay}
        contentContainerStyle={s.listContainer}
      />
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
    },

    listContainer: {
      padding: 16,
    },

    header: {
      fontSize: 24,
      fontWeight: "700",
      marginTop: 8,
      textAlign: "center",
      color: theme.primary,
    },

    dateRange: {
      fontSize: 14,
      marginBottom: 12,
      textAlign: "center",
      color: theme.muted,
    },

    dayCard: {
      flexDirection: "row",
      borderRadius: 14,
      marginBottom: 20,
      overflow: "hidden",
      backgroundColor: theme.surface,
      elevation: 3,
    },

    sideBar: {
      width: 6,
      backgroundColor: theme.accent,
    },

    dayContent: {
      flex: 1,
      padding: 14,
    },

    dayTitle: {
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 10,
      color: theme.accent,
    },

    muscleSection: {
      marginBottom: 15,
    },

    muscleTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.muted,
      marginBottom: 8,
      letterSpacing: 1,
    },

    exerciseCard: {
      alignItems: "center",
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      marginBottom: 6,
    },

    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 10,
      backgroundColor: theme.accent + "33",
    },

    exerciseName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.ink,
    },

    repsText: {
      fontSize: 12,
      marginTop: 2,
      color: theme.muted,
    },
  });