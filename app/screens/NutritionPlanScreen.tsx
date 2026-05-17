import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  I18nManager,
} from "react-native";
import CustomHeader from "../components/CustomHeader";
import i18n from "../localization";
import Colors from "../constants/Colors";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#0F0F0F" : "#F8FAFC",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  surfaceAlt: dark ? "#252525" : "#F8FAFC",
  ink: dark ? "#F0F0F0" : "#1E293B",
  muted: dark ? "#94A3B8" : "#64748B",
  subtle: dark ? "#666666" : "#94A3B8",
  border: dark ? "#2C2C2C" : "#F1F5F9",
  borderAlt: dark ? "#333333" : "#E2E8F0",
  badgeBg: dark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)",
  badgeText: dark ? "#F0F0F0" : "#1E293B",
  closeBtn: dark ? "#2C2C2C" : "#F8FAFC",
  emptyCircle: dark ? "#2C2C2C" : "#F1F5F9",
  emptyIcon: dark ? "#444444" : "#E2E8F0",
  nutritionBg: dark ? "#1A1A1A" : "#F8FAFC",
  nutritionCard: dark ? "#252525" : "#FFFFFF",
  htmlText: dark ? "#CBD5E1" : "#334155",
  htmlMuted: dark ? "#94A3B8" : "#64748B",
  htmlHeading: dark ? "#F0F0F0" : "#1E293B",
});

