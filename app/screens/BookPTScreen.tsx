import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleGetToken } from "../helpers";
import i18n from "../localization";
import { useAppContext } from "../context";
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, { SweetAlertButton, SweetAlertType } from "../components/SweetAlert";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F8FAFF",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#000000",
  muted: dark ? "#AAAAAA" : "#555555",
  label: dark ? "#CCCCCC" : "#000000",
  border: dark ? "#2C2C2C" : "#EEEEEE",
  placeholder: dark ? "#666666" : "#AAAAAA",
  calBg: dark ? "#1E1E1E" : "#FFFFFF",
  calInk: dark ? "#F0F0F0" : "#000000",
  calMuted: dark ? "#666666" : "#999999",
});

export default function BookPTScreen() {
  const route = useRoute<RouteProp<{ params: any }, "params">>();
  const { trainer } = route.params || {};
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [fromTime, setFromTime] = useState<Date>(new Date());
  const [toTime, setToTime] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [notes, setNotes] = useState("");
  const [markedDates, setMarkedDates] = useState<any>({});
  const [dayHours, setDayHours] = useState<{ from: string; to: string } | null>(
    null,
  );
  const [workFromTime, setWorkFromTime] = useState<Date | null>(null);
  const [workToTime, setWorkToTime] = useState<Date | null>(null);

  const isAr = i18n.locale === "ar";

  // 👇 SweetAlert state — replaces Alert.alert entirely
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: SweetAlertType;
    title: string;
    message?: string;
    buttons?: SweetAlertButton[];
  }>({ visible: false, type: "info", title: "" });

  const showAlert = (
    type: SweetAlertType,
    title: string,
    message?: string,
    buttons?: SweetAlertButton[],
  ) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };

  const hideAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  const dayNameToIndex: any = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const parseHourString = (timeStr: string, baseDate: Date): Date => {
    if (!timeStr) return new Date(baseDate);
    const match = timeStr.trim().match(/^(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
    let h = match && match[1] ? parseInt(match[1], 10) : 0;
    let m = match && match[2] ? parseInt(match[2], 10) : 0;
    const period = match && match[3] ? match[3].toUpperCase() : "";
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const newDate = new Date(baseDate.getTime());
    newDate.setHours(h, m, 0, 0);
    return newDate;
  };

  const formatHour = (timeStr: string) => {
    if (!timeStr) return "00:00";
    const match = timeStr.trim().match(/^(\d{1,2}):?(\d{2})?/i);
    let hour = match && match[1] ? parseInt(match[1], 10) : 0;
    let min = match && match[2] ? parseInt(match[2], 10) : 0;
    return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
  };

  const normalizeDay = (day: string) => {
    const DAY_SHORT_TO_FULL = {
      sun: "Sunday",
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
    };

    if (!day) return "";

    const lower = day.toLowerCase();

    return (
      DAY_SHORT_TO_FULL[lower] || lower.charAt(0).toUpperCase() + lower.slice(1)
    );
  };

  const isDayAvailable = (date: Date) => {
    const dayIndex = date.getDay();
    return trainer?.ptDaysDto?.some((d: any) => {
      const normalizedDay = normalizeDay(d.day);
      return dayNameToIndex[normalizedDay] === dayIndex;
    });
  };

  const handleDateSelect = (day: any) => {
    const [year, month, dom] = day.dateString.split("-").map(Number);
    const dateObj = new Date(year, month - 1, dom);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateObj < today) {
      showAlert(
        "warning",
        i18n.t("invalid_past_date"),
        i18n.t("invalid_past_date_message"),
      );
      return;
    }
    if (!isDayAvailable(dateObj)) {
      showAlert("warning", i18n.t("unavailable"), i18n.t("trainer_not_working"));
      setDayHours(null);
      return;
    }
    const workingDay = trainer.ptDaysDto.find((d: any) => {
      const normalizedDay = normalizeDay(d.day);
      return dayNameToIndex[normalizedDay] === dateObj.getDay();
    });
    if (!workingDay) {
      showAlert("warning", i18n.t("unavailable"), i18n.t("trainer_not_working"));
      setDayHours(null);
      return;
    }
    setDayHours({
      from: formatHour(workingDay.fromHour),
      to: formatHour(workingDay.toHour),
    });
    const fromDate = parseHourString(workingDay.fromHour, dateObj);
    let toDate = parseHourString(workingDay.toHour, dateObj);
    if (fromDate >= toDate) toDate.setDate(toDate.getDate() + 1);
    setFromTime(fromDate);
    setToTime(toDate);
    setWorkFromTime(fromDate);
    setWorkToTime(toDate);
    setSelectedDate(day.dateString);
  };

  const handleBooking = async () => {
    if (!selectedDate) {
      showAlert("warning", i18n.t("missing_date"), i18n.t("missing_date_message"));
      return;
    }
    if (toTime <= fromTime) {
      showAlert("warning", i18n.t("invalid_time"), i18n.t("invalid_time_message"));
      return;
    }
    const diffInMinutes = (toTime.getTime() - fromTime.getTime()) / (1000 * 60);

    if (diffInMinutes !== 60) {
      showAlert(
        "warning",
        i18n.t("invalid_time"),
        i18n.locale === "ar"
          ? "يجب أن تكون مدة الحجز ساعة واحدة فقط"
          : "Booking duration must be exactly 1 hour",
      );
      return;
    }

    const dateObj = new Date(selectedDate);
    const workingDay = trainer.ptDaysDto?.find(
      (d: any) => dayNameToIndex[normalizeDay(d.day)] === dateObj.getDay(),
    );
    if (!workingDay) {
      showAlert("warning", i18n.t("unavailable"), i18n.t("trainer_not_working"));
      return;
    }

    const workFrom = parseHourString(workingDay.fromHour, dateObj);
    let workTo = parseHourString(workingDay.toHour, dateObj);
    if (workFrom >= workTo) workTo.setDate(workTo.getDate() + 1);

    if (fromTime < workFrom || toTime > workTo) {
      showAlert(
        "warning",
        i18n.t("unavailable"),
        i18n.t("outside_working_hours", {
          from: dayHours?.from,
          to: dayHours?.to,
        }),
      );
      return;
    }

    const overlappingClass = trainer.ptWithUserAllClassDto?.some((cls: any) => {
      const clsDate = new Date(cls.date);
      const clsFrom = parseHourString(cls.fromHour, clsDate);
      let clsTo = parseHourString(cls.toHour, clsDate);
      if (clsFrom >= clsTo) clsTo.setDate(clsTo.getDate() + 1);
      return (
        selectedDate === cls.date.split("T")[0] &&
        ((fromTime >= clsFrom && fromTime < clsTo) ||
          (toTime > clsFrom && toTime <= clsTo) ||
          (fromTime <= clsFrom && toTime >= clsTo))
      );
    });

    if (overlappingClass) {
      showAlert("warning", i18n.t("time_conflict"), i18n.t("time_conflict_message"));
      return;
    }

    try {
      const storedUserId = await AsyncStorage.getItem("MemberId");
      if (!storedUserId) {
        showAlert("error", i18n.t("error_generic"), i18n.t("error_user_not_found"));
        return;
      }
      const token = await handleGetToken();
      const response = await fetch("http://192.168.1.16/api/PTClass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ptId: trainer.ptId,
          from: `${fromTime.getHours().toString().padStart(2, "0")}:${fromTime.getMinutes().toString().padStart(2, "0")}`,
          to: `${toTime.getHours().toString().padStart(2, "0")}:${toTime.getMinutes().toString().padStart(2, "0")}`,
          date: selectedDate,
          userId: Number(storedUserId),
        }),
      });
      if (!response.ok) throw new Error("Failed to book session");
      showAlert(
        "success",
        i18n.t("booking_success"),
        i18n.t("booking_success_message"),
      );
    } catch (error: any) {
      showAlert(
        "error",
        i18n.t("error_generic"),
        error.message || i18n.t("error_generic"),
      );
    }
  };

  useEffect(() => {
    const newMarkedDates: any = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const day = new Date(today.getTime());
      day.setDate(today.getDate() + i);
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, "0");
      const dom = String(day.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${dom}`;

      if (isDayAvailable(day)) {
        newMarkedDates[key] = { marked: true, dotColor: "green" };
      } else {
        newMarkedDates[key] = {
          disabled: true,
          disableTouchEvent: true,
          marked: true,
          dotColor: "#ccc",
        };
      }
    }

    for (let i = 1; i < 365; i++) {
      const past = new Date(today.getTime());
      past.setDate(today.getDate() - i);
      const year = past.getFullYear();
      const month = String(past.getMonth() + 1).padStart(2, "0");
      const dom = String(past.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${dom}`;
      newMarkedDates[key] = {
        disabled: true,
        disableTouchEvent: true,
      };
    }

    setMarkedDates(newMarkedDates);
  }, [trainer]);

  return (
    <>
      <ScrollView style={[s.container, { direction: isAr ? "rtl" : "ltr" }]}>
        <Text style={[s.header, { textAlign: isAr ? "right" : "left" }]}>
          {i18n.t("book_session_with")} {trainer?.ptName}
        </Text>

        <Calendar
          key={isDarkMode ? "dark" : "light"}
          minDate={new Date().toISOString().split("T")[0]}
          onDayPress={handleDateSelect}
          markedDates={{
            ...markedDates,
            [selectedDate]: { selected: true, selectedColor: "#FF8C00" },
          }}
          theme={{
            backgroundColor: theme.calBg,
            calendarBackground: theme.calBg,
            dayTextColor: theme.calInk,
            monthTextColor: theme.calInk,
            textDisabledColor: theme.calMuted,
            textSectionTitleColor: theme.calMuted,
            todayTextColor: "#FF8C00",
            disabledDayTextColor: theme.calMuted,
            arrowColor: "#FF8C00",
            selectedDayBackgroundColor: "#FF8C00",
            selectedDayTextColor: "#FFFFFF",
          }}
        />

        {dayHours && (
          <Text style={[s.label, { textAlign: isAr ? "right" : "left" }]}>
            {i18n.t("available_hours")}: {dayHours.from} - {dayHours.to}
          </Text>
        )}

        {selectedDate && (
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => setShowFromPicker(true)}
              style={s.timeButton}
            >
              <Text style={s.timeButtonText}>
                {i18n.t("from")}:{" "}
                {fromTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowToPicker(true)}
              style={s.timeButton}
            >
              <Text style={s.timeButtonText}>
                {i18n.t("to")}:{" "}
                {toTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showFromPicker && workFromTime && workToTime && (
          <DateTimePicker
            value={fromTime}
            mode="time"
            display="default"
            minimumDate={workFromTime}
            maximumDate={workToTime}
            onChange={(_, date) => {
              setShowFromPicker(false);
              if (!date) return;
              const newTime = new Date(fromTime.getTime());
              newTime.setHours(date.getHours(), date.getMinutes(), 0, 0);
              if (newTime < workFromTime || newTime >= workToTime) {
                showAlert(
                  "warning",
                  i18n.t("unavailable"),
                  i18n.t("outside_working_hours", {
                    from: dayHours?.from,
                    to: dayHours?.to,
                  }),
                );
                return;
              }
              setFromTime(newTime);
              const oneHourLater = new Date(newTime);
              oneHourLater.setHours(oneHourLater.getHours() + 1);
              setToTime(oneHourLater);
            }}
          />
        )}

        {showToPicker && workFromTime && workToTime && (
          <DateTimePicker
            value={toTime}
            mode="time"
            display="default"
            minimumDate={fromTime}
            maximumDate={workToTime}
            onChange={(_, date) => {
              setShowToPicker(false);
              if (!date) return;
              const newTime = new Date(toTime.getTime());
              newTime.setHours(date.getHours(), date.getMinutes(), 0, 0);
              if (newTime > workToTime || newTime <= fromTime) {
                showAlert(
                  "warning",
                  i18n.t("unavailable"),
                  i18n.t("outside_working_hours", {
                    from: dayHours?.from,
                    to: dayHours?.to,
                  }),
                );
                return;
              }
              setToTime(newTime);
            }}
          />
        )}

        <Text style={[s.label, { textAlign: isAr ? "right" : "left" }]}>
          {i18n.t("notes_optional")}
        </Text>

        <TextInput
          style={[s.input, { textAlign: isAr ? "right" : "left" }]}
          placeholder={i18n.t("add_notes_placeholder")}
          placeholderTextColor={theme.placeholder}
          multiline
          value={notes}
          onChangeText={setNotes}
          color={theme.ink}
        />

        <TouchableOpacity style={s.bookButton} onPress={handleBooking}>
          <LinearGradient
            colors={["#FF8C00", "#FF8C00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bookGradient}
          >
            <Text style={s.bookText}>{i18n.t("confirm_booking")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <SweetAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        isDarkMode={!!isDarkMode}
        isRTL={isAr}
        onRequestClose={hideAlert}
      />
    </>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.bg,
    },
    header: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 20,
      color: theme.ink,
    },
    label: {
      fontWeight: "600",
      fontSize: 16,
      marginBottom: 8,
      marginTop: 10,
      color: theme.label,
    },
    input: {
      backgroundColor: theme.surface,
      borderRadius: 10,
      padding: 12,
      height: 100,
      textAlignVertical: "top",
      marginBottom: 30,
      borderWidth: 1,
      borderColor: theme.border,
      color: theme.ink,
    },
    bookButton: { borderRadius: 10, overflow: "hidden", marginBottom: 40 },
    bookGradient: { paddingVertical: 14, alignItems: "center" },
    bookText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
    timeButton: {
      backgroundColor: theme.surface,
      padding: 12,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    timeButtonText: {
      color: theme.ink,
    },
  });