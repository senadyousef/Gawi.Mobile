import * as React from "react";
import { TOKEN } from "../constants";
import { handleShowToast } from "../helpers";
import { handleFetchNews } from "../api/news";
import { handleFetchEvents } from "../api/events";
import { handleFetchCartItems } from "../api/cart";
import { handleFetchItem } from "../api/shop";
import { handleFetchGalleryItems } from "../api/gallery";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleGetAudience, handleGetUserProfile } from "../api/user";

import {
  Inews,
  Ievent,
  Icontext,
  IshopItem,
  IcartItem,
  IuserProfile,
  IgalleryItem,
  IapiResponse,
  IhomeScreenSectionData,
} from "../types";
import { handleAuthenticateUser } from "../api/auth";

interface Iprops {
  children: React.ReactNode;
  expoPushToken?: string | null;
}

// Update the context interface to include userType
interface IExtendedContext extends Icontext {
  expoPushToken?: string | null;
  cartId?: number | null;
  setCartId?: (id: number | null) => void;
  userType?: "PT" | "GymMember" | null; // 👈 Add userType
  isDarkMode?: boolean;
  
  setUserType?: (type: "pt" | "member" | null) => void; // 👈 Add setUserType
}

const Context = React.createContext<IExtendedContext>({
  bookedEvents: {},
  totalCartItems: 0,
  isAuthenticated: false,
  guestMode: false,
  setGuestMode: () => {},
  userProfile: undefined,
  setUserProfile: () => {},
  setBookedEvents: () => {},
  setTotalCartItems: () => {},
  handleLogout: async () => {},
  setIsAuthenticated: () => {},
  homeScreenNews: { data: [] },
  homeScreenEvents: { data: [] },
  homeScreenAudience: { data: 0 },
  homeScreenProducts: { data: [] },
  homeScreenGalleryItems: { data: [] },
  fetchCartItems: async () => undefined,
  shouldShowSignUp: false,
  setShouldShowSignUp: () => {},
  handleFetchUserProfile: async () => undefined,
  homeScreenDataFetchers: {
    news: async () => {},
    event: async () => {},
    audience: async () => {},
    storeItems: async () => {},
    galleryItems: async () => {},
  },
  expoPushToken: null,
  cartId: null,
  setCartId: () => {},
  userType: null, // 👈 Add default
  setUserType: () => {}, // 👈 Add default
  isDarkMode: false, // 👈 ADD
  toggleDarkMode: () => {},
});

