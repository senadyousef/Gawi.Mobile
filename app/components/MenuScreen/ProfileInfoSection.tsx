import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
import CardWrapper from "../CardWrapper";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { Text } from "../overridedComponents";
import { fetchCurrentUserProfile, IUserProfile } from "../../api/profile";
import { useAppContext } from "../../context";

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

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const data = await fetchCurrentUserProfile();
      setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, []);

  const imageUri = userProfile?.photoUri || null;

  return (
    // 👇 pass background color directly into CardWrapper's style prop
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
            <Text style={s.name}>{userProfile?.nameEn || "Loading..."}</Text>
            <Text style={s.email}>{userProfile?.email || ""}</Text>
          </View>
        </View>
      </View>
    </CardWrapper>
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
