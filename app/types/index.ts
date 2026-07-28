import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { RegisterOptions } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  NotFound: undefined;
  Login: undefined;
  ForgetPassword: undefined;
  CodeVerification: undefined;
  ResetPassword: undefined;
  Signup: undefined;
  GetStarted: undefined;
  classes: undefined;
  gallery: undefined;
  latestNews: undefined;
  gymStoreScreen: undefined;
  storeScreen: {
    storeId: number;
    storeName: string;
  };
  storeItemsScreen: {
    storeId: number;
    storeName: string;
  };
  latestNewsDetails: {
    details: string;
  };
  productDetails: {
    productId: number;
    isGymStore: boolean;
  };
  eventDetails: {
    eventId: number;
  };
  cart: undefined;
  notifications: undefined;
  manageMyAccount: undefined;
  successfulAction: {
    title: string;
    message: string;
    extraMessage?: string;
  };
  myBooking: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Calendar: undefined;
  stores: undefined;
  Family: undefined;
  Menu: undefined;
};

export type RootTabScreenProps<Screen extends keyof RootTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<RootTabParamList, Screen>,
    NativeStackScreenProps<RootStackParamList>
  >;

export interface IheaderIcon {
  onPress: () => void;
  badge?: number | string;
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}

export interface IloginForm {
  email: string;
  nameEn: string;
  nameAr: string;
  phoneNumber: Number;
  photoUri: string;
  role: string;
}

export type ILoginFormRules = {
  [key in keyof IloginForm]: Omit<
    RegisterOptions<IloginForm, key>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
};

export type galleryFilter = "all" | "photos" | "videos";

export interface IpickerOption {
  label: string;
  key: string | number;
  value: string | number;
}

export enum API_ENDPOINTS {
  USER = "/User",
  NUMBER_OF_MEMBERS_IN_THE_GYM = "/NumberOfMembersInTheGym",
  AUTHENTICATE = "/authenticate",
  EVENTS = "/events",
  GET_DATES = "/GetDates",
  USER_EVENTS = "/UserEvents",
  PROFILE = "/profile",
  GET_MY_PROFILE = "/getMyProfile",
  CHECK_EMAIL_AND_MOBILE = "/checkEmailAndMobieNumber",
  NEWS = "/news",
  SHOP_ITEM = "/Gyms/getAllGymsStoreItems?userId=",
  GALLERY = "/api/Gyms/getAllGymsGallery?userId=",
  CARTS = "/carts",
  NEWS_GET_ALL = "/News/getallNews",
}

export interface IapiResponse<T> {
  data: any;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  message?: string;
  result: T;
}

export interface IloginRes {
  nameEn: string;
  nameAr: string;
  id: number;
  email: string;
  role: string;
  phoneNumber: string;
  photoUri?: string;
  membershipStatus: string;
  membershipExpDate: Date;
  token: string;
  refreshToken: string;
  expDate: Date;
  message?: String;
}

export type IeventDatesRes = IeventDate[];

export interface IeventDate {
  date: Date;
  event: boolean;
  eventId: number;
  booking: boolean;
}

export interface Icontext {
  totalCartItems: number;
  guestMode: boolean;
  setGuestMode: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  userProfile: IuserProfile | undefined;
  bookedEvents: { [key: number]: boolean };
  homeScreenNews: IhomeScreenSectionData<Inews[]>;
  homeScreenEvents: IhomeScreenSectionData<Ievent[]>;
  handleLogout: (shouldToast?: boolean) => Promise<void>;
  homeScreenProducts: IhomeScreenSectionData<IshopItem[]>;
  homeScreenGalleryItems: IhomeScreenSectionData<IgalleryItem[]>;
  handleFetchUserProfile: () => Promise<IuserProfile | undefined>;
  setTotalCartItems: React.Dispatch<React.SetStateAction<number>>;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  homeScreenDataFetchers: Record<homeScreenFetcher, () => Promise<void>>;
  homeScreenAudience: IhomeScreenSectionData<[number]>;
  setUserProfile: React.Dispatch<
    React.SetStateAction<IuserProfile | undefined>
  >;
  setBookedEvents: React.Dispatch<
    React.SetStateAction<{ [key: number]: boolean }>
  >;
  fetchCartItems: (
    userId: number,
    page?: number,
  ) => Promise<IapiResponse<IcartItem[]> | undefined>;
}
type homeScreenFetcher =
  | "event"
  | "news"
  | "storeItems"
  | "galleryItems"
  | "audience";

