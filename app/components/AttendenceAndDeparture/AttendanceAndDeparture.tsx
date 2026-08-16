import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Image,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { CameraView, Camera, BarcodeScanningResult } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import i18n from "../../localization";
import { useAppContext } from "../../context";
import HtmlRenderer from "../renderHtml";
import gymHub, { GymNotification } from "../../services/gymHubConnection"; // 👈
import { handleGetToken } from "../../helpers"; // 👈 shared auth token helper

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#FFFFFF",
  surface: dark ? "#1E1E1E" : "#F0F0F0",
  ink: dark ? "#F0F0F0" : "#111111",
  muted: dark ? "#888888" : "#555555",
  cameraBg: dark ? "#2C2C2C" : "#F0F0F0",
  cancelBg: dark ? "#2C2C2C" : "#E0E0E0",
  cancelText: dark ? "#F0F0F0" : "#555555",
  accent: "#4C63AF",
});

interface IProps {
  handleClose?: () => void;
  memberId?: number;
}

export default function QRCodeScreen({ handleClose, memberId }: IProps) {
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrBody, setQrBody] = useState<string | null>(null);
  const [qrHeader, setQrHeader] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(false); // 👈 loading state for open-ticket purchase

  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const gymApiUrl =
    "https://gym.useitsmart.com/api/MemberShips/checkMemberInOrOut";
  const purchaseOpenTicketUrl =
    "https://gym.useitsmart.com/api/MemberWallet/me/purchase-open-ticket"; // 👈
  const isRTL = i18n.locale === "ar";

  const memberIdRef = useRef<string | null>(null);
  const notificationHandlerRef = useRef<(msg: GymNotification) => void>();
  const scanLockRef = useRef(false); // 👈 blocks re-entry into handleBarCodeScanned
  // 👇 blocks re-entry into the actual network-triggering actions themselves.
  // On iOS, expo-camera can call onBarcodeScanned repeatedly per frame while the
  // code is still visible (no built-in debounce like Android's ML Kit scanner has),
  // so this is a second, independent guard directly around each mutating call —
  // even if the scan handler somehow re-fires, the actual fetch only ever runs once.
  const actionLockRef = useRef(false);
  // 👇 mirrors isCheckedIn synchronously — state updates are async, so a QR
  // scanned right after check-in-state changes could read stale state via
  // closures. Read isCheckedInRef.current instead of isCheckedIn in scan handlers.
  const isCheckedInRef = useRef(false);

  notificationHandlerRef.current = (msg: GymNotification) => {
    console.log("🔔 [QRCodeScreen] notification for member check:", msg);
    if (
      memberIdRef.current &&
      msg.memberId?.toString() === memberIdRef.current
    ) {
      setIsCheckedIn(msg.isInGym);
      isCheckedInRef.current = msg.isInGym;
      AsyncStorage.setItem("isCheckedIn", msg.isInGym.toString());
    }
  };

  useEffect(() => {
    (async () => {
      const { granted } = await Camera.requestCameraPermissionsAsync();
      console.log("📷 [QRCodeScreen] camera permission granted:", granted);
      setHasPermission(granted);
      const storedStatus = await AsyncStorage.getItem("isCheckedIn");
      if (storedStatus !== null) {
        const checkedIn = storedStatus === "true";
        setIsCheckedIn(checkedIn);
        isCheckedInRef.current = checkedIn;
      }
    })();
  }, []);

  // 👇 listen for live check-in/out events for this member
  useEffect(() => {
    let cancelled = false;
    const dispatch = (msg: GymNotification) =>
      notificationHandlerRef.current?.(msg);

    (async () => {
      const storedMemberId = await AsyncStorage.getItem("MemberId");
      console.log(
        "🆔 [QRCodeScreen] mount effect, storedMemberId:",
        storedMemberId,
      );

      if (cancelled) {
        console.log("⏹️ [QRCodeScreen] effect cancelled before setup");
        return;
      }
      if (!storedMemberId) {
        console.log(
          "⚠️ [QRCodeScreen] no MemberId in storage — skipping gymHub setup entirely",
        );
        return;
      }

      memberIdRef.current = storedMemberId;

      try {
        console.log("▶️ [QRCodeScreen] calling gymHub.start()");
        await gymHub.start();
        console.log("✅ [QRCodeScreen] gymHub.start() resolved");
        gymHub.on("ReceiveGymNotification", dispatch);
      } catch (err) {
        console.error("❌ [QRCodeScreen] SignalR connection error:", err);
      }
    })();

    return () => {
      cancelled = true;
      gymHub.off("ReceiveGymNotification", dispatch); // only drop the listener — leave the shared connection running for other screens
    };
  }, []);

  const handleCheckInOut = async () => {
    console.log("🏃 [QRCodeScreen] handleCheckInOut triggered");
    // 👇 idempotency guard — regardless of how many times this gets called,
    // the actual network request only fires once until it resolves
    if (actionLockRef.current) {
      console.log(
        "⏹️ [QRCodeScreen] handleCheckInOut already in flight, ignoring",
      );
      return;
    }
    actionLockRef.current = true;
    try {
      setLoadingCheck(true);
      const storedMemberId = await AsyncStorage.getItem("MemberId");
      console.log("🆔 [QRCodeScreen] check-in storedMemberId:", storedMemberId);
      if (!storedMemberId) {
        Alert.alert(i18n.t("error"), "Member ID not found!");
        return;
      }
      const response = await fetch(`${gymApiUrl}?id=${storedMemberId}`, {
        method: "PUT",
        headers: { Accept: "text/plain" },
      });
      console.log(
        "📡 [QRCodeScreen] check-in response status:",
        response.status,
      );

      // 👇 read the body as text ONCE — the "please wait" rate-limit message
      // can come back as plain text (sometimes even alongside a 200), so we
      // have to inspect it before deciding whether to JSON.parse it
      const rawText = await response.text();
      console.log("📦 [QRCodeScreen] check-in raw response:", rawText);

      const waitMessage = "Please wait 5 minutes before checking in/out again";

      // 👇 keep this literal — it's what the server actually sends back,
      // independent of device locale. Only the alert shown to the user is localized.
      if (rawText.includes(waitMessage)) {
        Alert.alert(i18n.t("error"), i18n.t("wait_5_minutes") || waitMessage);
        return;
      }

      if (!response.ok) {
        Alert.alert(i18n.t("error"), rawText || i18n.t("an_error_occured"));
        return;
      }

      let result: any;
      try {
        result = JSON.parse(rawText);
      } catch (parseError) {
        console.error(
          "❌ [QRCodeScreen] failed to parse check-in JSON:",
          parseError,
        );
        Alert.alert(i18n.t("error"), i18n.t("an_error_occured"));
        return;
      }
      console.log("📦 [QRCodeScreen] check-in result:", result);

      const newStatus = result?.isInGym ?? !isCheckedIn;
      setIsCheckedIn(newStatus);
      isCheckedInRef.current = newStatus; // 👈 keep the sync mirror up to date
      await AsyncStorage.setItem("isCheckedIn", newStatus.toString());

      if (result?.gymId) {
        // keep GymId fresh and make sure we're joined to that group right away
        await AsyncStorage.setItem("GymId", result.gymId.toString());
        console.log(
          "👥 [QRCodeScreen] calling gymHub.joinGroup with",
          result.gymId,
        );
        gymHub
          .joinGroup(result.gymId)
          .catch((err) =>
            console.error("❌ [QRCodeScreen] Error joining gym group:", err),
          );
      } else {
        console.log("⚠️ [QRCodeScreen] check-in result had no gymId");
      }

      // 👇 don't wait for the server to push this back over the socket —
      // this device already knows the check-in succeeded, so fire the same
      // event locally right away. Any screen listening for
      // "ReceiveGymNotification" (e.g. GymTrafficVisual) updates instantly.
      gymHub.emitLocal("ReceiveGymNotification", {
        memberId: Number(storedMemberId),
        gymId: result?.gymId ?? null,
        isInGym: newStatus,
      } as GymNotification);

      // 👇 one check-in/out per scan — acknowledge, then leave the screen
      // instead of sitting on "scan again" where a second scan could fire
      // another check-in/out right away
      Alert.alert(
        i18n.t("success"),
        newStatus
          ? i18n.t("check_in_button") || "Checked In Successfully"
          : i18n.t("check_out_button") || "Checked Out Successfully",
        [
          {
            text: i18n.t("ok") || "OK",
            onPress: () => {
              if (handleClose) {
                handleClose();
              } else {
                navigation.navigate("HomeTabs" as never);
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error("❌ [QRCodeScreen] handleCheckInOut error:", error);
      Alert.alert(i18n.t("error"), i18n.t("an_error_occured"));
    } finally {
      actionLockRef.current = false;
      setLoadingCheck(false);
    }
  };

  // 👇 QR keyword: "PurchaseOpenTicket" — buys an open sale ticket for the member.
  // The server returns the "no open ticket" message as the plain-text body
  // when there's nothing to purchase, so we just surface response.text() on failure.
  const handlePurchaseOpenTicket = async () => {
    console.log("🎫 [QRCodeScreen] handlePurchaseOpenTicket triggered");
    // 👇 gym-side rule: can't buy an open ticket while not checked in.
    // Checked client-side before we even touch the network/action lock.
    if (!isCheckedInRef.current) {
      console.log(
        "⏹️ [QRCodeScreen] handlePurchaseOpenTicket blocked — not checked in",
      );
      Alert.alert(
        i18n.t("error"),
        i18n.t("must_check_in_first") || "You must check in first",
      );
      return;
    }
    if (actionLockRef.current) {
      console.log(
        "⏹️ [QRCodeScreen] handlePurchaseOpenTicket already in flight, ignoring",
      );
      return;
    }
    actionLockRef.current = true;
    try {
      setLoadingPurchase(true);
      const token = await handleGetToken();
      if (!token) {
        Alert.alert(i18n.t("error"), "Auth token not found!");
        return;
      }

      const response = await fetch(purchaseOpenTicketUrl, {
        method: "POST",
        headers: {
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(
        "📡 [QRCodeScreen] purchase-open-ticket response status:",
        response.status,
      );

      const text = await response.text();
      console.log(
        "📦 [QRCodeScreen] purchase-open-ticket response body:",
        text,
      );

      const noTicketMessage = "There is no open sale ticket for this gym.";
      const noEnoughBalance = "Wallet balance is not enough for this purchase.";
      // 👇 server can send this back as a 200 OK with the message in the
      // body, not just as an error status — so check the text itself first,
      // regardless of response.ok
      if (text.includes(noTicketMessage)) {
        Alert.alert(
          i18n.t("error"),
          i18n.t("no_open_ticket") || noTicketMessage,
        );
        return;
      }
      if (text.includes(noEnoughBalance)) {
        Alert.alert(
          i18n.t("error"),
          i18n.t("no_Enough_balance") || noEnoughBalance,
        );
        return;
      }
      if (!response.ok) {
        Alert.alert(i18n.t("error"), text);
        return;
      }

      Alert.alert(i18n.t("success"), i18n.t("ticket_purchased_success"));
    } catch (error) {
      console.error("❌ [QRCodeScreen] handlePurchaseOpenTicket error:", error);
      Alert.alert(i18n.t("error"), i18n.t("an_error_occured"));
    } finally {
      actionLockRef.current = false;
      setLoadingPurchase(false);
    }
  };

  const fetchQRInfo = async (qrId: string) => {
    console.log("ℹ️ [QRCodeScreen] fetchQRInfo for qrId:", qrId);
    // 👇 same gym-side rule applies to generic info QRs — not checked in, no fetch
    if (!isCheckedInRef.current) {
      console.log("⏹️ [QRCodeScreen] fetchQRInfo blocked — not checked in");
      Alert.alert(
        i18n.t("error"),
        i18n.t("must_check_in_first") || "You must check in first",
      );
      return;
    }
    if (actionLockRef.current) {
      console.log("⏹️ [QRCodeScreen] fetchQRInfo already in flight, ignoring");
      return;
    }
    actionLockRef.current = true;
    setLoading(true);
    try {
      const response = await fetch(
        "https://gym.useitsmart.com/api/QR/getallQR",
      );
      if (!response.ok) throw new Error("Failed to fetch QR codes");
      const result = await response.json();
      const qrItem = result.result.find(
        (item: any) => item.id.toString() === qrId.toString(),
      );
      if (!qrItem) {
        Alert.alert(i18n.t("not_found"), i18n.t("qr_code_info_not_found"));
        setQrBody(null);
      } else {
        setQrHeader(qrItem.header);
        setQrBody(qrItem.body);
      }
    } catch (error: any) {
      console.error("❌ [QRCodeScreen] fetchQRInfo error:", error);
      Alert.alert(
        i18n.t("error"),
        error.message || i18n.t("something_went_wrong"),
      );
    } finally {
      actionLockRef.current = false;
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    console.log("📸 [QRCodeScreen] barcode scanned, raw data:", data);
    if (scanLockRef.current) {
      console.log("⏹️ [QRCodeScreen] already scanned, ignoring");
      return;
    }
    scanLockRef.current = true;
    setScanned(true);
    if (data === "Attendance") {
      console.log("➡️ [QRCodeScreen] routing to handleCheckInOut");
      handleCheckInOut();
    } else if (data === "Gyminfo") {
      console.log("➡️ [QRCodeScreen] routing to GymInfo navigation");
      if (handleClose) handleClose();
      navigation.navigate("GymInfo" as never);
    } else if (data === "PurchaseOpenTicket") {
      console.log("➡️ [QRCodeScreen] routing to handlePurchaseOpenTicket");
      handlePurchaseOpenTicket();
    } else {
      console.log("➡️ [QRCodeScreen] routing to fetchQRInfo");
      fetchQRInfo(data);
    }
  };

  const resetScanner = () => {
    scanLockRef.current = false;
    setScanned(false);
    setQrBody(null);
    setQrHeader(null);
  };

  if (hasPermission === null) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <Text style={s.permissionText}>
          {i18n.t("request_camera_permission")}
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <Text style={[s.permissionText, { color: "#E55" }]}>
          {i18n.t("camera_permission_denied")}
        </Text>
      </View>
    );
  }

  if (qrBody) {
    return (
      <View style={s.container}>
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {qrHeader && (
            <Text
              style={[
                s.headerText,
                {
                  textAlign: isRTL ? "right" : "left",
                  writingDirection: isRTL ? "rtl" : "ltr",
                },
              ]}
            >
              {qrHeader}
            </Text>
          )}

          <HtmlRenderer html={qrBody} theme={theme} />

          <TouchableOpacity
            style={[s.primaryButton, { marginTop: 24 }]}
            onPress={resetScanner}
          >
            <Text style={s.buttonText}>{i18n.t("scan_another_qr")}</Text>
          </TouchableOpacity>

          {handleClose && (
            <TouchableOpacity
              style={[s.cancelButton, { marginTop: 10 }]}
              onPress={handleClose}
            >
              <Text style={s.cancelText}>{i18n.t("cancel")}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text
        style={[
          s.title,
          {
            textAlign: isRTL ? "right" : "left",
            writingDirection: isRTL ? "rtl" : "ltr",
          },
        ]}
      >
        📷 {i18n.t("scan_qr_code")}
      </Text>
      <TouchableOpacity
        activeOpacity={0.9}
        style={s.cameraContainer}
        onPress={() =>
          Alert.alert(i18n.t("scanning_message") || "Scanning in progress...")
        }
      >
        {!scanned && hasPermission ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr", "pdf417"] }}
          />
        ) : (
          <Image
            style={StyleSheet.absoluteFillObject}
            source={require("../../assets/images/qr-placeholder.png")}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>
      {(loading || loadingPurchase) && (
        <ActivityIndicator
          size="large"
          color={theme.accent}
          style={{ marginVertical: 12 }}
        />
      )}
      {scanned && !loading && !loadingPurchase && (
        <TouchableOpacity style={s.primaryButton} onPress={resetScanner}>
          <Text style={s.buttonText}>{i18n.t("scan_again")}</Text>
        </TouchableOpacity>
      )}
      {handleClose && (
        <TouchableOpacity
          style={[s.cancelButton, { marginTop: 10 }]}
          onPress={handleClose}
        >
          <Text style={s.cancelText}>{i18n.t("cancel")}</Text>
        </TouchableOpacity>
      )}
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
      padding: 16,
      paddingTop: 30,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
    },
    permissionText: {
      fontSize: 15,
      textAlign: "center",
      paddingHorizontal: 24,
      color: theme.ink,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 12,
      color: theme.ink,
    },
    headerText: {
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 16,
      color: theme.ink,
    },
    cameraContainer: {
      width: "100%",
      aspectRatio: 1,
      overflow: "hidden",
      borderRadius: 16,
      marginVertical: 20,
      backgroundColor: theme.cameraBg,
    },
    primaryButton: {
      backgroundColor: theme.accent,
      padding: 14,
      borderRadius: 10,
      marginVertical: 6,
    },
    cancelButton: {
      backgroundColor: theme.cancelBg,
      padding: 14,
      borderRadius: 10,
      marginVertical: 6,
    },
    buttonText: {
      color: "#FFFFFF",
      fontWeight: "600",
      textAlign: "center",
      fontSize: 15,
    },
    cancelText: {
      color: theme.cancelText,
      fontWeight: "600",
      textAlign: "center",
      fontSize: 15,
    },
  });