export const ContextProvider: React.FC<Iprops> = ({
  children,
  expoPushToken,
}) => {
  const [pushToken, setPushToken] = React.useState<string | null>(
    expoPushToken || null,
  );
  const [totalCartItems, setTotalCartItems] = React.useState<number>(0);
  const [cartId, setCartId] = React.useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(false);

  // 👇 Add userType state
  const [userType, setUserType] = React.useState<"pt" | "member" | null>(null);

  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [guestMode, setGuestMode] = React.useState<boolean>(false);
  const [shouldShowSignUp, setShouldShowSignUp] =
    React.useState<boolean>(false);

  const [homeScreenNews, setHomeScreenNews] = React.useState<
    IhomeScreenSectionData<Inews[]>
  >({ data: [] });

  const [homeScreenEvents, setHomeScreenEvents] = React.useState<
    IhomeScreenSectionData<Ievent[]>
  >({ data: [] });

  const [homeScreenGalleryItems, setHomeScreenGalleryItems] = React.useState<
    IhomeScreenSectionData<IgalleryItem[]>
  >({ data: [] });

  const [homeScreenProducts, setHomeScreenProducts] = React.useState<
    IhomeScreenSectionData<IshopItem[]>
  >({ data: [] });

  const [homeScreenAudience, setHomeScreenAudience] = React.useState<
    IhomeScreenSectionData<number>
  >({ data: 0 });

  const [userProfile, setUserProfile] = React.useState<
    IuserProfile | undefined
  >(undefined);

  const [bookedEvents, setBookedEvents] = React.useState<{
    [key: number]: boolean;
  }>({});

  React.useEffect(() => {
    AsyncStorage.getItem("darkMode").then((val) => {
      if (val === "true") setIsDarkMode(true);
    });
  }, []);

  const toggleDarkMode = async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    await AsyncStorage.setItem("darkMode", String(next));
  };

  // Sync push token from App.tsx
  React.useEffect(() => {
    if (expoPushToken) setPushToken(expoPushToken);
  }, [expoPushToken]);

  // -----------------------------
  // CART FETCH (GLOBAL)
  // -----------------------------
  const fetchCartItems = async (
    userId: number,
    page?: number,
  ): Promise<IapiResponse<IcartItem[]> | undefined> => {
    const res = await handleFetchCartItems({
      userId,
      handleLogout,
      page: page || 1,
    });

    if (!res) return;

    setTotalCartItems(res.totalItems || 0);

    // Save cart ID from backend if exists
    if (res.cartId) {
      setCartId(res.cartId);
    }

    return res;
  };

  // -----------------------------
  // LOGOUT - Reset userType too
  // -----------------------------
  const handleLogout = async (shouldToast: boolean = true): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN);

    setIsAuthenticated(false);
    setGuestMode(false);
    setShouldShowSignUp(false);
    setUserProfile(undefined);
    setCartId(null);
    setTotalCartItems(0);
    setUserType(null); // 👈 Reset userType on logout

    // shouldToast &&
    //   handleShowToast({
    //     type: "error",
    //     text1: "error",
    //     text2: "session_expired",
    //   });
  };

  // -----------------------------
  // HOME SCREEN FETCHERS
  // -----------------------------
  const homeScreenDataFetchers = {
    event: async (userId?: number) => {
      try {
        setHomeScreenEvents({ isLoading: true, data: [] });
        const eventsRes = await handleFetchEvents({
          page: 1,
          pageSize: 10,
          handleLogout: undefined,
          userId: userId!,
        });
        setHomeScreenEvents({
          isLoading: false,
          data: eventsRes?.result || [],
        });
      } catch (err) {
        setHomeScreenEvents({ didFail: true, isLoading: false, data: [] });
      }
    },

    news: async () => {
      try {
        setHomeScreenNews({ isLoading: true, data: [] });
        const newsRes = await handleFetchNews({
          page: 1,
          handleLogout: undefined,
        });
        setHomeScreenNews({
          data: newsRes?.result || [],
          isLoading: false,
        });
      } catch (err) {
        setHomeScreenNews({ didFail: true, isLoading: false, data: [] });
      }
    },

    storeItems: async () => {
      try {
        setHomeScreenProducts({ isLoading: true, data: [] });
        const productsRes = await handleFetchItem({
          page: 1,
          handleLogout: undefined,
        });
        setHomeScreenProducts({
          data: productsRes?.result || [],
          isLoading: false,
        });
      } catch (err) {
        setHomeScreenProducts({ didFail: true, isLoading: false, data: [] });
      }
    },

    galleryItems: async () => {
      try {
        setHomeScreenGalleryItems({ isLoading: true, data: [] });
        const galleryRes = await handleFetchGalleryItems({
          page: 1,
          pageSize: 6,
          handleLogout: undefined,
        });

        const result = Array.isArray(galleryRes)
          ? galleryRes
          : galleryRes?.result || [];

        setHomeScreenGalleryItems({ data: result, isLoading: false });
      } catch (err) {
        setHomeScreenGalleryItems({
          didFail: true,
          isLoading: false,
          data: [],
        });
      }
    },

    audience: async () => {
      try {
        setHomeScreenAudience({ isLoading: true, data: 0 });
        const audience = await handleGetAudience(undefined);
        setHomeScreenAudience({ data: audience, isLoading: false });
      } catch (err) {
        setHomeScreenAudience({ didFail: true, isLoading: false, data: 0 });
      }
    },
  };

  const handleFetchHomeScreenData = (userId: number) => {
    setHomeScreenNews((d) => ({ ...d, isLoading: true }));
    setHomeScreenEvents((d) => ({ ...d, isLoading: true }));
    setHomeScreenProducts((d) => ({ ...d, isLoading: true }));
    setHomeScreenAudience((d) => ({ ...d, isLoading: true }));
    setHomeScreenGalleryItems((d) => ({ ...d, isLoading: true }));

    homeScreenDataFetchers
      .audience()
      .then(() => homeScreenDataFetchers.event(userId))
      .then(() => homeScreenDataFetchers.storeItems())
      .then(() => homeScreenDataFetchers.galleryItems())
      .then(() => homeScreenDataFetchers.news());

    fetchCartItems(userId).catch((err) =>
      console.log("Cart fetch error:", err),
    );
  };

  // -----------------------------
  // FETCH USER PROFILE - Detect user type
  // -----------------------------
  // In context.tsx - Update handleFetchUserProfile function
  const handleFetchUserProfile = async () => {
    const profile = await handleGetUserProfile(handleLogout);

    if (profile) {
      handleFetchHomeScreenData(profile.id);
      setUserProfile(profile);
      setIsAuthenticated(true);
      setGuestMode(false);

      // Determine user type from profile data
      if (profile.role === "PT") {
        setUserType("pt");
      } else {
        setUserType("member");
      }

      return profile; // ✅ Make sure to return the profile here
    } else {
      setIsAuthenticated(false);
      setUserProfile(undefined);
      setUserType(null);
    }

    return undefined; // ✅ Return undefined if no profile
  };
  const handleSuccessfulLogin = async (profile: IuserProfile) => {
    // Set all the necessary state
    handleFetchHomeScreenData(profile.id);
    setUserProfile(profile);
    setIsAuthenticated(true);
    setGuestMode(false);

    // Determine user type
    if (profile.role === "PT") {
      setUserType("pt");
    } else {
      setUserType("member");
    }
  };
  const handleUserLogin = async (email: string, password: string) => {
    try {
      // 1. Authenticate and get token
      await handleAuthenticateUser({ email, password });

      // 2. Fetch user profile
      const profile = await handleGetUserProfile(handleLogout);

      if (!profile) {
        throw new Error("Failed to fetch user profile");
      }

      // 3. Update all states
      handleFetchHomeScreenData(profile.id);
      setUserProfile(profile);
      setIsAuthenticated(true);
      setGuestMode(false);

      // Determine user type
      if (profile.role === "PT") {
        setUserType("pt");
      } else {
        setUserType("member");
      }

      return { success: true, profile };
    } catch (error) {
      console.error("Login error in context:", error);
      return { success: false, error };
    }
  };

  return (
    <Context.Provider
      value={{
        // Existing values
        userProfile,
        bookedEvents,
        handleLogout,
        totalCartItems,
        homeScreenNews,
        setUserProfile,
        fetchCartItems,
        setBookedEvents,
        isAuthenticated,
        homeScreenEvents,
        setTotalCartItems,
        homeScreenProducts,
        setIsAuthenticated,
        homeScreenAudience,
        homeScreenGalleryItems,
        handleFetchUserProfile,
        homeScreenDataFetchers,
        shouldShowSignUp,
        setShouldShowSignUp,
        guestMode,
        setGuestMode,
        cartId,
        setCartId,
        handleUserLogin,
        expoPushToken: pushToken,
        handleSuccessfulLogin,
        isDarkMode,
        toggleDarkMode,
        // 👇 NEW: Add userType to context
        userType,
        setUserType,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useAppContext = () => React.useContext(Context);
