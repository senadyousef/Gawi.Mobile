import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg:      dark ? "#121212" : "#F8FAFF",
  surface: dark ? "#1E1E1E" : "#000000",
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
  const navigation = useNavigation<any>();
  const { isDarkMode } = useAppContext();                                    // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);  // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);              // 👈 reactive styles

  const [trainers, setTrainers] = useState<PT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPTs = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
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
      <Image source={{ uri: item.url }} style={s.image} />
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
      ) : (
        <FlatList
          data={trainers}
          keyExtractor={(item) => item.ptName}
          renderItem={renderItem}
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
      backgroundColor: theme.bg,      // 👈
    },
    card: {
      marginBottom: 16,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: theme.surface, // 👈 dark gray in dark mode, black in light
      elevation: 4,
    },
    image: { width: "100%", height: 180 },
    gradient: { ...StyleSheet.absoluteFillObject },
    cardContent: { position: "absolute", bottom: 12, left: 16 },
    name: { color: "#FFFFFF", fontSize: 20, fontWeight: "bold" },
    specialty: { color: "#DDDDDD", fontSize: 14 },
  });