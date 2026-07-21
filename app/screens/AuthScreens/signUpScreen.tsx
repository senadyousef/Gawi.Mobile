import * as React from "react";
import i18n from "../../localization";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Image, View as RNView, Alert } from "react-native";
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "../../components/overridedComponents";
import AuthInput from "../../components/Auth/AuthInput";
import AuthButton from "../../components/Auth/AuthButton";
import ErrorMessage from "../../components/ErrorMessage";
import ErrorText from "../../components/ErrorText";
import { height, width } from "../../constants";
import { useAppContext } from "../../context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface ISignUpForm {
  nameAr: string;
  nameEn: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
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

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ISignUpForm>();

  const password = watch("password");

  const onSubmit: SubmitHandler<ISignUpForm> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const nameAr = data.nameAr?.trim() ? data.nameAr.trim() : DEFAULT_NAME_AR;
      const nameEn = data.nameEn?.trim() ? data.nameEn.trim() : DEFAULT_NAME_EN;

      const payload = {
        id: 0,
        email: data.email,
        nameAr,
        nameEn,
        phoneNumber: data.phoneNumber,
        password: data.password,
        role: "Guest",
        photoUrl: "",
      };

      console.log("📦 Sending payload:", payload);

      const response = await fetch(
        "https://gym.useitsmart.com/api/User/signUp",
        {
          method: "POST",
          headers: {
            accept: "text/plain",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      console.log("🔹 Response status:", response.status);

      if (response.ok) {
        const result = await response.text();
        console.log("✅ Registration successful:", result);

        Alert.alert("Success", "Account created successfully!", [
          { text: "OK", onPress: () => navigation.navigate("Login" as never) },
        ]);
      } else {
        const errorText = await response.text();
        console.log("❌ Registration failed:", errorText);
        Alert.alert(
          "Registration Failed",
          errorText || "Unable to register. Please try again.",
        );
      }
    } catch (error: any) {
      console.log("🔥 Error during registration:", error);
      Alert.alert(
        "Error",
        error.message || "Something went wrong. Please try again.",
      );
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

        <Image
          style={styles.logo}
          source={require("../../assets/images/Gawi.png")}
        />

        <RNView
          style={[styles.wrapper, { direction: isArabic() ? "rtl" : "ltr" }]}
        >
          <ErrorMessage width={width - 50} message={errorMessage} />

          {/* 🗣️ Name Arabic (optional — defaults to "لاعب") */}
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

          {/* 🗣️ Name English (optional — defaults to "player") */}
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

          {/* 📞 Phone Number */}
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

          {/* 📧 Email */}
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

          {/* 🔒 Password */}
          <RNView>
            <Controller
              name="password"
              control={control}
              rules={{
                required: i18n.t("errors.password_required"),
                minLength: { value: 6, message: i18n.t("errors.password_length") },
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

          {/* 🔒 Confirm Password */}
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
                          !isConfirmVisible ? "eye-off-outline" : "eye-outline"
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
          <Text style={styles.signInText}>{i18n.t("already_have_account")}</Text>
        </TouchableOpacity>

        <StatusBar style="light" />
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 25,
    backgroundColor: Colors.backgroundBlue,
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
  logo: {
    width: width * 0.7,
    height: height * 0.3,
    resizeMode: "contain",
    marginBottom: 40,
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