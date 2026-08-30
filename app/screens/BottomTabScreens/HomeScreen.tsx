import * as React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  DeviceEventEmitter,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useScrollToTop,
  useNavigation,
  DrawerActions,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../localization";
import Header from "../../components/HomeScreen/Header";
import CouponsCarousel from "../../components/CouponsCarousel";
import GallerySection from "../../components/HomeScreen/GallerySection";
import ClassesSection from "../../components/HomeScreen/ClassesSection";
import GymStoreSection from "../../components/HomeScreen/GymStoreSection";
import MyStatusSection from "../../components/HomeScreen/MyStatusSection";
import LatestNewsSection from "../../components/HomeScreen/LatestNewsSection";
import WalletSection from "../../components/HomeScreen/WalletSection";
import {
  HOMESCREEN_HEADER_translateY,
  HOMESCREEN_HEADER_paddingHorizontal,
  statusBarHeight,
} from "../../constants";
import Colors from "../../constants/Colors";
import GymTrafficVisual from "../../components/HomeScreen/GymTrafficVisual";
import AudienceSection from "../../components/HomeScreen/AudienceSection";
import { useAppContext } from "../../context";
import { useState } from "react";
import { handleGetToken } from "../../helpers";
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, {
  SweetAlertButton,
  SweetAlertType,
} from "../../components/SweetAlert";

const FLOATING_MENU_SCROLL_THRESHOLD = 120;

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  hairline: dark ? "#252525" : "#EDE8DF",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#C8F04A",
  green: "#4CAF50",
  blue: "#4A90D9",
  orange: "#E8742A",
  purple: "#8B6BC4",
  butter: dark ? "#2A2500" : "#FFF8D6",
  butterInk: dark ? "#FFE082" : "#5C4A00",
  coral: dark ? "#2A1000" : "#FFE8E0",
  coralInk: dark ? "#FFAB91" : "#6B2A1A",
  radius: { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28 },
});

// ─── Notes Section ────────────────────────────────────────────────────────────

