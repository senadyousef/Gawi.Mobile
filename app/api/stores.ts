// api/stores.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_ENDPOINT } from "../constants";
import { Istore } from "../types";

export const handleFetchStores = async (): Promise<Istore[] | undefined> => {
  try {
    // ✅ Get MemberId or fallback to a guest ID (2)
    const storedId = await AsyncStorage.getItem("MemberId");
   

    const response = await fetch(
      `${API_BASE_ENDPOINT}/Gyms/getAllGymsStoreItems?userId=${storedId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("❌ Failed to fetch stores:", response.status);
      return [];
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("⚠️ Failed to parse JSON:", e);
      return [];
    }

    if (Array.isArray(data)) {
      console.log("✅ Stores fetched successfully:", data.length);
      return data;
    } else {
      console.warn("⚠️ Unexpected API format:", data);
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching store items:", error);
    return [];
  }
};
