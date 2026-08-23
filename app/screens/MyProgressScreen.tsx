import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleGetToken } from "../helpers";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import i18n from "../localization";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context";
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, {
  SweetAlertButton,
  SweetAlertType,
} from "../components/SweetAlert";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#f2f6fc",
  bgEnd: dark ? "#1A1A1A" : "#FFFFFF",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#555555",
  border: dark ? "#2C2C2C" : "#DDDDDD",
  inputBg: dark ? "#2C2C2C" : "#FFFFFF",
  placeholder: dark ? "#666666" : "#999999",
  modalBg: dark ? "#1E1E1E" : "#FFFFFF",
  cardShadow: dark ? "#00000030" : "#00000015",
  iconColor: dark ? "#F0F0F0" : "#333",
  historyCardBg: dark ? "#2C2C2C" : "#f8f9fa",
  headerColor: dark ? "#4e9ef1" : "#4e9ef1",
});

export default function MyProgressScreen() {
  const { isArabic } = useI18n();
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [newProgressName, setNewProgressName] = useState("");
  const [newProgressColor, setNewProgressColor] = useState("#4e9ef1");
  const [editingProgressId, setEditingProgressId] = useState(null);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [newHistoryValue, setNewHistoryValue] = useState("");
  const [newHistoryImage, setNewHistoryImage] = useState(null);
  const [newHistoryFile, setNewHistoryFile] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [addingHistory, setAddingHistory] = useState(false);

  const { height } = Dimensions.get("window");

  // 👇 SweetAlert state — replaces Alert.alert entirely
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: undefined,
    buttons: undefined,
  });

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

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const MemberId = await AsyncStorage.getItem("MemberId");
      const token = await handleGetToken();

      const res = await fetch(
        `https://gawifit.com/api/MyProgress/getallMyProgress?userId=${MemberId || 3}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const json = await res.json();

      const baseProgress = (json.result || []).map((item) => ({
        id: item.id,
        title: item.name,
        color: item.color || "#4e9ef1",
        icon: "dumbbell",
        isDeletable: item.isDeletable ?? true,
        value: "-",
      }));

      const withLatestHistory = await Promise.all(
        baseProgress.map(async (p) => {
          try {
            const res = await fetch(
              `https://gawifit.com/api/MyProgressHistory/getallMyProgressHistory?myProgressId=${p.id}`,
              {
                headers: {
                  Accept: "text/plain",
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            const json = await res.json();
            const latest = (json.result?.data || json.result || []).sort(
              (a, b) => new Date(b.date) - new Date(a.date),
            )[0];
            return { ...p, value: latest?.value || "-" };
          } catch {
            return p;
          }
        }),
      );

      setProgressData(withLatestHistory);
    } catch (e) {
      console.error(e);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchProgressData(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!newProgressName) {
      showAlert("warning", i18n.t("error"), i18n.t("enter_progress_name"));
      return;
    }
    try {
      const MemberId = await AsyncStorage.getItem("MemberId");
      const token = await handleGetToken();
      const url = editingProgressId
        ? `https://gawifit.com/api/MyProgress/${editingProgressId}`
        : "https://gawifit.com/api/MyProgress";
      const method = editingProgressId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isDeletable: true,
          color: newProgressColor,
          name: newProgressName,
          userId: MemberId || 3,
        }),
      });
      if (res.ok) {
        setModalVisible(false);
        setNewProgressName("");
        setNewProgressColor("#4e9ef1");
        setEditingProgressId(null);
        fetchProgressData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditPress = (progress) => {
    setEditingProgressId(progress.id);
    setNewProgressName(progress.title);
    setNewProgressColor(progress.color);
    setModalVisible(true);
  };

  const handleDeletePress = (id) =>
    showAlert("warning", i18n.t("delete_progress_alert"), undefined, [
      { text: i18n.t("cancel"), style: "cancel" },
      {
        text: i18n.t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            const token = await handleGetToken();
            await fetch(`https://gawifit.com/api/MyProgress/${id}`, {
              method: "DELETE",
              headers: { Accept: "*/*", Authorization: `Bearer ${token}` },
            });
            fetchProgressData();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);

  const handleCardPress = async (progress) => {
    setSelectedProgress(progress);
    setHistoryModalVisible(true);
    setLoadingHistory(true);
    try {
      const token = await handleGetToken();
      const res = await fetch(
        `https://gawifit.com/api/MyProgressHistory/getallMyProgressHistory?myProgressId=${progress.id}`,
        { headers: { Accept: "text/plain", Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      const historyList = (json.result?.data || json.result || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );
      setHistoryData(historyList);
      setProgressData((prev) =>
        prev.map((p) =>
          p.id === progress.id
            ? { ...p, value: historyList[0]?.value || "-" }
            : p,
        ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setNewHistoryImage(result.assets[0].uri);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (result.type === "success") setNewHistoryFile(result.uri);
  };

  const addOrEditProgressHistory = async () => {
    if (!newHistoryValue) {
      showAlert("warning", i18n.t("error"), i18n.t("enter_history_value"));
      return;
    }
    setAddingHistory(true);
    try {
      const token = await handleGetToken();
      const url = editingHistoryId
        ? `https://gawifit.com/api/MyProgressHistory/${editingHistoryId}`
        : "https://gawifit.com/api/MyProgressHistory";
      const method = editingHistoryId ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          myProgressId: selectedProgress.id,
          value: newHistoryValue,
          url: newHistoryImage || "",
          fileUrl: newHistoryFile || "",
          date: new Date().toISOString(),
        }),
      });

      setNewHistoryValue("");
      setNewHistoryImage(null);
      setNewHistoryFile(null);
      setEditingHistoryId(null);
      handleCardPress(selectedProgress);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingHistory(false);
    }
  };

  const handleEditHistoryPress = (item) => {
    setEditingHistoryId(item.id);
    setNewHistoryValue(item.value);
    setNewHistoryImage(item.url || null);
    setNewHistoryFile(item.fileUrl || null);
  };

  const handleDeleteHistory = (id) =>
    showAlert("warning", i18n.t("delete_history_alert"), undefined, [
      { text: i18n.t("cancel"), style: "cancel" },
      {
        text: i18n.t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            const token = await handleGetToken();
            await fetch(`https://gawifit.com/api/MyProgressHistory/${id}`, {
              method: "DELETE",
              headers: { Accept: "*/*", Authorization: `Bearer ${token}` },
            });
            handleCardPress(selectedProgress);
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);

  if (loading)
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );

  return (
    <LinearGradient colors={[theme.bg, theme.bgEnd]} style={s.container}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <Text style={[s.headerTitle, isArabic() && s.textRTL]}>
          {i18n.t("my_progress")}
        </Text>

        {/* Add Progress Button */}
        <TouchableOpacity
          style={s.addButton}
          onPress={() => {
            setEditingProgressId(null);
            setNewProgressName("");
            setNewProgressColor("#4e9ef1");
            setModalVisible(true);
          }}
        >
          <LinearGradient
            colors={["#ff7002", "#ff7002"]}
            style={s.addButtonGradient}
          >
            <Text style={s.addButtonText}>{i18n.t("add_progress")}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Progress Cards */}
        <View style={s.cardContainer}>
          {progressData.length === 0 ? (
            <View style={s.emptyContainer}>
              <MaterialCommunityIcons
                name="chart-line"
                size={70}
                color={theme.muted}
              />

              <Text
                style={[
                  s.emptyText,
                  isArabic() && {
                    textAlign: "right",
                    writingDirection: "rtl",
                  },
                ]}
              >
                {i18n.locale === "ar"
                  ? "لا يوجد تقدم حتى الآن"
                  : "There is no progress yet"}
              </Text>
            </View>
          ) : (
            progressData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  s.card,
                  isArabic() ? s.cardRTL : s.cardLTR,
                  isArabic()
                    ? { borderRightColor: item.color }
                    : { borderLeftColor: item.color },
                ]}
                onPress={() => handleCardPress(item)}
              >
                {/* Icon */}
                <MaterialCommunityIcons
                  name={item.icon}
                  size={28}
                  color={item.color}
                />

                {/* Title + Value */}
                <View style={[s.cardText, isArabic() && s.cardTextRTL]}>
                  <Text style={[s.cardTitle, isArabic() && s.textRTL]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      s.cardValue,
                      { color: item.color },
                      isArabic() && s.textRTL,
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>

                {/* Edit / Delete */}
                {item.isDeletable && (
                  <View style={[s.cardButtons, isArabic() && s.cardButtonsRTL]}>
                    <TouchableOpacity
                      style={[s.cardAction, { backgroundColor: "#1dd1a1" }]}
                      onPress={() => handleEditPress(item)}
                    >
                      <Text style={s.cardActionText}>{i18n.t("edit")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.cardAction, { backgroundColor: "#ff4757" }]}
                      onPress={() => handleDeletePress(item.id)}
                    >
                      <Text style={s.cardActionText}>{i18n.t("delete")}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* ─── Add / Edit Progress Modal ────────────────────────────────── */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={s.modalContainer}
          >
            <View
              style={[
                s.modalContent,
                { maxHeight: height * 0.6, backgroundColor: theme.modalBg },
              ]}
            >
              <View style={[s.modalHeader, isArabic() && s.rowRTL]}>
                <Text
                  style={[
                    s.modalTitle,
                    isArabic() && s.textRTL,
                    { color: theme.ink },
                  ]}
                >
                  {editingProgressId
                    ? i18n.t("edit_progress")
                    : i18n.t("add_progress_modal")}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setEditingProgressId(null);
                    setNewProgressName("");
                    setNewProgressColor("#4e9ef1");
                  }}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={26}
                    color={theme.ink}
                  />
                </TouchableOpacity>
              </View>

              <View style={s.addHistory}>
                <TextInput
                  placeholder={i18n.t("progress_name")}
                  placeholderTextColor={theme.placeholder}
                  value={newProgressName}
                  onChangeText={setNewProgressName}
                  style={[
                    s.input,
                    isArabic() && s.textRTL,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.ink,
                      borderColor: theme.border,
                    },
                  ]}
                  textAlign={isArabic() ? "right" : "left"}
                />

                <Text
                  style={[
                    { marginBottom: 6, fontWeight: "600", color: theme.ink },
                    isArabic() && s.textRTL,
                  ]}
                >
                  {i18n.t("pick_color")}
                </Text>
                <View
                  style={[
                    { flexDirection: "row", marginBottom: 12 },
                    isArabic() && s.rowRTL,
                  ]}
                >
                  {["#4e9ef1", "#ff6b6b", "#1dd1a1", "#feca57", "#5f27cd"].map(
                    (color) => (
                      <TouchableOpacity
                        key={color}
                        style={{
                          backgroundColor: color,
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          marginRight: isArabic() ? 0 : 10,
                          marginLeft: isArabic() ? 10 : 0,
                          borderWidth: newProgressColor === color ? 2 : 0,
                          borderColor: "#333",
                        }}
                        onPress={() => setNewProgressColor(color)}
                      />
                    ),
                  )}
                </View>

                <TouchableOpacity
                  style={[s.saveButton, { backgroundColor: "#28a745" }]}
                  onPress={handleSaveProgress}
                >
                  <Text style={s.saveButtonText}>
                    {editingProgressId ? i18n.t("update") : i18n.t("add")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ─── History Modal ────────────────────────────────────────────── */}
        <Modal visible={historyModalVisible} transparent animationType="slide">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={s.modalContainer}
          >
            <View
              style={[
                s.modalContent,
                { maxHeight: height * 0.85, backgroundColor: theme.modalBg },
              ]}
            >
              <View style={[s.modalHeader, isArabic() && s.rowRTL]}>
                <Text
                  style={[
                    s.modalTitle,
                    isArabic() && s.textRTL,
                    { color: theme.ink },
                  ]}
                >
                  {selectedProgress?.title} {i18n.t("history")}
                </Text>
                <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={26}
                    color={theme.ink}
                  />
                </TouchableOpacity>
              </View>

              <View style={s.addHistory}>
                <TextInput
                  placeholder={i18n.t("value")}
                  placeholderTextColor={theme.placeholder}
                  value={newHistoryValue}
                  onChangeText={setNewHistoryValue}
                  style={[
                    s.input,
                    isArabic() && s.textRTL,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.ink,
                      borderColor: theme.border,
                    },
                  ]}
                  textAlign={isArabic() ? "right" : "left"}
                />

                <TouchableOpacity style={s.imageButton} onPress={pickImage}>
                  <Text style={s.imageButtonText}>
                    {newHistoryImage
                      ? i18n.t("change_image")
                      : i18n.t("pick_image")}
                  </Text>
                </TouchableOpacity>
                {newHistoryImage && (
                  <Image
                    source={{ uri: newHistoryImage }}
                    style={s.previewImage}
                  />
                )}

                <TouchableOpacity style={s.imageButton} onPress={pickFile}>
                  <Text style={s.imageButtonText}>
                    {newHistoryFile
                      ? i18n.t("change_file")
                      : i18n.t("pick_file")}
                  </Text>
                </TouchableOpacity>
                {newHistoryFile && (
                  <Text
                    style={[
                      { marginBottom: 10, fontSize: 14, color: theme.muted },
                      isArabic() && s.textRTL,
                    ]}
                  >
                    {i18n.t("selected")}: {newHistoryFile.split("/").pop()}
                  </Text>
                )}

                <TouchableOpacity
                  style={s.saveButton}
                  onPress={addOrEditProgressHistory}
                  disabled={addingHistory}
                >
                  <Text style={s.saveButtonText}>
                    {addingHistory
                      ? i18n.t("saving")
                      : editingHistoryId
                        ? i18n.t("update")
                        : i18n.t("add")}
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingHistory ? (
                <ActivityIndicator
                  size="large"
                  color={Colors.primary}
                  style={{ marginTop: 20 }}
                />
              ) : historyData.length === 0 ? (
                <Text
                  style={[
                    {
                      textAlign: "center",
                      marginVertical: 20,
                      color: theme.muted,
                    },
                    isArabic() && s.textRTL,
                  ]}
                >
                  {i18n.t("no_history")}
                </Text>
              ) : (
                <FlatList
                  data={historyData}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View
                      style={[
                        s.historyCard,
                        { backgroundColor: theme.historyCardBg },
                      ]}
                    >
                      {item.url && (
                        <Image
                          source={{ uri: item.url }}
                          style={s.historyImage}
                        />
                      )}
                      {item.fileUrl && (
                        <Text
                          style={[
                            {
                              fontSize: 14,
                              marginBottom: 4,
                              color: theme.muted,
                            },
                            isArabic() && s.textRTL,
                          ]}
                        >
                          {i18n.t("file")}: {item.fileUrl.split("/").pop()}
                        </Text>
                      )}
                      <Text
                        style={[
                          s.historyValue,
                          isArabic() && s.textRTL,
                          { color: theme.ink },
                        ]}
                      >
                        {item.value}
                      </Text>
                      <View style={[s.historyButtons, isArabic() && s.rowRTL]}>
                        <TouchableOpacity
                          style={[
                            s.historyEdit,
                            isArabic()
                              ? { marginLeft: 8, marginRight: 0 }
                              : { marginRight: 8 },
                          ]}
                          onPress={() => handleEditHistoryPress(item)}
                        >
                          <Text style={s.historyButtonText}>
                            {i18n.t("edit")}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.historyDelete}
                          onPress={() => handleDeleteHistory(item.id)}
                        >
                          <Text style={s.historyButtonText}>
                            {i18n.t("delete")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>

      <SweetAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        isDarkMode={!!isDarkMode}
        isRTL={isArabic()}
        onRequestClose={hideAlert}
      />
    </LinearGradient>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme) =>
  StyleSheet.create({
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },

    emptyText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: "500",
      color: theme.muted,
      textAlign: "center",
    },
    container: { flex: 1 },
    scrollContent: { padding: 20, alignItems: "center" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    textRTL: {
      textAlign: "right",
      writingDirection: "rtl",
    },
    rowRTL: {
      flexDirection: "row-reverse",
    },

    headerTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.headerColor,
      marginBottom: 20,
      alignSelf: "stretch",
      textAlign: "left",
    },
    addButton: { width: "100%", marginBottom: 20 },
    addButtonGradient: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    addButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cardContainer: { width: "100%" },

    card: {
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 4,
    },
    cardLTR: {
      flexDirection: "row",
      borderLeftWidth: 6,
    },
    cardRTL: {
      flexDirection: "row-reverse",
      borderRightWidth: 6,
    },

    cardText: { flex: 1, marginLeft: 15 },
    cardTextRTL: { marginLeft: 0, marginRight: 15 },

    cardTitle: { fontSize: 16, fontWeight: "600", color: theme.ink },
    cardValue: { fontSize: 16, fontWeight: "700" },

    cardButtons: { flexDirection: "row", gap: 8 },
    cardButtonsRTL: { flexDirection: "row-reverse" },

    cardAction: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    cardActionText: { color: "#fff", fontWeight: "600" },

    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    modalContent: {
      borderRadius: 16,
      width: "90%",
      padding: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: "700" },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
    },
    saveButton: {
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    saveButtonText: { color: "#fff", fontWeight: "700" },
    imageButton: {
      backgroundColor: Colors.primary,
      padding: 10,
      borderRadius: 8,
      marginBottom: 6,
      alignItems: "center",
    },
    imageButtonText: { color: "#fff", fontWeight: "600" },
    previewImage: { width: 100, height: 100, marginBottom: 6, borderRadius: 8 },
    addHistory: { marginVertical: 12 },
    historyCard: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    historyImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 6 },
    historyValue: { fontSize: 16, fontWeight: "600" },
    historyDate: { fontSize: 12 },
    historyButtons: { flexDirection: "row", marginTop: 6 },
    historyEdit: { backgroundColor: "#1dd1a1", padding: 6, borderRadius: 6 },
    historyDelete: { backgroundColor: "#ee5253", padding: 6, borderRadius: 6 },
    historyButtonText: { color: "#fff", fontWeight: "600" },
  });
