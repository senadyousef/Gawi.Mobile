import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
} from "react-native";
import { useI18n } from "../hooks/useI18n";
import { useNavigation } from "@react-navigation/native";
import { useAppContext } from "../context";
import Icon from "react-native-vector-icons/Ionicons";

// ── Localization ──────────────────────────────────────────────────────────────
const T = {
  en: {
    settings: "Settings",
    language: "Language",
    darkMode: "Dark Mode",
    selectLanguage: "Select Language",
    logout: "Logout",
    logoutConfirm: "Are you sure you want to logout?",
    cancel: "Cancel",
    english: "English",
    arabic: "Arabic",
    englishNative: "English",
    arabicNative: "العربية",
  },
  ar: {
    settings: "الإعدادات",
    language: "اللغة",
    darkMode: "الوضع الداكن",
    selectLanguage: "اختر اللغة",
    logout: "تسجيل الخروج",
    logoutConfirm: "هل أنت متأكد من تسجيل الخروج؟",
    cancel: "إلغاء",
    english: "الإنجليزية",
    arabic: "العربية",
    englishNative: "English",
    arabicNative: "العربية",
  },
};

export default function PTMenuScreen() {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const navigation = useNavigation();
  const { handleLogout, isDarkMode, toggleDarkMode, language } =
    useAppContext() as any;
  const { setLanguage, getDirection, isArabic } = useI18n();

  const darkMode = isDarkMode ?? false;
  const theme = darkMode ? darkStyles : lightStyles;
  const isAr = isArabic();
  const t = isAr ? T.ar : T.en;

  const dirStyle = getDirection() as any;
  const isRTL =
    dirStyle?.flexDirection === "row-reverse" || dirStyle?.direction === "rtl";

  // ── RTL helpers ──────────────────────────────────────────────────────────
  const rowDir = { flexDirection: isRTL ? "row-reverse" : "row" } as const;
  const textAlign = { textAlign: isRTL ? "right" : "left" } as const;
  const alignEnd = { alignItems: isRTL ? "flex-end" : "flex-start" } as const;

  const handleLogoutPress = () =>
    Alert.alert(t.logout, t.logoutConfirm, [
      { text: t.cancel, style: "cancel" },
      { text: t.logout, onPress: handleLogout, style: "destructive" },
    ]);

  const handleSaveLanguage = async (code: string) => {
    const currentLang = isAr ? "ar" : "en";
    if (code === currentLang) {
      setShowLanguageMenu(false);
      return;
    }
    await setLanguage(code);
    setShowLanguageMenu(false);
  };

  return (
    <SafeAreaView style={[styles.container, theme.container]}>
      {/* Header */}
      <View style={[styles.header, rowDir]}>
        <View style={styles.headerIconContainer} />
        <Text style={[styles.title, theme.text, textAlign]}>{t.settings}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, theme.card, styles.logoutButton]}
            onPress={handleLogoutPress}
          >
            <Icon name="log-out-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        {/* Language */}
        <View style={[styles.section, theme.card]}>
          <TouchableOpacity
            style={[styles.menuItem, rowDir]}
            onPress={() => setShowLanguageMenu(true)}
          >
            <View style={[styles.menuItemLeft, rowDir]}>
              <View
                style={[styles.iconWrapper, { backgroundColor: "#3B82F620" }]}
              >
                <Icon name="language" size={22} color="#3B82F6" />
              </View>
              <Text style={[styles.menuItemText, theme.text, textAlign]}>
                {t.language}
              </Text>
            </View>
            <View style={[styles.menuItemRight, rowDir]}>
              <Text style={[styles.selectedLanguage, textAlign]}>
                {isAr ? T.ar.arabicNative : T.en.englishNative}
              </Text>
              <Icon
                name={isRTL ? "chevron-back" : "chevron-forward"}
                size={20}
                color="#9CA3AF"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Dark Mode */}
        <View style={[styles.section, theme.card]}>
          <View style={[styles.menuItem, rowDir]}>
            <View style={[styles.menuItemLeft, rowDir]}>
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: darkMode ? "#222222" : "#E5E7EB" },
                ]}
              >
                <Icon
                  name={darkMode ? "moon" : "sunny"}
                  size={22}
                  color={darkMode ? "#FBBF24" : "#F59E0B"}
                />
              </View>
              <Text style={[styles.menuItemText, theme.text, textAlign]}>
                {t.darkMode}
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* Language Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showLanguageMenu}
        onRequestClose={() => setShowLanguageMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageMenu(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: darkMode ? "#111111" : "#FFFFFF" },
            ]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, rowDir, { borderBottomColor: darkMode ? "#222222" : "#F3F4F6" }]}>
              <Text
                style={[
                  styles.modalTitle,
                  textAlign,
                  { color: darkMode ? "#EEEEEE" : "#1F2937" },
                ]}
              >
                {t.selectLanguage}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageMenu(false)}>
                <Icon
                  name="close"
                  size={24}
                  color={darkMode ? "#888888" : "#6B7280"}
                />
              </TouchableOpacity>
            </View>

            {/* Language Options */}
            {[
              { code: "en", label: T.en.englishNative, subLabel: t.english },
              { code: "ar", label: T.ar.arabicNative, subLabel: t.arabic },
            ].map(({ code, label, subLabel }, i) => (
              <React.Fragment key={code}>
                {i > 0 && (
                  <View
                    style={[
                      styles.modalDivider,
                      { backgroundColor: darkMode ? "#222222" : "#F3F4F6" },
                    ]}
                  />
                )}
                <TouchableOpacity
                  style={[styles.modalOption, rowDir]}
                  onPress={() => handleSaveLanguage(code)}
                >
                  <View style={alignEnd}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        textAlign,
                        { color: darkMode ? "#EEEEEE" : "#1F2937" },
                      ]}
                    >
                      {label}
                    </Text>
                    <Text style={[styles.modalOptionSubtext, textAlign]}>
                      {subLabel}
                    </Text>
                  </View>
                  {(code === "ar" ? isAr : !isAr) && (
                    <Icon name="checkmark-circle" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerIconContainer: { width: 40 },
  title: { fontSize: 28, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 12 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: { backgroundColor: "#EF444410" },
  menuContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  section: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLeft: { alignItems: "center", gap: 14 },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemText: { fontSize: 16, fontWeight: "500" },
  menuItemRight: { alignItems: "center", gap: 8 },
  selectedLanguage: { fontSize: 14, color: "#6B7280" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 320,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", flex: 1 },
  modalDivider: { height: 1 },
  modalOption: {
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalOptionText: { fontSize: 16, fontWeight: "500", marginBottom: 2 },
  modalOptionSubtext: { fontSize: 12, color: "#9CA3AF" },
});

const lightStyles = StyleSheet.create({
  container: { backgroundColor: "#F9FAFB" },
  text: { color: "#1F2937" },
  card: { backgroundColor: "#FFFFFF" },
});

const darkStyles = StyleSheet.create({
  container: { backgroundColor: "#000000" },
  text: { color: "#EEEEEE" },
  card: { backgroundColor: "#111111" },
});