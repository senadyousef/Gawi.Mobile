import { API_BASE_ENDPOINT } from '../constants';
import { handleGetToken } from '../helpers';
import { API_ENDPOINTS, IuserProfile } from '../types';

export const handleGetUserProfile = async (
  handleLogout: (shouldToast: boolean) => Promise<void>,
): Promise<IuserProfile | undefined> => {
  const token = await handleGetToken();

  if (!token) {
    await handleLogout(false);
    return;
  }

   const handleGetUserProfile = async (
  handleLogout: (shouldToast: boolean) => Promise<void>,
): Promise<IuserProfile | undefined> => {
  try {
    console.log("🔍 [DEBUG] Starting handleGetUserProfile");
    const token = await handleGetToken();
    console.log("🔍 [DEBUG] Token retrieved:", token ? "Yes" : "No");

    if (!token) {
      console.log("🔍 [DEBUG] No token, logging out");
      await handleLogout(false);
      return;
    }

    const url = `${API_BASE_ENDPOINT}${API_ENDPOINTS.PROFILE}${API_ENDPOINTS.GET_MY_PROFILE}`;
    console.log("🔍 [DEBUG] Fetching from URL:", url);
    console.log("🔍 [DEBUG] Headers:", {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token.substring(0, 20)}...` // Show first 20 chars only
    });

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("🔍 [DEBUG] Response status:", res.status);
    console.log("🔍 [DEBUG] Response headers:", Object.fromEntries(res.headers.entries()));

    if (res.status === 200) {
      const data = await res.json();
      console.log("🔍 [DEBUG] Profile data received:", data);
      return data;
    } else {
      console.log("🔍 [DEBUG] Non-200 response, logging out");
      const errorText = await res.text();
      console.log("🔍 [DEBUG] Error response:", errorText);
      await handleLogout(false);
      return undefined;
    }
  } catch (error) {
    console.error("🔍 [DEBUG] Fetch error:", error);
    await handleLogout(false);
    return undefined;
  }
};
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
      method: 'GET',
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
