import * as React from "react";
import { format } from "date-fns";
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppContext } from "../../context";
import { defaultErrorToast, handleGetToken } from "../../helpers";
import { Calendar as RNCalendar } from "react-native-calendars";
import i18n from "../../localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { navigationRef } from "../../context/RootNavigation";
import { useState } from "react";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#FFFFFF",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  border: dark ? "#2C2C2C" : "#CCCCCC",
  ink: dark ? "#F0F0F0" : "#000000",
  muted: dark ? "#888888" : "#666666",
  inputBg: dark ? "#2C2C2C" : "#FFFFFF",
  emptyText: dark ? "#888888" : "#666666",
  cancelBg: dark ? "#2C2C2C" : "#EEEEEE",
  cancelText: dark ? "#F0F0F0" : "#000000",
});

const NOTE_COLORS = ["#ff666639", "#ffcc6649", "#66cc6645", "#66ccff38"];

interface INote {
  id: string | number;
  note: string;
  color: string;
  date: string;
  userId?: number;
}

const CalendarScreen = () => {
  const {
    userProfile,
    isDarkMode,
    guestMode,
    setGuestMode,

    setIsAuthenticated,
  } = useAppContext(); // 👈 pull guestMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const [notes, setNotes] = React.useState<INote[]>([]);
  const [selected, setSelected] = React.useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteText, setNoteText] = React.useState("");
  const [noteColor, setNoteColor] = React.useState(NOTE_COLORS[0]);
  const isRTL = i18n.locale === "ar";
  const [gyms, setGyms] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchGyms(), fetchNotes()]);
    setIsRefreshing(false);
  };
  const getWeekDates = () => {
    const today = new Date();

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  };

  const weekDates = getWeekDates();
  const fetchNotes = async () => {
    try {
      const token = await handleGetToken();
      const res = await fetch("https://gym.useitsmart.com/api/Notes/getallNotes", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/plain",
        },
      });
      if (!res.ok) throw new Error(`Failed to fetch notes: ${res.status}`);
      const data = await res.json();
      const allNotes = Array.isArray(data.result) ? data.result : [];
      const userNotes = allNotes.filter(
        (n: any) => n.userId === userProfile?.id,
      );
      const formattedNotes = userNotes.map((n: any) => ({
        ...n,
        date: n.date ? n.date.split("T")[0] : format(new Date(), "yyyy-MM-dd"),
      }));
      setNotes(formattedNotes);
    } catch (error: any) {
      console.error("❌ Error fetching notes:", error);
      Alert.alert(i18n.t("calendar.error"), i18n.t("calendar.load_error"));
    }
  };

  const fetchGyms = async () => {
    try {
      setLoading(true);

      const memberId = await AsyncStorage.getItem("MemberId");

      const response = await fetch(
        `https://gym.useitsmart.com/api/Gyms/GetAllGymsCarouselWithClass?userId=${memberId}&selectedDate=${selected}`,
        {
          method: "GET",
          headers: {
            Accept: "*/*",
          },
        },
      );

      const data = await response.json();

      console.log("Gyms Response:", data);

      setGyms(data.result || data || []);
    } catch (error) {
      console.log("Error fetching gyms:", error);
    } finally {
      setLoading(false);
    }
  };
  React.useEffect(() => {
    if (selected) {
      fetchGyms();
    }
  }, [selected]);
  React.useEffect(() => {
    if (userProfile?.id) fetchNotes();
  }, [userProfile]);

  const handleSaveNote = async () => {
    if (!noteText.trim()) {
      return Alert.alert(
        i18n.t("calendar.error"),
        i18n.t("calendar.note_empty_error"),
      );
    }
    try {
      const token = await handleGetToken();
      const res = await fetch("https://gym.useitsmart.com/api/Notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          accept: "text/plain",
        },
        body: JSON.stringify({
          userId: userProfile?.id,
          note: noteText,
          color: noteColor,
          date: selected,
        }),
      });
      console.log(res.status);
      if (res.ok) {
        Alert.alert(i18n.t("calendar.success"), i18n.t("calendar.note_added"));
        const newNote: INote = {
          id: Date.now(),
          note: noteText,
          color: noteColor,
          date: selected,
          userId: userProfile?.id,
        };

        setNotes((prev) => [...prev, newNote]);
        setNoteText("");
        setNoteColor(NOTE_COLORS[0]);
        setIsNoteModalOpen(false);
      } else {
        defaultErrorToast();
      }
    } catch {
      defaultErrorToast();
    }
  };

  // 👇 guest-mode gate for the add-note action
  const handleAddNotePress = () => {
    if (guestMode) {
      setGuestMode(false);
      setIsAuthenticated(false);
    } else {
      setIsNoteModalOpen(true);
    }
  };

  const notesForSelectedDate = notes.filter((n) => n.date === selected);

  const markedDates: Record<string, any> = {};
  notes.forEach((note) => {
    if (!markedDates[note.date]) markedDates[note.date] = { dots: [] };
    if (!markedDates[note.date].dots.some((d: any) => d.color === note.color)) {
      markedDates[note.date].dots.push({ color: note.color });
    }
  });
  markedDates[selected] = {
    ...markedDates[selected],
    selected: true,
    selectedColor: "#2A64F6",
  };

  const renderItem = ({ item }: any) => {
    const handlePress = () => {
      switch (item.type) {
        case "News":
          navigation.navigate("NewsDetails", {
            item: {
              title: i18n.locale === "ar" ? item.nameAr : item.nameEn,
              photo:
                item.photoUrl && !item.photoUrl.startsWith("http")
                  ? `https://gym.useitsmart.com${item.photoUrl}`
                  : item.photoUrl,
              description:
                i18n.locale === "ar" ? item.contentAr : item.contentEn,
            },
          });
          break;

        case "Class":
          if (navigationRef.isReady()) {
            navigationRef.navigate(
              "Root" as never,
              {
                screen: "BookClassDrawer",
                params: {
                  screen: "ClassDetails",
                  params: { classId: item.classId },
                },
              } as never,
            );
          }
          break;

        case "Offer":
          navigation.navigate("OfferDetails", {
            offer: item,
          });
          break;

        default:
          break;
      }
    };

    switch (item.type) {
      case "News":
        return (
          <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
            <View style={s.newsCard}>
              <Image
                source={{
                  uri: `https://gym.useitsmart.com${item.photoUrl}`,
                }}
                style={s.image}
              />

              <View style={s.cardContent}>
                <Text style={s.newsTitle}>{item.nameEn || item.nameAr}</Text>

                <Text style={s.newsContent}>
                  {item.contentEn || item.contentAr}
                </Text>

                <Text style={s.date}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );

      case "Offer":
        return (
          <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
            <View style={s.offerCard}>
              <Image
                source={{
                  uri: `https://gym.useitsmart.com${item.photoUrl}`,
                }}
                style={s.offerImage}
              />

              <View style={{ flex: 1 }}>
                <Text style={s.offerTitle}>
                  🎉 {item.nameEn || item.nameAr}
                </Text>

                <Text style={s.offerText}>
                  {item.contentEn || item.contentAr}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );

      case "Class":
        return (
          <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
            <View style={s.classCard}>
              <Image source={{ uri: item.photoUrl }} style={s.classImage} />

              <View style={s.classInfo}>
                <Text style={s.classTitle}>{item.nameEn || item.nameAr}</Text>

                <Text style={s.classTime}>
                  🕒 {item.from} - {item.to}
                </Text>

                <Text style={s.classCapacity}>
                  Capacity: {item.bookedCount}/{item.capacity}
                </Text>

                <View
                  style={{
                    marginTop: 12,
                    alignSelf: "flex-start",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: item.isBooked ? "#E8F5E9" : "#FFEBEE",
                  }}
                >
                  <Text
                    style={{
                      color: item.isBooked ? "#2E7D32" : "#C62828",
                      fontWeight: "700",
                    }}
                  >
                    {item.isBooked ? "✓ Booked" : "Available"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );

      case "Note":
        return (
          <View
            style={[s.noteCard, { backgroundColor: item.color || "#66ccff38" }]}
          >
            <Text style={s.noteTitle}>📝 Note</Text>

            <Text style={s.noteText}>
              {item.note || item.contentEn || item.contentAr}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);

    return {
      fullDate: format(date, "yyyy-MM-dd"),
      day: format(date, "EEE"),
      number: format(date, "dd"),
    };
  });
  return (
    <View style={s.screenContainer}>
      <View style={s.weekCalendar}>
        <View style={s.monthHeader}>
          <TouchableOpacity onPress={() => setWeekOffset((prev) => prev - 1)}>
            <Text style={s.arrow}>‹</Text>
          </TouchableOpacity>

          <Text style={s.monthText}>{format(weekDates[0], "MMMM yyyy")}</Text>

          <TouchableOpacity onPress={() => setWeekOffset((prev) => prev + 1)}>
            <Text style={s.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.daysRow}>
          {weekDates.map((date) => {
            const formattedDate = format(date, "yyyy-MM-dd");

            const isSelected =
              formattedDate === format(selectedDate, "yyyy-MM-dd");

            return (
              <TouchableOpacity
                key={formattedDate}
                style={[s.dayContainer, isSelected && s.selectedDayContainer]}
                onPress={() => {
                  console.log("Selected Date:", formattedDate);

                  setSelectedDate(date);
                  setSelected(formattedDate); // triggers API call
                }}
              >
                <Text style={[s.dayNumber, isSelected && s.selectedDayNumber]}>
                  {format(date, "d")}
                </Text>

                <Text style={[s.dayName, isSelected && s.selectedDayName]}>
                  {format(date, "EEE")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {/* Add Note Button */}
      <TouchableOpacity style={s.addNoteButton} onPress={handleAddNotePress}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          {i18n.t("calendar.add_note")}
        </Text>
      </TouchableOpacity>
      {/* Notes list */}
      <FlatList
        data={gyms}
        keyExtractor={(item, index) => `${item.type}-${item.classId}-${index}`}
        renderItem={renderItem}
        extraData={selected}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDarkMode ? "#F0F0F0" : "#1A1A1A"}
            colors={[isDarkMode ? "#F0F0F0" : "#1A1A1A"]}
          />
        }
        ListEmptyComponent={() => (
          <Text style={[s.emptyText, { textAlign: isRTL ? "right" : "left" }]}>
            {i18n.t("calendar.no_events")}
          </Text>
        )}
      />
      {/* Note Modal */}
      <Modal visible={isNoteModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          style={s.modalContainer}
        >
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>
              {i18n.t("calendar.add_note_for", { date: selected })}
            </Text>

            <TextInput
              style={s.noteInput}
              placeholder={i18n.t("calendar.note_placeholder")}
              placeholderTextColor={theme.muted}
              value={noteText}
              onChangeText={setNoteText}
              multiline
            />

            {/* Color selection */}
            <View style={s.colorContainer}>
              {NOTE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    s.colorCircle,
                    { backgroundColor: color },
                    noteColor === color && s.selectedColor,
                  ]}
                  onPress={() => setNoteColor(color)}
                />
              ))}
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={s.cancelButton}
                onPress={() => setIsNoteModalOpen(false)}
              >
                <Text style={s.cancelText}>{i18n.t("calendar.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveButton} onPress={handleSaveNote}>
                <Text style={{ color: "#fff" }}>{i18n.t("calendar.save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </View>
  );
};

export default CalendarScreen;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    weekCalendar: {
      margin: 16,
      padding: 20,
      borderRadius: 24,
      backgroundColor: theme.surface,
      elevation: 4,
    },

    monthHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },

    monthText: {
      fontSize: 28,
      fontWeight: "600",
      color: theme.ink,
    },

    arrow: {
      fontSize: 36,
      color: "#FF7A00",
      fontWeight: "bold",
    },

    daysRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    dayContainer: {
      alignItems: "center",
      flex: 1,
    },

    dayNumber: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.ink,
    },

    dayName: {
      marginTop: 8,
      color: "#9AA4B2",
      fontSize: 15,
    },

    selectedDayNumber: {
      color: "#2A64F6",
    },

    selectedDayName: {
      color: "#2A64F6",
      fontWeight: "600",
    },

    selectedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#2A64F6",
      marginTop: 8,
    },
    noteCard: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 18,
      padding: 18,
      borderLeftWidth: 6,
      borderLeftColor: "#2A64F6",
    },

    noteTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
    },

    noteText: {
      fontSize: 15,
      lineHeight: 22,
      color: "#333",
    },
    newsCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      marginHorizontal: 16,
      marginVertical: 8,
      overflow: "hidden",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },

    image: {
      width: "100%",
      height: 220,
    },

    cardContent: {
      padding: 16,
    },

    newsTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.ink,
    },

    newsContent: {
      fontSize: 14,
      color: "#777",
      marginTop: 8,
      lineHeight: 22,
    },

    date: {
      marginTop: 12,
      color: "#999",
      fontSize: 12,
    },
    offerCard: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      borderRadius: 20,
      backgroundColor: "#FFF5E5",
      borderWidth: 1,
      borderColor: "#FFD699",
    },

    offerImage: {
      width: 80,
      height: 80,
      borderRadius: 15,
      marginRight: 15,
    },

    offerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FF9800",
    },

    offerText: {
      marginTop: 5,
      color: "#666",
      fontSize: 14,
    },
    classCard: {
      backgroundColor: theme.surface,
      borderRadius: 24,
      marginHorizontal: 16,
      marginVertical: 10,
      overflow: "hidden",
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },

    classImage: {
      width: "100%",
      height: 220,
    },

    classInfo: {
      padding: 18,
    },

    classTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.ink,
    },

    classTime: {
      marginTop: 10,
      fontSize: 15,
      color: "#666",
    },

    classCapacity: {
      marginTop: 6,
      fontSize: 14,
      color: "#888",
    },
    screenContainer: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    addNoteButton: {
      margin: 12,
      padding: 12,
      backgroundColor: "#2A64F6",
      borderRadius: 8,
      alignItems: "center",
    },
    noteItem: {
      marginHorizontal: 12,
      marginVertical: 4,
      padding: 12,
      borderRadius: 8,
    },

    emptyText: {
      margin: 10,
      color: theme.emptyText,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalBox: {
      backgroundColor: theme.surface,
      padding: 20,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 12,
      color: "#2A64F6",
    },
    noteInput: {
      minHeight: 80,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
      textAlignVertical: "top",
      backgroundColor: theme.inputBg,
      color: theme.ink,
    },
    colorContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    colorCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: "transparent",
    },
    selectedColor: {
      borderColor: theme.ink,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    cancelButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginHorizontal: 5,
      backgroundColor: theme.cancelBg,
    },
    cancelText: {
      color: theme.cancelText,
    },
    saveButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginHorizontal: 5,
      backgroundColor: "#2A64F6",
    },
  });
