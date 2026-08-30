// PageHeader.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { useI18n } from "../hooks/useI18n"; // adjust the path if needed
import { useAppContext } from "../context"; // adjust the path if needed
import { handleGetToken } from "../helpers"; // adjust the path if needed

const API_BASE = "http://192.168.1.16/api";

// Map each page "code" from the API to the screen name to navigate to.
// Add more entries here as you wire up more pages.
const CODE_TO_SCREEN: Record<string, string> = {
  GYM_WALLET_SALES: "GymEmployeeRoot",
};

type MyPage = {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  route: string;
};

const getTheme = (dark: boolean) => ({
  headerBg: dark ? "#0F172A" : "#FFFFFF",
  headerBorder: dark ? "#334155" : "#F3F4F6",
  iconBg: dark ? "#1E293B" : "#F3F4F6",
  iconColor: dark ? "#F1F5F9" : "#111827",
  panelBg: dark ? "#1E293B" : "#FFFFFF",
  textPrimary: dark ? "#F1F5F9" : "#111827",
  divider: dark ? "#334155" : "#F3F4F6",
});

export default function PageHeader() {
  const navigation = useNavigation();
  const { isArabic, setLanguage } = useI18n();
  const { isDarkMode, toggleDarkMode, handleLogout } = useAppContext();
  const theme = useMemo(() => getTheme(!isDarkMode), [isDarkMode]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pages, setPages] = useState<MyPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);

  const onToggleLanguage = () => {
    setLanguage(isArabic() ? "en" : "ar");
  };

  const onLogout = async () => {
    setMenuVisible(false);
    await handleLogout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" as never }],
      }),
    );
  };

  const fetchMyPages = async () => {
    setLoadingPages(true);
    try {
      const token = await handleGetToken();
      const res = await fetch(`${API_BASE}/GymEmployees/my-pages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      const data = await res.json();
      const list: MyPage[] = Array.isArray(data) ? data : (data?.items ?? []);
      setPages(list);
    } catch (err) {
      console.log("my-pages fetch error:", err);
    } finally {
      setLoadingPages(false);
    }
  };

  useEffect(() => {
    fetchMyPages();
  }, []);

  const onPagePress = (page: MyPage) => {
    setMenuVisible(false);
    const screenName = CODE_TO_SCREEN[page.code];
    if (!screenName) {
      console.log(`No screen mapped for page code "${page.code}"`);
      return;
    }
    navigation.navigate(screenName as never);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: theme.headerBg }]}
    >
      <View
        style={[styles.container, { borderBottomColor: theme.headerBorder }]}
      >
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.iconBg }]}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="grid-outline" size={20} color={theme.iconColor} />
        </TouchableOpacity>

        <View style={styles.rightGroup}>
          <TouchableOpacity
            style={[styles.langButton, { backgroundColor: theme.iconBg }]}
            onPress={onToggleLanguage}
          >
            <MaterialCommunityIcons
              name="translate"
              size={16}
              color={theme.iconColor}
            />
            <Text style={[styles.langText, { color: theme.iconColor }]}>
              {isArabic() ? "EN" : "AR"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.iconBg }]}
            onPress={toggleDarkMode}
          >
            <Ionicons
              name={isDarkMode ? "moon-outline" : "sunny-outline"}
              size={20}
              color={theme.iconColor}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={[styles.panel, { backgroundColor: theme.panelBg }]}
            onPress={() => {}}
          >
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: theme.textPrimary }]}>
                {isArabic() ? "القائمة" : "Menu"}
              </Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={22} color={theme.iconColor} />
              </TouchableOpacity>
            </View>

            {loadingPages ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#F97316" />
            ) : (
              pages.map((page) => (
                <TouchableOpacity
                  key={page.id}
                  style={styles.menuItem}
                  onPress={() => onPagePress(page)}
                >
                  <Ionicons
                    name="apps-outline"
                    size={18}
                    color={theme.iconColor}
                  />
                  <Text
                    style={[styles.menuItemText, { color: theme.textPrimary }]}
                  >
                    {isArabic() ? page.nameAr : page.nameEn}
                  </Text>
                </TouchableOpacity>
              ))
            )}

            <View
              style={[styles.divider, { backgroundColor: theme.divider }]}
            />

            <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
              <Ionicons
                name="log-out-outline"
                size={18}
                color={theme.iconColor}
              />
              <Text style={[styles.menuItemText, { color: theme.textPrimary }]}>
                {isArabic() ? "تسجيل خروج" : "logout"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {},
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  langButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  langText: {
    fontSize: 14,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});
