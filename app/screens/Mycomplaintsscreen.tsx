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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../localization";
import { useAppContext } from "../context";
import { handleGetToken } from "../helpers";

const BASE_URL = "https://gym.useitsmart.com";

interface ComplaintItem {
  id: number;
  userId: number;
  gymId: number;
  title: string;
  description: string;
  imageUrl: string | null;
  videoUrl: string | null;
  voiceUrl: string | null;
  isVisibleName: boolean;
  status: string;
}

const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#C8F04A",
});

const getStatusStyle = (status: string, theme: ReturnType<typeof getTheme>) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "resolved")
    return { bg: theme.accent + "25", fg: "#4C9A2A" };
  if (normalized === "rejected") return { bg: "#E24C4C25", fg: "#E24C4C" };
  return { bg: theme.muted + "25", fg: theme.muted }; // pending / default
};

const resolveMediaUrl = (path: string | null) => `${BASE_URL}${path}`;

export default function ComplaintHistoryScreen() {
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const isRTL = i18n.locale === "ar";

  const [complaints, setComplaints] = React.useState<ComplaintItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

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

  const statusLabel = (status: string) => {
    const normalized = (status || "").toLowerCase();
    if (normalized === "resolved")
      return i18n.t("complaint_status_resolved") || "Resolved";
    if (normalized === "rejected")
      return i18n.t("complaint_status_rejected") || "Rejected";
    return i18n.t("complaint_status_pending") || "Pending";
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
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
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
              <TouchableOpacity onPress={() => Linking.openURL(imageUri)}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={s.imagePreview} />
                ) : null}
              </TouchableOpacity>
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
                      onPress={() => Linking.openURL(videoUri)}
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
                      onPress={() => Linking.openURL(voiceUri)}
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
            </View>
          );
        }}
      />
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
  });
