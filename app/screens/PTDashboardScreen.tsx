import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons as Icon } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppContext } from "../context";
import { LinearGradient } from "expo-linear-gradient";
import { handleGetToken } from "../helpers";
import { useI18n } from "../hooks/useI18n";
import en from "../localization/en";
import ar from "../localization/ar";

const { width: SW, height: SH } = Dimensions.get("window");

const dir = (r: boolean) =>
  ({ flexDirection: r ? "row-reverse" : "row" }) as const;
const ta = (r: boolean) => ({ textAlign: r ? "right" : "left" }) as const;
const ml = (r: boolean, v: number) => ({
  marginLeft: r ? 0 : v,
  marginRight: r ? v : 0,
});
const aEnd = (r: boolean) =>
  ({ alignItems: r ? "flex-end" : "flex-start" }) as const;

const TimePicker = React.memo(
  ({ visible, value, onChange, title, colors, cancelLabel }: any) => {
    if (!visible) return null;
    if (Platform.OS === "android")
      return (
        <DateTimePicker
          value={value}
          mode="time"
          display="default"
          onChange={onChange}
        />
      );
    return (
      <View style={S.tpOverlay}>
        <View style={S.tpContainer}>
          <LinearGradient colors={colors} style={S.tpGradient}>
            <View
              style={[
                S.tpHeader,
                { flexDirection: "row", justifyContent: "space-between" },
              ]}
            >
              <TouchableOpacity onPress={() => onChange(null, undefined)}>
                <Text style={S.tpCancel}>{cancelLabel}</Text>
              </TouchableOpacity>
              <Text style={S.tpTitle}>{title}</Text>
              <TouchableOpacity onPress={() => onChange(null, undefined)}>
                <Text style={S.tpDone}>{cancelLabel}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
          <DateTimePicker
            value={value}
            mode="time"
            display="spinner"
            onChange={onChange}
            style={{ height: 200, backgroundColor: "#FFF" }}
          />
        </View>
      </View>
    );
  },
);

