import * as React from "react";
import { greet, handleGetLocalizedField, handleGetToken } from "../../helpers";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { useAppContext } from "../../context";
import IconsContainer from "../IconsContainer";
import AttendanceAndDepartureModal from "../AttendenceAndDeparture";
import { Text, View } from "../overridedComponents";
import {
  useNavigation,
  DrawerActions,
  useFocusEffect,
} from "@react-navigation/native";
import {
  Image,
  StyleSheet,
  View as RNView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  width,
  statusBarHeight,
  HOMESCREEN_HEADER_headerBodyHeight,
  HOMESCREEN_HEADER_paddingHorizontal,
} from "../../constants";
import i18n from "../../localization";

const API_BASE_URL = "https://gym.useitsmart.com/api";

const Header: React.FC = () => {
  const { getDirection } = useI18n();
  const navigation = useNavigation();
  const {
    totalCartItems,
    userProfile,
    guestMode,
    setGuestMode,
    isAuthenticated,
    setIsAuthenticated,
  } = useAppContext();
  const [isGuest, setIsGuest] = React.useState(true);
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] =
    React.useState(false);

  // 👇 fetched directly from GetMyProfile, independent of context's userProfile
  const [profileNames, setProfileNames] = React.useState<{
    nameAr?: string;
    nameEn?: string;
  }>({});

  // Re-fetch profile names every time the Home screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
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

      fetchProfileNames();

      return () => {
        isMounted = false;
      };
    }, [guestMode]),
  );

  const isGuestMember = !guestMode && userProfile?.role !== "Guest";
  // Sync guest status from AsyncStorage
  React.useEffect(() => {
    const syncGuestStatus = async () => {
      const memberId = (await AsyncStorage.getItem("MemberId")) || "0";
      const guest = memberId === "0";
      setGuestMode(guest);
    };
    syncGuestStatus();
  }, []);

  // Handle navigation when guest mode is disabled
  React.useEffect(() => {
    if (!guestMode && !isAuthenticated) {
      const rootNav = navigation.getParent()?.getParent();
      rootNav?.navigate("SignUp");
    }
  }, [guestMode, isAuthenticated]);

  const directionStyle = getDirection();

  return (
    <View style={styles.header}>
      {/* Background layers */}
      <View style={[styles.backgroundColor, styles.background]} />
      <Image
        style={styles.background}
        source={require("../../assets/images/homeScreenImage.png")}
      />

      {/* Header Body */}
      <RNView style={[styles.headerBody, directionStyle]}>
        {/* Left Section: Menu + User Info */}
        <RNView style={[styles.leftSection, directionStyle]}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={[
              styles.menuButton,
              {
                marginRight: directionStyle.flexDirection === "row" ? 10 : 0,
                marginLeft:
                  directionStyle.flexDirection === "row-reverse" ? 10 : 0,
              },
            ]}
          >
            <Ionicons name="menu-outline" size={26} color={Colors.white} />
          </TouchableOpacity>

          <RNView>
            <Text style={[styles.greetingText, guestMode && { marginTop: 20 }]}>
              {greet()}
            </Text>
            <Text style={styles.usernameText}>
              <Text style={styles.usernameText}>
                {i18n.locale?.startsWith("ar")
                  ? profileNames.nameAr
                  : profileNames.nameEn}
              </Text>{" "}
            </Text>{" "}
          </RNView>
        </RNView>

        {/* Right Section: Icons */}
        <IconsContainer
          isHomeScreen
          icons={[
            !guestMode &&
              isGuestMember && {
                name: "qrcode-scan",
                onPress: () => setIsAttendanceModalVisible(true),
              },
            {
              name: "cart-outline",
              badge: totalCartItems,
              onPress: () => {
                if (!guestMode) {
                  navigation.navigate("cart");
                } else {
                  setGuestMode(false);
                  setIsAuthenticated(false);
                }
              },
            },
            {
              name: "bell-outline",
              onPress: () => navigation.navigate("notifications"),
            },
          ].filter(Boolean)}
        />
      </RNView>

      {/* Attendance Modal */}
      <AttendanceAndDepartureModal
        isVisible={isAttendanceModalVisible}
        handleClose={() => setIsAttendanceModalVisible(false)}
      />
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    width,
    height: 175,
    paddingTop: statusBarHeight,
  },
  background: {
    width,
    height: 175,
    position: "absolute",
  },
  backgroundColor: {
    backgroundColor: Colors.backgroundBlue,
  },
  headerBody: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    height: HOMESCREEN_HEADER_headerBodyHeight,
    paddingHorizontal: HOMESCREEN_HEADER_paddingHorizontal,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    padding: 4,
  },
  greetingText: {
    fontSize: 12,
    color: Colors.tertiary,
    fontFamily: "SF-Regular",
  },
  usernameText: {
    color: Colors.white,
    fontFamily: "SF-Semibold",
  },
});
