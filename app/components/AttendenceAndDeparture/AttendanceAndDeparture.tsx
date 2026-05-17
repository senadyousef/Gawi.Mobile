import React, { useEffect, useState } from "react";
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
import { useAppContext } from "../../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg:           dark ? "#121212" : "#FFFFFF",
  surface:      dark ? "#1E1E1E" : "#F0F0F0",
  ink:          dark ? "#F0F0F0" : "#111111",
  muted:        dark ? "#888888" : "#555555",
  cameraBg:     dark ? "#2C2C2C" : "#F0F0F0",
  cancelBg:     dark ? "#2C2C2C" : "#E0E0E0",
  cancelText:   dark ? "#F0F0F0" : "#555555",
  accent:       "#4C63AF",
});

interface IProps {
  handleClose?: () => void;
  memberId?: number;
}

export default function QRCodeScreen({ handleClose, memberId }: IProps) {
  const { isDarkMode } = useAppContext();                                    // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);  // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);              // 👈 reactive styles

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrBody, setQrBody] = useState<string | null>(null);
  const [qrHeader, setQrHeader] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);

  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const gymApiUrl = "https://gym.useitsmart.com/api/MemberShips/checkMemberInOrOut";
  const isRTL = i18n.locale === "ar";

  useEffect(() => {
    (async () => {
      const { granted } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(granted);
      const storedStatus = await AsyncStorage.getItem("isCheckedIn");
      if (storedStatus !== null) setIsCheckedIn(storedStatus === "true");
    })();
  }, []);

  const handleCheckInOut = async () => {
    try {
      setLoadingCheck(true);
      const storedMemberId = await AsyncStorage.getItem("MemberId");
      if (!storedMemberId) {
        Alert.alert(i18n.t("error"), "Member ID not found!");
        return;
      }
      const response = await fetch(`${gymApiUrl}?id=${storedMemberId}`, {
        method: "PUT",
        headers: { Accept: "text/plain" },
      });
      if (!response.ok) {
        const text = await response.text();
        Alert.alert(i18n.t("error"), text || i18n.t("an_error_occured"));
        return;
      }
      const newStatus = !isCheckedIn;
      setIsCheckedIn(newStatus);
      await AsyncStorage.setItem("isCheckedIn", newStatus.toString());
      Alert.alert(
        i18n.t("success"),
        newStatus
          ? i18n.t("check_in_button") || "Checked In Successfully"
          : i18n.t("check_out_button") || "Checked Out Successfully",
      );
    } catch (error) {
      Alert.alert(i18n.t("error"), i18n.t("an_error_occured"));
    } finally {
      setLoadingCheck(false);
    }
  };

  const fetchQRInfo = async (qrId: string) => {
    setLoading(true);
    try {
      const response = await fetch("https://gym.useitsmart.com/api/QR/getallQR");
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
      Alert.alert(i18n.t("error"), error.message || i18n.t("something_went_wrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    if (data === "checkMemberInOrOut") {
      handleCheckInOut();
    } else if (data === "GymInfo") {
      if (handleClose) handleClose();
      navigation.navigate("GymInfo" as never);
    } else {
      fetchQRInfo(data);
    }
    setTimeout(() => setScanned(false), 2000);
  };

  const resetScanner = () => {
    setScanned(false);
    setQrBody(null);
    setQrHeader(null);
  };

  // ── Permission states ─────────────────────────────────────────────────────
  if (hasPermission === null) {
    return (
      <View style={[s.center, { backgroundColor: theme.bg }]}>
        <Text style={s.permissionText}>{i18n.t("request_camera_permission")}</Text>
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

  // ── QR Info result view ───────────────────────────────────────────────────
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

          {/* 👇 Pass dark mode color to HTML renderer */}
          <RenderHtml
            contentWidth={width}
            source={{ html: qrBody }}
            baseStyle={{ color: theme.ink }}
          />

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

  // ── Main scanner view ─────────────────────────────────────────────────────
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
        onPress={() => Alert.alert(i18n.t("scanning_message") || "Scanning in progress...")}
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

      {loading && (
        <ActivityIndicator
          size="large"
          color={theme.accent}
          style={{ marginVertical: 12 }}
        />
      )}

      {scanned && !loading && (
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

      <StatusBar style={isDarkMode ? "light" : "dark"} /> {/* 👈 */}
    </View>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,    // 👈
      padding: 16,
      paddingTop: 30,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,    // 👈
    },
    permissionText: {
      fontSize: 15,
      textAlign: "center",
      paddingHorizontal: 24,
      color: theme.ink,             // 👈
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 12,
      color: theme.ink,             // 👈
    },
    headerText: {
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 16,
      color: theme.ink,             // 👈
    },
    cameraContainer: {
      width: "100%",
      aspectRatio: 1,
      overflow: "hidden",
      borderRadius: 16,
      marginVertical: 20,
      backgroundColor: theme.cameraBg, // 👈
    },
    primaryButton: {
      backgroundColor: theme.accent,
      padding: 14,
      borderRadius: 10,
      marginVertical: 6,
    },
    cancelButton: {
      backgroundColor: theme.cancelBg, // 👈
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
      color: theme.cancelText,          // 👈
      fontWeight: "600",
      textAlign: "center",
      fontSize: 15,
    },
  });