const DayGrid = React.memo(
  ({
    days,
    selected,
    onSelect,
    dark,
  }: {
    days: { key: string; label: string }[];
    selected: string;
    onSelect: (key: string) => void;
    dark: boolean;
  }) => (
    <View style={S.daysGrid}>
      {days.map((day) => (
        <TouchableOpacity
          key={day.key}
          style={[
            S.dayCard,
            selected === day.key && S.dayCardSelected,
            dark && { backgroundColor: "#111111", borderColor: "#222222" },
          ]}
          onPress={() => onSelect(day.key)}
        >
          <Text
            style={[
              S.dayCardAbbr,
              selected === day.key && S.dayCardAbbrSel,
              dark && !(selected === day.key) && { color: "#888888" },
            ]}
          >
            {day.label.substring(0, 3)}
          </Text>
          <Text
            style={[
              S.dayCardName,
              selected === day.key && S.dayCardNameSel,
              dark && !(selected === day.key) && { color: "#555555" },
            ]}
          >
            {day.label}
          </Text>
          {selected === day.key && (
            <View style={S.dayCheck}>
              <Icon name="checkmark" size={12} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  ),
);

const SectionHeader = React.memo(
  ({ iconName, color = "#3B82F6", title, subtitle, isRTL, dark }: any) => (
    <View
      style={[
        S.modalSectionHeader,
        { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center" },
      ]}
    >
      <View
        style={[
          S.sectionIconCircle,
          {
            backgroundColor: color,
            marginRight: isRTL ? 0 : 12,
            marginLeft: isRTL ? 12 : 0,
          },
        ]}
      >
        <Icon name={iconName} size={20} color="#FFF" />
      </View>
      <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
        <Text
          style={[
            S.modalSectionTitle,
            { textAlign: isRTL ? "right" : "left" },
            dark && { color: "#EEEEEE" },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              S.modalSectionDesc,
              { textAlign: isRTL ? "right" : "left" },
              dark && { color: "#888888" },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  ),
);

const TimeRow = React.memo(
  ({ iconName, iconColor, label, value, onPress, isRTL, dark }: any) => (
    <View style={S.timeInputWrapper}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <View style={[S.timeIcon, { backgroundColor: iconColor }]}>
          <Icon name={iconName} size={14} color="#FFF" />
        </View>
        <Text
          style={[
            S.timeLabel,
            { textAlign: isRTL ? "right" : "left" },
            dark && { color: "#888888" },
          ]}
        >
          {label}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          S.timeBtn,
          {
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
          },
          dark && { backgroundColor: "#111111", borderColor: "#222222" },
        ]}
        onPress={onPress}
      >
        <Icon name="time-outline" size={20} color={iconColor} />
        <Text
          style={[
            S.timeBtnValue,
            { flex: 1, textAlign: isRTL ? "right" : "left" },
            dark && { color: "#EEEEEE" },
          ]}
        >
          {value}
        </Text>
        <Icon
          name="chevron-down"
          size={18}
          color="#888888"
          style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
        />
      </TouchableOpacity>
    </View>
  ),
);

const DurationCard = React.memo(
  ({ from, to, color = "#3B82F6", label, hoursLabel, isRTL, dark }: any) => {
    const hours = ((to.getTime() - from.getTime()) / (1000 * 60 * 60)).toFixed(
      1,
    );
    return (
      <View
        style={[
          S.durationCard,
          dir(isRTL),
          dark && { backgroundColor: "#111111", borderColor: "#222222" },
        ]}
      >
        <View
          style={[S.durationIconWrap, dark && { backgroundColor: "#000000" }]}
        >
          <Icon name="hourglass" size={22} color={color} />
        </View>
        <View style={[{ flex: 1 }, aEnd(isRTL), ml(isRTL, 12)]}>
          <Text
            style={[S.durationLabel, ta(isRTL), dark && { color: "#888888" }]}
          >
            {label}
          </Text>
          <Text
            style={[S.durationValue, ta(isRTL), dark && { color: "#AADDFF" }]}
          >
            {hours} {hoursLabel}
          </Text>
        </View>
      </View>
    );
  },
);

const ActionBtns = React.memo(
  ({
    cancelLabel,
    confirmLabel,
    onCancel,
    onConfirm,
    loading: ld,
    confirmBg = "#3B82F6",
    cancelColor = "#64748B",
    cancelBg = "#F8FAFC",
    cancelBorder = "#E2E8F0",
    isRTL,
    dark,
  }: any) => (
    <View style={[S.actionRow, dir(isRTL)]}>
      <TouchableOpacity
        style={[
          S.actionCancel,
          {
            backgroundColor: dark ? "#111111" : cancelBg,
            borderColor: dark ? "#222222" : cancelBorder,
          },
        ]}
        onPress={onCancel}
        disabled={ld}
      >
        <Icon
          name="close-circle"
          size={18}
          color={dark ? "#888888" : cancelColor}
        />
        <Text
          style={[S.actionCancelTxt, { color: dark ? "#888888" : cancelColor }]}
        >
          {cancelLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          S.actionConfirm,
          { backgroundColor: confirmBg },
          ld && { opacity: 0.6 },
        ]}
        onPress={onConfirm}
        disabled={ld}
      >
        {ld ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <View style={S.confirmIconWrap}>
              <Icon name="checkmark" size={18} color="#FFF" />
            </View>
            <Text style={S.actionConfirmTxt}>{confirmLabel}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  ),
);

const PtInfoCard = React.memo(
  ({ selectedPT, ptIdLabel, gymIdLabel, isRTL, extraContent, dark }: any) => (
    <View style={S.ptInfoSection}>
      <View
        style={[
          S.ptInfoCard,
          dir(isRTL),
          dark && { backgroundColor: "#111111", borderColor: "#222222" },
        ]}
      >
        <View
          style={{
            position: "relative",
            marginRight: isRTL ? 0 : 12,
            marginLeft: isRTL ? 12 : 0,
          }}
        >
          {selectedPT?.photoUrlPt ? (
            <Image
              source={{ uri: selectedPT.photoUrlPt }}
              style={S.ptInfoImg}
            />
          ) : (
            <View style={S.ptInfoImgPlaceholder}>
              <Icon name="person" size={28} color="#FFF" />
            </View>
          )}
          <View style={S.onlineDot} />
        </View>
        <View style={[{ flex: 1 }, aEnd(isRTL)]}>
          <Text style={[S.ptInfoName, ta(isRTL), dark && { color: "#EEEEEE" }]}>
            {selectedPT?.namePt}
          </Text>
          <View style={[dir(isRTL), { gap: 8, flexWrap: "wrap" }]}>
            <View style={[dir("ltr"), S.badge, { backgroundColor: "#3B82F6" }]}>
              <Icon name="finger-print" size={11} color="#FFF" />
              <Text style={S.badgeTxt}>
                {ptIdLabel}: {selectedPT?.ptId}
              </Text>
            </View>
            <View style={[dir("ltr"), S.badge, { backgroundColor: "#8B5CF6" }]}>
              <Icon name="business" size={11} color="#FFF" />
              <Text style={S.badgeTxt}>
                {gymIdLabel}: {selectedPT?.gymId}
              </Text>
            </View>
          </View>
          {extraContent}
        </View>
      </View>
    </View>
  ),
);

const PTDashboardScreen = ({ navigation }: any) => {
  const [ptData, setPtData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { handleLogout, isDarkMode } = useAppContext() as any;
  const { getDirection, isArabic } = useI18n();

  const dark = isDarkMode ?? false;
  const isAr = isArabic();
  const isRTL =
    (getDirection() as any)?.flexDirection === "row-reverse" ||
    (getDirection() as any)?.direction === "rtl";
  const T = isAr ? ar : en;

  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedPT, setSelectedPT] = useState<any>(null);
  const [shiftDay, setShiftDay] = useState("");
  const [shiftFromTime, setShiftFromTime] = useState(new Date());
  const [shiftToTime, setShiftToTime] = useState(new Date());
  const [showFromTP, setShowFromTP] = useState(false);
  const [showToTP, setShowToTP] = useState(false);
  const [addingShift, setAddingShift] = useState(false);
  const [editingWD, setEditingWD] = useState<any>(null);
  const [editShiftDay, setEditShiftDay] = useState("");
  const [editFromTime, setEditFromTime] = useState(new Date());
  const [editToTime, setEditToTime] = useState(new Date());
  const [showEditFromTP, setShowEditFromTP] = useState(false);
  const [showEditToTP, setShowEditToTP] = useState(false);
  const [editingShift, setEditingShift] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<any>(null);
  const [deletingShift, setDeletingShift] = useState(false);

  const API_DAYS = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // غيّر daysOfWeek ليرجع objects بدل strings
  const daysOfWeek = useMemo(
    () =>
      API_DAYS.map((key) => ({
        key, // القيمة المرسلة للـ API دايماً إنجليزي
        label: (T.days as any)[key], // القيمة المعروضة (عربي أو إنجليزي)
      })),
    [T],
  );

  const DAY_MAP = {
    // Arabic → English
    الاثنين: "monday",
    الثلاثاء: "tuesday",
    الأربعاء: "wednesday",
    الخميس: "thursday",
    الجمعة: "friday",
    السبت: "saturday",
    الأحد: "sunday",

    // Short English → Full English
    mon: "monday",
    tue: "tuesday",
    wed: "wednesday",
    thu: "thursday",
    fri: "friday",
    sat: "saturday",
    sun: "sunday",
  };

  const normalizeDay = (day) => {
    if (!day) return "";

    const value = day.toString().trim();
    const lower = value.toLowerCase();

    // إذا كان أصلاً Monday / Sunday ...
    if (API_DAYS.includes(lower)) {
      return lower;
    }

    // إذا كان عربي أو مختصر إنجليزي
    return DAY_MAP[value] || DAY_MAP[lower] || lower;
  };
  const formatTime = useCallback(
    (s: string) => {
      if (!s) return T.time.na;
      const t = s.toLowerCase();
      if (t.includes("am") || t.includes("pm"))
        return s.replace(/am/gi, T.time.am).replace(/pm/gi, T.time.pm);
      const [h, m] = s.split(":");
      const hr = parseInt(h);
      return `${hr % 12 || 12}:${m} ${hr >= 12 ? T.time.pm : T.time.am}`;
    },
    [T],
  );

  const cap = (d: string) =>
    d ? d[0].toUpperCase() + d.slice(1).toLowerCase() : "";
  const fmtAPI = (d: Date) => {
    const h = d.getHours(),
      m = d.getMinutes();
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };
  const fmtAPI2 = (d: Date) => {
    const h = d.getHours(),
      m = d.getMinutes();
    return `${h % 12 || 12}:${m.toString().padStart(2, "0")}${h >= 12 ? "PM" : "AM"}`;
  };

  const parseTime = (s: string) => {
    const d = new Date(),
      t = s.toLowerCase();
    let h: number, m: number;
    if (t.includes("am") || t.includes("pm")) {
      const [tp, ap] = t.split(" ");
      const [hs, ms] = tp.split(":");
      h = parseInt(hs);
      m = parseInt(ms);
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
    } else {
      const [hs, ms] = t.split(":");
      h = parseInt(hs);
      m = parseInt(ms);
    }
    d.setHours(h, m, 0, 0);
    return d;
  };

  const getToken = async () => {
    const t = await handleGetToken();
    return t?.startsWith("Bearer ") ? t.replace("Bearer ", "") : t;
  };

  useEffect(() => {
    fetchPTs();
  }, []);

  const fetchPTs = async () => {
    try {
      setLoading(true);
      setError("");
      const userId = await AsyncStorage.getItem("MemberId");
      console.log("Fetching PTs for userId:", userId);
      const res = await fetch(
        `http://192.168.1.27/api/PT/GetPTWithHourShift?userId=${userId}`,
        {
          method: "GET",
          headers: { accept: "text/plain", "Content-Type": "application/json" },
        },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const grouped = data.ptWithClassBooked.reduce((acc: any[], item: any) => {
        let pt = acc.find((p) => p.ptId === item.ptId);
        if (!pt) {
          pt = {
            ptId: item.ptId,
            gymId: item.gymId,
            namePt: item.namePt,
            photoUrlPt: item.photoUrlPt,
            workDays: [],
            ptMyClass: [],
          };
          acc.push(pt);
        }
        pt.workDays.push({
          day: item.day,
          fromHour: item.from,
          toHour: item.to,
          workshiftId: item.workshiftId,
        });
        if (Array.isArray(item.ptMyClass))
          pt.ptMyClass.push(
            ...item.ptMyClass.map((c: any) => ({
              ...c,
              workshiftId: item.workshiftId,
            })),
          );
        return acc;
      }, []);
      setPtData(grouped);
    } catch (e: any) {
      setError(e.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutPress = () =>
    Alert.alert(T.alerts.logout, T.alerts.logoutConfirm, [
      { text: T.alerts.cancel, style: "cancel" },
      { text: T.alerts.logout, onPress: handleLogout, style: "destructive" },
    ]);

  const openAddModal = (pt: any) => {
    setSelectedPT(pt);
    setShiftDay(API_DAYS[0]); // دايماً "monday" كـ key
    setShiftFromTime(new Date());
    setShiftToTime(new Date());
    setShowAddShiftModal(true);
  };
  const closeAddModal = () => {
    setShowAddShiftModal(false);
    setSelectedPT(null);
    setShiftDay("");
  };

  const addWorkShift = async () => {
    if (!shiftDay || !selectedPT) {
      Alert.alert("Error", "Please select a day");
      return;
    }
    setAddingShift(true);
    try {
      const UserId = await AsyncStorage.getItem("MemberId");

      const token = await getToken();
      if (!token) {
        Alert.alert("Error", "No token");
        return;
      }
      const res = await fetch("http://192.168.1.27/api/PTWorkShifts", {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          day: normalizeDay(shiftDay),
          fromHour: fmtAPI(shiftFromTime),
          toHour: fmtAPI(shiftToTime),
          ptId: UserId,
        }),
      });
      console.log("Add Shift Body:", {
        day: normalizeDay(shiftDay),
        fromHour: fmtAPI(shiftFromTime),
        toHour: fmtAPI(shiftToTime),
        ptId: UserId,
      });
      if (!res.ok) throw new Error(`${res.status}`);
      closeAddModal();
      fetchPTs();
      Alert.alert(T.alerts.success, T.alerts.shiftAdded);
    } catch (e: any) {
      Alert.alert(T.alerts.error, e.message);
    } finally {
      setAddingShift(false);
    }
  };

  const openEditModal = (pt: any, wd: any) => {
    setSelectedPT(pt);
    setEditingWD(wd);
    setEditShiftDay(wd.day.toLowerCase());
    setEditFromTime(parseTime(wd.fromHour));
    setEditToTime(parseTime(wd.toHour));
    setShowEditShiftModal(true);
  };
  const closeEditModal = () => {
    setShowEditShiftModal(false);
    setEditingWD(null);
    setEditShiftDay("");
  };

  const editWorkShift = async () => {
    if (!editShiftDay || !selectedPT || !editingWD) {
      Alert.alert(T.alerts.error, T.alerts.noDay);
      return;
    }
    setEditingShift(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert(T.alerts.error, T.alerts.noToken);
        return;
      }
      const res = await fetch(
        `https://gym.useitsmart.com/api/PTWorkShifts/${editingWD.workshiftId}`,
        {
          method: "PUT",
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            day: normalizeDay(editShiftDay),
            fromHour: fmtAPI2(editFromTime),
            toHour: fmtAPI2(editToTime),
            ptId: selectedPT.ptId,
          }),
        },
      );
      if (!res.ok) throw new Error(`${res.status}`);
      closeEditModal();
      fetchPTs();
      Alert.alert(T.alerts.success, T.alerts.shiftUpdated);
    } catch (e: any) {
      Alert.alert(T.alerts.error, e.message);
    } finally {
      setEditingShift(false);
    }
  };

  const openDeleteModal = (pt: any, wd: any) => {
    setSelectedPT(pt);
    setShiftToDelete(wd);
    setShowDeleteModal(true);
  };
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setShiftToDelete(null);
  };
  const getDayLabel = (dayKey: string) => {
    return (
      daysOfWeek.find((d) => d.key === dayKey?.toLowerCase())?.label || dayKey
    );
  };
  const deleteWorkShift = async () => {
    if (!shiftToDelete || !selectedPT) return;
    setDeletingShift(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert(T.alerts.error, T.alerts.noToken);
        closeDeleteModal();
        return;
      }
      const res = await fetch(
        `https://gym.useitsmart.com/api/PTWorkShifts/${shiftToDelete.workshiftId}`,
        {
          method: "DELETE",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok && res.status !== 204) throw new Error(`${res.status}`);
      Alert.alert(T.alerts.success, T.alerts.shiftDeleted, [
        {
          text: "OK",
          onPress: () => {
            closeDeleteModal();
            fetchPTs();
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert(T.alerts.error, e.message);
    } finally {
      setDeletingShift(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: any) => (
      <View
        style={[
          S.card,
          dark && { backgroundColor: "#111111", borderColor: "#222222" },
        ]}
      >
        {/* PT header */}
        <View style={[S.cardPtRow, dir(isRTL)]}>
          {item?.photoUrlPt ? (
            <Image source={{ uri: item.photoUrlPt }} style={S.cardPtImg} />
          ) : (
            <View style={S.cardPtImgPlaceholder}>
              <Icon name="person" size={36} color="#FFF" />
            </View>
          )}
          <View style={[{ flex: 1 }, aEnd(isRTL), ml(isRTL, 14)]}>
            <Text
              style={[S.cardPtName, ta(isRTL), dark && { color: "#EEEEEE" }]}
            >
              {item?.namePt ?? "PT Name"}
            </Text>
            <View
              style={[
                dir(isRTL),
                { alignItems: "center", gap: 6, marginTop: 4 },
              ]}
            >
              <Icon name="business" size={14} color="#10B981" />
              <Text
                style={[S.cardPtSub, ta(isRTL), dark && { color: "#888888" }]}
              >
                {T.ptInfo.gymId}: {item.gymId}
              </Text>
            </View>
          </View>
        </View>

        {/* Work Schedule */}
        <View style={S.section}>
          <View
            style={[
              S.sectionHeader,
              dir(isRTL),
              { flexDirection: isAr ? "row-reverse" : "row" },
            ]}
          >
            <View
              style={[
                dir(isRTL),
                {
                  alignItems: "center",
                  gap: 8,
                  flexDirection: isAr ? "row-reverse" : "row",
                },
              ]}
            >
              <Icon name="time-outline" size={20} color="#3B82F6" />
              <Text
                style={[
                  S.sectionTitle,
                  ta(isRTL),
                  dark && { color: "#EEEEEE" },
                ]}
              >
                {T.workSchedule.title}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                S.addShiftBtn,
                dir(isRTL),
                dark && { backgroundColor: "#0044FF15" },
              ]}
              onPress={() => openAddModal(item)}
            >
              <Icon name="add-circle" size={20} color="#3B82F6" />
              <Text style={S.addShiftBtnTxt}>{T.workSchedule.addShift}</Text>
            </TouchableOpacity>
          </View>

          {item.workDays && item.workDays.length > 0 ? (
            <View style={{ gap: 10 }}>
              {item.workDays
                .filter((wd: any) => wd.fromHour && wd.toHour)
                .map((wd: any, i: number) => (
                  <View
                    key={i}
                    style={[
                      S.shiftRow,
                      dir(isRTL),
                      dark && {
                        backgroundColor: "#000000",
                        borderColor: "#222222",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        S.shiftCircle,
                        dark && { backgroundColor: "#001133" },
                      ]}
                      onPress={() => openEditModal(item, wd)}
                    >
                      <Text style={S.shiftCircleTxt}>
                        {cap(wd.day).substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[{ flex: 1 }, aEnd(isRTL), ml(isRTL, 14)]}
                      onPress={() => openEditModal(item, wd)}
                    >
                      <Text
                        style={[
                          S.shiftDayName,
                          ta(isRTL),
                          dark && { color: "#EEEEEE" },
                        ]}
                      >
                        {getDayLabel(wd.day)}
                      </Text>
                      <Text
                        style={[
                          S.shiftTime,
                          ta(isRTL),
                          dark && { color: "#888888" },
                        ]}
                      >
                        {formatTime(wd.fromHour)} - {formatTime(wd.toHour)}
                      </Text>
                      <Text style={[S.shiftId, ta(isRTL)]}>
                        {T.modals.deleteShift.shiftId} {wd.workshiftId}
                      </Text>
                    </TouchableOpacity>
                    <View style={[dir(isRTL), { gap: 8 }]}>
                      <TouchableOpacity
                        style={[
                          S.editIconBtn,
                          dark && {
                            backgroundColor: "#001133",
                            borderColor: "#003399",
                          },
                        ]}
                        onPress={() => openEditModal(item, wd)}
                      >
                        <Icon name="create-outline" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          S.delIconBtn,
                          dark && {
                            backgroundColor: "#220000",
                            borderColor: "#550000",
                          },
                        ]}
                        onPress={() => openDeleteModal(item, wd)}
                      >
                        <Icon name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          ) : (
            <View style={S.emptySection}>
              <Icon name="time-outline" size={44} color="#555555" />
              <Text
                style={[
                  S.emptySectionTitle,
                  ta(isRTL),
                  dark && { color: "#888888" },
                ]}
              >
                {T.workSchedule.noSchedule}
              </Text>
              <Text
                style={[
                  S.emptySectionTxt,
                  ta(isRTL),
                  dark && { color: "#555555" },
                ]}
              >
                {T.workSchedule.noScheduleText}
              </Text>
              <TouchableOpacity
                style={[S.addFirstBtn, dir(isRTL)]}
                onPress={() => openAddModal(item)}
              >
                <Icon name="add" size={18} color="#FFF" />
                <Text style={S.addFirstBtnTxt}>
                  {T.workSchedule.addFirstShift}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Booked Classes */}
        <View style={S.section}>
          <View
            style={[
              S.sectionHeader,
              dir(isRTL),
              {
                justifyContent: "flex-start",
                gap: 8,
                flexDirection: isAr ? "row-reverse" : "row",
              },
            ]}
          >
            <Icon name="people-outline" size={20} color="#6366F1" />
            <Text
              style={[S.sectionTitle, ta(isRTL), dark && { color: "#EEEEEE" }]}
            >
              {T.bookedClasses.title}
            </Text>
          </View>
          {item.ptMyClass?.length > 0 ? (
            <View style={{ gap: 10 }}>
              {item.ptMyClass.map((cls: any, i: number) => (
                <View
                  key={i}
                  style={[
                    S.shiftRow,
                    dir(isRTL),
                    dark && {
                      backgroundColor: "#000000",
                      borderColor: "#222222",
                    },
                  ]}
                >
                  <View
                    style={[
                      S.shiftCircle,
                      dark && { backgroundColor: "#110022" },
                    ]}
                  >
                    <Icon name="person" size={16} color="#6366F1" />
                  </View>
                  <View style={[{ flex: 1 }, aEnd(isRTL), ml(isRTL, 14)]}>
                    <Text
                      style={[
                        S.shiftDayName,
                        ta(isRTL),
                        dark && { color: "#EEEEEE" },
                      ]}
                    >
                      {cls.userName}
                    </Text>
                    <Text
                      style={[
                        S.shiftTime,
                        ta(isRTL),
                        dark && { color: "#888888" },
                      ]}
                    >
                      {cap(cls.day)} · {formatTime(cls.from)} -{" "}
                      {formatTime(cls.to)}
                    </Text>
                  </View>
                  <Icon name="lock-closed" size={16} color="#EF4444" />
                </View>
              ))}
            </View>
          ) : (
            <View style={S.emptySection}>
              <Icon name="calendar-outline" size={36} color="#555555" />
              <Text
                style={[
                  S.emptySectionTitle,
                  ta(isRTL),
                  dark && { color: "#888888" },
                ]}
              >
                {T.bookedClasses.noClasses}
              </Text>
              <Text
                style={[
                  S.emptySectionTxt,
                  ta(isRTL),
                  dark && { color: "#555555" },
                ]}
              >
                {T.bookedClasses.noClassesText}
              </Text>
            </View>
          )}
        </View>
      </View>
    ),
    [isRTL, isAr, T, formatTime, dark],
  );

  return (
    <View style={[S.screen, dark && { backgroundColor: "#000000" }]}>
      {/* Top bar */}
      <View
        style={[
          S.topBar,
          dir(isRTL),
          dark && { backgroundColor: "#111111", borderBottomColor: "#222222" },
        ]}
      >
        <Text style={[S.screenTitle, ta(isRTL), dark && { color: "#EEEEEE" }]}>
          {T.dashboard.title}
        </Text>
      </View>

      {loading && (
        <View style={S.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[S.loadingTxt, ta(isRTL), dark && { color: "#888888" }]}>
            {T.dashboard.loading}
          </Text>
        </View>
      )}

      {!!error && (
        <View style={S.center}>
          <Icon name="alert-circle-outline" size={46} color="#EF4444" />
          <Text style={[S.errorTitle, ta(isRTL)]}>
            {T.dashboard.error.title}
          </Text>
          <Text style={[S.errorTxt, ta(isRTL)]}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchPTs}>
            <Text style={S.retryBtnTxt}>{T.dashboard.tryAgain}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && ptData.length === 0 && (
        <View style={S.center}>
          <Icon name="people-outline" size={60} color="#555555" />
          <Text style={[S.emptyTitle, ta(isRTL), dark && { color: "#EEEEEE" }]}>
            {T.dashboard.noPTs}
          </Text>
          <Text
            style={[S.emptySubtitle, ta(isRTL), dark && { color: "#555555" }]}
          >
            {T.dashboard.noPTsSubtitle}
          </Text>
        </View>
      )}

      {!loading && !error && ptData.length > 0 && (
        <FlatList
          data={ptData}
          keyExtractor={(item) => item.ptId.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        />
      )}

      {/* ── ADD SHIFT MODAL ── */}
      <Modal
        animationType="slide"
        transparent
        visible={showAddShiftModal}
        onRequestClose={closeAddModal}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalBox, dark && { backgroundColor: "#111111" }]}>
            <LinearGradient
              colors={["#3B82F6", "#1D4ED8"]}
              style={S.modalGradient}
            >
              <View
                style={[
                  S.modalHdr,
                  dir(isRTL),
                  { flexDirection: isAr ? "row-reverse" : "row" },
                ]}
              >
                <TouchableOpacity style={S.closeBtn} onPress={closeAddModal}>
                  <Icon name="close" size={20} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      S.modalTitle,
                      { textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {T.modals.addShift.title}
                  </Text>
                  <Text
                    style={[
                      S.modalSubtitle,
                      { textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {T.modals.addShift.subtitle}
                  </Text>
                </View>
                <View style={{ width: 36 }} />
              </View>
            </LinearGradient>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <PtInfoCard
                selectedPT={selectedPT}
                ptIdLabel={T.ptInfo.ptId}
                gymIdLabel={T.ptInfo.gymId}
                isRTL={isRTL}
                dark={dark}
              />
              <View style={S.modalSection}>
                <SectionHeader
                  iconName="calendar"
                  title={T.modals.addShift.selectDay}
                  subtitle={T.modals.addShift.selectDayDesc}
                  isRTL={isRTL}
                  dark={dark}
                />
                <DayGrid
                  days={daysOfWeek}
                  selected={shiftDay}
                  onSelect={setShiftDay}
                  dark={dark}
                />
                {shiftDay && (
                  <View
                    style={[
                      S.selectedPreview,
                      dir(isRTL),
                      dark && { backgroundColor: "#001133" },
                    ]}
                  >
                    <Icon name="checkmark-circle" size={18} color="#10B981" />
                    <Text
                      style={[
                        S.selectedPreviewTxt,
                        { textAlign: isAr ? "right" : "left" },
                        dark && { color: "#AADDFF" },
                      ]}
                    >
                      {T.alerts.selected}:{" "}
                      <Text
                        style={{
                          fontWeight: "800",
                          color: dark ? "#99CCFF" : "#1E40AF",
                        }}
                      >
                        {daysOfWeek.find((d) => d.key === shiftDay)?.label}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
              <View style={S.modalSection}>
                <SectionHeader
                  iconName="time"
                  color="#EF4444"
                  title={T.modals.addShift.timeSlot}
                  subtitle={T.modals.addShift.timeSlotDesc}
                  isRTL={isRTL}
                  dark={dark}
                />
                <TimeRow
                  iconName="play"
                  iconColor="#3B82F6"
                  label={T.modals.addShift.startTime}
                  value={shiftFromTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  onPress={() => setShowFromTP(true)}
                  isRTL={isRTL}
                  dark={dark}
                />
                <TimeRow
                  iconName="stop"
                  iconColor="#EF4444"
                  label={T.modals.addShift.endTime}
                  value={shiftToTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  onPress={() => setShowToTP(true)}
                  isRTL={isRTL}
                  dark={dark}
                />
                <DurationCard
                  from={shiftFromTime}
                  to={shiftToTime}
                  color="#3B82F6"
                  label={T.modals.addShift.shiftDuration}
                  hoursLabel={T.modals.addShift.hours}
                  isRTL={isRTL}
                  dark={dark}
                />
              </View>
              <ActionBtns
                cancelLabel={T.modals.addShift.cancel}
                confirmLabel={T.modals.addShift.confirm}
                onCancel={closeAddModal}
                onConfirm={addWorkShift}
                loading={addingShift}
                isRTL={isRTL}
                dark={dark}
              />
            </ScrollView>
          </View>
        </View>
        <TimePicker
          visible={showFromTP}
          value={shiftFromTime}
          onChange={(_: any, d?: Date) => {
            setShowFromTP(false);
            if (d) setShiftFromTime(d);
          }}
          title={T.modals.addShift.startTime}
          colors={["#3B82F6", "#1D4ED8"]}
          cancelLabel={T.modals.addShift.cancel}
        />
        <TimePicker
          visible={showToTP}
          value={shiftToTime}
          onChange={(_: any, d?: Date) => {
            setShowToTP(false);
            if (d) setShiftToTime(d);
          }}
          title={T.modals.addShift.endTime}
          colors={["#EF4444", "#DC2626"]}
          cancelLabel={T.modals.addShift.cancel}
        />
      </Modal>

      {/* ── EDIT SHIFT MODAL ── */}
      <Modal
        animationType="slide"
        transparent
        visible={showEditShiftModal}
        onRequestClose={closeEditModal}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalBox, dark && { backgroundColor: "#111111" }]}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={S.modalGradient}
            >
              <View style={[S.modalHdr, dir(isRTL)]}>
                <TouchableOpacity style={S.closeBtn} onPress={closeEditModal}>
                  <Icon name="close" size={20} color="#FFF" />
                </TouchableOpacity>
                <View
                  style={{
                    marginRight: isAr ? 30 : 0,
                    flexDirection: isAr ? "row-reverse" : "row",
                    alignItems: isAr ? "flex-end" : "flex-start",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        S.modalTitle,
                        { textAlign: isAr ? "right" : "left" },
                      ]}
                    >
                      {T.modals.editShift.title}
                    </Text>
                    <Text
                      style={[
                        S.modalSubtitle,
                        { textAlign: isAr ? "right" : "left" },
                      ]}
                    >
                      {T.modals.editShift.subtitle} {editingWD?.workshiftId}
                    </Text>
                  </View>
                </View>
                <View style={{ width: 36 }} />
              </View>
            </LinearGradient>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <PtInfoCard
                selectedPT={selectedPT}
                ptIdLabel={T.ptInfo.ptId}
                gymIdLabel={T.ptInfo.gymId}
                isRTL={isRTL}
                dark={dark}
                extraContent={
                  <View
                    style={[
                      dir(isRTL),
                      { alignItems: "center", gap: 5, marginTop: 8 },
                    ]}
                  >
                    <Icon name="information-circle" size={14} color="#10B981" />
                    <Text style={[S.currentShiftTxt, ta(isRTL)]}>
                      {T.modals.editShift.current}: {cap(editingWD?.day)} ·{" "}
                      {formatTime(editingWD?.fromHour)} -{" "}
                      {formatTime(editingWD?.toHour)}
                    </Text>
                  </View>
                }
              />
              <View style={S.modalSection}>
                <SectionHeader
                  iconName="calendar"
                  color="#10B981"
                  title={T.modals.editShift.editDay}
                  subtitle={T.modals.editShift.editDayDesc}
                  isRTL={isRTL}
                  dark={dark}
                />
                <DayGrid
                  days={daysOfWeek}
                  selected={editShiftDay}
                  onSelect={setEditShiftDay}
                  dark={dark}
                />
                {editShiftDay && (
                  <View
                    style={[
                      S.selectedPreview,
                      dir(isRTL),
                      dark && { backgroundColor: "#001133" },
                    ]}
                  >
                    <Icon name="checkmark-circle" size={18} color="#10B981" />
                    <Text
                      style={[
                        S.selectedPreviewTxt,
                        ta(isRTL),
                        { textAlign: isAr ? "right" : "left" },
                        dark && { color: "#AADDFF" },
                      ]}
                    >
                      {T.alerts.selected}:{" "}
                      <Text
                        style={{
                          fontWeight: "800",
                          color: dark ? "#99CCFF" : "#1E40AF",
                        }}
                      >
                        {daysOfWeek.find((d) => d.key === editShiftDay)?.label}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
              <View style={S.modalSection}>
                <SectionHeader
                  iconName="time"
                  color="#F59E0B"
                  title={T.modals.editShift.editTimeSlot}
                  subtitle={T.modals.editShift.editTimeSlotDesc}
                  isRTL={isRTL}
                  dark={dark}
                />
                <TimeRow
                  iconName="play"
                  iconColor="#10B981"
                  label={T.modals.editShift.startTime}
                  value={editFromTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  onPress={() => setShowEditFromTP(true)}
                  isRTL={isRTL}
                  dark={dark}
                />
                <TimeRow
                  iconName="stop"
                  iconColor="#F59E0B"
                  label={T.modals.editShift.endTime}
                  value={editToTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                  onPress={() => setShowEditToTP(true)}
                  isRTL={isRTL}
                  dark={dark}
                />
                <DurationCard
                  from={editFromTime}
                  to={editToTime}
                  color="#10B981"
                  label={T.modals.editShift.newDuration}
                  hoursLabel={T.modals.editShift.hours}
                  isRTL={isRTL}
                  dark={dark}
                />
              </View>
              <ActionBtns
                cancelLabel={T.modals.editShift.cancel}
                confirmLabel={T.modals.editShift.update}
                onCancel={closeEditModal}
                onConfirm={editWorkShift}
                loading={editingShift}
                confirmBg="#10B981"
                cancelColor="#DC2626"
                cancelBg="#FEF2F2"
                cancelBorder="#FECACA"
                isRTL={isRTL}
                dark={dark}
              />
            </ScrollView>
          </View>
        </View>
        <TimePicker
          visible={showEditFromTP}
          value={editFromTime}
          onChange={(_: any, d?: Date) => {
            setShowEditFromTP(false);
            if (d) setEditFromTime(d);
          }}
          title={T.modals.editShift.startTime}
          colors={["#10B981", "#059669"]}
          cancelLabel={T.modals.editShift.cancel}
        />
        <TimePicker
          visible={showEditToTP}
          value={editToTime}
          onChange={(_: any, d?: Date) => {
            setShowEditToTP(false);
            if (d) setEditToTime(d);
          }}
          title={T.modals.editShift.endTime}
          colors={["#F59E0B", "#D97706"]}
          cancelLabel={T.modals.editShift.cancel}
        />
      </Modal>

      {/* ── DELETE MODAL ── */}
      <Modal
        animationType="fade"
        transparent
        visible={showDeleteModal}
        onRequestClose={closeDeleteModal}
      >
        <View style={S.deleteOverlay}>
          <View style={[S.deleteBox, dark && { backgroundColor: "#111111" }]}>
            <LinearGradient
              colors={["#EF4444", "#DC2626"]}
              style={S.modalGradient}
            >
              <View style={[S.modalHdr, dir(isRTL), { gap: 14 }]}>
                <View style={S.delAlertIcon}>
                  <Icon name="alert-circle" size={30} color="#FFF" />
                </View>
                <View style={[{ flex: 1 }, aEnd(isRTL)]}>
                  <Text style={[S.modalTitle, ta(isRTL)]}>
                    {T.modals.deleteShift.title}
                  </Text>
                  <Text style={[S.modalSubtitle, ta(isRTL)]}>
                    {T.modals.deleteShift.subtitle}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            <View style={{ padding: 20 }}>
              <View
                style={[
                  S.delPtRow,
                  dir(isRTL),
                  dark && { backgroundColor: "#220000" },
                ]}
              >
                {selectedPT?.photoUrlPt ? (
                  <Image
                    source={{ uri: selectedPT.photoUrlPt }}
                    style={S.delPtImg}
                  />
                ) : (
                  <View style={S.delPtImgPlaceholder}>
                    <Icon name="person" size={18} color="#FFF" />
                  </View>
                )}
                <View style={[{ flex: 1 }, aEnd(isRTL), ml(isRTL, 12)]}>
                  <Text
                    style={[
                      S.delPtName,
                      ta(isRTL),
                      dark && { color: "#EEEEEE" },
                    ]}
                  >
                    {selectedPT?.namePt}
                  </Text>
                  <View style={[dir("ltr"), S.delPtBadge]}>
                    <Icon name="finger-print" size={11} color="#FFF" />
                    <Text style={S.badgeTxt}>
                      {T.ptInfo.ptId}: {selectedPT?.ptId}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  S.delDetailsCard,
                  dark && {
                    backgroundColor: "#000000",
                    borderColor: "#222222",
                  },
                ]}
              >
                <View
                  style={[
                    dir(isRTL),
                    { alignItems: "center", gap: 8, marginBottom: 14 },
                  ]}
                >
                  <Icon name="time" size={18} color="#EF4444" />
                  <Text
                    style={[
                      S.delDetailsTitle,
                      ta(isRTL),
                      dark && { color: "#EEEEEE" },
                    ]}
                  >
                    {T.modals.deleteShift.shiftDetails}
                  </Text>
                </View>
                {[
                  {
                    icon: "calendar",
                    label: T.modals.deleteShift.day,
                    value: cap(shiftToDelete?.day),
                  },
                  {
                    icon: "play",
                    label: T.modals.deleteShift.from,
                    value: formatTime(shiftToDelete?.fromHour),
                  },
                  {
                    icon: "stop",
                    label: T.modals.deleteShift.to,
                    value: formatTime(shiftToDelete?.toHour),
                  },
                  {
                    icon: "key",
                    label: T.modals.deleteShift.shiftId,
                    value: shiftToDelete?.workshiftId,
                  },
                ].map(({ icon, label, value }, i) => (
                  <View
                    key={i}
                    style={[
                      S.delDetailRow,
                      dir(isRTL),
                      dark && { borderBottomColor: "#222222" },
                    ]}
                  >
                    <View
                      style={[
                        S.delDetailIcon,
                        dark && { backgroundColor: "#111111" },
                      ]}
                    >
                      <Icon name={icon as any} size={14} color="#888888" />
                    </View>
                    <Text
                      style={[
                        S.delDetailLabel,
                        ta(isRTL),
                        dark && { color: "#888888" },
                      ]}
                    >
                      {label}
                    </Text>
                    <Text
                      style={[
                        S.delDetailValue,
                        ta(isRTL),
                        dark && { color: "#EEEEEE" },
                      ]}
                    >
                      {value}
                    </Text>
                  </View>
                ))}
              </View>
              <View
                style={[
                  S.warning,
                  dir(isRTL),
                  dark && { backgroundColor: "#220000" },
                ]}
              >
                <Icon name="warning" size={18} color="#EF4444" />
                <Text style={[S.warningTxt, ta(isRTL)]}>
                  {T.modals.deleteShift.warning}
                </Text>
              </View>
              <View style={[S.actionRow, dir(isRTL)]}>
                <TouchableOpacity
                  style={[
                    S.actionCancel,
                    dark && {
                      backgroundColor: "#111111",
                      borderColor: "#222222",
                    },
                  ]}
                  onPress={closeDeleteModal}
                  disabled={deletingShift}
                >
                  <Icon
                    name="close-circle"
                    size={16}
                    color={dark ? "#888888" : "#64748B"}
                  />
                  <Text
                    style={[S.actionCancelTxt, dark && { color: "#888888" }]}
                  >
                    {T.modals.deleteShift.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    S.actionConfirm,
                    { backgroundColor: "#EF4444" },
                    deletingShift && { opacity: 0.6 },
                  ]}
                  onPress={deleteWorkShift}
                  disabled={deletingShift}
                >
                  {deletingShift ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Icon name="trash" size={16} color="#FFF" />
                      <Text style={S.actionConfirmTxt}>
                        {T.modals.deleteShift.delete}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PTDashboardScreen;

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 36,
  },
  topBar: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -1,
  },
  langBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
  },
  langBtnTxt: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  loadingTxt: {
    marginTop: 14,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 18,
    textAlign: "center",
  },
  errorTxt: {
    fontSize: 15,
    color: "#7F1D1D",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 11,
  },
  retryBtnTxt: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardPtRow: { marginBottom: 20, alignItems: "center" },
  cardPtImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#3B82F6",
  },
  cardPtImgPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  cardPtName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.4,
  },
  cardPtSub: { fontSize: 13, color: "#475569", fontWeight: "500" },
  section: { marginBottom: 22 },
  sectionHeader: {
    justifyContent: "space-between",
    marginBottom: 14,
    alignItems: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  addShiftBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
    alignItems: "center",
  },
  addShiftBtnTxt: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
  shiftRow: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  shiftCircle: {
    width: 46,
    height: 46,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  shiftCircleTxt: { fontSize: 13, fontWeight: "700", color: "#3B82F6" },
  shiftDayName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  shiftTime: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 3,
  },
  shiftId: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
  editIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  delIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  emptySection: { alignItems: "center", paddingVertical: 28 },
  emptySectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    marginTop: 14,
  },
  emptySectionTxt: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 3,
    textAlign: "center",
    marginBottom: 18,
  },
  addFirstBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: "center",
    gap: 6,
  },
  addFirstBtnTxt: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  langMenu: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 6,
    width: 190,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  langOpt: {
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  langOptTxt: { fontSize: 15, fontWeight: "500", color: "#1F2937" },
  langDivider: { height: 1, backgroundColor: "#E5E7EB", marginHorizontal: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  modalBox: {
    width: "100%",
    maxWidth: 500,
    maxHeight: SH * 0.85,
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  modalGradient: { paddingHorizontal: 18, paddingVertical: 16 },
  modalHdr: { justifyContent: "space-between", alignItems: "center" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 3,
  },
  modalSubtitle: { fontSize: 12, color: "rgba(255,255,255,.9)" },
  modalScroll: { paddingBottom: 28 },
  modalSection: { marginTop: 14, paddingHorizontal: 18 },
  modalSectionHeader: { alignItems: "center", marginBottom: 14, gap: 10 },
  sectionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  modalSectionDesc: { fontSize: 12, color: "#64748B", lineHeight: 17 },
  ptInfoSection: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 8 },
  ptInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  ptInfoImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E2E8F0",
  },
  ptInfoImgPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  ptInfoName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 5,
  },
  currentShiftTxt: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: "center",
    gap: 4,
  },
  badgeTxt: { fontSize: 10, color: "#FFF", fontWeight: "600" },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  dayCard: {
    width: (SW - 80) / 4,
    aspectRatio: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 6,
  },
  dayCardSelected: { backgroundColor: "#3B82F6", borderColor: "#2563EB" },
  dayCardAbbr: {
    fontSize: 17,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 3,
  },
  dayCardAbbrSel: { color: "#FFF" },
  dayCardName: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
  dayCardNameSel: { color: "#FFF" },
  dayCheck: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedPreview: {
    backgroundColor: "#F0F9FF",
    padding: 11,
    borderRadius: 11,
    alignItems: "center",
    gap: 8,
  },
  selectedPreviewTxt: {
    fontSize: 13,
    color: "#0369A1",
    fontWeight: "600",
    flex: 1,
  },
  timeInputWrapper: { gap: 6, marginBottom: 12 },
  timeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  timeLabel: { fontSize: 13, fontWeight: "600", color: "#475569" },
  timeBtn: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  timeBtnValue: { fontSize: 15, fontWeight: "600", color: "#1E293B" },
  durationCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 11,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginTop: 6,
    alignItems: "center",
  },
  durationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center",
  },
  durationLabel: { fontSize: 13, color: "#0369A1", marginBottom: 2 },
  durationValue: { fontSize: 19, fontWeight: "800", color: "#1E40AF" },
  actionRow: {
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  actionCancel: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 11,
    paddingVertical: 13,
  },
  actionCancelTxt: { fontSize: 14, fontWeight: "600" },
  actionConfirm: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    borderRadius: 11,
    paddingVertical: 13,
  },
  confirmIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionConfirmTxt: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  tpOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "flex-end",
  },
  tpContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  tpGradient: { paddingVertical: 14, paddingHorizontal: 18 },
  tpHeader: { alignItems: "center" },
  tpCancel: { fontSize: 15, color: "rgba(255,255,255,.9)", fontWeight: "500" },
  tpTitle: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  tpDone: { fontSize: 15, color: "#FFF", fontWeight: "700" },
  deleteOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  deleteBox: {
    width: "100%",
    maxWidth: 450,
    backgroundColor: "#FFF",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  delAlertIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  delPtRow: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    alignItems: "center",
  },
  delPtImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2E8F0",
  },
  delPtImgPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
  },
  delPtName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 5,
  },
  delPtBadge: {
    backgroundColor: "#EF4444",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    alignItems: "center",
    gap: 4,
  },
  delDetailsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  delDetailsTitle: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  delDetailRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    alignItems: "center",
    gap: 10,
  },
  delDetailIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  delDetailLabel: {
    flex: 1,
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  delDetailValue: { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  warning: {
    backgroundColor: "#FEF2F2",
    borderRadius: 11,
    padding: 14,
    marginBottom: 18,
    alignItems: "center",
    gap: 10,
  },
  warningTxt: {
    flex: 1,
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
    lineHeight: 19,
  },
});
