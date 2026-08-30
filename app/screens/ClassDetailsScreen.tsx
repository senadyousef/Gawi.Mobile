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
  TextInput, // 👈 new — for the cancellation reason input
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
interface BookingErrorResponse {
  message?: string;
  messageAr?: string;
}
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

// 👇 new — is this booking occurrence's date already in the past?
const isBookingPastDate = (dateStr: string) => {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const bookingDateStr = String(dateStr).split("T")[0];
  return bookingDateStr < todayStr;
};

// 👇 new — maps a per-booking cancellationStatus to a display label.
// "None" (or missing) means nothing to show / still cancellable.
const getCancellationStatusLabel = (status?: string): string | null => {
  switch (status) {
    case "Pending":
      return i18n.t("cancellation_pending") || "Cancellation pending";
    case "Approved":
      return i18n.t("cancellation_approved") || "Cancelled";
    case "Rejected":
      return i18n.t("cancellation_rejected") || "Cancellation rejected";
    default:
      return null;
  }
};

// 👇 replaces fetchGymClassByUser — fetches ONE class by id via the JWT-authed
// /mobile/{id} endpoint instead of fetching the whole list and finding it.
const fetchGymClassById = async (classId: number) => {
  try {
    const token = await handleGetToken();
    if (!token) throw new Error("User not authenticated");
    const response = await fetch(
      `http://192.168.1.16/api/GymClass/mobile/${classId}`,
      {
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok) throw new Error("Failed to fetch gym class");
    const data = await response.json();
    console.log("fetchGymClassById response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
};

export default function ClassDetailsScreen({ route }: any) {
  const { classId } = route.params || {};
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [gymClass, setGymClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 👇 Recurring booking config modal state — only used for "Ongoing" mode
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isRecurringBooking, setIsRecurringBooking] = useState(true);
  const [selectedClassDate, setSelectedClassDate] = useState<Date>(new Date());
  const [selectedRepeatDays, setSelectedRepeatDays] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 👇 new — recurring booking end date, only shown/used when
  // isRecurringBooking is true. null = no end date chosen yet / unbounded.
  const [selectedRecurringEndDate, setSelectedRecurringEndDate] =
    useState<Date>(new Date());
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // 👇 Cancellation modal state — collects a reason before calling
  // /request-cancellation. cancelTargetId holds the userClassId being cancelled.
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [isSubmittingCancellation, setIsSubmittingCancellation] =
    useState(false);
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

  // 👇 Booking-type classification, drives which flow the Book button opens.
  // - not recurring at all -> "oneTime"
  // - recurring + fixed "Course" schedule -> "course" (no date/day choice)
  // - recurring + "Ongoing" -> "ongoing" (modal: pick date, or pick repeat days)
  const bookingKind: "oneTime" | "course" | "ongoing" = React.useMemo(() => {
    if (!gymClass?.isRecurring) return "oneTime";
    if (gymClass.recurringMode === "Course") return "course";
    return "ongoing";
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
        const foundClass = await fetchGymClassById(classId);
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

  const getLocalizedBookingError = (result: BookingErrorResponse): string => {
    const text = result?.message || "";
    const messageAr = result?.messageAr || "";

    // Show Arabic when the current language is Arabic
    if (i18n.locale.startsWith("ar")) {
      return messageAr || text;
    }

    // Otherwise show English
    return text;
  };

  // 👇 Shared pre-flight checks (login, class still exists, not already
  // booked, not full) — used by both booking submit paths below.
  const preflightBookingCheck = async (): Promise<{
    MemberId: string;
    classToBook: any;
  } | null> => {
    const MemberId = await AsyncStorage.getItem("MemberId");
    if (!MemberId) {
      showAlert(
        "error",
        i18n.t("login_required_title") || "Login Required",
        i18n.t("login_required_book_class") || "Please log in to book a class.",
      );
      return null;
    }
    const classToBook = await fetchGymClassById(classId);
    if (!classToBook) {
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("class_not_found_cannot_book") ||
          "Class not found. Cannot book.",
      );
      return null;
    }
    if (!classToBook.canBook) {
      showAlert(
        "info",
        i18n.t("cannot_book_title") || "Can't Book",
        isArabic
          ? classToBook.cannotBookReasonAr
          : classToBook.cannotBookReasonEn,
      );
      setGymClass(classToBook);
      return null;
    }

    return { MemberId, classToBook };
  };

  const handleBookingResponse = async (
    response: Response,
    classToBook: any,
  ) => {
    // Read the response body only once
    const raw = await response.text();
    let result: any;

    try {
      result = JSON.parse(raw);
    } catch {
      result = {
        message: raw,
        messageAr: "",
      };
    }

    console.log("Booking Response:", result);
    console.log("English:", result.message);
    console.log("Arabic:", result.messageAr);

    if (!response.ok) {
      showAlert(
        "error",
        i18n.t("booking_failed_title") || "Booking Failed",
        getLocalizedBookingError(result),
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

    // 👇 refresh from the server so canBook / cannotBookReason* / bookings
    // reflect the new state rather than guessing it locally
    loadClass({ silent: true });
  };

  // 👇 One-time class (isRecurring: false) OR fixed-schedule course
  // (isRecurring: true, recurringMode: "Course") — no date/day choice,
  // minimal payload.
  const submitOneTimeOrCourseBooking = async () => {
    try {
      const pre = await preflightBookingCheck();
      if (!pre) return;
      const { MemberId, classToBook } = pre;

      const payload = {
        userId: parseInt(MemberId),
        gymClassId: classToBook.id,
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

      await handleBookingResponse(response, classToBook);
    } catch (error) {
      console.log(error);
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("booking_error_message") ||
          "An unexpected error occurred while booking.",
      );
    }
  };

  // 👇 "Ongoing" recurring class — isRecurringBooking false = one specific
  // date, true = a weekly repeat on the chosen days (optionally bounded by
  // recurringEndDate).
  const submitRecurringBooking = async (
    isRecurringBookingFlag: boolean,
    classDate: Date,
    repeatDays: string[],
    recurringEndDate: Date | null, // 👈 new
  ) => {
    try {
      const pre = await preflightBookingCheck();
      if (!pre) return;
      const { MemberId, classToBook } = pre;

      const payload = {
        userId: parseInt(MemberId),
        gymClassId: classToBook.id,
        isRecurringBooking: isRecurringBookingFlag,
        classDate: classDate.toISOString(),
        selectedRepeatDays: isRecurringBookingFlag ? repeatDays : [],
        // 👇 new — only sent when recurring; null means no end date chosen
        recurringBookingEndDate:
          isRecurringBookingFlag && recurringEndDate
            ? recurringEndDate.toISOString()
            : null,
      };
      console.log("========== Booking Dates ==========");
      console.log("Start Date:", classDate);
      console.log("Start Date ISO:", classDate.toISOString());
      console.log("Start Date Local:", classDate.toLocaleString());

      console.log("End Date:", recurringEndDate);
      console.log(
        "End Date ISO:",
        recurringEndDate ? recurringEndDate.toISOString() : null,
      );
      console.log(
        "End Date Local:",
        recurringEndDate ? recurringEndDate.toLocaleString() : null,
      );

      console.log("Repeat Days:", repeatDays);
      console.log("Recurring:", isRecurringBookingFlag);
      console.log("===================================");
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

      await handleBookingResponse(response, classToBook);
    } catch (error: any) {
      console.log("submitRecurringBooking error:", error?.message ?? error);
      console.log("stack:", error?.stack);
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("booking_error_message") ||
          "An unexpected error occurred while booking.",
      );
    }
  };

  // 👇 Opens the recurring booking config modal — only reached for
  // "Ongoing" mode. Defaults: recurring ON, today's date, no days pre-picked,
  // no end date pre-picked.
  const openBookingModal = () => {
    setIsRecurringBooking(true);
    setSelectedClassDate(new Date());
    setSelectedRepeatDays([]);
    setSelectedRecurringEndDate(new Date());
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
    submitRecurringBooking(
      isRecurringBooking,
      selectedClassDate,
      selectedRepeatDays,
      isRecurringBooking ? selectedRecurringEndDate : null, // 👈 new
    );
  };

  // 👇 Opens the cancellation-reason modal instead of an immediate
  // Yes/No confirm — the reason itself is now required input.
  // 👇 Simple confirm + DELETE — used for "ongoing" and "oneTime" bookings,
  // which don't go through the reason-request flow (that's Course-only).
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
        `http://192.168.1.16/api/UserClass/${userClassId}`,
        {
          method: "DELETE",
          headers: { Accept: "*/*", Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        console.log(response.status);
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
      // 👇 refresh from the server rather than guessing local state
      loadClass({ silent: true });
    } catch (error: any) {
      console.log("handleBookClassDelete error:", error?.message ?? error);
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("cancel_booking_error") ||
          "An error occurred while cancelling the booking.",
      );
    }
  };

  // 👇 Confirmation prompt for the plain-delete path (ongoing/oneTime)
  const confirmDeleteBooking = (userClassId: string) => {
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

  // 👇 Opens the cancellation-reason modal — Course mode ONLY. Ongoing and
  // one-time bookings go through confirmDeleteBooking + DELETE instead.
  const openCancelModal = (userClassId: string | number | undefined) => {
    if (!userClassId) {
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("no_booking_to_cancel") ||
          "No booking was found to cancel for this class.",
      );
      return;
    }
    setCancelTargetId(String(userClassId));
    setCancelReason("");
    setIsCancelModalVisible(true);
  };

  // 👇 Routes to the right cancellation flow based on bookingKind:
  // Course -> reason-request modal, everything else -> plain delete confirm.
  // Takes a specific userClassId so each occurrence in the "My Bookings"
  // list can be cancelled independently.
  const handleCancelPress = (userClassId: string | number | undefined) => {
    if (!userClassId) {
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("no_booking_to_cancel") ||
          "No booking was found to cancel for this class.",
      );
      return;
    }
    if (bookingKind === "course") {
      openCancelModal(userClassId);
    } else {
      confirmDeleteBooking(String(userClassId));
    }
  };
  // 👇 Replaces the old DELETE call — now POSTs a reason to
  // /UserClass/{id}/request-cancellation. Since this is a *request* (the
  // booking has requiresCancellationApproval / cancellationStatus fields),
  // we don't optimistically flip isBooked to false — we just show the
  // outcome and re-fetch the class so its real status comes from the server.
  const submitCancellationRequest = async () => {
    if (!cancelTargetId) return;

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      showAlert(
        "warning",
        i18n.t("cancellation_reason_required_title") || "Reason Required",
        i18n.t("cancellation_reason_required_message") ||
          "Please enter a reason for cancelling this class.",
      );
      return;
    }

    setIsSubmittingCancellation(true);
    try {
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
        `http://192.168.1.16/api/UserClass/${cancelTargetId}/request-cancellation`,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: trimmedReason }),
        },
      );

      const resultText = await response.text();
      console.log(
        "request-cancellation response:",
        response.status,
        resultText,
      );

      if (!response.ok) {
        showAlert(
          "error",
          i18n.t("error_title") || "Error",
          resultText ||
            i18n.t("cancel_booking_failed") ||
            "Unable to cancel this booking.",
        );
        return;
      }

      setIsCancelModalVisible(false);
      showAlert(
        "success",
        i18n.t("cancel_booking"),
        i18n.t("cancel_request_submitted_message") ||
          "Your cancellation request has been submitted.",
      );
      // 👇 refresh from the server instead of guessing the new state locally
      loadClass({ silent: true });
    } catch (error: any) {
      console.log("submitCancellationRequest error:", error?.message ?? error);
      showAlert(
        "error",
        i18n.t("error_title") || "Error",
        i18n.t("cancel_booking_error") ||
          "An error occurred while cancelling the booking.",
      );
    } finally {
      setIsSubmittingCancellation(false);
    }
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

  // 👇 localized reason shown instead of the Book button whenever the API
  // says canBook is false (already booked, blocked, full, etc. all come
  // through this one field now).
  const cannotBookReason =
    (isAr ? gymClass.cannotBookReasonAr : gymClass.cannotBookReasonEn) ||
    i18n.t("cannot_book_default") ||
    "This class can't be booked right now.";

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
        source={{ uri: `http://192.168.1.16/${gymClass.photoUrl}` }}
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
          {gymClass.isRecurring ? (
            gymClass.recurringMode && (
              <View
                style={[
                  s.modeBadge,
                  {
                    backgroundColor:
                      gymClass.recurringMode === "Course"
                        ? "#8B5CF6"
                        : "#FF7002",
                    alignSelf: isAr ? "flex-end" : "flex-start",
                  },
                ]}
              >
                {/* <MaterialCommunityIcons
                  name={
                    gymClass.recurringMode === "Course"
                      ? "book-open-variant"
                      : "infinity"
                  }
                  size={14}
                  color="#FFFFFF"
                /> */}
                <Text style={s.modeBadgeText}>
                  {gymClass.recurringMode === "Course"
                    ? isAr
                      ? "دورة"
                      : "Course"
                    : isAr
                      ? "مستمر"
                      : "Ongoing"}
                </Text>
              </View>
            )
          ) : (
            // 👇 isRecurring: false -> one-time class, own badge (gray, calendar icon)
            <View
              style={[
                s.modeBadge,
                {
                  backgroundColor: "#6B7280",
                  alignSelf: isAr ? "flex-end" : "flex-start",
                },
              ]}
            >
              <MaterialCommunityIcons
                name="calendar-blank"
                size={14}
                color="#FFFFFF"
              />
              <Text style={s.modeBadgeText}>
                {isAr ? "لمرة واحدة" : "One Time"}
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

        {/* 👇 new — "My Bookings": lists every occurrence in gymClass.bookings
            (not just bookings[0]) so a multi-date Course booking shows each
            date, its attendance/cancellation status, and its own cancel
            action. Replaces the old single bottom "Cancel booking" button. */}
        {gymClass.isBooked && (gymClass.bookings?.length ?? 0) > 0 && (
          <View style={s.bookingsSection}>
            <Text
              style={[
                s.sectionTitle,
                {
                  textAlign: isAr ? "right" : "left",
                  writingDirection: isAr ? "rtl" : "ltr",
                },
              ]}
            >
              🗓️ {i18n.t("my_bookings") || "My Bookings"}
            </Text>

            {gymClass.bookings.map((booking: any) => {
              const bookingPast = isBookingPastDate(booking.classDate);
              const statusLabel = getCancellationStatusLabel(
                booking.cancellationStatus,
              );
              const canCancelThis =
                !bookingPast &&
                (!booking.cancellationStatus ||
                  booking.cancellationStatus === "None");

              return (
                <View
                  key={booking.userClassId}
                  style={[
                    s.bookingRow,
                    { flexDirection: isAr ? "row-reverse" : "row" },
                  ]}
                >
                  <View style={s.bookingRowInfo}>
                    <Text
                      style={[
                        s.bookingDateText,
                        { textAlign: isAr ? "right" : "left" },
                      ]}
                    >
                      {translateDay(booking.day, isAr)} •{" "}
                      {formatDateDMY(booking.classDate)}
                    </Text>
                    <Text
                      style={[
                        s.bookingMetaText,
                        { textAlign: isAr ? "right" : "left" },
                      ]}
                    >
                      {booking.paidAmount} {i18n.t("currency") || "JOD"}
                      {booking.isAttended
                        ? ` • ${i18n.t("attended") || "Attended"}`
                        : bookingPast
                          ? ` • ${i18n.t("not_attended") || "Not attended"}`
                          : ""}
                    </Text>
                    {statusLabel && (
                      <View style={s.bookingStatusBadge}>
                        <Text style={s.bookingStatusText}>{statusLabel}</Text>
                      </View>
                    )}
                  </View>

                  {canCancelThis && (
                    <TouchableOpacity
                      style={s.bookingCancelBtn}
                      onPress={() => handleCancelPress(booking.userClassId)}
                    >
                      <MaterialCommunityIcons
                        name="close-circle-outline"
                        size={16}
                        color="#DC2626"
                      />
                      <Text style={s.bookingCancelBtnText}>
                        {i18n.t("cancel") || "Cancel"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 👇 Book Button area — driven entirely by gymClass.canBook now.
          When canBook is true -> show the Book button (bookingKind-based
          flow). When false -> show the localized reason from the API
          (cannotBookReasonEn / cannotBookReasonAr) instead of the button. */}
      {!isPastClass &&
        (gymClass.canBook ? (
          <TouchableOpacity
            onPress={() => {
              if (bookingKind === "ongoing") {
                openBookingModal();
                return;
              }
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
                    onPress: submitOneTimeOrCourseBooking,
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
        ) : (
          <View style={s.fullClassBox}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={theme.muted}
            />
            <Text style={s.fullClassText}>{cannotBookReason}</Text>
          </View>
        ))}

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

      {/* Recurring booking config modal — "Ongoing" mode only */}
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

            {/* Recurring toggle — false: book just the picked date.
                true: book a weekly repeat on the picked days. */}
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

            {/* Start / single-occurrence date picker — past dates disabled
                via minimumDate. Always shown: it's the target date when
                the toggle is off, and the recurrence start date when on. */}
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

            {/* Repeat day selector — only relevant when recurring toggle is on */}
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

            {/* 👇 new — recurring booking end date, only shown when
                isRecurringBooking is true. Optional: null stays unbounded. */}
            {isRecurringBooking && (
              <>
                <TouchableOpacity
                  style={[
                    s.modalRow,
                    { flexDirection: isAr ? "row-reverse" : "row" },
                  ]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={s.modalRowLabel}>
                    {i18n.t("recurring_end_date") || "Repeat until"}
                  </Text>
                  <Text style={s.modalDateValue}>
                    {formatDateDMY(selectedRecurringEndDate)}
                  </Text>
                </TouchableOpacity>

                {showEndDatePicker && (
                  <DateTimePicker
                    value={selectedRecurringEndDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={selectedClassDate}
                    textColor={isDarkMode ? "#F0F0F0" : "#222222"}
                    themeVariant={isDarkMode ? "dark" : "light"}
                    onChange={(event, date) => {
                      console.log("Picker event:", event.type);
                      console.log("Selected date:", date);
                      console.log(
                        "Selected local:",
                        date ? date.toLocaleDateString() : null,
                      );

                      setShowEndDatePicker(Platform.OS === "ios");

                      if (date) {
                        setSelectedRecurringEndDate(date);
                      }
                    }}
                  />
                )}
              </>
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

      {/* Cancellation reason modal — new */}
      <Modal
        transparent
        animationType="slide"
        visible={isCancelModalVisible}
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <TouchableOpacity
              style={s.modalCloseBtn}
              onPress={() => setIsCancelModalVisible(false)}
              disabled={isSubmittingCancellation}
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
              {i18n.t("cancel_booking_title") || "Cancel Booking"}
            </Text>

            <Text
              style={[
                s.modalRowLabel,
                { marginBottom: 8, textAlign: isAr ? "right" : "left" },
              ]}
            >
              {i18n.t("cancellation_reason_label") ||
                "Please tell us why you're cancelling"}
            </Text>

            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder={
                i18n.t("cancellation_reason_placeholder") ||
                "Type your reason here..."
              }
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={4}
              textAlign={isAr ? "right" : "left"}
              style={s.reasonInput}
              editable={!isSubmittingCancellation}
            />

            <TouchableOpacity
              onPress={submitCancellationRequest}
              disabled={isSubmittingCancellation}
            >
              <LinearGradient
                colors={["#620000", "#5F0000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.modalConfirmBtn}
              >
                {isSubmittingCancellation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.bookButtonText}>
                    {i18n.t("submit_cancellation") || "Submit"}
                  </Text>
                )}
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
    infoText: { color: "#FF7002", fontSize: 15, marginLeft: 6 },
    modeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    modeBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
    },
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    bannerImage: { height: 240, justifyContent: "flex-end" },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    headerContent: { padding: 16 },
    classType: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
    infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
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
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    // ── My Bookings list ───────────────────────────────────────────────
    bookingsSection: { marginBottom: 24 },
    bookingRow: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    bookingRowInfo: { flex: 1 },
    bookingDateText: { fontSize: 15, fontWeight: "700", color: theme.ink },
    bookingMetaText: { fontSize: 13, color: theme.muted, marginTop: 2 },
    bookingStatusBadge: {
      marginTop: 6,
      alignSelf: "flex-start",
      backgroundColor: "#FEF3C7",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    bookingStatusText: { fontSize: 11, fontWeight: "700", color: "#92400E" },
    bookingCancelBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: "#DC2626",
    },
    bookingCancelBtnText: { fontSize: 12, fontWeight: "700", color: "#DC2626" },
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
      paddingHorizontal: 12,
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
      flexShrink: 1,
      textAlign: "center",
    },
    // ── Booking / cancellation modals ──────────────────────────────────
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
      alignItems: "center",
      justifyContent: "center",
    },
    // 👇 new — reason text input for cancellation modal
    reasonInput: {
      minHeight: 100,
      borderWidth: 1,
      borderColor: theme.border || "#DDD",
      borderRadius: 12,
      padding: 12,
      color: theme.ink,
      backgroundColor: theme.bg,
      textAlignVertical: "top",
    },
  });