export default function NutritionPlanScreen() {
  const navigation = useNavigation();
  const { width } = Dimensions.get("window");
  const { isArabic } = useI18n();
  const { isDarkMode } = useAppContext(); // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const [rawPlans, setRawPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRawPlan, setSelectedRawPlan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const API_URL =
    "https://gym.useitsmart.com/api/NutritionPlan/GetAllNutritionPlanForUser";

  const rtl = (style: any = {}) => ({
    ...style,
    flexDirection: isArabic() ? "row-reverse" : "row",
  });
  const rtlText = (style: any = {}) => ({
    ...style,
    textAlign: isArabic() ? "right" : "left",
    writingDirection: isArabic() ? "rtl" : "ltr",
  });

  const prepareHtmlContent = (html: string) => {
    if (!html || typeof html !== "string") return "";
    try {
      let processed = String(html);
      processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      processed = processed.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      processed = processed.replace(/__([^__]+)__/g, "<strong>$1</strong>");
      processed = processed.replace(/_([^_]+)_/g, "<em>$1</em>");
      processed = processed.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
      processed = processed.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
      processed = processed.replace(/^### (.*$)/gm, "<h3>$1</h3>");
      processed = processed.replace(/^## (.*$)/gm, "<h2>$1</h2>");
      processed = processed.replace(/^# (.*$)/gm, "<h1>$1</h1>");
      processed = processed.replace(/---/g, "<hr/>");
      processed = processed.replace(/\n/g, "<br/>");
      if (processed.trim() && !processed.startsWith("<"))
        processed = `<p>${processed}</p>`;
      return processed;
    } catch (e) {
      return String(html || "");
    }
  };

  const getPlanDisplay = (plan: any, index: number) => ({
    id: plan.id || index + 1,
    title: isArabic()
      ? plan.planNameAr || i18n.t("nutrition_plan")
      : plan.planNameEn || i18n.t("nutrition_plan"),
    descriptionHtml: isArabic()
      ? prepareHtmlContent(plan.descriptionAr || "")
      : prepareHtmlContent(plan.descriptionEn || ""),
    fullDescriptionHtml: isArabic()
      ? prepareHtmlContent(plan.descriptionAr || "")
      : prepareHtmlContent(plan.descriptionEn || ""),
    icon: getPlanIcon(plan, index),
    theme: getPlanTheme(plan, index),
    calories: plan.caloriesPerDay,
    protein: plan.proteinGrams,
    carbs: plan.carbsGrams,
    ptId: plan.ptId,
  });

  const fetchNutritionPlans = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const USER_ID = await AsyncStorage.getItem("MemberId");
      const response = await fetch(`${API_URL}?userId=${USER_ID}`, {
        method: "GET",
        headers: { accept: "text/plain", "Content-Type": "application/json" },
      });
      if (!response.ok)
        throw new Error(`${i18n.t("server_error")} (${response.status})`);
      const data = await response.json();
      const validPlans = Array.isArray(data)
        ? data.filter(
            (plan: any) =>
              plan &&
              !(
                plan.planNameEn === "string" &&
                plan.planNameAr === "string" &&
                plan.descriptionEn === "string" &&
                plan.descriptionAr === "string"
              ),
          )
        : [];
      setRawPlans(validPlans);
    } catch (err: any) {
      setError(err.message);
      if (!isRefreshing)
        Alert.alert(
          i18n.t("unable_to_load_plans"),
          err.message || i18n.t("check_connection"),
          [{ text: i18n.t("retry"), onPress: () => fetchNutritionPlans() }],
        );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPlanTheme = (plan: any, index: number) => {
    const title = (plan.planNameEn || plan.planNameAr || "").toLowerCase();
    const themes = [
      {
        primary: "#8B5CF6",
        secondary: isDarkMode ? "#2D1F4E" : "#F5F3FF",
        icon: "#8B5CF6",
      },
      {
        primary: "#10B981",
        secondary: isDarkMode ? "#1A3D2E" : "#D1FAE5",
        icon: "#10B981",
      },
      {
        primary: "#F59E0B",
        secondary: isDarkMode ? "#3D2E0A" : "#FEF3C7",
        icon: "#F59E0B",
      },
      {
        primary: "#3B82F6",
        secondary: isDarkMode ? "#1A2C4E" : "#DBEAFE",
        icon: "#3B82F6",
      },
      {
        primary: "#EF4444",
        secondary: isDarkMode ? "#3D1A1A" : "#FEE2E2",
        icon: "#EF4444",
      },
      {
        primary: "#EC4899",
        secondary: isDarkMode ? "#3D1A2E" : "#FCE7F3",
        icon: "#EC4899",
      },
    ];
    if (title.includes("loss") || title.includes("weight")) return themes[2];
    if (
      title.includes("muscle") ||
      title.includes("gain") ||
      title.includes("strength")
    )
      return themes[1];
    if (title.includes("basic") || title.includes("standard")) return themes[3];
    if (title.includes("vegan") || title.includes("vegetarian"))
      return themes[1];
    if (title.includes("keto") || title.includes("low carb")) return themes[0];
    return themes[index % themes.length];
  };

  const getPlanIcon = (plan: any, index: number) => {
    const title = (plan.planNameEn || plan.planNameAr || "").toLowerCase();
    if (title.includes("loss") || title.includes("weight"))
      return "scale-bathroom";
    if (
      title.includes("muscle") ||
      title.includes("gain") ||
      title.includes("strength")
    )
      return "dumbbell";
    if (title.includes("basic") || title.includes("standard"))
      return "food-apple-outline";
    if (title.includes("vegan") || title.includes("vegetarian")) return "leaf";
    if (title.includes("keto") || title.includes("low carb"))
      return "egg-outline";
    if (title.includes("athlete") || title.includes("performance"))
      return "run-fast";
    const icons = [
      "food-apple-outline",
      "dumbbell",
      "scale-bathroom",
      "heart-pulse",
      "run-fast",
      "food-variant",
    ];
    return icons[index % icons.length];
  };

  // 👇 HTML configs now use theme colors
  const htmlPreviewConfig = {
    baseStyle: {
      fontSize: 14,
      color: theme.htmlMuted,
      lineHeight: 20,
      textAlign: isArabic() ? "right" : "left",
      writingDirection: isArabic() ? "rtl" : "ltr",
    },
    tagsStyles: {
      p: { marginBottom: 6, textAlign: isArabic() ? "right" : "left" },
      strong: { fontWeight: "600", color: theme.htmlHeading },
      em: { fontStyle: "italic", color: theme.htmlMuted },
      h1: {
        fontSize: 16,
        fontWeight: "700",
        marginVertical: 8,
        color: theme.htmlHeading,
        textAlign: isArabic() ? "right" : "left",
      },
      h2: {
        fontSize: 15,
        fontWeight: "700",
        marginVertical: 6,
        color: theme.htmlHeading,
        textAlign: isArabic() ? "right" : "left",
      },
      h3: {
        fontSize: 14,
        fontWeight: "700",
        marginVertical: 4,
        color: theme.htmlHeading,
        textAlign: isArabic() ? "right" : "left",
      },
      h4: {
        fontSize: 13,
        fontWeight: "600",
        marginVertical: 4,
        color: theme.htmlHeading,
      },
      h5: {
        fontSize: 12,
        fontWeight: "600",
        marginVertical: 4,
        color: theme.htmlHeading,
      },
      h6: {
        fontSize: 11,
        fontWeight: "600",
        marginVertical: 4,
        color: theme.htmlHeading,
      },
      hr: { height: 1, backgroundColor: theme.borderAlt, marginVertical: 12 },
      ul: {
        marginLeft: isArabic() ? 0 : 16,
        marginRight: isArabic() ? 16 : 0,
        marginVertical: 8,
      },
      ol: {
        marginLeft: isArabic() ? 0 : 16,
        marginRight: isArabic() ? 16 : 0,
        marginVertical: 8,
      },
      li: { marginBottom: 4, textAlign: isArabic() ? "right" : "left" },
      span: { fontSize: 14, color: theme.htmlMuted },
    },
  };

  const htmlFullConfig = {
    baseStyle: {
      fontSize: 16,
      color: theme.htmlText,
      lineHeight: 24,
      textAlign: isArabic() ? "right" : "left",
      writingDirection: isArabic() ? "rtl" : "ltr",
    },
    tagsStyles: {
      p: { marginBottom: 16, textAlign: isArabic() ? "right" : "left" },
      strong: { fontWeight: "700", color: theme.htmlHeading },
      em: { fontStyle: "italic", color: theme.htmlMuted },
      u: { textDecorationLine: "underline" },
      h1: {
        fontSize: 24,
        fontWeight: "800",
        marginVertical: 20,
        color: theme.htmlHeading,
        textAlign: isArabic() ? "right" : "left",
      },
      h2: {
        fontSize: 22,
        fontWeight: "700",
        marginVertical: 18,
        color: theme.htmlHeading,
        textAlign: isArabic() ? "right" : "left",
      },
      h3: {
        fontSize: 20,
        fontWeight: "700",
        marginVertical: 16,
        color: theme.htmlHeading,
        textAlign: isArabic() ? "right" : "left",
      },
      h4: {
        fontSize: 18,
        fontWeight: "600",
        marginVertical: 14,
        color: theme.htmlHeading,
      },
      h5: {
        fontSize: 16,
        fontWeight: "600",
        marginVertical: 12,
        color: theme.htmlHeading,
      },
      h6: {
        fontSize: 15,
        fontWeight: "600",
        marginVertical: 10,
        color: theme.htmlHeading,
      },
      hr: { height: 2, backgroundColor: theme.borderAlt, marginVertical: 24 },
      ul: {
        marginLeft: isArabic() ? 0 : 20,
        marginRight: isArabic() ? 20 : 0,
        marginVertical: 16,
      },
      ol: {
        marginLeft: isArabic() ? 0 : 20,
        marginRight: isArabic() ? 20 : 0,
        marginVertical: 16,
      },
      li: {
        marginBottom: 8,
        fontSize: 16,
        lineHeight: 24,
        textAlign: isArabic() ? "right" : "left",
      },
      span: { fontSize: 16, color: theme.htmlText },
      code: {
        backgroundColor: theme.surfaceAlt,
        fontFamily: "monospace",
        padding: 8,
        borderRadius: 6,
        fontSize: 14,
      },
    },
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNutritionPlans(true);
  };

  useEffect(() => {
    fetchNutritionPlans();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      fetchNutritionPlans();
    }, []),
  );

  const selectedPlanDisplay = selectedRawPlan
    ? getPlanDisplay(selectedRawPlan, rawPlans.indexOf(selectedRawPlan))
    : null;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={s.safeArea}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[s.loadingText, rtlText()]}>
            {i18n.t("loading_nutrition_plans")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && rawPlans.length === 0) {
    return (
      <SafeAreaView style={s.safeArea}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={s.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={80}
            color="#F87171"
          />
          <Text style={[s.errorTitle, rtlText()]}>
            {i18n.t("unable_to_load_plans")}
          </Text>
          <Text style={[s.errorText, rtlText()]}>{error}</Text>
          <TouchableOpacity
            style={s.retryButton}
            onPress={() => fetchNutritionPlans()}
          >
            <Text style={s.retryButtonText}>{i18n.t("try_again")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#8B5CF6"]}
            tintColor="#8B5CF6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {rawPlans.length > 0 && (
          <View style={s.statsContainer}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{rawPlans.length}</Text>
              <Text style={[s.statLabel, rtlText()]}>
                {i18n.t("total_plans")}
              </Text>
            </View>
          </View>
        )}

        {rawPlans.length === 0 && !loading && !error ? (
          <View style={s.emptyContainer}>
            <View style={s.emptyIllustration}>
              <MaterialCommunityIcons
                name="notebook-outline"
                size={100}
                color={theme.emptyIcon}
              />
            </View>
            <Text style={[s.emptyTitle, rtlText()]}>
              {i18n.t("no_active_plans")}
            </Text>
            <Text style={[s.emptyText, rtlText()]}>
              {i18n.t("no_plans_message")}
            </Text>
            <TouchableOpacity
              style={s.emptyButton}
              onPress={() => fetchNutritionPlans()}
            >
              <Text style={s.emptyButtonText}>{i18n.t("refresh")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.plansGrid}>
            {rawPlans.map((rawPlan: any, index: number) => {
              const plan = getPlanDisplay(rawPlan, index);
              return (
                <TouchableOpacity
                  key={`${plan.id}-${plan.ptId}`}
                  style={[
                    s.planCard,
                    { backgroundColor: plan.theme.secondary },
                  ]}
                  onPress={() => {
                    setSelectedRawPlan(rawPlan);
                    setModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      s.iconContainer,
                      { backgroundColor: plan.theme.primary + "20" },
                      isArabic() ? s.iconContainerRTL : s.iconContainerLTR,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={plan.icon}
                      size={28}
                      color={plan.theme.primary}
                    />
                  </View>

                  <View style={s.planContent}>
                    <View style={rtl(s.planHeader)}>
                      <Text
                        style={[
                          s.planTitle,
                          { color: plan.theme.primary },
                          rtlText(),
                        ]}
                      >
                        {plan.title}
                      </Text>
                      <MaterialCommunityIcons
                        name={isArabic() ? "chevron-left" : "chevron-right"}
                        size={20}
                        color={plan.theme.primary}
                      />
                    </View>

                    {plan.descriptionHtml ? (
                      <View style={s.descriptionContainer}>
                        <RenderHtml
                          contentWidth={width - 80}
                          source={{ html: plan.descriptionHtml }}
                          baseStyle={htmlPreviewConfig.baseStyle}
                          tagsStyles={htmlPreviewConfig.tagsStyles}
                          defaultTextProps={{
                            numberOfLines: 3,
                            ellipsizeMode: "tail",
                          }}
                        />
                        <TouchableOpacity
                          style={[
                            s.viewFullButton,
                            isArabic() && s.viewFullButtonRTL,
                          ]}
                          onPress={() => {
                            setSelectedRawPlan(rawPlan);
                            setModalVisible(true);
                          }}
                        >
                          <Text
                            style={[
                              s.viewFullText,
                              { color: plan.theme.primary },
                              rtlText(),
                            ]}
                          >
                            {i18n.t("view_full_description")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={s.noDescriptionContainer}>
                        <Text style={[s.noDescriptionText, rtlText()]}>
                          {i18n.t("no_description")}
                        </Text>
                      </View>
                    )}

                    <View style={[s.statsRow, isArabic() && s.statsRowRTL]}>
                      {plan.calories && plan.calories !== "string" && (
                        <View style={rtl(s.statBadge)}>
                          <MaterialCommunityIcons
                            name="fire"
                            size={14}
                            color="#F97316"
                          />
                          <Text style={s.statBadgeText}>
                            {plan.calories} {i18n.t("kcal")}
                          </Text>
                        </View>
                      )}
                      {plan.protein && plan.protein !== "string" && (
                        <View style={rtl(s.statBadge)}>
                          <MaterialCommunityIcons
                            name="egg"
                            size={14}
                            color="#10B981"
                          />
                          <Text style={s.statBadgeText}>
                            {plan.protein}
                            {i18n.t("g_protein")}
                          </Text>
                        </View>
                      )}
                      {plan.carbs && plan.carbs !== "string" && (
                        <View style={rtl(s.statBadge)}>
                          <MaterialCommunityIcons
                            name="wheat"
                            size={14}
                            color="#3B82F6"
                          />
                          <Text style={s.statBadgeText}>
                            {plan.carbs}
                            {i18n.t("g_carbs")}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={[s.cardFooter, isArabic() && s.cardFooterRTL]}>
                      <View style={rtl(s.trainerBadge)}>
                        <MaterialCommunityIcons
                          name="account-outline"
                          size={12}
                          color={theme.muted}
                        />
                        <Text style={[s.trainerText, rtlText()]}>
                          {i18n.t("trainer")} #{plan.ptId || i18n.t("na")}
                        </Text>
                      </View>
                      <View style={rtl(s.statusIndicator)}>
                        <View
                          style={[s.statusDot, { backgroundColor: "#10B981" }]}
                        />
                        <Text style={s.statusText}>{i18n.t("active")}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {rawPlans.length > 0 && (
          <View style={s.loadMoreContainer}>
            <Text style={[s.loadMoreText, rtlText()]}>
              {i18n.t("showing_plans", {
                count: rawPlans.length,
                total: rawPlans.length,
              })}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={[s.modalHeader, isArabic() && s.modalHeaderRTL]}>
              <View
                style={[s.modalHeaderLeft, isArabic() && s.modalHeaderLeftRTL]}
              >
                {selectedPlanDisplay && (
                  <View
                    style={[
                      s.modalIconContainer,
                      { backgroundColor: selectedPlanDisplay.theme.secondary },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={selectedPlanDisplay.icon}
                      size={24}
                      color={selectedPlanDisplay.theme.primary}
                    />
                  </View>
                )}
                <View>
                  <Text style={[s.modalTitle, rtlText()]}>
                    {selectedPlanDisplay?.title || i18n.t("nutrition_plan")}
                  </Text>
                  <Text style={[s.modalSubtitle, rtlText()]}>
                    {i18n.t("full_description")}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={theme.muted}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={s.modalContent} showsVerticalScrollIndicator>
              {selectedPlanDisplay?.fullDescriptionHtml ? (
                <RenderHtml
                  contentWidth={width - 48}
                  source={{ html: selectedPlanDisplay.fullDescriptionHtml }}
                  baseStyle={htmlFullConfig.baseStyle}
                  tagsStyles={htmlFullConfig.tagsStyles}
                  enableExperimentalMarginCollapsing
                />
              ) : (
                <View style={s.noFullDescription}>
                  <MaterialCommunityIcons
                    name="text-box-outline"
                    size={60}
                    color={theme.emptyIcon}
                  />
                  <Text style={[s.noFullDescriptionText, rtlText()]}>
                    {i18n.t("no_detailed_description")}
                  </Text>
                </View>
              )}

              {selectedPlanDisplay && (
                <View style={s.modalNutritionContainer}>
                  <Text style={[s.modalNutritionTitle, rtlText()]}>
                    {i18n.t("nutrition_details")}
                  </Text>
                  <View
                    style={[
                      s.modalNutritionGrid,
                      isArabic() && s.modalNutritionGridRTL,
                    ]}
                  >
                    {selectedPlanDisplay.calories &&
                      selectedPlanDisplay.calories !== "string" && (
                        <View style={s.modalNutritionItem}>
                          <MaterialCommunityIcons
                            name="fire"
                            size={20}
                            color="#F97316"
                          />
                          <Text style={[s.modalNutritionLabel, rtlText()]}>
                            {i18n.t("calories")}
                          </Text>
                          <Text style={[s.modalNutritionValue, rtlText()]}>
                            {selectedPlanDisplay.calories}{" "}
                            {i18n.t("kcal_per_day")}
                          </Text>
                        </View>
                      )}
                    {selectedPlanDisplay.protein &&
                      selectedPlanDisplay.protein !== "string" && (
                        <View style={s.modalNutritionItem}>
                          <MaterialCommunityIcons
                            name="egg"
                            size={20}
                            color="#10B981"
                          />
                          <Text style={[s.modalNutritionLabel, rtlText()]}>
                            {i18n.t("protein")}
                          </Text>
                          <Text style={[s.modalNutritionValue, rtlText()]}>
                            {selectedPlanDisplay.protein}
                            {i18n.t("grams")}
                          </Text>
                        </View>
                      )}
                    {selectedPlanDisplay.carbs &&
                      selectedPlanDisplay.carbs !== "string" && (
                        <View style={s.modalNutritionItem}>
                          <MaterialCommunityIcons
                            name="wheat"
                            size={20}
                            color="#3B82F6"
                          />
                          <Text style={[s.modalNutritionLabel, rtlText()]}>
                            {i18n.t("carbs")}
                          </Text>
                          <Text style={[s.modalNutritionValue, rtlText()]}>
                            {selectedPlanDisplay.carbs}
                            {i18n.t("grams")}
                          </Text>
                        </View>
                      )}
                  </View>
                  <View style={rtl(s.modalTrainerInfo)}>
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={16}
                      color={theme.muted}
                    />
                    <Text style={[s.modalTrainerText, rtlText()]}>
                      {i18n.t("assigned_by_trainer")} #
                      {selectedPlanDisplay.ptId || i18n.t("na")}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={s.modalFooter}>
              <TouchableOpacity
                style={[
                  s.modalActionButton,
                  {
                    backgroundColor:
                      selectedPlanDisplay?.theme.primary || "#8B5CF6",
                  },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={s.modalActionButtonText}>{i18n.t("close")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bg },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.muted,
      fontWeight: "500",
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      backgroundColor: theme.bg,
    },
    errorTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.ink,
      marginTop: 20,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 15,
      color: theme.muted,
      lineHeight: 22,
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    retryButton: {
      backgroundColor: "#8B5CF6",
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      elevation: 3,
    },
    retryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    content: { padding: 16, paddingBottom: 32 },
    statsContainer: {
      flexDirection: "row",
      backgroundColor: theme.surface, // 👈
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      alignItems: "center",
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statItem: { alignItems: "center", flex: 1 },
    statNumber: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.ink,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.muted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    plansGrid: { gap: 16 },
    planCard: {
      borderRadius: 20,
      padding: 20,
      flexDirection: "row",
      alignItems: "flex-start",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.15)",
    },
    iconContainerLTR: { marginRight: 16, marginLeft: 0 },
    iconContainerRTL: { marginLeft: 16, marginRight: 0 },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    planContent: { flex: 1 },
    planHeader: {
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    planTitle: {
      fontSize: 18,
      fontWeight: "700",
      flex: 1,
      marginRight: 8,
      lineHeight: 24,
    },
    descriptionContainer: { marginBottom: 16 },
    viewFullButton: {
      marginTop: 12,
      paddingVertical: 8,
      alignItems: "flex-start",
    },
    viewFullButtonRTL: { alignItems: "flex-end" },
    viewFullText: { fontSize: 14, fontWeight: "600" },
    noDescriptionContainer: { marginBottom: 16, paddingVertical: 12 },
    noDescriptionText: {
      fontSize: 14,
      color: theme.subtle,
      fontStyle: "italic",
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    statsRowRTL: { flexDirection: "row-reverse" },
    statBadge: {
      alignItems: "center",
      backgroundColor: theme.badgeBg,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 6,
    },
    statBadgeText: { fontSize: 12, fontWeight: "600", color: theme.badgeText },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.2)",
    },
    cardFooterRTL: { flexDirection: "row-reverse" },
    trainerBadge: { alignItems: "center", gap: 6 },
    trainerText: { fontSize: 12, color: theme.muted },
    statusIndicator: { alignItems: "center", gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, color: "#10B981", fontWeight: "600" },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyIllustration: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: theme.emptyCircle,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.ink,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 16,
      color: theme.muted,
      lineHeight: 24,
      marginBottom: 32,
    },
    emptyButton: {
      backgroundColor: "#8B5CF6",
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
    },
    emptyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    loadMoreContainer: {
      alignItems: "center",
      marginTop: 24,
      paddingVertical: 16,
    },
    loadMoreText: { fontSize: 14, color: theme.subtle },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "90%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalHeaderRTL: { flexDirection: "row-reverse" },
    modalHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    modalHeaderLeftRTL: { flexDirection: "row-reverse" },
    modalIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: theme.ink },
    modalSubtitle: { fontSize: 14, color: theme.muted, marginTop: 2 },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.closeBtn,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: { padding: 24, maxHeight: "70%" },
    noFullDescription: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
    noFullDescriptionText: { fontSize: 16, color: theme.subtle, marginTop: 12 },
    modalNutritionContainer: {
      marginTop: 32,
      padding: 20,
      backgroundColor: theme.nutritionBg,
      borderRadius: 16,
    },
    modalNutritionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.ink,
      marginBottom: 16,
    },
    modalNutritionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      marginBottom: 20,
    },
    modalNutritionGridRTL: { flexDirection: "row-reverse" },
    modalNutritionItem: {
      flex: 1,
      minWidth: "30%",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.nutritionCard,
      borderRadius: 12,
    },
    modalNutritionLabel: {
      fontSize: 12,
      color: theme.muted,
      marginTop: 8,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    modalNutritionValue: { fontSize: 16, fontWeight: "700", color: theme.ink },
    modalTrainerInfo: {
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.borderAlt,
    },
    modalTrainerText: { fontSize: 14, color: theme.muted },
    modalFooter: {
      padding: 24,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    modalActionButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    modalActionButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  });
