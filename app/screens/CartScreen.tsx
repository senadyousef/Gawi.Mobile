import * as React from "react";
import i18n from "../localization";
import { IcartItem } from "../types";
import { width } from "../constants";
import { useAppContext } from "../context";
import { StatusBar } from "expo-status-bar";
import { defaultErrorToast, handleGetToken } from "../helpers";
import BottomButton from "../components/BottomButton";
import CartItemCard from "../components/CartScreen/CartItemCard";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { FlatList, StyleSheet, View as RNView } from "react-native";
import { ListEmptyComponent } from "../components/ListEmptyComponent";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#FFFFFF",
});

const CartScreen: React.FC = () => {
  const { cartId, setCartId, handleLogout, setTotalCartItems, isDarkMode } =
    useAppContext(); // 👈 pull isDarkMode

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);             // 👈 reactive styles

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [cartItems, setCartItems] = React.useState<IcartItem[]>([]);

  const fetchCartItems = async () => {
    try {
      setIsLoading(true);
      const token = await handleGetToken();
      const res = await fetch(
        `https://gym.useitsmart.com/api/Cart/getCartWithItems?cartId=${cartId}`,
        {
          method: "GET",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        if (res.status === 401) return handleLogout();
        return defaultErrorToast();
      }

      const data = await res.json();

      if (data.cartId && data.cartId !== cartId) {
        setCartId(data.cartId);
      }

      setCartItems(
        Array.isArray(data.listCartItemDto) ? data.listCartItemDto : [],
      );
      setTotalCartItems(data.listCartItemDto?.length ?? 0);
    } catch (err) {
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCartItems();
  }, [cartId]);

  return (
    <RNView style={s.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id?.toString() ?? `item-${Math.random()}`}
        contentContainerStyle={s.contentContainerStyle}
        ItemSeparatorComponent={() => <RNView style={{ height: 15 }} />}
        ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
        ListEmptyComponent={
          <ListEmptyComponent isLoading={isLoading} message="cart_is_empty" />
        }
        renderItem={({ item }) => (
          <CartItemCard
            cartItem={item}
            fetchCartItems={fetchCartItems}
            isDarkMode={isDarkMode} // 👈 pass down
          />
        )}
      />

      <BottomButton
        label={i18n.t("checkout")}
        disabled={cartItems.length === 0}
        isDarkMode={isDarkMode} // 👈 pass down
      />

      <StatusBar style={isDarkMode ? "light" : "dark"} /> {/* 👈 */}
    </RNView>
  );
};

export default CartScreen;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg, // 👈
    },
    contentContainerStyle: {
      padding: 16,
      width: width,
      paddingBottom: 25,
    },
  });