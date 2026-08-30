import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { handleGetToken } from "../helpers";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface ExerciseItem {
  id: number;
  muscleId: number;
  nameEn: string;
  nameAr: string;
}

interface MuscleItem {
  id: number;
  gymId: number;
  nameEn: string;
  nameAr: string;
  exercises: ExerciseItem[];
}

interface DayExercise {
  exerciseId: number;
  displayOrder: number;
}

interface DayMuscle {
  muscleId: number;
  displayOrder: number;
  exercises: DayExercise[];
}

// dayOfWeek follows JS Date.getDay() convention: 0 = Sunday ... 6 = Saturday
interface PlanDay {
  dayOfWeek: number;
  isRestDay: boolean;
  displayOrder: number;
  note: string;
  muscles: DayMuscle[];
}

interface WorkoutTemplate {
  id?: number;
  gymId?: number;
  nameEn: string;
  nameAr: string;
  note: string;
  days: PlanDay[];
}

interface PTMember {
  memberShipId: number;
  membershipName: string;
  photoUrl?: string;
  // Not confirmed to exist on GetAllUserForPT — read opportunistically if
  // present. The history endpoint proved a member's real gym can differ
  // from the GYM_ID constant (member 81 → gymId 10, while templates live
  // under gymId 3), so any per-member gymId we can get beats the constant.
  gymId?: number;
}

// Real shape confirmed from GET
// /workout-plans/member-schedules/member/{id}/history?gymId=...
interface MemberScheduleHistoryItem {
  id: number;
  gymId: number;
  memberShipId: number;
  memberUserId: number;
  memberNameEn: string;
  memberNameAr: string;
  planType: string;
  sourceTemplateId?: number;
  sourceTemplateNameEn?: string;
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
  scheduleStatus: string; // seen: "Current", "Next" — likely also "Past"/"Completed"
}

// GUESS — extends the confirmed history shape with a day-by-day breakdown,
// on the assumption that GET member-schedules/{id} returns the same `days`
// shape used to create the schedule (PlanDay[]). Optional because we haven't
// confirmed it's actually present; ScheduleDetailsModal falls back to just
// the meta info if `days` is missing.
interface MemberScheduleDetails extends MemberScheduleHistoryItem {
  days?: PlanDay[];
}

interface FromTemplatePayload {
  memberShipId: number;
  templateId: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;
  note: string;
  replaceOverlappingSchedule: boolean;
}

interface CustomSchedulePayload {
  memberShipId: number;
  nameEn: string;
  nameAr: string;
  note: string;
  startDate: string;
  endDate: string;
  replaceOverlappingSchedule: boolean;
  days: PlanDay[];
}

const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const buildEmptyDays = (): PlanDay[] =>
  Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    isRestDay: true,
    displayOrder: i + 1,
    note: "",
    muscles: [],
  }));

// Strips muscles from any day flagged as rest before sending to the API,
// so stale muscle picks left over from toggling the switch never leak out.
const sanitizeDaysForSubmit = (days: PlanDay[]): PlanDay[] =>
  days.map((d) => ({
    ...d,
    muscles: d.isRestDay
      ? []
      : d.muscles
          .filter((m) => m.muscleId && m.exercises.length > 0)
          .map((m, mi) => ({
            ...m,
            displayOrder: mi + 1,
            exercises: m.exercises.map((e, ei) => ({
              ...e,
              displayOrder: ei + 1,
            })),
          })),
  }));

// A training (non-rest) day must have at least one muscle with one exercise.
const validateDays = (
  days: PlanDay[],
): { valid: boolean; invalidDayOfWeek?: number } => {
  for (const d of days) {
    if (d.isRestDay) continue;
    const hasExercise = d.muscles.some(
      (m) => m.muscleId && m.exercises.length > 0,
    );
    if (!hasExercise) return { valid: false, invalidDayOfWeek: d.dayOfWeek };
  }
  return { valid: true };
};

// ═══════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════

const BASE_URL = "http://192.168.1.16/api";

const getCleanToken = async (): Promise<string | null> => {
  const token = await handleGetToken();
  if (!token) return null;
  return token.startsWith("Bearer ") ? token.replace("Bearer ", "") : token;
};

// This app build serves one specific gym, matching the existing pattern in
// your codebase (e.g. the old `getallMuscles?gymsId=3` call was a hardcoded
// literal too, not fetched at runtime). Confirmed via your working
// `/workout-plans/templates/20?gymId=3` call — this is the real gym id.
const GYM_ID = 3;

