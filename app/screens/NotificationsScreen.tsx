import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { ListEmptyComponent } from "../components/ListEmptyComponent";
import i18n from "../localization";
import { handleGetToken } from "../helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from "../context/RootNavigation";
import { useAppContext } from "../context"; // 👈

const { width } = Dimensions.get("window");

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg:         dark ? "#121212" : "#F4F6F9",
  surface:    dark ? "#1E1E1E" : "#FFFFFF",
  surfaceEnd: dark ? "#252525" : "#F8F9FF",
  ink:        dark ? "#F0F0F0" : "#1B1B1B",
  muted:      dark ? "#888888" : "#555555",
  date:       dark ? "#666666" : "#888888",
  iconBg:     dark ? "#2C3A4A" : "#EEF0FF",
  iconColor:  dark ? "#7AADCF" : "#254764",
  border:     dark ? "#2C2C2C" : "transparent",
});

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppContext();                                    // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);  // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);              // 👈 reactive styles

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const token = await handleGetToken();
      if (!token) throw new Error("Authorization token missing");
      const response = await fetch(
        "https://gym.useitsmart.com/api/Notification",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch notifications: ${text}`);
      }
      const data = await response.json();
      const transformed = (data || []).map((item: any) => ({
        id: item.id,
        title: item.title || "Notification",
        message: item.messageBody || "",
        route: item.url || null,
        createdAt: new Date(),
      }));
      setNotifications(transformed);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handlePressNotification = async (item: any) => {
    try {
      const token = await handleGetToken();
      if (!token) throw new Error("Authorization token missing");

      if (item.id) {
        await fetch(
          `https://gym.useitsmart.com/api/Notification/readNotification?notificationId=${item.id}`,
          {
            method: "PUT",
            headers: {
              Accept: "text/plain",
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      if (!item.route) return;

      let parsedUrl;
      try {
        parsedUrl = JSON.parse(item.route);
      } catch {
        return;
      }

      const ID = parsedUrl.Id;
      const pageName = parsedUrl.pageName || "";

      if (pageName === "GymClass") {
        if (navigationRef.isReady()) {
          navigationRef.navigate("Root" as never, {
            screen: "BookClassDrawer",
            params: { screen: "ClassDetails", params: { classId: ID } },
          } as never);
        }
      } else if (pageName === "PTClass") {
        await AsyncStorage.setItem("GPTID", ID.toString());
        navigationRef.navigate("Root" as never, {
          screen: "PTNavigator",
          params: { screen: "PTList" },
        } as never);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const renderNotificationCard = ({ item }: any) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handlePressNotification(item)}
      style={s.cardContainer}
    >
      {/* 👇 gradient adapts to dark mode */}
      <LinearGradient
        colors={[theme.surface, theme.surfaceEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.card}
      >
        <View style={s.iconWrapper}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={26}
            color={theme.iconColor} // 👈
          />
        </View>

        <View style={s.textContainer}>
          <View style={s.headerRow}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.date}>{item.createdAt.toLocaleDateString()}</Text>
          </View>
          <Text numberOfLines={2} style={s.message}>
            {item.message}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContainer}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        renderItem={renderNotificationCard}
        ListEmptyComponent={
          <ListEmptyComponent
            isLoading={isLoading}
            message={i18n.t("no_notifications_found")}
          />
        }
        ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
      />

      <StatusBar style={isDarkMode ? "light" : "dark"} /> {/* 👈 */}
    </View>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,     // 👈
    },
    listContainer: {
      paddingHorizontal: 18,
      paddingVertical: 25,
      paddingBottom: 80,
    },
    cardContainer: {
      borderRadius: 18,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
     
    },
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderRadius: 18,
      padding: 14,
      borderWidth: 0.5,
      borderColor: theme.border,     // 👈 subtle border in dark mode
    },
    iconWrapper: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: theme.iconBg, // 👈
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    textContainer: { flex: 1 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.ink,              // 👈
      flex: 1,
      marginRight: 6,
    },
    date: {
      fontSize: 12,
      color: theme.date,             // 👈
    },
    message: {
      fontSize: 14,
      color: theme.muted,            // 👈
      lineHeight: 20,
    },
  });