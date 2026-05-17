import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { handleGetToken } from "../helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context";

const translations = {
  en: {
    title: "Exercise Schedules",
    subtitle: "Manage workout exercises",
    totalExercises: "Total Exercises",
    clients: "Clients",
    noClients: "No Clients",
    noExercises: "No exercises for this client",
    loading: "Loading exercise schedules...",
    createSchedule: "Create Schedule",
    editExercise: "Edit Exercise",
    selectClient: "Select Client",
    tapToSelect: "Tap to select client",
    addExercise: "Add Exercise to Schedule",
    trainingDay: "Training Day",
    muscleGroup: "Select Muscle Group",
    tapToSelectMuscle: "Tap to select muscle",
    selectExercise: "Select Exercise",
    tapToSelectExer: "Tap to select exercise",
    selectMuscleFirst: "Please select a muscle group first",
    noExercisesForMuscle: "No exercises found for this muscle group",
    rounds: "Rounds (Sets)",
    reps: "Reps per Round",
    setsPlaceholder: "Sets",
    repsPlaceholder: "Reps",
    addToDraft: "Add to Schedule Draft",
    updateDraft: "Update in Draft",
    saveSchedule: "Save Schedule",
    cancel: "Cancel",
    update: "Update Exercise",
    draft: "Draft",
    exercises: "exercises",
    editingExercise: "Editing Exercise",
    cancelEdit: "Cancel Edit",
    clearAll: "Clear All",
    editingMode:
      "⚠️ Editing mode: Make changes below and click 'Update in Draft'",
    editing: "Editing...",
    sets: "sets",
    repsLabel: "reps",
    addToMuscle: "Add to muscle and exercise for this client",
    changeMuscle: "Change Muscle Group",
    changeExercise: "Change Exercise",
    changeDay: "Change Training Day",
    selectDay: "Select a day",
    updatePreview: "Update Preview",
    currentExercise: "Exercise",
    currentClient: "Client",
    currentMuscle: "Current Muscle",
    currentDay: "Current Day",
    roundsLabel: "Rounds",
    repsPreview: "Reps",
    muscleLabel: "Muscle",
    dayLabel: "Day",
    from: "From",
    to: "To",
    roundsDetail: "Rounds",
    repsDetail: "Reps per round",
    dayDetail: "Day",
    selected: "Selected",
    errors: {
      fillAll:
        "Please fill all fields: Muscle, Exercise, Day, Rounds, and Reps",
      alreadyAdded: "This exercise is already added for this day and muscle.",
      noSchedule: "Please add at least one exercise to the schedule",
      authNotFound: "Authentication token not found. Please login again.",
      userNotFound: "User ID not found. Please login again.",
      deleteFailed: "Failed to delete exercise.",
      updateFailed: "Failed to update exercise. Please try again.",
      saveFailed: "Failed to save schedule",
    },
    success: {
      added: "Exercise added to draft! Add more or save the schedule.",
      updated: "Exercise updated in draft!",
      removed: "Exercise removed from draft.",
      cleared: "All draft items have been removed.",
      saved: "Schedule saved successfully!",
      deleted: "Exercise deleted successfully!",
      editUpdated: "Exercise updated successfully!",
      cancelledEdit: "Edit mode cancelled.",
    },
    confirm: {
      delete: "Delete Exercise",
      sure: "Are you sure you want to delete",
      cancel: "Cancel",
      delete2: "Delete",
    },
  },
  ar: {
    title: "جداول التمارين",
    subtitle: "إدارة تمارين التدريب",
    totalExercises: "إجمالي التمارين",
    clients: "العملاء",
    noClients: "لا يوجد عملاء",
    noExercises: "لا توجد تمارين لهذا اللاعب",
    loading: "جاري تحميل جداول التمارين...",
    createSchedule: "إنشاء جدول",
    editExercise: "تعديل التمرين",
    selectClient: "اختيار اللاعب",
    tapToSelect: "اضغط لاختيار اللاعب",
    addExercise: "إضافة تمرين للجدول",
    trainingDay: "يوم التدريب",
    muscleGroup: "اختر مجموعة العضلات",
    tapToSelectMuscle: "اضغط لاختيار العضلة",
    selectExercise: "اختر التمرين",
    tapToSelectExer: "اضغط لاختيار التمرين",
    selectMuscleFirst: "يرجى اختيار مجموعة العضلات أولاً",
    noExercisesForMuscle: "لا توجد تمارين لهذه المجموعة العضلية",
    rounds: "الجولات (المجموعات)",
    reps: "التكرارات لكل جولة",
    setsPlaceholder: "المجموعات",
    repsPlaceholder: "التكرارات",
    addToDraft: "إضافة لمسودة الجدول",
    updateDraft: "تحديث في المسودة",
    saveSchedule: "حفظ الجدول",
    cancel: "إلغاء",
    update: "تحديث التمرين",
    draft: "المسودة",
    exercises: "تمارين",
    editingExercise: "تعديل التمرين",
    cancelEdit: "إلغاء التعديل",
    clearAll: "مسح الكل",
    editingMode: "⚠️ وضع التعديل: قم بالتغييرات ثم اضغط 'تحديث في المسودة'",
    editing: "جاري التعديل...",
    sets: "مجموعات",
    repsLabel: "تكرار",
    addToMuscle: "إضافة عضلة وتمرين لهذا اللاعب ",
    changeMuscle: "تغيير مجموعة العضلات",
    changeExercise: "تغيير التمرين",
    changeDay: "تغيير يوم التدريب",
    selectDay: "اختر يوماً",
    updatePreview: "معاينة التحديث",
    currentExercise: "التمرين",
    currentClient: "العميل",
    currentMuscle: "العضلة الحالية",
    currentDay: "اليوم الحالي",
    roundsLabel: "الجولات",
    repsPreview: "التكرارات",
    muscleLabel: "العضلة",
    dayLabel: "اليوم",
    from: "من",
    to: "إلى",
    roundsDetail: "الجولات",
    repsDetail: "التكرارات لكل جولة",
    dayDetail: "اليوم",
    selected: "المختار",
    errors: {
      fillAll:
        "يرجى ملء جميع الحقول: العضلة، التمرين، اليوم، الجولات، والتكرارات",
      alreadyAdded: "هذا التمرين مضاف بالفعل لهذا اليوم وهذه العضلة.",
      noSchedule: "يرجى إضافة تمرين واحد على الأقل للجدول",
      authNotFound: "رمز المصادقة غير موجود. يرجى تسجيل الدخول مجدداً.",
      userNotFound: "معرف المستخدم غير موجود. يرجى تسجيل الدخول مجدداً.",
      deleteFailed: "فشل حذف التمرين.",
      updateFailed: "فشل تحديث التمرين. يرجى المحاولة مرة أخرى.",
      saveFailed: "فشل حفظ الجدول",
    },
    success: {
      added: "تمت إضافة التمرين للمسودة! أضف المزيد أو احفظ الجدول.",
      updated: "تم تحديث التمرين في المسودة!",
      removed: "تم إزالة التمرين من المسودة.",
      cleared: "تمت إزالة جميع عناصر المسودة.",
      saved: "تم حفظ الجدول بنجاح!",
      deleted: "تم حذف التمرين بنجاح!",
      editUpdated: "تم تحديث التمرين بنجاح!",
      cancelledEdit: "تم إلغاء وضع التعديل.",
    },
    confirm: {
      delete: "حذف التمرين",
      sure: "هل أنت متأكد من حذف",
      cancel: "إلغاء",
      delete2: "حذف",
    },
  },
};

