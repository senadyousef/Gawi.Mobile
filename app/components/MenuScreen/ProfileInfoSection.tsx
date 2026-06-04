import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import CardWrapper from "../CardWrapper";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { Text, TouchableOpacity } from "../overridedComponents";
import { fetchCurrentUserProfile, IUserProfile } from "../../api/profile";
import { useAppContext } from "../../context";
import { useNavigation } from "@react-navigation/native";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : Colors.secondary,
  muted: dark ? "#888888" : Colors.gray,
  imageBg: dark ? "#2C2C2C" : "#CCCCCC",
});

const ProfileInfoSection = () => {
  const { getDirection } = useI18n();
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { userProfile, isDarkMode } = useAppContext();
  const navigation = useNavigation();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const data = await fetchCurrentUserProfile();
      console.log("FULL PROFILE:", JSON.stringify(data, null, 2));
      setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, []);

  const imageUri = profile?.photoUrl || null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (!userProfile) return;
        navigation.navigate(
          "MyProfileNavigator" as never,
          {
            screen: "MyProfileMain",
          } as never,
        );
      }}
    >
      <CardWrapper
        style={[s.container, getDirection(), { backgroundColor: theme.bg }]}
      >
        <View style={[s.wrapper, getDirection()]}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.ink} />
          ) : imageUri ? (
            <Image style={s.image} source={{ uri: imageUri }} />
          ) : (
            <View
              style={[
                s.image,
                { backgroundColor: theme.imageBg, borderRadius: 22 },
              ]}
            />
          )}
          <View style={{ gap: 5 }}>
            <View style={{ alignItems: "flex-start" }}>
              <Text style={s.name}>{userProfile?.nameEn || "Guest"}</Text>
              <Text style={s.email}>
                {userProfile?.email || "guest@example.com"}
              </Text>
            </View>
          </View>
        </View>
      </CardWrapper>
    </TouchableOpacity>
  );
};

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    image: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    container: {
      gap: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    wrapper: {
      gap: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    name: {
      fontSize: 14,
      color: theme.ink,
      fontFamily: "SF-Medium",
    },
    email: {
      fontSize: 10,
      color: theme.muted,
      fontFamily: "SF-Medium",
    },
  });

export default ProfileInfoSection;
