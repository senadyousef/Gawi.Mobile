import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon } from "@expo/vector-icons";
import { handleGetToken } from "../helpers";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context";
import ar from "../localization/ar";
import en from "../localization/en";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");

const NutritionPlanScreen = () => {
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editing, setEditing] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState(null);

  const { isDarkMode } = useAppContext() as any;
  const dark = isDarkMode ?? false;

  const { getDirection, isArabic } = useI18n();
  const isAr = isArabic();
  const isRTL =
    (getDirection() as any)?.flexDirection === "row-reverse" ||
    (getDirection() as any)?.direction === "rtl";
  const t = isAr ? ar : en;

  // theme helpers
  const d = {
    bg: dark ? "#000000" : "#F7FAFC",
    surface: dark ? "#000000" : "#FFFFFF",
    surface2: dark ? "#111111" : "#F7FAFC",
    border: dark ? "#222222" : "#E2E8F0",
    text: dark ? "#EEEEEE" : "#2D3748",
    textSub: dark ? "#888888" : "#718096",
    textMuted: dark ? "#555555" : "#A0AEC0",
    inputBg: dark ? "#000000" : "#F7FAFC",
    toolbarBg: dark ? "#000000" : "#F7FAFC",
    toolbarBtn: dark ? "#111111" : "#FFFFFF",
    cardBg: dark ? "#111111" : "#FFFFFF",
    cardBorder: dark ? "#222222" : "#E2E8F0",
  };

  const [editForm, setEditForm] = useState({
    ptId: "",
    userId: "",
    planNameAr: "",
    planNameEn: "",
    descriptionEn: "",
    descriptionAr: "",
    caloriesPerDay: "",
    proteinGrams: "",
    carbsGrams: "",
  });

  const [currentDescriptionLanguage, setCurrentDescriptionLanguage] =
    useState("en");
  const [currentDescription, setCurrentDescription] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textInputRef = useRef(null);

  const API_URL = "http://192.168.1.16/api/NutritionPlan";

  const fetchNutritionPlans = async () => {
    try {
      setError(null);
      setLoading(true);
      const token = await handleGetToken();
      const USER_ID = (await AsyncStorage.getItem("MemberId")) || "0";
      if (!token) {
        Alert.alert(t.connectionError, "Please login again");
        return;
      }
      const response = await fetch(
        `${API_URL}/GetAllNutritionPlanForPT?userId=${USER_ID}`,
        {
          method: "GET",
          headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok)
        throw new Error(`Failed to fetch plans: ${response.status}`);
      const data = await response.json();
      setNutritionPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(t.connectionError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setEditForm({
      ptId: plan.ptId?.toString() || "",
      userId: plan.userId?.toString() || "",
      planNameAr: plan.planNameAr || "",
      planNameEn: plan.planNameEn || "",
      descriptionEn: plan.descriptionEn || "",
      descriptionAr: plan.descriptionAr || "",
      caloriesPerDay: plan.caloriesPerDay?.toString() || "",
      proteinGrams: plan.proteinGrams?.toString() || "",
      carbsGrams: plan.carbsGrams?.toString() || "",
    });
    setCurrentDescription(
      isAr ? plan.descriptionAr || "" : plan.descriptionEn || "",
    );
    setCurrentDescriptionLanguage(isAr ? "ar" : "en");
    setEditModalVisible(true);
  };

  const handleViewDetails = (plan) => {
    setSelectedPlanForDetails(plan);
    setDetailsModalVisible(true);
  };

  useEffect(() => {
    if (editModalVisible) {
      setCurrentDescription(
        currentDescriptionLanguage === "en"
          ? editForm.descriptionEn
          : editForm.descriptionAr,
      );
    }
  }, [currentDescriptionLanguage, editModalVisible]);

  const updatePlan = async () => {
    try {
      if (!selectedPlan?.id) {
        Alert.alert("Error", "No plan selected");
        return;
      }
      setEditing(true);
      const token = await handleGetToken();
      if (!token) {
        Alert.alert(t.connectionError, "Please login again");
        return;
      }
      const updatedForm = { ...editForm };
      if (currentDescriptionLanguage === "en")
        updatedForm.descriptionEn = currentDescription;
      else updatedForm.descriptionAr = currentDescription;
      const response = await fetch(`${API_URL}/${selectedPlan.id}`, {
        method: "PUT",
        headers: {
          accept: "text/plain",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ptId: parseInt(updatedForm.ptId) || 0,
          userId: parseInt(updatedForm.userId) || 0,
          planNameAr: updatedForm.planNameAr,
          planNameEn: updatedForm.planNameEn,
          descriptionEn: updatedForm.descriptionEn,
          descriptionAr: updatedForm.descriptionAr,
          caloriesPerDay: updatedForm.caloriesPerDay,
          proteinGrams: updatedForm.proteinGrams,
          carbsGrams: updatedForm.carbsGrams,
        }),
      });
      if (!response.ok) throw new Error(`${response.status}`);
      setNutritionPlans(
        nutritionPlans.map((p) =>
          p.id === selectedPlan.id ? { ...p, ...updatedForm } : p,
        ),
      );
      setEditModalVisible(false);
      Alert.alert(
        t.success || "Success",
        t.planUpdated || "Plan updated successfully!",
      );
    } catch (err) {
      Alert.alert(t.error || "Error", err.message || "Failed to update plan.");
    } finally {
      setEditing(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    Alert.alert(
      t.confirmDelete || "Confirm Delete",
      t.deletePlanConfirm || "Are you sure?",
      [
        { text: t.cancel || "Cancel", style: "cancel" },
        {
          text: t.delete || "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await handleGetToken();
              const response = await fetch(`${API_URL}/${planId}`, {
                method: "DELETE",
                headers: { accept: "*/*", Authorization: `Bearer ${token}` },
              });
              if (response.ok) {
                setNutritionPlans((prev) =>
                  prev.filter((p) => p.id !== planId),
                );
                Alert.alert(
                  t.success || "Success",
                  t.planDeleted || "Plan deleted!",
                );
              } else throw new Error(`${response.status}`);
            } catch (err) {
              Alert.alert(
                t.error || "Error",
                t.deleteError || "Failed to delete.",
              );
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    fetchNutritionPlans();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNutritionPlans();
  };
  const getFilteredPlans = () => nutritionPlans;

  const prepareHtmlContent = (html) => {
    if (!html || typeof html !== "string") return "";
    try {
      let p = String(html);
      p = p.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      p = p.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
      p = p.replace(/~~(.*?)~~/g, "<s>$1</s>");
      p = p.replace(/`(.*?)`/g, "<code>$1</code>");
      p = p.replace(/^# (.*$)/gm, "<h1>$1</h1>");
      p = p.replace(/^## (.*$)/gm, "<h2>$1</h2>");
      p = p.replace(/^### (.*$)/gm, "<h3>$1</h3>");
      p = p.replace(/\n/g, "<br/>");
      if (!p.startsWith("<")) p = `<p>${p}</p>`;
      return p;
    } catch {
      return String(html || "");
    }
  };

  const applyTextFormatting = (formatType) => {
    const { start, end } = selection;
    let text = currentDescription;
    if (start === end) {
      const tag = getFormattingTag(formatType);
      setCurrentDescription(text.slice(0, start) + tag + text.slice(start));
    } else {
      const sel = text.substring(start, end);
      let fmt = sel;
      switch (formatType) {
        case "heading1":
          fmt = `<h1>${sel}</h1>`;
          break;
        case "heading2":
          fmt = `<h2>${sel}</h2>`;
          break;
        case "heading3":
          fmt = `<h3>${sel}</h3>`;
          break;
        case "heading4":
          fmt = `<h4>${sel}</h4>`;
          break;
        case "heading5":
          fmt = `<h5>${sel}</h5>`;
          break;
        case "heading6":
          fmt = `<h6>${sel}</h6>`;
          break;
        case "bold":
          fmt = `<strong>${sel}</strong>`;
          break;
        case "italic":
          fmt = `<em>${sel}</em>`;
          break;
        case "underline":
          fmt = `<u>${sel}</u>`;
          break;
        case "bullet":
          fmt = `<ul><li>${sel}</li></ul>`;
          break;
        case "numbered":
          fmt = `<ol><li>${sel}</li></ol>`;
          break;
        case "link":
          fmt = `<a href="#">${sel}</a>`;
          break;
        case "divider":
          fmt = `${sel}<hr/>`;
          break;
      }
      setCurrentDescription(text.slice(0, start) + fmt + text.slice(end));
    }
  };

  const getFormattingTag = (f) => {
    switch (f) {
      case "heading1":
        return "<h1></h1>";
      case "heading2":
        return "<h2></h2>";
      case "heading3":
        return "<h3></h3>";
      case "bold":
        return "<strong></strong>";
      case "italic":
        return "<em></em>";
      case "underline":
        return "<u></u>";
      case "bullet":
        return "<ul>\n<li></li>\n</ul>";
      case "numbered":
        return "<ol>\n<li></li>\n</ol>";
      case "link":
        return '<a href=""></a>';
      case "divider":
        return "<hr/>\n";
      default:
        return "";
    }
  };

  const handleSavePlan = () => {
    const updatedForm = { ...editForm };
    if (currentDescriptionLanguage === "en")
      updatedForm.descriptionEn = currentDescription;
    else updatedForm.descriptionAr = currentDescription;
    setEditForm(updatedForm);
    setTimeout(() => updatePlan(), 100);
  };

  const renderFormattedPreview = (htmlContent) => {
    if (!htmlContent)
      return (
        <Text style={[S.previewEmptyText, { color: d.textMuted }]}>
          {t.noPreview || "No content to preview"}
        </Text>
      );
    return (
      <RenderHtml
        contentWidth={width - 80}
        source={{ html: prepareHtmlContent(htmlContent) }}
        baseStyle={{
          fontSize: 14,
          color: d.text,
          lineHeight: 20,
          textAlign: currentDescriptionLanguage === "ar" ? "right" : "left",
        }}
        tagsStyles={{
          h1: {
            fontSize: 24,
            fontWeight: "800",
            marginVertical: 8,
            color: d.text,
          },
          h2: {
            fontSize: 20,
            fontWeight: "700",
            marginVertical: 6,
            color: d.text,
          },
          h3: {
            fontSize: 18,
            fontWeight: "600",
            marginVertical: 4,
            color: d.text,
          },
          strong: { fontWeight: "700", color: d.text },
          em: { fontStyle: "italic" },
          u: { textDecorationLine: "underline" },
          ul: { marginLeft: 20, marginVertical: 8 },
          ol: { marginLeft: 20, marginVertical: 8 },
          li: { marginBottom: 4 },
          a: { color: "#667EEA" },
          hr: { height: 1, backgroundColor: d.border, marginVertical: 16 },
        }}
      />
    );
  };

  const renderDetailsModal = () => {
    if (!selectedPlanForDetails) return null;
    
    const plan = selectedPlanForDetails;
    const planName = isAr
      ? plan.planNameAr || plan.planNameEn || t.plan
      : plan.planNameEn || plan.planNameAr || t.plan;
    const description = isAr
      ? plan.descriptionAr || plan.descriptionEn || ""
      : plan.descriptionEn || plan.descriptionAr || "";
    const htmlContent = prepareHtmlContent(description);

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <SafeAreaView style={[S.modalContainer, { backgroundColor: d.bg }]}>
          <LinearGradient
            colors={["#667EEA", "#764BA2"]}
            style={S.detailsModalHeader}
          >
            <View style={S.detailsModalHeaderContent}>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={S.detailsModalCloseButton}
              >
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={S.detailsModalTitle}>{planName}</Text>
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>

          <ScrollView style={S.detailsModalBody} showsVerticalScrollIndicator={false}>
            {/* Nutrition Summary */}
            <View style={[S.detailsNutritionSection, { backgroundColor: d.surface, borderColor: d.border }]}>
              <Text style={[S.detailsSectionTitle, { color: d.text }]}>
                {t.nutritionSummary || "Nutrition Summary"}
              </Text>
              <View style={S.detailsNutritionGrid}>
                <View style={[S.detailsNutritionCard, { backgroundColor: "#FF7E5F20" }]}>
                  <Text style={S.detailsNutritionIcon}>🔥</Text>
                  <Text style={[S.detailsNutritionValue, { color: d.text }]}>
                    {plan.caloriesPerDay || "0"}
                  </Text>
                  <Text style={S.detailsNutritionUnit}>{t.kcal}</Text>
                  <Text style={S.detailsNutritionLabel}>{t.calories}</Text>
                </View>
                <View style={[S.detailsNutritionCard, { backgroundColor: "#4A90E220" }]}>
                  <Text style={S.detailsNutritionIcon}>💪</Text>
                  <Text style={[S.detailsNutritionValue, { color: d.text }]}>
                    {plan.proteinGrams || "0"}
                  </Text>
                  <Text style={S.detailsNutritionUnit}>{t.grams}</Text>
                  <Text style={S.detailsNutritionLabel}>{t.protein}</Text>
                </View>
                <View style={[S.detailsNutritionCard, { backgroundColor: "#38B2AC20" }]}>
                  <Text style={S.detailsNutritionIcon}>🌾</Text>
                  <Text style={[S.detailsNutritionValue, { color: d.text }]}>
                    {plan.carbsGrams || "0"}
                  </Text>
                  <Text style={S.detailsNutritionUnit}>{t.grams}</Text>
                  <Text style={S.detailsNutritionLabel}>{t.carbs}</Text>
                </View>
              </View>
            </View>

            {/* Full Description */}
            {description ? (
              <View style={[S.detailsDescriptionSection, { backgroundColor: d.surface, borderColor: d.border }]}>
                <Text style={[S.detailsSectionTitle, { color: d.text }]}>
                  {t.planDetails || "Plan Details"}
                </Text>
                <View style={[S.detailsDescriptionContent, { backgroundColor: d.surface2 }]}>
                  <RenderHtml
                    contentWidth={width - 40}
                    source={{ html: htmlContent }}
                    baseStyle={{
                      fontSize: 16,
                      color: d.textSub,
                      lineHeight: 26,
                      textAlign: isAr ? "right" : "left",
                    }}
                    tagsStyles={{
                      strong: { fontWeight: "700", color: d.text },
                      em: { fontStyle: "italic" },
                      h1: { fontSize: 24, fontWeight: "bold", marginVertical: 12, color: d.text },
                      h2: { fontSize: 20, fontWeight: "bold", marginVertical: 10, color: d.text },
                      h3: { fontSize: 18, fontWeight: "bold", marginVertical: 8, color: d.text },
                      ul: { marginLeft: 20, marginVertical: 10 },
                      ol: { marginLeft: 20, marginVertical: 10 },
                      li: { marginBottom: 6 },
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={[S.detailsDescriptionSection, { backgroundColor: d.surface, borderColor: d.border }]}>
                <Text style={[S.detailsSectionTitle, { color: d.text }]}>
                  {t.planDetails || "Plan Details"}
                </Text>
                <View style={[S.detailsNoDescription, { backgroundColor: d.surface2 }]}>
                  <Icon name="document-text" size={48} color={d.textMuted} />
                  <Text style={[S.detailsNoDescriptionText, { color: d.textMuted }]}>
                    {t.noDescription}
                  </Text>
                </View>
              </View>
            )}

            {/* Additional Info */}
            <View style={[S.detailsInfoSection, { backgroundColor: d.surface, borderColor: d.border }]}>
              <Text style={[S.detailsSectionTitle, { color: d.text }]}>
                {t.additionalInfo || "Additional Information"}
              </Text>
              <View style={S.detailsInfoRow}>
                <Icon name="person" size={20} color="#667EEA" />
                <Text style={[S.detailsInfoText, { color: d.textSub }]}>
                  {t.userId}: {plan.userId || "N/A"}
                </Text>
              </View>
              <View style={S.detailsInfoRow}>
                <Icon name="barbell" size={20} color="#667EEA" />
                <Text style={[S.detailsInfoText, { color: d.textSub }]}>
                  {t.ptId}: {plan.ptId || "N/A"}
                </Text>
              </View>
              <View style={S.detailsInfoRow}>
                <Icon name="calendar" size={20} color="#667EEA" />
                <Text style={[S.detailsInfoText, { color: d.textSub }]}>
                  {t.planId || "Plan ID"}: #{plan.id}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={[S.detailsModalFooter, { backgroundColor: d.surface, borderTopColor: d.border }]}>
            <TouchableOpacity
              style={S.detailsEditButton}
              onPress={() => {
                setDetailsModalVisible(false);
                handleEditPlan(plan);
              }}
            >
              <LinearGradient colors={["#667EEA", "#764BA2"]} style={S.detailsEditButtonGradient}>
                <Icon name="create" size={20} color="#FFF" />
                <Text style={S.detailsEditButtonText}>{t.editPlan || "Edit Plan"}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderEditModal = () => {
    const headingsArray = isAr
      ? ["ع1", "ع2", "ع3", "ع4", "ع5", "ع6"]
      : ["H1", "H2", "H3", "H4", "H5", "H6"];
    const formattingArray = isAr ? ["غ", "م", "ت"] : ["B", "I", "U"];

    return (
      <Modal
        animationType="slide"
        transparent
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={[S.modalOverlay]}>
            <View style={[S.modalContent, { backgroundColor: d.surface }]}>
              <LinearGradient
                colors={
                  currentDescriptionLanguage === "en"
                    ? ["#3B82F6", "#1D4ED8"]
                    : ["#059669", "#047857"]
                }
                style={S.modalHeader}
              >
                <View
                  style={[
                    S.modalHeaderContent,
                    isRTL && S.modalHeaderContentRTL,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => setEditModalVisible(false)}
                    style={S.modalCloseButton}
                  >
                    <Icon name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View
                    style={[
                      S.modalTitleContainer,
                      isRTL && S.modalTitleContainerRTL,
                    ]}
                  >
                    <Text style={S.modalTitle}>
                      {t.editPlan || "Edit Nutrition Plan"}
                    </Text>
                    <View style={S.languageToggleContainer}>
                      <TouchableOpacity
                        style={[
                          S.languageButton,
                          currentDescriptionLanguage === "en" &&
                            S.languageButtonActive,
                        ]}
                        onPress={() => setCurrentDescriptionLanguage("en")}
                      >
                        <Text
                          style={[
                            S.languageButtonText,
                            currentDescriptionLanguage === "en" &&
                              S.languageButtonTextActive,
                          ]}
                        >
                          EN
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          S.languageButton,
                          currentDescriptionLanguage === "ar" &&
                            S.languageButtonActive,
                        ]}
                        onPress={() => setCurrentDescriptionLanguage("ar")}
                      >
                        <Text
                          style={[
                            S.languageButtonText,
                            currentDescriptionLanguage === "ar" &&
                              S.languageButtonTextActive,
                          ]}
                        >
                          AR
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={S.modalSaveButton}
                    onPress={handleSavePlan}
                    disabled={editing}
                  >
                    {editing ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        {" "}
                        <Icon name="save" size={20} color="#FFF" />
                        <Text style={S.modalSaveText}>
                          {t.save || "Save"}
                        </Text>{" "}
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <ScrollView
                style={[S.modalBody]}
                showsVerticalScrollIndicator={false}
              >
                {/* Basic Info */}
                <View
                  style={[
                    S.sectionContainer,
                    { backgroundColor: d.surface, borderColor: d.border },
                  ]}
                >
                  <Text style={[S.sectionTitle, { color: d.text }]}>
                    {t.basicInfo || "Basic Information"}
                  </Text>
                  <View style={S.formGroup}>
                    <Text style={[S.formLabel, { color: d.textSub }]}>
                      {currentDescriptionLanguage === "en"
                        ? t.planNameEn || "Plan Name (English)"
                        : t.planNameAr || "Plan Name (Arabic)"}
                    </Text>
                    <TextInput
                      style={[
                        S.formInput,
                        {
                          backgroundColor: d.inputBg,
                          borderColor: d.border,
                          color: d.text,
                        },
                        currentDescriptionLanguage === "ar" && {
                          textAlign: "right",
                        },
                      ]}
                      value={
                        currentDescriptionLanguage === "en"
                          ? editForm.planNameEn
                          : editForm.planNameAr
                      }
                      onChangeText={(text) =>
                        setEditForm(
                          currentDescriptionLanguage === "en"
                            ? { ...editForm, planNameEn: text }
                            : { ...editForm, planNameAr: text },
                        )
                      }
                      placeholder={
                        currentDescriptionLanguage === "en"
                          ? "Enter plan name in English"
                          : "أدخل اسم الخطة بالعربية"
                      }
                      placeholderTextColor={d.textMuted}
                      textAlign={
                        currentDescriptionLanguage === "ar" ? "right" : "left"
                      }
                    />
                  </View>
                  <View style={S.nutritionFields}>
                    {[
                      {
                        key: "caloriesPerDay",
                        label: t.calories || "Calories",
                        placeholder: "e.g., 2000",
                      },
                      {
                        key: "proteinGrams",
                        label: t.protein || "Protein",
                        placeholder: "e.g., 150",
                      },
                      {
                        key: "carbsGrams",
                        label: t.carbs || "Carbs",
                        placeholder: "e.g., 250",
                      },
                    ].map(({ key, label, placeholder }) => (
                      <View style={S.formGroup} key={key}>
                        <Text style={[S.formLabel, { color: d.textSub }]}>
                          {label}
                        </Text>
                        <TextInput
                          style={[
                            S.formInput,
                            {
                              backgroundColor: d.inputBg,
                              borderColor: d.border,
                              color: d.text,
                            },
                          ]}
                          value={editForm[key]}
                          onChangeText={(text) =>
                            setEditForm({ ...editForm, [key]: text })
                          }
                          placeholder={placeholder}
                          placeholderTextColor={d.textMuted}
                          keyboardType="numeric"
                        />
                      </View>
                    ))}
                  </View>
                </View>

                {/* Rich Text Editor */}
                <View
                  style={[
                    S.sectionContainer,
                    { backgroundColor: d.surface, borderColor: d.border },
                  ]}
                >
                  <View style={[S.sectionHeader, isRTL && S.sectionHeaderRTL]}>
                    <Icon name="document-text" size={20} color={d.textSub} />
                    <Text
                      style={[
                        S.sectionTitle,
                        { color: d.text },
                        isRTL && S.textAlignRight,
                      ]}
                    >
                      {currentDescriptionLanguage === "en"
                        ? t.descriptionEn || "Description (English)"
                        : t.descriptionAr || "Description (Arabic)"}
                    </Text>
                  </View>

                  {/* Toolbar */}
                  <View
                    style={[
                      S.formatToolbar,
                      { backgroundColor: d.toolbarBg, borderColor: d.border },
                    ]}
                  >
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {/* Headings */}
                      <View
                        style={[S.toolbarSection, isRTL && S.toolbarSectionRTL]}
                      >
                        {headingsArray.map((h, i) => (
                          <TouchableOpacity
                            key={i}
                            style={[
                              S.toolbarIconButton,
                              {
                                backgroundColor: d.toolbarBtn,
                                borderColor: d.border,
                              },
                            ]}
                            onPress={() =>
                              applyTextFormatting(`heading${i + 1}`)
                            }
                          >
                            <Text
                              style={[
                                S.toolbarIconText,
                                {
                                  fontWeight: "bold",
                                  fontSize: 16 - i,
                                  color: d.text,
                                },
                              ]}
                            >
                              {h}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {/* Formatting */}
                      <View
                        style={[S.toolbarSection, isRTL && S.toolbarSectionRTL]}
                      >
                        {formattingArray.map((f, i) => (
                          <TouchableOpacity
                            key={i}
                            style={[
                              S.toolbarIconButton,
                              {
                                backgroundColor: d.toolbarBtn,
                                borderColor: d.border,
                              },
                            ]}
                            onPress={() =>
                              applyTextFormatting(
                                i === 0
                                  ? "bold"
                                  : i === 1
                                    ? "italic"
                                    : "underline",
                              )
                            }
                          >
                            <Text
                              style={[
                                S.toolbarIconText,
                                { color: d.text },
                                i === 0 && { fontWeight: "bold" },
                                i === 1 && { fontStyle: "italic" },
                                i === 2 && { textDecorationLine: "underline" },
                              ]}
                            >
                              {f}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {/* Lists */}
                      <View
                        style={[S.toolbarSection, isRTL && S.toolbarSectionRTL]}
                      >
                        <TouchableOpacity
                          style={[
                            S.toolbarIconButton,
                            {
                              backgroundColor: d.toolbarBtn,
                              borderColor: d.border,
                            },
                          ]}
                          onPress={() => applyTextFormatting("bullet")}
                        >
                          <Text style={[S.toolbarIconText, { color: d.text }]}>
                            •
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            S.toolbarIconButton,
                            {
                              backgroundColor: d.toolbarBtn,
                              borderColor: d.border,
                            },
                          ]}
                          onPress={() => applyTextFormatting("numbered")}
                        >
                          <Text style={[S.toolbarIconText, { color: d.text }]}>
                            1.
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            S.toolbarIconButton,
                            {
                              backgroundColor: d.toolbarBtn,
                              borderColor: d.border,
                            },
                          ]}
                          onPress={() => applyTextFormatting("link")}
                        >
                          <Icon name="link" size={18} color={d.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            S.toolbarIconButton,
                            {
                              backgroundColor: d.toolbarBtn,
                              borderColor: d.border,
                            },
                          ]}
                          onPress={() => applyTextFormatting("divider")}
                        >
                          <Icon name="remove" size={18} color={d.text} />
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>

                  <Text style={[S.toolbarHintText, { color: d.textMuted }]}>
                    {t.toolbarHint || "Select text and use toolbar to format"}
                  </Text>

                  {/* Preview */}
                  <View style={S.previewSection}>
                    <Text style={[S.previewTitle, { color: d.textSub }]}>
                      {t.preview || "Live Preview:"}
                    </Text>
                    <ScrollView
                      style={[
                        S.previewBox,
                        { backgroundColor: d.inputBg, borderColor: d.border },
                      ]}
                      nestedScrollEnabled
                    >
                      {renderFormattedPreview(currentDescription)}
                    </ScrollView>
                  </View>

                  {/* Editor */}
                  <TextInput
                    ref={textInputRef}
                    style={[
                      S.formatTextInput,
                      {
                        backgroundColor: d.inputBg,
                        borderColor: d.border,
                        color: d.text,
                      },
                      isRTL && S.formatTextInputRTL,
                      currentDescriptionLanguage === "ar" && {
                        textAlign: "right",
                      },
                    ]}
                    value={currentDescription}
                    onChangeText={setCurrentDescription}
                    onSelectionChange={(e) =>
                      setSelection(e.nativeEvent.selection)
                    }
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                    placeholderTextColor={d.textMuted}
                    placeholder={
                      currentDescriptionLanguage === "en"
                        ? "Start typing your content here..."
                        : "ابدأ بكتابة محتوىك هنا..."
                    }
                  />
                </View>
              </ScrollView>

              {/* Footer */}
              <View
                style={[
                  S.modalFooter,
                  {
                    backgroundColor: d.surface,
                    borderTopColor: d.border,
                    borderTopWidth: 1,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    S.cancelButton,
                    { backgroundColor: d.surface2, borderColor: d.border },
                  ]}
                  onPress={() => setEditModalVisible(false)}
                  disabled={editing}
                >
                  <Text style={[S.cancelButtonText, { color: d.textSub }]}>
                    {t.cancel || "Cancel"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[S.saveButton, editing && S.saveButtonDisabled]}
                  onPress={handleSavePlan}
                  disabled={editing}
                >
                  {editing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Icon name="save" size={20} color="#FFF" />
                      <Text style={S.saveButtonText}>
                        {t.save || "Save Changes"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderNutritionPlanItem = ({ item, index }) => {
    if (!item) return null;
    
    const planName = isAr
      ? item.planNameAr || item.planNameEn || `${t.plan} ${index + 1}`
      : item.planNameEn || item.planNameAr || `${t.plan} ${index + 1}`;
    
    // Get first two rows of description (split by newline or HTML tags)
    const description = isAr
      ? item.descriptionAr || item.descriptionEn || ""
      : item.descriptionEn || item.descriptionAr || "";
    
    // Extract first two lines for preview
    const getFirstTwoRows = (text) => {
      if (!text) return "";
      // Remove HTML tags for preview
      const plainText = text.replace(/<[^>]*>/g, '');
      const lines = plainText.split('\n').filter(line => line.trim().length > 0);
      const firstTwo = lines.slice(0, 2).join('\n');
      return firstTwo.length > 100 ? firstTwo.substring(0, 100) + '...' : firstTwo;
    };
    
    const previewText = getFirstTwoRows(description);
    const hasMoreContent = description.replace(/<[^>]*>/g, '').split('\n').filter(line => line.trim().length > 0).length > 2;

    const nutritionCards = [
      {
        label: t.calories,
        value: item.caloriesPerDay || "0",
        unit: t.kcal,
        icon: "🔥",
        gradient: ["#FF7E5F", "#FEB47B"],
      },
      {
        label: t.protein,
        value: item.proteinGrams || "0",
        unit: t.grams,
        icon: "💪",
        gradient: ["#4A90E2", "#63B3ED"],
      },
      {
        label: t.carbs,
        value: item.carbsGrams || "0",
        unit: t.grams,
        icon: "🌾",
        gradient: ["#38B2AC", "#4FD1C5"],
      },
    ];

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => handleViewDetails(item)}
        style={[S.planCard, { shadowColor: dark ? "#000" : "#000" }]}
      >
        <View
          style={[
            S.cardGradient,
            {
              backgroundColor: d.cardBg,
              borderColor: d.cardBorder,
              borderWidth: 1,
            },
          ]}
        >
          {/* Header */}
          <View style={[S.cardHeader, isRTL && S.cardHeaderRTL]}>
            <LinearGradient colors={["#667EEA", "#764BA2"]} style={S.planBadge}>
              <Icon name="nutrition" size={16} color="#FFF" />
              <Text style={S.planBadgeText}>
                {t.plan} #{item.id || index + 1}
              </Text>
            </LinearGradient>
            <View style={[S.actionButtons, isRTL && S.actionButtonsRTL]}>
              <TouchableOpacity
                style={[S.editButton, dark && { backgroundColor: "#1E3A5F" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleEditPlan(item);
                }}
              >
                <Icon name="create" size={18} color="#667EEA" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.deleteButton, dark && { backgroundColor: "#2D1515" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeletePlan(item.id);
                }}
              >
                <Icon name="trash" size={18} color="#FC8181" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[S.planTitle, { color: d.text }, isAr && S.arabicText]}>
            {planName}
          </Text>

          {/* Nutrition Grid - First row of details */}
          <View style={[S.nutritionGrid, isRTL && S.nutritionGridRTL]}>
            {nutritionCards.map((card, idx) => (
              <LinearGradient
                key={idx}
                colors={card.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={S.nutritionCard}
              >
                <Text style={S.nutritionIcon}>{card.icon}</Text>
                <Text style={S.nutritionValue}>{card.value}</Text>
                <Text style={S.nutritionUnit}>{card.unit}</Text>
                <Text style={[S.nutritionLabel, isRTL && S.textAlignRight ]}>
                  {card.label}
                </Text>
              </LinearGradient>
            ))}
          </View>

          {/* Preview of first two rows */}
          {previewText ? (
            <View style={[S.previewRowsContainer, { borderTopColor: d.border }]}>
              <View style={[S.sectionHeader, isRTL && S.sectionHeaderRTL]}>
                <Icon name="document-text" size={16} color={d.textSub} />
                <Text style={[S.previewRowsTitle, { color: d.textSub }]}>
                  {t.preview || "Preview"}
                </Text>
              </View>
              <Text 
                style={[S.previewRowsText, { color: d.textSub }, isAr && S.arabicText]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {previewText}
              </Text>
              {hasMoreContent && (
                <View style={[S.viewMoreContainer, isRTL && S.viewMoreContainerRTL]}>
                  <Text style={S.viewMoreText}>{t.tapToViewMore || "Tap to view full details"}</Text>
                  <Icon name="chevron-forward" size={14} color="#667EEA" />
                </View>
              )}
            </View>
          ) : (
            <View style={[S.noDescriptionMini, { backgroundColor: d.surface2, borderColor: d.border }]}>
              <Icon name="document-text" size={20} color={d.textMuted} />
              <Text style={[S.noDescriptionMiniText, { color: d.textMuted }]}>
                {t.noDescription}
              </Text>
            </View>
          )}

          {/* Footer with user info (always visible) */}
          <View
            style={[
              S.cardFooter,
              { borderTopColor: d.border },
              isRTL && S.cardFooterRTL,
            ]}
          >
            <View style={[S.userInfo, isRTL && S.userInfoRTL]}>
              <Icon name="person" size={14} color="#667EEA" />
              <Text style={[S.userInfoText, { color: d.textSub }]}>
                {t.userId}: {item.userId || "N/A"}
              </Text>
            </View>
            <View style={[S.userInfo, isRTL && S.userInfoRTL]}>
              <Icon name="barbell" size={14} color="#667EEA" />
              <Text style={[S.userInfoText, { color: d.textSub }]}>
                {t.ptId}: {item.ptId || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={S.emptyContainer}>
      <LinearGradient colors={["#667EEA", "#764BA2"]} style={S.emptyCircle}>
        <Icon name="nutrition" size={60} color="#FFF" />
      </LinearGradient>
      <Text
        style={[S.emptyTitle, { color: d.text }, isRTL && S.textAlignRight]}
      >
        {t.noPlansTitle}
      </Text>
      <Text
        style={[
          S.emptyMessage,
          { color: d.textSub },
          isRTL && S.textAlignRight,
        ]}
      >
        {t.noPlansMessage}
      </Text>
      <TouchableOpacity style={S.refreshButton} onPress={fetchNutritionPlans}>
        <LinearGradient
          colors={["#667EEA", "#764BA2"]}
          style={S.refreshButtonGradient}
        >
          <Icon name="refresh" size={20} color="#FFF" />
          <Text style={S.refreshButtonText}>{t.refreshList}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={S.emptyContainer}>
      <View
        style={[S.errorIllustration, dark && { backgroundColor: "#2D1515" }]}
      >
        <Icon name="warning" size={60} color="#FC8181" />
      </View>
      <Text
        style={[S.emptyTitle, { color: d.text }, isRTL && S.textAlignRight]}
      >
        {t.connectionError}
      </Text>
      <Text
        style={[
          S.emptyMessage,
          { color: d.textSub },
          isRTL && S.textAlignRight,
        ]}
      >
        {error}
      </Text>
      <TouchableOpacity style={S.refreshButton} onPress={fetchNutritionPlans}>
        <LinearGradient
          colors={["#FC8181", "#F56565"]}
          style={S.refreshButtonGradient}
        >
          <Icon name="refresh" size={20} color="#FFF" />
          <Text style={S.refreshButtonText}>{t.tryAgain}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[S.loadingContainer, { backgroundColor: d.bg }]}>
        <StatusBar
          barStyle={dark ? "light-content" : "dark-content"}
          backgroundColor={d.bg}
        />
        <View style={S.loadingContent}>
          <ActivityIndicator size="large" color="#667EEA" />
          <Text
            style={[
              S.loadingText,
              { color: d.text },
              isRTL && S.textAlignRight,
            ]}
          >
            {t.loadingText}
          </Text>
          <Text
            style={[
              S.loadingSubtext,
              { color: d.textSub },
              isRTL && S.textAlignRight,
            ]}
          >
            {t.loadingSubtext}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[S.container, { backgroundColor: d.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor="#667EEA" />

      {/* Header — gradient stays, always looks good in both modes */}
      <LinearGradient
        colors={["#667EEA", "#764BA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={S.header}
      >
        <View
          style={[
            S.headerContent,
            {
              paddingTop:
                Platform.OS === "android" ? StatusBar.currentHeight || 20 : 0,
            },
          ]}
        >
          <View style={[S.headerTop, isRTL && S.headerTopRTL]}>
            <View style={S.headerText}>
              <Text style={[S.welcomeText, isRTL && S.textAlignRight]}>
                {t.welcomeBack}
              </Text>
              <Text style={[S.headerTitle, isRTL && S.textAlignRight]}>
                {t.nutritionPlans}
              </Text>
            </View>
            <TouchableOpacity style={S.profileButton}>
              <LinearGradient
                colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                style={S.profileGradient}
              >
                <Icon name="person" size={24} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={[S.statsOverview, isRTL && S.statsOverviewRTL]}>
            <View style={S.statItem}>
              <Text style={S.statNumber}>{nutritionPlans.length}</Text>
              <Text style={S.statLabel}>{t.totalPlans}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={getFilteredPlans()}
        renderItem={renderNutritionPlanItem}
        keyExtractor={(item, index) => `plan-${item?.id || index}`}
        contentContainerStyle={S.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={error ? renderErrorState : renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#667EEA"]}
            tintColor="#667EEA"
          />
        }
      />

      {editModalVisible && renderEditModal()}
      {renderDetailsModal()}

      <TouchableOpacity
        style={[S.fab, isRTL && S.fabRTL]}
        onPress={fetchNutritionPlans}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#667EEA", "#764BA2"]} style={S.fabGradient}>
          <Icon name="refresh" size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const S = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingContent: { alignItems: "center", padding: 20 },
  loadingText: { fontSize: 18, fontWeight: "600", marginTop: 20 },
  loadingSubtext: { fontSize: 14, marginTop: 8, textAlign: "center" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { paddingTop: 20, marginTop: 50 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTopRTL: { flexDirection: "row-reverse" },
  headerText: { flex: 1 },
  welcomeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  profileButton: { width: 44, height: 44 },
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  statsOverview: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 16,
  },
  statsOverviewRTL: { flexDirection: "row-reverse" },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  listContainer: { padding: 20, paddingBottom: 100 },
  planCard: {
    marginBottom: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardGradient: { borderRadius: 24, padding: 20, overflow: "hidden" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderRTL: { flexDirection: "row-reverse" },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  planBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  actionButtons: { flexDirection: "row", gap: 8 },
  actionButtonsRTL: { flexDirection: "row-reverse" },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FED7D7",
    justifyContent: "center",
    alignItems: "center",
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    marginBottom: 20,
  },
  arabicText: { textAlign: "right", writingDirection: "rtl" },
  nutritionGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
  nutritionGridRTL: { flexDirection: "row-reverse" },
  nutritionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  nutritionIcon: { fontSize: 24, marginBottom: 8 },
  nutritionValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 2,
  },
  nutritionUnit: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  previewRowsContainer: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  previewRowsTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewRowsText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  viewMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 4,
  },
  viewMoreContainerRTL: {
    flexDirection: "row-reverse",
  },
  viewMoreText: {
    fontSize: 12,
    color: "#667EEA",
    fontWeight: "500",
  },
  noDescriptionMini: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: "row",
    gap: 8,
  },
  noDescriptionMiniText: {
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeaderRTL: { flexDirection: "row-reverse" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  cardFooterRTL: { flexDirection: "row-reverse" },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  userInfoRTL: { flexDirection: "row-reverse" },
  userInfoText: { fontSize: 13, fontWeight: "500" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FED7D7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
  },
  refreshButton: { width: "100%" },
  refreshButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  refreshButtonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  fab: { position: "absolute", bottom: 30, right: 20, zIndex: 1000 },
  fabRTL: { right: "auto" as any, left: 20 },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  textAlignRight: { textAlign: "right" },
  
  // Details Modal Styles
  modalContainer: { flex: 1 },
  detailsModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  detailsModalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight || 20 : 10,
  },
  detailsModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    flex: 1,
    textAlign: "center",
  },
  detailsModalBody: { flex: 1, padding: 20 },
  detailsNutritionSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  detailsNutritionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  detailsNutritionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  detailsNutritionIcon: { fontSize: 28, marginBottom: 8 },
  detailsNutritionValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  detailsNutritionUnit: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "500",
    marginBottom: 4,
  },
  detailsNutritionLabel: {
    fontSize: 13,
    color: "#4A5568",
    fontWeight: "500",
  },
  detailsDescriptionSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailsDescriptionContent: {
    borderRadius: 12,
    padding: 16,
  },
  detailsNoDescription: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  detailsNoDescriptionText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  detailsInfoSection: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 80,
    borderWidth: 1,
  },
  detailsInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  detailsInfoText: {
    fontSize: 15,
    fontWeight: "500",
  },
  detailsModalFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  detailsEditButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  detailsEditButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  detailsEditButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  
  // Edit Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalHeaderContentRTL: { flexDirection: "row-reverse" },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#FFF" },
  modalTitleContainer: { flex: 1, alignItems: "center", paddingHorizontal: 10 },
  modalTitleContainerRTL: { alignItems: "flex-end" },
  modalSaveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  modalSaveText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  languageToggleContainer: {
    flexDirection: "row",
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 4,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  languageButtonActive: { backgroundColor: "#FFF" },
  languageButtonText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  languageButtonTextActive: { color: "#3B82F6" },
  sectionContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  formatToolbar: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  toolbarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 16,
  },
  toolbarSectionRTL: {
    flexDirection: "row-reverse",
    marginRight: 0,
    marginLeft: 16,
  },
  toolbarIconButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  toolbarIconText: { fontSize: 14 },
  toolbarHintText: {
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 12,
  },
  previewSection: { marginBottom: 16 },
  previewTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  previewBox: { maxHeight: 200, borderRadius: 12, padding: 16, borderWidth: 1 },
  previewEmptyText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    padding: 20,
  },
  formatTextInput: {
    minHeight: 150,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    fontSize: 14,
    textAlignVertical: "top",
  },
  formatTextInputRTL: { textAlign: "right" },
  modalBody: { padding: 24, maxHeight: height * 0.6 },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  nutritionFields: { flexDirection: "row", gap: 12 },
  modalFooter: { flexDirection: "row", padding: 24, paddingTop: 16, gap: 12 },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelButtonText: { fontSize: 16, fontWeight: "600" },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#667EEA",
    gap: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
});

export default NutritionPlanScreen;