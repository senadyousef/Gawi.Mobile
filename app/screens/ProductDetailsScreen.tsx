import * as React from "react";
import {
  Image,
  StyleSheet,
  ScrollView,
  View as RNView,
  TouchableOpacity,
  Text,
  Modal,
  View,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { navigate as navigateGlobal } from "../context/RootNavigation";

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
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, {
  SweetAlertButton,
  SweetAlertType,
} from "../components/SweetAlert";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#1E1E1E" : Colors.white,
  ink: dark ? "#F0F0F0" : Colors.secondary,
  muted: dark ? "#AAAAAA" : Colors.gray,
  iconBg: dark ? "#2C2C2C" : Colors.tertiary,
  iconColor: dark ? "#F0F0F0" : Colors.secondary,
  buyBtn: Colors.primary,
  cartBtnBg: dark ? "#2C2C2C" : Colors.borderGray,
  cartBtnText: dark ? "#F0F0F0" : Colors.black,
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
    isDarkMode,
  } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const isRTL = i18n.locale === "ar";

  const [quantity, setQuantity] = React.useState(1);
  const [productDetails, setProductDetails] = React.useState<IshopItem>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAddToCartLoading, setIsAddToCartLoading] = React.useState(false);
  const [showCartModal, setShowCartModal] = React.useState(false);
  const [cartNote, setCartNote] = React.useState("");

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

  React.useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        setIsLoading(true);
        const MemberId = (await AsyncStorage.getItem("MemberId")) || "0";
        const UserRole = (await AsyncStorage.getItem("UserRole")) || "Guest";
        const url = `${API_BASE_ENDPOINT}/Gyms/getAllGymsStoreItems?userId=${MemberId}&role=${UserRole}`;
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
      requestAnimationFrame(() => {
        navigateGlobal("SignUp");
      });
      return;
    }

    if (!userProfile) return;

    try {
      setIsAddToCartLoading(true);

      const token = await handleGetToken();
      if (!token) throw new Error("No authentication token found");

      const qty = quantity || 1;

      const note = cartNote?.trim() ?? "";

      const url =
        `https://gawifit.com/api/Cart/addToCart` +
        `?itemsId=${productDetails.id}` +
        `&quantity=${qty}` +
        `&note=${encodeURIComponent(note)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "text/plain",
          Authorization: `Bearer ${token}`,
        },
        body: "",
      });

      if (!res.ok) {
        throw new Error(`Failed to add to cart: ${res.status}`);
      }
      setShowCartModal(false);
      setCartNote("");

      fetchCartItems(userProfile.id);
      showAlert("success", i18n.t("success"), i18n.t("added_to_cart"));
    } catch (err: any) {
      showAlert(
        "error",
        i18n.t("error"),
        err.message || "An unknown error occurred",
      );
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
          source={{
            uri:
              imageUrl && imageUrl.trim() !== ""
                ? imageUrl.startsWith("http")
                  ? imageUrl
                  : `https://gawifit.com/${imageUrl.replace(/^\//, "")}`
                : "https://via.placeholder.com/300x300.png?text=No+Image",
          }}
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
                {productDetails.price * quantity}JOD
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
                    color={theme.iconColor}
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
                    color={theme.iconColor}
                  />
                </TouchableOpacity>
              </RNView>
            )}
          </RNView>

          {/* Buttons */}
          {!isGymStore && (
            <RNView style={{ gap: 8, paddingTop: 16, paddingBottom: 25 }}>
              <TouchableOpacity
                onPress={() => setShowCartModal(true)}
                disabled={isAddToCartLoading}
              >
                <Text style={s.cartButtonText}>{i18n.t("add_to_cart")}</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity onPress={handleBuyNow}>
                <Text style={s.buyButtonText}>{i18n.t("buy_now")}</Text>
              </TouchableOpacity> */}
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
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Modal
        visible={showCartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCartModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.overlay}>
              <View style={s.modalContainer}>
                <Text style={s.title}>{i18n.t("add_to_cart")}</Text>

                <Image
                  source={{ uri: `https://gawifit.com/${imageUrl}` }}
                  style={s.productImage}
                />

                <Text style={s.productName}>
                  {handleGetLocalizedField("nameEn", "nameAr", productDetails)}
                </Text>

                <Text style={s.price}>{productDetails.price} JOD</Text>

                <View style={s.quantityRow}>
                  <TouchableOpacity onPress={handleDecreaseQuantity}>
                    <MaterialCommunityIcons name="minus" size={22} />
                  </TouchableOpacity>

                  <Text>{quantity}</Text>

                  <TouchableOpacity onPress={handleIncreaseQuantity}>
                    <MaterialCommunityIcons name="plus" size={22} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Add a note..."
                  value={cartNote}
                  onChangeText={setCartNote}
                  multiline
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                  style={s.noteInput}
                />

                <Text style={s.total}>
                  {i18n.t("total")}{" "}
                  {(productDetails.price * quantity).toFixed(2)} JOD
                </Text>

                <View style={s.buttons}>
                  <TouchableOpacity
                    onPress={() => setShowCartModal(false)}
                    style={s.cancelBtn}
                  >
                    <Text>{i18n.t("cancel")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={s.addBtn} onPress={handleAddToCart}>
                    <Text style={{ color: "#fff" }}>
                      {i18n.t("add_to_cart")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <SweetAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        isDarkMode={!!isDarkMode}
        isRTL={isRTL}
        onRequestClose={hideAlert}
      />
    </RNView>
  );
};

export default ProductDetailsScreen;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.45)",
    },

    modalContainer: {
      backgroundColor: theme.bg,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 35,
    },

    title: {
      fontSize: 22,
      fontFamily: "SF-Bold",
      color: theme.ink,
      textAlign: "center",
      marginBottom: 20,
    },

    productImage: {
      width: 130,
      height: 130,
      borderRadius: 18,
      alignSelf: "center",
      backgroundColor: "#F5F5F5",
      marginBottom: 18,
    },

    productName: {
      fontSize: 18,
      fontFamily: "SF-Semibold",
      color: theme.ink,
      textAlign: "center",
      marginBottom: 6,
    },

    price: {
      fontSize: 22,
      fontFamily: "SF-Bold",
      color: Colors.primary,
      textAlign: "center",
      marginBottom: 25,
    },

    quantityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 22,
      gap: 18,
    },

    quantityButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.iconBg,
      justifyContent: "center",
      alignItems: "center",
    },

    quantityText: {
      fontSize: 20,
      fontFamily: "SF-Bold",
      color: theme.ink,
      minWidth: 35,
      textAlign: "center",
    },

    noteInput: {
      minHeight: 90,
      borderWidth: 1,
      borderColor: Colors.borderGray,
      borderRadius: 16,
      backgroundColor: theme.bg,
      color: theme.ink,
      paddingHorizontal: 14,
      paddingVertical: 12,
      textAlignVertical: "top",
      fontFamily: "SF-Regular",
      fontSize: 15,
      marginBottom: 22,
    },

    total: {
      fontSize: 20,
      fontFamily: "SF-Bold",
      color: Colors.primary,
      textAlign: "center",
      marginBottom: 28,
    },

    buttons: {
      flexDirection: "row",
      gap: 12,
    },

    cancelBtn: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    cancelText: {
      fontSize: 16,
      fontFamily: "SF-Semibold",
      color: Colors.primary,
    },

    addBtn: {
      flex: 1,
      height: 52,
      borderRadius: 14,
      backgroundColor: Colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    addText: {
      fontSize: 16,
      fontFamily: "SF-Semibold",
      color: Colors.white,
    },
    container: {
      flex: 1,
      margin: 16,
      marginBottom: 32,
      borderRadius: 10,
      backgroundColor: theme.bg,
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
      color: theme.ink,
    },
    priceText: {
      color: Colors.primary,
      fontFamily: "SF-Semibold",
    },
    description: {
      fontSize: 12,
      color: theme.muted,
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
      color: theme.ink,
    },
    iconWrapper: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.iconBg,
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
      backgroundColor: Colors.primary,
    },
    cartButtonText: {
      padding: 16,
      borderRadius: 10,
      textAlign: "center",
      color: theme.cartBtnText,
      backgroundColor: theme.cartBtnBg,
    },
  });
