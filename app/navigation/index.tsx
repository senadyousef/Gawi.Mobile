import * as React from "react";
import { ColorSchemeName, I18nManager, Platform } from "react-native";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// ✅ App Context & Localization
import { useAppContext } from "../context";
import i18n from "../localization";
import Colors from "../constants/Colors";

// ✅ Components
import CustomHeader from "../components/CustomHeader";
import CustomDrawerContent from "../components/CustomDrawerContent";

// ✅ Screens
import {
  LoginScreen,
  GetStartedScreen,
  ResetPasswordScreen,
  ForgetPasswordScreen,
  VerificationCodeScreen,
} from "../screens/AuthScreens";

import {
  HomeScreen,
  MenuScreen,
  StoresScreen,
  CalendarScreen,
} from "../screens/BottomTabScreens";

import CartScreen from "../screens/CartScreen";
import StoreScreen from "../screens/StoreScreen";
import GalleryScreen from "../screens/GalleryScreen";
import ClassesScreen from "../screens/ClassesScreen";
import NotFoundScreen from "../screens/NotFoundScreen";
import GymStoreScreen from "../screens/GymStoreScreen";
import MyBookingScreen from "../screens/MyBookingScreen";
import LatestNewsScreen from "../screens/LatestNewsScreen";
import StoreItemsScreen from "../screens/StoreItemsScreen";
import EventDetailsScreen from "../screens/EventDetailsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ManageAccountScreen from "../screens/ManageAccountScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import SuccessfulActionScreen from "../screens/SuccessfulActionScreen";
import LatestNewsDetailsScreen from "../screens/LatestNewsDetailsScreen";
import MyProfileScreen from "../screens/MyProfile";
import MonthlyScheduleScreen from "../screens/MonthlySchedule";
import ReportsScreen from "../screens/reportsScreen";
import AnnouncementsNewsScreen from "../screens/AnnouncementsNewsScreen";
import OffersScreen from "../screens/OffersScreen";
import NutritionPlanScreen from "../screens/NutritionPlanScreen";
import ReelsScreen from "../screens/ReelsScreen";
import NewsDetailsScreen from "../screens/NewsDetailsScreen";
import MyProgressScreen from "../screens/MyProgressScreen";
import AttendanceHistoryScreen from "../components/AttendenceAndDeparture/AttendanceHistoryScreen";
import OfferDetailsScreen from "../screens/OfferDetailsScreen";

// ✅ Types
import {
  RootTabParamList,
  RootStackParamList,
  RootTabScreenProps,
} from "../types";
import GymInfoScreen from "../screens/GymInfoScreen";
import PaymentScreen from "../screens/PaymentScreen";
import QRCodeScreen from "../screens/QRCodeScreen";
import BookClassScreen from "../screens/BookClassScreen";
import ClassDetailsScreen from "../screens/ClassDetailsScreen";
import PTListScreen from "../screens/PTListScreen";
import PTDetailsScreen from "../screens/PTDetailsScreen";
import BookPTScreen from "../screens/BookPTScreen";
import ChatListScreen from "../screens/ChatListScreen";
import PrivateChatScreen from "../screens/PrivateChatScreen";
import NotificationDetailScreen from "../screens/NotificationDetailScreen";
import SignUpScreen from "../screens/AuthScreens/signUpScreen";
import OrdersScreen from "../screens/orders";
import PTDashboardScreen from "../screens/PTDashboardScreen";
import NutritionPlanScreenAdmin from "../screens/NutritionPlanScreenAdmin";
import NutritionPlanScreenPt from "../screens/NutritionPlanScreenPt";
import MuselsePlanPtList from "../screens/MuselsePlanPtList";
import { navigationRef } from "../context/RootNavigation";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import MenuPtScreen from "../screens/MenuPtScreen";
import { useI18n } from "../hooks/useI18n";
import VerifyCodeScreen from "../screens/AuthScreens/VerificationCodeScreen";
import SplashScreen from "../screens/SplashScreen";
import WalletHistoryScreen from "../screens/WalletHistoryScreen";
import ComplaintScreen from "../screens/Complaintscreen";
import ComplaintHistoryScreen from "../screens/Mycomplaintsscreen";

