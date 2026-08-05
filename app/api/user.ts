import { API_BASE_ENDPOINT } from "../constants";
import { handleGetToken } from "../helpers";
import { API_ENDPOINTS, IuserProfile } from "../types";

export const handleGetUserProfile = async (
  handleLogout: (shouldToast: boolean) => Promise<void>,
): Promise<IuserProfile | undefined> => {
  try {
    const token = await handleGetToken();

    if (!token) {
      await handleLogout(false);
      return undefined;
    }

    const url = `${API_BASE_ENDPOINT}${API_ENDPOINTS.PROFILE}${API_ENDPOINTS.GET_MY_PROFILE}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      const data = await res.json();
      return data;
    } else {
      await handleLogout(false);
      return undefined;
    }
  } catch (error) {
    console.error("handleGetUserProfile error:", error);
    await handleLogout(false);
    return undefined;
  }
};

export const handleGetAudience = async (
  handleLogout: (shouldToast?: boolean) => Promise<void>,
): Promise<number> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout(false);
    return 0;
  }

  const res = await fetch(
    `${API_BASE_ENDPOINT}${API_ENDPOINTS.USER}${API_ENDPOINTS.NUMBER_OF_MEMBERS_IN_THE_GYM}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (res.status === 200) {
    return await res.json();
  } else if (res.status === 401) {
    await handleLogout();
    return 0;
  } else {
    throw new Error();
  }
};