async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getCleanToken();
  if (!token) throw new Error("NO_TOKEN");
  return fetch(url, {
    ...options,
    headers: {
      accept: "text/plain",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

async function throwIfNotOk(res: Response) {
  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
}

const fetchWorkoutLibrary = async (gymId: number): Promise<MuscleItem[]> => {
  const res = await authFetch(`${BASE_URL}/workout-library?gymId=${gymId}`);
  await throwIfNotOk(res);
  const data = await res.json();
  return Array.isArray(data?.muscles) ? data.muscles : [];
};

const fetchTemplates = async (gymId: number): Promise<WorkoutTemplate[]> => {
  const res = await authFetch(
    `${BASE_URL}/workout-plans/templates?gymId=${gymId}`,
  );
  await throwIfNotOk(res);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const fetchTemplateById = async (
  gymId: number,
  templateId: number,
): Promise<WorkoutTemplate> => {
  const res = await authFetch(
    `${BASE_URL}/workout-plans/templates/${templateId}?gymId=${gymId}`,
  );
  await throwIfNotOk(res);
  return res.json();
};

// Confirmed response shape: array of MemberScheduleHistoryItem (see above).
const fetchMemberScheduleHistory = async (
  gymId: number,
  memberShipId: number,
): Promise<MemberScheduleHistoryItem[]> => {
  const res = await authFetch(
    `${BASE_URL}/workout-plans/member-schedules/member/${memberShipId}/history?gymId=${gymId}`,
  );
  await throwIfNotOk(res);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

// GUESS — no curl/sample was given for this one. Mirrors the confirmed
// `templates/{id}?gymId=` pattern, and each history item already carries
// its own gymId, so the caller just passes that straight through. Logs the
// raw response so you can verify the field names (especially whether it
// really includes a `days` breakdown) and adjust MemberScheduleDetails /
// ScheduleDetailsModal below if the real shape differs.
const fetchMemberScheduleById = async (
  gymId: number,
  scheduleId: number,
): Promise<MemberScheduleDetails> => {
  const res = await authFetch(
    `${BASE_URL}/workout-plans/member-schedules/${scheduleId}?gymId=${gymId}`,
  );
  await throwIfNotOk(res);
  const data = await res.json();
  console.log("[ScheduleDetails] raw response:", JSON.stringify(data));
  return data;
};

// Endpoint verified for reads only (GET). Create assumed to be a POST to the
// same resource — flip the method below if the backend expects a different
// route once you confirm it.
const createTemplate = async (gymId: number, payload: WorkoutTemplate) => {
  const res = await authFetch(
    `${BASE_URL}/workout-plans/templates?gymId=${gymId}`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  await throwIfNotOk(res);
  return res.json().catch(() => ({}));
};

const createScheduleFromTemplate = async (
  gymId: number,
  payload: FromTemplatePayload,
) => {
  const res = await authFetch(
    `${BASE_URL}/workout-plans/member-schedules/from-template?gymId=${gymId}`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  await throwIfNotOk(res);
  return res.json().catch(() => ({}));
};

const createCustomSchedule = async (
  gymId: number,
  payload: CustomSchedulePayload,
) => {
  const res = await authFetch(
    `${BASE_URL}/workout-plans/member-schedules/custom?gymId=${gymId}`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  await throwIfNotOk(res);
  return res.json().catch(() => ({}));
};

const fetchPTMembers = async (ptUserId: string): Promise<PTMember[]> => {
  const res = await authFetch(
    `${BASE_URL}/PT/GetAllUserForPT?userId=${ptUserId}`,
  );
  await throwIfNotOk(res);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const toApiDate = (d: Date) => d.toISOString().split("T")[0];

// Adds one calendar month (30/9 → 30/10), not a fixed 30-day offset.
// Guards against short-month rollover (e.g. Jan 31 + 1 month would
// otherwise land on Mar 3) by clamping to the last day of the target month.
const addOneMonth = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  if (d.getDate() !== day) d.setDate(0);
  return d;
};

// Android's native date dialog doesn't nest cleanly inside another RN
// <Modal>, which is a well-known source of crashes (including "Cannot
// convert undefined value to object") when the picker is rendered inline.
// The fix is to open it imperatively on Android and only render it inline
// (spinner) on iOS, where that problem doesn't occur.
const openAndroidDatePicker = (current: Date, onPicked: (d: Date) => void) => {
  DateTimePickerAndroid.open({
    value: current,
    mode: "date",
    onChange: (event, selected) => {
      if (event.type === "set" && selected) onPicked(selected);
    },
  });
};

// ═══════════════════════════════════════════════════════════════════════
// SelectModal — generic searchable picker (muscles / exercises / templates)
// ═══════════════════════════════════════════════════════════════════════

interface SelectItem {
  id: number | string;
  label: string;
  sublabel?: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  items: SelectItem[];
  selectedId?: number | string | null;
  onSelect: (item: SelectItem) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  emptyText?: string;
  dark: boolean;
  isRTL: boolean;
}

const SelectModal: React.FC<SelectModalProps> = ({
  visible,
  title,
  items,
  selectedId,
  onSelect,
  onClose,
  searchPlaceholder = "Search...",
  emptyText = "No results",
  dark,
  isRTL,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.sublabel || "").toLowerCase().includes(q),
    );
  }, [search, items]);

  const c = {
    overlay: "rgba(0,0,0,0.5)",
    bg: dark ? "#111111" : "#FFFFFF",
    border: dark ? "#222222" : "#EEEEEE",
    text: dark ? "#EEEEEE" : "#333333",
    sub: dark ? "#888888" : "#666666",
    inputBg: dark ? "#000000" : "#F1F1F1",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[S_SELECT.overlay, { backgroundColor: c.overlay }]}
        activeOpacity={1}
        onPress={() => {
          setSearch("");
          onClose();
        }}
      >
        <View style={[S_SELECT.container, { backgroundColor: c.bg }]}>
          <Text
            style={[
              S_SELECT.title,
              { color: c.text, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {title}
          </Text>
          <View style={[S_SELECT.searchWrap, { borderBottomColor: c.border }]}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={c.sub}
              style={[
                S_SELECT.searchInput,
                {
                  backgroundColor: c.inputBg,
                  color: c.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            />
          </View>
          <ScrollView
            style={S_SELECT.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    S_SELECT.item,
                    { borderBottomColor: c.border },
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                  onPress={() => {
                    setSearch("");
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        S_SELECT.itemText,
                        { color: c.text, textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {!!item.sublabel && (
                      <Text
                        style={[
                          S_SELECT.itemSub,
                          {
                            color: c.sub,
                            textAlign: isRTL ? "right" : "left",
                          },
                        ]}
                      >
                        {item.sublabel}
                      </Text>
                    )}
                  </View>
                  {selectedId === item.id && (
                    <Text style={S_SELECT.check}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[S_SELECT.empty, { color: c.sub }]}>
                {emptyText}
              </Text>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const S_SELECT = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "90%",
    maxHeight: 420,
    borderRadius: 14,
    paddingTop: 14,
    overflow: "hidden",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  scroll: { maxHeight: 340 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemText: { fontSize: 15, fontWeight: "500" },
  itemSub: { fontSize: 12, marginTop: 2 },
  check: { fontSize: 16, color: "#007AFF", fontWeight: "bold", marginLeft: 8 },
  empty: { textAlign: "center", padding: 20, fontSize: 14 },
});

// ═══════════════════════════════════════════════════════════════════════
// DaySchedulePlanner — shared 7-day (Sun–Sat) builder with rest-day switches
// ═══════════════════════════════════════════════════════════════════════

interface DaySchedulePlannerProps {
  days: PlanDay[];
  onChange: (days: PlanDay[]) => void;
  muscleLibrary: MuscleItem[];
  dark: boolean;
  isAr: boolean;
  isRTL: boolean;
}

const T_PLANNER = {
  en: {
    restDay: "Rest day",
    trainingDay: "Training day",
    dayNote: "Note for this day (optional)",
    addMuscle: "+ Add muscle",
    selectMuscle: "Select a muscle",
    selectMuscleTitle: "Select Muscle Group",
    selectExerciseTitle: "Select Exercise",
    addExercise: "+ Add exercise",
    noExercisesForMuscle: "No exercises found for this muscle",
  },
  ar: {
    restDay: "يوم راحة",
    trainingDay: "يوم تدريب",
    dayNote: "ملاحظة لهذا اليوم (اختياري)",
    addMuscle: "+ إضافة عضلة",
    selectMuscle: "اختر عضلة",
    selectMuscleTitle: "اختر مجموعة العضلات",
    selectExerciseTitle: "اختر التمرين",
    addExercise: "+ إضافة تمرين",
    noExercisesForMuscle: "لا توجد تمارين لهذه العضلة",
  },
};

const DaySchedulePlanner: React.FC<DaySchedulePlannerProps> = ({
  days,
  onChange,
  muscleLibrary,
  dark,
  isAr,
  isRTL,
}) => {
  const t = isAr ? T_PLANNER.ar : T_PLANNER.en;
  const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

  const [muscleModal, setMuscleModal] = useState<{
    dayIndex: number;
    muscleIndex: number;
  } | null>(null);
  const [exerciseModal, setExerciseModal] = useState<{
    dayIndex: number;
    muscleIndex: number;
  } | null>(null);

  const c = {
    card: dark ? "#111111" : "#FFFFFF",
    border: dark ? "#222222" : "#EEEEEE",
    text: dark ? "#EEEEEE" : "#333333",
    sub: dark ? "#888888" : "#666666",
    muted: dark ? "#555555" : "#999999",
    inputBg: dark ? "#000000" : "#F9F9F9",
    chipBg: dark ? "#1E293B" : "#E3F2FD",
    chipText: dark ? "#93C5FD" : "#1565C0",
    dashedBg: dark ? "#0A0A0A" : "#F8F9FA",
    danger: "#FF5252",
  };

  const updateDay = (dayIndex: number, patch: Partial<PlanDay>) => {
    if (!days[dayIndex]) return;
    const next = [...days];
    next[dayIndex] = { ...next[dayIndex], ...patch };
    onChange(next);
  };

  const toggleRestDay = (dayIndex: number, isRest: boolean) => {
    updateDay(dayIndex, { isRestDay: isRest });
  };

  const addMuscleBlock = (dayIndex: number) => {
    const day = days[dayIndex];
    if (!day) return;
    const next = [...days];
    next[dayIndex] = {
      ...day,
      muscles: [
        ...day.muscles,
        { muscleId: 0, displayOrder: day.muscles.length + 1, exercises: [] },
      ],
    };
    onChange(next);
  };

  const removeMuscleBlock = (dayIndex: number, muscleIndex: number) => {
    if (!days[dayIndex]) return;
    const next = [...days];
    next[dayIndex] = {
      ...next[dayIndex],
      muscles: next[dayIndex].muscles.filter((_, i) => i !== muscleIndex),
    };
    onChange(next);
  };

  const setMuscleForBlock = (
    dayIndex: number,
    muscleIndex: number,
    muscleId: number,
  ) => {
    if (!days[dayIndex] || !days[dayIndex].muscles[muscleIndex]) return;
    const next = [...days];
    const muscles = [...next[dayIndex].muscles];
    muscles[muscleIndex] = { ...muscles[muscleIndex], muscleId, exercises: [] };
    next[dayIndex] = { ...next[dayIndex], muscles };
    onChange(next);
  };

  const addExercise = (
    dayIndex: number,
    muscleIndex: number,
    exerciseId: number,
  ) => {
    if (!days[dayIndex] || !days[dayIndex].muscles[muscleIndex]) return;
    const next = [...days];
    const muscles = [...next[dayIndex].muscles];
    const block = muscles[muscleIndex];
    if (block.exercises.some((e) => e.exerciseId === exerciseId)) return;
    muscles[muscleIndex] = {
      ...block,
      exercises: [
        ...block.exercises,
        { exerciseId, displayOrder: block.exercises.length + 1 },
      ],
    };
    next[dayIndex] = { ...next[dayIndex], muscles };
    onChange(next);
  };

  const removeExercise = (
    dayIndex: number,
    muscleIndex: number,
    exerciseId: number,
  ) => {
    if (!days[dayIndex] || !days[dayIndex].muscles[muscleIndex]) return;
    const next = [...days];
    const muscles = [...next[dayIndex].muscles];
    muscles[muscleIndex] = {
      ...muscles[muscleIndex],
      exercises: muscles[muscleIndex].exercises.filter(
        (e) => e.exerciseId !== exerciseId,
      ),
    };
    next[dayIndex] = { ...next[dayIndex], muscles };
    onChange(next);
  };

  const muscleName = (id: number) =>
    muscleLibrary.find((m) => m.id === id)?.[isAr ? "nameAr" : "nameEn"] || "";

  const exerciseName = (muscleId: number, exId: number) =>
    (muscleLibrary.find((m) => m.id === muscleId)?.exercises || []).find(
      (e) => e.id === exId,
    )?.[isAr ? "nameAr" : "nameEn"] || "";

  const muscleItems: SelectItem[] = muscleLibrary.map((m) => ({
    id: m.id,
    label: isAr ? m.nameAr : m.nameEn,
  }));

  const activeMuscleForExerciseModal =
    exerciseModal !== null
      ? days[exerciseModal.dayIndex]?.muscles[exerciseModal.muscleIndex]
          ?.muscleId
      : null;

  const exerciseItems: SelectItem[] =
    activeMuscleForExerciseModal != null
      ? (
          muscleLibrary.find((m) => m.id === activeMuscleForExerciseModal)
            ?.exercises || ([] as ExerciseItem[])
        )
          .filter((e) => {
            if (exerciseModal === null) return true;
            const block =
              days[exerciseModal.dayIndex]?.muscles[exerciseModal.muscleIndex];
            return !block?.exercises.some((ex) => ex.exerciseId === e.id);
          })
          .map((e) => ({ id: e.id, label: isAr ? e.nameAr : e.nameEn }))
      : [];

  return (
    <View>
      {[...days]
        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
        .map((day) => {
          const dayIndex = days.findIndex((d) => d.dayOfWeek === day.dayOfWeek);
          return (
            <View
              key={day.dayOfWeek}
              style={[
                S_PLANNER.dayCard,
                { backgroundColor: c.card, borderColor: c.border },
              ]}
            >
              <View
                style={[
                  S_PLANNER.dayHeader,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Text
                  style={[
                    S_PLANNER.dayTitle,
                    { color: c.text, textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {dayNames[day.dayOfWeek]}
                </Text>
                <View
                  style={[
                    S_PLANNER.switchRow,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <Text style={{ color: c.sub, fontSize: 12 }}>
                    {day.isRestDay ? t.restDay : t.trainingDay}
                  </Text>
                  <Switch
                    value={day.isRestDay}
                    onValueChange={(v) => toggleRestDay(dayIndex, v)}
                    trackColor={{ false: "#4CAF50", true: c.muted }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {!day.isRestDay && (
                <>
                  <TextInput
                    value={day.note}
                    onChangeText={(text) => updateDay(dayIndex, { note: text })}
                    placeholder={t.dayNote}
                    placeholderTextColor={c.muted}
                    style={[
                      S_PLANNER.noteInput,
                      {
                        backgroundColor: c.inputBg,
                        borderColor: c.border,
                        color: c.text,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  />

                  {day.muscles.map((block, muscleIndex) => (
                    <View
                      key={muscleIndex}
                      style={[
                        S_PLANNER.muscleBlock,
                        { backgroundColor: c.dashedBg, borderColor: c.border },
                      ]}
                    >
                      <View
                        style={[
                          S_PLANNER.muscleBlockHeader,
                          isRTL && { flexDirection: "row-reverse" },
                        ]}
                      >
                        <TouchableOpacity
                          style={[
                            S_PLANNER.pickerBtn,
                            { borderColor: c.border, backgroundColor: c.card },
                          ]}
                          onPress={() =>
                            setMuscleModal({ dayIndex, muscleIndex })
                          }
                        >
                          <Text
                            style={{
                              color: block.muscleId ? c.text : c.muted,
                              textAlign: isRTL ? "right" : "left",
                            }}
                          >
                            {block.muscleId
                              ? muscleName(block.muscleId)
                              : t.selectMuscle}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            removeMuscleBlock(dayIndex, muscleIndex)
                          }
                        >
                          <Text style={{ color: c.danger, fontWeight: "700" }}>
                            ✕
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {!!block.muscleId && (
                        <>
                          <View style={S_PLANNER.chipsWrap}>
                            {block.exercises.map((ex) => (
                              <View
                                key={ex.exerciseId}
                                style={[
                                  S_PLANNER.chip,
                                  { backgroundColor: c.chipBg },
                                  isRTL && { flexDirection: "row-reverse" },
                                ]}
                              >
                                <Text
                                  style={[
                                    S_PLANNER.chipText,
                                    { color: c.chipText },
                                  ]}
                                >
                                  {exerciseName(block.muscleId, ex.exerciseId)}
                                </Text>
                                <TouchableOpacity
                                  onPress={() =>
                                    removeExercise(
                                      dayIndex,
                                      muscleIndex,
                                      ex.exerciseId,
                                    )
                                  }
                                >
                                  <Text
                                    style={[
                                      S_PLANNER.chipRemove,
                                      { color: c.chipText },
                                    ]}
                                  >
                                    {" "}
                                    ✕
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                          <TouchableOpacity
                            style={S_PLANNER.addExerciseBtn}
                            onPress={() =>
                              setExerciseModal({ dayIndex, muscleIndex })
                            }
                          >
                            <Text style={S_PLANNER.addExerciseText}>
                              {t.addExercise}
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  ))}

                  <TouchableOpacity
                    style={S_PLANNER.addMuscleBtn}
                    onPress={() => addMuscleBlock(dayIndex)}
                  >
                    <Text style={S_PLANNER.addMuscleText}>{t.addMuscle}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}

      <SelectModal
        visible={muscleModal !== null}
        title={t.selectMuscleTitle}
        items={muscleItems}
        selectedId={
          muscleModal !== null
            ? days[muscleModal.dayIndex]?.muscles[muscleModal.muscleIndex]
                ?.muscleId
            : null
        }
        onSelect={(item) => {
          if (muscleModal !== null) {
            setMuscleForBlock(
              muscleModal.dayIndex,
              muscleModal.muscleIndex,
              Number(item.id),
            );
          }
        }}
        onClose={() => setMuscleModal(null)}
        dark={dark}
        isRTL={isRTL}
      />

      <SelectModal
        visible={exerciseModal !== null}
        title={t.selectExerciseTitle}
        items={exerciseItems}
        onSelect={(item) => {
          if (exerciseModal !== null) {
            addExercise(
              exerciseModal.dayIndex,
              exerciseModal.muscleIndex,
              Number(item.id),
            );
          }
        }}
        onClose={() => setExerciseModal(null)}
        emptyText={t.noExercisesForMuscle}
        dark={dark}
        isRTL={isRTL}
      />
    </View>
  );
};

const S_PLANNER = StyleSheet.create({
  dayCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayTitle: { fontSize: 16, fontWeight: "700" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  muscleBlock: {
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
    padding: 10,
    marginBottom: 10,
  },
  muscleBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  pickerBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
  chipRemove: { fontSize: 12, fontWeight: "700" },
  addExerciseBtn: { marginTop: 8, alignSelf: "flex-start" },
  addExerciseText: { color: "#2196F3", fontSize: 13, fontWeight: "600" },
  addMuscleBtn: { alignSelf: "flex-start", marginTop: 2 },
  addMuscleText: { color: "#007AFF", fontSize: 14, fontWeight: "700" },
});

// ═══════════════════════════════════════════════════════════════════════
// CreateTemplateModal
// ═══════════════════════════════════════════════════════════════════════

interface CreateTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  dark: boolean;
  isAr: boolean;
  isRTL: boolean;
}

const T_TEMPLATE = {
  en: {
    title: "Create Template",
    nameEn: "Template name (English)",
    nameAr: "Template name (Arabic)",
    note: "Note",
    save: "Save Template",
    cancel: "Cancel",
    loadingLibrary: "Loading exercises...",
    validationTitle: "Missing exercises",
    validationBody: (day: string) =>
      `${day} is set as a training day but has no exercises. Add at least one exercise or switch it to a rest day.`,
    nameRequired: "Please enter the template name in English and Arabic.",
    saved: "Template created successfully!",
    saveFailed: "Failed to create template",
  },
  ar: {
    title: "إنشاء قالب",
    nameEn: "اسم القالب (إنجليزي)",
    nameAr: "اسم القالب (عربي)",
    note: "ملاحظة",
    save: "حفظ القالب",
    cancel: "إلغاء",
    loadingLibrary: "جاري تحميل التمارين...",
    validationTitle: "تمارين ناقصة",
    validationBody: (day: string) =>
      `${day} محدد كيوم تدريب لكن بدون تمارين. أضف تمريناً واحداً على الأقل أو حوّله ليوم راحة.`,
    nameRequired: "يرجى إدخال اسم القالب بالإنجليزية والعربية.",
    saved: "تم إنشاء القالب بنجاح!",
    saveFailed: "فشل إنشاء القالب",
  },
};

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  visible,
  onClose,
  onCreated,
  dark,
  isAr,
  isRTL,
}) => {
  const t = isAr ? T_TEMPLATE.ar : T_TEMPLATE.en;

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [note, setNote] = useState("");
  const [days, setDays] = useState(buildEmptyDays());
  const [muscleLibrary, setMuscleLibrary] = useState<MuscleItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        setLoadingLibrary(true);
        const gymId = GYM_ID;
        const muscles = await fetchWorkoutLibrary(gymId);
        setMuscleLibrary(muscles);
      } catch (err: any) {
        Alert.alert("Error", err?.message || "Failed to load exercises");
      } finally {
        setLoadingLibrary(false);
      }
    })();
  }, [visible]);

  const resetForm = () => {
    setNameEn("");
    setNameAr("");
    setNote("");
    setDays(buildEmptyDays());
  };

  const handleSave = async () => {
    if (!nameEn.trim() || !nameAr.trim()) {
      Alert.alert("Error", t.nameRequired);
      return;
    }
    const { valid, invalidDayOfWeek } = validateDays(days);
    if (!valid && invalidDayOfWeek !== undefined) {
      const dayName = (isAr ? DAY_NAMES_AR : DAY_NAMES_EN)[invalidDayOfWeek];
      Alert.alert(t.validationTitle, t.validationBody(dayName));
      return;
    }
    try {
      setSaving(true);
      const gymId = GYM_ID;
      await createTemplate(gymId, {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        note,
        days: sanitizeDaysForSubmit(days),
      });
      Alert.alert("Success", t.saved);
      resetForm();
      onCreated();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", `${t.saveFailed}: ${err?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  const c = {
    modalBg: dark ? "#111111" : "#FFFFFF",
    border: dark ? "#222222" : "#EEEEEE",
    text: dark ? "#EEEEEE" : "#333333",
    sub: dark ? "#888888" : "#666666",
    inputBg: dark ? "#000000" : "#F9F9F9",
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={S_TEMPLATE.overlay}>
        <View style={[S_TEMPLATE.content, { backgroundColor: c.modalBg }]}>
          <View style={[S_TEMPLATE.header, { borderBottomColor: c.border }]}>
            <Text
              style={[
                S_TEMPLATE.headerTitle,
                { color: c.text, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t.title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 22, color: c.sub }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={S_TEMPLATE.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              value={nameEn}
              onChangeText={setNameEn}
              placeholder={t.nameEn}
              placeholderTextColor={c.sub}
              style={[
                S_TEMPLATE.input,
                {
                  backgroundColor: c.inputBg,
                  borderColor: c.border,
                  color: c.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            />
            <TextInput
              value={nameAr}
              onChangeText={setNameAr}
              placeholder={t.nameAr}
              placeholderTextColor={c.sub}
              style={[
                S_TEMPLATE.input,
                {
                  backgroundColor: c.inputBg,
                  borderColor: c.border,
                  color: c.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t.note}
              placeholderTextColor={c.sub}
              style={[
                S_TEMPLATE.input,
                {
                  backgroundColor: c.inputBg,
                  borderColor: c.border,
                  color: c.text,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            />

            {loadingLibrary ? (
              <View style={S_TEMPLATE.loadingRow}>
                <ActivityIndicator />
                <Text style={{ color: c.sub, marginTop: 6 }}>
                  {t.loadingLibrary}
                </Text>
              </View>
            ) : (
              <DaySchedulePlanner
                days={days}
                onChange={setDays}
                muscleLibrary={muscleLibrary}
                dark={dark}
                isAr={isAr}
                isRTL={isRTL}
              />
            )}
          </ScrollView>

          <View style={[S_TEMPLATE.actions, { borderTopColor: c.border }]}>
            <TouchableOpacity
              style={[
                S_TEMPLATE.btn,
                S_TEMPLATE.cancelBtn,
                { backgroundColor: dark ? "#1E293B" : "#F0F0F0" },
              ]}
              onPress={onClose}
            >
              <Text style={{ color: c.sub, fontWeight: "600" }}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                S_TEMPLATE.btn,
                S_TEMPLATE.saveBtn,
                saving && S_TEMPLATE.disabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={S_TEMPLATE.saveBtnText}>{t.save}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const S_TEMPLATE = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { width: "92%", maxHeight: "88%", borderRadius: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 19, fontWeight: "700", flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 10 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  loadingRow: { alignItems: "center", paddingVertical: 30 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  cancelBtn: {},
  saveBtn: { backgroundColor: "#4CAF50" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.6 },
});

// ═══════════════════════════════════════════════════════════════════════
// TemplateDetailsModal — read-only view fetched from GET
// /workout-plans/templates/{id}?gymId=... when a template card is tapped
// ═══════════════════════════════════════════════════════════════════════

interface TemplateDetailsModalProps {
  visible: boolean;
  templateId: number | null;
  onClose: () => void;
  dark: boolean;
  isAr: boolean;
  isRTL: boolean;
}

const T_DETAILS = {
  en: {
    title: "Template Details",
    loading: "Loading template...",
    loadFailed: "Failed to load template",
    restDay: "Rest day",
    noExercises: "No exercises",
    close: "Close",
  },
  ar: {
    title: "تفاصيل القالب",
    loading: "جاري تحميل القالب...",
    loadFailed: "فشل تحميل القالب",
    restDay: "يوم راحة",
    noExercises: "لا توجد تمارين",
    close: "إغلاق",
  },
};

const TemplateDetailsModal: React.FC<TemplateDetailsModalProps> = ({
  visible,
  templateId,
  onClose,
  dark,
  isAr,
  isRTL,
}) => {
  const t = isAr ? T_DETAILS.ar : T_DETAILS.en;
  const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [muscleLibrary, setMuscleLibrary] = useState<MuscleItem[]>([]);

  useEffect(() => {
    if (!visible || templateId == null) return;
    (async () => {
      try {
        setLoading(true);
        setTemplate(null);
        const [tpl, muscles] = await Promise.all([
          fetchTemplateById(GYM_ID, templateId),
          fetchWorkoutLibrary(GYM_ID),
        ]);
        setTemplate(tpl);
        setMuscleLibrary(muscles);
      } catch (err: any) {
        Alert.alert("Error", `${t.loadFailed}: ${err?.message || ""}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, templateId]);

  const muscleName = (id: number) =>
    muscleLibrary.find((m) => m.id === id)?.[isAr ? "nameAr" : "nameEn"] ||
    `#${id}`;

  const exerciseName = (muscleId: number, exId: number) =>
    (muscleLibrary.find((m) => m.id === muscleId)?.exercises || []).find(
      (e) => e.id === exId,
    )?.[isAr ? "nameAr" : "nameEn"] || `#${exId}`;

  const c = {
    modalBg: dark ? "#111111" : "#FFFFFF",
    border: dark ? "#222222" : "#EEEEEE",
    text: dark ? "#EEEEEE" : "#333333",
    sub: dark ? "#888888" : "#666666",
    card: dark ? "#0A0A0A" : "#F8F9FA",
    chipBg: dark ? "#1E293B" : "#E3F2FD",
    chipText: dark ? "#93C5FD" : "#1565C0",
    chipRest: dark ? "#221100" : "#FFF3CD",
    chipRestText: dark ? "#FFCC44" : "#856404",
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={S_DETAILS.overlay}>
        <View style={[S_DETAILS.content, { backgroundColor: c.modalBg }]}>
          <View style={[S_DETAILS.header, { borderBottomColor: c.border }]}>
            <Text
              style={[
                S_DETAILS.headerTitle,
                { color: c.text, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {template ? (isAr ? template.nameAr : template.nameEn) : t.title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 22, color: c.sub }}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={S_DETAILS.loadingRow}>
              <ActivityIndicator />
              <Text style={{ color: c.sub, marginTop: 6 }}>{t.loading}</Text>
            </View>
          ) : !template ? (
            <View style={S_DETAILS.loadingRow}>
              <Text style={{ color: c.sub }}>{t.loadFailed}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={S_DETAILS.scrollContent}>
              {!!template.note && (
                <Text
                  style={{
                    color: c.sub,
                    marginBottom: 14,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {template.note}
                </Text>
              )}

              {[...template.days]
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                .map((day) => (
                  <View
                    key={day.dayOfWeek}
                    style={[
                      S_DETAILS.dayCard,
                      { backgroundColor: c.card, borderColor: c.border },
                    ]}
                  >
                    <View
                      style={[
                        S_DETAILS.dayHeader,
                        isRTL && { flexDirection: "row-reverse" },
                      ]}
                    >
                      <Text
                        style={[
                          S_DETAILS.dayTitle,
                          {
                            color: c.text,
                            textAlign: isRTL ? "right" : "left",
                          },
                        ]}
                      >
                        {dayNames[day.dayOfWeek]}
                      </Text>
                      {day.isRestDay && (
                        <View
                          style={[
                            S_DETAILS.restPill,
                            { backgroundColor: c.chipRest },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: c.chipRestText,
                            }}
                          >
                            {t.restDay}
                          </Text>
                        </View>
                      )}
                    </View>

                    {!day.isRestDay && (
                      <>
                        {!!day.note && (
                          <Text
                            style={{
                              color: c.sub,
                              fontSize: 13,
                              marginBottom: 8,
                              textAlign: isRTL ? "right" : "left",
                            }}
                          >
                            {day.note}
                          </Text>
                        )}
                        {day.muscles.length === 0 ? (
                          <Text style={{ color: c.sub, fontStyle: "italic" }}>
                            {t.noExercises}
                          </Text>
                        ) : (
                          day.muscles.map((block, i) => (
                            <View key={i} style={{ marginBottom: 8 }}>
                              <Text
                                style={{
                                  color: c.text,
                                  fontWeight: "600",
                                  marginBottom: 6,
                                  textAlign: isRTL ? "right" : "left",
                                }}
                              >
                                {muscleName(block.muscleId)}
                              </Text>
                              <View
                                style={[
                                  S_DETAILS.chipsWrap,
                                  isRTL && { flexDirection: "row-reverse" },
                                ]}
                              >
                                {block.exercises.map((ex) => (
                                  <View
                                    key={ex.exerciseId}
                                    style={[
                                      S_DETAILS.chip,
                                      { backgroundColor: c.chipBg },
                                    ]}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 12,
                                        fontWeight: "600",
                                        color: c.chipText,
                                      }}
                                    >
                                      {exerciseName(
                                        block.muscleId,
                                        ex.exerciseId,
                                      )}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          ))
                        )}
                      </>
                    )}
                  </View>
                ))}
            </ScrollView>
          )}

          <View style={[S_DETAILS.actions, { borderTopColor: c.border }]}>
            <TouchableOpacity
              style={[
                S_DETAILS.closeBtn,
                { backgroundColor: dark ? "#1E293B" : "#F0F0F0" },
              ]}
              onPress={onClose}
            >
              <Text style={{ color: c.sub, fontWeight: "600" }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const S_DETAILS = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { width: "92%", maxHeight: "85%", borderRadius: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 19, fontWeight: "700", flex: 1 },
  scrollContent: { padding: 18 },
  loadingRow: { alignItems: "center", paddingVertical: 40 },
  dayCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayTitle: { fontSize: 15, fontWeight: "700" },
  restPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  actions: { padding: 16, borderTopWidth: 1 },
  closeBtn: { padding: 14, borderRadius: 10, alignItems: "center" },
});

// ═══════════════════════════════════════════════════════════════════════
// MemberHistoryModal — GET /member-schedules/member/{id}/history?gymId=...
// ═══════════════════════════════════════════════════════════════════════

interface MemberHistoryModalProps {
  visible: boolean;
  member: PTMember | null;
  onClose: () => void;
  dark: boolean;
  isAr: boolean;
  isRTL: boolean;
}

const T_HISTORY = {
  en: {
    title: "Schedule History",
    loading: "Loading history...",
    loadFailed: "Failed to load history",
    empty: "No schedule history yet.",
    fromTemplate: "From template",
    custom: "Custom",
    cancelled: "Cancelled",
    assignedBy: "Assigned by",
    close: "Close",
  },
  ar: {
    title: "سجل الجداول",
    loading: "جاري تحميل السجل...",
    loadFailed: "فشل تحميل السجل",
    empty: "لا يوجد سجل جداول بعد.",
    fromTemplate: "من قالب",
    custom: "مخصص",
    cancelled: "ملغى",
    assignedBy: "بواسطة",
    close: "إغلاق",
  },
};

// scheduleStatus seen so far: "Current", "Next". Unknown values fall back to
// the neutral "default" color pair below instead of crashing on a missing key.
const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  Current: { en: "Current", ar: "الحالي" },
  Next: { en: "Upcoming", ar: "قادم" },
  Past: { en: "Past", ar: "سابق" },
  Completed: { en: "Completed", ar: "مكتمل" },
};

const formatDateOnly = (value: string): string =>
  typeof value === "string" ? value.slice(0, 10) : String(value);

const MemberHistoryModal: React.FC<MemberHistoryModalProps> = ({
  visible,
  member,
  onClose,
  dark,
  isAr,
  isRTL,
}) => {
  const t = isAr ? T_HISTORY.ar : T_HISTORY.en;

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<MemberScheduleHistoryItem[]>([]);
  const [detailsFor, setDetailsFor] = useState<{
    scheduleId: number;
    gymId: number;
  } | null>(null);

  useEffect(() => {
    if (!visible || !member) return;
    (async () => {
      try {
        setLoading(true);
        setHistory([]);
        // Prefer the member's own gymId when we have it — history has shown
        // a member's real gym can differ from the GYM_ID constant.
        const gymId = member.gymId ?? GYM_ID;
        const items = await fetchMemberScheduleHistory(
          gymId,
          member.memberShipId,
        );
        setHistory(items);
      } catch (err: any) {
        Alert.alert("Error", `${t.loadFailed}: ${err?.message || ""}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, member]);

  const c = {
    modalBg: dark ? "#111111" : "#FFFFFF",
    border: dark ? "#222222" : "#EEEEEE",
    text: dark ? "#EEEEEE" : "#333333",
    sub: dark ? "#888888" : "#666666",
    card: dark ? "#0A0A0A" : "#F8F9FA",
    templateBadgeBg: dark ? "#1E293B" : "#E3F2FD",
    templateBadgeText: dark ? "#93C5FD" : "#1565C0",
    currentBg: dark ? "#001100" : "#E8F5E9",
    currentText: dark ? "#66FF88" : "#2E7D32",
    nextBg: dark ? "#001133" : "#E3F2FD",
    nextText: dark ? "#66BBFF" : "#1565C0",
    defaultBg: dark ? "#1A1A1A" : "#EEEEEE",
    defaultText: dark ? "#AAAAAA" : "#555555",
    cancelledBg: dark ? "#220000" : "#FFEBEE",
    cancelledText: dark ? "#FF8888" : "#C62828",
  };

  const statusColors = (item: MemberScheduleHistoryItem) => {
    if (item.isCancelled) return { bg: c.cancelledBg, text: c.cancelledText };
    if (item.scheduleStatus === "Current")
      return { bg: c.currentBg, text: c.currentText };
    if (item.scheduleStatus === "Next")
      return { bg: c.nextBg, text: c.nextText };
    return { bg: c.defaultBg, text: c.defaultText };
  };

  const statusLabel = (item: MemberScheduleHistoryItem) => {
    if (item.isCancelled) return t.cancelled;
    const known = STATUS_LABELS[item.scheduleStatus];
    return known ? known[isAr ? "ar" : "en"] : item.scheduleStatus;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={S_HISTORY.overlay}>
        <View style={[S_HISTORY.content, { backgroundColor: c.modalBg }]}>
          <View style={[S_HISTORY.header, { borderBottomColor: c.border }]}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  S_HISTORY.headerTitle,
                  { color: c.text, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t.title}
              </Text>
              {!!member && (
                <Text
                  style={{
                    color: c.sub,
                    fontSize: 13,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {member.membershipName}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 22, color: c.sub }}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={S_HISTORY.loadingRow}>
              <ActivityIndicator />
              <Text style={{ color: c.sub, marginTop: 6 }}>{t.loading}</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={S_HISTORY.loadingRow}>
              <Text style={{ color: c.sub }}>{t.empty}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={S_HISTORY.scrollContent}>
              {[...history]
                .sort(
                  (a, b) =>
                    new Date(b.startDate).getTime() -
                    new Date(a.startDate).getTime(),
                )
                .map((item) => {
                  const status = statusColors(item);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.7}
                      onPress={() =>
                        setDetailsFor({
                          scheduleId: item.id,
                          gymId: item.gymId,
                        })
                      }
                      style={[
                        S_HISTORY.card,
                        { backgroundColor: c.card, borderColor: c.border },
                      ]}
                    >
                      <View
                        style={[
                          S_HISTORY.cardHeader,
                          isRTL && { flexDirection: "row-reverse" },
                        ]}
                      >
                        <Text
                          style={[
                            S_HISTORY.cardTitle,
                            {
                              color: c.text,
                              textAlign: isRTL ? "right" : "left",
                            },
                          ]}
                        >
                          {isAr ? item.nameAr : item.nameEn}
                        </Text>
                        <View
                          style={[
                            S_HISTORY.badge,
                            { backgroundColor: status.bg },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "700",
                              color: status.text,
                            }}
                          >
                            {statusLabel(item)}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          color: c.sub,
                          fontSize: 13,
                          marginTop: 4,
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        {formatDateOnly(item.startDate)} →{" "}
                        {formatDateOnly(item.endDate)}
                      </Text>

                      <View
                        style={[
                          S_HISTORY.metaRow,
                          isRTL && { flexDirection: "row-reverse" },
                        ]}
                      >
                        <View
                          style={[
                            S_HISTORY.sourceBadge,
                            { backgroundColor: c.templateBadgeBg },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "600",
                              color: c.templateBadgeText,
                            }}
                          >
                            {item.sourceTemplateId != null
                              ? `${t.fromTemplate}: ${item.sourceTemplateNameEn}`
                              : t.custom}
                          </Text>
                        </View>
                        <Text style={{ color: c.sub, fontSize: 11 }}>
                          {t.assignedBy}: {item.assignedByName}
                        </Text>
                      </View>

                      {!!item.note && (
                        <Text
                          style={{
                            color: c.sub,
                            fontSize: 13,
                            marginTop: 6,
                            textAlign: isRTL ? "right" : "left",
                          }}
                        >
                          {item.note}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          )}

          <View style={[S_HISTORY.actions, { borderTopColor: c.border }]}>
            <TouchableOpacity
              style={[
                S_HISTORY.closeBtn,
                { backgroundColor: dark ? "#1E293B" : "#F0F0F0" },
              ]}
              onPress={onClose}
            >
              <Text style={{ color: c.sub, fontWeight: "600" }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScheduleDetailsModal
        visible={detailsFor !== null}
        scheduleId={detailsFor?.scheduleId ?? null}
        gymId={detailsFor?.gymId ?? null}
        onClose={() => setDetailsFor(null)}
        dark={dark}
        isAr={isAr}
        isRTL={isRTL}
      />
    </Modal>
  );
};

const S_HISTORY = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { width: "92%", maxHeight: "85%", borderRadius: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 19, fontWeight: "700" },
  scrollContent: { padding: 18 },
  loadingRow: { alignItems: "center", paddingVertical: 40 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  actions: { padding: 16, borderTopWidth: 1 },
  closeBtn: { padding: 14, borderRadius: 10, alignItems: "center" },
});

// ═══════════════════════════════════════════════════════════════════════
// ScheduleDetailsModal — details for one history entry, including a
// day-by-day breakdown when the (unconfirmed) `days` field is present.
// Opened by tapping a card inside MemberHistoryModal.
// ═══════════════════════════════════════════════════════════════════════

interface ScheduleDetailsModalProps {
  visible: boolean;
  scheduleId: number | null;
  gymId: number | null;
  dark: boolean;
  isAr: boolean;
  isRTL: boolean;
  onClose: () => void;
}

const T_SCHED_DETAILS = {
  en: {
    title: "Schedule Details",
    loading: "Loading schedule...",
    loadFailed: "Failed to load schedule",
    restDay: "Rest day",
    noExercises: "No exercises",
    noBreakdown: "No day-by-day breakdown available for this schedule.",
    fromTemplate: "From template",
    custom: "Custom",
    assignedBy: "Assigned by",
    cancelled: "Cancelled",
    close: "Close",
  },
  ar: {
    title: "تفاصيل الجدول",
    loading: "جاري تحميل الجدول...",
    loadFailed: "فشل تحميل الجدول",
    restDay: "يوم راحة",
    noExercises: "لا توجد تمارين",
    noBreakdown: "لا يتوفر تفصيل الأيام لهذا الجدول.",
    fromTemplate: "من قالب",
    custom: "مخصص",
    assignedBy: "بواسطة",
    cancelled: "ملغى",
    close: "إغلاق",
  },
};

const ScheduleDetailsModal: React.FC<ScheduleDetailsModalProps> = ({
  visible,
  scheduleId,
  gymId,
  dark,
  isAr,
  isRTL,
  onClose,
}) => {
  const t = isAr ? T_SCHED_DETAILS.ar : T_SCHED_DETAILS.en;
  const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<MemberScheduleDetails | null>(null);
  const [muscleLibrary, setMuscleLibrary] = useState<MuscleItem[]>([]);

  useEffect(() => {
    if (!visible || scheduleId == null || gymId == null) return;
    (async () => {
      try {
        setLoading(true);
        setSchedule(null);
        const [sched, muscles] = await Promise.all([
          fetchMemberScheduleById(gymId, scheduleId),
          fetchWorkoutLibrary(gymId),
        ]);
        setSchedule(sched);
        setMuscleLibrary(muscles);
      } catch (err: any) {
        Alert.alert("Error", `${t.loadFailed}: ${err?.message || ""}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, scheduleId, gymId]);

  const muscleName = (id: number) =>
    muscleLibrary.find((m) => m.id === id)?.[isAr ? "nameAr" : "nameEn"] ||
    `#${id}`;

  const exerciseName = (muscleId: number, exId: number) =>
    (muscleLibrary.find((m) => m.id === muscleId)?.exercises || []).find(
      (e) => e.id === exId,
    )?.[isAr ? "nameAr" : "nameEn"] || `#${exId}`;

  const c = {
    modalBg: dark ? "#111111" : "#FFFFFF",
    border: dark ? "#222222" : "#EEEEEE",
    text: dark ? "#EEEEEE" : "#333333",
    sub: dark ? "#888888" : "#666666",
    card: dark ? "#0A0A0A" : "#F8F9FA",
    chipBg: dark ? "#1E293B" : "#E3F2FD",
    chipText: dark ? "#93C5FD" : "#1565C0",
    chipRest: dark ? "#221100" : "#FFF3CD",
    chipRestText: dark ? "#FFCC44" : "#856404",
    cancelledBg: dark ? "#220000" : "#FFEBEE",
    cancelledText: dark ? "#FF8888" : "#C62828",
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={S_SCHED_DETAILS.overlay}>
        <View style={[S_SCHED_DETAILS.content, { backgroundColor: c.modalBg }]}>
          <View
            style={[S_SCHED_DETAILS.header, { borderBottomColor: c.border }]}
          >
            <Text
              style={[
                S_SCHED_DETAILS.headerTitle,
                { color: c.text, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {schedule ? (isAr ? schedule.nameAr : schedule.nameEn) : t.title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 22, color: c.sub }}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={S_SCHED_DETAILS.loadingRow}>
              <ActivityIndicator />
              <Text style={{ color: c.sub, marginTop: 6 }}>{t.loading}</Text>
            </View>
          ) : !schedule ? (
            <View style={S_SCHED_DETAILS.loadingRow}>
              <Text style={{ color: c.sub }}>{t.loadFailed}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={S_SCHED_DETAILS.scrollContent}>
              <View
                style={[
                  S_SCHED_DETAILS.metaCard,
                  { backgroundColor: c.card, borderColor: c.border },
                ]}
              >
                <Text
                  style={{
                    color: c.sub,
                    fontSize: 13,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {formatDateOnly(schedule.startDate)} →{" "}
                  {formatDateOnly(schedule.endDate)}
                </Text>
                <View
                  style={[
                    S_SCHED_DETAILS.metaRow,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <View
                    style={[
                      S_SCHED_DETAILS.sourceBadge,
                      { backgroundColor: c.chipBg },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: c.chipText,
                      }}
                    >
                      {schedule.sourceTemplateId != null
                        ? `${t.fromTemplate}: ${schedule.sourceTemplateNameEn}`
                        : t.custom}
                    </Text>
                  </View>
                  {schedule.isCancelled && (
                    <View
                      style={[
                        S_SCHED_DETAILS.sourceBadge,
                        { backgroundColor: c.cancelledBg },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: c.cancelledText,
                        }}
                      >
                        {t.cancelled}
                      </Text>
                    </View>
                  )}
                  <Text style={{ color: c.sub, fontSize: 11 }}>
                    {t.assignedBy}: {schedule.assignedByName}
                  </Text>
                </View>
                {!!schedule.note && (
                  <Text
                    style={{
                      color: c.sub,
                      fontSize: 13,
                      marginTop: 8,
                      textAlign: isRTL ? "right" : "left",
                    }}
                  >
                    {schedule.note}
                  </Text>
                )}
              </View>

              {!schedule.days || schedule.days.length === 0 ? (
                <Text
                  style={{
                    color: c.sub,
                    fontStyle: "italic",
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {t.noBreakdown}
                </Text>
              ) : (
                [...schedule.days]
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((day) => (
                    <View
                      key={day.dayOfWeek}
                      style={[
                        S_SCHED_DETAILS.dayCard,
                        { backgroundColor: c.card, borderColor: c.border },
                      ]}
                    >
                      <View
                        style={[
                          S_SCHED_DETAILS.dayHeader,
                          isRTL && { flexDirection: "row-reverse" },
                        ]}
                      >
                        <Text
                          style={[
                            S_SCHED_DETAILS.dayTitle,
                            {
                              color: c.text,
                              textAlign: isRTL ? "right" : "left",
                            },
                          ]}
                        >
                          {dayNames[day.dayOfWeek]}
                        </Text>
                        {day.isRestDay && (
                          <View
                            style={[
                              S_SCHED_DETAILS.restPill,
                              { backgroundColor: c.chipRest },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: c.chipRestText,
                              }}
                            >
                              {t.restDay}
                            </Text>
                          </View>
                        )}
                      </View>

                      {!day.isRestDay && (
                        <>
                          {!!day.note && (
                            <Text
                              style={{
                                color: c.sub,
                                fontSize: 13,
                                marginBottom: 8,
                                textAlign: isRTL ? "right" : "left",
                              }}
                            >
                              {day.note}
                            </Text>
                          )}
                          {day.muscles.length === 0 ? (
                            <Text style={{ color: c.sub, fontStyle: "italic" }}>
                              {t.noExercises}
                            </Text>
                          ) : (
                            day.muscles.map((block, i) => (
                              <View key={i} style={{ marginBottom: 8 }}>
                                <Text
                                  style={{
                                    color: c.text,
                                    fontWeight: "600",
                                    marginBottom: 6,
                                    textAlign: isRTL ? "right" : "left",
                                  }}
                                >
                                  {muscleName(block.muscleId)}
                                </Text>
                                <View
                                  style={[
                                    S_SCHED_DETAILS.chipsWrap,
                                    isRTL && { flexDirection: "row-reverse" },
                                  ]}
                                >
                                  {block.exercises.map((ex) => (
                                    <View
                                      key={ex.exerciseId}
                                      style={[
                                        S_SCHED_DETAILS.chip,
                                        { backgroundColor: c.chipBg },
                                      ]}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          fontWeight: "600",
                                          color: c.chipText,
                                        }}
                                      >
                                        {exerciseName(
                                          block.muscleId,
                                          ex.exerciseId,
                                        )}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            ))
                          )}
                        </>
                      )}
                    </View>
                  ))
              )}
            </ScrollView>
          )}

          <View style={[S_SCHED_DETAILS.actions, { borderTopColor: c.border }]}>
            <TouchableOpacity
              style={[
                S_SCHED_DETAILS.closeBtn,
                { backgroundColor: dark ? "#1E293B" : "#F0F0F0" },
              ]}
              onPress={onClose}
            >
              <Text style={{ color: c.sub, fontWeight: "600" }}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const S_SCHED_DETAILS = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { width: "92%", maxHeight: "88%", borderRadius: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 19, fontWeight: "700", flex: 1 },
  scrollContent: { padding: 18 },
  loadingRow: { alignItems: "center", paddingVertical: 40 },
  metaCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  dayCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayTitle: { fontSize: 15, fontWeight: "700" },
  restPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  actions: { padding: 16, borderTopWidth: 1 },
  closeBtn: { padding: 14, borderRadius: 10, alignItems: "center" },
});

// ═══════════════════════════════════════════════════════════════════════
// AssignScheduleModal
// ═══════════════════════════════════════════════════════════════════════

interface AssignScheduleModalProps {
  visible: boolean;
  member: PTMember | null;
  onClose: () => void;
  onCreated: () => void;
  dark: boolean;
  isAr: boolean;
  isRTL: boolean;
}

type ScheduleType = "template" | "custom";

const T_ASSIGN = {
  en: {
    title: "Assign Schedule",
    forMember: "For",
    fromTemplate: "From Template",
    custom: "Custom",
    selectTemplate: "Select Template",
    tapToSelectTemplate: "Tap to select a template",
    noTemplates: "No templates yet — create one first, or use Custom.",
    startDate: "Start Date",
    endDate: "End Date",
    note: "Note",
    replaceOverlap: "Replace overlapping schedule",
    nameEn: "Schedule name (English)",
    nameAr: "Schedule name (Arabic)",
    save: "Save Schedule",
    cancel: "Cancel",
    loadingTemplates: "Loading templates...",
    loadingLibrary: "Loading exercises...",
    validationTitle: "Missing exercises",
    validationBody: (day: string) =>
      `${day} is set as a training day but has no exercises. Add at least one exercise or switch it to a rest day.`,
    templateRequired: "Please select a template.",
    dateRangeInvalid: "End date must be after the start date.",
    nameRequired: "Please enter the schedule name in English and Arabic.",
    saved: "Schedule assigned successfully!",
    saveFailed: "Failed to save schedule",
  },
  ar: {
    title: "تعيين جدول",
    forMember: "للعضو",
    fromTemplate: "من قالب",
    custom: "مخصص",
    selectTemplate: "اختر القالب",
    tapToSelectTemplate: "اضغط لاختيار قالب",
    noTemplates: "لا توجد قوالب بعد — أنشئ واحداً أولاً أو استخدم المخصص.",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    note: "ملاحظة",
    replaceOverlap: "استبدال الجدول المتداخل",
    nameEn: "اسم الجدول (إنجليزي)",
    nameAr: "اسم الجدول (عربي)",
    save: "حفظ الجدول",
    cancel: "إلغاء",
    loadingTemplates: "جاري تحميل القوالب...",
    loadingLibrary: "جاري تحميل التمارين...",
    validationTitle: "تمارين ناقصة",
    validationBody: (day: string) =>
      `${day} محدد كيوم تدريب لكن بدون تمارين. أضف تمريناً واحداً على الأقل أو حوّله ليوم راحة.`,
    templateRequired: "يرجى اختيار قالب.",
    dateRangeInvalid: "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء.",
    nameRequired: "يرجى إدخال اسم الجدول بالإنجليزية والعربية.",
    saved: "تم تعيين الجدول بنجاح!",
    saveFailed: "فشل حفظ الجدول",
  },
};

const AssignScheduleModal: React.FC<AssignScheduleModalProps> = ({
  visible,
  member,
  onClose,
  onCreated,
  dark,
  isAr,
  isRTL,
}) => {
  const t = isAr ? T_ASSIGN.ar : T_ASSIGN.en;

  const [scheduleType, setScheduleType] = useState<ScheduleType>("template");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    null,
  );
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const [muscleLibrary, setMuscleLibrary] = useState<MuscleItem[]>([]);
  const [customDays, setCustomDays] = useState(buildEmptyDays());
  const [customNameEn, setCustomNameEn] = useState("");
  const [customNameAr, setCustomNameAr] = useState("");

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => addOneMonth(new Date()));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [note, setNote] = useState("");
  const [replaceOverlap, setReplaceOverlap] = useState(false);

  // Picking a start date defaults the end date to exactly one calendar
  // month later (30/9 → 30/10). The end date field is still separately
  // editable afterward if a different range is needed.
  const handleStartDateChange = (d: Date) => {
    setStartDate(d);
    setEndDate(addOneMonth(d));
  };

  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        setLoading(true);
        // Prefer the member's own gymId when we have it — confirmed via the
        // history endpoint that a member's real gym can differ from GYM_ID.
        const gymId = member?.gymId ?? GYM_ID;
        const [tpls, muscles] = await Promise.all([
          fetchTemplates(gymId),
          fetchWorkoutLibrary(gymId),
        ]);
        setTemplates(tpls);
        setMuscleLibrary(muscles);
      } catch (err: any) {
        Alert.alert("Error", err?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, member]);

  const resetForm = () => {
    setScheduleType("template");
    setSelectedTemplateId(null);
    setCustomDays(buildEmptyDays());
    setCustomNameEn("");
    setCustomNameAr("");
    const now = new Date();
    setStartDate(now);
    setEndDate(addOneMonth(now));
    setNote("");
    setReplaceOverlap(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!member) return;
    console.log("[AssignSchedule] memberShipId:", member.memberShipId);
    if (endDate.getTime() <= startDate.getTime()) {
      Alert.alert("Error", t.dateRangeInvalid);
      return;
    }
    try {
      setSaving(true);
      // Same rule as above: trust the member's own gymId if we have it.
      const gymId = member.gymId ?? GYM_ID;
      console.log(
        "[AssignSchedule] submitting with memberShipId:",
        member.memberShipId,
        "gymId:",
        gymId,
        "scheduleType:",
        scheduleType,
      );

      if (scheduleType === "template") {
        if (!selectedTemplateId) {
          Alert.alert("Error", t.templateRequired);
          setSaving(false);
          return;
        }
        await createScheduleFromTemplate(gymId, {
          memberShipId: member.memberShipId,
          templateId: selectedTemplateId,
          startDate: toApiDate(startDate),
          endDate: toApiDate(endDate),
          note,
          replaceOverlappingSchedule: replaceOverlap,
        });
      } else {
        if (!customNameEn.trim() || !customNameAr.trim()) {
          Alert.alert("Error", t.nameRequired);
          setSaving(false);
          return;
        }
        const { valid, invalidDayOfWeek } = validateDays(customDays);
        if (!valid && invalidDayOfWeek !== undefined) {
          const dayName = (isAr ? DAY_NAMES_AR : DAY_NAMES_EN)[
            invalidDayOfWeek
          ];
          Alert.alert(t.validationTitle, t.validationBody(dayName));
          setSaving(false);
          return;
        }
        await createCustomSchedule(gymId, {
          memberShipId: member.memberShipId,
          nameEn: customNameEn.trim(),
          nameAr: customNameAr.trim(),
          note,
          startDate: toApiDate(startDate),
          endDate: toApiDate(endDate),
          replaceOverlappingSchedule: replaceOverlap,
          days: sanitizeDaysForSubmit(customDays),
        });
      }

      Alert.alert("Success", t.saved);
      resetForm();
      onCreated();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", `${t.saveFailed}: ${err?.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  const c = {
    modalBg: dark ? "#111111" : "#FFFFFF",
    border: dark ? "#222222" : "#EEEEEE",
    text: dark ? "#EEEEEE" : "#333333",
    sub: dark ? "#888888" : "#666666",
    inputBg: dark ? "#000000" : "#F9F9F9",
    tabInactive: dark ? "#0A0A0A" : "#F0F0F0",
  };

  const templateItems: SelectItem[] = templates.map((tpl) => ({
    id: tpl.id ?? 0,
    label: isAr ? tpl.nameAr : tpl.nameEn,
    sublabel: tpl.note,
  }));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={S_ASSIGN.overlay}>
        <View style={[S_ASSIGN.content, { backgroundColor: c.modalBg }]}>
          <View style={[S_ASSIGN.header, { borderBottomColor: c.border }]}>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  S_ASSIGN.headerTitle,
                  { color: c.text, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t.title}
              </Text>
              {!!member && (
                <Text
                  style={{
                    color: c.sub,
                    fontSize: 13,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {t.forMember}: {member.membershipName}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Text style={{ fontSize: 22, color: c.sub }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={S_ASSIGN.tabRow}>
            {(["template", "custom"] as ScheduleType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  S_ASSIGN.tabBtn,
                  {
                    backgroundColor:
                      scheduleType === type ? "#007AFF" : c.tabInactive,
                  },
                ]}
                onPress={() => setScheduleType(type)}
              >
                <Text
                  style={{
                    color: scheduleType === type ? "#fff" : c.sub,
                    fontWeight: "700",
                  }}
                >
                  {type === "template" ? t.fromTemplate : t.custom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={S_ASSIGN.loadingRow}>
              <ActivityIndicator />
              <Text style={{ color: c.sub, marginTop: 6 }}>
                {scheduleType === "template"
                  ? t.loadingTemplates
                  : t.loadingLibrary}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={S_ASSIGN.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {scheduleType === "template" ? (
                <View style={S_ASSIGN.field}>
                  <Text
                    style={[
                      S_ASSIGN.label,
                      { color: c.text, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {t.selectTemplate}
                  </Text>
                  {templates.length === 0 ? (
                    <Text style={{ color: c.sub, fontStyle: "italic" }}>
                      {t.noTemplates}
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={[
                        S_ASSIGN.pickerBtn,
                        { borderColor: c.border, backgroundColor: c.inputBg },
                      ]}
                      onPress={() => setShowTemplatePicker(true)}
                    >
                      <Text
                        style={{
                          color: selectedTemplateId ? c.text : c.sub,
                          textAlign: isRTL ? "right" : "left",
                        }}
                      >
                        {selectedTemplateId
                          ? isAr
                            ? templates.find(
                                (tp) => tp.id === selectedTemplateId,
                              )?.nameAr
                            : templates.find(
                                (tp) => tp.id === selectedTemplateId,
                              )?.nameEn
                          : t.tapToSelectTemplate}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <>
                  <TextInput
                    value={customNameEn}
                    onChangeText={setCustomNameEn}
                    placeholder={t.nameEn}
                    placeholderTextColor={c.sub}
                    style={[
                      S_ASSIGN.input,
                      {
                        backgroundColor: c.inputBg,
                        borderColor: c.border,
                        color: c.text,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  />
                  <TextInput
                    value={customNameAr}
                    onChangeText={setCustomNameAr}
                    placeholder={t.nameAr}
                    placeholderTextColor={c.sub}
                    style={[
                      S_ASSIGN.input,
                      {
                        backgroundColor: c.inputBg,
                        borderColor: c.border,
                        color: c.text,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  />
                </>
              )}

              <View
                style={[
                  S_ASSIGN.dateRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[S_ASSIGN.label, { color: c.text }]}>
                    {t.startDate}
                  </Text>
                  <TouchableOpacity
                    style={[
                      S_ASSIGN.pickerBtn,
                      { borderColor: c.border, backgroundColor: c.inputBg },
                    ]}
                    onPress={() =>
                      Platform.OS === "android"
                        ? openAndroidDatePicker(
                            startDate,
                            handleStartDateChange,
                          )
                        : setShowStartPicker(true)
                    }
                  >
                    <Text style={{ color: c.text }}>
                      {toApiDate(startDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S_ASSIGN.label, { color: c.text }]}>
                    {t.endDate}
                  </Text>
                  <TouchableOpacity
                    style={[
                      S_ASSIGN.pickerBtn,
                      { borderColor: c.border, backgroundColor: c.inputBg },
                    ]}
                    onPress={() =>
                      Platform.OS === "android"
                        ? openAndroidDatePicker(endDate, setEndDate)
                        : setShowEndPicker(true)
                    }
                  >
                    <Text style={{ color: c.text }}>{toApiDate(endDate)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* iOS only: Android uses the imperative dialog above, since the
                  native date dialog does not nest safely inside this Modal. */}
              {Platform.OS === "ios" && showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={(_, selected) => {
                    setShowStartPicker(false);
                    if (selected) handleStartDateChange(selected);
                  }}
                />
              )}
              {Platform.OS === "ios" && showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="spinner"
                  onChange={(_, selected) => {
                    setShowEndPicker(false);
                    if (selected) setEndDate(selected);
                  }}
                />
              )}

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t.note}
                placeholderTextColor={c.sub}
                style={[
                  S_ASSIGN.input,
                  {
                    backgroundColor: c.inputBg,
                    borderColor: c.border,
                    color: c.text,
                    textAlign: isRTL ? "right" : "left",
                    marginTop: 12,
                  },
                ]}
              />

              {/* <View
                style={[
                  S_ASSIGN.switchRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Text style={{ color: c.text, flex: 1 }}>{t.replaceOverlap}</Text>
                <Switch value={replaceOverlap} onValueChange={setReplaceOverlap} />
              </View> */}

              {scheduleType === "custom" && (
                <View style={{ marginTop: 8 }}>
                  <DaySchedulePlanner
                    days={customDays}
                    onChange={setCustomDays}
                    muscleLibrary={muscleLibrary}
                    dark={dark}
                    isAr={isAr}
                    isRTL={isRTL}
                  />
                </View>
              )}
            </ScrollView>
          )}

          <View style={[S_ASSIGN.actions, { borderTopColor: c.border }]}>
            <TouchableOpacity
              style={[
                S_ASSIGN.btn,
                { backgroundColor: dark ? "#1E293B" : "#F0F0F0" },
              ]}
              onPress={handleClose}
            >
              <Text style={{ color: c.sub, fontWeight: "600" }}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                S_ASSIGN.btn,
                S_ASSIGN.saveBtn,
                saving && S_ASSIGN.disabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={S_ASSIGN.saveBtnText}>{t.save}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SelectModal
        visible={showTemplatePicker}
        title={t.selectTemplate}
        items={templateItems}
        selectedId={selectedTemplateId}
        onSelect={(item) => setSelectedTemplateId(Number(item.id))}
        onClose={() => setShowTemplatePicker(false)}
        dark={dark}
        isRTL={isRTL}
      />
    </Modal>
  );
};

const S_ASSIGN = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { width: "92%", maxHeight: "90%", borderRadius: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 19, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 4 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  loadingRow: { alignItems: "center", paddingVertical: 40 },
  scrollContent: { padding: 18, paddingTop: 6 },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  pickerBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  dateRow: { flexDirection: "row", gap: 12, marginBottom: 4 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
  },
  btn: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  saveBtn: { backgroundColor: "#4CAF50" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.6 },
});

// ═══════════════════════════════════════════════════════════════════════
// WorkoutPlansScreen — main screen (default export)
// ═══════════════════════════════════════════════════════════════════════

type Tab = "templates" | "members";

const T_SCREEN = {
  en: {
    title: "Workout Plans",
    subtitle: "Templates & member schedules",
    templates: "Templates",
    members: "Members",
    noTemplates: "No templates yet. Tap + to create one.",
    noMembers: "No members found.",
    assign: "Assign Schedule",
    history: "History",
    loading: "Loading...",
  },
  ar: {
    title: "خطط التمارين",
    subtitle: "القوالب وجداول الأعضاء",
    templates: "القوالب",
    members: "الأعضاء",
    noTemplates: "لا توجد قوالب بعد. اضغط + لإنشاء واحد.",
    noMembers: "لا يوجد أعضاء.",
    assign: "تعيين جدول",
    history: "السجل",
    loading: "جاري التحميل...",
  },
};

const WorkoutPlansScreen = () => {
  const { getDirection, isArabic } = useI18n();
  const { isDarkMode } = useAppContext() as any;
  const dark = isDarkMode ?? false;
  const isAr = isArabic();
  const isRTL =
    (getDirection() as any)?.flexDirection === "row-reverse" ||
    (getDirection() as any)?.direction === "rtl";
  const t = isAr ? T_SCREEN.ar : T_SCREEN.en;
  const dayNames = isAr ? DAY_NAMES_AR : DAY_NAMES_EN;

  const [tab, setTab] = useState<Tab>("templates");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [members, setMembers] = useState<PTMember[]>([]);

  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [assignTarget, setAssignTarget] = useState<PTMember | null>(null);
  const [detailsTemplateId, setDetailsTemplateId] = useState<number | null>(
    null,
  );
  const [historyTarget, setHistoryTarget] = useState<PTMember | null>(null);

  const loadData = useCallback(async () => {
    try {
      const gymId = GYM_ID;
      const ptUserId = await AsyncStorage.getItem("MemberId");
      const [tpls, mems] = await Promise.all([
        fetchTemplates(gymId),
        ptUserId ? fetchPTMembers(ptUserId) : Promise.resolve([]),
      ]);
      setTemplates(tpls);
      setMembers(mems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const c = {
    bg: dark ? "#000000" : "#F5F5F5",
    surface: dark ? "#111111" : "#FFFFFF",
    border: dark ? "#222222" : "#EEEEEE",
    text: dark ? "#EEEEEE" : "#333333",
    sub: dark ? "#888888" : "#666666",
    tabInactive: dark ? "#0A0A0A" : "#F0F0F0",
    chipRest: dark ? "#221100" : "#FFF3CD",
    chipRestText: dark ? "#FFCC44" : "#856404",
    chipTrain: dark ? "#001133" : "#E3F2FD",
    chipTrainText: dark ? "#66BBFF" : "#1565C0",
  };

  const renderTemplate = ({ item }: { item: WorkoutTemplate }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        if (item.id != null) setDetailsTemplateId(item.id);
      }}
      style={[
        S_SCREEN.card,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      <Text
        style={[
          S_SCREEN.cardTitle,
          { color: c.text, textAlign: isRTL ? "right" : "left" },
        ]}
      >
        {isAr ? item.nameAr : item.nameEn}
      </Text>
      {!!item.note && (
        <Text
          style={{
            color: c.sub,
            marginBottom: 8,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {item.note}
        </Text>
      )}
      <View
        style={[
          S_SCREEN.dayChipsRow,
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        {[...(item.days || [])]
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
          .map((d) => (
            <View
              key={d.dayOfWeek}
              style={[
                S_SCREEN.dayChip,
                { backgroundColor: d.isRestDay ? c.chipRest : c.chipTrain },
              ]}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: d.isRestDay ? c.chipRestText : c.chipTrainText,
                }}
              >
                {dayNames[d.dayOfWeek].slice(0, 3)}
              </Text>
            </View>
          ))}
      </View>
    </TouchableOpacity>
  );

  const renderMember = ({ item }: { item: PTMember }) => (
    <View
      style={[
        S_SCREEN.card,
        S_SCREEN.memberCard,
        { backgroundColor: c.surface, borderColor: c.border },
      ]}
    >
      <View
        style={[S_SCREEN.memberRow, isRTL && { flexDirection: "row-reverse" }]}
      >
        {!!item.photoUrl && (
          <Image source={{ uri: item.photoUrl }} style={S_SCREEN.avatar} />
        )}
        <Text
          style={[
            S_SCREEN.cardTitle,
            { color: c.text, textAlign: isRTL ? "right" : "left", flex: 1 },
          ]}
        >
          {item.membershipName}
        </Text>
      </View>
      <View
        style={[
          S_SCREEN.memberActionsRow,
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        <TouchableOpacity
          style={[S_SCREEN.assignBtn, { flex: 1 }]}
          onPress={() => {
            console.log(
              "[Members] membershipId:",
              item.memberShipId,
              "gymId (if present):",
              item.gymId,
            );
            setAssignTarget(item);
          }}
        >
          <Text style={S_SCREEN.assignBtnText}>{t.assign}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S_SCREEN.historyBtn, { flex: 1 }]}
          onPress={() => setHistoryTarget(item)}
        >
          <Text style={S_SCREEN.historyBtnText}>{t.history}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[S_SCREEN.loadingContainer, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ color: c.sub, marginTop: 10 }}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={[S_SCREEN.container, { backgroundColor: c.bg }]}>
      <View style={S_SCREEN.header}>
        <Text style={S_SCREEN.headerTitle}>{t.title}</Text>
        <Text style={S_SCREEN.headerSubtitle}>{t.subtitle}</Text>
      </View>

      <View style={S_SCREEN.tabRow}>
        {(["templates", "members"] as Tab[]).map((tb) => (
          <TouchableOpacity
            key={tb}
            style={[
              S_SCREEN.tabBtn,
              { backgroundColor: tab === tb ? "#007AFF" : c.tabInactive },
            ]}
            onPress={() => setTab(tb)}
          >
            <Text
              style={{ color: tab === tb ? "#fff" : c.sub, fontWeight: "700" }}
            >
              {tb === "templates" ? t.templates : t.members}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "templates" ? (
        <FlatList
          data={templates}
          renderItem={renderTemplate}
          keyExtractor={(item, i) => (item.id ?? i).toString()}
          contentContainerStyle={S_SCREEN.listContainer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          ListEmptyComponent={
            <Text style={{ color: c.sub, textAlign: "center", marginTop: 30 }}>
              {t.noTemplates}
            </Text>
          }
        />
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.memberShipId.toString()}
          contentContainerStyle={S_SCREEN.listContainer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          ListEmptyComponent={
            <Text style={{ color: c.sub, textAlign: "center", marginTop: 30 }}>
              {t.noMembers}
            </Text>
          }
        />
      )}

      {tab === "templates" && (
        <TouchableOpacity
          style={[S_SCREEN.fab, isRTL && { right: undefined, left: 30 }]}
          onPress={() => setShowCreateTemplate(true)}
        >
          <Text style={S_SCREEN.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <CreateTemplateModal
        visible={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
        onCreated={loadData}
        dark={dark}
        isAr={isAr}
        isRTL={isRTL}
      />

      <AssignScheduleModal
        visible={assignTarget !== null}
        member={assignTarget}
        onClose={() => setAssignTarget(null)}
        onCreated={loadData}
        dark={dark}
        isAr={isAr}
        isRTL={isRTL}
      />

      <TemplateDetailsModal
        visible={detailsTemplateId !== null}
        templateId={detailsTemplateId}
        onClose={() => setDetailsTemplateId(null)}
        dark={dark}
        isAr={isAr}
        isRTL={isRTL}
      />

      <MemberHistoryModal
        visible={historyTarget !== null}
        member={historyTarget}
        onClose={() => setHistoryTarget(null)}
        dark={dark}
        isAr={isAr}
        isRTL={isRTL}
      />
    </View>
  );
};

const S_SCREEN = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  tabRow: { flexDirection: "row", gap: 10, padding: 15, paddingBottom: 5 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  listContainer: { padding: 15, paddingBottom: 90 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  dayChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  dayChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  memberCard: { flexDirection: "column" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
  },
  memberActionsRow: { flexDirection: "row", gap: 8 },
  assignBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  assignBtnText: { color: "#fff", fontWeight: "700" },
  historyBtn: {
    backgroundColor: "#5f5f5f",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  historyBtnText: { color: "#fff", fontWeight: "700" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  fabText: { fontSize: 30, color: "#fff", fontWeight: "bold" },
});

export default WorkoutPlansScreen;
