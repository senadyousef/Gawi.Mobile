import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import i18n from "../localization";
import Colors from "../constants/Colors";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useI18n } from "../hooks/useI18n";
import { useAppContext } from "../context";

// ---------------- THEME ----------------
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#ffffff",
  surface: dark ? "#1E1E1E" : "#f8f9fa",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#555555",
  border: dark ? "#2C2C2C" : "#EEEEEE",

  primary: Colors.primary,
  accent: Colors.tertiary,
});

interface Offer {
  id: number;
  nameAr: string;
  nameEn: string;
  photoUrl: string;
  isViewForAll: boolean;
  contentAr: string;
  contentEn: string;
  userId: number;
}

export default function OffersScreen() {
  const navigation = useNavigation();
  const { isArabic } = useI18n();
  const { isDarkMode } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const BASE_URL = "https://gym.useitsmart.com";

  // ---------------- FETCH ----------------
  const fetchOffers = async () => {
    try {
      setLoading(true);

      const MemberId = await AsyncStorage.getItem("MemberId")|| "0";

      if (!MemberId || MemberId === "null" ) {
        throw new Error("Invalid MemberId");
      }

      const response = await fetch(
        `https://gym.useitsmart.com/api/Offers/getallOffers?userId=${MemberId}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const json = await response.json();
      setOffers(json || []);
    } catch (err: any) {
      console.error("Fetch Offers Error:", err);
      Alert.alert(i18n.t("error"), err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // ---------------- LOADING ----------------
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // ---------------- UI ----------------
  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        {offers.map((offer) => (
          <TouchableOpacity
            key={offer.id}
            style={[
              s.card,
              isArabic() && { flexDirection: "row-reverse" },
            ]}
            onPress={() =>
              navigation.navigate("OfferDetails" as never, { offer } as never)
            }
          >
            <Image
              source={{ uri: `${BASE_URL}${offer.photoUrl}` }}
              style={[
                s.image,
                isArabic() && { marginLeft: 15, marginRight: 0 },
              ]}
            />

            <View
              style={[
                s.cardInfo,
                isArabic() && { alignItems: "flex-end" },
              ]}
            >
              <Text
                style={[
                  s.title,
                  isArabic() && {
                    textAlign: "right",
                    writingDirection: "rtl",
                  },
                ]}
              >
                {i18n.locale === "ar" ? offer.nameAr : offer.nameEn}
              </Text>

              <Text
                style={[
                  s.desc,
                  isArabic() && {
                    textAlign: "right",
                    writingDirection: "rtl",
                  },
                ]}
              >
                {i18n.locale === "ar" ? offer.contentAr : offer.contentEn}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------- STYLES ----------------
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
    },

    content: {
      padding: 20,
    },

    card: {
      backgroundColor: theme.surface,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      padding: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: theme.border,
    },

    image: {
      width: 60,
      height: 60,
      borderRadius: 10,
      marginRight: 15,
    },

    cardInfo: {
      flex: 1,
    },

    title: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.primary,
      marginBottom: 4,
    },

    desc: {
      fontSize: 14,
      color: theme.muted,
    },
  });