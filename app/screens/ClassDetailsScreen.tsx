import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  DeviceEventEmitter,
  Modal,
  Switch,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { handleGetToken } from "../helpers";
import i18n from "../localization";
import { useAppContext } from "../context";
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, {
  SweetAlertButton,
  SweetAlertType,
} from "../components/SweetAlert";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F8FAFF",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#555555",
  detail: dark ? "#CCCCCC" : "#333333",
  border: dark ? "#2C2C2C" : "transparent",
});

const isArabic = i18n.locale === "ar";

// 👇 maps API day names to i18n keys — add "day_sunday", "day_monday", etc.
// to your translation files; falls back to the raw English day name if a
// key is missing so nothing breaks in the meantime.
const DAY_TRANSLATION_KEYS: Record<string, string> = {
  Sunday: "day_sunday",
  Monday: "day_monday",
  Tuesday: "day_tuesday",
  Wednesday: "day_wednesday",
  Thursday: "day_thursday",
  Friday: "day_friday",
  Saturday: "day_saturday",
};

// Sunday=0 ... Saturday=6, matching JS Date.getDay() — kept only as a
// reference mapping; the API itself receives day NAME strings (see the
// booking payload below), not these numeric indices.
const DAY_NAMES_BY_INDEX = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const formatRepeatDays = (days: string[] = [], ar: boolean) => {
  if (!days?.length) return "";
  const translated = days.map((day) => {
    const key = DAY_TRANSLATION_KEYS[day];
    const label = key ? i18n.t(key) : day;
    return label || day;
  });
  return translated.join(ar ? "، " : ", ");
};

const translateDay = (day: string, ar: boolean) => {
  const key = DAY_TRANSLATION_KEYS[day];
  const label = key ? i18n.t(key) : day;
  return label || day;
};

