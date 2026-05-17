import * as React from "react";
import {
  I18nManager,
  FlatList,
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import { width } from "../constants";
import { useAppContext } from "../context";
import { StatusBar } from "expo-status-bar";
import { defaultErrorToast } from "../helpers";
import { IgalleryItem, galleryFilter } from "../types";
import { handleFetchGalleryItems } from "../api/gallery";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { ListEmptyComponent } from "../components/ListEmptyComponent";
import GalleryFilter from "../components/GalleryScreen/GalleryFilter";
import GalleryView from "../components/GalleryScreen/GalleryView";
import Colors from "../constants/Colors";
import i18n from "../localization";
import { useI18n } from "../hooks/useI18n";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Video } from "expo-av";
const pageSize = 18;

const GalleryScreen = () => {
  const { handleLogout, guestMode } = useAppContext();
  const { isArabic } = useI18n();

  const [galleryItems, setGalleryItems] = React.useState<IgalleryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [isModalVisible, setIsModalVisible] = React.useState<boolean>(false);
  const [galleryFilter, setGalleryFilter] =
    React.useState<galleryFilter>("all");

  // ✅ Fetch Gallery Items (updated for new API)
  const fetchGalleryItems = async () => {
    try {
      setIsLoading(true);
      const res = await handleFetchGalleryItems({
        page: 1,
        pageSize,
        handleLogout: guestMode ? async () => {} : handleLogout,
      });

      if (Array.isArray(res)) {
        setGalleryItems(res);
      } else {
        setGalleryItems([]);
      }
    } catch (err) {
      console.error("❌ Error fetching gallery:", err);
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Initial fetch
  React.useEffect(() => {
    fetchGalleryItems();
  }, []);

  // ✅ Open modal on item tap
  const handleCardPress = (index: number) => {
    setCurrentIndex(index);
    setIsModalVisible(true);
  };

  // ✅ Filter logic (All / Photos / Videos)
  const filteredItems = React.useMemo(() => {
    if (galleryFilter === "photos") {
      return galleryItems.filter((item) => item.isPhoto);
    } else if (galleryFilter === "videos") {
      return galleryItems.filter((item) => !item.isPhoto);
    }
    return galleryItems;
  }, [galleryFilter, galleryItems]);

  return (
    <View style={styles.container}>
      {/* 🔹 Filter Buttons */}
      <GalleryFilter
        galleryFilter={galleryFilter}
        setGalleryFilter={setGalleryFilter}
      />

      {/* 🔹 Gallery Grid */}
      {isLoading ? (
        <LoadingIndicator isLoading />
      ) : (
        <FlatList
          numColumns={3}
          data={filteredItems}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <ListEmptyComponent
              isLoading={isLoading}
              message={i18n.t("no_gallery_items")}
            />
          }
          renderItem={({ item, index }) => {
            const isVideo = !item.isPhoto;

            const rawUrl = item.photoUrl;

            // ✅ معالجة الرابط
            const sourceUrl =
              rawUrl && !rawUrl.startsWith("http")
                ? `https://gym.useitsmart.com${rawUrl}`
                : rawUrl;

            const isYoutube = sourceUrl?.includes("youtube.com/watch?v=");

            // ✅ thumbnail لليوتيوب فقط
            let thumbnail = sourceUrl;

            if (isYoutube) {
              thumbnail = `https://img.youtube.com/vi/${
                sourceUrl.split("v=")[1].split("&")[0]
              }/hqdefault.jpg`;
            }

            const caption = isArabic()
              ? item.contentAr
              : item.contentEn || i18n.t("no_caption");

            return (
              <TouchableOpacity onPress={() => handleCardPress(index)}>
                <View style={styles.card}>
                  {/* ✅ إذا فيديو mp4 */}
                  {isVideo && !isYoutube ? (
                    <Video
                      source={{ uri: sourceUrl }}
                      style={styles.image}
                      resizeMode="cover"
                      paused={true} // مهم: ما يشتغل تلقائي
                      repeat={false}
                    />
                  ) : (
                    // ✅ صورة أو يوتيوب
                    <Image
                      source={{ uri: thumbnail }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  )}

                  {/* ▶️ أيقونة الفيديو */}
                  {isVideo && (
                    <View style={styles.videoOverlay}>
                      <MaterialCommunityIcons
                        name="play-circle-outline"
                        size={40}
                        color={Colors.white}
                      />
                    </View>
                  )}

                  <Text numberOfLines={2} style={styles.caption}>
                    {caption}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* 🔹 Fullscreen Modal Viewer */}
      <GalleryView
        data={filteredItems}
        isLoading={isLoading}
        totalItems={filteredItems.length}
        currentIndex={currentIndex}
        isModalVisible={isModalVisible}
        setCurrentIndex={setCurrentIndex}
        setIsModalVisible={setIsModalVisible}
      />

      <StatusBar style="dark" />
    </View>
  );
};

export default GalleryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    padding: 16,
    backgroundColor: "#fff",
  },
  card: {
    width: (width - 48) / 3,
    marginRight: 10,
  },
  image: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  caption: {
    fontSize: 11,
    color: Colors.black,
    marginTop: 4,
    textAlign: "center",
    fontFamily: "SF-Medium",
  },
});
