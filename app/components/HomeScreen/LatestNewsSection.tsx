import * as React from "react";
import ErrorBox from "../ErrorBox";
import i18n from "../../localization";
import SectionTitle from "./SectionTitle";
import { useAppContext } from "../../context";
import { StyleSheet, View } from "react-native";
import NoItemsComponent from "../NoItemsComponent";
import NewsCard from "../LatestNewsScreen/NewsCard";
import { returnRandomArrayItem } from "../../helpers";
import { LoadingIndicator } from "../LoadingIndicator";
import { useNavigation } from "@react-navigation/native";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border:  dark ? "#2C2C2C" : "#E8E0D0",
});

interface Props {
  refreshTrigger?: number;
}

const LatestNewsSection = ({ refreshTrigger = 0 }: Props) => {
  const { navigate } = useNavigation();
  const {
    homeScreenDataFetchers,
    homeScreenNews: { data, didFail, isLoading },
    isDarkMode, // 👈 pull isDarkMode
  } = useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);             // 👈 reactive styles

  React.useEffect(() => {
    if (refreshTrigger > 0) homeScreenDataFetchers.news();
  }, [refreshTrigger]);

  const item = returnRandomArrayItem(data);

  const getContent = () => {
    if (isLoading) return <LoadingIndicator isLoading={isLoading} />;
    if (didFail)
      return (
        <ErrorBox
          isLoading={!!isLoading}
          onRetry={homeScreenDataFetchers.news}
        />
      );
    if (!item) return <NoItemsComponent />;
    return (
      <View style={s.newsCardWrap}>
        <NewsCard item={item} isDarkMode={isDarkMode} /> {/* 👈 pass down */}
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