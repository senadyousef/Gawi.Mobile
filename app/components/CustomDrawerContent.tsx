import React from "react";
import {
  DrawerContentScrollView,
  useDrawerStatus,
} from "@react-navigation/drawer";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppContext } from "../context";
import i18n from "../localization";
import Colors from "../constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18n } from "../hooks/useI18n";
import { handleGetToken } from "../helpers";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#1A1A1A" : "#FFFFFF",
  scrollBg: dark ? "#1A1A1A" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : Colors.black,
  muted: dark ? "#888888" : Colors.gray,
  border: dark ? "#2C2C2C" : "#EEEEEE",
  rowPress: dark ? "#2C2C2C" : "#F5F5F5",
  footerText: dark ? "#666666" : Colors.gray,
});

const API_BASE_URL = "http://192.168.1.16/api";

// ─── Drawer Row ───────────────────────────────────────────────────────────────
function DrawerRow({
  label,
  icon,
  onPress,
  rtl,
  labelColor,
  bgColor,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  rtl: boolean;
  labelColor?: string;
  bgColor?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.rowContainer, bgColor ? { backgroundColor: bgColor } : {}]}
      activeOpacity={0.7}
    >
      {rtl ? (
        <>
          <Text
            style={[styles.rowLabel, styles.rowLabelRTL, { color: labelColor }]}
          >
            {label}
          </Text>
          <View style={styles.rowIcon}>{icon}</View>
        </>
      ) : (
        <>
          <View style={styles.rowIcon}>{icon}</View>
          <Text style={[styles.rowLabel, { color: labelColor }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomDrawerContent(props) {
  const { userProfile, guestMode, isDarkMode } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const isDrawerOpen = useDrawerStatus() === "open";
  const navigation = useNavigation();
  const { isArabic } = useI18n();
  const rtl = isArabic();

  // 👇 fetched directly from GetMyProfile, independent of context's userProfile
  const [profileNames, setProfileNames] = React.useState<{
    nameAr?: string;
    nameEn?: string;
  }>({});

  React.useEffect(() => {
    let isMounted = true;

    const fetchProfileNames = async () => {
      if (guestMode) return;

      try {
        const token = await handleGetToken();

        const response = await fetch(`${API_BASE_URL}/Profile/GetMyProfile`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error(
            "❌ GetMyProfile failed:",
            response.status,
            await response.text(),
          );
          return;
        }

        const data = await response.json();

        if (isMounted) {
          setProfileNames({
            nameAr: data?.nameAr ?? data?.result?.nameAr,
            nameEn: data?.nameEn ?? data?.result?.nameEn,
          });
        }
      } catch (error) {
        console.error("❌ Error fetching profile names:", error);
      }
    };

    if (isDrawerOpen) {
      fetchProfileNames();
    }

    return () => {
      isMounted = false;
    };
  }, [guestMode, isDrawerOpen]);

  const userName =
    (rtl ? profileNames.nameAr : profileNames.nameEn) || i18n.t("guest_user");
  const userInitial =
    (rtl
      ? profileNames.nameAr?.[0]
      : profileNames.nameEn?.[0]
    )?.toUpperCase() || "G";
  const isGuestMember = !guestMode && userProfile?.role !== "Guest";

  const iconSize = 22;

  const handlePressProfile = async () => {
    props.navigation.closeDrawer();

    const userType = await AsyncStorage.getItem("UserType");

    if (userType === "Guest") {
      const rootNavigation = navigation.getParent()?.getParent();

      rootNavigation?.dispatch(
        CommonActions.navigate({
          name: "Login",
        }),
      );
      return;
    }

    if (userType === "GymMember") {
      navigation.navigate(
        "MyProfileNavigator" as never,
        {
          screen: "MyProfileMain",
        } as never,
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient
        colors={["#103453ff", "#254764ff"]}
        style={styles.headerContainer}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.profileInfo}>
            <TouchableOpacity onPress={handlePressProfile}>
              {userProfile?.photoUri && !guestMode ? (
                <Image
                  source={{ uri: userProfile.photoUri }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.avatarText}>{userInitial}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={[styles.userName, rtl && styles.rtlText]}>
              {!guestMode ? userName : i18n.t("guest_user")}
            </Text>
            <Text style={[styles.userEmail, rtl && styles.rtlText]}>
              {userProfile?.email}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[
          styles.whiteSection,
          { backgroundColor: theme.scrollBg },
        ]}
      >
        {/* <DrawerRow
          rtl={rtl}
          label={i18n.t("home_tab_title")}
          labelColor={theme.ink}
          bgColor={theme.bg}
          icon={
            <MaterialCommunityIcons
              name="home-outline"
              color={theme.ink}
              size={iconSize}
            />
          }
          onPress={() => props.navigation.navigate("HomeTabs")}
        />

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("my_profile_title")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <Ionicons
                name="person-outline"
                size={iconSize}
                color={theme.ink}
              />
            }
            onPress={() => props.navigation.navigate("MyProfileNavigator")}
          />
        )} */}

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("monthly_schedule_title")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <MaterialCommunityIcons
                name="calendar-month-outline"
                color={theme.ink}
                size={iconSize}
              />
            }
            onPress={() => props.navigation.navigate("MonthlySchedule")}
          />
        )}

        <DrawerRow
          rtl={rtl}
          label={i18n.t("announcements_news_title")}
          labelColor={theme.ink}
          bgColor={theme.bg}
          icon={
            <MaterialCommunityIcons
              name="bullhorn-outline"
              color={theme.ink}
              size={iconSize}
            />
          }
          onPress={() => props.navigation.navigate("AnnouncementsNews")}
        />

        <DrawerRow
          rtl={rtl}
          label={i18n.t("offers_title")}
          labelColor={theme.ink}
          bgColor={theme.bg}
          icon={
            <MaterialCommunityIcons
              name="tag-outline"
              color={theme.ink}
              size={iconSize}
            />
          }
          onPress={() => props.navigation.navigate("Offers")}
        />

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("orders")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <Ionicons
                name="bag-check-outline"
                size={iconSize}
                color={theme.ink}
              />
            }
            onPress={() => props.navigation.navigate("Orders")}
          />
        )}

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("wallet_history_title")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <Ionicons
                name="wallet-outline"
                size={iconSize}
                color={theme.ink}
              />
            }
            onPress={() => props.navigation.navigate("WalletHistory")}
          />
        )}

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("Complaints_History")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <Ionicons
                name="alert-circle-outline"
                size={iconSize}
                color={theme.ink}
              />
            }
            onPress={() => props.navigation.navigate("ComplaintsHistory")}
          />
        )}

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("nutrition_plan_title")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <MaterialCommunityIcons
                name="food-apple-outline"
                color={theme.ink}
                size={iconSize}
              />
            }
            onPress={() => props.navigation.navigate("NutritionPlan")}
          />
        )}

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("my_progress_title")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <MaterialCommunityIcons
                name="chart-line"
                color={theme.ink}
                size={iconSize}
              />
            }
            onPress={() => props.navigation.navigate("MyProgress")}
          />
        )}

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("gym_info_title")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <MaterialCommunityIcons
                name="dumbbell"
                color={theme.ink}
                size={iconSize}
              />
            }
            onPress={() => props.navigation.navigate("GymInfo")}
          />
        )}

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("book_class_title")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <MaterialCommunityIcons
                name="book-open-outline"
                color={theme.ink}
                size={iconSize}
              />
            }
            onPress={() =>
              props.navigation.navigate(
                "BookClassDrawer" as never,
                {
                  screen: "BookClassMain",
                } as never,
              )
            }
          />
        )}

        {!guestMode && isGuestMember && (
          <DrawerRow
            rtl={rtl}
            label={i18n.t("personal_trainers")}
            labelColor={theme.ink}
            bgColor={theme.bg}
            icon={
              <MaterialCommunityIcons
                name="account-tie-outline"
                color={theme.ink}
                size={iconSize}
              />
            }
            onPress={() => props.navigation.navigate("PTNavigator")}
          />
        )}

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://useitsmart.com/")}
          >
            <Image
              source={require("../assets/images/SmartUseGifLogo.gif")}
              style={{ width: 200, height: 20, resizeMode: "cover" }}
            />
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { width: "100%" },
  safeArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 30,
  },
  profileInfo: { alignItems: "center", marginTop: 10 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: 10,
  },
  placeholderAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: { color: "#2A64F6", fontSize: 30, fontWeight: "bold" },
  userName: { color: "#fff", fontSize: 18, fontWeight: "600" },
  userEmail: { color: "#e0e0e0", fontSize: 13, marginTop: 3, marginBottom: 10 },
  rtlText: { textAlign: "right", writingDirection: "rtl" },
  whiteSection: { paddingTop: 8 },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: "100%",
  },
  rowIcon: { width: 28, alignItems: "center" },
  rowLabel: { flex: 1, fontSize: 16, marginHorizontal: 12 },
  rowLabelRTL: { textAlign: "right", writingDirection: "rtl" },
  footer: { padding: 15, borderTopWidth: 1, marginTop: 10 },
  footerText: { fontSize: 12, textAlign: "center" },
});
