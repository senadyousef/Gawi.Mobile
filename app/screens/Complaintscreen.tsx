import * as React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../localization";
import { useAppContext } from "../context";
import { handleGetToken } from "../helpers";
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, {
  SweetAlertButton,
  SweetAlertType,
} from "../components/SweetAlert";

const API_URL = "http://192.168.1.16/api/Complaints";

const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#E8742A",
});

const getFileName = (uri: string, fallback: string) =>
  uri.split("/").pop() || fallback;

export default function ComplaintScreen() {
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const isRTL = i18n.locale === "ar";

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isVisibleName, setIsVisibleName] = React.useState(false);

  const [image, setImage] = React.useState<ImagePicker.ImagePickerAsset | null>(
    null,
  );
  const [video, setVideo] = React.useState<ImagePicker.ImagePickerAsset | null>(
    null,
  );

  const [recording, setRecording] = React.useState<Audio.Recording | null>(
    null,
  );
  const [isRecording, setIsRecording] = React.useState(false);
  const [voiceUri, setVoiceUri] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);

  // 👇 SweetAlert state — replaces Alert.alert entirely
  const [alertConfig, setAlertConfig] = React.useState<{
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(
        "warning",
        i18n.t("error") || "Error",
        i18n.t("media_permission_required") ||
          "Media library permission is required.",
      );
      return;
    }
    // Note: Expo SDK 51+ uses mediaTypes: ['images'] instead of MediaTypeOptions.Images
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const pickVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(
        "warning",
        i18n.t("error") || "Error",
        i18n.t("media_permission_required") ||
          "Media library permission is required.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled) setVideo(result.assets[0]);
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showAlert(
          "warning",
          i18n.t("error") || "Error",
          i18n.t("mic_permission_required") ||
            "Microphone permission is required to record a voice note.",
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error("❌ [ComplaintScreen] startRecording error:", error);
      showAlert("error", i18n.t("error") || "Error");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      setVoiceUri(recording.getURI());
    } catch (error) {
      console.error("❌ [ComplaintScreen] stopRecording error:", error);
    } finally {
      setRecording(null);
      setIsRecording(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIsVisibleName(false);
    setImage(null);
    setVideo(null);
    setVoiceUri(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert(
        "warning",
        i18n.t("error") || "Error",
        i18n.t("complaint_missing_title") || "Please enter a title.",
      );
      return;
    }
    if (!description.trim()) {
      showAlert(
        "warning",
        i18n.t("error") || "Error",
        i18n.t("complaint_missing_description") ||
          "Please enter a description.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const token = await handleGetToken();
      if (!token) {
        console.log("⚠️ [ComplaintScreen] no auth token, aborting submit");
        showAlert("error", i18n.t("error") || "Error");
        return;
      }

      const formData = new FormData();
      if (image) {
        formData.append("image", {
          uri: image.uri,
          name: getFileName(image.uri, "complaint-image.jpg"),
          type: image.mimeType || "image/jpeg",
        } as any);
      }
      if (video) {
        formData.append("video", {
          uri: video.uri,
          name: getFileName(video.uri, "complaint-video.mp4"),
          type: video.mimeType || "video/mp4",
        } as any);
      }
      if (voiceUri) {
        formData.append("voice", {
          uri: voiceUri,
          name: getFileName(voiceUri, "complaint-voice.m4a"),
          type: "audio/m4a",
        } as any);
      }
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("isVisibleName", String(isVisibleName));

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type manually — fetch/FormData generates the multipart boundary
        },
        body: formData,
      });

      if (!response.ok) {
        console.warn("⚠️ [ComplaintScreen] submit failed:", response.status);
        throw new Error(`Request failed with status ${response.status}`);
      }

      showAlert(
        "success",
        i18n.t("complaint_title") || "Submit a Complaint",
        i18n.t("complaint_success") || "Your complaint has been submitted.",
      );
      resetForm();
    } catch (error) {
      console.error("❌ [ComplaintScreen] handleSubmit error:", error);
      showAlert(
        "error",
        i18n.t("error") || "Error",
        i18n.t("complaint_generic_error") ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <Text style={[s.label, { textAlign: isRTL ? "right" : "left" }]}>
          {i18n.t("complaint_title_label") || "Title"}
        </Text>
        <TextInput
          style={[s.input, { textAlign: isRTL ? "right" : "left" }]}
          value={title}
          onChangeText={setTitle}
          placeholder={
            i18n.t("complaint_title_placeholder") ||
            "Brief summary of your complaint"
          }
          placeholderTextColor={theme.muted}
        />

        <Text style={[s.label, { textAlign: isRTL ? "right" : "left" }]}>
          {i18n.t("complaint_description_label") || "Description"}
        </Text>
        <TextInput
          style={[s.input, s.textArea, { textAlign: isRTL ? "right" : "left" }]}
          value={description}
          onChangeText={setDescription}
          placeholder={
            i18n.t("complaint_description_placeholder") ||
            "Describe the issue in detail"
          }
          placeholderTextColor={theme.muted}
          multiline
          numberOfLines={5}
        />

        <View
          style={[
            s.attachRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <TouchableOpacity style={s.attachButton} onPress={pickImage}>
            <View style={s.iconWrap}>
              <Ionicons name="image-outline" size={18} color={theme.accent} />
            </View>
            <Text style={s.attachButtonText}>
              {i18n.t("complaint_add_image") || "Add Photo"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.attachButton} onPress={pickVideo}>
            <View style={s.iconWrap}>
              <Ionicons
                name="videocam-outline"
                size={18}
                color={theme.accent}
              />
            </View>
            <Text style={s.attachButtonText}>
              {i18n.t("complaint_add_video") || "Add Video"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.attachButton}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <View style={s.iconWrap}>
              <Ionicons
                name={isRecording ? "stop-circle-outline" : "mic-outline"}
                size={18}
                color={isRecording ? "#E24C4C" : theme.accent}
              />
            </View>
            <Text style={s.attachButtonText}>
              {isRecording
                ? i18n.t("complaint_stop_recording") || "Stop Recording"
                : i18n.t("complaint_record_voice") || "Record Voice Note"}
            </Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View
            style={[s.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          >
            <Image source={{ uri: image.uri }} style={s.imagePreview} />
            <Text style={s.previewFileName} numberOfLines={1}>
              {getFileName(image.uri, "image")}
            </Text>
            <TouchableOpacity onPress={() => setImage(null)}>
              <Text style={s.removeText}>{i18n.t("remove") || "Remove"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {video && (
          <View
            style={[s.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          >
            <View style={s.iconWrap}>
              <Ionicons name="film-outline" size={18} color={theme.accent} />
            </View>
            <Text style={s.previewFileName} numberOfLines={1}>
              {getFileName(video.uri, "video")}
            </Text>
            <TouchableOpacity onPress={() => setVideo(null)}>
              <Text style={s.removeText}>{i18n.t("remove") || "Remove"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {voiceUri && (
          <View
            style={[s.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          >
            <View style={s.iconWrap}>
              <Ionicons name="mic" size={18} color={theme.accent} />
            </View>
            <Text style={s.previewFileName}>
              {i18n.t("complaint_voice_attached") || "Voice note attached"}
            </Text>
            <TouchableOpacity onPress={() => setVoiceUri(null)}>
              <Text style={s.removeText}>{i18n.t("remove") || "Remove"}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            s.row,
            s.switchRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text
            style={[s.switchLabel, { textAlign: isRTL ? "right" : "left" }]}
          >
            {i18n.t("complaint_show_name") || "Show my name to gym staff"}
          </Text>
          <Switch
            value={isVisibleName}
            onValueChange={setIsVisibleName}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        <TouchableOpacity
          style={[s.submitButton, submitting && s.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={s.submitButtonText}>
              {i18n.t("complaint_submit") || "Submit Complaint"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <SweetAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        isDarkMode={!!isDarkMode}
        isRTL={isRTL}
        onRequestClose={hideAlert}
      />
    </>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    label: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.muted,
      marginBottom: 6,
      marginTop: 14,
    },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.ink,
      fontSize: 14,
    },
    textArea: {
      minHeight: 110,
      textAlignVertical: "top",
    },
    attachRow: {
      flexWrap: "wrap",
      marginTop: 18,
      gap: 10,
    },
    attachButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      gap: 8,
    },
    attachButtonText: {
      color: theme.ink,
      fontSize: 12,
      fontWeight: "700",
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: theme.accent + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    row: {
      alignItems: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 12,
      marginTop: 10,
      gap: 10,
    },
    imagePreview: {
      width: 30,
      height: 30,
      borderRadius: 10,
    },
    previewFileName: {
      flex: 1,
      color: theme.ink,
      fontSize: 12,
      fontWeight: "600",
    },
    removeText: {
      color: "#E24C4C",
      fontSize: 12,
      fontWeight: "700",
    },
    switchRow: {
      justifyContent: "space-between",
      marginTop: 18,
    },
    switchLabel: {
      flex: 1,
      color: theme.ink,
      fontSize: 13,
      fontWeight: "600",
    },
    submitButton: {
      backgroundColor: theme.accent,
      borderRadius: 16,
      paddingVertical: 15,
      alignItems: "center",
      marginTop: 24,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: theme.bg,
      fontSize: 15,
      fontWeight: "800",
    },
  });
