import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import Colors from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "../localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context";

// ---------------- THEME ----------------
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#ffffff",
  surface: dark ? "#1E1E1E" : "#ffffff",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#555555",
  border: dark ? "#2C2C2C" : "#EEEEEE",

  primary: Colors.primary,
  accent: Colors.tertiary,
});

// ---------------- TYPES ----------------
interface NewsItem {
  id: number;
  nameAr: string;
  nameEn: string;
  photoUrl: string;
  contentAr: string;
  contentEn: string;
}

// ---------------- COMPONENT ----------------
export default function AnnouncementsNewsScreen() {
  const navigation = useNavigation();
  const { isArabic } = useI18n();
  const { isDarkMode } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNews();
    } finally {
      setRefreshing(false);
    }
  };
  // ---------------- FETCH ----------------
  const fetchNews = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const MemberId = (await AsyncStorage.getItem("MemberId")) || "0";
      const UserRole = (await AsyncStorage.getItem("UserRole")) || "Guest";
      console.log("Fetching news for:", {
        MemberId,
        UserRole,
      });

      setLoading(true);

      const response = await fetch(
        `https://gym.useitsmart.com/api/News/getallNews?userId=${MemberId}&role=${UserRole}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        },
      );

      console.log("News Status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch news (${response.status})`);
      }

      const json = await response.json();

      console.log("News Response:", json);

      setNewsData(Array.isArray(json) ? json : []);
    } catch (err: any) {
      console.error("Fetch news error:", err);
      Alert.alert("Error", err.message || "Failed to load news");
    } finally {
    if (showLoader) {
      setLoading(false);
    }}
  };
  useEffect(() => {
    fetchNews();
  }, []);

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ---------------- UI ----------------
  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]} // Android
            tintColor={theme.primary} // iOS
          />
        }
      >
        {newsData.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={s.card}
            activeOpacity={0.8}
            onPress={() =>
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
              })
            }
          >
            <Image
              source={{
                uri:
                  item.photoUrl && !item.photoUrl.startsWith("http")
                    ? `https://gym.useitsmart.com${item.photoUrl}`
                    : item.photoUrl,
              }}
              style={s.cardImage}
            />

            <View style={s.cardContent}>
              <View
                style={[
                  s.cardHeader,
                  isArabic() && { flexDirection: "row-reverse" },
                ]}
              >
                <MaterialCommunityIcons
                  name="bullhorn-outline"
                  size={22}
                  color={theme.primary}
                  style={isArabic() ? { marginLeft: 8 } : { marginRight: 8 }}
                />

                <Text
                  style={[
                    s.cardTitle,
                    isArabic() && {
                      textAlign: "right",
                      writingDirection: "rtl",
                    },
                  ]}
                >
                  {i18n.locale === "ar" ? item.nameAr : item.nameEn}
                </Text>
              </View>

              <Text
                style={[
                  s.cardDesc,
                  isArabic() && { textAlign: "right", writingDirection: "rtl" },
                ]}
                numberOfLines={2}
              >
                {i18n.locale === "ar" ? item.contentAr : item.contentEn}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {newsData.length === 0 && (
          <View style={{ padding: 20 }}>
            <Text style={{ textAlign: "center", color: theme.muted }}>
              {i18n.t("no_news_found") || "No announcements available."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------- STYLES ----------------
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    center: {
      justifyContent: "center",
      alignItems: "center",
    },

    content: {
      padding: 16,
    },

    card: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 2,
    },

    cardImage: {
      width: "100%",
      height: 160,
    },

    cardContent: {
      padding: 12,
    },

    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.primary,
      flexShrink: 1,
    },

    cardDesc: {
      fontSize: 14,
      color: theme.muted,
      lineHeight: 20,
    },
  });
