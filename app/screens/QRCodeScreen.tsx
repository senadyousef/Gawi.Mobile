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
} from "react-native";
import RenderHtml from "react-native-render-html";
import { CameraView, useCameraPermissions } from 'expo-camera';

import i18n from "../localization";
import { requestCameraPermissionsAsync } from "expo-image-picker";

export default function QRCodeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [qrBody, setQrBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrHeader, setQrHeader] = useState<string | null>(null);

  const { width } = useWindowDimensions();

  // Request camera permission
  useEffect(() => {
    (async () => {
      const { status } = await requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: any) => {
    setScanned(true);
    const qrId = data;

    setLoading(true);
    try {
      const response = await fetch(
        `https://gym.useitsmart.com/api/QR/getallQR`,
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
      Alert.alert(
        i18n.t("error"),
        error.message || i18n.t("something_went_wrong"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>{i18n.t("request_camera_permission")}</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>
          {i18n.t("camera_permission_denied")}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!qrBody ? (
        <>
          <Text
            style={[
              styles.title,
              {
                textAlign: i18n.locale === "ar" ? "right" : "left",
                writingDirection: i18n.locale === "ar" ? "rtl" : "ltr",
              },
            ]}
          >
            📷 {i18n.t("scan_qr_code")}
          </Text>

          <View style={styles.cameraContainer}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
          </View>

          {scanned && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                setScanned(false);
                setQrBody(null);
              }}
            >
              <Text style={styles.buttonText}>{i18n.t("scan_again")}</Text>
            </TouchableOpacity>
          )}

          {loading && <ActivityIndicator size="large" color="#4c63af" />}
        </>
      ) : (
        <ScrollView style={{ flex: 1, width: "100%" }}>
          <Text style={styles.headerText}>{qrHeader}</Text>
          <RenderHtml contentWidth={width} source={{ html: qrBody }} />
          <TouchableOpacity
            style={[styles.button, { marginTop: 20 }]}
            onPress={() => {
              setScanned(false);
              setQrBody(null);
            }}
          >
            <Text style={styles.buttonText}>{i18n.t("scan_another_qr")}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerText: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 16,
    color: "#111",
  },
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginVertical: 10 },
  cameraContainer: {
    width: "100%",
    height: 300,
    overflow: "hidden",
    borderRadius: 16,
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#4c63af",
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