const NotesSection = ({
  notes,
  loadingNotes,
  isRTL,
  theme,
  isDarkMode,
  onNoteDeleted,
}: {
  notes: any[];
  loadingNotes: boolean;
  isRTL: boolean;
  theme: ReturnType<typeof getTheme>;
  isDarkMode: boolean;
  onNoteDeleted: (id: number | string) => void;
}) => {
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const navigation = useNavigation<any>();

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

  const tones = [
    { border: "#C8A000", accent: "#C8A000" },
    { border: "#D4522A", accent: "#D4522A" },
    { border: "#2A64F6", accent: "#2A64F6" },
    { border: "#2E8B2E", accent: "#2E8B2E" },
    { border: "#7B2FD4", accent: "#7B2FD4" },
  ];

  const deleteNote = async (id: number | string) => {
    try {
      setDeletingId(id);
      const token = await handleGetToken();
      const response = await fetch(`http://192.168.1.16/api/Notes/${id}`, {
        method: "DELETE",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        onNoteDeleted(id);
        setSelectedNote(null);
        DeviceEventEmitter.emit("homeRefresh");
      } else {
        showAlert(
          "error",
          i18n.t("error") || "Error",
          i18n.t("note_delete_failed") || "Could not delete note.",
        );
      }
    } catch (error) {
      console.error("⚠️ Error deleting note:", error);
      showAlert(
        "error",
        i18n.t("error") || "Error",
        i18n.t("note_delete_failed") || "Could not delete note.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (id: number | string) => {
    showAlert(
      "warning",
      i18n.t("delete_note") || "Delete note?",
      i18n.t("delete_note_confirm") || "This can't be undone.",
      [
        { text: i18n.t("cancel") || "Cancel", style: "cancel" },
        {
          text: i18n.t("delete") || "Delete",
          style: "destructive",
          onPress: () => deleteNote(id),
        },
      ],
    );
  };

  return (
    <View style={{ marginTop: 24, marginBottom: 8 }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginLeft: 5,
          marginRight: 5,
        }}
      >
        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: theme.blue,
              letterSpacing: -0.3,
              textAlign: isRTL ? "right" : "left",
              marginBottom: 15,
            }}
          >
            {i18n.t("notes")}
          </Text>
          {notes.length > 0 && (
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: theme.ink + "20",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 15,
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "700", color: theme.ink }}
              >
                {notes.length}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => navigation.navigate("Calendar")}
          style={({ pressed }) => ({
            width: 32,
            height: 32,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 15,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="add" size={16} color={theme.ink} />
        </Pressable>
      </View>

      {loadingNotes ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <ActivityIndicator size="small" color={theme.ink} />
          <Text
            style={{
              fontSize: 13,
              color: theme.muted,
              fontFamily: "SF-Medium",
            }}
          >
            {i18n.t("refreshing_notes")}
          </Text>
        </View>
      ) : notes.length === 0 ? (
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text
            style={{
              fontSize: 14,
              color: theme.muted,
              fontWeight: "600",
              fontFamily: "SF-Medium",
            }}
          >
            {i18n.t("no_notes")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          inverted={isRTL}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 4 }}
          renderItem={({ item, index }) => {
            const tone = tones[index % tones.length];
            return (
              <Pressable
                onPress={() => setSelectedNote({ ...item, tone })}
                style={({ pressed }) => ({
                  width: 200,
                  height: 120,
                  borderRadius: 16,
                  padding: 14,
                  marginRight: 12,
                  justifyContent: "space-between",
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderTopColor: theme.border,
                  borderRightColor: theme.border,
                  borderBottomColor: theme.border,
                  borderLeftColor: tone.border,
                  borderLeftWidth: 4,
                  shadowColor: "#000",
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 4,
                  overflow: "hidden",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    flexDirection: isRTL ? "row-reverse" : "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: isRTL ? "row-reverse" : "row",
                      alignItems: "center",
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                      backgroundColor: tone.accent + "20",
                    }}
                  >
                    <Ionicons name="pin" size={10} color={tone.accent} />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                        fontFamily: "SF-Medium",
                        color: tone.accent,
                      }}
                    >
                      {item.pin || "Note"}
                    </Text>
                  </View>

                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      confirmDelete(item.id);
                    }}
                    hitSlop={8}
                    style={{ padding: 2 }}
                  >
                    {deletingId === item.id ? (
                      <ActivityIndicator size="small" color={theme.muted} />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={theme.muted}
                      />
                    )}
                  </Pressable>
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 18,
                    fontFamily: "SF-Medium",
                    color: theme.ink,
                  }}
                  numberOfLines={3}
                >
                  {item.note}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      <Modal
        visible={!!selectedNote}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNote(null)}
      >
        <Pressable
          onPress={() => setSelectedNote(null)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 340,
              borderRadius: 18,
              padding: 20,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
              borderLeftColor: selectedNote?.tone?.border,
              borderLeftWidth: 4,
            }}
          >
            <View
              style={{
                flexDirection: isRTL ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: selectedNote?.tone?.accent + "20",
                }}
              >
                <Ionicons
                  name="pin"
                  size={11}
                  color={selectedNote?.tone?.accent}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                    fontFamily: "SF-Medium",
                    color: selectedNote?.tone?.accent,
                  }}
                >
                  {selectedNote?.pin || "Note"}
                </Text>
              </View>

              <Pressable
                onPress={() => selectedNote && confirmDelete(selectedNote.id)}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                {deletingId === selectedNote?.id ? (
                  <ActivityIndicator size="small" color={theme.coralInk} />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.coralInk}
                  />
                )}
              </Pressable>
            </View>

            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                fontFamily: "SF-Medium",
                color: theme.ink,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {selectedNote?.note}
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                fontFamily: "SF-Medium",
                color: theme.ink,
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {selectedNote?.date &&
                new Date(selectedNote.date).toLocaleDateString(
                  isRTL ? "ar-EG" : "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
            </Text>
            <Pressable
              onPress={() => setSelectedNote(null)}
              style={{
                alignSelf: isRTL ? "flex-start" : "flex-end",
                marginTop: 18,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor: theme.ink + "10",
              }}
            >
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: theme.ink }}
              >
                {i18n.t("close") || "Close"}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <SweetAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        isDarkMode={isDarkMode}
        isRTL={isRTL}
        onRequestClose={hideAlert}
      />
    </View>
  );
};
// ─── Decorative background circles (light mode only) ──────────────────────────
const BackgroundCircles = ({
  theme,
}: {
  theme: ReturnType<typeof getTheme>;
}) => (
  <View
    pointerEvents="none"
    style={{
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
    }}
  >
    <View
      style={{
        position: "absolute",
        top: -80,
        right: -60,
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: theme.accent,
        opacity: 0.18,
      }}
    />
    <View
      style={{
        position: "absolute",
        top: 180,
        left: -100,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: theme.blue,
        opacity: 0.12,
      }}
    />
    <View
      style={{
        position: "absolute",
        top: 520,
        right: -70,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: theme.orange,
        opacity: 0.14,
      }}
    />
    <View
      style={{
        position: "absolute",
        top: 900,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: theme.orange,
        opacity: 0.1,
      }}
    />
    <View
      style={{
        position: "absolute",
        top: 1300,
        right: -50,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: theme.accent,
        opacity: 0.12,
      }}
    />
  </View>
);
// ─── HomeScreen ───────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const ref = React.useRef(null);
  useScrollToTop(ref);
  const navigation = useNavigation<any>();

  const { guestMode, userProfile, isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);

  const [isGuest, setIsGuest] = React.useState(true);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [messages, setMessages] = React.useState([
    { id: 1, text: "👋 Hello! How can I help you today?", from: "bot" },
  ]);
  const [input, setInput] = React.useState("");
  const [notes, setNotes] = React.useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [showFloatingMenu, setShowFloatingMenu] = React.useState(false);

  const isGuestMember = !guestMode && userProfile?.role !== "Guest";
  const isRTL = i18n.locale === "ar";
  const [currentRole, setCurrentRole] = React.useState<string | null>(null);
  React.useEffect(() => {
    AsyncStorage.getItem("UserRole").then((role) => {
      console.log("currentRole", role);
      setCurrentRole(role);
    });
  }, []);
  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "homeRefresh",
      async () => {
        setRefreshTrigger((prev) => prev + 1);
        await fetchNotes(false);
      },
    );

    return () => subscription.remove();
  }, []);
  React.useEffect(() => {
    const checkGuestMode = async () => {
      try {
        const memberId = await AsyncStorage.getItem("MemberId");
        setIsGuest(!memberId || memberId === "0" || memberId === "null");
      } catch {
        setIsGuest(true);
      }
    };
    checkGuestMode();
  }, []);

  const fetchNotes = async (isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true);
      else setLoadingNotes(true);
      const userId = await AsyncStorage.getItem("MemberId");
      if (!userId) return;
      const response = await fetch(
        `http://192.168.1.16/api/Notes/getallNotes?userId=${userId}`,
        { method: "GET", headers: { accept: "text/plain" } },
      );
      if (response.ok) {
        const data = await response.json();
        setNotes(data.result || []);
      }
    } catch (error) {
      console.error("⚠️ Error fetching notes:", error);
    } finally {
      setInitialLoading(false);
      setLoadingNotes(false);
    }
  };

  const handleNoteDeleted = React.useCallback((id: number | string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotes(true);
      setRefreshTrigger((prev) => prev + 1);
      DeviceEventEmitter.emit("homeRefresh");
    }, []),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    DeviceEventEmitter.emit("homeRefresh");
    await fetchNotes(false);
    setRefreshing(false);
  }, []);

  const handleScroll = React.useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const shouldShow = y > FLOATING_MENU_SCROLL_THRESHOLD;
    setShowFloatingMenu((prev) => (prev === shouldShow ? prev : shouldShow));
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: input, from: "user" },
    ]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "🤖 Thanks for your message! Our assistant will get back to you soon.",
          from: "bot",
        },
      ]);
    }, 800);
    setInput("");
  };
  console.log(
    "🔍 guestMode:",
    guestMode,
    "| userProfile role:",
    userProfile?.role,
    "| isGuestMember:",
    isGuestMember,
  );

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* 👇 wrapping View holds the page background + circles;
          ScrollView itself becomes transparent so circles show through */}
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {!isDarkMode && <BackgroundCircles theme={theme} />}

        <ScrollView
          ref={ref}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: "transparent" }} // 👈 was theme.bg
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.ink]}
              tintColor={theme.ink}
            />
          }
        >
          {(initialLoading || refreshing) && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 999,
                paddingVertical: 6,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <ActivityIndicator size="small" color={theme.ink} />
            </View>
          )}

          <Header />

          <View
            style={{
              paddingHorizontal: HOMESCREEN_HEADER_paddingHorizontal,
              transform: [{ translateY: -HOMESCREEN_HEADER_translateY }],
            }}
          >
            <CouponsCarousel refreshTrigger={refreshTrigger} />
            {!guestMode && isGuestMember && (
              <WalletSection
                refreshTrigger={refreshTrigger}
                theme={theme}
                isRTL={isRTL}
              />
            )}
            {/* <AudienceSection /> */}
            {!guestMode && isGuestMember && (
              <GymTrafficVisual refreshTrigger={refreshTrigger} />
            )}
            <MyStatusSection refreshTrigger={refreshTrigger} />

            <NotesSection
              notes={notes}
              loadingNotes={loadingNotes}
              isRTL={isRTL}
              theme={theme}
              isDarkMode={!!isDarkMode}
              onNoteDeleted={handleNoteDeleted}
            />
            {!guestMode && isGuestMember && (
              <ClassesSection refreshTrigger={refreshTrigger} />
            )}
            <GymStoreSection refreshTrigger={refreshTrigger} />
            <GallerySection refreshTrigger={refreshTrigger} />
            <LatestNewsSection refreshTrigger={refreshTrigger} />
          </View>
        </ScrollView>
      </View>

      {showFloatingMenu && (
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          activeOpacity={0.85}
          style={[
            floatingMenuStyles.button,
            isRTL ? { right: 16 } : { left: 16 },
          ]}
        >
          <Ionicons name="menu-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* <ChatFab onPress={() => setIsChatOpen(true)} theme={theme} /> */}

      {/* <ChatModal
        visible={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        input={input}
        setInput={setInput}
        onSend={handleSend}
        theme={theme}
      /> */}
    </>
  );
};

