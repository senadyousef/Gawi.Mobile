import * as React from "react";
import ErrorBox from "../ErrorBox";
import i18n from "../../localization";
import SectionTitle from "./SectionTitle";
import { useAppContext } from "../../context";
import { Alert, StyleSheet, View , Text} from "react-native";
import NoItemsComponent from "../NoItemsComponent";
import NewsCard from "../LatestNewsScreen/NewsCard";
import { returnRandomArrayItem } from "../../helpers";
import { LoadingIndicator } from "../LoadingIndicator";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
});

interface Props {
  refreshTrigger?: number;
}
interface NewsItem {
  id: number;
  nameAr: string;
  nameEn: string;
  photoUrl: string;
  contentAr: string;
  contentEn: string;
}

const LatestNewsSection = ({ refreshTrigger = 0 }: Props) => {
  const { navigate } = useNavigation();
  const {
    homeScreenDataFetchers,
    homeScreenNews: { data, didFail, isLoading },
    isDarkMode, // 👈 pull isDarkMode
  } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    try {
      const MemberId = (await AsyncStorage.getItem("MemberId")) || "0";
      const UserRole = (await AsyncStorage.getItem("UserRole")) || "Guest";
      console.log("Fetching news for:", {
        MemberId,
        UserRole,
      });

      setLoading(true);

      const response = await fetch(
        `https://gym.useitsmart.com/api/News/getallNews?userId=${MemberId}&role=${UserRole}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        },
      );

      console.log("News Status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch news (${response.status})`);
      }

      const json = await response.json();

      console.log("News Response:", json);

      setNewsData(Array.isArray(json) ? json : []);
    } catch (err: any) {
      console.error("Fetch news error:", err);
      Alert.alert("Error", err.message || "Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const item = returnRandomArrayItem(newsData);

  const getContent = () => {
    if (loading) return <LoadingIndicator isLoading={loading} />;
    // if (didFail)
    //   return (
    //     <ErrorBox
    //       isLoading={!!loading}
    //       onRetry={fetchNews}
    //     />
    //   );
    if (!item) return <NoItemsComponent />;
    return (
      <View style={s.newsCardWrap}>
        <Text>
        <NewsCard item={item} isDarkMode={isDarkMode} /> {/* 👈 pass down */}
        </Text>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <SectionTitle
        title={i18n.t("latest_news_title")}
        onPress={() => navigate("AnnouncementsNews")}
      />
      {getContent()}
    </View>
  );
};

export default LatestNewsSection;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      paddingTop: 25,
    },
    newsCardWrap: {
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
  });
