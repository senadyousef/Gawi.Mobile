import * as React from "react";
import i18n from "../../localization";
import { IloginForm } from "../../types";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { useAppContext } from "../../context";
import { height, width } from "../../constants";
import { loginFormRules } from "../../formRules";
import Checkbox from "../../components/Checkbox";
import ErrorText from "../../components/ErrorText";
import { LinearGradient } from "expo-linear-gradient";
import { handleAuthenticateUser } from "../../api/auth";
import AuthInput from "../../components/Auth/AuthInput";
import ErrorMessage from "../../components/ErrorMessage";
import { useNavigation, CommonActions } from "@react-navigation/native";
import AuthButton from "../../components/Auth/AuthButton";
import {
  StyleSheet,
  Image,
  View as RNView,
  Alert,
  Platform,
  TouchableOpacity,
  FlatList,
  Pressable,
  Modal,
} from "react-native";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { jwtDecode } from "jwt-decode";

import {
  fetchSavedEmail,
  handleRememberMe,
  handleClearRememberMe,
  handleGetToken,
} from "../../helpers";
import {
  Text,
  View,
  KeyboardAvoidingView,
} from "../../components/overridedComponents";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IUserProfile } from "../../api/profile";

const LOCALE = "locale";

const languageOptions = [
  { key: "en", label: "English", flag: "🇺🇸" },
  { key: "ar", label: "العربية", flag: "🇸🇦" },
];

