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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppContext } from "../../context";
import { defaultErrorToast, handleGetToken } from "../../helpers";
import { Calendar as RNCalendar } from "react-native-calendars";
import i18n from "../../localization";

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
  const { userProfile, isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const [notes, setNotes] = React.useState<INote[]>([]);
  const [selected, setSelected] = React.useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
  const [noteText, setNoteText] = React.useState("");
  const [noteColor, setNoteColor] = React.useState(NOTE_COLORS[0]);
  const isRTL = i18n.locale === "ar";

  const fetchNotes = async () => {
    try {
      const token = await handleGetToken();
      const res = await fetch(
        "https://gym.useitsmart.com/api/Notes/getallNotes",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/plain",
          },
        },
      );
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

  return (
    <View style={s.screenContainer}>
      {/* 👇 Calendar with dynamic theme */}
      <RNCalendar
        key={isDarkMode ? "dark" : "light"}
        onDayPress={(day) => setSelected(day.dateString)}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={{
          backgroundColor: theme.bg,
          calendarBackground: theme.bg,
          dayTextColor: theme.ink,
          monthTextColor: theme.ink,
          textDisabledColor: theme.muted,
          textSectionTitleColor: theme.muted,
          selectedDayBackgroundColor: "#2A64F6",
          selectedDayTextColor: "#FFFFFF",
          todayTextColor: "#2A64F6",
          dotColor: "#2A64F6",
          selectedDotColor: "#fff",
          arrowColor: "#2A64F6",
        }}
      />
      {/* Add Note Button */}
      <TouchableOpacity
        style={s.addNoteButton}
        onPress={() => setIsNoteModalOpen(true)}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>
          {i18n.t("calendar.add_note")}
        </Text>
      </TouchableOpacity>
      {/* Notes list */}
      <FlatList
        data={notesForSelectedDate}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[s.noteItem, { backgroundColor: item.color }]}>
            <Text style={s.noteText}>{item.note}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={[
              s.emptyText,
              {
                textAlign: isRTL ? "right" : "left",
                writingDirection: isRTL ? "rtl" : "ltr",
              },
            ]}
          >
            {i18n.t("calendar.no_notes")}
          </Text>
        }
      />
      {/* Note Modal */}
      <Modal visible={isNoteModalOpen} animationType="slide" transparent>
        <View style={s.modalContainer}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>
              {i18n.t("calendar.add_note_for", { date: selected })}
            </Text>

            <TextInput
              style={s.noteInput}
              placeholder={i18n.t("calendar.note_placeholder")}
              placeholderTextColor={theme.muted} // 👈
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
        </View>
      </Modal>
      <StatusBar style={isDarkMode ? "light" : "dark"} /> {/* 👈 */}
    </View>
  );
};

export default CalendarScreen;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: theme.bg, // 👈
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
    noteText: {
      color: theme.ink, // 👈
      fontWeight: "500",
    },
    emptyText: {
      margin: 10,
      color: theme.emptyText, // 👈
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalBox: {
      backgroundColor: theme.surface, // 👈
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
      borderColor: theme.border, // 👈
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      marginBottom: 12,
      textAlignVertical: "top",
      backgroundColor: theme.inputBg, // 👈
      color: theme.ink, // 👈
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
      borderColor: theme.ink, // 👈 visible in both modes
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
      backgroundColor: theme.cancelBg, // 👈
    },
    cancelText: {
      color: theme.cancelText, // 👈
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