export interface IhomeScreenSectionData<T> {
  data: T;
  didFail?: boolean;
  isLoading?: boolean;
}

export interface Ievent {
  id: number;
  userId: number;
  branchesId: number;
  nameAr: string;
  nameEn: string;
  descriptionEn: string;
  descriptionAr: string;
  date: Date;
  from: string;
  to: string;
  capacity: number;
  booked: number;
  type: string;
  photoUri?: string;
  branches: Ibranch;
  user: IuserProfile;
}

export interface IuserProfile {
  token: any;
  age: number;
  bod: Date;
  nameEn: string;
  nameAr: string;
  photoUri?: string;
  weight: number;
  membershipStatus: string;
  membershipExpDate: Date;
  id: number;
  email: string;
  role: string;
  phoneNumber: Number;
  refreshToken: string;
}

export interface Istore {
  id: number;
  role: string;
  email: string;
  nameEn: string;
  nameAr: string;
  photoUri?: string;
  mobilePhone: string;
  categoryNameAr: string;
  categoryNameEn: string;
  refreshToken: string;
  membershipExpDate: Date;
  membershipStatus: string;
}

export interface IloginInfoCheckRes {
  message: string;
  isValid: boolean;
}

export interface Inews {
  id: number;
  descriptionEn: string;
  descriptionAr: string;
  highlight: string;
  photoUri: string;
  newsDate: Date;
}

export interface IshopItem {
  categoryNameAr: string;
  categoryNameEn: string;
  photoUrl: string;
  data(data: any): unknown;
  id: number;
  nameEn: string;
  categoryId: number;
  nameAr: string;
  price: number;
  descriptionAr: string;
  descriptionEn: string;
  itemPhotos: IshopItemPhoto[];
}

export interface IshopItemPhoto {
  id: number;
  itemsId: number;
  createdOn: Date;
  photoUrl: string;
  isDisabled: boolean;
}

export interface IgalleryItem {
  id: number;
  photoUrl: string;
}

export interface IcartItem {
  id: number;
  userId: number;
  itemsId: number;
  billId: number;
  quantity: number;
  item: IshopItem;
  
}

export interface Inotification {
  title: string;
  message: string;
  createdAt: Date;
}

export interface ImanageAccountForm {
  bod: Date;
  age: string;
  email: string;
  username: string;
  mobilePhone: string;
}

export type ImanageAccountFormRules = {
  [key in keyof ImanageAccountForm]: Omit<
    RegisterOptions<ImanageAccountForm, key>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
};

export interface Ibranch {
  id: number;
  nameEn: string;
  nameAr: string;
  createdOn: Date;
  isDisabled: boolean;
}

export interface IuserEvent {
  id: number;
  events: Ievent;
  userId: number;
  eventsId: number;
}

export interface IforgotPasswordForm {
  email: string;
}

export type IforgotPasswordFormRules = {
  [key in keyof IforgotPasswordForm]: Omit<
    RegisterOptions<IforgotPasswordForm, key>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
};

export interface IresetPasswordForm {
  password: string;
  confirmation_password: string;
}

export type IresetPasswordFormRules = {
  [key in keyof IresetPasswordForm]: Omit<
    RegisterOptions<IresetPasswordForm, key>,
    "valueAsNumber" | "valueAsDate" | "setValueAs" | "disabled"
  >;
};
