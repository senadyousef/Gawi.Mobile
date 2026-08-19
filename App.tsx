import React, { useEffect, useRef, useState } from "react";
import { Platform, Alert } from "react-native";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppEntry from "./AppEntry";
import Toast from "react-native-toast-message";
import { ContextProvider } from "./app/context";
import { toastConfig } from "./app/config/toastConfig";
import { navigate } from "./app/context/RootNavigation";
import { useNavigation } from "@react-navigation/native";
import navigation from "./app/navigation";
import SweetAlert, { sweetAlertRef } from "./app/components/SweetAlert";

// ----------------------
// Foreground notification handler
// ----------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  // ----------------------
  // Handle notification navigation
  // ----------------------
  const handleRouteNavigation = async (item: any) => {
    if (!item || !item.route) return;

    let parsed: any = null;

    try {
      // If route is already an object → use directly
      parsed =
        typeof item.route === "object" ? item.route : JSON.parse(item.route);
    } catch (err) {
      console.warn("❌ Invalid route JSON:", item.route);
      return;
    }

    if (!parsed) return;

    const ID = parsed.Id || parsed.classId || parsed.ptId || null;

    const pageName = parsed.pageName || "";

    console.log("Parsed URL:", parsed);

    // Delay ensures navigation works even during notifications
    setTimeout(async () => {
      if (pageName === "GymClass") {
        navigate("ClassDetails", { classId: ID });
      } else if (pageName === "PTClass") {
        await AsyncStorage.setItem("GPTID", ID.toString());
        navigate("PTList");
      } else {
        console.log("⚠️ Unknown pageName, no navigation:", pageName);
      }
    }, 300);
  };

  // ----------------------
  // Deep linking
  // ----------------------
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      const { path, queryParams } = Linking.parse(url);
      if (!path) return;

      if (path.startsWith("reel")) {
        const id = path.split("/")[1];
        if (id) navigate("ReelsScreen", { id, ...queryParams });
      }
      if (path.startsWith("notification")) {
        const id = path.split("/")[1];
        if (id) navigate("NotificationDetail", { id, ...queryParams });
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) handleDeepLink({ url: initialUrl });
    })();

    return () => subscription.remove();
  }, []);

  // ----------------------
  // Push notifications setup
  // ----------------------
  useEffect(() => {
    (async () => {
      // 2. Device ID
      const id =
        Device.osInternalBuildId ||
        Device.deviceName ||
        Device.modelName ||
        "unknown-device";
      setDeviceId(id);
    })();

    // Foreground notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        // can show custom in-app notification here if needed
      });

    // Handle tapped / background notifications
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleRouteNavigation(response.notification.request.content.data);
      });

    // Handle notification when app opens from closed state
    (async () => {
      const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
      if (lastResponse?.notification?.request?.content?.data) {
        handleRouteNavigation(lastResponse.notification.request.content.data);
      }
    })();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // ----------------------
  // Register Push Notifications function
  // ----------------------

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ContextProvider expoPushToken={expoPushToken} deviceId={deviceId}>
          <AppEntry />

          <Toast config={toastConfig} />
        </ContextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
