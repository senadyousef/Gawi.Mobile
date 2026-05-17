import * as React from "react";
import {
  Image,
  StyleSheet,
  ScrollView,
  View as RNView,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import i18n from "../localization";
import Colors from "../constants/Colors";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context";
import { shadowStyle, width, API_BASE_ENDPOINT } from "../constants";
import { IshopItem, RootStackParamList } from "../types";
import { LoadingIndicator } from "../components/LoadingIndicator";
import {
  handleShowToast,
  handleGetLocalizedField,
  handleGetToken,
} from "../helpers";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg:              dark ? "#1E1E1E" : Colors.white,
  ink:             dark ? "#F0F0F0" : Colors.secondary,
  muted:           dark ? "#AAAAAA" : Colors.gray,
  iconBg:          dark ? "#2C2C2C" : Colors.tertiary,
  iconColor:       dark ? "#F0F0F0" : Colors.secondary,
  buyBtn:          Colors.primary,
  cartBtnBg:       dark ? "#2C2C2C" : Colors.borderGray,
  cartBtnText:     dark ? "#F0F0F0" : Colors.black,
});

const ProductDetailsScreen: React.FC<
  NativeStackScreenProps<RootStackParamList, "productDetails">
> = ({
  route: {
    params: { isGymStore, productId },
  },
  navigation,
}) => {
  const { getDirection } = useI18n();
  const {
    userProfile,
    handleLogout,
    fetchCartItems,
    guestMode,
    setGuestMode,
    setIsAuthenticated,
    setShouldShowSignUp,
    isDarkMode, // 👈 pull isDarkMode
  } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);             // 👈 reactive styles

  const [quantity, setQuantity] = React.useState(1);
  const [productDetails, setProductDetails] = React.useState<IshopItem>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAddToCartLoading, setIsAddToCartLoading] = React.useState(false);

  React.useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        setIsLoading(true);
        const MemberId = (await AsyncStorage.getItem("MemberId")) || "0";
        const url = `${API_BASE_ENDPOINT}/Gyms/getAllGymsStoreItems?userId=${MemberId}`;
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) return;
        const result: IshopItem[] = await response.json();
        const product = result.find((item) => item.id === productId);
        setProductDetails(product);
      } catch (error) {
        handleShowToast({
          type: "error",
          text1: i18n.t("error"),
          text2: i18n.t("an_error_occured"),
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!productDetails?.id) return;
    if (guestMode) {
      setShouldShowSignUp(true);
      setGuestMode(false);
      setIsAuthenticated(false);
      setTimeout(() => {
        const rootNav = navigation.getParent()?.getParent();
        rootNav?.navigate("SignUp");
      }, 200);
      return;
    }
    if (!userProfile) return;
    try {
      setIsAddToCartLoading(true);
      const token = await handleGetToken();
      if (!token) throw new Error("No authentication token found");
      const qty = quantity || 1;
      const url = `https://gym.useitsmart.com/api/Cart/addToCart?itemsId=${productDetails.id}&quantity=${qty}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Accept: "text/plain", Authorization: `Bearer ${token}` },
        body: null,
      });
      if (!res.ok) throw new Error(`Failed to add to cart: ${res.status}`);
      fetchCartItems(userProfile.id);
      Alert.alert(i18n.t("success"), i18n.t("added_to_cart"));
    } catch (err: any) {
      Alert.alert(i18n.t("error"), err.message || "An unknown error occurred");
    } finally {
      setIsAddToCartLoading(false);
    }
  };

  const handleDecreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const handleIncreaseQuantity = () => setQuantity((q) => q + 1);

  const handleBuyNow = () => {
    if (!productDetails) return;
    if (guestMode) {
      setShouldShowSignUp(true);
      setGuestMode(false);
      setIsAuthenticated(false);
      return;
    }
    navigation.navigate("PaymentScreen", {
      product: {
        name: handleGetLocalizedField("nameEn", "nameAr", productDetails),
        price: productDetails.price * quantity,
        photoUrl: productDetails.photoUrl,
      },
    });
  };

  if (isLoading || !productDetails) {
    return (
      <RNView style={[{ paddingVertical: 20 }, { backgroundColor: theme.bg }]}>
        <LoadingIndicator isLoading={isLoading} />
      </RNView>
    );
  }

  const imageUrl = productDetails.photoUrl ?? "";

  return (
    <RNView style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        <Image
          style={s.image}
          source={{ uri: imageUrl }}
          resizeMode="cover"
        />

        <RNView style={{ gap: 16, paddingTop: 20 }}>
          {/* Title */}
          <RNView style={[{ flexDirection: "row" }, getDirection()]}>
            <Text style={s.title}>
              {handleGetLocalizedField("nameEn", "nameAr", productDetails)}
            </Text>
          </RNView>

          {/* Price + Quantity */}
          <RNView style={s.infoWrapper}>
            <RNView style={[{ flexDirection: "row" }, getDirection()]}>
              <Text style={s.priceText}>
                ${productDetails.price * quantity}
              </Text>
            </RNView>

            {!isGymStore && (
              <RNView style={s.iconsContainer}>
                <TouchableOpacity
                  onPress={handleDecreaseQuantity}
                  style={s.iconWrapper}
                >
                  <MaterialCommunityIcons
                    size={15}
                    name="minus"
                    color={theme.iconColor} // 👈
                  />
                </TouchableOpacity>
                <Text style={s.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  onPress={handleIncreaseQuantity}
                  style={s.iconWrapper}
                >
                  <MaterialCommunityIcons
                    size={15}
                    name="plus"
                    color={theme.iconColor} // 👈
                  />
                </TouchableOpacity>
              </RNView>
            )}
          </RNView>

          {/* Buttons */}
          {!isGymStore && (
            <RNView style={{ gap: 8, paddingTop: 16, paddingBottom: 25 }}>
              <TouchableOpacity
                onPress={handleAddToCart}
                disabled={isAddToCartLoading}
              >
                <Text style={s.cartButtonText}>{i18n.t("add_to_cart")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBuyNow}>
                <Text style={s.buyButtonText}>{i18n.t("buy_now")}</Text>
              </TouchableOpacity>
            </RNView>
          )}

          {/* Description */}
          <RNView style={[{ flexDirection: "row" }, getDirection()]}>
            <Text style={s.description}>
              {handleGetLocalizedField(
                "descriptionEn",
                "descriptionAr",
                productDetails,
              )}
            </Text>
          </RNView>
        </RNView>
      </ScrollView>

      <StatusBar style={isDarkMode ? "light" : "dark"} /> {/* 👈 */}
    </RNView>
  );
};

export default ProductDetailsScreen;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      margin: 16,
      marginBottom: 32,
      borderRadius: 10,
      backgroundColor: theme.bg,        // 👈
      justifyContent: "space-between",
      ...shadowStyle,
    },
    image: {
      width: "100%",
      height: 250,
      borderRadius: 10,
    },
    title: {
      fontSize: 16,
      fontFamily: "SF-Semibold",
      color: theme.ink,                  // 👈
    },
    priceText: {
      color: Colors.primary,
      fontFamily: "SF-Semibold",
    },
    description: {
      fontSize: 12,
      color: theme.muted,               // 👈
      textAlign: "justify",
      fontFamily: "SF-Medium",
    },
    iconsContainer: {
      gap: 15,
      alignItems: "center",
      flexDirection: "row",
    },
    quantityText: {
      fontSize: 14,
      fontFamily: "SF-Medium",
      color: theme.ink,                  // 👈
    },
    iconWrapper: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.iconBg,    // 👈
    },
    infoWrapper: {
      gap: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    buyButtonText: {
      padding: 16,
      borderRadius: 10,
      color: Colors.white,
      textAlign: "center",
      backgroundColor: Colors.primary,  // stays same
    },
    cartButtonText: {
      padding: 16,
      borderRadius: 10,
      textAlign: "center",
      color: theme.cartBtnText,         // 👈
      backgroundColor: theme.cartBtnBg, // 👈
    },
  });