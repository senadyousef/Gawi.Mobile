import * as React from "react";
import i18n from "../../localization";
import { IcartItem } from "../../types";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { useAppContext } from "../../context";
import { Image, StyleSheet } from "react-native";
import { shadowStyle, width } from "../../constants";
import ConfirmationModal from "../ConfirmationModal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "../overridedComponents";
import { defaultErrorToast, handleGetToken } from "../../helpers";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : Colors.secondary,
  iconBg: dark ? "#2C2C2C" : Colors.tertiary,
  iconColor: dark ? "#F0F0F0" : Colors.secondary,
});

interface Props {
  cartItem: IcartItem;
  fetchCartItems: (page: number, shouldReset: boolean) => void;
  isDarkMode?: boolean; // 👈
}

const CartItemCard: React.FC<Props> = ({
  cartItem,
  fetchCartItems,
  isDarkMode,
}) => {
  const { getDirection } = useI18n();
  const { handleLogout, userProfile } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [shouldDelete, setShouldDelete] = React.useState<boolean>(false);
  const [quantity, setQuantity] = React.useState<number>(
    cartItem.quantity ?? 1,
  );

  const handleClose = () => setShouldDelete(false);

  const handleDecreaseQuantity = async () => {
    if (!cartItem.id) return;
    try {
      setIsLoading(true);
      const token = await handleGetToken();
      const URL = `https://gawifit.com/api/Cart/addToCart?itemsId=${cartItem.id}&quantity=-1`;
      const response = await fetch(URL, {
        method: "POST",
        headers: { accept: "text/plain", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        defaultErrorToast();
        return;
      }
      const newQuantity = quantity - 1;
      if (newQuantity <= 0) {
        await handleDeleteItem();
      } else {
        setQuantity(newQuantity);
        fetchCartItems(1, true);
      }
    } catch (err) {
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncreaseQuantity = async () => {
    if (!cartItem.id) return;
    try {
      setIsLoading(true);
      const token = await handleGetToken();
      const URL = `https://gawifit.com/api/Cart/addToCart?itemsId=${cartItem.id}&quantity=1`;
      const response = await fetch(URL, {
        method: "POST",
        headers: { accept: "text/plain", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        defaultErrorToast();
        return;
      }
      setQuantity((prev) => prev + 1);
      fetchCartItems(1, true);
    } catch (err) {
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!cartItem.id) return;
    try {
      setIsLoading(true);
      const token = await handleGetToken();
      const URL = `https://gawifit.com/api/Cart/addToCart?itemsId=${cartItem.id}&quantity=-${quantity}`;
      const response = await fetch(URL, {
        method: "POST",
        headers: { accept: "text/plain", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        defaultErrorToast();
        return;
      }
      fetchCartItems(1, true);
      setQuantity(0);
    } catch (err) {
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  const isMinQuantity = quantity <= 1;

  return (
    <View style={[s.container, getDirection()]}>
      <View style={s.imageWrapper}>
        <Image
          style={s.image}
          source={{
            uri:
              cartItem.photoUrl && cartItem.photoUrl.trim() !== ""
                ? `https://gawifit.com/${cartItem.photoUrl.replace(/^\//, "")}`
                : "https://via.placeholder.com/300x300.png?text=No+Image",
          }}
        />
      </View>
      <View
        style={[
          s.infoWrapper,
          { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
        ]}
      >
        <Text
          style={[
            s.title,
            { textAlign: i18n.locale === "ar" ? "left" : "left" },
          ]}
        >
          {i18n.locale === "ar"
            ? (cartItem.nameAr ?? cartItem.nameEn ?? "")
            : (cartItem.nameEn ?? cartItem.nameAr ?? "")}
        </Text>
        {!!cartItem.note?.trim() && (
          <View style={s.noteContainer}>
            <MaterialCommunityIcons
              name="note-text-outline"
              size={14}
              color={Colors.primary}
            />
            <Text style={s.noteText}>{cartItem.note}</Text>
          </View>
        )}
        <View
          style={[
            s.priceWrapper,
            { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
          ]}
        >
          <Text style={s.price}>${cartItem.price ? cartItem.price : 0}</Text>
          <View
            style={[
              s.iconsContainer,
              { backgroundColor: isDarkMode ? "#1E1E1E" : "#fff" },
            ]}
          >
            <TouchableOpacity
              style={[s.iconWrapper, isMinQuantity && s.deleteIconWrapper]}
              onPress={
                isMinQuantity
                  ? () => setShouldDelete(true)
                  : handleDecreaseQuantity
              }
            >
              <MaterialCommunityIcons
                size={14}
                name={isMinQuantity ? "delete" : "minus"}
                color={isMinQuantity ? Colors.white : theme.iconColor} // 👈
              />
            </TouchableOpacity>
            <Text style={s.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={s.iconWrapper}
              onPress={handleIncreaseQuantity}
            >
              <MaterialCommunityIcons
                size={14}
                name="plus"
                color={theme.iconColor} // 👈
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <ConfirmationModal
        isDisabled={isLoading}
        isVisible={shouldDelete}
        handleClose={handleClose}
        handleConfirm={handleDeleteItem}
        title={i18n.t("delete_cart_item_modal_title")}
      />
    </View>
  );
};

export default CartItemCard;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    noteContainer: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: Colors.primary + "15",
    },

    noteText: {
      fontSize: 12,
      fontFamily: "SF-Medium",
      color: Colors.primary,
    },
    container: {
      gap: 15,
      padding: 13,
      flexGrow: 1,
      borderRadius: 10,
      width: width - 36,
      flexDirection: "row",
      backgroundColor: theme.surface, // 👈
      ...shadowStyle,
    },
    title: {
      fontSize: 10,
      fontFamily: "SF-Medium",
      color: theme.ink, // 👈
    },
    image: {
      width: "100%",
      height: "100%",
      borderRadius: 10,
      backgroundColor: theme.iconBg, // 👈
    },
    imageWrapper: {
      width: 68,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    infoWrapper: {
      justifyContent: "space-between",
      flexShrink: 1,
      flexGrow: 1,
      gap: 10,
    },
    priceWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    price: {
      fontSize: 14,
      color: Colors.primary,
      fontFamily: "SF-Semibold",
    },
    iconWrapper: {
      width: 18,
      height: 18,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.iconBg, // 👈
    },
    deleteIconWrapper: {
      backgroundColor: Colors.error, // stays red always
    },
    iconsContainer: {
      gap: 6,
      alignItems: "center",
      flexDirection: "row",
    },
    quantityText: {
      fontSize: 14,
      color: theme.ink, // 👈
    },
    button: {
      height: 18,
      borderRadius: 10,
      paddingHorizontal: 5,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.iconBg, // 👈
    },
    buttonText: {
      fontSize: 12,
      color: theme.ink, // 👈
    },
    disabledButton: {
      opacity: 0.5,
    },
  });
