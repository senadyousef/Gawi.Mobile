import * as React from "react";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { TouchableOpacity } from "../overridedComponents";
import IconsContainer from "../IconsContainer";
import { statusBarHeight } from "../../constants";
import { useAppContext } from "../../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg:  dark ? "#1A1A1A" : Colors.white,
  ink: dark ? "#F0F0F0" : Colors.black,
});

interface Iprops {
  title: string;
}

const Header: React.FC<Iprops> = ({ title }) => {
  const { goBack, navigate } = useNavigation();
  const { isArabic, getDirection } = useI18n();
  const { isDarkMode } = useAppContext();                                    // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);  // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);              // 👈 reactive styles

  const [cartCount, setCartCount] = useState(0);

  return (
    <View style={s.header}>
      <View style={[s.backButtonWrapper, getDirection()]}>
        <TouchableOpacity onPress={goBack}>
          <MaterialCommunityIcons
            size={24}
            color={theme.ink} // 👈
            name={isArabic() ? "arrow-right" : "arrow-left"}
          />
        </TouchableOpacity>
        <Text style={s.title}>{title}</Text>
      </View>

      <IconsContainer
        icons={[
          {
            name: "cart-outline",
            badge: cartCount,
            onPress: () => navigate("cart"),
          },
          { name: "bell-outline", onPress: () => navigate("notifications") },
        ]}
        onCartCountChange={(count) => setCartCount(count)}
      />
    </View>
  );
};

export default Header;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: statusBarHeight,
      height: statusBarHeight + 50,
      backgroundColor: theme.bg,  // 👈
      justifyContent: "space-between",
    },
    backButtonWrapper: {
      gap: 10,
      flexDirection: "row",
      alignItems: "center",
    },
    title: {
      fontSize: 18,
      color: theme.ink,            // 👈
      fontFamily: "SF-Semibold",
    },
  });