const MuselsePlanPtList = () => {
  const navigation = useNavigation();
  const { getDirection, isArabic } = useI18n();
  const { isDarkMode } = useAppContext() as any;
  const dark = isDarkMode ?? false;

  const isAr = isArabic();
  const isRTL =
    (getDirection() as any)?.flexDirection === "row-reverse" ||
    (getDirection() as any)?.direction === "rtl";
  const t = isAr ? translations.ar : translations.en;

  // ── Dark mode tokens ──────────────────────────────────────────────────────
  const d = {
    bg: dark ? "#000000" : "#F5F5F5",
    surface: dark ? "#111111" : "#FFFFFF",
    surface2: dark ? "#000000" : "#F8F9FA",
    surface3: dark ? "#111111" : "#F9F9F9",
    border: dark ? "#222222" : "#EEEEEE",
    border2: dark ? "#222222" : "#E0E0E0",
    border3: dark ? "#333333" : "#CCCCCC",
    text: dark ? "#EEEEEE" : "#333333",
    textSub: dark ? "#888888" : "#666666",
    textMuted: dark ? "#555555" : "#999999",
    inputBg: dark ? "#000000" : "#F9F9F9",
    modalBg: dark ? "#111111" : "#FFFFFF",
    draftBg: dark ? "#111111" : "#F8F9FA",
    draftBorder: dark ? "#222222" : "#E9ECEF",
    editingBg: dark ? "#001133" : "#E8F4FD",
    editingBorder: dark ? "#003399" : "#2196F3",
    editingIndicatorBg: dark ? "#000D1A" : "#D1ECF1",
    editingIndicatorBorder: dark ? "#003344" : "#BEE5EB",
    editingIndicatorText: dark ? "#66BBFF" : "#0C5460",
    summaryBg: dark ? "#000000" : "#F8F9FA",
    updatePreviewBg: dark ? "#001100" : "#E8F5E9",
    updatePreviewBorder: dark ? "#003300" : "#C8E6C9",
    updatePreviewTitle: dark ? "#66FF88" : "#2E7D32",
    previewItemBg: dark ? "#111111" : "#FFFFFF",
    previewValue: dark ? "#66FF88" : "#2E7D32",
    dayBtnBg: dark ? "#111111" : "#F0F0F0",
    dayBtnText: dark ? "#888888" : "#666666",
    dropdownBg: dark ? "#111111" : "#FFFFFF",
    dropdownBorder: dark ? "#222222" : "#F0F0F0",
    disabledBg: dark ? "#111111" : "#F5F5F5",
    cancelEditBg: dark ? "#221100" : "#FFF3CD",
    cancelEditBorder: dark ? "#664400" : "#FFC107",
    cancelEditText: dark ? "#FFCC44" : "#856404",
    clearDraftBg: dark ? "#220000" : "#FFEBEE",
    clearDraftText: dark ? "#FF8888" : "#C62828",
    addMoreBg: dark ? "#111111" : "#FFFFFF",
    modalHeaderBorder: dark ? "#222222" : "#EEEEEE",
    modalActionsBorder: dark ? "#222222" : "#EEEEEE",
  };

  const rowStyle = isRTL ? S.rowRTL : S.row;
  const txtAlign = isRTL ? S.textRight : S.textLeft;

  const [exerciseSchedules, setExerciseSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingExercise, setAddingExercise] = useState(false);
  const [rounds, setRounds] = useState("");
  const [oneRoundCount, setOneRoundCount] = useState("");
  const [selectedMuscleId, setSelectedMuscleId] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [selectedDayId, setSelectedDayId] = useState("");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [muscles, setMuscles] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [daysOptions, setDaysOptions] = useState<
    Array<{ id: any; name: string }>
  >([]);
  const [error, setError] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRounds, setEditRounds] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editFromDate, setEditFromDate] = useState(new Date());
  const [editToDate, setEditToDate] = useState(new Date());
  const [editSelectedMuscleId, setEditSelectedMuscleId] = useState("");
  const [editSelectedExerciseId, setEditSelectedExerciseId] = useState("");
  const [editSelectedDayId, setEditSelectedDayId] = useState("");
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [daysDraft, setDaysDraft] = useState([]);
  const [showMuscleDropdown, setShowMuscleDropdown] = useState(false);
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [draftPreview, setDraftPreview] = useState([]);
  const [expandedClients, setExpandedClients] = useState({});

  const toggleClient = (memberId) =>
    setExpandedClients((prev) => ({ ...prev, [memberId]: !prev[memberId] }));

  useEffect(() => {
    const fetchDays = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://gym.useitsmart.com/api/Days/getallDays",
          { method: "GET", headers: { accept: "text/plain" } },
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        let transformed = [];
        if (data && Array.isArray(data.result)) {
          transformed = data.result.map((item) => ({
            id: item.id.toString(),
            name: item.dayName,
            dayNumber: item.id,
          }));
        } else if (Array.isArray(data)) {
          transformed = data.map((item) => ({
            id: (item.id || item.dayId || item.dayID).toString(),
            name: item.dayName || item.name || `Day ${item.id}`,
            dayNumber: item.id || item.dayId || 1,
          }));
        }
        if (transformed.length === 0) throw new Error("No valid data found");
        transformed.sort((a, b) => a.dayNumber - b.dayNumber);
        setDaysOptions(transformed);
        if (transformed.length > 0 && !selectedDayId)
          setSelectedDayId(transformed[0].id);
        setError(null);
      } catch (err) {
        setError(err.message || "Failed to load training days");
        setDaysOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDays();
  }, [selectedDayId]);

  const getDayNameById = useCallback(
    (dayId) => {
      if (!dayId && dayId !== 0) return "Not specified";
      const day = daysOptions.find((d) => d.id.toString() === dayId.toString());
      return day ? day.name : `Day ${dayId}`;
    },
    [daysOptions],
  );

  useEffect(() => {
    const preview = [];
    daysDraft.forEach((day) => {
      const dayName = getDayNameById(day.dayId);
      day.muscles.forEach((muscle) => {
        const muscleName =
          muscles.find((m) => m.id === muscle.muscleId)?.nameEn ||
          `Muscle ${muscle.muscleId}`;
        muscle.exercises.forEach((exercise) => {
          const ex = exercises.find((e) => e.id === exercise.exerciseId);
          preview.push({
            id: `${day.dayId}-${muscle.muscleId}-${exercise.exerciseId}-${Date.now()}`,
            dayId: day.dayId,
            dayName,
            muscleId: muscle.muscleId,
            muscleName,
            exerciseId: exercise.exerciseId,
            exerciseName: ex?.nameEn || `Exercise ${exercise.exerciseId}`,
            rounds: exercise.rounds,
            oneRoundCount: exercise.oneRoundCount,
          });
        });
      });
    });
    setDraftPreview(preview);
  }, [daysDraft, muscles, exercises, getDayNameById]);

  const getCleanToken = async () => {
    const token = await handleGetToken();
    if (!token) return null;
    return token.startsWith("Bearer ") ? token.replace("Bearer ", "") : token;
  };

  const fetchPTUsers = async () => {
    try {
      const token = await getCleanToken();
      const ptUserId = await AsyncStorage.getItem("MemberId");
      if (!token || !ptUserId) return;
      const res = await fetch(
        `https://gym.useitsmart.com/api/PT/GetAllUserForPT?userId=${ptUserId}`,
        {
          method: "GET",
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
          if (data.length > 0)
            setSelectedUserId(data[0].memberShipId.toString());
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMuscles = async () => {
    try {
      const token = await getCleanToken();
      if (!token) return;
      const res = await fetch(
        "https://gym.useitsmart.com/api/Muscles/getallMuscles?gymsId=3",
        {
          method: "GET",
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setMuscles(Array.isArray(data) ? data : data?.result || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExercisesData = async () => {
    try {
      const token = await getCleanToken();
      if (!token) return;
      const res = await fetch(
        "https://gym.useitsmart.com/api/Exercises/getallExercises",
        {
          method: "GET",
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setExercises(Array.isArray(data) ? data : data?.result || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedMuscleId && exercises.length > 0)
      setFilteredExercises(
        exercises.filter((e) => e.musclesId === parseInt(selectedMuscleId)),
      );
    else setFilteredExercises([]);
  }, [selectedMuscleId, exercises]);

  const fetchExerciseSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getCleanToken();
      const userId = await AsyncStorage.getItem("MemberId");
      if (!token) {
        Alert.alert("Error", t.errors.authNotFound);
        return;
      }
      if (!userId) {
        Alert.alert("Error", t.errors.userNotFound);
        return;
      }
      const res = await fetch(
        `https://gym.useitsmart.com/api/MSSMExercises/getallMSSMExersesforPT?userId=${userId}`,
        {
          method: "GET",
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (res.status === 401) {
        Alert.alert("Session Expired", "Please login again.");
        return;
      }
      if (res.status === 403) {
        Alert.alert("Access Denied", "You don't have permission.");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const responseData = await res.json();
      if (responseData?.users && Array.isArray(responseData.users)) {
        const all = [];
        responseData.users.forEach((userData) => {
          if (userData?.days && Array.isArray(userData.days)) {
            userData.days.forEach((day) => {
              if (!day.muscles) return;
              day.muscles.forEach((muscle) => {
                if (!muscle.exercises) return;
                muscle.exercises.forEach((exercise) => {
                  all.push({
                    id: `${userData.userId}-${day.dayId}-${muscle.muscleId}-${exercise.exerciseId}-${Date.now()}-${Math.random()}`,
                    dayId: day.dayId,
                    dayName: day.dayName || getDayNameById(day.dayId),
                    muscleId: muscle.muscleId,
                    muscleName: muscle.muscleName,
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    rounds: exercise.rounds,
                    oneRoundCount: exercise.oneRoundCount,
                    from: userData.from,
                    to: userData.to,
                    userId: userData.userId,
                    userName:
                      userData.userNameEn ||
                      userData.userNameAr ||
                      `User ${userData.userId}`,
                    scheduleMusclesId: userData.scheduleMusclesId,
                    gymId: responseData.gymId,
                  });
                });
              });
            });
          }
        });
        setExerciseSchedules(all);
      } else {
        setExerciseSchedules([]);
      }
    } catch (err) {
      setError("Failed to load exercise schedules");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getDayNameById]);

  useEffect(() => {
    fetchExerciseSchedules();
    fetchMuscles();
    fetchExercisesData();
    fetchPTUsers();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const handleAddExercise = () => {
    if (
      !selectedMuscleId ||
      !selectedExerciseId ||
      !selectedDayId ||
      !rounds ||
      !oneRoundCount
    ) {
      Alert.alert("Error", t.errors.fillAll);
      return;
    }
    const muscleId = parseInt(selectedMuscleId),
      exerciseId = parseInt(selectedExerciseId);
    const dayId = parseInt(selectedDayId),
      roundsNum = parseInt(rounds),
      repsNum = parseInt(oneRoundCount);
    const newDraft = [...daysDraft];
    if (editingDraftId) {
      newDraft.forEach((day) =>
        day.muscles.forEach((muscle) =>
          muscle.exercises.forEach((ex) => {
            if (
              `${day.dayId}-${muscle.muscleId}-${ex.exerciseId}` ===
              editingDraftId
            ) {
              ex.rounds = roundsNum;
              ex.oneRoundCount = repsNum;
            }
          }),
        ),
      );
      setDaysDraft(newDraft);
      Alert.alert("Success", t.success.updated);
      setEditingDraftId(null);
    } else {
      const existingDayIdx = newDraft.findIndex((d) => d.dayId === dayId);
      if (existingDayIdx !== -1) {
        const existingMuscleIdx = newDraft[existingDayIdx].muscles.findIndex(
          (m) => m.muscleId === muscleId,
        );
        if (existingMuscleIdx !== -1) {
          if (
            newDraft[existingDayIdx].muscles[existingMuscleIdx].exercises.some(
              (e) => e.exerciseId === exerciseId,
            )
          ) {
            Alert.alert("Info", t.errors.alreadyAdded);
            return;
          }
          newDraft[existingDayIdx].muscles[existingMuscleIdx].exercises.push({
            exerciseId,
            rounds: roundsNum,
            oneRoundCount: repsNum,
          });
        } else {
          newDraft[existingDayIdx].muscles.push({
            muscleId,
            exercises: [
              { exerciseId, rounds: roundsNum, oneRoundCount: repsNum },
            ],
          });
        }
      } else {
        newDraft.push({
          dayId,
          muscles: [
            {
              muscleId,
              exercises: [
                { exerciseId, rounds: roundsNum, oneRoundCount: repsNum },
              ],
            },
          ],
        });
      }
      setDaysDraft(newDraft);
      Alert.alert("Success", t.success.added);
    }
    setRounds("");
    setOneRoundCount("");
    setSelectedMuscleId("");
    setSelectedExerciseId("");
    if (daysOptions.length > 0) setSelectedDayId(daysOptions[0].id.toString());
  };

  const handleEditDraft = (item) => {
    setEditingDraftId(`${item.dayId}-${item.muscleId}-${item.exerciseId}`);
    setSelectedDayId(item.dayId.toString());
    setSelectedMuscleId(item.muscleId.toString());
    setSelectedExerciseId(item.exerciseId.toString());
    setRounds(item.rounds.toString());
    setOneRoundCount(item.oneRoundCount.toString());
  };

  const removeFromDraft = (index) => {
    const newDraft = [...daysDraft];
    const item = draftPreview[index];
    if (
      editingDraftId === `${item.dayId}-${item.muscleId}-${item.exerciseId}`
    ) {
      setEditingDraftId(null);
      resetForm();
    }
    newDraft.forEach((day, di) => {
      if (day.dayId === item.dayId) {
        day.muscles.forEach((muscle, mi) => {
          if (muscle.muscleId === item.muscleId) {
            muscle.exercises = muscle.exercises.filter(
              (e) => e.exerciseId !== item.exerciseId,
            );
            if (muscle.exercises.length === 0)
              newDraft[di].muscles.splice(mi, 1);
          }
        });
        if (day.muscles.length === 0) newDraft.splice(di, 1);
      }
    });
    setDaysDraft(newDraft);
    Alert.alert("Removed", t.success.removed);
  };

  const clearDraft = () => {
    setDaysDraft([]);
    setDraftPreview([]);
    Alert.alert("Cleared", t.success.cleared);
  };
  const cancelEditDraft = () => {
    setEditingDraftId(null);
    resetForm();
    Alert.alert("Cancelled", t.success.cancelledEdit);
  };

  const handleSaveSchedule = async () => {
    if (!selectedUserId || daysDraft.length === 0) {
      Alert.alert("Error", t.errors.noSchedule);
      return;
    }
    try {
      setAddingExercise(true);
      const token = await handleGetToken();
      const res = await fetch("https://gym.useitsmart.com/api/MSSMExercises", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: Number(selectedUserId),
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          days: daysDraft,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      Alert.alert("Success", t.success.saved);
      setDaysDraft([]);
      setDraftPreview([]);
      setShowAddModal(false);
      resetForm();
      fetchExerciseSchedules();
    } catch (err) {
      Alert.alert("Error", `${t.errors.saveFailed}: ${err.message}`);
    } finally {
      setAddingExercise(false);
    }
  };

  const handleDeleteExercise = (exercise) => {
    Alert.alert(
      t.confirm.delete,
      `${t.confirm.sure} ${exercise.exerciseName}?`,
      [
        { text: t.confirm.cancel, style: "cancel" },
        {
          text: t.confirm.delete2,
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getCleanToken();
              if (!token) {
                Alert.alert("Error", t.errors.authNotFound);
                return;
              }
              const res = await fetch(
                `https://gym.useitsmart.com/api/MSSMExercises/${exercise.id}`,
                {
                  method: "DELETE",
                  headers: {
                    accept: "text/plain",
                    Authorization: `Bearer ${token}`,
                  },
                },
              );
              if (res.ok) {
                setExerciseSchedules((prev) =>
                  prev.filter((i) => i.id !== exercise.id),
                );
                Alert.alert("Success", t.success.deleted);
              } else throw new Error(`HTTP ${res.status}`);
            } catch {
              Alert.alert("Error", t.errors.deleteFailed);
            }
          },
        },
      ],
    );
  };

  const handleEditExercise = async (exercise) => {
    setEditingExercise(exercise);
    setEditRounds(exercise.rounds.toString());
    setEditReps(exercise.oneRoundCount.toString());
    setEditSelectedMuscleId(exercise.muscleId?.toString() || "");
    setEditSelectedExerciseId(exercise.exerciseId?.toString() || "");
    const matchDay = daysOptions.find(
      (d) =>
        d.id.toString() === exercise.dayId?.toString() ||
        d.name === exercise.dayName,
    );
    setEditSelectedDayId(
      matchDay ? matchDay.id.toString() : daysOptions[0]?.id.toString() || "",
    );
    if (exercise.from) setEditFromDate(new Date(exercise.from));
    if (exercise.to) setEditToDate(new Date(exercise.to));
    setShowEditModal(true);
  };

  const updateExerciseAPI = async () => {
    if (!editingExercise) return;
    try {
      const token = await getCleanToken();
      if (!token) {
        Alert.alert("Error", t.errors.authNotFound);
        return;
      }
      const scheduleMusclesId =
        editingExercise.scheduleMusclesId ||
        editingExercise.memberShipsScheduleId;
      if (!scheduleMusclesId) {
        Alert.alert("Error", "Schedule ID not found.");
        return;
      }
      const res = await fetch(
        "https://gym.useitsmart.com/api/MSSMExercises/CreateMSSMExercisesForschedule",
        {
          method: "POST",
          headers: {
            accept: "text/plain",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rounds: parseInt(editRounds) || editingExercise.rounds,
            oneRoundCount: parseInt(editReps) || editingExercise.oneRoundCount,
            exercisesId: parseInt(
              editSelectedExerciseId || editingExercise.exerciseId,
            ),
            memberShipsScheduleId: scheduleMusclesId,
            userId: editingExercise.userId,
            musclesId: parseInt(
              editSelectedMuscleId || editingExercise.muscleId,
            ),
            dayId: parseInt(editSelectedDayId || editingExercise.dayId),
          }),
        },
      );
      if (res.ok) {
        Alert.alert("Success", t.success.editUpdated);
        setShowEditModal(false);
        setEditingExercise(null);
        setEditSelectedMuscleId("");
        setEditSelectedExerciseId("");
        setEditSelectedDayId("");
        fetchExerciseSchedules();
      } else {
        const txt = await res.text();
        Alert.alert("Error", `Failed to update: ${txt}`);
      }
    } catch {
      Alert.alert("Error", t.errors.updateFailed);
    }
  };

  useEffect(() => {
    if (editSelectedMuscleId && exercises.length > 0)
      setFilteredExercises(
        exercises.filter((e) => e.musclesId === parseInt(editSelectedMuscleId)),
      );
    else setFilteredExercises([]);
  }, [editSelectedMuscleId, exercises]);

  const resetForm = () => {
    setRounds("");
    setOneRoundCount("");
    setSelectedMuscleId("");
    setSelectedExerciseId("");
    setSelectedDayId(
      daysOptions.length > 0 ? daysOptions[0].id.toString() : "",
    );
    setFromDate(new Date());
    setToDate(new Date());
    if (users.length > 0) setSelectedUserId(users[0].memberShipId.toString());
    setEditingDraftId(null);
  };

  const getMuscleColor = (name) =>
    ({
      Chest: "#FF6B6B",
      Biceps: "#4ECDC4",
      Triceps: "#FFD166",
      Back: "#06D6A0",
      Legs: "#118AB2",
      Shoulders: "#EF476F",
      Core: "#073B4C",
    })[name] || "#8A8A8A";

  // ── Dropdown helper ────────────────────────────────────────────────────────

  const DropdownModal = ({
    visible,
    onClose,
    items,
    onSelect,
    selectedId,
    labelKey = "name",
  }) => {
    const [search, setSearch] = useState("");

    // ✅ Filter items based on search
    const filteredItems = useMemo(() => {
      if (!search.trim()) return items;

      return items.filter((item) => {
        const text =
          item[labelKey] ||
          item.nameEn ||
          item.nameAr ||
          item.membershipName ||
          "";

        return text.toLowerCase().includes(search.toLowerCase());
      });
    }, [search, items]);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={S.dropdownOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View
            style={[S.dropdownListContainer, { backgroundColor: d.dropdownBg }]}
          >
            {/* ✅ SEARCH INPUT */}
            <View style={S.searchContainer}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                placeholderTextColor="#999"
                style={S.searchInput}
              />
            </View>

            {/* ✅ LIST */}
            <ScrollView
              style={S.dropdownScroll}
              keyboardShouldPersistTaps="handled"
            >
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TouchableOpacity
                    key={item.id ?? item.memberShipId}
                    style={[
                      rowStyle,
                      S.dropdownItem,
                      { borderBottomColor: d.dropdownBorder },
                    ]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        S.dropdownItemText,
                        txtAlign,
                        { color: d.text, flex: 1 },
                      ]}
                    >
                      {item[labelKey] ||
                        item.nameEn ||
                        item.nameAr ||
                        item.membershipName}
                    </Text>

                    {selectedId ===
                      (item.id ?? item.memberShipId)?.toString() && (
                      <Text style={S.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ textAlign: "center", padding: 10 }}>
                  No results
                </Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderExerciseItem = ({ item }) => (
    <View
      style={[
        S.exerciseCard,
        { backgroundColor: d.surface, borderColor: d.border },
      ]}
    >
      <View style={[rowStyle, S.exerciseHeader]}>
        <Text style={[S.exerciseName, txtAlign, { color: d.text }]}>
          {item.exerciseName}
        </Text>
        <View
          style={[
            S.muscleBadge,
            { backgroundColor: getMuscleColor(item.muscleName) },
          ]}
        >
          <Text style={S.muscleText}>{item.muscleName}</Text>
        </View>
      </View>
      <View style={S.exerciseDetails}>
        {[
          { label: t.roundsDetail, value: item.rounds },
          { label: t.repsDetail, value: item.oneRoundCount },
          { label: t.dayDetail, value: item.dayName },
        ].map(({ label, value }, i) => (
          <View
            key={i}
            style={[
              rowStyle,
              S.detailRow,
              { flexDirection: isAr ? "row-reverse" : "row" },
            ]}
          >
            <Text
              style={[
                S.detailLabel,
                { color: d.textSub, textAlign: isAr ? "right" : "left" },
              ]}
            >
              {label}:{" "}
            </Text>
            <Text
              style={[
                S.detailValue,
                txtAlign,
                { color: d.text, textAlign: isAr ? "right" : "left" },
              ]}
            >
              {value}
            </Text>
          </View>
        ))}
        <View
          style={[
            rowStyle,
            S.dateRow,
            { flexDirection: isAr ? "row-reverse" : "row" },
          ]}
        >
          {[
            { label: t.from, value: formatDate(item.from) },
            { label: t.to, value: formatDate(item.to) },
          ].map(({ label, value }, i) => (
            <View key={i} style={S.dateContainer}>
              <Text
                style={[
                  S.dateLabel,
                  { color: d.textSub, textAlign: isAr ? "right" : "left" },
                ]}
              >
                {label}:
              </Text>
              <Text
                style={[
                  S.dateValue,
                  { color: d.text, textAlign: isAr ? "right" : "left" },
                ]}
              >
                {value}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[rowStyle, S.exerciseActions, { borderTopColor: d.border }]}>
        <TouchableOpacity
          style={[S.actionButton, S.editButtonCard]}
          onPress={() => handleEditExercise(item)}
        >
          <Text style={[S.actionButtonText, txtAlign]}>{t.addToMuscle}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderClientCard = ({ item }) => {
    const clientExercises = exerciseSchedules.filter(
      (ex) => ex.userId === item.memberShipId,
    );
    const isExpanded = expandedClients[item.memberShipId] || false;
    return (
      <View style={[S.clientCard, { backgroundColor: d.surface }]}>
        <TouchableOpacity
          style={[rowStyle, S.clientHeader]}
          onPress={() => toggleClient(item.memberShipId)}
        >
          <View style={[rowStyle]}>
            <Image source={{ uri: item.photoUrl }} style={S.clientAvatar} />
            <Text style={[S.clientName, txtAlign, { color: d.text }]}>
              {item.membershipName}
            </Text>
          </View>
          <Text style={[S.arrow, { color: d.textSub }]}>
            {isExpanded ? "▲" : "▼"}
          </Text>
        </TouchableOpacity>
        {isExpanded && clientExercises.length > 0 && (
          <FlatList
            data={clientExercises}
            renderItem={renderExerciseItem}
            keyExtractor={(ex) => ex.id.toString()}
            scrollEnabled={false}
            contentContainerStyle={{ paddingVertical: 5 }}
          />
        )}
        {isExpanded && clientExercises.length === 0 && (
          <Text style={[S.noExercisesText, txtAlign, { color: d.textSub }]}>
            {t.noExercises}
          </Text>
        )}
      </View>
    );
  };

  if (loading && !refreshing)
    return (
      <View style={[S.loadingContainer, { backgroundColor: d.bg }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={[S.loadingText, txtAlign, { color: d.textSub }]}>
          {t.loading}
        </Text>
      </View>
    );

  return (
    <View style={[S.container, { backgroundColor: d.bg }]}>
      {/* Header */}
      <View style={S.header}>
        <Text style={[S.headerTitle, txtAlign]}>{t.title}</Text>
        <Text style={[S.headerSubtitle, txtAlign]}>{t.subtitle}</Text>
        <View style={[rowStyle, S.userInfoRow]}>
          <Text style={S.exerciseCount}>
            {t.totalExercises}: {exerciseSchedules.length}
          </Text>
          <Text style={S.clientCount}>
            {users.length > 0 ? `${users.length} ${t.clients}` : t.noClients}
          </Text>
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={renderClientCard}
        keyExtractor={(item) => item.memberShipId.toString()}
        contentContainerStyle={S.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchExerciseSchedules();
        }}
      />

      <TouchableOpacity
        style={[S.fab, isRTL && { right: "auto" as any, left: 30 }]}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Text style={S.fabText}>+</Text>
      </TouchableOpacity>

      {/* ── ADD MODAL ── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={S.modalOverlay}>
          <View style={[S.modalContent, { backgroundColor: d.modalBg }]}>
            <View
              style={[
                rowStyle,
                S.modalHeader,
                { borderBottomColor: d.modalHeaderBorder },
              ]}
            >
              <Text style={[S.modalTitle, txtAlign, { color: d.text }]}>
                {t.createSchedule}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={[S.closeButton, { color: d.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Select Client */}
              {users.length > 0 && (
                <View style={S.inputGroup}>
                  <Text style={[S.inputLabel, txtAlign, { color: d.text }]}>
                    {t.selectClient}
                  </Text>
                  <TouchableOpacity
                    style={[
                      rowStyle,
                      S.customDropdown,
                      { backgroundColor: d.surface, borderColor: d.border3 },
                    ]}
                    onPress={() => {
                      setShowMuscleDropdown(false);
                      setShowExerciseDropdown(false);
                      setShowUserDropdown(!showUserDropdown);
                    }}
                  >
                    <Text
                      style={[
                        S.dropdownText,
                        !selectedUserId && S.placeholderText,
                        txtAlign,
                        { color: selectedUserId ? d.text : d.textMuted },
                      ]}
                    >
                      {selectedUserId
                        ? users.find(
                            (u) => u.memberShipId.toString() === selectedUserId,
                          )?.membershipName || `User ${selectedUserId}`
                        : t.tapToSelect}
                    </Text>
                    <Text style={[S.dropdownArrow, { color: d.textSub }]}>
                      {showUserDropdown ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>
                  <DropdownModal
                    visible={showUserDropdown}
                    onClose={() => setShowUserDropdown(false)}
                    items={users}
                    selectedId={selectedUserId}
                    onSelect={(user) =>
                      setSelectedUserId(user.memberShipId.toString())
                    }
                    labelKey="membershipName"
                  />
                </View>
              )}

              {/* Draft Preview */}
              {draftPreview.length > 0 && (
                <View
                  style={[
                    S.draftPreviewSection,
                    { backgroundColor: d.draftBg, borderColor: d.draftBorder },
                  ]}
                >
                  <View style={[rowStyle, S.draftPreviewHeader]}>
                    <Text
                      style={[S.draftPreviewTitle, txtAlign, { color: d.text }]}
                    >
                      {editingDraftId
                        ? t.editingExercise
                        : `${t.draft} (${draftPreview.length} ${t.exercises})`}
                    </Text>
                    <View style={[rowStyle, { gap: 10 }]}>
                      {editingDraftId && (
                        <TouchableOpacity
                          onPress={cancelEditDraft}
                          style={[
                            S.cancelEditButton,
                            {
                              backgroundColor: d.cancelEditBg,
                              borderColor: d.cancelEditBorder,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              S.cancelEditText,
                              txtAlign,
                              { color: d.cancelEditText },
                            ]}
                          >
                            {t.cancelEdit}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={clearDraft}
                        style={[
                          S.clearDraftButton,
                          { backgroundColor: d.clearDraftBg },
                        ]}
                      >
                        <Text
                          style={[
                            S.clearDraftText,
                            txtAlign,
                            { color: d.clearDraftText },
                          ]}
                        >
                          {t.clearAll}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {editingDraftId && (
                    <View
                      style={[
                        S.editingIndicator,
                        {
                          backgroundColor: d.editingIndicatorBg,
                          borderColor: d.editingIndicatorBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          S.editingText,
                          txtAlign,
                          { color: d.editingIndicatorText },
                        ]}
                      >
                        {t.editingMode}
                      </Text>
                    </View>
                  )}
                  <View style={S.draftPreviewList}>
                    {draftPreview.map((item, index) => {
                      const currentId = `${item.dayId}-${item.muscleId}-${item.exerciseId}`;
                      const isEditing = editingDraftId === currentId;
                      return (
                        <View
                          key={item.id}
                          style={[
                            rowStyle,
                            S.draftItem,
                            {
                              backgroundColor: d.surface,
                              borderColor: d.border,
                            },
                            isEditing && {
                              backgroundColor: d.editingBg,
                              borderColor: d.editingBorder,
                              borderWidth: 2,
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={[rowStyle, { marginBottom: 4 }]}>
                              <Text
                                style={[
                                  S.draftExerciseName,
                                  txtAlign,
                                  { color: d.text },
                                ]}
                              >
                                {item.exerciseName}
                                {isEditing ? " (Editing)" : ""}
                              </Text>
                              <View style={[rowStyle, { gap: 5 }]}>
                                <View
                                  style={[
                                    S.dayBadge,
                                    dark && { backgroundColor: "#1E3A5F" },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      S.dayBadgeText,
                                      dark && { color: "#93C5FD" },
                                    ]}
                                  >
                                    {item.dayName}
                                  </Text>
                                </View>
                                <View
                                  style={[
                                    S.muscleBadgeSmall,
                                    {
                                      backgroundColor: getMuscleColor(
                                        item.muscleName,
                                      ),
                                    },
                                  ]}
                                >
                                  <Text style={S.muscleBadgeTextSmall}>
                                    {item.muscleName}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <Text
                              style={[
                                S.draftDetail,
                                txtAlign,
                                { color: d.textSub },
                              ]}
                            >
                              {item.rounds} {t.sets} × {item.oneRoundCount}{" "}
                              {t.repsLabel}
                            </Text>
                          </View>
                          <View style={[rowStyle, { gap: 5 }]}>
                            <TouchableOpacity
                              onPress={() => handleEditDraft(item)}
                              style={[
                                S.editDraftButton,
                                {
                                  backgroundColor: d.surface2,
                                  borderColor: d.draftBorder,
                                },
                              ]}
                              disabled={isEditing}
                            >
                              <Text
                                style={[
                                  S.editDraftText,
                                  { color: d.text },
                                  isEditing && { color: d.textMuted },
                                ]}
                              >
                                {isEditing ? t.editing : "✏️"}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => removeFromDraft(index)}
                              style={S.removeDraftButton}
                            >
                              <Text style={S.removeDraftText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Add Exercise Section */}
              <View
                style={[
                  S.addMoreSection,
                  { backgroundColor: d.addMoreBg, borderColor: d.border2 },
                ]}
              >
                <Text
                  style={[
                    S.sectionTitle,
                    { color: d.text, textAlign: isAr ? "right" : "left" },
                  ]}
                >
                  {t.addExercise}
                </Text>

                {/* Day */}
                <View style={S.inputGroup}>
                  <Text
                    style={[
                      S.inputLabel,
                      { color: d.text, textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {t.trainingDay}
                  </Text>
                  <View
                    style={[
                      S.daySelection,
                      isRTL && { flexDirection: "row-reverse" },
                    ]}
                  >
                    {daysOptions.map((day) => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          S.dayButton,
                          { backgroundColor: d.dayBtnBg },
                          selectedDayId === day.id.toString() &&
                            S.selectedDayButton,
                        ]}
                        onPress={() => setSelectedDayId(day.id.toString())}
                      >
                        <Text
                          style={[
                            S.dayButtonText,
                            { color: d.dayBtnText },
                            selectedDayId === day.id.toString() &&
                              S.selectedDayButtonText,
                          ]}
                          numberOfLines={1}
                        >
                          {day.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Muscle */}
                <View style={S.inputGroup}>
                  <Text
                    style={[
                      S.inputLabel,
                      { color: d.text, textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {t.muscleGroup}
                  </Text>
                  <TouchableOpacity
                    style={[
                      rowStyle,
                      S.customDropdown,
                      { backgroundColor: d.surface, borderColor: d.border3 },
                    ]}
                    onPress={() => {
                      setShowUserDropdown(false);
                      setShowExerciseDropdown(false);
                      setShowMuscleDropdown(!showMuscleDropdown);
                    }}
                  >
                    <Text
                      style={[
                        S.dropdownText,
                        !selectedMuscleId && S.placeholderText,
                        {
                          color: selectedMuscleId ? d.text : d.textMuted,
                          textAlign: isAr ? "right" : "left",
                        },
                      ]}
                    >
                      {selectedMuscleId
                        ? muscles.find(
                            (m) => m.id.toString() === selectedMuscleId,
                          )?.nameEn || t.tapToSelectMuscle
                        : t.tapToSelectMuscle}
                    </Text>
                    <Text style={[S.dropdownArrow, { color: d.textSub }]}>
                      {showMuscleDropdown ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>
                  <DropdownModal
                    visible={showMuscleDropdown}
                    onClose={() => setShowMuscleDropdown(false)}
                    items={muscles}
                    selectedId={selectedMuscleId}
                    onSelect={(m) => {
                      setSelectedMuscleId(m.id.toString());
                      setSelectedExerciseId("");
                    }}
                    labelKey="nameEn"
                  />
                </View>

                {/* Exercise */}
                <View style={S.inputGroup}>
                  <Text
                    style={[
                      S.inputLabel,
                      { color: d.text, textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {t.selectExercise}
                  </Text>
                  {!selectedMuscleId ? (
                    <View
                      style={[
                        S.disabledDropdown,
                        {
                          backgroundColor: d.disabledBg,
                          borderColor: d.border2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          S.disabledText,
                          {
                            color: d.textMuted,
                            textAlign: isAr ? "right" : "left",
                          },
                        ]}
                      >
                        {t.selectMuscleFirst}
                      </Text>
                    </View>
                  ) : filteredExercises.length === 0 ? (
                    <View
                      style={[
                        S.disabledDropdown,
                        {
                          backgroundColor: d.disabledBg,
                          borderColor: d.border2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          S.disabledText,
                          {
                            color: d.textMuted,
                            textAlign: isAr ? "right" : "left",
                          },
                        ]}
                      >
                        {t.noExercisesForMuscle}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[
                          rowStyle,
                          S.customDropdown,
                          {
                            backgroundColor: d.surface,
                            borderColor: d.border3,
                          },
                        ]}
                        onPress={() => {
                          setShowUserDropdown(false);
                          setShowMuscleDropdown(false);
                          setShowExerciseDropdown(!showExerciseDropdown);
                        }}
                      >
                        <Text
                          style={[
                            S.dropdownText,
                            !selectedExerciseId && S.placeholderText,
                            {
                              color: selectedExerciseId ? d.text : d.textMuted,
                              textAlign: isAr ? "right" : "left",
                            },
                          ]}
                        >
                          {selectedExerciseId
                            ? filteredExercises.find(
                                (e) => e.id.toString() === selectedExerciseId,
                              )?.nameEn || t.tapToSelectExer
                            : t.tapToSelectExer}
                        </Text>
                        <Text style={[S.dropdownArrow, { color: d.textSub }]}>
                          {showExerciseDropdown ? "▲" : "▼"}
                        </Text>
                      </TouchableOpacity>
                      <DropdownModal
                        visible={showExerciseDropdown}
                        onClose={() => setShowExerciseDropdown(false)}
                        items={filteredExercises}
                        selectedId={selectedExerciseId}
                        onSelect={(ex) =>
                          setSelectedExerciseId(ex.id.toString())
                        }
                        labelKey="nameEn"
                      />
                    </>
                  )}
                </View>

                {/* Rounds & Reps */}
                <View style={[rowStyle, { gap: 10 }]}>
                  {[
                    {
                      label: t.rounds,
                      val: rounds,
                      set: setRounds,
                      ph: t.setsPlaceholder,
                    },
                    {
                      label: t.reps,
                      val: oneRoundCount,
                      set: setOneRoundCount,
                      ph: t.repsPlaceholder,
                    },
                  ].map(({ label, val, set, ph }, i) => (
                    <View key={i} style={{ flex: 1 }}>
                      <Text
                        style={[
                          S.inputLabel,
                          { color: d.text, textAlign: isAr ? "right" : "left" },
                        ]}
                      >
                        {label}
                      </Text>
                      <TextInput
                        style={[
                          S.input,
                          {
                            backgroundColor: d.inputBg,
                            borderColor: d.border2,
                            color: d.text,
                            textAlign: isAr ? "right" : "left",
                          },
                        ]}
                        value={val}
                        onChangeText={set}
                        placeholder={ph}
                        placeholderTextColor={d.textMuted}
                        keyboardType="numeric"
                        textAlign={isAr ? "right" : "left"}
                      />
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    S.addToDraftButton,
                    (!selectedMuscleId ||
                      !selectedExerciseId ||
                      !selectedDayId ||
                      !rounds ||
                      !oneRoundCount) &&
                      S.disabledButton,
                    editingDraftId && S.updateButton,
                  ]}
                  onPress={handleAddExercise}
                  disabled={
                    !selectedMuscleId ||
                    !selectedExerciseId ||
                    !selectedDayId ||
                    !rounds ||
                    !oneRoundCount
                  }
                >
                  <Text
                    style={[
                      S.addToDraftButtonText,
                      { textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {editingDraftId ? t.updateDraft : t.addToDraft}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View
              style={[
                rowStyle,
                S.modalActions,
                { borderTopColor: d.modalActionsBorder },
              ]}
            >
              <TouchableOpacity
                style={[
                  S.modalButton,
                  S.cancelButton,
                  { backgroundColor: dark ? "#1E293B" : "#F0F0F0" },
                ]}
                onPress={() => setShowAddModal(false)}
              >
                <Text
                  style={[
                    S.cancelButtonText,
                    { color: d.textSub, textAlign: isAr ? "right" : "left" },
                  ]}
                >
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  S.modalButton,
                  S.saveButton,
                  (daysDraft.length === 0 || addingExercise) &&
                    S.disabledButton,
                ]}
                onPress={handleSaveSchedule}
                disabled={daysDraft.length === 0 || addingExercise}
              >
                {addingExercise ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={[
                      S.saveButtonText,
                      { textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {t.saveSchedule} ({draftPreview.length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingExercise(null);
        }}
      >
        <View style={S.modalOverlay}>
          <View
            style={[
              S.modalContent,
              S.editModalContent,
              { backgroundColor: d.modalBg },
            ]}
          >
            <View
              style={[
                rowStyle,
                S.modalHeader,
                { borderBottomColor: d.modalHeaderBorder },
              ]}
            >
              <Text
                style={[
                  S.modalTitle,
                  { color: d.text, textAlign: isAr ? "right" : "left" },
                ]}
              >
                {t.editExercise}: {editingExercise?.exerciseName}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setEditingExercise(null);
                }}
              >
                <Text style={[S.closeButton, { color: d.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {editingExercise && (
                <>
                  <View
                    style={[
                      S.exerciseSummary,
                      {
                        backgroundColor: d.summaryBg,
                        borderColor: d.draftBorder,
                      },
                    ]}
                  >
                    {[
                      {
                        label: t.currentExercise,
                        value: editingExercise.exerciseName,
                      },
                      {
                        label: t.currentClient,
                        value: editingExercise.userName,
                      },
                      {
                        label: t.currentMuscle,
                        value: editingExercise.muscleName,
                      },
                      { label: t.currentDay, value: editingExercise.dayName },
                    ].map(({ label, value }, i) => (
                      <View
                        key={i}
                        style={[
                          rowStyle,
                          S.summaryRow,
                          { flexDirection: isAr ? "row-reverse" : "row" },
                        ]}
                      >
                        <Text
                          style={[
                            S.summaryLabel,
                            {
                              color: d.textSub,
                              textAlign: isAr ? "right" : "left",
                            },
                          ]}
                        >
                          {label}:
                        </Text>
                        <Text
                          style={[
                            S.summaryValue,
                            {
                              color: d.text,
                              textAlign: isAr ? "right" : "left",
                            },
                          ]}
                        >
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {[
                    { label: t.rounds, val: editRounds, set: setEditRounds },
                    { label: t.reps, val: editReps, set: setEditReps },
                  ].map(({ label, val, set }, i) => (
                    <View key={i} style={S.inputGroup}>
                      <Text
                        style={[
                          S.inputLabel,
                          { color: d.text, textAlign: isAr ? "right" : "left" },
                        ]}
                      >
                        {label}
                      </Text>
                      <TextInput
                        style={[
                          S.input,
                          {
                            backgroundColor: d.inputBg,
                            borderColor: d.border2,
                            color: d.text,
                            textAlign: isAr ? "right" : "left",
                          },
                        ]}
                        value={val}
                        onChangeText={set}
                        keyboardType="numeric"
                        textAlign={isRTL ? "right" : "left"}
                      />
                    </View>
                  ))}

                  {/* Change Muscle */}
                  <View style={S.inputGroup}>
                    <Text
                      style={[
                        S.inputLabel,
                        { color: d.text, textAlign: isAr ? "right" : "left" },
                      ]}
                    >
                      {t.changeMuscle}
                    </Text>
                    <TouchableOpacity
                      style={[
                        rowStyle,
                        S.customDropdown,
                        { backgroundColor: d.surface, borderColor: d.border3 },
                      ]}
                      onPress={() => setShowMuscleDropdown(!showMuscleDropdown)}
                    >
                      <Text style={[S.dropdownText, { color: d.text }]}>
                        {editSelectedMuscleId
                          ? muscles.find(
                              (m) => m.id.toString() === editSelectedMuscleId,
                            )?.nameEn
                          : editingExercise.muscleName || t.tapToSelectMuscle}
                      </Text>
                      <Text style={[S.dropdownArrow, { color: d.textSub }]}>
                        {showMuscleDropdown ? "▲" : "▼"}
                      </Text>
                    </TouchableOpacity>
                    <DropdownModal
                      visible={showMuscleDropdown}
                      onClose={() => setShowMuscleDropdown(false)}
                      items={muscles}
                      selectedId={editSelectedMuscleId}
                      onSelect={(m) => {
                        setEditSelectedMuscleId(m.id.toString());
                        setEditSelectedExerciseId("");
                      }}
                      labelKey="nameEn"
                    />
                  </View>

                  {/* Change Exercise */}
                  <View style={S.inputGroup}>
                    <Text
                      style={[
                        S.inputLabel,
                        { color: d.text, textAlign: isAr ? "right" : "left" },
                      ]}
                    >
                      {t.changeExercise}
                    </Text>
                    {!editSelectedMuscleId ? (
                      <View
                        style={[
                          S.disabledDropdown,
                          {
                            backgroundColor: d.disabledBg,
                            borderColor: d.border2,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            S.disabledText,
                            {
                              color: d.textMuted,
                              textAlign: isAr ? "right" : "left",
                            },
                          ]}
                        >
                          {t.selectMuscleFirst}
                        </Text>
                      </View>
                    ) : filteredExercises.length === 0 ? (
                      <View
                        style={[
                          S.disabledDropdown,
                          {
                            backgroundColor: d.disabledBg,
                            borderColor: d.border2,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            S.disabledText,
                            {
                              color: d.textMuted,
                              textAlign: isAr ? "right" : "left",
                            },
                          ]}
                        >
                          {t.noExercisesForMuscle}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[
                            rowStyle,
                            S.customDropdown,
                            {
                              backgroundColor: d.surface,
                              borderColor: d.border3,
                            },
                          ]}
                          onPress={() =>
                            setShowExerciseDropdown(!showExerciseDropdown)
                          }
                        >
                          <Text
                            style={[
                              S.dropdownText,
                              {
                                color: d.text,
                                textAlign: isAr ? "right" : "left",
                              },
                            ]}
                          >
                            {editSelectedExerciseId
                              ? filteredExercises.find(
                                  (e) =>
                                    e.id.toString() === editSelectedExerciseId,
                                )?.nameEn
                              : editingExercise.exerciseName ||
                                t.tapToSelectExer}
                          </Text>
                          <Text style={[S.dropdownArrow, { color: d.textSub }]}>
                            {showExerciseDropdown ? "▲" : "▼"}
                          </Text>
                        </TouchableOpacity>
                        <DropdownModal
                          visible={showExerciseDropdown}
                          onClose={() => setShowExerciseDropdown(false)}
                          items={filteredExercises}
                          selectedId={editSelectedExerciseId}
                          onSelect={(ex) =>
                            setEditSelectedExerciseId(ex.id.toString())
                          }
                          labelKey="nameEn"
                        />
                      </>
                    )}
                  </View>

                  {/* Change Day */}
                  <View style={S.inputGroup}>
                    <Text
                      style={[
                        S.inputLabel,
                        { color: d.text, textAlign: isAr ? "right" : "left" },
                      ]}
                    >
                      {t.changeDay}
                    </Text>
                    <TouchableOpacity
                      style={[
                        rowStyle,
                        S.customDropdown,
                        { backgroundColor: d.surface, borderColor: d.border3 },
                      ]}
                      onPress={() => setShowDayDropdown(!showDayDropdown)}
                    >
                      <Text
                        style={[
                          S.dropdownText,
                          { color: d.text, textAlign: isAr ? "right" : "left" },
                        ]}
                      >
                        {editSelectedDayId
                          ? daysOptions.find(
                              (d) => d.id.toString() === editSelectedDayId,
                            )?.name
                          : t.selectDay}
                      </Text>
                      <Text style={[S.dropdownArrow, { color: d.textSub }]}>
                        {showDayDropdown ? "▲" : "▼"}
                      </Text>
                    </TouchableOpacity>
                    <DropdownModal
                      visible={showDayDropdown}
                      onClose={() => setShowDayDropdown(false)}
                      items={daysOptions}
                      selectedId={editSelectedDayId}
                      onSelect={(day) =>
                        setEditSelectedDayId(day.id.toString())
                      }
                      labelKey="name"
                    />
                  </View>

                  {/* Update Preview */}
                  <View
                    style={[
                      S.updatePreview,
                      {
                        backgroundColor: d.updatePreviewBg,
                        borderColor: d.updatePreviewBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        S.updatePreviewTitle,
                        txtAlign,
                        {
                          color: d.updatePreviewTitle,
                          textAlign: isAr ? "right" : "left",
                        },
                      ]}
                    >
                      {t.updatePreview}
                    </Text>
                    <View
                      style={{
                        flexDirection: isRTL ? "row-reverse" : "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                      }}
                    >
                      {[
                        {
                          label: t.roundsLabel,
                          value: editRounds || editingExercise.rounds,
                        },
                        {
                          label: t.repsPreview,
                          value: editReps || editingExercise.oneRoundCount,
                        },
                        {
                          label: t.muscleLabel,
                          value: editSelectedMuscleId
                            ? muscles.find(
                                (m) => m.id.toString() === editSelectedMuscleId,
                              )?.nameEn
                            : editingExercise.muscleName,
                        },
                        {
                          label: t.dayLabel,
                          value: editSelectedDayId
                            ? daysOptions.find(
                                (d) => d.id.toString() === editSelectedDayId,
                              )?.name
                            : editingExercise.dayName,
                        },
                      ].map(({ label, value }, i) => (
                        <View
                          key={i}
                          style={[
                            S.previewItem,
                            {
                              backgroundColor: d.previewItemBg,
                              borderColor: d.border2,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              S.previewLabel,
                              txtAlign,
                              {
                                color: d.textSub,
                                textAlign: isAr ? "right" : "left",
                              },
                            ]}
                          >
                            {label}:
                          </Text>
                          <Text
                            style={[
                              S.previewValue,
                              txtAlign,
                              {
                                color: d.previewValue,
                                textAlign: isAr ? "right" : "left",
                              },
                            ]}
                          >
                            {value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View
              style={[
                rowStyle,
                S.modalActions,
                { borderTopColor: d.modalActionsBorder },
              ]}
            >
              <TouchableOpacity
                style={[
                  S.modalButton,
                  S.cancelButton,
                  { backgroundColor: dark ? "#1E293B" : "#F0F0F0" },
                ]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingExercise(null);
                }}
              >
                <Text
                  style={[S.cancelButtonText, txtAlign, { color: d.textSub }]}
                >
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.modalButton, S.saveButton]}
                onPress={updateExerciseAPI}
              >
                <Text style={[S.saveButtonText, txtAlign]}>{t.update}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const S = StyleSheet.create({
  searchContainer: {
    padding: 10,
    borderBottomWidth: 1,
  },

  searchInput: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: "#f1f1f1",
  },
  row: { flexDirection: "row", alignItems: "center" },
  rowRTL: { flexDirection: "row-reverse", alignItems: "center" },
  textLeft: { textAlign: "left" },
  textRight: { textAlign: "right" },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16 },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
    marginTop: 30,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 10,
  },
  userInfoRow: { justifyContent: "space-between" },
  exerciseCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  clientCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listContainer: { padding: 15, paddingBottom: 80 },
  clientCard: {
    marginVertical: 5,
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  clientHeader: { justifyContent: "space-between", paddingVertical: 5 },
  clientName: { fontSize: 16, fontWeight: "bold" },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
    marginRight: 10,
  },
  arrow: { fontSize: 18 },
  noExercisesText: { fontStyle: "italic", paddingTop: 5 },
  exerciseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
  },
  exerciseHeader: { justifyContent: "space-between", marginBottom: 12 },
  exerciseName: { fontSize: 18, fontWeight: "bold", flex: 1 },
  muscleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  muscleText: { fontSize: 12, color: "white", fontWeight: "600" },
  exerciseDetails: { marginBottom: 12 },
  detailRow: { marginBottom: 4 },
  detailLabel: { fontSize: 14, width: 120 },
  detailValue: { fontSize: 14, fontWeight: "500" },
  dateRow: { justifyContent: "space-between", marginTop: 8 },
  dateContainer: { flex: 1 },
  dateLabel: { fontSize: 12 },
  dateValue: { fontSize: 13, fontWeight: "500" },
  exerciseActions: {
    justifyContent: "flex-end",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  editButtonCard: { backgroundColor: "#5f5f5f" },
  actionButtonText: { fontSize: 14, fontWeight: "500", color: "white" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  fabText: { fontSize: 30, color: "white", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 20,
    width: "90%",
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editModalContent: { maxHeight: "90%", width: "95%" },
  modalHeader: {
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", flex: 1 },
  closeButton: { fontSize: 24 },
  modalScrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  modalActions: {
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 15,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: { backgroundColor: "#f0f0f0" },
  saveButton: { backgroundColor: "#4CAF50" },
  disabledButton: { backgroundColor: "#ccc", opacity: 0.7 },
  cancelButtonText: { fontSize: 16, fontWeight: "500" },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "500" },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
  customDropdown: {
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginTop: 6,
  },
  dropdownText: { fontSize: 16, flex: 1 },
  placeholderText: { color: "#999" },
  dropdownArrow: { fontSize: 12, marginLeft: 8 },
  disabledDropdown: { borderWidth: 1, borderRadius: 10, padding: 14 },
  disabledText: {},
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownListContainer: {
    width: "90%",
    maxHeight: 400,
    borderRadius: 12,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownScroll: { maxHeight: 380 },
  dropdownItem: {
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  dropdownItemText: { fontSize: 16, flex: 1 },
  checkmark: { fontSize: 16, color: "#007AFF", fontWeight: "bold" },
  userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: { color: "white", fontSize: 16, fontWeight: "bold" },
  userName: { fontSize: 16, fontWeight: "500", marginBottom: 2 },
  userRole: { fontSize: 12 },
  daySelection: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 70,
    alignItems: "center",
  },
  selectedDayButton: { backgroundColor: "#007AFF" },
  dayButtonText: { fontSize: 14, fontWeight: "500" },
  selectedDayButtonText: { color: "white" },
  draftPreviewSection: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  draftPreviewHeader: { justifyContent: "space-between", marginBottom: 10 },
  draftPreviewTitle: { fontSize: 16, fontWeight: "bold" },
  cancelEditButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  cancelEditText: { fontSize: 12, fontWeight: "500" },
  clearDraftButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearDraftText: { fontSize: 12, fontWeight: "500" },
  editingIndicator: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  editingText: { fontSize: 12, textAlign: "center" },
  draftPreviewList: { maxHeight: 200 },
  draftItem: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    justifyContent: "space-between",
  },
  draftExerciseName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    flex: 1,
  },
  draftDetail: { fontSize: 12 },
  dayBadge: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayBadgeText: { fontSize: 10, color: "#1565c0", fontWeight: "500" },
  muscleBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  muscleBadgeTextSmall: { fontSize: 10, color: "white", fontWeight: "500" },
  editDraftButton: { padding: 8, borderRadius: 6, borderWidth: 1 },
  editDraftText: { fontSize: 14 },
  removeDraftButton: { padding: 8, marginLeft: 10 },
  removeDraftText: { fontSize: 16, color: "#ff5252", fontWeight: "bold" },
  addMoreSection: { borderRadius: 10, padding: 15, borderWidth: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  addToDraftButton: {
    backgroundColor: "#2196f3",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addToDraftButtonText: { color: "white", fontSize: 16, fontWeight: "500" },
  updateButton: { backgroundColor: "#ff9800" },
  exerciseSummary: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  summaryRow: { justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 14, fontWeight: "500" },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  updatePreview: {
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
  },
  updatePreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  previewItem: {
    width: "48%",
    marginBottom: 8,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  previewLabel: { fontSize: 12, marginBottom: 2 },
  previewValue: { fontSize: 14, fontWeight: "bold" },
});

export default MuselsePlanPtList;
