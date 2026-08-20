import * as React from "react";
import i18n from "../../localization";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Image, View as RNView, Platform } from "react-native";
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from "../../components/overridedComponents";
import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";
import ErrorMessage from "../../components/ErrorMessage";
import ErrorText from "../../components/ErrorText";
import { height, width } from "../../constants";
import { useAppContext } from "../../context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Dropdown } from "react-native-element-dropdown";
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, {
  SweetAlertButton,
  SweetAlertType,
} from "../../components/SweetAlert";

interface ISignUpForm {
  nameAr: string;
  nameEn: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: "Male" | "Female";
}

const DEFAULT_NAME_EN = "player";
const DEFAULT_NAME_AR = "لاعب";

const SignUpScreen = () => {
  const navigation = useNavigation();
  const { isArabic } = useI18n();
  const { setGuestMode } = useAppContext();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);

  // 👇 SweetAlert state — replaces Alert.alert entirely
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    type: SweetAlertType;
    title: string;
    message?: string;
    buttons?: SweetAlertButton[];
  }>({ visible: false, type: "info", title: "" });

  const showAlert = (
    type: SweetAlertType,
    title: string,
    message?: string,
    buttons?: SweetAlertButton[],
  ) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };

  const hideAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ISignUpForm>();

  const password = watch("password");

  const getSignUpErrorMessage = (status: number, rawText: string) => {
    const lower = rawText.toLowerCase();
    const isDuplicatePhone =
      lower.includes("phone number already exists") ||
      lower.includes("phonenumber already exists") ||
      lower.includes("ix_users_phonenumber");

    if (isDuplicatePhone) {
      return i18n.t("errors.phone_taken", {
        defaultValue:
          "This phone number is already registered. Please sign in or use a different number.",
      });
    }
    const isDuplicateEmail =
      status === 409 ||
      lower.includes("ix_users_email") ||
      lower.includes("duplicate key") ||
      lower.includes("duplicate key row") ||
      lower.includes("email already exists.");

    if (isDuplicateEmail) {
      return i18n.t("errors.email_taken", {
        defaultValue:
          "This email is already registered. Please sign in or use a different email.",
      });
    }

    return i18n.t("errors.signup_failed", {
      defaultValue: "Something went wrong. Please try again.",
    });
  };

  const onSubmit: SubmitHandler<ISignUpForm> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const nameAr = data.nameAr?.trim() || DEFAULT_NAME_AR;
      const nameEn = data.nameEn?.trim() || DEFAULT_NAME_EN;

      const payload = {
        id: 0,
        email: data.email,
        nameAr,
        nameEn,
        phoneNumber: data.phoneNumber,
        password: data.password,
        role: "Guest",
        gender: data.gender,
        photoUrl: "",
      };

      console.log("📦 Sending payload:", payload);

      const response = await fetch("https://gawifit.com/api/User/signUp", {
        method: "POST",
        headers: {
          accept: "text/plain",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showAlert("success", "Success", "Account created successfully!", [
          {
            text: "OK",
            style: "primary",
            onPress: () => navigation.navigate("Login" as never),
          },
        ]);
      } else {
        const rawText = await response.text();
        console.log(rawText);

        const message = getSignUpErrorMessage(response.status, rawText);
        setErrorMessage(message);
        showAlert(
          "error",
          i18n.t("errors.registration_failed", {
            defaultValue: "Registration Failed",
          }),
          message,
        );
      }
    } catch (error: any) {
      const message = i18n.t("errors.network_error", {
        defaultValue:
          "Network error. Please check your connection and try again.",
      });
      setErrorMessage(message);
      showAlert("error", "Error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestMode(true);
    const parentNav = navigation.getParent();
    parentNav?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Root" }],
      }),
    );
  };

  return (
    <View style={styles.root}>
      {/* 👇 background stays fixed behind everything — sized to the device screen */}
      <Image
        style={styles.background}
        source={require("../../assets/images/auth-screens-image.png")}
      />
      <LinearGradient
        style={styles.gradient}
        colors={["transparent", Colors.backgroundBlue]}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            style={styles.logo}
            source={require("../../assets/images/MuscleUpLogoColored.png")}
          />

          <RNView
            style={[styles.wrapper, { direction: isArabic() ? "rtl" : "ltr" }]}
          >
            <ErrorMessage width={width - 50} message={errorMessage} />

            <RNView style={{ width: "100%" }}>
              <Controller
                name="nameAr"
                control={control}
                rules={{}}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    iconName="account-outline"
                    placeholder={i18n.t("name_ar")}
                    textAlign={isArabic() ? "right" : "left"}
                  />
                )}
              />
              {errors.nameAr?.message && (
                <ErrorText>{errors.nameAr.message}</ErrorText>
              )}
            </RNView>

            <RNView>
              <Controller
                name="nameEn"
                control={control}
                rules={{}}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    iconName="account-outline"
                    placeholder={i18n.t("name_en")}
                    textAlign={isArabic() ? "right" : "left"}
                  />
                )}
              />
              {errors.nameEn?.message && (
                <ErrorText>{errors.nameEn.message}</ErrorText>
              )}
            </RNView>

            <RNView>
              <Controller
                name="phoneNumber"
                control={control}
                rules={{
                  required: i18n.t("errors.phone_required"),
                  pattern: {
                    value: /^[0-9]{8,15}$/,
                    message: i18n.t("errors.invalid_phone"),
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    iconName="phone-outline"
                    keyboardType="phone-pad"
                    placeholder={i18n.t("phone")}
                    textAlign={isArabic() ? "right" : "left"}
                  />
                )}
              />
              {errors.phoneNumber?.message && (
                <ErrorText>{errors.phoneNumber.message}</ErrorText>
              )}
            </RNView>

            <RNView>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: i18n.t("errors.email_required"),
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: i18n.t("errors.invalid_email"),
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    iconName="email-outline"
                    keyboardType="email-address"
                    placeholder={i18n.t("email")}
                    textAlign={isArabic() ? "right" : "left"}
                  />
                )}
              />
              {errors.email?.message && (
                <ErrorText>{errors.email.message}</ErrorText>
              )}
            </RNView>

            <Controller
              control={control}
              name="gender"
              defaultValue="Male"
              render={({ field: { onChange, value } }) => (
                <View style={styles.genderContainer}>
                  <Dropdown
                    style={[
                      styles.dropdown,
                      {
                        direction: i18n.language === "ar" ? "rtl" : "ltr",
                      },
                    ]}
                    placeholderStyle={[
                      styles.placeholderStyle,
                      {
                        textAlign: i18n.language === "ar" ? "right" : "left",
                      },
                    ]}
                    selectedTextStyle={[
                      styles.selectedTextStyle,
                      {
                        textAlign: i18n.language === "ar" ? "right" : "left",
                      },
                    ]}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={{
                      textAlign: i18n.language === "ar" ? "right" : "left",
                    }}
                    data={[
                      {
                        label: i18n.t("male"),
                        value: "Male",
                      },
                      {
                        label: i18n.t("female"),
                        value: "Female",
                      },
                    ]}
                    labelField="label"
                    valueField="value"
                    placeholder={i18n.t("selectGender")}
                    value={value}
                    onChange={(item) => onChange(item.value)}
                  />
                </View>
              )}
            />

            <RNView>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: i18n.t("errors.password_required"),
                  minLength: {
                    value: 6,
                    message: i18n.t("errors.password_length"),
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    value={value}
                    secureTextEntry={!isPasswordVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    iconName="lock-outline"
                    placeholder={i18n.t("password")}
                    textAlign={isArabic() ? "right" : "left"}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      >
                        <MaterialCommunityIcons
                          name={
                            !isPasswordVisible
                              ? "eye-off-outline"
                              : "eye-outline"
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

            <RNView>
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  required: i18n.t("errors.password_match"),
                  validate: (value) =>
                    value === password || i18n.t("errors.password_match"),
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    value={value}
                    secureTextEntry={!isConfirmVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    iconName="lock-check-outline"
                    placeholder={i18n.t("confirm_password")}
                    textAlign={isArabic() ? "right" : "left"}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setIsConfirmVisible(!isConfirmVisible)}
                      >
                        <MaterialCommunityIcons
                          name={
                            !isConfirmVisible
                              ? "eye-off-outline"
                              : "eye-outline"
                          }
                          size={22}
                          color={Colors.gray}
                        />
                      </TouchableOpacity>
                    }
                  />
                )}
              />
              {errors.confirmPassword?.message && (
                <ErrorText>{errors.confirmPassword.message}</ErrorText>
              )}
            </RNView>
          </RNView>

          <AuthButton
            isLoading={isLoading}
            style={{ width: width - 50 }}
            label={i18n.t("create_account")}
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
            style={styles.signInButton}
            onPress={() => navigation.navigate("Login" as never)}
          >
            <Text style={styles.signInText}>
              {i18n.t("already_have_account")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusBar style="light" />

      <SweetAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        isDarkMode={false}
        isRTL={isArabic()}
        onRequestClose={hideAlert}
      />
    </View>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundBlue,
  },
  genderContainer: {
    marginBottom: 16,
  },
  dropdown: {
    height: 55,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  dropdownContainer: {
    borderRadius: 12,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#999",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: "#000",
  },
  background: {
    width,
    height,
    position: "absolute",
    resizeMode: "cover",
  },
  gradient: {
    width,
    height,
    position: "absolute",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  logo: {
    width: width * 0.7,
    height: height * 0.3,
    resizeMode: "contain",
    marginBottom: -40,
  },
  wrapper: {
    width: "100%",
    alignItems: "stretch",
    gap: 16,
    marginBottom: 20,
  },
  guestButton: {
    marginTop: 25,
    alignItems: "center",
  },
  guestText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: "SF-Medium",
    textDecorationLine: "underline",
  },
  signInButton: {
    marginTop: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  signInText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: "SF-Medium",
    textDecorationLine: "underline",
  },
});