const fetchGymClassByUser = async () => {
  try {
    const MemberId = await AsyncStorage.getItem("MemberId");
    if (!MemberId) throw new Error("User not found");
    const response = await fetch(
      `http://192.168.1.16/api/GymClass/getAllGymClassByUser?userId=${MemberId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch gym classes");
    const data = await response.json();
    console.log("fetchGymClassByUser response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

export default function ClassDetailsScreen({ route }: any) {
  const { classId } = route.params || {};
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [gymClass, setGymClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 👇 Recurring booking config modal state
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isRecurringBooking, setIsRecurringBooking] = useState(true);
  const [selectedClassDate, setSelectedClassDate] = useState<Date>(new Date());
  const [selectedRepeatDays, setSelectedRepeatDays] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const classFromTime = gymClass?.form ?? gymClass?.from;

  const isPastClass = React.useMemo(() => {
    if (!gymClass) return false;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const classDateStr = String(gymClass.date).split("T")[0];

    return classDateStr < todayStr;
  }, [gymClass]);

  const isClassFull = React.useMemo(() => {
    if (!gymClass) return false;
    return (
      gymClass.isFull === true ||
      gymClass.availableSeats === 0 ||
      (gymClass.capacity != null &&
        gymClass.bookedCount != null &&
        gymClass.bookedCount >= gymClass.capacity)
    );
  }, [gymClass]);

  const loadClass = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = !!opts?.silent;
      try {
        if (!silent) setLoading(true);
        const MemberId = await AsyncStorage.getItem("MemberId");
        if (!MemberId) {
          if (!silent) {
            showAlert(
              "error",
              i18n.t("login_required_title") || "Login Required",
              i18n.t("login_required_view_class") ||
                "Please log in to view class details.",
            );
          }
          return;
        }
        const classes = await fetchGymClassByUser();
        const foundClass = classes.find((c: any) => c.id === classId);
        if (!foundClass) {
          if (!silent) {
            showAlert(
              "error",
              i18n.t("class_not_found_title") || "Class Not Found",
              i18n.t("class_not_found_message") ||
                "This class could not be found.",
            );
          }
          return;
        }
        setGymClass(foundClass);
      } catch (error) {
        if (!silent) {
          showAlert(
            "error",
            i18n.t("error_title") || "Error",
            i18n.t("load_class_error") || "Unable to load class details.",
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [classId],
  );

  useEffect(() => {
    loadClass();
  }, [loadClass]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener("homeRefresh", () => {
      loadClass({ silent: true });
    });
    return () => subscription.remove();
  }, [loadClass]);

  const getLocalizedBookingError = (resultText: string): string => {
    const normalized = resultText.trim().toLowerCase();

    if (
      normalized.includes("already started") ||
      normalized.includes("no longer be booked")
    ) {
      return (
        i18n.t("class_already_started") ||
        "This class has already started and can no longer be booked."
      );
    }
    if (normalized.includes("already booked")) {
      return (
        i18n.t("already_booked_message") ||
        "You have already booked this class."
      );
    }
    if (normalized.includes("full") || normalized.includes("capacity")) {
      return (
        i18n.t("class_full_message") || "Sorry, this class is fully booked."
      );
    }
    if (
      normalized.includes("insufficient") ||
      normalized.includes("wallet") ||
      normalized.includes("balance")
    ) {
      return (
        i18n.t("insufficient_wallet_balance") ||
        "Insufficient wallet balance to book this class."
      );
    }

    return (
      resultText ||
      i18n.t("booking_failed_message") ||
      "Unable to book this class."
    );
  };

  // 👇 Core booking submission — shared by both the simple (non-recurring)
  // confirm flow and the recurring booking config modal.
  const submitBooking = async (
    isRecurringBookingFlag: boolean,
    classDate: Date,
    repeatDays: string[],
  ) => {
    try {
      const MemberId = await AsyncStorage.getItem("MemberId");
      if (!MemberId) {
        showAlert(
          "error",
          i18n.t("login_required_title") || "Login Required",
          i18n.t("login_required_book_class") ||
            "Please log in to book a class.",
        );
        return;
      }
      const classes = await fetchGymClassByUser();
      const classToBook = classes.find((c: any) => c.id === classId);
      if (!classToBook) {
        showAlert(
          "error",
          i18n.t("error_title") || "Error",
          i18n.t("class_not_found_cannot_book") ||
            "Class not found. Cannot book.",
        );
        return;
      }
      if (classToBook.isBooked) {
        showAlert(
          "info",
          i18n.t("already_booked_title") || "Already Booked",
          i18n.t("already_booked_message") ||
            "You have already booked this class.",
        );
        return;
      }

      const isClassFullFresh =
        classToBook.isFull === true ||
        classToBook.availableSeats === 0 ||
        (classToBook.capacity &&
          classToBook.bookedCount &&
          classToBook.bookedCount >= classToBook.capacity);

      if (isClassFullFresh) {
        setGymClass((prev: any) => (prev ? { ...prev, isFull: true } : prev));
        showAlert(
          "info",
          i18n.t("class_full_title") || "Class Full",
          i18n.t("class_full_message") || "Sorry, this class is fully booked.",
        );
        return;
      }

      const payload = {
        userId: parseInt(MemberId),
        gymClassId: classToBook.id,
        isRecurringBooking: isRecurringBookingFlag,
        classDate: classDate.toISOString(),
        selectedRepeatDays: isRecurringBookingFlag ? repeatDays : [],
      };

      const token = await handleGetToken();
      const response = await fetch("http://192.168.1.16/api/UserClass", {
        method: "POST",
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const resultText = await response.text();
      console.log(resultText);
      if (!response.ok) {
        showAlert(
          "error",
          i18n.t("booking_failed_title") || "Booking Failed",
          getLocalizedBookingError(resultText),
        );
        return;
      }
      showAlert(
        "success",
        i18n.t("booking_confirmed_title") || "Booking Confirmed",
        i18n.t("booking_confirmed_message", {
          name: isArabic ? classToBook.nameAr : classToBook.nameEn,
        }) || `You successfully booked ${classToBook.nameEn}!`,
      );
      setGymClass((prev: any) => ({ ...prev, isBooked: true }));
    } catch (error) {
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("booking_error_message") ||
          "An unexpected error occurred while booking.",
      );
    }
  };

  // 👇 Simple one-off booking flow — used for NON-recurring classes only.
  const handleBookClassSimple = () => {
    submitBooking(false, new Date(gymClass.date), []);
  };

  // 👇 Opens the recurring booking config modal — used for RECURRING
  // classes. Defaults: recurring ON, today's date, all repeat days
  // pre-selected.
  const openBookingModal = () => {
    setIsRecurringBooking(true);
    setSelectedClassDate(new Date());
    setSelectedRepeatDays([]);
    setIsBookingModalVisible(true);
  };
  const toggleRepeatDay = (day: string) => {
    setSelectedRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleConfirmBookingModal = () => {
    if (isRecurringBooking && selectedRepeatDays.length === 0) {
      setIsBookingModalVisible(false);

      showAlert(
        "warning",
        i18n.t("select_days_title") || "Select Days",
        i18n.t("select_days_message") ||
          "Please select at least one day for the recurring booking.",
      );
      return;
    }
    setIsBookingModalVisible(false);
    submitBooking(isRecurringBooking, selectedClassDate, selectedRepeatDays);
  };

  const handleBookClassDelete = async (userClassId: string) => {
    try {
      if (!userClassId) return;
      const token = await handleGetToken();
      if (!token) {
        showAlert(
          "error",
          i18n.t("error_title") || "Error",
          i18n.t("user_not_authenticated") || "User not authenticated",
        );
        return;
      }
      const response = await fetch(
        `https://gawifit.com/api/UserClass/${userClassId}`,
        {
          method: "DELETE",
          headers: { Accept: "*/*", Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        showAlert(
          "error",
          i18n.t("error_title") || "Error",
          i18n.t("cancel_booking_failed") || "Unable to cancel this booking.",
        );
        return;
      }
      showAlert(
        "success",
        i18n.t("cancel_booking"),
        i18n.t("cancel_booking_success") || "Booking successfully cancelled",
      );
      setGymClass((prev: any) =>
        prev ? { ...prev, isBooked: false, userClassId: null } : prev,
      );
    } catch (error) {
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("cancel_booking_error") ||
          "An error occurred while cancelling the booking.",
      );
    }
  };

  // 👇 Confirmation prompt shown before actually cancelling the booking
  const confirmBookClassDelete = (userClassId: string) => {
    showAlert(
      "warning",
      i18n.t("cancel_booking_title") || "Cancel Booking",
      i18n.t("confirm_cancel_booking") ||
        "Are you sure you want to cancel this booking?",
      [
        { text: i18n.t("no") || "No", style: "cancel" },
        {
          text: i18n.t("yes") || "Yes",
          style: "destructive",
          onPress: () => handleBookClassDelete(userClassId),
        },
      ],
    );
  };

  const alertNode = (
    <SweetAlert
      visible={alertConfig.visible}
      type={alertConfig.type}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      isDarkMode={!!isDarkMode}
      isRTL={isArabic}
      onRequestClose={hideAlert}
    />
  );

  if (loading) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#007BFF" />
        {alertNode}
      </View>
    );
  }

  if (!gymClass) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: theme.ink }}>
          {i18n.t("no_class_data") || "No class data available"}
        </Text>
        {alertNode}
      </View>
    );
  }

  const isAr = i18n.locale === "ar";

  // 👇 FIX: this was previously reversed — showing descriptionEn when
  // isAr was true and descriptionAr otherwise. Now shows the matching
  // language, falling back to the default text when the class has no
  // description in that language at all.
  const description =
    (isAr ? gymClass.descriptionAr : gymClass.descriptionEn) ||
    i18n.t("default_class_description");

  const formatDateDMY = (date: string | Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  return (
    <View style={s.container}>
      {/* Header Image */}
      <ImageBackground
        source={{ uri: `https://gawifit.com/${gymClass.photoUrl}` }}
        style={s.bannerImage}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,1)"]}
          style={s.imageOverlay}
        />
        <View style={s.headerContent}>
          <Text style={s.classType}>
            {isAr ? gymClass.nameAr : gymClass.nameEn}
          </Text>
          <View style={s.infoRow}>
            <MaterialCommunityIcons name="calendar" size={18} color="#FF7002" />
            <Text
              style={[
                s.infoText,
                {
                  textAlign: isAr ? "right" : "left",
                  writingDirection: isAr ? "rtl" : "ltr",
                },
              ]}
            >
              {formatDateDMY(gymClass.date)}• {classFromTime}–{gymClass.to}
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Details */}
      <ScrollView style={s.detailsSection} showsVerticalScrollIndicator={false}>
        <Text
          style={[
            s.sectionTitle,
            {
              textAlign: isAr ? "right" : "left",
              writingDirection: isAr ? "rtl" : "ltr",
            },
          ]}
        >
          📋 {i18n.t("class_information")}
        </Text>

        <View style={s.detailBox}>
          {gymClass.isPaid && (
            <View
              style={[
                s.detailItem,
                { flexDirection: isAr ? "row-reverse" : "row" },
              ]}
            >
              <MaterialCommunityIcons
                name="currency-usd"
                size={20}
                color="#FF7002"
              />
              <Text style={s.detailText}>
                {i18n.t("paid_class") || "Paid Class"} —{" "}
                {i18n.t("price") || "Price"}: {gymClass.price}{" "}
                {i18n.t("currency") || "JOD"}
              </Text>
            </View>
          )}

          <View
            style={[
              s.detailItem,
              { flexDirection: isAr ? "row-reverse" : "row" },
            ]}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color="#FF7002"
            />
            <Text style={s.detailText}>
              {i18n.t("capacity")}: {gymClass.capacity} {i18n.t("attendees")}
            </Text>
          </View>
          <View
            style={[
              s.detailItem,
              { flexDirection: isAr ? "row-reverse" : "row" },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-check"
              size={20}
              color="#2563EB"
            />
            <Text style={s.detailText}>
              {i18n.t("booked")}: {gymClass.bookedCount} / {gymClass.capacity}
            </Text>
          </View>
          <View
            style={[
              s.detailItem,
              { flexDirection: isAr ? "row-reverse" : "row" },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color={gymClass.isBooked ? "#28A745" : "#CCCCCC"}
            />
            <Text style={s.detailText}>
              {gymClass.isBooked
                ? i18n.t("already_booked")
                : i18n.t("not_booked")}
            </Text>
          </View>

          {/* Recurring class info — only shown when the class repeats */}
          {gymClass.isRecurring && (
            <View
              style={[
                s.detailItem,
                { flexDirection: isAr ? "row-reverse" : "row" },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-sync"
                size={20}
                color={gymClass.isRecurringActive ? "#8B5CF6" : theme.muted}
              />
              <Text style={s.detailText}>
                {i18n.t("recurring_class") || "Recurring"}
                {!gymClass.isRecurringActive
                  ? ` (${i18n.t("paused") || "paused"})`
                  : ""}
                {gymClass.repeatDays?.length
                  ? `: ${formatRepeatDays(gymClass.repeatDays, isAr)}`
                  : ""}
              </Text>
            </View>
          )}

          {/* Recurring end date — only shown when the API sends one */}
          {gymClass.isRecurring && gymClass.recurringEndDate && (
            <View
              style={[
                s.detailItem,
                { flexDirection: isAr ? "row-reverse" : "row" },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-clock"
                size={20}
                color="#8B5CF6"
              />
              <Text style={s.detailText}>
                {i18n.t("recurring_until") || "Repeats until"}:{" "}
                {formatDateDMY(gymClass.recurringEndDate)}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            s.description,
            {
              textAlign: isAr ? "right" : "left",
              writingDirection: isAr ? "rtl" : "ltr",
            },
          ]}
        >
          {description}
        </Text>
      </ScrollView>

      {/* Book Button — only when upcoming, not already booked, and not full */}
      {!isPastClass && !gymClass.isBooked && !isClassFull && (
        <TouchableOpacity
          onPress={() => {
            if (gymClass.isRecurring) {
              // Recurring classes go through the date + days config modal
              openBookingModal();
              return;
            }
            // Non-recurring classes keep the simple confirm-alert flow
            showAlert(
              "warning",
              i18n.t("book_this_class"),
              gymClass.isPaid
                ? `${i18n.t("confirm_book_class") || "Are you sure you want to book this class?"} ${
                    i18n.t("wallet_withdraw_notice") || "This is a paid class"
                  } (${gymClass.price} ${i18n.t("currency") || "JOD"}) ${
                    i18n.t("will_be_deducted_from_wallet") ||
                    "will be deducted from your wallet."
                  }`
                : i18n.t("confirm_book_class") ||
                    "Are you sure you want to book this class?",
              [
                { text: i18n.t("no") || "No", style: "cancel" },
                {
                  text: i18n.t("yes") || "Yes",
                  style: "primary",
                  onPress: handleBookClassSimple,
                },
              ],
            );
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#FF7002", "#FF7002"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bookButton}
          >
            <Text style={s.bookButtonText}>{i18n.t("book_this_class")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Class Full — upcoming, not booked, no seats left: no button, just a notice */}
      {!isPastClass && !gymClass.isBooked && isClassFull && (
        <View style={s.fullClassBox}>
          <MaterialCommunityIcons
            name="account-multiple-remove"
            size={20}
            color={theme.muted}
          />
          <Text style={s.fullClassText}>
            {i18n.t("class_full_message") || "This class is fully booked"}
          </Text>
        </View>
      )}

      {/* Cancel button — confirms before deleting the booking */}
      {!isPastClass && gymClass.isBooked && (
        <TouchableOpacity
          onPress={() => confirmBookClassDelete(gymClass.userClassId)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#620000", "#5F0000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bookButton}
          >
            <Text style={s.bookButtonText}>{i18n.t("cancel_booking")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {isPastClass && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 24,
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#E5E5E5",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontWeight: "bold",
              color: "#666",
            }}
          >
            {i18n.t("class_finished")}
          </Text>
        </View>
      )}

      {/* Recurring booking config modal */}
      <Modal
        transparent
        animationType="slide"
        visible={isBookingModalVisible}
        onRequestClose={() => setIsBookingModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <TouchableOpacity
              style={s.modalCloseBtn}
              onPress={() => setIsBookingModalVisible(false)}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={theme.muted}
              />
            </TouchableOpacity>

            <Text
              style={[s.modalTitle, { textAlign: isAr ? "right" : "left" }]}
            >
              {i18n.t("book_this_class")}
            </Text>

            {/* Recurring toggle */}
            <View
              style={[
                s.modalRow,
                { flexDirection: isAr ? "row-reverse" : "row" },
              ]}
            >
              <Text style={s.modalRowLabel}>
                {i18n.t("book_as_recurring") || "Book as recurring"}
              </Text>
              <Switch
                value={isRecurringBooking}
                onValueChange={setIsRecurringBooking}
                trackColor={{ false: "#ccc", true: "#FF7002" }}
              />
            </View>

            {/* Start date picker — past dates disabled via minimumDate */}
            <TouchableOpacity
              style={[
                s.modalRow,
                { flexDirection: isAr ? "row-reverse" : "row" },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={s.modalRowLabel}>
                {i18n.t("start_date") || "Start date"}
              </Text>
              <Text style={s.modalDateValue}>
                {formatDateDMY(selectedClassDate)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedClassDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                minimumDate={new Date()}
                textColor={isDarkMode ? "#F0F0F0" : "#222222"}
                themeVariant={isDarkMode ? "dark" : "light"}
                onChange={(_event, date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (date) setSelectedClassDate(date);
                }}
              />
            )}

            {/* Repeat day selector — only relevant when recurring */}
            {isRecurringBooking && (
              <View style={s.modalDaysSection}>
                <Text
                  style={[
                    s.modalRowLabel,
                    { marginBottom: 8, textAlign: isAr ? "right" : "left" },
                  ]}
                >
                  {i18n.t("select_days") || "Select days"}
                </Text>
                <View style={s.dayChipRow}>
                  {(gymClass.repeatDays || []).map((day: string) => {
                    const selected = selectedRepeatDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[s.dayChip, selected && s.dayChipSelected]}
                        onPress={() => toggleRepeatDay(day)}
                      >
                        <Text
                          style={[
                            s.dayChipText,
                            selected && s.dayChipTextSelected,
                          ]}
                        >
                          {translateDay(day, isAr)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <TouchableOpacity onPress={handleConfirmBookingModal}>
              <LinearGradient
                colors={["#FF7002", "#FF7002"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.modalConfirmBtn}
              >
                <Text style={s.bookButtonText}>
                  {i18n.t("confirm_booking") || "Confirm Booking"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {alertNode}
    </View>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    bannerImage: { height: 240, justifyContent: "flex-end" },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    headerContent: { padding: 16 },
    classType: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
    infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    infoText: { color: "#FF7002", fontSize: 15, marginLeft: 6 },
    detailsSection: { flex: 1, paddingHorizontal: 16, marginTop: 10 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginVertical: 10,
      color: theme.ink,
    },
    detailBox: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 14,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 3,
      marginBottom: 16,
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    detailItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    detailText: {
      fontSize: 15,
      marginLeft: 8,
      color: theme.detail,
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.muted,
      backgroundColor: theme.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 80,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    bookButton: {
      paddingVertical: 14,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 24,
    },
    bookButtonText: {
      textAlign: "center",
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 17,
    },
    fullClassBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.surface,
      borderRadius: 12,
      paddingVertical: 14,
      marginHorizontal: 16,
      marginBottom: 24,
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    fullClassText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: "700",
      color: theme.muted,
    },
    // ── Booking modal ──────────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalBox: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 30,
    },
    modalCloseBtn: {
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 1,
      padding: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.ink,
      marginBottom: 16,
    },
    modalRow: {
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
    },
    modalRowLabel: {
      fontSize: 15,
      color: theme.ink,
      fontWeight: "600",
    },
    modalDateValue: {
      fontSize: 15,
      color: "#FF7002",
      fontWeight: "700",
    },
    modalDaysSection: { marginTop: 12, marginBottom: 8 },
    dayChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    dayChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border || "#DDD",
      backgroundColor: theme.bg,
    },
    dayChipSelected: {
      backgroundColor: "#FF7002",
      borderColor: "#FF7002",
    },
    dayChipText: { fontSize: 13, color: theme.ink, fontWeight: "600" },
    dayChipTextSelected: { color: "#FFFFFF" },
    modalConfirmBtn: {
      marginTop: 20,
      paddingVertical: 14,
      borderRadius: 12,
    },
  });
