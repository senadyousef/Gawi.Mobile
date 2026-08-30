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

// ─── Notification type groups ────────────────────────────────────────────────
const PT_CLASS_TYPES = [
  "PTClassBookingConfirmed",
  "PTClassBookingUpdated",
  "PTClassBookingCancelled",
  "PTClassTodayReminder",
];
const CLASS_TYPES = [
  "ClassBookingConfirmed",
  "ClassBookingUpdated",
  "ClassBookingCancelled",
  "ClassTodayReminder",
];
const NUTRITION_TYPES = [
  "NutritionPlanAssigned",
  "NutritionPlanUpdated",
  "NutritionPlanRemoved",
];
const WORKOUT_TYPES = [
  "WorkoutScheduleAssigned",
  "WorkoutScheduleUpdated",
  "WorkoutScheduleRemoved",
  "WorkoutScheduleExpiring",
  "WorkoutScheduleExpired",
];
const SUBSCRIPTION_TYPES = [
  "SubscriptionCreated",
  "SubscriptionRenewed",
  "SubscriptionUpdated",
  "SubscriptionPlanChanged",
  "SubscriptionTransferredOut",
  "SubscriptionTransferredIn",
  "SubscriptionExpiring",
  "SubscriptionExpired",
  "SubscriptionPaymentReceived",
];
const WALLET_TYPES = ["WalletDeposit", "WalletPurchase"];

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F4F6F9",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  surfaceEnd: dark ? "#252525" : "#F8F9FF",
  ink: dark ? "#F0F0F0" : "#1B1B1B",
  muted: dark ? "#888888" : "#555555",
  date: dark ? "#666666" : "#888888",
  iconBg: dark ? "#2C3A4A" : "#EEF0FF",
  iconColor: dark ? "#7AADCF" : "#254764",
  border: dark ? "#2C2C2C" : "transparent",
});

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppContext(); // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const token = await handleGetToken();
      if (!token) throw new Error("Authorization token missing");
      const response = await fetch(
        "http://192.168.1.16/api/Notification",
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
      console.log("notification", data);
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
          `http://192.168.1.16/api/Notification/readNotification?notificationId=${item.id}`,
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
      const ptId = parsedUrl.ptId;
      const ptClassId = parsedUrl.ptClassId;
      const notificationType = parsedUrl.type || "";

      if (!navigationRef.isReady()) return;

      if (PT_CLASS_TYPES.includes(notificationType)) {
        await AsyncStorage.setItem("GPTID", ptId.toString());
        navigationRef.navigate(
          "Root" as never,
          {
            screen: "PTNavigator",
            params: { screen: "PTList" },
          } as never,
        );
      } else if (CLASS_TYPES.includes(notificationType)) {
        navigationRef.navigate(
          "Root" as never,
          {
            screen: "BookClassDrawer",
            params: { screen: "ClassDetails", params: { classId: ID } },
          } as never,
        );
      } else if (NUTRITION_TYPES.includes(notificationType)) {
        navigationRef.navigate(
          "Root" as never,
          {
            screen: "NutritionPlan",
            params: { screen: "NutritionPlanMain" },
          } as never,
        );
      } else if (WORKOUT_TYPES.includes(notificationType)) {
        navigationRef.navigate(
          "Root" as never,
          {
            screen: "MonthlySchedule",
            params: { screen: "MonthlyScheduleMain" },
          } as never,
        );
      } else if (SUBSCRIPTION_TYPES.includes(notificationType)) {
        navigationRef.navigate(
          "Root" as never,
          {
            screen: "MyProfileNavigator",
            params: { screen: "MyProfileMain" },
          } as never,
        );
      } else if (WALLET_TYPES.includes(notificationType)) {
        navigationRef.navigate("WalletHistory" as never);
      } else if (notificationType === "ComplaintUpdated") {
        navigationRef.navigate("ComplaintsHistory" as never);
      } else if (notificationType === "OrderPlaced") {
        navigationRef.navigate("Orders" as never);
      } else if (notificationType === "ManualNotification") {
        navigationRef.navigate("Root" as never);
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
      backgroundColor: theme.bg, // 👈
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
      borderColor: theme.border, // 👈 subtle border in dark mode
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
      color: theme.ink, // 👈
      flex: 1,
      marginRight: 6,
    },
    date: {
      fontSize: 12,
      color: theme.date, // 👈
    },
    message: {
      fontSize: 14,
      color: theme.muted, // 👈
      lineHeight: 20,
    },
  });