export default HomeScreen;

// ─── Floating menu button styles ───────────────────────────────────────────────
const floatingMenuStyles = StyleSheet.create({
  button: {
    position: "absolute",
    top: statusBarHeight + 8,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.backgroundBlue,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.bg },
    body: {
      paddingHorizontal: HOMESCREEN_HEADER_paddingHorizontal,
      transform: [{ translateY: -HOMESCREEN_HEADER_translateY }],
    },
    topLoader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 999,
      paddingVertical: 6,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
      gap: 12,
    },
    loadingText: { fontSize: 16, color: Colors.primary, fontWeight: "500" },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.ink,
      letterSpacing: -0.3,
    },
    notesContainer: { marginTop: 24, marginBottom: 8 },
    notesSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
      marginLeft: 5,
    },
    notesCountBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.ink + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    notesCountText: { fontSize: 11, fontWeight: "700", color: theme.ink },
    notesListContent: { paddingHorizontal: 10, paddingBottom: 4 },
    noteCard: {
      width: 200,
      height: 120,
      borderRadius: theme.radius.md,
      padding: 14,
      marginRight: 12,
      justifyContent: "space-between",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderTopColor: theme.border,
      borderRightColor: theme.border,
      borderBottomColor: theme.border,
      shadowColor: "#000",
      shadowOpacity: 0.07,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
      overflow: "hidden",
    },
    notePinBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    notePinText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    noteContent: { fontSize: 13, lineHeight: 18, color: theme.ink },
    emptyNotes: { alignItems: "center", paddingVertical: 28, gap: 6 },
    emptyNotesIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyNotesText: { fontSize: 14, color: theme.muted, fontWeight: "600" },
    emptyNotesSub: { fontSize: 12, color: theme.muted, opacity: 0.7 },
    inlineLoader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 12,
      gap: 8,
    },
    inlineLoaderText: { fontSize: 13, color: theme.muted },
    chatFab: {
      position: "absolute",
      right: 18,
      bottom: 96,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.ink,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    chatFabDot: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.accent,
      borderWidth: 2,
      borderColor: theme.ink,
    },
    bottomNav: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 18,
      backgroundColor: theme.ink,
      borderRadius: 22,
      padding: 6,
      flexDirection: "row",
      gap: 4,
    },
    navItem: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 16,
      alignItems: "center",
      gap: 4,
    },
    navItemActive: { backgroundColor: theme.accent },
    navLabel: {
      fontSize: 10,
      fontWeight: "500",
      letterSpacing: 0.2,
      color: theme.muted,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    chatBox: {
      height: "70%",
      backgroundColor: theme.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },
    chatHeader: {
      backgroundColor: theme.bg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    chatHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    chatAvatarDot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.accent,
    },
    chatTitle: {
      color: theme.ink,
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    chatCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    messagesContainer: { padding: 16, gap: 10 },
    messageBubble: {
      maxWidth: "75%",
      padding: 12,
      borderRadius: 16,
      marginBottom: 4,
    },
    userBubble: {
      backgroundColor: theme.ink,
      alignSelf: "flex-end",
      borderBottomRightRadius: 4,
    },
    botBubble: {
      backgroundColor: theme.hairline,
      alignSelf: "flex-start",
      borderBottomLeftRadius: 4,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 30,
      backgroundColor: theme.surface,
    },
    chatInput: {
      flex: 1,
      backgroundColor: theme.bg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.ink,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
    },
  });
