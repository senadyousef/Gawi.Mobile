import * as React from "react";
import { IheaderIcon } from "../types";
import Colors from "../constants/Colors";
import { useI18n } from "../hooks/useI18n";
import { StyleSheet, View, I18nManager, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "./overridedComponents";
import i18n from "../localization";
import { handleGetToken } from "../helpers";
import { useFocusEffect } from "@react-navigation/native";
import { useAppContext } from "../context";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  iconBg:      dark ? "#000" : Colors.white,
  iconBorder:  dark ? "#000" : Colors.borderGray,
  iconColor:   dark ? "#F0F0F0" : Colors.black,
  badgeBg:     dark ? "#F0F0F0" : Colors.black,
  badgeText:   dark ? "#1A1A1A" : Colors.white,
});

interface Props {
  icons: IheaderIcon[];
  isHomeScreen?: boolean;
}

const IconsContainer: React.FC<Props> = ({ icons, isHomeScreen = false }) => {
  const { getDirection } = useI18n();
  const arabic = i18n.locale?.startsWith("ar") || I18nManager.isRTL;

  const { setCartId, isDarkMode } = useAppContext();                         // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);   // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);               // 👈 reactive styles

  const [cartCount, setCartCount] = React.useState<number>(0);
  const [cartIdLocal, setCartIdLocal] = React.useState<number | null>(null);

  const animatedValues = React.useRef(
    icons.map(() => new Animated.Value(1))
  ).current;

  const animateBadge = (index: number) => {
    Animated.sequence([
      Animated.timing(animatedValues[index], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValues[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchCartCount = async () => {
    try {
      const token = await handleGetToken();
      const res = await fetch(
        "https://gym.useitsmart.com/api/Cart/getCartItemsCount",
        {
          method: "GET",
          headers: { Accept: "*/*", Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
     
      const count = data?.count ?? 0;
      const id = data?.cartId ?? null;

      console.log("Fetched cart count:", count, "Cart ID:", id);
      if (count !== cartCount) {
        const cartIconIndex = icons.findIndex((icon) => icon.name === "cart-outline");
        if (cartIconIndex !== -1) animateBadge(cartIconIndex);
      }

      setCartCount(count);
      setCartIdLocal(id);
      if (setCartId) setCartId(id);
    } catch (err) {}
  };

  React.useEffect(() => {
    fetchCartCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchCartCount();
    }, []),
  );

  const getBadgeContent = (badge: number | string) => {
    if (typeof badge === "string") return badge;
    return badge > 99 ? "99+" : badge.toString();
  };

  return (
    <View
      style={[
        s.wrapper,
        getDirection(),
        arabic && { flexDirection: "row-reverse" },
      ]}
    >
      {icons.map(({ name, badge, onPress }, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            onPress?.();
            animateBadge(index);
          }}
          activeOpacity={0.7}
        >
          <View
            style={[
              s.iconWrapper,
              isHomeScreen && s.homeScreenIconWrapper,
            ]}
          >
            <MaterialCommunityIcons
              size={24}
              name={name}
              // 👇 home screen icons always light on dark bg, others use theme
              color={isHomeScreen ? Colors.tertiary : theme.iconColor}
            />

            {badge !== undefined && (
              <Animated.View
                style={[
                  s.badgeWrapper,
                  arabic ? { left: -6, right: "auto" } : {},
                  { transform: [{ scale: animatedValues[index] }] },
                ]}
              >
                <Text style={s.badgeText}>
                  {name === "cart-outline"
                    ? getBadgeContent(cartCount)
                    : getBadgeContent(badge)}
                </Text>
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default IconsContainer;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    wrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.iconBg,     // 👈
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.iconBorder,     // 👈
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    homeScreenIconWrapper: {
      // home screen icons stay on dark background always
      backgroundColor: Colors.black,
      borderColor: Colors.black,
    },
    badgeWrapper: {
      position: "absolute",
      top: -6,
      right: -6,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.badgeBg,   // 👈 inverts in dark mode for contrast
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    badgeText: {
      color: theme.badgeText,           // 👈 inverts with badge bg
      fontSize: 12,
      fontWeight: "700",
    },
  });