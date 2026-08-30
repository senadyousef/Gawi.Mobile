import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Image,
  RefreshControl,
  useWindowDimensions,
  StatusBar,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HTML from "react-native-render-html";
import { LinearGradient } from "expo-linear-gradient";
import { handleGetToken } from "../helpers";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context";
import ar from "../localization/ar";
import en from "../localization/en";

interface User {
  id: number;
  memberShipId?: number;
  membershipName?: string;
  photoUrl?: string;
}

interface NutritionPlan {
  id: number;
  ptId: number;
  userId: number;
  planNameAr: string;
  planNameEn: string;
  descriptionEn: string;
  descriptionAr: string;
  caloriesPerDay: string;
  proteinGrams: string;
  carbsGrams: string;
  createdDate?: string;
}

const convertToHTML = (text) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<u>$1</u>")
    .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^#### (.*?)$/gm, "<h4>$1</h4>")
    .replace(/^##### (.*?)$/gm, "<h5>$1</h5>")
    .replace(/^###### (.*?)$/gm, "<h6>$1</h6>")
    .replace(/^• (.*?)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.*?)$/gm, "<li>$2</li>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/^---$/gm, "<hr/>")
    .replace(
      /\[small\](.*?)\[\/small\]/g,
      '<span style="font-size: 12px;">$1</span>',
    )
    .replace(
      /\[large\](.*?)\[\/large\]/g,
      '<span style="font-size: 20px;">$1</span>',
    )
    .replace(
      /\[xlarge\](.*?)\[\/xlarge\]/g,
      '<span style="font-size: 24px;">$1</span>',
    )
    .replace(/\n/g, "<br/>");
};

const convertFromHTML = (html) => {
  if (!html) return "";
  return html
    .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
    .replace(/<em>(.*?)<\/em>/g, "*$1*")
    .replace(/<u>(.*?)<\/u>/g, "__$1__")
    .replace(/<h1>(.*?)<\/h1>/g, "# $1")
    .replace(/<h2>(.*?)<\/h2>/g, "## $1")
    .replace(/<h3>(.*?)<\/h3>/g, "### $1")
    .replace(/<h4>(.*?)<\/h4>/g, "#### $1")
    .replace(/<h5>(.*?)<\/h5>/g, "##### $1")
    .replace(/<h6>(.*?)<\/h6>/g, "###### $1")
    .replace(/<li>(.*?)<\/li>/g, "• $1")
    .replace(/<a href="(.*?)">(.*?)<\/a>/g, "[$2]($1)")
    .replace(/<hr\/?>/g, "---")
    .replace(
      /<span style="font-size: 12px;">(.*?)<\/span>/g,
      "[small]$1[/small]",
    )
    .replace(
      /<span style="font-size: 20px;">(.*?)<\/span>/g,
      "[large]$1[/large]",
    )
    .replace(
      /<span style="font-size: 24px;">(.*?)<\/span>/g,
      "[xlarge]$1[/xlarge]",
    )
    .replace(/<br\/?>/g, "\n")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .trim();
};

const NutritionPlanScreenAdmin = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const { getDirection, isArabic } = useI18n();
  const { isDarkMode } = useAppContext() as any;
  const dark = isDarkMode ?? false;
  const [userSearch, setUserSearch] = useState("");

  const isAr = isArabic();
  const isRTL =
    (getDirection() as any)?.flexDirection === "row-reverse" ||
    (getDirection() as any)?.direction === "rtl";
  const t = isAr ? ar : en;

  // Dark mode color tokens
  const d = {
    bg: dark ? "#000000" : "#F9FAFB",
    surface: dark ? "#111111" : "#FFFFFF",
    surface2: dark ? "#000000" : "#F9FAFB",
    border: dark ? "#222222" : "#E5E7EB",
    border2: dark ? "#222222" : "#D1D5DB",
    text: dark ? "#EEEEEE" : "#1F2937",
    textSub: dark ? "#888888" : "#6B7280",
    textMid: dark ? "#AAAAAA" : "#374151",
    inputBg: dark ? "#000000" : "#FFFFFF",
    toolbarBg: dark ? "#111111" : "#F8F9FA",
    toolbarBtn: dark ? "#222222" : "#FFFFFF",
    toolbarBtnBorder: dark ? "#333333" : "#D1D5DB",
    toolbarText: dark ? "#EEEEEE" : "#374151",
    previewBg: dark ? "#111111" : "#F9FAFB",
    hintBg: dark ? "#111111" : "#F3F4F6",
    tagBg: dark ? "#000000" : "#F3F4F6",
    divider: dark ? "#222222" : "#E5E7EB",
    userModalBg: dark ? "#111111" : "#FFFFFF",
    formatModalBg: dark ? "#000000" : "#FFFFFF",
    avatarBg: dark ? "#001133" : "#EFF6FF",
    resetBtn: dark ? "#111111" : "#F3F4F6",
    resetBtnBorder: dark ? "#222222" : "#E5E7EB",
    resetBtnText: dark ? "#888888" : "#6B7280",
    footerNoteBg: dark ? "#111111" : "#F3F4F6",
    changeUserBg: dark ? "#111111" : "#F3F4F6",
  };
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [ptId, setPtId] = useState("");
  const [planNameAr, setPlanNameAr] = useState("");
  const [planNameEn, setPlanNameEn] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [caloriesPerDay, setCaloriesPerDay] = useState("");
  const [proteinGrams, setProteinGrams] = useState("");
  const [carbsGrams, setCarbsGrams] = useState("");
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [currentDescription, setCurrentDescription] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textInputRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMemberId();
  }, []);

  const fetchMemberId = async () => {
    try {
      setLoading(true);
      const memberId = await AsyncStorage.getItem("MemberId");
      if (memberId) {
        setPtId(parseInt(memberId) as any);
        await fetchUsers();
      }
    } catch {
      Alert.alert(t.errorTitle, t.errorFailedToLoad);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = await handleGetToken();
      const memberId = await AsyncStorage.getItem("MemberId");
      if (!token) {
        Alert.alert(t.errorTitle, t.errorNoToken);
        return;
      }
      const res = await fetch(
        `http://192.168.1.16/api/PT/GetAllUserForPT?userId=${memberId}`,
        {
          method: "GET",
          headers: { accept: "text/plain", Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) setUsers(await res.json());
      else throw new Error(`${res.status}`);
    } catch {
      Alert.alert(t.errorTitle, t.errorFailedToLoad);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowUserListModal(false);
  };
  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const validateForm = () => {
    if (!ptId) {
      Alert.alert(t.errorTitle, t.errorMemberId);
      return false;
    }
    if (!selectedUser) {
      Alert.alert(t.errorTitle, t.errorSelectUser);
      return false;
    }
    if (!planNameEn.trim()) {
      Alert.alert(t.errorTitle, t.errorPlanNameEn);
      return false;
    }
    if (!planNameAr.trim()) {
      Alert.alert(t.errorTitle, t.errorPlanNameAr);
      return false;
    }
    if (!descriptionEn.trim()) {
      Alert.alert(t.errorTitle, t.errorDescriptionEn);
      return false;
    }
    if (!descriptionAr.trim()) {
      Alert.alert(t.errorTitle, t.errorDescriptionAr);
      return false;
    }
    if (!caloriesPerDay.trim()) {
      Alert.alert(t.errorTitle, t.errorCalories);
      return false;
    }
    if (!proteinGrams.trim()) {
      Alert.alert(t.errorTitle, t.errorProtein);
      return false;
    }
    if (!carbsGrams.trim()) {
      Alert.alert(t.errorTitle, t.errorCarbs);
      return false;
    }
    return true;
  };

  const submitNutritionPlan = async () => {
    if (!validateForm()) return;
    if (!selectedUser?.memberShipId) {
      Alert.alert(t.errorTitle, t.errorNoMembershipId);
      return;
    }
    setSubmitting(true);
    try {
      const token = await handleGetToken();
      if (!token) {
        Alert.alert(t.errorTitle, t.errorNoToken);
        return;
      }
      const res = await fetch("http://192.168.1.16/api/NutritionPlan", {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ptId,
          userId: selectedUser.memberShipId,
          planNameAr: planNameAr.trim(),
          planNameEn: planNameEn.trim(),
          descriptionEn: convertToHTML(descriptionEn.trim()),
          descriptionAr: convertToHTML(descriptionAr.trim()),
          caloriesPerDay: caloriesPerDay.trim(),
          proteinGrams: proteinGrams.trim(),
          carbsGrams: carbsGrams.trim(),
        }),
      });
      const txt = await res.text();
      if (res.ok) {
        let result: any = {};
        try {
          result = JSON.parse(txt);
        } catch {
          result = { message: txt };
        }
        Alert.alert(t.successTitle, result.message || t.successMessage, [
          { text: t.ok, onPress: resetForm },
        ]);
      } else throw new Error(`${res.status}: ${txt}`);
    } catch (err: any) {
      Alert.alert(t.errorTitle, err.message || t.errorFailedToCreate);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPlanNameAr("");
    setPlanNameEn("");
    setDescriptionEn("");
    setDescriptionAr("");
    setCaloriesPerDay("");
    setProteinGrams("");
    setCarbsGrams("");
  };

  const openFormatModal = (language) => {
    setCurrentLanguage(language);
    setCurrentDescription(
      convertFromHTML(language === "en" ? descriptionEn : descriptionAr) || "",
    );
    setShowFormatModal(true);
  };

  const saveFormatContent = () => {
    const html = convertToHTML(currentDescription);
    if (currentLanguage === "en") setDescriptionEn(html);
    else setDescriptionAr(html);
    setShowFormatModal(false);
  };

  const applyTextFormatting = (type) => {
    const { start, end } = selection;
    if (start === end) {
      const map: Record<string, string> = {
        bold: "**bold text**",
        italic: "*italic text*",
        underline: "__underlined text__",
        link: "[link text](https://example.com)",
        heading1: "# Heading 1",
        heading2: "## Heading 2",
        heading3: "### Heading 3",
        heading4: "#### Heading 4",
        heading5: "##### Heading 5",
        heading6: "###### Heading 6",
        small: "[small]small text[/small]",
        large: "[large]large text[/large]",
        xlarge: "[xlarge]extra large text[/xlarge]",
        bullet: "• list item",
        numbered: "1. list item",
        divider: "\n---\n",
      };
      setCurrentDescription(
        currentDescription.substring(0, start) +
          (map[type] || "") +
          currentDescription.substring(end),
      );
      return;
    }
    const sel = currentDescription.substring(start, end);
    const wrapMap: Record<string, string> = {
      bold: `**${sel}**`,
      italic: `*${sel}*`,
      underline: `__${sel}__`,
      link: `[${sel}](https://example.com)`,
      heading1: `# ${sel}`,
      heading2: `## ${sel}`,
      heading3: `### ${sel}`,
      heading4: `#### ${sel}`,
      heading5: `##### ${sel}`,
      heading6: `###### ${sel}`,
      small: `[small]${sel}[/small]`,
      large: `[large]${sel}[/large]`,
      xlarge: `[xlarge]${sel}[/xlarge]`,
      bullet: sel
        .split("\n")
        .map((l) => `• ${l}`)
        .join("\n"),
      numbered: sel
        .split("\n")
        .map((l, i) => `${i + 1}. ${l}`)
        .join("\n"),
      divider: `${sel}\n---\n`,
    };
    setCurrentDescription(
      currentDescription.substring(0, start) +
        (wrapMap[type] || sel) +
        currentDescription.substring(end),
    );
  };

  const tagsStyles = {
    h1: { fontSize: 28, fontWeight: "800", marginVertical: 16, color: d.text },
    h2: { fontSize: 24, fontWeight: "700", marginVertical: 12, color: d.text },
    h3: { fontSize: 20, fontWeight: "600", marginVertical: 10, color: d.text },
    p: { fontSize: 16, lineHeight: 24, marginVertical: 8, color: d.text },
    strong: { fontWeight: "bold" },
    em: { fontStyle: "italic" },
    u: { textDecorationLine: "underline" },
    ul: { marginLeft: 20, marginVertical: 12 },
    ol: { marginLeft: 20, marginVertical: 12 },
    li: { fontSize: 16, lineHeight: 24, marginBottom: 6, color: d.text },
    a: { color: "#3b82f6", textDecorationLine: "underline" },
    hr: { height: 1, backgroundColor: d.divider, marginVertical: 20 },
  };

  const renderFormattedPreview = (text) => {
    if (!text)
      return (
        <Text
          style={[
            S.previewPlaceholder,
            { color: dark ? "#475569" : "#9CA3AF" },
          ]}
        >
          Preview will appear here...
        </Text>
      );
    return text.split("\n").map((line, index) => {
      let lineStyle: any = {};
      let lineContent = line;
      if (line.startsWith("# ")) {
        lineStyle = [S.previewH1, { color: d.text }];
        lineContent = line.substring(2);
      } else if (line.startsWith("## ")) {
        lineStyle = [S.previewH2, { color: d.text }];
        lineContent = line.substring(3);
      } else if (line.startsWith("### ")) {
        lineStyle = [S.previewH3, { color: d.text }];
        lineContent = line.substring(4);
      } else if (line.startsWith("#### ")) {
        lineStyle = [S.previewH4, { color: d.text }];
        lineContent = line.substring(5);
      } else if (line.startsWith("##### ")) {
        lineStyle = [S.previewH5, { color: d.text }];
        lineContent = line.substring(6);
      } else if (line.startsWith("###### ")) {
        lineStyle = [S.previewH6, { color: d.text }];
        lineContent = line.substring(7);
      } else if (line === "---")
        return (
          <View
            key={index}
            style={[S.previewDivider, { backgroundColor: d.divider }]}
          />
        );
      else if (line.startsWith("• ") || /^\d+\. /.test(line))
        lineStyle = [S.previewListItem, { color: d.text }];
      return (
        <Text key={index} style={[S.previewText, { color: d.text }, lineStyle]}>
          {lineContent}
        </Text>
      );
    });
  };
  const filteredUsers = users.filter((u) => {
    const name = (u.membershipName || `User ${u.id}`).toLowerCase();
    return name.includes(userSearch.toLowerCase());
  });
  // ── User List Modal ──────────────────────────────────────────────────────
  const renderUserListModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={showUserListModal}
      onRequestClose={() => {
        setShowUserListModal(false);
        setUserSearch("");
      }}
    >
      <View style={S.userModalContainer}>
        <View style={[S.userModalContent, { backgroundColor: d.userModalBg }]}>
          <LinearGradient
            colors={["#6366F1", "#4F46E5"]}
            style={S.userModalHeader}
          >
            <View style={[S.userModalHeaderContent, isRTL && S.rowReverse]}>
              <TouchableOpacity
                onPress={() => {
                  setShowUserListModal(false);
                  setUserSearch("");
                }}
                style={S.iconBtn}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={S.userModalTitle}>{t.selectUserTitle}</Text>
              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <View
            style={[
              S.searchContainer,
              { backgroundColor: d.userModalBg, borderBottomColor: d.divider },
            ]}
          >
            <View
              style={[
                S.searchInputWrapper,
                { backgroundColor: d.avatarBg },
                isRTL && S.rowReverse,
              ]}
            >
              <Icon
                name="search"
                size={18}
                color={d.textSub}
                style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }}
              />
              <TextInput
                style={[
                  S.searchInput,
                  { color: d.text },
                  isRTL && { textAlign: "right" },
                ]}
                placeholder={t.searchUsers ?? "Search..."}
                placeholderTextColor={d.textSub}
                value={userSearch}
                onChangeText={setUserSearch}
                autoCorrect={false}
              />
              {userSearch.length > 0 && (
                <TouchableOpacity onPress={() => setUserSearch("")}>
                  <Icon name="close-circle" size={18} color={d.textSub} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  S.userItem,
                  { borderBottomColor: d.divider },
                  isRTL && S.rowReverse,
                ]}
                onPress={() => {
                  handleSelectUser(item);
                  setUserSearch("");
                }}
              >
                <View
                  style={[
                    S.userAvatar,
                    { backgroundColor: d.avatarBg },
                    isRTL && { marginRight: 0, marginLeft: 12 },
                    { flexDirection: isAr ? "row-reverse" : "row" },
                  ]}
                >
                  {item.photoUrl ? (
                    <Image
                      source={{ uri: item.photoUrl }}
                      style={S.userImage}
                    />
                  ) : (
                    <View style={S.defaultAvatar}>
                      <Icon name="person" size={24} color="#fff" />
                    </View>
                  )}
                </View>
                <View style={[S.userInfo, isRTL && { alignItems: "flex-end" }]}>
                  <Text
                    style={[S.userName, { color: d.text }, isRTL && S.rtlTxt]}
                  >
                    {item.membershipName || `User ${item.id}`}
                  </Text>
                </View>
                <Icon
                  name={isRTL ? "chevron-back" : "chevron-forward"}
                  size={20}
                  color={d.textSub}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={S.emptyContainer}>
                <Icon name="people-outline" size={48} color={d.textSub} />
                <Text style={[S.emptyText, { color: d.textSub }]}>
                  {userSearch.length > 0
                    ? (t.noResults ?? "No results found")
                    : t.noUsersFound}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  // ── Format Modal ─────────────────────────────────────────────────────────
  const renderFormatModal = () => {
    const headings = isAr
      ? ["ع1", "ع2", "ع3", "ع4", "ع5", "ع6"]
      : ["H1", "H2", "H3", "H4", "H5", "H6"];
    const sizes = isAr ? ["ص", "ك", "ضخ"] : ["S", "L", "XL"];
    const formattings = isAr ? ["غ", "م", "ت"] : ["B", "I", "U"];

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={showFormatModal}
        onRequestClose={() => setShowFormatModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[S.formatModalContainer, { backgroundColor: d.formatModalBg }]}
        >
          {/* Header */}
          <LinearGradient
            colors={
              currentLanguage === "en"
                ? ["#3B82F6", "#1D4ED8"]
                : ["#059669", "#047857"]
            }
            style={S.formatModalHeader}
          >
            <View style={[S.formatModalHeaderContent, isRTL && S.rowReverse]}>
              <TouchableOpacity
                onPress={() => setShowFormatModal(false)}
                style={S.iconBtn}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <View
                style={[
                  S.formatModalTitleContainer,
                  isRTL && { alignItems: "flex-end" },
                ]}
              >
                <Text style={S.formatModalTitle}>
                  {currentLanguage === "en"
                    ? t.formatModalTitleEn || "English Description"
                    : t.formatModalTitleAr || "Arabic Description"}
                </Text>
                <Text style={S.formatModalSubtitle}>
                  {t.bodyContent || "Body Content *"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={saveFormatContent}
                style={S.formatModalSaveButton}
              >
                {isRTL ? (
                  <>
                    <Text style={S.formatModalSaveText}>
                      {t.save || "Save"}
                    </Text>
                    <Icon name="save" size={20} color="#fff" />
                  </>
                ) : (
                  <>
                    <Icon name="save" size={20} color="#fff" />
                    <Text style={S.formatModalSaveText}>
                      {t.save || "Save"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
          <ScrollView>
            {/* Toolbar */}
            <View
              style={[
                S.formatToolbar,
                { backgroundColor: d.toolbarBg, borderBottomColor: d.divider },
              ]}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
              >
                {[
                  headings.map((h, i) => (
                    <TouchableOpacity
                      key={`h${i}`}
                      style={[
                        S.toolbarIconButton,
                        {
                          backgroundColor: d.toolbarBtn,
                          borderColor: d.toolbarBtnBorder,
                        },
                      ]}
                      onPress={() => applyTextFormatting(`heading${i + 1}`)}
                    >
                      <Text
                        style={[
                          S.toolbarIconText,
                          {
                            fontWeight: "bold",
                            fontSize: Math.max(9, 16 - i),
                            color: d.toolbarText,
                          },
                        ]}
                      >
                        {h}
                      </Text>
                    </TouchableOpacity>
                  )),
                  sizes.map((s, i) => (
                    <TouchableOpacity
                      key={`s${i}`}
                      style={[
                        S.toolbarIconButton,
                        {
                          backgroundColor: d.toolbarBtn,
                          borderColor: d.toolbarBtnBorder,
                        },
                      ]}
                      onPress={() =>
                        applyTextFormatting(
                          i === 0 ? "small" : i === 1 ? "large" : "xlarge",
                        )
                      }
                    >
                      <Text
                        style={[
                          S.toolbarIconText,
                          { fontSize: 10 + i * 8, color: d.toolbarText },
                        ]}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  )),
                  formattings.map((f, i) => (
                    <TouchableOpacity
                      key={`f${i}`}
                      style={[
                        S.toolbarIconButton,
                        {
                          backgroundColor: d.toolbarBtn,
                          borderColor: d.toolbarBtnBorder,
                        },
                      ]}
                      onPress={() =>
                        applyTextFormatting(
                          i === 0 ? "bold" : i === 1 ? "italic" : "underline",
                        )
                      }
                    >
                      <Text
                        style={[
                          S.toolbarIconText,
                          { color: d.toolbarText },
                          i === 0 && { fontWeight: "bold" },
                          i === 1 && { fontStyle: "italic" },
                          i === 2 && { textDecorationLine: "underline" },
                        ]}
                      >
                        {f}
                      </Text>
                    </TouchableOpacity>
                  )),
                  [
                    { icon: true, name: "link", action: "link" },
                    { icon: false, text: "•", action: "bullet" },
                    { icon: false, text: "1.", action: "numbered" },
                    { icon: true, name: "remove", action: "divider" },
                  ].map((btn: any, i) => (
                    <TouchableOpacity
                      key={`b${i}`}
                      style={[
                        S.toolbarIconButton,
                        {
                          backgroundColor: d.toolbarBtn,
                          borderColor: d.toolbarBtnBorder,
                        },
                      ]}
                      onPress={() => applyTextFormatting(btn.action)}
                    >
                      {btn.icon ? (
                        <Icon name={btn.name} size={18} color={d.toolbarText} />
                      ) : (
                        <Text
                          style={[S.toolbarIconText, { color: d.toolbarText }]}
                        >
                          {btn.text}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )),
                ]}
              </ScrollView>
            </View>

            <View
              style={[
                S.toolbarHint,
                { backgroundColor: d.hintBg, borderBottomColor: d.divider },
              ]}
            >
              <Text style={[S.toolbarHintText, { color: d.textSub }]}>
                {t.toolbarHint ||
                  "Select text and use the toolbar above to format"}
              </Text>
            </View>

            {/* Preview */}
            <View style={S.previewSection}>
              <Text style={[S.previewTitle, { color: d.textMid }]}>
                {t.preview || "Preview:"}
              </Text>
              <ScrollView
                style={[
                  S.previewBox,
                  { backgroundColor: d.previewBg, borderColor: d.border },
                ]}
                nestedScrollEnabled
              >
                <View>{renderFormattedPreview(currentDescription)}</View>
              </ScrollView>
            </View>

            {/* Editor */}
            <View style={[S.formatContentContainer]}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                <TextInput
                  ref={textInputRef}
                  style={[
                    S.formatTextInput,
                    {
                      backgroundColor: d.inputBg,
                      borderColor: d.border,
                      color: d.text,
                    },
                    currentLanguage === "ar" && {
                      textAlign: "right",
                      writingDirection: "rtl",
                    },
                  ]}
                  value={currentDescription}
                  onChangeText={setCurrentDescription}
                  onSelectionChange={(e) =>
                    setSelection(e.nativeEvent.selection)
                  }
                  multiline
                  scrollEnabled={false}
                  textAlignVertical="top"
                  placeholderTextColor={d.textSub}
                  placeholder={
                    currentLanguage === "en"
                      ? "Start typing here…"
                      : "ابدأ بكتابة محتوىك هنا…"
                  }
                />
              </ScrollView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderDescriptionPreview = () => {
    if (!descriptionEn && !descriptionAr) return null;
    return (
      <View style={S.previewSection}>
        <Text style={[S.previewTitle, { color: d.textMid }]}>Preview:</Text>
        <View
          style={[
            S.previewBox,
            {
              maxHeight: 200,
              backgroundColor: d.previewBg,
              borderColor: d.border,
            },
          ]}
        >
          {descriptionEn && (
            <>
              <Text style={[S.previewLangLabel, { color: d.textSub }]}>
                English:
              </Text>
              <HTML
                source={{ html: descriptionEn || "<p></p>" }}
                tagsStyles={tagsStyles as any}
                baseStyle={{ ...S.htmlBase, color: d.text }}
                contentWidth={width - 80}
              />
            </>
          )}
          {descriptionAr && (
            <>
              <Text style={[S.previewLangLabel, { color: d.textSub }]}>
                Arabic:
              </Text>
              <HTML
                source={{ html: descriptionAr || "<p></p>" }}
                tagsStyles={tagsStyles as any}
                baseStyle={{ ...S.htmlBase, color: d.text, textAlign: "right" }}
                contentWidth={width - 80}
              />
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <View style={[S.loadingContainer, { backgroundColor: d.bg }]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={[S.loadingText, { color: d.textSub }]}>{t.loading}</Text>
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={[S.container, { backgroundColor: d.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      {/* Header */}
      <LinearGradient
        colors={["#6366F1", "#4F46E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={S.header}
      >
        <View style={[S.headerContent, isRTL && S.rowReverse]}>
          <View
            style={[
              S.headerTitleContainer,
              isRTL && { alignItems: "flex-end" },
            ]}
          >
            <Text style={S.headerTitle}>{t.title}</Text>
            <Text style={S.headerSubtitle}>
              {t.ptId}: {ptId}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={S.scrollView}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
      >
        {/* User Selection */}
        <View style={S.userSelectionSection}>
          {!selectedUser ? (
            <View
              style={[
                S.selectUserPrompt,
                { backgroundColor: d.surface, borderColor: d.border },
              ]}
            >
              <Icon name="person-add" size={48} color={d.textSub} />
              <Text
                style={[
                  S.selectUserPromptText,
                  { color: d.textSub },
                  isRTL && S.rtlTxt,
                ]}
              >
                {t.selectUserPrompt}
              </Text>
              <TouchableOpacity
                style={S.selectUserPromptButton}
                onPress={() => setShowUserListModal(true)}
              >
                <Text style={S.selectUserPromptButtonText}>
                  {t.selectUserButton}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                S.selectedUserCard,
                { backgroundColor: d.surface, borderColor: d.border },
              ]}
            >
              <View
                style={[
                  S.selectedUserInfo,
                  {
                    flexDirection: isAr ? "row-reverse" : "row",
                    alignItems: "center",
                  },
                ]}
              >
                <View
                  style={[
                    S.selectedUserAvatar,
                    { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 },
                  ]}
                >
                  <Icon name="person" size={32} color="#fff" />
                </View>
                <View
                  style={{
                    flex: 1,
                    alignItems: isAr ? "flex-end" : "flex-start",
                  }}
                >
                  <Text
                    style={[
                      S.selectedUserName,
                      { color: d.text, textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {selectedUser.membershipName || `User ${selectedUser.id}`}
                  </Text>
                  <Text
                    style={[
                      S.selectedUserId,
                      { color: d.textSub, textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {isRTL
                      ? `${selectedUser.memberShipId} :${t.userId}`
                      : `${t.userId}: ${selectedUser.memberShipId}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  S.changeUserButton,
                  { backgroundColor: d.changeUserBg },
                  isRTL && S.rowReverse,
                  { flexDirection: isAr ? "row-reverse" : "row" },
                ]}
                onPress={() => setSelectedUser(null)}
              >
                <Icon name="swap-horizontal" size={16} color={d.textSub} />
                <Text style={[S.changeUserButtonText, { color: d.textMid }]}>
                  {t.changeUser}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {selectedUser && (
          <>
            {/* Plan Names */}
            <View
              style={[
                S.section,
                { backgroundColor: d.surface, borderColor: d.border },
              ]}
            >
              <View
                style={[
                  S.sectionHeader,
                  isRTL && S.rowReverse,
                  { flexDirection: isAr ? "row-reverse" : "row" },
                ]}
              >
                <View style={[S.sectionIcon, { backgroundColor: "#F59E0B" }]}>
                  <Icon name="document-text" size={22} color="#fff" />
                </View>
                <View style={isRTL ? { alignItems: "flex-end" } : {}}>
                  <Text
                    style={[
                      S.sectionTitle,
                      { color: d.text },
                      isRTL && S.rtlTxt,
                      { textAlign: isAr ? "right" : "left", marginRight: 12 },
                    ]}
                  >
                    {t.planNames}
                  </Text>
                  <Text
                    style={[
                      S.sectionSubtitle,
                      { color: d.textSub },
                      isRTL && S.rtlTxt,
                      { marginRight: 12 },
                    ]}
                  >
                    {t.planNamesSub}
                  </Text>
                </View>
              </View>
              {[
                {
                  label: t.englishName,
                  value: planNameEn,
                  set: setPlanNameEn,
                  placeholder: t.englishNamePlaceholder,
                },
                {
                  label: t.arabicName,
                  value: planNameAr,
                  set: setPlanNameAr,
                  placeholder: t.arabicNamePlaceholder,
                },
              ].map(({ label, value, set, placeholder }, i) => (
                <View style={S.inputGroup} key={i}>
                  <Text
                    style={[
                      S.inputLabel,
                      { color: d.textMid },
                      isRTL && S.rtlTxt,
                      { textAlign: isAr ? "right" : "left" },
                    ]}
                  >
                    {label}
                  </Text>
                  <TextInput
                    style={[
                      S.textInput,
                      {
                        backgroundColor: d.inputBg,
                        borderColor: d.border,
                        color: d.text,
                      },
                      isRTL && { textAlign: "right" },
                    ]}
                    value={value}
                    onChangeText={set}
                    placeholder={placeholder}
                    placeholderTextColor={d.textSub}
                    textAlign={isAr ? "right" : "left"}
                  />
                </View>
              ))}
            </View>

            {/* Descriptions */}
            <View
              style={[
                S.section,
                { backgroundColor: d.surface, borderColor: d.border },
              ]}
            >
              <View
                style={[
                  S.sectionHeader,
                  isRTL && S.rowReverse,
                  { flexDirection: isAr ? "row-reverse" : "row" },
                ]}
              >
                <View style={[S.sectionIcon, { backgroundColor: "#EC4899" }]}>
                  <Icon name="newspaper" size={22} color="#fff" />
                </View>
                <View style={isRTL ? { alignItems: "flex-end" } : {}}>
                  <Text
                    style={[
                      S.sectionTitle,
                      { color: d.text },
                      isRTL && S.rtlTxt,
                      { textAlign: isAr ? "right" : "left", marginRight: 12 },
                    ]}
                  >
                    {t.descriptions}
                  </Text>
                  <Text
                    style={[
                      S.sectionSubtitle,
                      { color: d.textSub },
                      isRTL && S.rtlTxt,
                      { textAlign: isAr ? "right" : "left", marginRight: 12 },
                    ]}
                  >
                    {t.descriptionsSub}
                  </Text>
                </View>
              </View>
              <View style={S.descriptionButtons}>
                {[
                  {
                    lang: "en",
                    color: "#3B82F6",
                    label: t.englishDescription,
                    hint: t.clickToFormat,
                    hasContent: !!descriptionEn,
                  },
                  {
                    lang: "ar",
                    color: "#059669",
                    label: t.arabicDescription,
                    hint: t.clickToFormatAr,
                    hasContent: !!descriptionAr,
                  },
                ].map(({ lang, color, label, hint, hasContent }) => (
                  <TouchableOpacity
                    key={lang}
                    style={[S.descriptionButton, { backgroundColor: color }]}
                    onPress={() => openFormatModal(lang)}
                  >
                    <View
                      style={[
                        S.descriptionButtonContent,
                        isRTL && S.rowReverse,
                        { flexDirection: isAr ? "row-reverse" : "row" },
                      ]}
                    >
                      <Icon name="create-outline" size={18} color="#fff" />
                      <Text
                        style={[
                          S.descriptionButtonText,
                          isRTL && S.rtlTxt,
                          {
                            textAlign: isAr ? "right" : "left",
                            marginRight: 12,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                      {hasContent && (
                        <View style={S.descriptionIndicator}>
                          <Icon name="checkmark" size={12} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        S.descriptionButtonHint,
                        isRTL && S.rtlTxt,
                        { textAlign: isAr ? "right" : "left", marginRight: 12 },
                      ]}
                    >
                      {hint}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {renderDescriptionPreview()}
            </View>

            {/* Nutritional Info */}
            <View
              style={[
                S.section,
                { backgroundColor: d.surface, borderColor: d.border },
              ]}
            >
              <View
                style={[
                  S.sectionHeader,
                  isRTL && S.rowReverse,
                  { flexDirection: isAr ? "row-reverse" : "row" },
                ]}
              >
                <View style={[S.sectionIcon, { backgroundColor: "#EF4444" }]}>
                  <Icon name="nutrition" size={22} color="#fff" />
                </View>
                <View style={isRTL ? { alignItems: "flex-end" } : {}}>
                  <Text
                    style={[
                      S.sectionTitle,
                      { color: d.text },
                      isRTL && S.rtlTxt,
                      { textAlign: isAr ? "right" : "left", marginRight: 12 },
                    ]}
                  >
                    {t.nutritionalInfo}
                  </Text>
                  <Text
                    style={[
                      S.sectionSubtitle,
                      { color: d.textSub },
                      isRTL && S.rtlTxt,
                      { textAlign: isAr ? "right" : "left", marginRight: 12 },
                    ]}
                  >
                    {t.nutritionalInfoSub}
                  </Text>
                </View>
              </View>
              <View style={S.nutritionGrid}>
                {[
                  {
                    label: t.caloriesPerDay,
                    placeholder: t.caloriesPlaceholder,
                    unit: t.kcal,
                    val: caloriesPerDay,
                    set: setCaloriesPerDay,
                  },
                  {
                    label: t.protein,
                    placeholder: t.proteinPlaceholder,
                    unit: t.grams,
                    val: proteinGrams,
                    set: setProteinGrams,
                  },
                  {
                    label: t.carbs,
                    placeholder: t.carbsPlaceholder,
                    unit: t.grams,
                    val: carbsGrams,
                    set: setCarbsGrams,
                  },
                ].map(({ label, placeholder, unit, val, set }, i) => (
                  <View key={i} style={S.nutritionInput}>
                    <Text
                      style={[
                        S.inputLabel,
                        { color: d.textMid },
                        isRTL && S.rtlTxt,
                        { textAlign: isAr ? "right" : "left", marginRight: 12 },
                      ]}
                    >
                      {label}
                    </Text>
                    <View
                      style={[
                        S.inputWithUnit,
                        isRTL && S.rowReverse,
                        { flexDirection: isAr ? "row-reverse" : "row" },
                      ]}
                    >
                      <TextInput
                        style={[
                          S.textInput,
                          S.numberInput,
                          {
                            backgroundColor: d.inputBg,
                            borderColor: d.border,
                            color: d.text,
                          },
                          isRTL && { textAlign: "right" },
                        ]}
                        value={val}
                        onChangeText={set}
                        placeholder={placeholder}
                        placeholderTextColor={d.textSub}
                        keyboardType="numeric"
                        textAlign={isRTL ? "right" : "left"}
                      />
                      <Text style={[S.inputUnit, { color: d.textSub }]}>
                        {unit}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View
              style={[
                S.actionButtons,
                { flexDirection: isAr ? "row" : "row-reverse" },
              ]}
            >
              <TouchableOpacity
                style={[
                  S.resetButton,
                  {
                    backgroundColor: d.resetBtn,
                    borderColor: d.resetBtnBorder,
                  },
                  isRTL && S.rowReverse,
                ]}
                onPress={() =>
                  Alert.alert(t.confirmReset, t.resetConfirmation, [
                    { text: t.cancel, style: "cancel" },
                    { text: t.reset, style: "destructive", onPress: resetForm },
                  ])
                }
                disabled={submitting}
              >
                <Icon name="refresh" size={20} color={d.resetBtnText} />
                <Text style={[S.resetButtonText, { color: d.resetBtnText }]}>
                  {t.resetForm}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.submitButton, submitting && { opacity: 0.7 }]}
                onPress={submitNutritionPlan}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="save" size={20} color="#fff" />
                    <Text style={S.submitButtonText}>{t.createPlan}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View
              style={[
                S.footerNote,
                { backgroundColor: d.footerNoteBg },
                isRTL && S.rowReverse,
              ]}
            >
              <Icon name="information-circle" size={16} color={d.textSub} />
              <Text
                style={[
                  S.footerNoteText,
                  { color: d.textSub },
                  isRTL && S.rtlTxt,
                ]}
              >
                {t.footerNote}
              </Text>
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {renderUserListModal()}
      {renderFormatModal()}
    </KeyboardAvoidingView>
  );
};

const S = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  rowReverse: { flexDirection: "row-reverse" },
  rtlTxt: { textAlign: "left", writingDirection: "rtl" },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16 },
  header: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 12 : 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  userSelectionSection: { marginBottom: 16 },
  selectUserPrompt: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
  },
  selectUserPromptText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  selectUserPromptButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  selectUserPromptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  selectedUserCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  selectedUserAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userDetails: { flex: 1 },
  selectedUserName: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  selectedUserId: { fontSize: 14 },
  changeUserButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  changeUserButtonText: { fontSize: 14, fontWeight: "600" },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  sectionSubtitle: { fontSize: 13, marginTop: 2 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  descriptionButtons: { gap: 12, marginBottom: 20 },
  descriptionButton: { borderRadius: 12, padding: 16 },
  descriptionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  descriptionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  descriptionButtonHint: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontStyle: "italic",
  },
  descriptionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  nutritionGrid: { gap: 16 },
  nutritionInput: { flex: 1 },
  inputWithUnit: { flexDirection: "row", alignItems: "center" },
  numberInput: { flex: 1, marginRight: 8 },
  inputUnit: { fontSize: 14, fontWeight: "600", minWidth: 60 },
  actionButtons: { flexDirection: "row", gap: 12, marginTop: 24 },
  resetButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  resetButtonText: { fontSize: 16, fontWeight: "600" },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    gap: 8,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  footerNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  previewSection: { marginTop: 16, marginBottom: 20 },
  previewTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  previewBox: { borderWidth: 1, borderRadius: 8, padding: 16, minHeight: 80 },
  previewLangLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  previewText: { fontSize: 16, lineHeight: 24, marginBottom: 4 },
  previewH1: { fontSize: 28, fontWeight: "800", marginVertical: 8 },
  previewH2: { fontSize: 24, fontWeight: "700", marginVertical: 6 },
  previewH3: { fontSize: 20, fontWeight: "600", marginVertical: 4 },
  previewH4: { fontSize: 18, fontWeight: "600", marginVertical: 4 },
  previewH5: { fontSize: 16, fontWeight: "500", marginVertical: 2 },
  previewH6: { fontSize: 14, fontWeight: "500", marginVertical: 2 },
  previewListItem: { marginLeft: 16 },
  previewDivider: { height: 1, marginVertical: 12 },
  previewPlaceholder: { fontStyle: "italic", fontSize: 16 },
  htmlBase: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif",
  },
  userModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  userModalContent: {
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
  },
  userModalHeader: { padding: 20 },
  userModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userImage: { width: 40, height: 40, borderRadius: 20 },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  emptyContainer: { padding: 40, alignItems: "center" },
  emptyText: { fontSize: 16, marginTop: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  formatModalContainer: { flex: 1 },
  formatModalHeader: {
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 12 : 50,
    paddingBottom: 16,
  },
  formatModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  formatModalTitleContainer: { flex: 1, alignItems: "center" },
  formatModalTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  formatModalSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  formatModalSaveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  formatModalSaveText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  formatToolbar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
  },
  toolbarSection: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    paddingRight: 16,
    borderRightWidth: 1,
  },
  toolbarSectionRTL: {
    flexDirection: "row-reverse",
    marginRight: 0,
    marginLeft: 16,
    paddingRight: 0,
    paddingLeft: 16,
    borderRightWidth: 0,
    borderLeftWidth: 1,
  },
  toolbarIconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    borderWidth: 1,
  },
  toolbarIconText: { fontSize: 14 },
  toolbarHint: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  toolbarHintText: { fontSize: 11, fontStyle: "italic", textAlign: "center" },
  formatContentContainer: { flex: 1, padding: 16 },
  formatTextInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
});

export default NutritionPlanScreenAdmin;
