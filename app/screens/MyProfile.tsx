import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  I18nManager,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import Colors from "../constants/Colors";
import { useAppContext } from "../context";
import { handleGetToken } from "../helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../app/localization";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_ENDPOINT, TOKEN } from "../constants";
import { SafeAreaView } from "react-native-safe-area-context";
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, {
  SweetAlertButton,
  SweetAlertType,
} from "../components/SweetAlert";

// ─── RTL helper ───────────────────────────────────────────────────────────────
const isRTL = (): boolean => {
  const locale: string = i18n.locale || "";
  return locale.startsWith("ar") || I18nManager.isRTL;
};

// ─── Theme factory ────────────────────────────────────────────────────────────
// Brand accent: burnt orange (#E8742A) on near-black.
const ACCENT = "#E8742A";
const ACCENT_DEEP = "#8A3F13"; // gradient partner for the membership card
const DANGER = "#FF5F5F";
const SUCCESS = "#59D67C";

const getTheme = (dark: boolean) => ({
  bg: dark ? "#0B0B0A" : "#F6F5F2",
  bgEnd: dark ? "#141210" : "#FFFFFF",
  surface: dark ? "#17150F" : "#FFFFFF",
  surfaceRaised: dark ? "#1F1C15" : "#FBFBF9",
  ink: dark ? "#F5F1EA" : "#1A1A1A",
  muted: dark ? "#8A8681" : "#6B6B66",
  border: dark ? "#2C2820" : "#E7E7E0",
  inputBg: dark ? "#221F17" : "#F2F2EC",
  placeholder: dark ? "#5C574C" : "#A3A39C",
  modalBg: dark ? "#151310" : "#FFFFFF",
  dietText: dark ? "#D6D2C8" : "#333333",
  dietMuted: dark ? "#7A756A" : "#999999",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  accentInk: "#1A0F06",
  danger: DANGER,
  success: SUCCESS,
});

type TabKey = "personal" | "physical" | "subscription";

