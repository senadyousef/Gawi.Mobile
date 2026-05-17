import * as React from "react";
import { greet, handleGetLocalizedField } from "../../helpers";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { useAppContext } from "../../context";
import IconsContainer from "../IconsContainer";
import AttendanceAndDepartureModal from "../AttendenceAndDeparture";
import { Text, View } from "../overridedComponents";
import { useNavigation, DrawerActions } from "@react-navigation/native";
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
            <Text style={styles.usernameText}>{userProfile?.nameEn}</Text>
          </RNView>
        </RNView>

        {/* Right Section: Icons */}
        <IconsContainer
          isHomeScreen
          icons={[
            !guestMode &&isGuestMember&&
              {
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
