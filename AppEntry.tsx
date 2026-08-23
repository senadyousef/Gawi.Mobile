import * as React from "react";
import { Platform, Alert } from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { NavigationContainerRef } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Navigation from "./app/navigation";
import SplashScreen from "./app/screens/SplashScreen";
import useColorScheme from "./app/hooks/useColorScheme";
import useCachedResources from "./app/hooks/useCachedResources";

// 🔔 Notification type groups — replace these with your actual backend "type" values
const PT_CLASS_TYPES = ["PTClassBooked", "PTClassReminder", "PTClassCancelled"];
const CLASS_TYPES = ["ClassBooked", "ClassReminder", "ClassCancelled"];
const NUTRITION_TYPES = ["NutritionPlanUpdated"];
const WORKOUT_TYPES = ["WorkoutPlanUpdated"];
const SUBSCRIPTION_TYPES = ["SubscriptionExpiring", "SubscriptionRenewed"];
const WALLET_TYPES = ["WalletCredited", "WalletDebited"];

export default function AppEntry() {
  const colorScheme = useColorScheme();
  const { isFirstTime, isLoadingComplete } = useCachedResources();
  const [isAnimationFinished, setIsAnimationFinished] = React.useState(false);
  const [navReady, setNavReady] = React.useState(false);

  const navigationRef = React.useRef<NavigationContainerRef<any>>(null);
  const notificationListener = React.useRef<any>(null);
  const responseListener = React.useRef<any>(null);

  // 🔗 Deep linking configuration
  const linking = {
    prefixes: ["Gym://"],
    config: {
      screens: {
        HomeTabs: "home",
        Notifications: "notifications",
        NotificationDetail: "notification/:id",
        ClassDetails: "class/:id",
        PTList: "pt/:id",
      },
    },
  };

  // ----------------------
  // Handle Notifications
  // ----------------------
  React.useEffect(() => {
    // Foreground notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        if (Platform.OS === "android") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          handleShowCustomToast({
            title: notification.request.content.title || "Notification",
            description: notification.request.content.body || "",
            duration: 5000,
            onPress: () =>
              handleNotificationNavigation(notification.request.content.data),
          });
        }
      });

    // Background / tapped notifications
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationNavigation(
          response.notification.request.content.data,
        );
      });

    // Handle notification when app is opened from closed state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data) {
        handleNotificationNavigation(
          response.notification.request.content.data,
        );
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  function waitForNavigationReady() {
    return new Promise((resolve) => {
      if (navigationRef.current?.isReady()) {
        resolve(true);
        return;
      }
      const interval = setInterval(() => {
        if (navReady && navigationRef.current?.isReady()) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }

  async function handleNotificationNavigation(data: any) {
    if (!data) return;

    let parsedUrl;
    try {
      parsedUrl =
        typeof data.route === "object" ? data.route : JSON.parse(data.route);
    } catch {
      return;
    }

    if (!parsedUrl) return;

    try {
      const ID = parsedUrl.Id;
      const ptId = parsedUrl.ptId;
      const ptClassId = parsedUrl.ptClassId;
      const notificationType = parsedUrl.type || "";

      await waitForNavigationReady();

      if (!navigationRef.current?.isReady()) return;

      if (PT_CLASS_TYPES.includes(notificationType)) {
        if (ptId) {
          await AsyncStorage.setItem("GPTID", ptId.toString());
        }
        navigationRef.current?.navigate(
          "Root" as never,
          {
            screen: "PTNavigator",
            params: { screen: "PTList" },
          } as never,
        );
      } else if (CLASS_TYPES.includes(notificationType)) {
        navigationRef.current?.navigate(
          "Root" as never,
          {
            screen: "BookClassDrawer",
            params: { screen: "ClassDetails", params: { classId: ID } },
          } as never,
        );
      } else if (NUTRITION_TYPES.includes(notificationType)) {
        navigationRef.current?.navigate(
          "Root" as never,
          {
            screen: "NutritionPlan",
            params: { screen: "NutritionPlanMain" },
          } as never,
        );
      } else if (WORKOUT_TYPES.includes(notificationType)) {
        navigationRef.current?.navigate(
          "Root" as never,
          {
            screen: "MonthlySchedule",
            params: { screen: "MonthlyScheduleMain" },
          } as never,
        );
      } else if (SUBSCRIPTION_TYPES.includes(notificationType)) {
        navigationRef.current?.navigate(
          "Root" as never,
          {
            screen: "MyProfileNavigator",
            params: { screen: "MyProfileMain" },
          } as never,
        );
      } else if (WALLET_TYPES.includes(notificationType)) {
        navigationRef.current?.navigate("WalletHistory" as never);
      } else if (notificationType === "ComplaintUpdated") {
        navigationRef.current?.navigate("ComplaintsHistory" as never);
      } else if (notificationType === "OrderPlaced") {
        navigationRef.current?.navigate("Orders" as never);
      } else if (notificationType === "ManualNotification") {
        navigationRef.current?.navigate("Root" as never);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    }
  }

  // ----------------------
  // Splash screen while loading
  // ----------------------
  if (!isLoadingComplete || !isAnimationFinished) {
    return <SplashScreen setIsAnimationFinished={setIsAnimationFinished} />;
  }

  return (
    <Navigation
      ref={navigationRef}
      onReady={() => setNavReady(true)}
      colorScheme={colorScheme}
      isFirstTime={isFirstTime}
      linking={linking}
    />
  );

  // ----------------------
  // Navigation helpers
  // ----------------------

  function handleShowCustomToast({
    title,
    description,
    duration,
    onPress,
  }: {
    title: string;
    description: string;
    duration: number;
    onPress: () => void;
  }) {
    // Minimal fallback toast: log the notification and keep the press handler available
    console.log(`[Toast] ${title} — ${description} (duration: ${duration})`);
    // Optionally, show your real toast here and call `onPress` when pressed
  }
}
