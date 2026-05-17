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
  Alert,
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
import { formatDate } from "date-fns";

// ─── RTL helper ───────────────────────────────────────────────────────────────
const isRTL = (): boolean => {
  const locale: string = i18n.locale || "";
  return locale.startsWith("ar") || I18nManager.isRTL;
};

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : Colors.white,
  bgEnd: dark ? "#1A1A1A" : "#FFFFFF",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#555555",
  border: dark ? "#2C2C2C" : "#DDDDDD",
  inputBg: dark ? "#2C2C2C" : "#FFFFFF",
  placeholder: dark ? "#666666" : "#999999",
  modalBg: dark ? "#1E1E1E" : "#FFFFFF",
  dietText: dark ? "#CCCCCC" : "#333333",
  dietMuted: dark ? "#888888" : "#999999",
});

export default function MyProfileScreen() {
  const { setUserProfile, isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈

  const [locale, setLocale] = useState<string>(i18n.locale);
  const rtl = isRTL();

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
  });

  const [physicalData, setPhysicalData] = useState({
    height: "",
    weight: "",
    gender: "",
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
  }>({ subscriptionStatus: "", expiryDate: "" });

  const [sections, setSections] = useState({
    personal: true,
    physical: true,
    subscription: true,
  });

  const toggleSection = (key: string) =>
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const fetchUserProfile = async () => {
    const MemberId = await AsyncStorage.getItem("MemberId");
    try {
      const response = await fetch(
        `https://gym.useitsmart.com/api/MemberShips/MemberShipsforuser/${MemberId}`,
        { method: "GET", headers: { accept: "application/json" } },
      );
      if (!response.ok) throw new Error("Failed to fetch membership");
      const data = await response.json();
      setMemberIdApi(data.id);
      setPersonalData({
        nameEn: data.nameEn || "",
        nameAr: data.nameAr || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        photo: "",
        photoUrl: "",
        bio: "",
        dob: "",
        location: "",
      });
      setPhysicalData({
        height: data.height_cm?.toString() || "",
        weight: data.weight_kg?.toString() || "",
        gender: data.gender || "",
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
      });
      setLoading(false);
    } catch (error) {
      Alert.alert("Error", "Failed to load membership");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);
  useEffect(() => {
    setLocale(i18n.locale);
  }, [i18n.locale]);

  const handleGeneratePlan = async () => {
    try {
      if (!memberIdApi) {
        Alert.alert("Error", "Membership ID not found");
        return;
      }
      const lang = i18n.locale?.startsWith("ar") ? "ar" : "en";
      setLoadingPlan(true);
      const response = await fetch(
        `https://gym.useitsmart.com/api/MemberShips/generate-dietary-chart/${memberIdApi}?lang=${lang}`,
        { method: "POST", headers: { accept: "*/*" } },
      );
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", "Failed to generate plan");
        return;
      }
      setDietPlan(data);
      setPlanModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Something went wrong");
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

  const handleSelectPhoto = async () => {
    Alert.alert(i18n.t("profile.select_photo") || "Select Photo", "", [
      {
        text: i18n.t("profile.camera") || "Camera",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (permission.status !== "granted") {
            Alert.alert(
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
            setPersonalData((prev) => ({
              ...prev,
              photo: result.assets[0].uri,
            }));
          }
        },
      },
      {
        text: i18n.t("profile.gallery") || "Gallery",
        onPress: async () => {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permission.status !== "granted") {
            Alert.alert(
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
            setPersonalData((prev) => ({
              ...prev,
              photo: result.assets[0].uri,
            }));
          }
        },
      },
      {
        text: i18n.t("profile.cancel") || "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleSaveSection = async (sectionKey: string) => {
    try {
      const token = await handleGetToken();
      const MemberId = await AsyncStorage.getItem("MemberId");
      if (!token || !MemberId) {
        Alert.alert(i18n.t("profile.error"), i18n.t("profile.auth_error"));
        return;
      }
      if (sectionKey === "personal") {
        const form = new FormData();
        form.append("id", MemberId);
        form.append("nameEn", personalData.nameEn || "");
        form.append("nameAr", personalData.nameAr || "");
        form.append("phoneNumber", personalData.phoneNumber || "");
        if (personalData.photo && personalData.photo.startsWith("file://")) {
          const uriParts = personalData.photo.split(".");
          const fileType = uriParts[uriParts.length - 1];
          form.append("file", {
            uri: personalData.photo,
            name: `photo.${fileType}`,
            type: `image/${fileType}`,
          } as any);
        }
        const response = await fetch(
          `https://gym.useitsmart.com/api/User/updateuser`,
          {
            method: "PUT",
            headers: { accept: "*/*", Authorization: `Bearer ${token}` },
            body: form,
          },
        );
        const text = await response.text();
        if (!response.ok) {
          Alert.alert("❌ Update failed", text || "Unknown error");
          return;
        }
        Alert.alert(
          i18n.t("profile.success"),
          i18n.t("profile.personal_updated"),
        );
        setIsEditing((prev) => ({ ...prev, personal: false }));
        fetchUserProfile();
      }
      if (sectionKey === "physical") {
        if (!memberIdApi) {
          Alert.alert("Error", "Membership ID missing");
          return;
        }
        const body = {
          age: Number(physicalData.age),
          weight_kg: Number(physicalData.weight),
          height_cm: Number(physicalData.height),
          gender: physicalData.gender,
          target: physicalData.target,
          activity_level: physicalData.activity_level,
          moderately_active: "1",
          training_days_per_week: physicalData.training_days_per_week,
          meals_per_day: physicalData.meals_per_day,
          notes: physicalData.notes,
        };
        const response = await fetch(
          `https://gym.useitsmart.com/api/MemberShips/UpdateMemberHealthData/${memberIdApi}`,
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
          Alert.alert("Update failed", text);
          return;
        }
        Alert.alert("Success", "Health data updated");
        setIsEditing((prev) => ({ ...prev, physical: false }));
        fetchUserProfile();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save changes");
    }
  };

  // ─── Render field ─────────────────────────────────────────────────────────
  const renderField = (
    label: string,
    key: string,
    section: string,
    type?: "date",
  ) => {
    const isDateField = type === "date";
    const isReadOnly = section === "subscription";
    const value =
      section === "personal"
        ? (personalData as any)[key]
        : section === "physical"
          ? (physicalData as any)[key]
          : (subscriptionData as any)[key];

    const onChangeText = (text: string) => {
      if (section === "personal")
        setPersonalData((prev) => ({ ...prev, [key]: text }));
      else if (section === "physical")
        setPhysicalData((prev) => ({ ...prev, [key]: text }));
    };

    return (
      <View key={key} style={[s.row, rtl && s.rowRTL]}>
        <Text style={[s.label, rtl && s.labelRTL]}>{label}</Text>

        {isEditing[section] && !isReadOnly ? (
          isDateField ? (
            <>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[s.dateInput, rtl && s.dateInputRTL]}
              >
                <Text style={[s.dateText, rtl && s.dateTextRTL]}>
                  {value || i18n.t("profile.select_date")}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </>
          ) : key === "activity_level" ? (
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
              ].map((item) => (
                <TouchableOpacity
                  key={item.en}
                  style={[s.radioItem, rtl && s.radioItemRTL]}
                  onPress={() =>
                    setPhysicalData((prev) => ({ ...prev, gender: item.en }))
                  }
                >
                  <View style={[s.radioCircle, rtl && s.radioCircleRTL]}>
                    {value === item.en && <View style={s.radioSelected} />}
                  </View>
                  <Text style={[s.radioLabel, rtl && s.radioLabelRTL]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TextInput
              style={[s.input, rtl && s.inputRTL]}
              value={value}
              onChangeText={onChangeText}
              placeholder={i18n.t("profile.enter", { field: label })}
              placeholderTextColor={theme.placeholder} // 👈
              color={theme.ink} // 👈
              textAlign={rtl ? "right" : "left"}
            />
          )
        ) : (
          <Text style={[s.value, rtl && s.valueRTL]}>{value || "—"}</Text>
        )}
      </View>
    );
  };

  const profileSections = [
    {
      key: "personal",
      title: i18n.t("profile.personal_info"),
      fields: [
        { label: i18n.t("profile.full_name"), key: "nameEn" },
        { label: i18n.t("profile.arabic_name"), key: "nameAr" },
        { label: i18n.t("profile.email"), key: "email" },
        { label: i18n.t("profile.phone"), key: "phoneNumber" },
      ],
    },
    {
      key: "physical",
      title: i18n.t("profile.health_info"),
      fields: [
        { label: i18n.t("profile.age"), key: "age" },
        { label: i18n.t("profile.height"), key: "height" },
        { label: i18n.t("profile.weight"), key: "weight" },
        { label: i18n.t("profile.gender"), key: "gender" },
        { label: i18n.t("profile.target"), key: "target" },
        { label: i18n.t("profile.activity_level"), key: "activity_level" },
        {
          label: i18n.t("profile.training_days"),
          key: "training_days_per_week",
        },
        { label: i18n.t("profile.meals_per_day"), key: "meals_per_day" },
        { label: i18n.t("profile.notes"), key: "notes" },
      ],
    },
    {
      key: "subscription",
      title: i18n.t("profile.subscription"),
      fields: [
        { label: i18n.t("profile.status"), key: "subscriptionStatus" },
        { label: i18n.t("profile.start_date"), key: "startDate" },
        { label: i18n.t("profile.expiry_date"), key: "expiryDate" },
      ],
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
        <Text style={{ textAlign: "center", color: theme.muted }}>
          {i18n.t("profile.loading")}
        </Text>
      </View>
    );

  return (
    <LinearGradient colors={[theme.bg, theme.bgEnd]} style={s.container}>
      <ScrollView contentContainerStyle={s.scrollContainer}>
        {/* Profile Header */}
        <View style={s.headerSection}>
          <TouchableOpacity onPress={handleSelectPhoto}>
            <Image
              source={
                personalData.photo
                  ? { uri: personalData.photo }
                  : personalData.photoUrl
                    ? { uri: personalData.photoUrl }
                    : require("../assets/images/adaptive-icon.png")
              }
              style={s.avatar}
            />
            <View style={s.editIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[s.name, rtl && s.nameRTL]}>
            {rtl && personalData.nameAr
              ? personalData.nameAr
              : personalData.nameEn}
          </Text>
        </View>

        {/* Sections */}
        {profileSections.map((section) => (
          <View key={section.key} style={s.card}>
            <TouchableOpacity
              style={[s.sectionHeader, rtl && s.sectionHeaderRTL]}
              onPress={() => toggleSection(section.key)}
            >
              <Text style={[s.sectionTitle, rtl && s.sectionTitleRTL]}>
                {section.title}
              </Text>
              <Ionicons
                name={
                  sections[section.key]
                    ? "chevron-up-outline"
                    : "chevron-down-outline"
                }
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>

            {sections[section.key] &&
              section.fields.map((field) =>
                renderField(
                  field.label,
                  field.key,
                  section.key,
                  (field as any).type,
                ),
              )}

            {section.key !== "subscription" && sections[section.key] && (
              <>
                <TouchableOpacity
                  style={s.sectionButton}
                  onPress={() => handleSaveSection(section.key)}
                >
                  <Text style={s.buttonText}>{i18n.t("profile.save")}</Text>
                </TouchableOpacity>
                {!isEditing[section.key] && (
                  <TouchableOpacity
                    style={s.sectionButton}
                    onPress={() =>
                      setIsEditing((prev) => ({ ...prev, [section.key]: true }))
                    }
                  >
                    <Text style={s.buttonText}>
                      {i18n.t("profile.edit", { section: section.title })}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        ))}

        {/* Generate Plan Button */}
        <TouchableOpacity style={s.generateButton} onPress={handleGeneratePlan}>
          <Text style={s.generateButtonText}>
            {i18n.locale.startsWith("ar")
              ? "إنشاء الخطة الغذائية"
              : "Generate Plan"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Diet Plan Modal */}
      <Modal visible={planModalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <TouchableOpacity
              onPress={() => setPlanModalVisible(false)}
              style={{ alignSelf: "flex-end" }}
            >
              <Text style={{ fontSize: 18, color: theme.ink }}>✕</Text>
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
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
              {loadingPlan ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : dietPlan ? (
                renderDietPlan(dietPlan, theme) // 👈 pass theme
              ) : (
                <Text style={{ textAlign: "center", color: theme.muted }}>
                  No data
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
          fontWeight: "bold",
          color: Colors.primary,
          marginBottom: 10,
          textAlign: isAr ? "right" : "left",
        }}
      >
        {chart.title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.muted,
          marginBottom: 15,
          textAlign: isAr ? "right" : "left",
        }}
      >
        {chart.summary}
      </Text>
      {chart.points.map((section: any, index: number) => (
        <View key={index} style={{ marginBottom: 15 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: Colors.primary,
              marginBottom: 6,
              textAlign: isAr ? "right" : "left",
            }}
          >
            {section.section_title}
          </Text>
          {section.items.length > 0 ? (
            section.items.map((item: string, i: number) => (
              <Text
                key={i}
                style={{
                  fontSize: 14,
                  color: theme.dietText,
                  marginBottom: 4,
                  textAlign: isAr ? "right" : "left",
                }}
              >
                • {item}
              </Text>
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
    scrollContainer: { padding: 20 },
    headerSection: { alignItems: "center", marginBottom: 20 },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 3,
      borderColor: Colors.primary,
    },
    editIconContainer: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: Colors.primary,
      borderRadius: 20,
      padding: 6,
      borderWidth: 2,
      borderColor: "#fff",
    },
    name: {
      fontSize: 22,
      fontWeight: "700",
      color: Colors.primary,
      marginTop: 10,
    },
    nameRTL: { textAlign: "center", writingDirection: "rtl" },
    card: {
      backgroundColor: theme.surface, // 👈
      borderRadius: 16,
      padding: 12,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    sectionHeaderRTL: { flexDirection: "row-reverse" },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.primary },
    sectionTitleRTL: { textAlign: "right" },
    row: { flexDirection: "column", marginBottom: 12 },
    rowRTL: {},
    label: { fontSize: 14, color: theme.muted, marginBottom: 4 }, // 👈
    labelRTL: { textAlign: "right" },
    value: { fontSize: 15, fontWeight: "600", color: theme.ink }, // 👈
    valueRTL: { textAlign: "right", writingDirection: "rtl" },
    input: {
      borderWidth: 1,
      borderColor: theme.border, // 👈
      borderRadius: 10,
      padding: 8,
      fontSize: 14,
      backgroundColor: theme.inputBg, // 👈
      color: theme.ink, // 👈
    },
    inputRTL: { textAlign: "right", writingDirection: "rtl" },
    dateInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.border, // 👈
      borderRadius: 10,
      padding: 10,
      backgroundColor: theme.inputBg, // 👈
    },
    dateInputRTL: { flexDirection: "row-reverse" },
    dateText: { fontSize: 14, color: theme.ink }, // 👈
    dateTextRTL: { textAlign: "right" },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.border, // 👈
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: theme.inputBg, // 👈
    },
    pickerContainerRTL: {},
    radioContainer: { flexDirection: "row", gap: 15 },
    radioContainerRTL: { flexDirection: "row-reverse" },
    radioItem: { flexDirection: "row", alignItems: "center" },
    radioItemRTL: { flexDirection: "row-reverse" },
    radioCircle: {
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 6,
    },
    radioCircleRTL: { marginRight: 0, marginLeft: 6 },
    radioSelected: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: Colors.primary,
    },
    radioLabel: { fontSize: 14, color: theme.ink }, // 👈
    radioLabelRTL: { textAlign: "right" },
    sectionButton: {
      backgroundColor: Colors.primary,
      paddingVertical: 10,
      borderRadius: 20,
      alignItems: "center",
      marginTop: 10,
    },
    buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    generateButton: {
      backgroundColor: Colors.primary,
      paddingVertical: 14,
      borderRadius: 25,
      alignItems: "center",
      marginTop: 20,
      marginBottom: 30,
    },
    generateButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
    },
    modalBox: {
      backgroundColor: theme.modalBg, // 👈
      margin: 20,
      borderRadius: 20,
      padding: 20,
      maxHeight: "80%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 15,
      color: theme.ink, // 👈
    },
  });
