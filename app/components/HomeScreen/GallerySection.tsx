import * as React from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ErrorBox from "../ErrorBox";
import NoItemsComponent from "../NoItemsComponent";
import GalleryView from "../GalleryScreen/GalleryView";
import SectionTitle from "./SectionTitle";
import { useAppContext } from "../../context";
import { LoadingIndicator } from "../LoadingIndicator";
import i18n from "../../localization";
import { useI18n } from "../../hooks/useI18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Video from "expo-av/build/Video";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#C8F04A",
});

interface Props {
  refreshTrigger?: number;
}

const GallerySection = ({ refreshTrigger = 0 }: Props) => {
  const { navigate } = useNavigation();
  const { handleLogout, isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const { isArabic } = useI18n();
  const BASE_URL = "https://gym.useitsmart.com";

  const [data, setData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [didFail, setDidFail] = React.useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [isModalVisible, setIsModalVisible] = React.useState<boolean>(false);
  const isRTL = i18n.locale === "ar";

  const fetchGallery = async () => {
    setIsLoading(true);
    setDidFail(false);
    try {
      const MemberId = (await AsyncStorage.getItem("MemberId")) || "0";
      const url = `https://gym.useitsmart.com/api/Gyms/getAllGymsGallery?userId=${MemberId}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401) {
        await handleLogout();
        throw new Error(i18n.t("unauthorized_access"));
      }
      if (res.status !== 200) throw new Error(i18n.t("an_error_occured"));

      const result = await res.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setDidFail(true);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGallery();
  }, [refreshTrigger]);

  const handleCardPress = (index: number) => {
    setCurrentIndex(index);
    setIsModalVisible(true);
  };

  const getContent = () => {
    if (isLoading) return <LoadingIndicator isLoading={true} />;
    if (didFail) return <ErrorBox isLoading={false} onRetry={fetchGallery} />;
    if (!data?.length) return <NoItemsComponent />;

    return (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={data}
        inverted={isRTL}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={s.listContent}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        renderItem={({ item, index }) => {
          const isVideo = !item.isPhoto;
          const rawUrl = item.url || item.photoUrl;
          const sourceUrl =
            rawUrl && !rawUrl.startsWith("http")
              ? `${BASE_URL}${rawUrl}`
              : rawUrl;
          const caption = isArabic()
            ? item.contentAr || ""
            : item.contentEn || "";

          return (
            <TouchableOpacity onPress={() => handleCardPress(index)}>
              <View style={s.tileWrap}>
                {isVideo ? (
                  <Video
                    source={{ uri: sourceUrl }}
                    style={s.tileImage}
                    resizeMode="cover"
                    paused={true}
                    shouldPlay={false}
                  />
                ) : (
                  <Image
                    source={{ uri: sourceUrl }}
                    style={s.tileImage}
                    resizeMode="cover"
                  />
                )}

                <View style={s.tileOverlay} />

                {isVideo && (
                  <View style={s.playBtn}>
                    <MaterialCommunityIcons
                      name="play-circle-outline"
                      size={34}
                      color="#fff"
                    />
                  </View>
                )}

                {caption ? (
                  <Text numberOfLines={1} style={s.tileCaption}>
                    {caption}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  return (
    <View style={s.container}>
      <SectionTitle
        title={i18n.t("gallery_title")}
        onPress={() => navigate("gallery")}
      />
      {getContent()}
      <GalleryView
        data={data || []}
        isLoading={false}
        totalItems={data?.length || 0}
        currentIndex={currentIndex}
        isModalVisible={isModalVisible}
        setCurrentIndex={setCurrentIndex}
        setIsModalVisible={setIsModalVisible}
      />
    </View>
  );
};

export default GallerySection;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      paddingTop: 25,
    },
    listContent: {
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    tileWrap: {
      width: 118,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      position: "relative",
    },
    tileImage: {
      width: "100%",
      height: 110,
      backgroundColor: theme.bg,
    },
    tileOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.18)",
      borderRadius: 18,
      height: 110,
    },
    playBtn: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 110,
      alignItems: "center",
      justifyContent: "center",
    },
    tileCaption: {
      fontSize: 11,
      color: theme.ink,
      textAlign: "center",
      paddingVertical: 8,
      paddingHorizontal: 6,
      fontFamily: "SF-Medium",
    },
  });
