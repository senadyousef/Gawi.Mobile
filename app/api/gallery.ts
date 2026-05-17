import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../localization";
import { IgalleryItem } from "../types";

/**
 * ✅ Fetches Gym Gallery Items
 * - Always fetches data from API, even if userId = 0 (guest mode)
 */
export const handleFetchGalleryItems = async ({
  page,
  pageSize,
  handleLogout,
}: {
  page: number;
  pageSize?: number;
  handleLogout: () => Promise<void>;
}): Promise<IgalleryItem[] | undefined> => {
  try {
    // 🪪 Retrieve MemberId or default to "0"
    const MemberId = (await AsyncStorage.getItem("MemberId")) || "0";
    console.log("🪪 MemberId:", MemberId);

    // ✅ Always fetch from API (even if MemberId = 0)
    const url = `https://gym.useitsmart.com/api/Gyms/getAllGymsGallery?userId=${MemberId}`;
    console.log("📸 Fetching gallery from:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    // ⚠️ Handle unauthorized access
    if (res.status === 401) {
      console.warn("⚠️ Unauthorized — logging out user...");
      await handleLogout();
      throw new Error(i18n.t("unauthorized_access"));
    }

    // ❌ Handle non-200 responses
    if (res.status !== 200) {
      const errorText = await res.text();
      console.error("❌ API Error:", res.status, errorText);
      throw new Error(i18n.t("an_error_occured"));
    }

    // ✅ Parse response
    const result = await res.json();
    console.log("✅ Gallery Data:", result);

    // 🧩 Normalize API response structure
    const mapped: IgalleryItem[] = Array.isArray(result)
      ? result.map((item: any, index: number) => ({
          id: index,
          photoUrl: item.url,
          isPhoto: !!item.isPhoto,
          isVideo: !item.isPhoto,
          contentAr: item.contentAr ?? "",
          contentEn: item.contentEn ?? "",
        }))
      : [];

    return mapped;
  } catch (error) {
    console.error("❌ Fetch exception:", error);
    throw new Error(i18n.t("an_error_occured"));
  }
};
