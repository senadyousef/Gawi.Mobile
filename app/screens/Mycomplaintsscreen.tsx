import * as React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode, Audio, AVPlaybackStatus } from "expo-av";
import i18n from "../localization";
import { useAppContext } from "../context";
import { handleGetToken } from "../helpers";
import AddComplaintModal from "./AddComplaintModal";

const BASE_URL = "https://gawifit.com";

interface ComplaintItem {
  id: number;
  userId: number;
  gymId: number;
  title: string;
  description: string;
  imageUrl: string | null;
  videoUrl?: string | null;
  voiceUrl: string | null;
  isVisibleName: boolean;
  status: string;
  adminResponse?: string | null;
  resolvedOn?: string | null;
}

const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#C8F04A",
});

// 👇 API returns "Pending" / "Resolve" / "Reject" (not "resolved"/"rejected"),
// so match on prefix instead of an exact string
const getStatusStyle = (status: string, theme: ReturnType<typeof getTheme>) => {
  const normalized = (status || "").toLowerCase();
  if (normalized.startsWith("resolve"))
    return { bg: theme.accent + "25", fg: "#4C9A2A" };
  if (normalized.startsWith("reject"))
    return { bg: "#E24C4C25", fg: "#E24C4C" };
  return { bg: theme.muted + "25", fg: theme.muted }; // pending / default
};

