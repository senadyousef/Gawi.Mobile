import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

export type SweetAlertType = "success" | "error" | "warning" | "info";

export interface SweetAlertButton {
  text: string;
  onPress?: () => void;
  style?: "primary" | "cancel" | "destructive";
}

interface SweetAlertProps {
  visible: boolean;
  type?: SweetAlertType;
  title: string;
  message?: string;
  buttons?: SweetAlertButton[];
  isDarkMode?: boolean;
  isRTL?: boolean;
  onRequestClose?: () => void;
}

const TYPE_CONFIG: Record<
  SweetAlertType,
  { icon: string; color: string; bg: string }
> = {
  success: { icon: "✓", color: "#3AC569", bg: "rgba(58, 197, 105, 0.12)" },
  error: { icon: "✕", color: "#E5484D", bg: "rgba(229, 72, 77, 0.12)" },
  warning: { icon: "!", color: "#F5A623", bg: "rgba(245, 166, 35, 0.12)" },
  info: { icon: "i", color: "#4C63AF", bg: "rgba(76, 99, 175, 0.12)" },
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SweetAlert({
  visible,
  type = "info",
  title,
  message,
  buttons,
  isDarkMode = false,
  isRTL = false,
  onRequestClose,
}: SweetAlertProps) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0.8);
      opacity.setValue(0);
      iconScale.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const cfg = TYPE_CONFIG[type];
  const resolvedButtons: SweetAlertButton[] =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: "OK", style: "primary" }];

  const isStacked = resolvedButtons.length > 2;

  const colors = {
    card: isDarkMode ? "#1E1E1E" : "#FFFFFF",
    ink: isDarkMode ? "#F0F0F0" : "#111111",
    muted: isDarkMode ? "#AAAAAA" : "#666666",
    cancelBg: isDarkMode ? "#2C2C2C" : "#EFEFEF",
    cancelText: isDarkMode ? "#F0F0F0" : "#555555",
    overlay: "rgba(0,0,0,0.45)",
  };

  const handlePress = (btn: SweetAlertButton) => {
    onRequestClose?.();
    if (btn.onPress) {
      // Delay allows the native Modal to unmount first, preventing iOS view controller presentation conflicts
      setTimeout(() => {
        btn.onPress!();
      }, 350);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => onRequestClose?.()}
    >
      <Animated.View
        style={[styles.overlay, { opacity, backgroundColor: colors.overlay }]}
      >
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, transform: [{ scale }] },
          ]}
        >
          <Animated.View
            style={[
              styles.iconCircle,
              { backgroundColor: cfg.bg, transform: [{ scale: iconScale }] },
            ]}
          >
            <Text style={[styles.iconText, { color: cfg.color }]}>
              {cfg.icon}
            </Text>
          </Animated.View>

          <Text
            style={[
              styles.title,
              { color: colors.ink, writingDirection: isRTL ? "rtl" : "ltr" },
            ]}
          >
            {title}
          </Text>

          {!!message && (
            <Text
              style={[
                styles.message,
                {
                  color: colors.muted,
                  writingDirection: isRTL ? "rtl" : "ltr",
                },
              ]}
            >
              {message}
            </Text>
          )}

          <View
            style={[
              styles.buttonRow,
              isStacked && { flexDirection: "column" },
              isRTL &&
                !isStacked && {
                  flexDirection: "row-reverse",
                },
            ]}
          >
            {resolvedButtons.map((btn, idx) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => handlePress(btn)}
                  style={[
                    styles.button,
                    isStacked ? { width: "100%" } : { flex: 1 },
                    isCancel && { backgroundColor: colors.cancelBg },
                    isDestructive && { backgroundColor: "#E5484D" },
                    !isCancel &&
                      !isDestructive && { backgroundColor: cfg.color },
                    idx > 0 &&
                      !isStacked &&
                      (isRTL ? { marginRight: 10 } : { marginLeft: 10 }),
                    isStacked && idx > 0 && { marginTop: 10 },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: isCancel ? colors.cancelText : "#FFFFFF" },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconText: { fontSize: 30, fontWeight: "800" },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonRow: { flexDirection: "row", width: "100%", justifyContent: "center" },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "700" },
});