const LoginScreen = () => {
  const {
    control,
    setValue,
    handleSubmit,

    formState: { errors },
  } = useForm<IloginForm>();
  const { setUserProfile, setIsAuthenticated, userProfile, isAuthenticated } =
    useAppContext();
  const navigation = useNavigation();
  const { handleFetchUserProfile, setGuestMode } = useAppContext();
  const { isArabic } = useI18n();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isRememberMe, setIsRememberMe] = React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedLang, setSelectedLang] = React.useState(i18n.locale);
  const [finalStatus, SetfinalStatus] = React.useState();
  const [ProjectId, SetProjectId] = React.useState();
  const [Token, SetToken] = React.useState();
  const [isDevice, SetisDevice] = React.useState();
  // Force re-render after language change
  const [, setRender] = React.useState(false);

  // Load saved email & language
  React.useEffect(() => {
    (async () => {
      try {
        const email = await fetchSavedEmail();
        if (email) {
          setValue("email", email);
          setIsRememberMe(true);
        }
        const savedLang = await AsyncStorage.getItem(LOCALE);
        if (savedLang) {
          i18n.locale = savedLang;
          setSelectedLang(savedLang);
          setRender((prev) => !prev);
        }
      } catch (error) {
        console.warn("⚠️ Failed to load saved data:", error);
      }
    })();
  }, []);

  const handleAutoFill = () => {
    Alert.alert("Auto Fill", "Choose account", [
      {
        text: "GymMember@admin.com",
        onPress: () => {
          setValue("email", "GymMember@admin.com");
          setValue("password", "SmartUseAdmin");
        },
      },
      {
        text: "SmartUseAdminGym22@Admin.com",
        onPress: () => {
          setValue("email", "SmartUseAdminGym22@Admin.com");
          setValue("password", "SmartUseAdmin");
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const setLanguage = async (locale: string) => {
    i18n.locale = locale;
    await AsyncStorage.setItem(LOCALE, locale);
    setSelectedLang(locale);
    setRender((prev) => !prev);
    setIsModalVisible(false);
  };

  // LoginScreen.tsx - Remove all navigation logic
  const onSubmit: SubmitHandler<IloginForm> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      console.log("🔐 Starting login process...");

      // 1️⃣ Authenticate
      const authResponse = await handleAuthenticateUser(data);

      console.log("🧾 FULL authResponse:", authResponse);

      if (!authResponse?.token) {
        throw new Error("Token missing from auth response");
      }

      // 2️⃣ Decode JWT (SOURCE OF TRUTH)
      const decoded = jwtDecode<any>(authResponse.token);
      console.log("🟢 DECODED JWT:", decoded);

      // 3️⃣ Extract ASP.NET claims
      const email =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        ];

      const nameEn =
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];

      const role =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      const userId = Number(decoded.sub);

      console.log("👤 User:", { nameEn, email, role, userId });

      // 4️⃣ Determine PT
      const isPT = role === "PT";

      const currentRole = await AsyncStorage.getItem("UserRole");

      if (!currentRole) {
        await AsyncStorage.setItem("UserRole", isPT ? "PT" : "GymMember");
      }

      // 5️⃣ Build IUserProfile (FINAL)
      const userProfile: IUserProfile = {
        id: userId,
        email,
        nameEn,
        nameAr: "",
        role,
        phoneNumber: 0,
        photoUri: undefined,
        token: authResponse.token,
        refreshToken: authResponse.refreshToken,
        age: 0,
      };

      // 6️⃣ Save to context
      setUserProfile(userProfile);
      setIsAuthenticated(true);

      // 7️⃣ Remember me
      if (isRememberMe) {
        await handleRememberMe(email);
      }

      // 8️⃣ Navigate - Use a small delay to ensure context updates
      setTimeout(() => {
        const targetRoute = isPT ? "PTRoot" : "Root";

        // Get the root navigator from ref or navigation container
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: targetRoute }],
          }),
        );
      }, 100);

      // 9️⃣ Background tasks
      setTimeout(async () => {
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await fetch("https://gym.useitsmart.com/api/Notification", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authResponse.token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ PushToken: pushToken }),
            });
          }
        } catch (e) {
          console.warn("Background task error:", e);
        }
      }, 500);
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setErrorMessage(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;
    SetisDevice(Device.isDevice);
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert("Permission required", "Enable notifications in settings.");
        return;
      }
      SetfinalStatus(finalStatus);
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      SetProjectId(projectId);
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("✅ Expo Push Token:", token);
      console.log(
        "projectId:",
        Constants.expoConfig?.extra?.eas?.projectId,
        Constants.easConfig?.projectId,
      );

      SetToken(token);
      try {
        await AsyncStorage.setItem("expoPushToken", token);
        console.log("📌 Push token stored locally");
      } catch (error) {
        console.log("⚠️ Failed to store push token:", error);
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }
    }

    return token;
  }

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);

      setGuestMode(true);

      setTimeout(() => {
        const parentNavigation = navigation.getParent();
        parentNavigation?.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Root" }],
          }),
        );
      }, 0); // ⬅️ مهم جدًا
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ height }}>
      <View style={styles.container}>
        <Image
          style={styles.background}
          source={require("../../assets/images/auth-screens-image.png")}
        />
        <LinearGradient
          style={styles.gradient}
          colors={["transparent", Colors.backgroundBlue]}
        />

        {/* Language Button */}
        <View style={styles.languageButtonWrapper}>
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            style={styles.languageButton}
          >
            <Text style={styles.languageButtonText}>
              {selectedLang === "ar" ? "EN" : "ع"}
            </Text>
          </TouchableOpacity>
        </View>

        <Image
          style={styles.logo}
          source={require("../../assets/images/Gawi.png")}
        />
        {/* <View style={{backgroundColor:"#ff0000ff" , padding:30 , width:"100%"}}>
            <Text style={{color:"#fff"}}> {isDevice?"true":"false" }</Text>
            <Text style={{color:"#fff"}}> {finalStatus || "null"}</Text>
            <Text style={{color:"#fff"}}> {ProjectId || "null"}</Text>
            <Text style={{color:"#fff"}}> {Token || "null"}</Text>

          </View> */}
        <RNView
          style={[styles.wrapper, { direction: isArabic() ? "rtl" : "ltr" }]}
        >
          <ErrorMessage width={width - 50} message={errorMessage} />

          <RNView>
            <Controller
              name="email"
              control={control}
              rules={loginFormRules["email"]}
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  iconName="email-outline"
                  keyboardType="email-address"
                  placeholder={i18n.t("email_input_placeholder")}
                  textAlign={isArabic() ? "right" : "left"}
                />
              )}
            />
            {errors.email?.message && (
              <ErrorText>{errors.email.message}</ErrorText>
            )}
          </RNView>

          <RNView>
            <Controller
              name="password"
              control={control}
              rules={loginFormRules["password"]}
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType="default"
                  iconName="lock-outline"
                  placeholder={i18n.t("password_input_placeholder")}
                  textAlign={isArabic() ? "right" : "left"}
                  secureTextEntry={!isPasswordVisible}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                      <MaterialCommunityIcons
                        name={
                          !isPasswordVisible ? "eye-off-outline" : "eye-outline"
                        }
                        size={22}
                        color={Colors.gray}
                      />
                    </TouchableOpacity>
                  }
                />
              )}
            />
            {errors.password?.message && (
              <ErrorText>{errors.password.message}</ErrorText>
            )}
          </RNView>

          <RNView
            style={[
              styles.rememberMeWrapper,
              { flexDirection: isArabic() ? "row-reverse" : "row" },
            ]}
          >
            <Checkbox
              isChecked={isRememberMe}
              label={i18n.t("remember_me")}
              setIsChecked={setIsRememberMe}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate("ForgetPassword" as never)}
            >
              <Text style={styles.forgetPasswordText}>
                {i18n.t("forgot_password")}
              </Text>
            </TouchableOpacity>
          </RNView>
        </RNView>

        <TouchableOpacity
          onPress={handleAutoFill}
          style={styles.autoFillButton}
        >
          <Text style={styles.autoFillText}>Auto Fill Credentials</Text>
        </TouchableOpacity>

        <AuthButton
          isLoading={isLoading}
          style={{ width: width - 50 }}
          label={i18n.t("login_button")}
          onPress={handleSubmit(onSubmit)}
        />

        <TouchableOpacity
          disabled={isLoading}
          style={styles.guestButton}
          onPress={handleGuestLogin}
        >
          <Text style={styles.guestText}>{i18n.t("continue_as_guest")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={isLoading}
          style={styles.signUpButton}
          onPress={() => navigation.navigate("SignUp" as never)}
        >
          <Text style={styles.signUpText}>
            {i18n.t("signup_button") || "Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Language Modal */}
        <Modal transparent visible={isModalVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{i18n.t("choose_language")}</Text>
              <FlatList
                data={languageOptions}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => {
                  const isSelected = selectedLang === item.key;
                  return (
                    <Pressable
                      onPress={() => setLanguage(item.key)}
                      style={[
                        styles.option,
                        isSelected && styles.optionSelected,
                        { flexDirection: isArabic() ? "row-reverse" : "row" },
                      ]}
                    >
                      <Text style={styles.flag}>{item.flag}</Text>
                      <Text
                        style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={22}
                          color={Colors.primary}
                          style={{
                            marginLeft: isArabic() ? 0 : "auto",
                            marginRight: isArabic() ? "auto" : 0,
                          }}
                        />
                      )}
                    </Pressable>
                  );
                }}
              />

              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>{i18n.t("cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <StatusBar style="light" />
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

// Styles
const styles = StyleSheet.create({
  languageButtonWrapper: {
    width: width - 50,
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Platform.OS === "ios" ? 50 : 20,
    marginBottom: Platform.OS === "ios" ? 100 : 50,
    backgroundColor: "transparent",
  },
  languageButton: {
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  languageButtonText: {
    fontSize: 16,
    fontFamily: "SF-Medium",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: width - 60,
    backgroundColor: "#f0f8ff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "SF-Bold",
    marginBottom: 15,
    textAlign: "center",
    color: Colors.primary,
  },
  option: {
    padding: 12,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  optionSelected: { backgroundColor: "#cce0ff" },
  flag: { fontSize: 20, marginRight: 10 },
  optionLabel: { fontSize: 16 },
  optionLabelSelected: { fontWeight: "bold", color: Colors.primary },
  cancelButton: { marginTop: 15, padding: 12, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "600", color: Colors.primary },

  signUpButton: { alignItems: "center", marginBottom: 30 },
  signUpText: { fontSize: 16, color: Colors.white, fontFamily: "SF-Medium" },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 25,
    backgroundColor: Colors.backgroundBlue,
  },
  background: { width, height, position: "absolute", resizeMode: "cover" },
  gradient: { width, height, position: "absolute" },
  logo: {
    width: width * 0.7,
    height: height * 0.3,
    resizeMode: "contain",
    marginBottom: 40,
  },
  wrapper: { width: "100%", alignItems: "center", gap: 16, marginBottom: 20 },
  forgetPasswordText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: "SF-Medium",
  },
  rememberMeWrapper: {
    width: width - 50,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  autoFillButton: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  autoFillText: { color: Colors.white, fontFamily: "SF-Medium", fontSize: 15 },
  guestButton: { marginTop: 25, alignItems: "center", marginBottom: 30 },
  guestText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: "SF-Medium",
    textDecorationLine: "underline",
  },
});
