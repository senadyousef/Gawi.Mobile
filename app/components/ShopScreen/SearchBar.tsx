import * as React from "react";
import i18n from "../../localization";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { AntDesign } from "@expo/vector-icons";
import { StyleSheet, TextInput , Text } from "react-native";
import { TouchableOpacity, View } from "../overridedComponents";
import { useAppContext } from "../../context";

const getTheme = (dark: boolean) => ({
  bg:          dark ? "#2C2C2C" : "#F5F5F5",
  border:      dark ? "#3C3C3C" : "#E0E0E0",
  ink:         dark ? "#F0F0F0" : "#1A1A1A",
  placeholder: dark ? "#888888" : Colors.gray,
  icon:        dark ? "#888888" : Colors.gray,
});

interface Props {
  onSearchTextChanged: (val?: string) => void;
  isDarkMode?: boolean;
}

const SearchBar: React.FC<Props> = ({ onSearchTextChanged }) => {
  const { getDirection } = useI18n();
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);

  const [searchText, setSearchText] = React.useState<string>("");
  const isRTL = i18n.locale === "ar";

  // ✅ استخدم ref عشان تتجنب تغيير reference الـ callback
  const onSearchTextChangedRef = React.useRef(onSearchTextChanged);
  React.useEffect(() => {
    onSearchTextChangedRef.current = onSearchTextChanged;
  }, [onSearchTextChanged]);

  // ✅ handleChange ثابت — مش بيتغير reference
  const handleChange = React.useCallback((value: string) => {
    setSearchText(value);
    onSearchTextChangedRef.current(value || undefined);
  }, []);

  const handleReset = React.useCallback(() => handleChange(""), [handleChange]);

  return (
    <View
      style={[
        staticStyles.container,
        getDirection(),
        {
          flexDirection: isRTL ? "row-reverse" : "row",
          backgroundColor: theme.bg,
          borderColor: theme.border,
        },
      ]}
    >
      <AntDesign name="search" size={18} color={theme.icon} />

      <TextInput
        value={searchText}
        style={[
          staticStyles.input,
          {
            textAlign: isRTL ? "right" : "left",
            color: theme.ink,
          },
        ]}
        onChangeText={handleChange}
        placeholder={String(i18n.t("search_in_shop"))}
        placeholderTextColor={theme.placeholder}
      />

      {searchText ? (
        <TouchableOpacity onPress={handleReset}>
       
          <AntDesign name="close" size={18} color={theme.icon} />
    
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default SearchBar;

// ✅ ثابت تماماً — مش بيتغير أبداً — لا re-mount للـ TextInput
const staticStyles = StyleSheet.create({
  container: {
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  input: {
    flex: 1,
    height: "100%",
  },
});