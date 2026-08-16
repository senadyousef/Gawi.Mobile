import * as React from "react";
import i18n from "../../localization";
import { width } from "../../constants";
import SectionTitle from "./SectionTitle";
import Colors from "../../constants/Colors";
import { Text } from "../overridedComponents";
import { useI18n } from "../../hooks/useI18n";
import * as Progress from "react-native-progress";
import { I18nManager, Image, StyleSheet, View } from "react-native";
import { useAppContext } from "../../context";
import { Ionicons } from "@expo/vector-icons";
import { handleGetToken } from "../../helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#E8742A",
  green: "#4CAF50",
});
interface Props {
  refreshTrigger?: number;
}

const MyStatusSection: React.FC<Props> = ({ refreshTrigger = 0 }) => {
  const { guestMode, userProfile, isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const [membership, setMembership] = React.useState<any>(null);
  const { getDirection } = useI18n();
  const [progress, setProgress] = React.useState<number>(0);
  const isArabic = useI18n();
  const isRTL = i18n.locale === "ar";

  React.useEffect(() => setProgress(0.6), []);

  const handleFetchMembership = React.useCallback(async (memberId: number) => {
    const token = await handleGetToken();

    const response = await fetch(
      `https://gym.useitsmart.com/api/MemberShips/MemberShipsforuser/${memberId}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch membership");
    }

    const json = await response.json();
    console.log("MyStatusSection: fresh membership response ->", json);
    return json;
  }, []);

  const loadMembership = React.useCallback(async () => {
    try {
      const memberId = await AsyncStorage.getItem("MemberId");
      console.log(
        "MyStatusSection: loadMembership fired, memberId =",
        memberId,
      );

      if (!memberId) return;

      const data = await handleFetchMembership(Number(memberId));
      setMembership({ ...data }); // new reference, forces re-render
    } catch (error) {
      console.log("Membership Error:", error);
    }
  }, [handleFetchMembership]);

  useFocusEffect(
    React.useCallback(() => {
      loadMembership();
    }, [loadMembership]),
  );

  React.useEffect(() => {
    console.log("MyStatusSection: refreshTrigger changed ->", refreshTrigger);
    if (refreshTrigger > 0) {
      loadMembership();
    }
  }, [refreshTrigger, loadMembership]);

  if (guestMode) {
    return;
  }

  return (
    <View style={[s.container, { direction: isRTL ? "rtl" : "ltr" }]}>
      <SectionTitle title={i18n.t("my_status_title")} />

      <View style={s.grid}>
        <View style={s.rightCol}>
          <View style={[s.card, s.weightCard]}>
            <View style={[s.cardHeader, getDirection()]}>
              <View style={[s.iconWrap, { backgroundColor: "#E53935" + "20" }]}>
                <Image
                  source={require("../../assets/images/weight-section-icon.png")}
                  style={{ width: 18, height: 18 }}
                />
              </View>
              <Text style={s.cardLabel}>{i18n.t("weight")}</Text>
            </View>
            <View style={s.valRow}>
              <Text style={s.bigVal}>{membership?.weight_kg ?? 0}</Text>
              <Text style={s.valUnit}>kg</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MyStatusSection;

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      paddingTop: 25,
    },
    grid: {
      flexDirection: "row",
      gap: 12,
    },
    card: {
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    progressCard: {
      flex: 1,
      alignItems: "center",
      minHeight: 180,
    },
    weightCard: {
      flex: 1,
      marginBottom: 12,
    },
    weightProgressCard: {
      flex: 1,
    },
    rightCol: {
      flex: 1,
      gap: 12,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 14,
      alignSelf: "stretch",
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    cardLabel: {
      fontSize: 11,
      color: theme.muted,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      fontFamily: "SF-Medium",
    },
    ringWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 8,
    },
    ringSubLabel: {
      fontSize: 10,
      color: theme.muted,
      fontFamily: "SF-Medium",
      marginTop: 4,
    },
    valRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
      marginTop: 4,
    },
    bigVal: {
      fontSize: 26,
      fontFamily: "SF-Bold",
      color: theme.ink,
      letterSpacing: -0.5,
    },
    valUnit: {
      fontSize: 13,
      color: theme.muted,
      fontFamily: "SF-Medium",
    },
    deltaChip: {
      marginLeft: "auto",
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: theme.green + "20",
    },
    deltaText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.green,
      fontFamily: "SF-Medium",
    },
    guestContainer: {
      borderRadius: 24,
      padding: 20,
      marginVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    guestIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    guestText: {
      flex: 1,
      fontSize: 13,
      color: theme.muted,
      fontFamily: "SF-Medium",
      lineHeight: 18,
    },
  });