export default function MyProfileScreen() {
  const { setUserProfile, isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [locale, setLocale] = useState<string>(i18n.locale);
  const rtl = isRTL();

  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [isEditing, setIsEditing] = useState({
    personal: false,
    physical: false,
    subscription: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberIdApi, setMemberIdApi] = useState<string | null>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [dietPlan, setDietPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const navigation = useNavigation();
  const { handleLogout } = useAppContext();

  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

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

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const [personalData, setPersonalData] = useState({
    nameEn: "",
    nameAr: "",
    bio: "",
    dob: "",
    location: "",
    email: "",
    phoneNumber: "",
    photo: "",
    photoUrl: "",
    gender: "",
  });

  const [physicalData, setPhysicalData] = useState({
    height: "",
    weight: "",
    age: "",
    target: "",
    activity_level: "",
    training_days_per_week: "",
    meals_per_day: "",
    notes: "",
  });

  const [subscriptionData, setSubscriptionData] = useState<{
    subscriptionStatus: string;
    expiryDate: string;
    startDate?: string;
    status?: string;
  }>({ subscriptionStatus: "", expiryDate: "" });

  const fetchUserProfile = async () => {
    const MemberId = await AsyncStorage.getItem("MemberId");
    try {
      const response = await fetch(
        `https://gawifit.com/api/MemberShips/MemberShipsforuser/${MemberId}`,
        { method: "GET", headers: { accept: "application/json" } },
      );
      if (!response.ok) throw new Error("Failed to fetch membership");
      const data = await response.json();
      console.log("data", data);
      setMemberIdApi(data.id);
      setAvatarLoadFailed(false);
      setPersonalData({
        nameEn: data.nameEn || "",
        nameAr: data.nameAr || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        photo: "",
        photoUrl: data.photoUrl || "",
        bio: "",
        dob: "",
        location: "",
        gender: data.gender || "",
      });
      setPhysicalData({
        height: data.height_cm?.toString() || "",
        weight: data.weight_kg?.toString() || "",
        age: data.age?.toString() || "",
        target: data.target || "",
        activity_level: data.activity_level || "",
        training_days_per_week: data.training_days_per_week || "",
        meals_per_day: data.meals_per_day || "",
        notes: data.notes || "",
      });
      setSubscriptionData({
        subscriptionStatus: data.isActive ? "Active" : "Inactive",
        expiryDate: formatDate(data.subscriptionExpiryDate),
        startDate: formatDate(data.subscriptionStartDate),
        status: data.status,
      });

      setLoading(false);
    } catch (error) {
      showAlert("error", "Error", "Failed to load membership");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);
  useEffect(() => {
    setLocale(i18n.locale);
  }, [i18n.locale]);

  const handleDeleteAccount = () => {
    showAlert(
      "warning",
      i18n.t("profile.delete_account"),
      i18n.t("profile.delete_account_confirmation"),
      [
        {
          text: i18n.t("profile.cancel"),
          style: "cancel",
        },
        {
          text: i18n.t("profile.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const memberId = await AsyncStorage.getItem("MemberId");
              const token = await AsyncStorage.getItem(TOKEN);

              if (!memberId) {
                showAlert(
                  "error",
                  i18n.t("profile.error"),
                  i18n.t("profile.member_not_found"),
                );
                return;
              }

              const response = await fetch(
                `https://gawifit.com/api/User/deleteUserByEmail?id=${memberId}`,
                {
                  method: "PUT",
                  headers: {
                    Accept: "*/*",
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              const responseText = await response.text();

              console.log("Status:", response.status);
              console.log("Response:", responseText);

              if (!response.ok) {
                throw new Error(i18n.t("profile.delete_failed"));
              }

              await AsyncStorage.clear();

              showAlert(
                "success",
                i18n.t("profile.success"),
                i18n.t("profile.account_deleted"),
              );

              handleLogout();
            } catch (error) {
              console.log(error);
              showAlert(
                "error",
                i18n.t("profile.error"),
                i18n.t("profile.unable_delete_account"),
              );
            }
          },
        },
      ],
    );
  };

  const handleGeneratePlan = async () => {
    if (loadingPlan) return;
    const requiredFields = [
      { key: "age", label: "Age" },
      { key: "height", label: "Height" },
      { key: "weight", label: "Weight" },
      { key: "target", label: "Target" },
      { key: "activity_level", label: "Activity Level" },
      { key: "training_days_per_week", label: "Training Days Per Week" },
      { key: "meals_per_day", label: "Meals Per Day" },
    ];

    const hasEmptyField =
      requiredFields.some(
        ({ key }) =>
          !physicalData[key as keyof typeof physicalData]?.toString().trim(),
      ) || !personalData.gender?.toString().trim();

    if (hasEmptyField) {
      showAlert(
        "warning",
        i18n.locale.startsWith("ar") ? "بيانات ناقصة" : "Missing Information",
        i18n.locale.startsWith("ar")
          ? "يرجى تعبئة جميع بيانات المعلومات الصحية قبل إنشاء الخطة. حقل الملاحظات اختياري."
          : "Please fill in all health information fields before generating a plan. Notes are optional.",
      );
      return;
    }

    try {
      if (!memberIdApi) {
        showAlert("error", "Error", "Membership ID not found");
        return;
      }

      const lang = i18n.locale?.startsWith("ar") ? "ar" : "en";
      setLoadingPlan(true);

      const response = await fetch(
        `https://gawifit.com/api/MemberShips/generate-dietary-chart/${memberIdApi}?lang=${lang}`,
        {
          method: "POST",
          headers: { accept: "*/*" },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        showAlert("error", "Error", "Failed to generate plan");
        return;
      }

      setDietPlan(data);
      setPlanModalVisible(true);
    } catch (error) {
      showAlert("error", "Error", "Something went wrong");
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setPersonalData((prev) => ({ ...prev, dob: formattedDate }));
    }
  };

  // Just stages the picked image locally now — nothing is uploaded yet.
  const handleSelectPhoto = () => {
    showAlert(
      "info",
      i18n.t("profile.select_photo") || "Select Photo",
      undefined,
      [
        {
          text: i18n.t("profile.camera") || "Camera",
          style: "primary",
          onPress: async () => {
            const permission =
              await ImagePicker.requestCameraPermissionsAsync();
            if (permission.status !== "granted") {
              showAlert(
                "warning",
                i18n.t("profile.permission_required"),
                i18n.t("profile.camera_permission") ||
                  "Camera permission is required",
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.length > 0) {
              setAvatarLoadFailed(false);
              setPendingPhotoUri(result.assets[0].uri);
            }
          },
        },
        {
          text: i18n.t("profile.gallery") || "Gallery",
          style: "primary",
          onPress: async () => {
            const permission =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permission.status !== "granted") {
              showAlert(
                "warning",
                i18n.t("profile.permission_required"),
                i18n.t("profile.gallery_permission"),
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.length > 0) {
              setAvatarLoadFailed(false);
              setPendingPhotoUri(result.assets[0].uri);
            }
          },
        },
        {
          text: i18n.t("profile.cancel") || "Cancel",
          style: "cancel",
        },
      ],
    );
  };

  const genderQuery = (gender: string) =>
    gender ? `?gender=${encodeURIComponent(gender)}` : "";

  const handleSavePhoto = async () => {
    if (!pendingPhotoUri) return;
    try {
      setPhotoSaving(true);
      const token = await handleGetToken();
      const MemberId = await AsyncStorage.getItem("MemberId");
      if (!token || !MemberId) {
        showAlert(
          "error",
          i18n.t("profile.error"),
          i18n.t("profile.auth_error"),
        );
        return;
      }

      const form = new FormData();

      form.append("id", MemberId);
      form.append("nameEn", personalData.nameEn || "");
      form.append("nameAr", personalData.nameAr || "");
      form.append("phoneNumber", personalData.phoneNumber || "");
      form.append("Email", personalData.email || "");
      form.append("age", physicalData.age || "");
      form.append("height_cm", physicalData.height || "");
      form.append("weight_kg", physicalData.weight || "");
      form.append("target", physicalData.target || "");
      form.append("activity_level", physicalData.activity_level || "");
      form.append(
        "training_days_per_week",
        physicalData.training_days_per_week || "",
      );
      form.append("meals_per_day", physicalData.meals_per_day || "");
      form.append("notes", physicalData.notes || "");

      const fileName = pendingPhotoUri.split("/").pop();
      const fileExt = fileName?.split(".").pop()?.toLowerCase() ?? "jpg";

      form.append("file", {
        uri: pendingPhotoUri,
        name: fileName ?? `photo.${fileExt}`,
        type: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
      } as any);

      const response = await fetch(
        `https://gawifit.com/api/User/updateuser${genderQuery(personalData.gender)}`,
        {
          method: "PUT",
          headers: { accept: "*/*", Authorization: `Bearer ${token}` },
          body: form,
        },
      );

      const text = await response.text();

      console.log("photo response:", response.status, text);

      if (!response.ok) {
        showAlert("error", "❌ Update failed", text || "Unknown error");
        return;
      }

      showAlert(
        "success",
        i18n.t("profile.success"),
        i18n.t("profile.personal_updated"),
      );
      setPendingPhotoUri(null);
      fetchUserProfile();
    } catch (error: any) {
      showAlert("error", "Error", error.message || "Failed to save photo");
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleCancelPhoto = () => {
    setPendingPhotoUri(null);
    setAvatarLoadFailed(false);
  };

  const setFieldValue = (
    section: "personal" | "physical",
    key: string,
    val: string,
  ) => {
    if (section === "personal")
      setPersonalData((prev) => ({ ...prev, [key]: val }));
    else setPhysicalData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveSection = async (sectionKey: string) => {
    try {
      const token = await handleGetToken();
      const MemberId = await AsyncStorage.getItem("MemberId");
      if (!token || !MemberId) {
        showAlert(
          "error",
          i18n.t("profile.error"),
          i18n.t("profile.auth_error"),
        );
        return;
      }
      if (sectionKey === "personal") {
        const form = new FormData();
        form.append("id", MemberId);
        form.append("nameEn", personalData.nameEn || "");
        form.append("nameAr", personalData.nameAr || "");
        form.append("phoneNumber", personalData.phoneNumber || "");
        form.append("Email", personalData.email || "");

        const response = await fetch(
          `https://gawifit.com/api/User/updateuser${genderQuery(personalData.gender)}`,
          {
            method: "PUT",
            headers: { accept: "*/*", Authorization: `Bearer ${token}` },
            body: form,
          },
        );

        const text = await response.text();
        console.log("response:", response.status, text);

        if (!response.ok) {
          showAlert("error", "❌ Update failed", text || "Unknown error");
          return;
        }

        showAlert(
          "success",
          i18n.t("profile.success"),
          i18n.t("profile.personal_updated"),
        );
        setIsEditing((prev) => ({ ...prev, personal: false }));
        fetchUserProfile();
      }
      if (sectionKey === "physical") {
        if (!memberIdApi) {
          showAlert("error", "Error", "Membership ID missing");
          return;
        }
        const body = {
          age: Number(physicalData.age),
          weight_kg: Number(physicalData.weight),
          height_cm: Number(physicalData.height),
          gender: personalData.gender,
          target: physicalData.target,
          activity_level: physicalData.activity_level,
          moderately_active: "1",
          training_days_per_week: physicalData.training_days_per_week,
          meals_per_day: physicalData.meals_per_day,
          notes: physicalData.notes,
        };
        console.log("personalData.gender =", personalData.gender);
        console.log(body);
        const response = await fetch(
          `https://gawifit.com/api/MemberShips/UpdateMemberHealthData/${memberIdApi}`,
          {
            method: "PUT",
            headers: {
              accept: "text/plain",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          },
        );
        const text = await response.text();
        if (!response.ok) {
          showAlert("error", "Update failed", text);
          return;
        }
        showAlert("success", "Success", "Health data updated");
        setIsEditing((prev) => ({ ...prev, physical: false }));
        fetchUserProfile();
      }
    } catch (error: any) {
      showAlert("error", "Error", error.message || "Failed to save changes");
    }
  };

  const fieldIcon = (key: string): keyof typeof Ionicons.glyphMap => {
    switch (key) {
      case "nameEn":
      case "nameAr":
        return "person-outline";
      case "email":
        return "mail-outline";
      case "phoneNumber":
        return "call-outline";
      case "age":
        return "calendar-outline";
      case "height":
        return "resize-outline";
      case "weight":
        return "barbell-outline";
      case "gender":
        return "male-female-outline";
      case "target":
        return "flag-outline";
      case "activity_level":
        return "flash-outline";
      case "training_days_per_week":
        return "calendar-number-outline";
      case "meals_per_day":
        return "restaurant-outline";
      case "notes":
        return "document-text-outline";
      default:
        return "ellipse-outline";
    }
  };

  const renderField = (
    label: string,
    key: string,
    section: "personal" | "physical",
    isLast: boolean,
  ) => {
    const value =
      section === "personal"
        ? (personalData as any)[key]
        : (physicalData as any)[key];

    const onChangeText = (text: string) => setFieldValue(section, key, text);

    return (
      <View
        key={key}
        style={[s.listRow, !isLast && s.listRowDivider, rtl && s.listRowRTL]}
      >
        <View style={[s.listRowLeft, rtl && s.listRowLeftRTL]}>
          <View style={s.listIconBadge}>
            <Ionicons name={fieldIcon(key)} size={14} color={theme.accent} />
          </View>
          <Text style={[s.listLabel, rtl && s.listLabelRTL]}>{label}</Text>
        </View>

        {isEditing[section] ? (
          key === "activity_level" ? (
            <View style={[s.pickerContainer, rtl && s.pickerContainerRTL]}>
              <Picker
                selectedValue={value}
                style={[
                  { color: theme.ink },
                  rtl ? { textAlign: "right" } : undefined,
                ]}
                onValueChange={(itemValue) =>
                  setPhysicalData((prev) => ({
                    ...prev,
                    activity_level: itemValue,
                  }))
                }
              >
                <Picker.Item
                  label={i18n.t("profile.select_activity")}
                  value=""
                  color={isDarkMode ? "#fff" : "#000"}
                />
                <Picker.Item
                  label={i18n.t("profile.sedentary")}
                  value="sedentary"
                  color={isDarkMode ? "#fff" : "#000"}
                />
                <Picker.Item
                  label={i18n.t("profile.lightly_active")}
                  value="lightly_active"
                  color={isDarkMode ? "#fff" : "#000"}
                />
                <Picker.Item
                  label={i18n.t("profile.moderately_active")}
                  value="moderately_active"
                  color={isDarkMode ? "#fff" : "#000"}
                />
                <Picker.Item
                  label={i18n.t("profile.very_active")}
                  value="very_active"
                  color={isDarkMode ? "#fff" : "#000"}
                />
              </Picker>
            </View>
          ) : key === "gender" ? (
            <View style={[s.radioContainer, rtl && s.radioContainerRTL]}>
              {[
                { en: "Male", label: i18n.t("profile.male") },
                { en: "Female", label: i18n.t("profile.female") },
              ].map((item) => {
                const selected = value === item.en;
                return (
                  <TouchableOpacity
                    key={item.en}
                    style={[s.genderChip, selected && s.genderChipActive]}
                    onPress={() => setFieldValue(section, "gender", item.en)}
                  >
                    <Text
                      style={[
                        s.genderChipLabel,
                        selected && s.genderChipLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TextInput
              style={[s.input, rtl && s.inputRTL]}
              value={value}
              onChangeText={onChangeText}
              placeholder={i18n.t("profile.enter", { field: label })}
              placeholderTextColor={theme.placeholder}
              color={theme.ink}
              textAlign={rtl ? "right" : "left"}
            />
          )
        ) : (
          <Text style={[s.listValue, rtl && s.listValueRTL]}>
            {value || "—"}
          </Text>
        )}
      </View>
    );
  };

  const personalFields = [
    { label: i18n.t("profile.full_name"), key: "nameEn" },
    { label: i18n.t("profile.arabic_name"), key: "nameAr" },
    { label: i18n.t("profile.email"), key: "email" },
    { label: i18n.t("profile.phone"), key: "phoneNumber" },
    { label: i18n.t("profile.gender"), key: "gender" },
  ];

  const physicalFields = [
    { label: i18n.t("profile.age"), key: "age" },
    { label: i18n.t("profile.height"), key: "height" },
    { label: i18n.t("profile.weight"), key: "weight" },
    { label: i18n.t("profile.target"), key: "target" },
    { label: i18n.t("profile.activity_level"), key: "activity_level" },
    { label: i18n.t("profile.training_days"), key: "training_days_per_week" },
    { label: i18n.t("profile.meals_per_day"), key: "meals_per_day" },
    { label: i18n.t("profile.notes"), key: "notes" },
  ];

  const tabs: {
    key: TabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      key: "personal",
      label: i18n.t("profile.personal_info"),
      icon: "person-outline",
    },
    {
      key: "physical",
      label: i18n.t("profile.health_info"),
      icon: "barbell-outline",
    },
    {
      key: "subscription",
      label: i18n.t("profile.subscription"),
      icon: "card-outline",
    },
  ];

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.bg,
        }}
      >
        <ActivityIndicator color={theme.accent} size="large" />
        <Text
          style={{ textAlign: "center", color: theme.muted, marginTop: 12 }}
        >
          {i18n.t("profile.loading")}
        </Text>
      </View>
    );

  const isActive = subscriptionData.subscriptionStatus === "Active";
  const avatarUri = pendingPhotoUri || personalData.photoUrl;
  const showAvatarPlaceholder = !avatarUri || avatarLoadFailed;

  return (
    <LinearGradient colors={[theme.bg, theme.bgEnd]} style={s.container}>
      <SafeAreaView>
        <ScrollView
          contentContainerStyle={s.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.headerSection}>
            <View style={s.avatarRing}>
              <TouchableOpacity
                onPress={handleSelectPhoto}
                disabled={photoSaving}
              >
                {showAvatarPlaceholder ? (
                  <View style={[s.avatar, s.avatarPlaceholder]}>
                    <Ionicons name="person" size={40} color={theme.muted} />
                  </View>
                ) : (
                  <Image
                    source={{ uri: avatarUri }}
                    style={s.avatar}
                    onError={(e) => {
                      console.log(
                        "Avatar failed to load:",
                        avatarUri,
                        e.nativeEvent?.error,
                      );
                      setAvatarLoadFailed(true);
                    }}
                    onLoad={() => setAvatarLoadFailed(false)}
                  />
                )}
                {!pendingPhotoUri && (
                  <View style={s.editIconContainer}>
                    <Ionicons name="camera" size={14} color={theme.accentInk} />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[s.name, rtl && s.nameRTL]}>
              {rtl && personalData.nameAr
                ? personalData.nameAr
                : personalData.nameEn}
            </Text>

            {pendingPhotoUri && (
              <View style={[s.photoActions, rtl && s.photoActionsRTL]}>
                <TouchableOpacity
                  style={s.photoCancelButton}
                  onPress={handleCancelPhoto}
                  disabled={photoSaving}
                >
                  <Ionicons name="close" size={14} color={theme.muted} />
                  <Text style={s.photoCancelText}>
                    {i18n.t("profile.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.photoSaveButton}
                  onPress={handleSavePhoto}
                  disabled={photoSaving}
                >
                  {photoSaving ? (
                    <ActivityIndicator size="small" color={theme.accentInk} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={theme.accentInk}
                      />
                      <Text style={s.photoSaveText}>
                        {i18n.locale.startsWith("ar")
                          ? "حفظ الصورة"
                          : "Save Photo"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={[s.tabBar, rtl && s.tabBarRTL]}>
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[s.tabItem, active && s.tabItemActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={active ? theme.accentInk : theme.muted}
                  />
                  <Text style={[s.tabLabel, active && s.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {activeTab === "personal" && (
            <View style={s.panel}>
              {personalFields.map((f, i) =>
                renderField(
                  f.label,
                  f.key,
                  "personal",
                  i === personalFields.length - 1,
                ),
              )}
              <View style={[s.panelActions, rtl && s.panelActionsRTL]}>
                {!isEditing.personal ? (
                  <TouchableOpacity
                    style={s.outlineButton}
                    onPress={() =>
                      setIsEditing((prev) => ({ ...prev, personal: true }))
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={theme.accent}
                    />
                    <Text style={s.outlineButtonText}>
                      {i18n.t("profile.edit", {
                        section: i18n.t("profile.personal_info"),
                      })}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={s.solidButton}
                    onPress={() => handleSaveSection("personal")}
                  >
                    <Ionicons
                      name="checkmark-outline"
                      size={16}
                      color={theme.accentInk}
                    />
                    <Text style={s.solidButtonText}>
                      {i18n.t("profile.save")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {activeTab === "physical" && (
            <View style={s.panel}>
              <View style={[s.statGrid, rtl && s.statGridRTL]}>
                {[
                  {
                    label: i18n.t("profile.age"),
                    value: physicalData.age,
                    icon: "calendar-outline",
                  },
                  {
                    label: i18n.t("profile.height"),
                    value: physicalData.height,
                    unit: "cm",
                    icon: "resize-outline",
                  },
                  {
                    label: i18n.t("profile.weight"),
                    value: physicalData.weight,
                    unit: "kg",
                    icon: "barbell-outline",
                  },
                ].map((stat) => (
                  <View key={stat.label} style={s.statCard}>
                    <Ionicons
                      name={stat.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={theme.accent}
                    />
                    <Text style={s.statValue}>
                      {stat.value ? `${stat.value}${stat.unit || ""}` : "—"}
                    </Text>
                    <Text style={s.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
              {physicalFields.map((f, i) =>
                renderField(
                  f.label,
                  f.key,
                  "physical",
                  i === physicalFields.length - 1,
                ),
              )}
              <View style={[s.panelActions, rtl && s.panelActionsRTL]}>
                {!isEditing.physical ? (
                  <TouchableOpacity
                    style={s.outlineButton}
                    onPress={() =>
                      setIsEditing((prev) => ({ ...prev, physical: true }))
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={theme.accent}
                    />
                    <Text style={s.outlineButtonText}>
                      {i18n.t("profile.edit", {
                        section: i18n.t("profile.health_info"),
                      })}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={s.solidButton}
                    onPress={() => handleSaveSection("physical")}
                  >
                    <Ionicons
                      name="checkmark-outline"
                      size={16}
                      color={theme.accentInk}
                    />
                    <Text style={s.solidButtonText}>
                      {i18n.t("profile.save")}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {activeTab === "subscription" && (
            <View style={s.panel}>
              <LinearGradient
                colors={[theme.accentDeep, theme.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.memberCard}
              >
                <View style={[s.memberCardTop, rtl && s.memberCardTopRTL]}>
                  <View style={s.chipIcon}>
                    <View style={s.chipLine} />
                    <View style={s.chipLine} />
                  </View>
                  <View
                    style={[
                      s.memberStatusPill,
                      {
                        backgroundColor: isActive
                          ? "rgba(89,214,124,0.22)"
                          : "rgba(255,95,95,0.22)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        s.statusDot,
                        {
                          backgroundColor: subscriptionData.status
                            ? theme.success
                            : theme.danger,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        s.memberStatusText,
                        { color: isActive ? "#DFFCE6" : "#FFE1E1" },
                      ]}
                    >
                      {subscriptionData.status || "—"}
                    </Text>
                  </View>
                </View>

                <Text style={[s.memberCardName, rtl && s.memberCardNameRTL]}>
                  {rtl && personalData.nameAr
                    ? personalData.nameAr
                    : personalData.nameEn}
                </Text>

                <View
                  style={[s.memberCardBottom, rtl && s.memberCardBottomRTL]}
                >
                  <View>
                    <Text style={s.memberCardCaption}>
                      {i18n.t("profile.start_date")}
                    </Text>
                    <Text style={s.memberCardValue}>
                      {subscriptionData.startDate || "—"}
                    </Text>
                  </View>
                  <View
                    style={
                      rtl
                        ? { alignItems: "flex-start" }
                        : { alignItems: "flex-end" }
                    }
                  >
                    <Text style={s.memberCardCaption}>
                      {i18n.t("profile.expiry_date")}
                    </Text>
                    <Text style={s.memberCardValue}>
                      {subscriptionData.expiryDate || "—"}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          <TouchableOpacity
            style={[s.generateButton, loadingPlan && { opacity: 0.6 }]}
            onPress={handleGeneratePlan}
            activeOpacity={0.85}
            disabled={loadingPlan}
          >
            {loadingPlan ? (
              <ActivityIndicator size="small" color={theme.accentInk} />
            ) : (
              <Ionicons
                name="nutrition-outline"
                size={18}
                color={theme.accentInk}
              />
            )}
            <Text style={s.generateButtonText}>
              {loadingPlan
                ? i18n.locale.startsWith("ar")
                  ? "جاري الإنشاء..."
                  : "Generating..."
                : i18n.locale.startsWith("ar")
                  ? "إنشاء الخطة الغذائية"
                  : "Generate Plan"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={s.deleteButton}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.danger} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color={theme.danger} />
                <Text style={s.deleteButtonText}>Delete Account</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Diet Plan Modal */}
      <Modal visible={planModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={[s.modalHeader, rtl && s.modalHeaderRTL]}>
              <Text
                style={[
                  s.modalTitle,
                  {
                    textAlign: i18n.locale.startsWith("ar") ? "right" : "left",
                  },
                ]}
              >
                {i18n.locale.startsWith("ar") ? "الخطة الغذائية" : "Diet Plan"}
              </Text>
              <TouchableOpacity
                onPress={() => setPlanModalVisible(false)}
                style={s.modalCloseButton}
              >
                <Ionicons name="close" size={18} color={theme.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {loadingPlan ? (
                <ActivityIndicator
                  size="large"
                  color={theme.accent}
                  style={{ marginTop: 20 }}
                />
              ) : dietPlan ? (
                renderDietPlan(dietPlan, theme)
              ) : (
                <Text style={{ textAlign: "center", color: theme.muted }}>
                  No data
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <SweetAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        isDarkMode={!!isDarkMode}
        isRTL={rtl}
        onRequestClose={hideAlert}
      />
    </LinearGradient>
  );
}

// ─── Diet plan renderer ───────────────────────────────────────────────────────
const renderDietPlan = (plan: any, theme: ReturnType<typeof getTheme>) => {
  const chart = plan?.dietary_chart;
  if (!chart) return null;
  const isAr = chart.direction === "rtl";

  return (
    <View>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: theme.accent,
          marginBottom: 6,
          textAlign: isAr ? "right" : "left",
        }}
      >
        {chart.title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.muted,
          marginBottom: 18,
          lineHeight: 20,
          textAlign: isAr ? "right" : "left",
        }}
      >
        {chart.summary}
      </Text>
      {chart.points.map((section: any, index: number) => (
        <View
          key={index}
          style={{
            marginBottom: 14,
            backgroundColor: theme.surfaceRaised,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.border,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: theme.accent,
              marginBottom: 8,
              textAlign: isAr ? "right" : "left",
            }}
          >
            {section.section_title}
          </Text>
          {section.items.length > 0 ? (
            section.items.map((item: string, i: number) => (
              <View
                key={i}
                style={{
                  flexDirection: isAr ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: theme.accent,
                    marginTop: 7,
                    marginHorizontal: 8,
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.dietText,
                    flex: 1,
                    lineHeight: 20,
                    textAlign: isAr ? "right" : "left",
                  }}
                >
                  {item}
                </Text>
              </View>
            ))
          ) : (
            <Text
              style={{
                fontSize: 13,
                color: theme.dietMuted,
                fontStyle: "italic",
                textAlign: isAr ? "right" : "left",
              }}
            >
              {i18n.locale.startsWith("ar") ? "لا يوجد" : "No items"}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContainer: { padding: 20, paddingBottom: 40 },

    headerSection: { alignItems: "center", marginBottom: 18 },
    avatarRing: {
      padding: 4,
      borderRadius: 60,
      borderWidth: 2,
      borderColor: theme.accent,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.surface,
    },
    avatarPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    editIconContainer: {
      position: "absolute",
      bottom: 2,
      right: 2,
      backgroundColor: theme.accent,
      borderRadius: 14,
      padding: 6,
      borderWidth: 2,
      borderColor: theme.bg,
    },
    name: { fontSize: 20, fontWeight: "800", color: theme.ink, marginTop: 12 },
    nameRTL: { textAlign: "center", writingDirection: "rtl" },

    photoActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
    },
    photoActionsRTL: { flexDirection: "row-reverse" },
    photoCancelButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    photoCancelText: { fontSize: 12, fontWeight: "600", color: theme.muted },
    photoSaveButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: theme.accent,
    },
    photoSaveText: { fontSize: 12, fontWeight: "700", color: theme.accentInk },

    tabBar: {
      flexDirection: "row",
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 4,
      marginBottom: 16,
      gap: 4,
    },
    tabBarRTL: { flexDirection: "row-reverse" },
    tabItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 9,
      borderRadius: 12,
    },
    tabItemActive: { backgroundColor: theme.accent },
    tabLabel: { fontSize: 11.5, fontWeight: "700", color: theme.muted },
    tabLabelActive: { color: theme.accentInk },

    panel: {
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 14,
    },

    listRow: { flexDirection: "column", paddingVertical: 12 },
    listRowRTL: {},
    listRowDivider: { borderBottomWidth: 1, borderBottomColor: theme.border },
    listRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    listRowLeftRTL: { flexDirection: "row-reverse" },
    listIconBadge: {
      width: 24,
      height: 24,
      borderRadius: 8,
      backgroundColor: "rgba(232,116,42,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    listLabel: { fontSize: 12.5, color: theme.muted, fontWeight: "600" },
    listLabelRTL: { textAlign: "right" },
    listValue: { fontSize: 15, fontWeight: "600", color: theme.ink },
    listValueRTL: { textAlign: "right", writingDirection: "rtl" },

    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 14,
      backgroundColor: theme.inputBg,
      color: theme.ink,
    },
    inputRTL: { textAlign: "right", writingDirection: "rtl" },

    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.inputBg,
    },
    pickerContainerRTL: {},

    radioContainer: { flexDirection: "row", gap: 10 },
    radioContainerRTL: { flexDirection: "row-reverse" },
    genderChip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBg,
      alignItems: "center",
    },
    genderChipActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    genderChipLabel: { fontSize: 14, fontWeight: "600", color: theme.ink },
    genderChipLabelActive: { color: theme.accentInk },

    statGrid: { flexDirection: "row", gap: 10, marginBottom: 14 },
    statGridRTL: { flexDirection: "row-reverse" },
    statCard: {
      flex: 1,
      backgroundColor: theme.surfaceRaised,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 12,
      alignItems: "center",
      gap: 4,
    },
    statValue: { fontSize: 15, fontWeight: "800", color: theme.ink },
    statLabel: { fontSize: 10.5, color: theme.muted },

    panelActions: { flexDirection: "row", marginTop: 12 },
    panelActionsRTL: { flexDirection: "row-reverse" },
    outlineButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderWidth: 1.5,
      borderColor: theme.accent,
      paddingVertical: 10,
      borderRadius: 20,
      flex: 1,
    },
    outlineButtonText: { color: theme.accent, fontSize: 14, fontWeight: "700" },
    solidButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: theme.accent,
      paddingVertical: 10,
      borderRadius: 20,
      flex: 1,
    },
    solidButtonText: {
      color: theme.accentInk,
      fontSize: 14,
      fontWeight: "700",
    },

    memberCard: {
      borderRadius: 20,
      padding: 18,
      minHeight: 160,
      justifyContent: "space-between",
    },
    memberCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    memberCardTopRTL: { flexDirection: "row-reverse" },
    chipIcon: {
      width: 34,
      height: 24,
      borderRadius: 5,
      backgroundColor: "rgba(0,0,0,0.25)",
      justifyContent: "center",
      paddingHorizontal: 6,
      gap: 3,
    },
    chipLine: {
      height: 2,
      borderRadius: 1,
      backgroundColor: "rgba(255,255,255,0.5)",
    },
    memberStatusPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    memberStatusText: { fontSize: 11, fontWeight: "700" },
    memberCardName: {
      fontSize: 18,
      fontWeight: "800",
      color: "#FFF8F0",
      marginVertical: 14,
      letterSpacing: 0.3,
    },
    memberCardNameRTL: { textAlign: "right", writingDirection: "rtl" },
    memberCardBottom: { flexDirection: "row", justifyContent: "space-between" },
    memberCardBottomRTL: { flexDirection: "row-reverse" },
    memberCardCaption: {
      fontSize: 10,
      color: "rgba(255,255,255,0.7)",
      fontWeight: "600",
      marginBottom: 3,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    memberCardValue: { fontSize: 14, color: "#FFF8F0", fontWeight: "700" },

    generateButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: theme.accent,
      paddingVertical: 15,
      borderRadius: 26,
      marginTop: 8,
      marginBottom: 14,
      shadowColor: theme.accent,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    generateButtonText: {
      color: theme.accentInk,
      fontSize: 16,
      fontWeight: "800",
    },

    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 13,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "rgba(255,95,95,0.35)",
    },
    deleteButtonText: {
      color: theme.danger,
      fontSize: 14.5,
      fontWeight: "700",
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    modalBox: {
      backgroundColor: theme.modalBg,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalHeaderRTL: { flexDirection: "row-reverse" },
    modalCloseButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.surfaceRaised,
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: { fontSize: 19, fontWeight: "800", color: theme.ink },
  });
