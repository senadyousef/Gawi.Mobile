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
      const interval = setInterval(() => {
        if (navReady) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }
  async function handleNotificationNavigation(data: any) {
    if (!data) return;

    console.log("RAW NOTIFICATION DATA:", data);

    let parsed = null;
    try {
      parsed =
        typeof data.route === "object" ? data.route : JSON.parse(data.route);
    } catch (e) {
      console.log("Failed to parse route", data.route);
      return;
    }

    if (!parsed) return;

    const ID = parsed.Id || parsed.classId || parsed.ptId;
    const pageName = (parsed.pageName || "").toLowerCase();

    await waitForNavigationReady();

    if (pageName === "gymclass") {
      navigationRef.current?.navigate("ClassDetails", { classId: ID });
    } else if (pageName === "ptclass") {
      await AsyncStorage.setItem("GPTID", ID.toString());
      navigationRef.current?.navigate("PTList");
    } else {
      console.log("Unknown pageName:", pageName);
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