// ✅ Navigation Creators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();
const BottomTab = createBottomTabNavigator<RootTabParamList>();

// -------------------------------------------------------------
// ✅ Attendance Stack
function AttendanceNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AttendanceHistory"
        component={AttendanceHistoryScreen}
        options={({ navigation }) => ({
          title: i18n.t("attendance_history") || "Attendance History",
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs" as never)
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

// ✅ My Profile Navigator
function MyProfileNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MyProfileMain"
        component={MyProfileScreen}
        options={({ navigation }) => ({
          title: i18n.t("my_profile_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
function GymInfoNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GymInfoMain"
        component={GymInfoScreen}
        options={({ navigation }) => ({
          title: i18n.t("gym_info_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
function QRCodeNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="QRCodeMain"
        component={QRCodeScreen}
        options={({ navigation }) => ({
          title: i18n.t("qr_code_title"), // localized title
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={
                () =>
                  navigation.canGoBack()
                    ? navigation.goBack()
                    : navigation.navigate("HomeTabs") // fallback to home
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
// ✅ Monthly Schedule
function MonthlyScheduleNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MonthlyScheduleMain"
        component={MonthlyScheduleScreen}
        options={({ navigation }) => ({
          title: i18n.t("monthly_schedule_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
function BookClassNavigator() {
  return (
    <Stack.Navigator>
      {/* 🔹 Book Class Main Screen */}
      <Stack.Screen
        name="BookClassMain"
        component={BookClassScreen}
        options={({ navigation }) => ({
          title: i18n.t("book_class_title"), // localization key
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow={true}
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />

      {/* 🔹 Class Details Screen */}
      <Stack.Screen
        name="ClassDetails"
        component={ClassDetailsScreen}
        options={({ navigation }) => ({
          title: i18n.t("class_details_title"), // localization key
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("BookClassMain")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
// ✅ Reports
function ReportsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReportsMain"
        component={ReportsScreen}
        options={({ navigation }) => ({
          title: i18n.t("reports_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
function PTNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="PTList"
        component={PTListScreen}
        options={({ navigation }) => ({
          title: i18n.t("personal_trainers"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
      <Stack.Screen
        name="PTDetails"
        component={PTDetailsScreen}
        options={({ navigation }) => ({
          title: i18n.t("pt_details"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() => navigation.goBack()}
            />
          ),
        })}
      />
      <Stack.Screen
        name="BookPT"
        component={BookPTScreen}
        options={({ navigation }) => ({
          title: i18n.t("book_pt"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() => navigation.goBack()}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
// ✅ Announcements
function AnnouncementsNewsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AnnouncementsNewsMain"
        component={AnnouncementsNewsScreen}
        options={({ navigation }) => ({
          title: i18n.t("announcements_news_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

// ✅ Offers
function OffersNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="OffersMain"
        component={OffersScreen}
        options={({ navigation }) => ({
          title: i18n.t("offers_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
function ChatNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={({ navigation }) => ({
          title: i18n.t("chat"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() => navigation.goBack()}
            />
          ),
        })}
      />
      <Stack.Screen
        name="PrivateChat"
        component={PrivateChatScreen}
        options={({ navigation }) => ({
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() => navigation.goBack()}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
// ✅ Nutrition Plan
function NutritionPlanNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="NutritionPlanMain"
        component={NutritionPlanScreen}
        options={({ navigation }) => ({
          title: i18n.t("nutrition_plan_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

// ✅ Reels
function ReelsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReelsMain"
        component={ReelsScreen}
        options={({ navigation }) => ({
          title: i18n.t("reels_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
// ✅ PT Dashboard Navigator
function PTDashboardNavigator() {
  return (
    <Stack.Navigator>
      {/* 🔹 PT Dashboard Main Screen */}
      <Stack.Screen
        name="PTDashboardMain"
        component={PTDashboardScreen} // <-- your PT dashboard screen
        options={({ navigation }) => ({
          title: i18n.t("pt_dashboard_title") || "PT Dashboard",
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow={false} // no back arrow on main dashboard
            />
          ),
        })}
      />
      <Stack.Screen
        name="NutritionPlan"
        component={NutritionPlanScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
const Tab = createBottomTabNavigator();

function PTDashboardTabs() {
  const { isArabic, getDirection } = useI18n();
  const isAr = isArabic();

  const labels = isAr
    ? {
        PTDashboard: "المدربون",
        AddPlan: "إضافة خطة",
        PlanPtList: "قائمة الخطط",
        MuselsePlan: "التمارين",
        Menu: "القائمة",
      }
    : {
        PTDashboard: "Trainers",
        AddPlan: "Add Plan",
        PlanPtList: "Plans List",
        MuselsePlan: "Exercises",
        Menu: "Menu",
      };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "PTDashboard") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "AddPlan") {
            iconName = focused ? "nutrition" : "nutrition-outline";
          } else if (route.name === "PlanPtList") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "MuselsePlan") {
            iconName = focused ? "barbell" : "barbell-outline";
          } else if (route.name === "Menu") {
            iconName = focused ? "menu" : "menu-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        tabBarLabel: labels[route.name as keyof typeof labels] ?? route.name,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
      })}
    >
      <Tab.Screen name="PTDashboard" component={PTDashboardScreen} />
      <Tab.Screen name="AddPlan" component={NutritionPlanScreenAdmin} />
      <Tab.Screen name="PlanPtList" component={NutritionPlanScreenPt} />
      <Tab.Screen name="MuselsePlan" component={MuselsePlanPtList} />
      <Tab.Screen name="Menu" component={MenuPtScreen} />
    </Tab.Navigator>
  );
}
// ✅ My Progress
function MyProgressNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MyProgressMain"
        component={MyProgressScreen}
        options={({ navigation }) => ({
          title: i18n.t("my_progress_title") || "My Progress",
          header: (params) => (
            <CustomHeader
              params={params}
              shouldShowBackArrow
              onBackPress={() =>
                navigation.canGoBack()
                  ? navigation.goBack()
                  : navigation.navigate("HomeTabs")
              }
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

// ✅ Bottom Tabs
export function BottomTabNavigator() {
  const navigation = useNavigation();
  const { totalCartItems, guestMode, userProfile, isDarkMode } =
    useAppContext();
  const { isArabic: isArabicFn } = useI18n(); // ← registers re-render listener

  const currentLang = i18n.locale || "en";
  const isRTL = isArabicFn(); // ← replaces `currentLang === "ar"`
  const isGuestMember = !guestMode && userProfile?.role !== "Guest";
  const insets = useSafeAreaInsets();

  const tabBarBg = isDarkMode ? "#1E1E1E" : "#ffffff";
  const tabBarBorder = isDarkMode ? "#2C2C2C" : "#e0e0e0";
  const tabBarActive = isDarkMode ? "#ff7002" : Colors.primary;
  const tabBarInactive = isDarkMode ? "#888888" : Colors.gray;

  const tabs = [
    {
      name: "Home",
      component: HomeScreen,
      options: {
        title: i18n.t("home_tab_title"),
        headerShown: false,
        tabBarIcon: ({ color }) => (
          <TabBarIcon name="home-outline" color={color} />
        ),
      },
    },
    {
      name: "Calendar",
      component: CalendarScreen,
      options: {
        title: i18n.t("calendar_tab_title"),
        header: (params) => (
          <CustomHeader params={params} isShadowVisible={false} />
        ),
        tabBarIcon: ({ color }) => (
          <TabBarIcon name="calendar-month-outline" color={color} />
        ),
      },
    },
    {
      name: "stores",
      component: StoresScreen,
      options: ({ navigation }) => {
        const {
          isAuthenticated,
          guestMode,
          totalCartItems,
          setGuestMode,
          setIsAuthenticated,
        } = useAppContext();

        return {
          title: i18n.t("shop_tab_title"),
          header: (params) => (
            <CustomHeader
              params={params}
              icons={[
                {
                  name: "cart-outline",
                  badge: totalCartItems,
                  onPress: () => {
                    if (isAuthenticated) {
                      navigation.navigate("cart");
                    } else {
                      setGuestMode(false);
                      setIsAuthenticated(false);
                      setTimeout(() => {
                        const rootNav = navigation.getParent()?.getParent();
                        rootNav?.navigate("SignUp");
                      }, 200);
                    }
                  },
                },
                {
                  name: "bell-outline",
                  onPress: () => navigation.navigate("notifications"),
                },
              ]}
            />
          ),
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="storefront-outline" color={color} />
          ),
        };
      },
    },

    !guestMode &&
      isGuestMember && {
        name: "HistoryAttendance",
        component: AttendanceHistoryScreen,
        options: {
          title: i18n.t("AttendanceHistory"),
          header: (params) => <CustomHeader params={params} />,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="history" color={color} />
          ),
        },
      },

    {
      name: "Menu",
      component: MenuScreen,
      options: {
        title: i18n.t("menu_tab_title"),
        header: (params) => <CustomHeader params={params} />,
        tabBarIcon: ({ color }) => (
          <TabBarIcon name="dots-horizontal" color={color} />
        ),
      },
    },
  ].filter(Boolean);

  const orderedTabs = isRTL ? [...tabs].reverse() : tabs;

  const sharedScreenOptions = {
    tabBarActiveTintColor: tabBarActive,
    tabBarInactiveTintColor: tabBarInactive,
    tabBarStyle: {
      height: 60,
      paddingBottom: 10,
      backgroundColor: tabBarBg,
      borderTopColor: tabBarBorder,
      borderTopWidth: 0.5,
    },
  };

  return Platform.OS === "android" ? (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: tabBarBg }}
      edges={["bottom"]}
    >
      <BottomTab.Navigator
        initialRouteName="Home"
        screenOptions={sharedScreenOptions}
      >
        {orderedTabs.map((tab) => (
          <BottomTab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={tab.options}
          />
        ))}
      </BottomTab.Navigator>
    </SafeAreaView>
  ) : (
    <BottomTab.Navigator
      initialRouteName="Home"
      screenOptions={sharedScreenOptions}
    >
      {orderedTabs.map((tab) => (
        <BottomTab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={tab.options}
        />
      ))}
    </BottomTab.Navigator>
  );
}

// ✅ Drawer Navigator
// ✅ Drawer Navigator
function DrawerNavigator() {
  const isArabic = i18n.locale?.startsWith("ar") || I18nManager.isRTL === true;
  const { guestMode, isDarkMode } = useAppContext(); // 👈 pull isDarkMode

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: Colors.primary,
        drawerInactiveTintColor: isDarkMode ? "#888888" : Colors.gray, // 👈
        drawerStyle: {
          backgroundColor: isDarkMode ? "#1E1E1E" : "#fff", // 👈
          width: 250,
        },
        drawerLabelStyle: {
          color: isDarkMode ? "#080707" : Colors.secondary, // 👈
        },
        drawerPosition: isArabic ? "right" : "left",
      }}
    >
      <Drawer.Screen
        name="HomeTabs"
        component={BottomTabNavigator}
        options={{ title: i18n.t("home_tab_title") }}
      />
      <Drawer.Screen
        name="MyProfileNavigator"
        component={MyProfileNavigator}
        options={{ title: i18n.t("my_profile_title") }}
      />
      <Drawer.Screen
        name="MonthlySchedule"
        component={MonthlyScheduleNavigator}
        options={{ title: i18n.t("monthly_schedule_title") }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsNavigator}
        options={{ title: i18n.t("reports_title") }}
      />
      <Drawer.Screen
        name="AnnouncementsNews"
        component={AnnouncementsNewsNavigator}
        options={{ title: i18n.t("announcements_news_title") }}
      />
      <Drawer.Screen
        name="Offers"
        component={OffersNavigator}
        options={{ title: i18n.t("offers_title") }}
      />
      <Drawer.Screen
        name="NutritionPlan"
        component={NutritionPlanNavigator}
        options={{ title: i18n.t("nutrition_plan_title") }}
      />
      <Drawer.Screen
        name="Reels"
        component={ReelsNavigator}
        options={{ title: i18n.t("reels_title") }}
      />
      <Drawer.Screen
        name="MyProgress"
        component={MyProgressNavigator}
        options={{
          title: i18n.t("my_progress_title"),
          drawerIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="GymInfo"
        component={GymInfoNavigator}
        options={{
          title: i18n.t("gym_info_title"),
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dumbbell" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="QRCode"
        component={QRCodeNavigator}
        options={{
          title: i18n.t("qr_code_title"),
          drawerIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="qrcode-scan"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="BookClassDrawer"
        component={BookClassNavigator}
        options={{ title: i18n.t("book_class_title") }}
      />
      <Drawer.Screen
        name="PTNavigator"
        component={PTNavigator}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="Chat"
        component={ChatNavigator}
        options={{ drawerLabel: "Chat" }}
      />
    </Drawer.Navigator>
  );
}

// ✅ Root Stack
function RootNavigator({ isFirstTime }: { isFirstTime: boolean }) {
  const { navigate } = useNavigation();
  const {
    totalCartItems,
    isAuthenticated,
    guestMode,
    userType,
    isInitializing,
  } = useAppContext();
  if (isInitializing) {
    return (
      <SplashScreen
        setIsAnimationFinished={function (
          value: React.SetStateAction<boolean>,
        ): void {
          throw new Error("Function not implemented.");
        }}
      />
    );
  }
  // Determine initial route based on authentication and user type
  const getInitialRouteName = () => {
    if (!isAuthenticated && !guestMode) {
      return "Login";
    }

    return userType === "PT" ? "PTRoot" : "Root";
  };

  return (
    <Stack.Navigator initialRouteName={getInitialRouteName()}>
      {/* 🔐 Authentication Flow (only if not logged in and not guest) */}
      {!isAuthenticated && !guestMode ? (
        <>
          {/* Always define all auth screens, just change the initial route */}
          <Stack.Screen
            name="GetStarted"
            component={GetStartedScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ForgetPassword"
            component={ForgetPasswordScreen}
            options={{
              title: i18n.t("forgot_password_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
          <Stack.Screen
            name="VerifyCode"
            component={VerificationCodeScreen}
            options={{
              title: i18n.t("code_verification_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{
              title: i18n.t("reset_password_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
        </>
      ) : (
        <>
          {/* ✅ Main Drawer (Available for Authenticated or Guest) */}
          <Stack.Screen
            name="Root"
            component={DrawerNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PTRoot"
            component={PTDashboardTabs}
            options={{ headerShown: false }}
          />

          {/* ✅ Common Screens: Accessible to both Auth and Guest */}
          <Stack.Screen
            name="gallery"
            component={GalleryScreen}
            options={{
              title: i18n.t("gallery_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
          <Stack.Screen
            name="classes"
            component={ClassesScreen}
            options={{
              title: i18n.t("class_details_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />

          <Stack.Screen
            name="gymStoreScreen"
            component={GymStoreScreen}
            options={{
              title: i18n.t("gym_store_title"),
              header: (params) => (
                <CustomHeader
                  params={params}
                  shouldShowBackArrow
                  icons={[
                    {
                      name: "cart-outline",
                      badge: totalCartItems,
                      onPress: () => {
                        if (guestMode) {
                          navigate("Login");
                        } else {
                          navigate("cart");
                        }
                      },
                    },
                    {
                      name: "bell-outline",
                      onPress: () => navigate("notifications"),
                    },
                  ]}
                />
              ),
            }}
          />

          <Stack.Screen
            name="storeScreen"
            component={StoreScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="storeItemsScreen"
            component={StoreItemsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="productDetails"
            component={ProductDetailsScreen}
            options={{
              header: (params) => (
                <CustomHeader
                  params={params}
                  shouldShowBackArrow
                  icons={[
                    {
                      name: "cart-outline",
                      badge: totalCartItems,
                      onPress: () => {
                        if (guestMode) {
                          navigate("Login");
                        } else {
                          navigate("cart");
                        }
                      },
                    },
                  ]}
                />
              ),
            }}
          />

          {/* 📰 Public/Guest Accessible Pages */}
          <Stack.Screen
            name="latestNews"
            component={LatestNewsScreen}
            options={{
              title: i18n.t("latest_news_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
          <Stack.Screen
            name="latestNewsDetails"
            component={LatestNewsDetailsScreen}
            options={{
              title: i18n.t("latest_news_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
          <Stack.Screen
            name="NewsDetails"
            component={NewsDetailsScreen}
            options={{
              title: i18n.t("details"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
          <Stack.Screen
            name="OfferDetails"
            component={OfferDetailsScreen}
            options={{
              title: i18n.t("details"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
          <Stack.Screen
            name="eventDetails"
            component={EventDetailsScreen}
            options={{ headerShown: false }}
          />

          {/* ⚠️ Authenticated-Only Screens (hidden in Guest Mode) */}
          {!guestMode && (
            <>
              <Stack.Screen
                name="myBooking"
                component={MyBookingScreen}
                options={{
                  title: i18n.t("my_booking_title"),
                  header: (params) => (
                    <CustomHeader params={params} shouldShowBackArrow />
                  ),
                }}
              />
              <Stack.Screen
                name="manageMyAccount"
                component={ManageAccountScreen}
                options={{
                  title: i18n.t("manage_account_title"),
                  header: (params) => (
                    <CustomHeader params={params} shouldShowBackArrow />
                  ),
                }}
              />
              <Stack.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                  title: i18n.t("Orders"),
                  header: (params) => (
                    <CustomHeader params={params} shouldShowBackArrow />
                  ),
                }}
              />
              <Stack.Screen
                name="WalletHistory"
                component={WalletHistoryScreen}
                options={{
                  title: i18n.t("wallet_history_title") || "Wallet History",
                  header: (params) => (
                    <CustomHeader params={params} shouldShowBackArrow />
                  ),
                }}
              />
              <Stack.Screen
                name="Complaints"
                component={ComplaintScreen}
                options={{
                  title: i18n.t("Complaints") || "Wallet History",
                  header: (params) => (
                    <CustomHeader params={params} shouldShowBackArrow />
                  ),
                }}
              />
              <Stack.Screen
                name="ComplaintsHistory"
                component={ComplaintHistoryScreen}
                options={{
                  title: i18n.t("Complaints_History") || "Complaints History",
                  header: (params) => (
                    <CustomHeader params={params} shouldShowBackArrow />
                  ),
                }}
              />
              <Stack.Screen
                name="AttendanceStack"
                component={AttendanceNavigator}
                options={{ headerShown: false }}
              />
            </>
          )}

          {/* ✅ Common (Success / Notifications / Cart) */}
          <Stack.Screen
            name="successfulAction"
            component={SuccessfulActionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="notifications"
            component={NotificationsScreen}
            options={{
              title: i18n.t("notifications_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />
          <Stack.Screen
            name="NotificationDetail"
            component={NotificationDetailScreen}
            options={{ title: "Notification Details" }}
          />
          <Stack.Screen
            name="cart"
            component={CartScreen}
            options={{
              title: i18n.t("cart_title"),
              header: (params) => (
                <CustomHeader params={params} shouldShowBackArrow />
              ),
            }}
          />

          <Stack.Screen
            name="PaymentScreen"
            component={PaymentScreen}
            options={{ title: "Credit Card Payment" }}
          />
          <Stack.Screen
            name="NotFound"
            component={NotFoundScreen}
            options={{ title: "Oops!" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function Navigation({
  isFirstTime,
  colorScheme,
}: {
  isFirstTime: boolean;
  colorScheme: ColorSchemeName;
}) {
  const { isDarkMode } = useAppContext(); // 👈 pull isDarkMode

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={isDarkMode ? DarkTheme : DefaultTheme} // 👈 use isDarkMode instead of colorScheme
    >
      <RootNavigator isFirstTime={isFirstTime} />
    </NavigationContainer>
  );
}

// ✅ Tab Bar Icon
function TabBarIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
}) {
  return (
    <MaterialCommunityIcons size={30} style={{ marginBottom: -3 }} {...props} />
  );
}
