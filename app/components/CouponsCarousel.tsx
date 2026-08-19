import * as React from "react";
import { useEffect, useState } from "react";
import i18n from "../localization";
import { useI18n } from "../hooks/useI18n";
import { Image, StyleSheet, View, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import Carousel from "react-native-reanimated-carousel";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "./overridedComponents";
import { HOMESCREEN_HEADER_paddingHorizontal, width } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const carouselHight = 200;
const carouselWidth = width - HOMESCREEN_HEADER_paddingHorizontal * 2;

// ─── Theme ────────────────────────────────────────────────────────────────────
const theme = {
  bg: "#F5F0E8",
  surface: "#FDFAF5",
  border: "#E8E0D0",
  ink: "#1A1A1A",
  muted: "#8A8070",
  accent: "#E8742A",
};

interface IGymCarousel {
  nameAr: string;
  nameEn: string;
  photoUrl: string;
  contentAr: string;
  contentEn: string;
  type: string;
}
interface Props {
  refreshTrigger?: number;
}

const CouponsCarousel: React.FC<Props> = ({ refreshTrigger = 0 }) => {
  const { isArabic } = useI18n();
  const [carouselData, setCarouselData] = useState<IGymCarousel[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();
  useEffect(() => {
    const fetchCarousel = async () => {
      try {
        setLoading(true);
        let MemberId = (await AsyncStorage.getItem("MemberId")) || "0";
        const UserRole = (await AsyncStorage.getItem("UserRole")) || "Guest";
        if (!MemberId || MemberId === "0" || MemberId === "null") {
          MemberId = "0";
        }
        const Gender = await AsyncStorage.getItem("Gender");

        const url = `https://gawifit.com/api/Gyms/getAllGymsCarousel?userId=${MemberId}&role=${UserRole}&gender=${Gender}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const result = await res.json();
        setCarouselData(Array.isArray(result) ? result : []);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchCarousel();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <View style={[s.loaderContainer, { height: carouselHight }]}>
        <ActivityIndicator size="large" color={theme.ink} />
      </View>
    );
  }

  if (carouselData.length === 0) {
    return (
      <View style={[s.loaderContainer, { height: carouselHight }]}>
        <Text style={s.emptyText}>{i18n.t("no_carousel_data")}</Text>
      </View>
    );
  }

  return (
    <Carousel
      loop
      autoPlay
      data={carouselData}
      width={carouselWidth}
      height={carouselHight}
      style={s.carousel}
      autoPlayInterval={3000}
      renderItem={({ item }) => (
        <BlurView style={s.cardContainer}>
          <Image
            source={{
              uri:
                item.photoUrl && !item.photoUrl.startsWith("http")
                  ? `https://gawifit.com${item.photoUrl}`
                  : item.photoUrl,
            }}
            style={s.image}
          />

          {/* Dark overlay */}
          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.35)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Tag pill */}
          {/* <View style={s.tagPill}>
            <View style={s.tagDot} />
            <Text style={s.tagText}>
              {isArabic() ? "عرض مميز" : "Featured"}
            </Text>
          </View> */}

          {/* Title */}
          <Text style={[s.title, { textAlign: isArabic() ? "right" : "left" }]}>
            {isArabic() ? item.nameAr : item.nameEn}
          </Text>

          {/* Subtitle */}
          <Text
            style={[s.subTitle, { textAlign: isArabic() ? "right" : "left" }]}
            numberOfLines={2}
          >
            {isArabic() ? item.contentAr : item.contentEn}
          </Text>

          {/* Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              s.learnMoreButton,
              { flexDirection: isArabic() ? "row-reverse" : "row" },
            ]}
          >
            <TouchableOpacity
              style={s.accentButton}
              onPress={() => {
                if (item.type === "News") {
                  navigation.navigate("NewsDetails", {
                    item: {
                      title: i18n.locale === "ar" ? item.nameAr : item.nameEn,
                      photo:
                        item.photoUrl && !item.photoUrl.startsWith("http")
                          ? `https://gawifit.com${item.photoUrl}`
                          : item.photoUrl,
                      description:
                        i18n.locale === "ar" ? item.contentAr : item.contentEn,
                    },
                  });
                } else if (item.type === "Offer") {
                  navigation.navigate("OfferDetails", {
                    offer: item,
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={s.learnMoreText}>{i18n.t("learn_more")}</Text>

              <MaterialCommunityIcons
                size={18}
                color={theme.ink}
                name={
                  isArabic() ? "chevron-left-circle" : "chevron-right-circle"
                }
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </BlurView>
      )}
    />
  );
};

export default CouponsCarousel;

const s = StyleSheet.create({
  carousel: {
    borderRadius: 24,
    overflow: "hidden",
  },
  cardContainer: {
    padding: 22,
    width: carouselWidth,
    height: carouselHight,
    justifyContent: "flex-end",
    backgroundColor: "#00000086",
  },
  image: {
    width: carouselWidth,
    height: carouselHight,
    position: "absolute",
    borderRadius: 24,
  },
  tagPill: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.accent,
  },
  tagText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "SF-Medium",
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontFamily: "SF-Bold",
    letterSpacing: -0.4,
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.70)",
    fontFamily: "SF-Medium",
    lineHeight: 18,
    marginBottom: 14,
  },
  learnMoreButton: {
    alignSelf: "flex-start",
    borderRadius: 14,
    overflow: "hidden",
  },
  accentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.accent,
  },
  learnMoreText: {
    color: theme.ink,
    fontWeight: "700",
    fontSize: 13,
    fontFamily: "SF-Bold",
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    color: theme.muted,
    fontFamily: "SF-Medium",
    fontSize: 13,
  },
});
