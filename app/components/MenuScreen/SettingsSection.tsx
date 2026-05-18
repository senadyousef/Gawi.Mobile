import * as React from "react";
import i18n from "../../localization";
import * as Updates from "expo-updates";
import CardWrapper from "../CardWrapper";
import Colors from "../../constants/Colors";
import { useAppContext } from "../../context";
import { useI18n } from "../../hooks/useI18n";
import {
  View,
  TouchableOpacity,
  Text,
} from "../../components/overridedComponents";
import { FlatList, Modal, Pressable, StyleSheet, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SettingsItem, { IsettingsItemProps } from "./SettingsItem";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#1E1E1E" : "#FFFFFF",
  surface: dark ? "#2C2C2C" : "#F9F9F9",
  border: dark ? "#333333" : "#EEEEEE",
  ink: dark ? "#F0F0F0" : Colors.text,
  muted: dark ? "#888888" : Colors.secondary,
  optionSelected: dark ? "#1E3A5F" : Colors.backgroundBlue + "25",
});

interface ExtendedSettingsItemProps extends IsettingsItemProps {
  hideForGuest?: boolean;
  isDarkModeToggle?: boolean;
}

const SettingsSection = () => {
  const { navigate } = useNavigation();
  const { handleLogout, guestMode, isDarkMode, toggleDarkMode } =
    useAppContext();
  const { setLanguage, getDirection, isArabic } = useI18n();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedLang, setSelectedLang] = React.useState(i18n.locale);

  const languageOptions = [
    { key: "en", label: "English", flag: "🇬🇧" },
    { key: "ar", label: "العربية", flag: "🇸🇦" },
  ];

  const settingsItems: ExtendedSettingsItemProps[] = [
    // {
    //   AntDesignIconName: "calendar",
    //   title: i18n.t("my_bookings"),
    //   onPress: () => navigate("myBooking"),
    //   hideForGuest: true,
    // },
    {
      IoniconsIconName: "bag-check-outline",
      title: i18n.t("orders"),
      onPress: () => {
        navigate("Orders");
      },
      hideForGuest: true,
    },
    // {
    //   AntDesignIconName: "user",
    //   title: i18n.t("manage_my_account"),
    //   onPress: () => navigate("manageMyAccount"),
    //   hideForGuest: true,
    // },
    // {
    //   AntDesignIconName: "lock",
    //   title: i18n.t("privacy_and_safety"),
    //   onPress: () => {},
    // },
    // {
    //   IoniconsIconName: "notifications-outline",
    //   title: i18n.t("notification"),
    //   onPress: () => navigate("notifications"),
    // },
    {
      AntDesignIconName: "edit",
      title: i18n.t("language"),
      onPress: () => setIsModalVisible(true),
      badge:
        languageOptions.find((l) => l.key === i18n.locale)?.flag +
        " " +
        languageOptions.find((l) => l.key === i18n.locale)?.label,
    },
    {
      AntDesignIconName: "moon",
      title: "Dark Mode",
      onPress: () => toggleDarkMode?.(),
      isDarkModeToggle: true,
    },
    // {
    //   AntDesignIconName: "customerservice",
    //   title: i18n.t("customers_service"),
    //   onPress: () => {},
    // },
    // {
    //   AntDesignIconName: "creditcard",
    //   title: i18n.t("payment_history"),
    //   onPress: () => {},
    // },
  ];

  const visibleItems = settingsItems.filter(
    (item) => !(guestMode && item.hideForGuest),
  );

  const handleSaveLanguage = async (value: string) => {
    setSelectedLang(value);
    await setLanguage(value);
    setIsModalVisible(false);
    await Updates.reloadAsync();
  };

  return (
    // 👇 CardWrapper background reacts to dark mode
    <CardWrapper style={[s.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          { flexDirection: "row", backgroundColor: theme.bg },
          getDirection(),
        ]}
      >
        <Text style={s.header}>{i18n.t("settings")}</Text>
      </View>

      {/* Settings List */}
      {visibleItems.map(
        (
          {
            badge,
            title,
            color,
            onPress,
            IoniconsIconName,
            AntDesignIconName,
            shouldShowChevron,
            isDarkModeToggle,
          },
          index,
        ) => (
          <SettingsItem
            key={index}
            badge={badge}
            title={title}
            color={color}
            onPress={onPress}
            IoniconsIconName={IoniconsIconName}
            AntDesignIconName={AntDesignIconName}
            shouldShowChevron={isDarkModeToggle ? false : shouldShowChevron}
            rightElement={
              isDarkModeToggle ? (
                <Switch
                  value={isDarkMode}
                  onValueChange={() => toggleDarkMode?.()}
                  trackColor={{ false: "#ccc", true: Colors.primary }}
                  thumbColor={isDarkMode ? Colors.white : "#f4f3f4"}
                  ios_backgroundColor="#ccc"
                />
              ) : undefined
            }
          />
        ),
      )}

      {/* Language Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{i18n.t("choose_language")}</Text>

            <FlatList
              data={languageOptions}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const isSelected = selectedLang === item.key;
                return (
                  <Pressable
                    onPress={() => handleSaveLanguage(item.key)}
                    style={[
                      s.option,
                      isSelected && s.optionSelected,
                      { flexDirection: isArabic() ? "row-reverse" : "row" },
                    ]}
                  >
                    <Text style={s.flag}>{item.flag}</Text>
                    <Text
                      style={[
                        s.optionLabel,
                        isSelected && s.optionLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color={Colors.primary}
                        style={{
                          marginLeft: isArabic() ? 0 : "auto",
                          marginRight: isArabic() ? "auto" : 0,
                        }}
                      />
                    )}
                  </Pressable>
                );
              }}
            />

            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={s.cancelButton}
            >
              <Text style={s.cancelText}>{i18n.t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </CardWrapper>
  );
};

export default SettingsSection;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      gap: 10,
    },
    header: {
      fontFamily: "SF-Semibold",
      fontSize: 18,
      color: Colors.primary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    modalBox: {
      backgroundColor: theme.bg, // 👈
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 25,
      paddingBottom: 35,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 18,
      color: Colors.primary,
      fontFamily: "SF-Semibold",
      textAlign: "center",
      marginBottom: 20,
    },
    option: {
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 12,
      backgroundColor: theme.surface, // 👈
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    optionSelected: {
      backgroundColor: theme.optionSelected, // 👈
    },
    flag: {
      fontSize: 20,
      marginRight: 10,
    },
    optionLabel: {
      fontSize: 15,
      color: theme.ink, // 👈
      fontFamily: "SF-Regular",
    },
    optionLabelSelected: {
      color: Colors.primary,
      fontFamily: "SF-Semibold",
    },
    cancelButton: {
      marginTop: 10,
      alignSelf: "center",
      paddingVertical: 10,
    },
    cancelText: {
      fontSize: 15,
      color: theme.muted, // 👈
      fontFamily: "SF-Medium",
    },
  });
