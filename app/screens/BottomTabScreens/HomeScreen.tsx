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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../localization";
import Header from "../../components/HomeScreen/Header";
import CouponsCarousel from "../../components/CouponsCarousel";
import GallerySection from "../../components/HomeScreen/GallerySection";
import ClassesSection from "../../components/HomeScreen/ClassesSection";
import GymStoreSection from "../../components/HomeScreen/GymStoreSection";
import MyStatusSection from "../../components/HomeScreen/MyStatusSection";
import LatestNewsSection from "../../components/HomeScreen/LatestNewsSection";
import {
  HOMESCREEN_HEADER_translateY,
  HOMESCREEN_HEADER_paddingHorizontal,
} from "../../constants";
import Colors from "../../constants/Colors";
import GymTrafficVisual from "../../components/HomeScreen/GymTrafficVisual";
import AudienceSection from "../../components/HomeScreen/AudienceSection";
import { useAppContext } from "../../context";

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
}: {
  notes: any[];
  loadingNotes: boolean;
  isRTL: boolean;
  theme: ReturnType<typeof getTheme>;
}) => {
  const tones = [
    { border: "#C8A000", accent: "#C8A000" },
    { border: "#D4522A", accent: "#D4522A" },
    { border: "#2A64F6", accent: "#2A64F6" },
    { border: "#2E8B2E", accent: "#2E8B2E" },
    { border: "#7B2FD4", accent: "#7B2FD4" },
  ];

  return (
    <View style={{ marginTop: 24, marginBottom: 8 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginLeft: 5,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: theme.ink,
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
            <Text style={{ fontSize: 11, fontWeight: "700", color: theme.ink }}>
              {notes.length}
            </Text>
          </View>
        )}
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
        <View style={{ alignItems: "center", paddingVertical: 28, gap: 6 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 4,
            }}
          >
            <Ionicons name="document-outline" size={28} color={theme.muted} />
          </View>
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
              <View
                style={{
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
                }}
              >
                <View
                  style={{
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                    backgroundColor: tone.accent + "20",
                    marginBottom: 8,
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
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

// ─── Chat FAB ─────────────────────────────────────────────────────────────────
// const ChatFab = ({
//   onPress,
//   theme,
// }: {
//   onPress: () => void;
//   theme: ReturnType<typeof getTheme>;
// }) => (
//   <TouchableOpacity
//     style={{
//       position: "absolute",
//       right: 18,
//       bottom: 96,
//       width: 54,
//       height: 54,
//       borderRadius: 27,
//       backgroundColor: theme.ink,
//       alignItems: "center",
//       justifyContent: "center",
//       shadowColor: "#000",
//       shadowOpacity: 0.25,
//       shadowRadius: 12,
//       shadowOffset: { width: 0, height: 8 },
//       elevation: 8,
//     }}
//     onPress={onPress}
//   >
//     <Ionicons name="chatbubbles-outline" size={24} color={theme.accent} />
//     <View
//       style={{
//         position: "absolute",
//         top: 4,
//         right: 4,
//         width: 10,
//         height: 10,
//         borderRadius: 5,
//         backgroundColor: theme.accent,
//         borderWidth: 2,
//         borderColor: theme.ink,
//       }}
//     />
//   </TouchableOpacity>
// );

// // ─── Chat Modal ───────────────────────────────────────────────────────────────
// const ChatModal = ({
//   visible,
//   onClose,
//   messages,
//   input,
//   setInput,
//   onSend,
//   theme,
// }: {
//   visible: boolean;
//   onClose: () => void;
//   messages: { id: number; text: string; from: string }[];
//   input: string;
//   setInput: (v: string) => void;
//   onSend: () => void;
//   theme: ReturnType<typeof getTheme>;
// }) => (
//   <Modal
//     visible={visible}
//     animationType="slide"
//     transparent
//     onRequestClose={onClose}
//   >
//     <View
//       style={{
//         flex: 1,
//         backgroundColor: "rgba(0,0,0,0.5)",
//         justifyContent: "flex-end",
//       }}
//     >
//       <View
//         style={{
//           height: "70%",
//           backgroundColor: theme.surface,
//           borderTopLeftRadius: 24,
//           borderTopRightRadius: 24,
//           overflow: "hidden",
//         }}
//       >
//         {/* Header */}
//         <View
//           style={{
//             backgroundColor: theme.bg,
//             paddingHorizontal: 16,
//             paddingVertical: 14,
//             flexDirection: "row",
//             justifyContent: "space-between",
//             alignItems: "center",
//             borderBottomWidth: 1,
//             borderBottomColor: theme.border,
//           }}
//         >
//           <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
//             <View
//               style={{
//                 width: 36,
//                 height: 36,
//                 borderRadius: 18,
//                 backgroundColor: theme.accent,
//               }}
//             />
//             <Text
//               style={{
//                 color: theme.ink,
//                 fontSize: 16,
//                 fontWeight: "700",
//                 letterSpacing: -0.2,
//               }}
//             >
//               ChatBot Assistant
//             </Text>
//           </View>
//           <TouchableOpacity
//             onPress={onClose}
//             style={{
//               width: 36,
//               height: 36,
//               borderRadius: 12,
//               backgroundColor: theme.bg,
//               borderWidth: 1,
//               borderColor: theme.border,
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             <Ionicons name="close" size={20} color={theme.ink} />
//           </TouchableOpacity>
//         </View>

//         {/* Messages */}
//         <FlatList
//           data={messages}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={({ item }) => (
//             <View
//               style={{
//                 maxWidth: "75%",
//                 padding: 12,
//                 borderRadius: 16,
//                 marginBottom: 4,
//                 backgroundColor:
//                   item.from === "user" ? theme.ink : theme.hairline,
//                 alignSelf: item.from === "user" ? "flex-end" : "flex-start",
//                 borderBottomRightRadius: item.from === "user" ? 4 : 16,
//                 borderBottomLeftRadius: item.from === "user" ? 16 : 4,
//               }}
//             >
//               <Text
//                 style={{ color: item.from === "user" ? theme.bg : theme.ink }}
//               >
//                 {item.text}
//               </Text>
//             </View>
//           )}
//           contentContainerStyle={{ padding: 16, gap: 10 }}
//         />

//         {/* Input */}
//         <KeyboardAvoidingView
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//         >
//           <View
//             style={{
//               flexDirection: "row",
//               alignItems: "center",
//               gap: 10,
//               borderTopWidth: 1,
//               borderTopColor: theme.border,
//               paddingHorizontal: 14,
//               paddingVertical: 10,
//               marginBottom: 30,
//               backgroundColor: theme.surface,
//             }}
//           >
//             <TextInput
//               value={input}
//               onChangeText={setInput}
//               placeholder="Type a message..."
//               placeholderTextColor={theme.muted}
//               style={{
//                 flex: 1,
//                 backgroundColor: theme.bg,
//                 borderRadius: 20,
//                 borderWidth: 1,
//                 borderColor: theme.border,
//                 paddingHorizontal: 16,
//                 paddingVertical: 10,
//                 fontSize: 14,
//                 color: theme.ink,
//               }}
//             />
//             <TouchableOpacity
//               onPress={onSend}
//               style={{
//                 width: 40,
//                 height: 40,
//                 borderRadius: 20,
//                 backgroundColor: theme.accent,
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <Ionicons name="send" size={18} color={theme.ink} />
//             </TouchableOpacity>
//           </View>
//         </KeyboardAvoidingView>
//       </View>
//     </View>
//   </Modal>
// );

// ─── HomeScreen ───────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const ref = React.useRef(null);
  useScrollToTop(ref);

  const { guestMode, userProfile, isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme

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

  const isGuestMember = !guestMode && userProfile?.role !== "Guest";
  const isRTL = i18n.locale === "ar";

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
        `https://gym.useitsmart.com/api/Notes/getallNotes?userId=${userId}`,
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

  useFocusEffect(
    React.useCallback(() => {
      fetchNotes(true);
    }, []),
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    await fetchNotes(false);
    setRefreshing(false);
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

  return (
    <>
      {/* 👇 Status bar flips based on dark mode */}
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        // 👇 Screen background reacts to dark mode
        style={{ backgroundColor: theme.bg }}
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
          <AudienceSection />
          {!guestMode && isGuestMember && (
            <GymTrafficVisual refreshTrigger={refreshTrigger} />
          )}
          <MyStatusSection />
          <NotesSection
            notes={notes}
            loadingNotes={loadingNotes}
            isRTL={isRTL}
            theme={theme}
          />
          {!guestMode && isGuestMember && (
            <ClassesSection refreshTrigger={refreshTrigger} />
          )}
          <GymStoreSection refreshTrigger={refreshTrigger} />
          <GallerySection refreshTrigger={refreshTrigger} />
         <LatestNewsSection refreshTrigger={refreshTrigger} />
        </View>
      </ScrollView>

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

// ─── Styles ───────────────────────────────────────────────────────────────────
// ─── DELETE the entire bottom const s = StyleSheet.create({...}) ───────────
// ─── REPLACE with this function above HomeScreen or at the bottom ──────────

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.bg,
    },
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
    loadingText: {
      fontSize: 16,
      color: Colors.primary,
      fontWeight: "500",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.ink,
      letterSpacing: -0.3,
    },
    notesContainer: {
      marginTop: 24,
      marginBottom: 8,
    },
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
    notesCountText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.ink,
    },
    notesListContent: {
      paddingHorizontal: 10,
      paddingBottom: 4,
    },
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
    noteContent: {
      fontSize: 13,
      lineHeight: 18,
      color: theme.ink,
    },
    emptyNotes: {
      alignItems: "center",
      paddingVertical: 28,
      gap: 6,
    },
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
    emptyNotesText: {
      fontSize: 14,
      color: theme.muted,
      fontWeight: "600",
    },
    emptyNotesSub: {
      fontSize: 12,
      color: theme.muted,
      opacity: 0.7,
    },
    inlineLoader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 12,
      gap: 8,
    },
    inlineLoaderText: {
      fontSize: 13,
      color: theme.muted,
    },
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
    navItemActive: {
      backgroundColor: theme.accent,
    },
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
    chatHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
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
    messagesContainer: {
      padding: 16,
      gap: 10,
    },
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