// 👇 return null instead of building a broken "https://gawifit.comnull" url
const resolveMediaUrl = (path: string | null | undefined) =>
  path ? `${BASE_URL}${path}` : null;

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(i18n.locale === "ar" ? "ar" : undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

type MediaModalState = {
  visible: boolean;
  type: "image" | "video" | null;
  uri: string | null;
};

export default function ComplaintHistoryScreen() {
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const isRTL = i18n.locale === "ar";

  const [complaints, setComplaints] = React.useState<ComplaintItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  // 👇 in-app image/video viewer
  const [mediaModal, setMediaModal] = React.useState<MediaModalState>({
    visible: false,
    type: null,
    uri: null,
  });

  // 👇 in-app voice note player
  const [voiceModalVisible, setVoiceModalVisible] = React.useState(false);
  const [currentVoiceUri, setCurrentVoiceUri] = React.useState<string | null>(
    null,
  );
  const [isVoicePlaying, setIsVoicePlaying] = React.useState(false);
  const [voiceLoading, setVoiceLoading] = React.useState(false);
  const soundRef = React.useRef<Audio.Sound | null>(null);

  // 👇 add-complaint modal
  const [addModalVisible, setAddModalVisible] = React.useState(false);

  const fetchComplaints = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = await handleGetToken();
      if (!token) {
        console.log(
          "⚠️ [ComplaintHistoryScreen] no auth token, skipping fetch",
        );
        setComplaints([]);
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/Complaints/GetUserComplaints`,
        {
          method: "GET",
          headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.warn(
          "⚠️ [ComplaintHistoryScreen] fetch failed:",
          response.status,
        );
        setComplaints([]);
        return;
      }

      const data = await response.json();
      console.log("🧾 [ComplaintHistoryScreen] complaints:", data);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "❌ [ComplaintHistoryScreen] fetchComplaints error:",
        error,
      );
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // 👇 make sure audio is released when the screen unmounts
  React.useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const statusLabel = (status: string) => {
    const normalized = (status || "").toLowerCase();
    if (normalized.startsWith("resolve"))
      return i18n.t("complaint_status_resolved") || "Resolved";
    if (normalized.startsWith("reject"))
      return i18n.t("complaint_status_rejected") || "Rejected";
    return i18n.t("complaint_status_pending") || "Pending";
  };

  const openImage = (uri: string) => {
    setMediaModal({ visible: true, type: "image", uri });
  };

  const openVideo = (uri: string) => {
    setMediaModal({ visible: true, type: "video", uri });
  };

  const closeMediaModal = () => {
    setMediaModal({ visible: false, type: null, uri: null });
  };

  const openVoice = async (uri: string) => {
    setCurrentVoiceUri(uri);
    setVoiceModalVisible(true);
    await playVoice(uri);
  };

  const playVoice = async (uri: string) => {
    try {
      setVoiceLoading(true);

      // stop/unload whatever was playing before
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setIsVoicePlaying(true);

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setIsVoicePlaying(false);
        }
      });
    } catch (error) {
      console.error("❌ [ComplaintHistoryScreen] voice playback error:", error);
    } finally {
      setVoiceLoading(false);
    }
  };

  const toggleVoicePlayback = async () => {
    if (!soundRef.current) return;
    const status = await soundRef.current.getStatusAsync();
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await soundRef.current.pauseAsync();
      setIsVoicePlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsVoicePlaying(true);
    }
  };

  const closeVoiceModal = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsVoicePlaying(false);
    setVoiceModalVisible(false);
    setCurrentVoiceUri(null);
  };

  if (loading) {
    return (
      <View style={[s.container, s.centerContent]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchComplaints(true)}
            colors={[theme.ink]}
            tintColor={theme.ink}
          />
        }
        ListEmptyComponent={() => (
          <View style={s.emptyWrap}>
            <View style={s.emptyIconWrap}>
              <Ionicons
                name="alert-circle-outline"
                size={28}
                color={theme.muted}
              />
            </View>
            <Text style={s.emptyText}>
              {i18n.t("no_complaints") || "No complaints yet"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const statusStyle = getStatusStyle(item.status, theme);
          const imageUri = resolveMediaUrl(item.imageUrl);
          const videoUri = resolveMediaUrl(item.videoUrl);
          const voiceUri = resolveMediaUrl(item.voiceUrl);
          const resolvedDate = formatDate(item.resolvedOn);

          return (
            <View style={s.card}>
              <View
                style={[
                  s.cardHeader,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <Text
                  style={[s.title, { textAlign: isRTL ? "right" : "left" }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>

                <View
                  style={[s.statusPill, { backgroundColor: statusStyle.bg }]}
                >
                  <Text style={[s.statusText, { color: statusStyle.fg }]}>
                    {statusLabel(item.status)}
                  </Text>
                </View>
              </View>

              <Text
                style={[s.description, { textAlign: isRTL ? "right" : "left" }]}
              >
                {item.description}
              </Text>

              {imageUri && (
                <TouchableOpacity onPress={() => openImage(imageUri)}>
                  <Image source={{ uri: imageUri }} style={s.imagePreview} />
                </TouchableOpacity>
              )}

              {(videoUri || voiceUri) && (
                <View
                  style={[
                    s.attachmentsRow,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  {videoUri && (
                    <TouchableOpacity
                      style={s.attachmentChip}
                      onPress={() => openVideo(videoUri)}
                    >
                      <Ionicons
                        name="videocam-outline"
                        size={14}
                        color={theme.accent}
                      />
                      <Text style={s.attachmentChipText}>
                        {i18n.t("complaint_video") || "Video"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {voiceUri && (
                    <TouchableOpacity
                      style={s.attachmentChip}
                      onPress={() => openVoice(voiceUri)}
                    >
                      <Ionicons
                        name="mic-outline"
                        size={14}
                        color={theme.accent}
                      />
                      <Text style={s.attachmentChipText}>
                        {i18n.t("complaint_voice") || "Voice Note"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {!!item.adminResponse && (
                <View style={s.adminResponseBox}>
                  <Text
                    style={[
                      s.adminResponseLabel,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {i18n.t("complaint_admin_response") || "Admin response"}
                  </Text>
                  <Text
                    style={[
                      s.adminResponseText,
                      { textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {item.adminResponse}
                  </Text>
                  {resolvedDate && (
                    <Text
                      style={[
                        s.adminResponseDate,
                        { textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {resolvedDate}
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Add complaint FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#1A1A1A" />
      </TouchableOpacity>

      {/* Add complaint modal */}
      <AddComplaintModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={() => fetchComplaints(true)}
      />

      {/* Image / Video viewer */}
      <Modal
        visible={mediaModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeMediaModal}
      >
        <View style={s.mediaModalOverlay}>
          <TouchableOpacity style={s.mediaModalClose} onPress={closeMediaModal}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {mediaModal.type === "image" && mediaModal.uri && (
            <Image
              source={{ uri: mediaModal.uri }}
              style={s.mediaModalImage}
              resizeMode="contain"
            />
          )}

          {mediaModal.type === "video" && mediaModal.uri && (
            <Video
              source={{ uri: mediaModal.uri }}
              style={s.mediaModalVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          )}
        </View>
      </Modal>

      {/* Voice note player */}
      <Modal
        visible={voiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeVoiceModal}
      >
        <View style={s.mediaModalOverlay}>
          <TouchableOpacity style={s.mediaModalClose} onPress={closeVoiceModal}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={s.voicePlayerBox}>
            <Ionicons name="mic" size={40} color={theme.accent} />
            <Text style={s.voicePlayerLabel}>
              {i18n.t("complaint_voice") || "Voice Note"}
            </Text>

            <TouchableOpacity
              style={s.voicePlayButton}
              onPress={toggleVoicePlayback}
              disabled={voiceLoading || !currentVoiceUri}
            >
              {voiceLoading ? (
                <ActivityIndicator color="#1A1A1A" />
              ) : (
                <Ionicons
                  name={isVoicePlaying ? "pause" : "play"}
                  size={28}
                  color="#1A1A1A"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    centerContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    cardHeader: {
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    title: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: theme.ink,
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "700",
    },
    description: {
      fontSize: 13,
      color: theme.muted,
      marginTop: 6,
      lineHeight: 18,
    },
    imagePreview: {
      width: "100%",

      height: 160,
      borderRadius: 10,
      marginTop: 10,
    },
    attachmentsRow: {
      gap: 8,
      marginTop: 10,
    },
    attachmentChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.accent + "20",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    attachmentChipText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.ink,
    },
    emptyWrap: {
      alignItems: "center",
      paddingVertical: 48,
      gap: 10,
    },
    emptyIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      fontSize: 14,
      color: theme.muted,
      fontWeight: "600",
    },
    adminResponseBox: {
      marginTop: 10,
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    adminResponseLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.muted,
      marginBottom: 4,
    },
    adminResponseText: {
      fontSize: 13,
      color: theme.ink,
      lineHeight: 18,
    },
    adminResponseDate: {
      fontSize: 11,
      color: theme.muted,
      marginTop: 6,
    },
    fab: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#E8742A",
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    },
    mediaModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.92)",
      alignItems: "center",
      justifyContent: "center",
    },
    mediaModalClose: {
      position: "absolute",
      top: 50,
      right: 20,
      zIndex: 10,
      padding: 8,
    },
    mediaModalImage: {
      width: "100%",
      height: "80%",
    },
    mediaModalVideo: {
      width: "100%",
      height: 300,
    },
    voicePlayerBox: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      paddingVertical: 32,
      paddingHorizontal: 40,
      alignItems: "center",
      gap: 14,
    },
    voicePlayerLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.ink,
    },
    voicePlayButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.accent,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 6,
    },
  });
