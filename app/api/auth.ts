import {
  IloginRes,
  IloginForm,
  API_ENDPOINTS,
  IloginInfoCheckRes,
} from "../types";
import i18n from "../localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_ENDPOINT, REFRESH_TOKEN, TOKEN } from "../constants";

export const handleAuthenticateUser = async (form: IloginForm) => {
  const res = await fetch(
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.USER}${API_ENDPOINTS.AUTHENTICATE}`,
    {
      method: "POST",
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  let resjson: IloginRes;

  try {
    resjson = await res.json();
    console.log("✅ Login API Response:", resjson);
  } catch (error) {
    console.error("❌ Login API JSON parse error:", error);
    throw new Error(i18n.t("an_error_occured"));
  }

  if (res.status === 200) {
    await AsyncStorage.setItem(TOKEN, resjson.token);
    await AsyncStorage.setItem(REFRESH_TOKEN, resjson.refreshToken);

    if (resjson.id) {
      await AsyncStorage.setItem("MemberId", String(resjson.id));
      console.log("💾 Saved MemberId:", resjson.id);
    }

    if (resjson.role) {
      await AsyncStorage.setItem("UserRole", resjson.role);

      console.log("💾 Saved UserRole:", resjson.role);
    }

    // ✅ Store the gym ID correctly
    if (resjson.gymsId) {
      await AsyncStorage.setItem("GymId", String(resjson.gymsId));
      console.log("💾 Saved GymId:", resjson.gymsId);
    } else {
      console.warn("⚠️ No gymsId found in login response.");
    }

    return resjson;
  } else if (res.status === 401) {
    
    throw new Error(i18n.t("invalid_email_or_password"));
  } else {
    throw new Error(i18n.t("an_error_occured"));
  }
};

export const checkEmailOrPhoneNumber = async (
  loginInfo: string | number,
): Promise<boolean> => {
  const res = await fetch(
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.USER}${API_ENDPOINTS.CHECK_EMAIL_AND_MOBILE}?loginInfo=${loginInfo}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (res.status === 200) {
    const resjson: IloginInfoCheckRes = await res.json();

    return !!resjson?.isValid;
  } else {
    throw new Error(i18n.t("an_error_occured"));
  }
};
