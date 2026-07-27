import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context"; // 👈
import i18n from "../localization";
import { useI18n } from "../hooks/useI18n";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F8FAFF",
  surface: dark ? "#1E1E1E" : "#000000",
  muted: dark ? "#AAAAAA" : "#555555",
});

interface PT {
  url: string;
  ptName: string;
  ptWithUserAllClassDto: any[];
  ptDaysDto: any[];
  ptId?: any;
  Id?: any;
}

export default function PTListScreen() {
  const { isArabic } = useI18n();
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppContext(); // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles
  const [refreshing, setRefreshing] = useState(false);
  const [trainers, setTrainers] = useState<PT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await fetchPTs();
    } finally {
      setRefreshing(false);
    }
  };
  const fetchPTs = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      const userId = (await AsyncStorage.getItem("MemberId")) || "0";

      const res = await fetch(
        `https://gym.useitsmart.com/api/PT/getPTWithUser?userId=${userId}`,
      );
      const data: PT[] = await res.json();
      setTrainers(data);

      const GlobalPt = await AsyncStorage.getItem("GPTID");
      if (GlobalPt && GlobalPt !== "0") {
        const foundPT = data.find(
          (pt) =>
            String(pt.ptId) === String(GlobalPt) ||
            String(pt.Id) === String(GlobalPt),
        );
        if (foundPT) {
          await AsyncStorage.setItem("GPTID", "0");
          navigation.navigate("PTDetails", { trainer: foundPT });
        }
      }
    } catch (err) {
      console.error("❌ Error fetching PTs:", err);
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPTs();
    }, []),
  );

  const renderItem = ({ item }: { item: PT }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => navigation.navigate("PTDetails", { trainer: item })}
    >
      <Image
        source={{ uri: `https://gym.useitsmart.com/${item.url}` }}
        style={s.image}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent"]}
        style={s.gradient}
      />

      <View style={s.cardContent}>
        <Text style={s.name}>{item.ptName}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#28B446" />
      ) : trainers.length === 0 ? (
        <View style={s.emptyContainer}>
          <Text
            style={[
              s.emptyText,
              isArabic() && {
                textAlign: "right",
                writingDirection: "rtl",
              },
            ]}
          >
            {i18n.t("noPersonalTrainersYet")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trainers}
          keyExtractor={(item) => String(item.ptId || item.Id || item.ptName)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#28B446"]} // Android
              tintColor="#28B446" // iOS
            />
          }
        />
      )}
    </View>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.bg, // 👈
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 50,
    },

    emptyText: {
      fontSize: 16,
      color: theme.muted,
      fontWeight: "500",
    },
    card: {
      marginBottom: 16,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: theme.surface, // 👈 dark gray in dark mode, black in light
      elevation: 4,
    },
    image: { width: "100%", height: 180, resizeMode: "contain" },
    gradient: { ...StyleSheet.absoluteFillObject },
    cardContent: { position: "absolute", bottom: 12, left: 16 },
    name: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
    specialty: { color: "#DDDDDD", fontSize: 14 },
  });
