import * as React from "react";
import i18n from "../../localization";
import { IgalleryItem } from "../../types";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { LoadingIndicator } from "../LoadingIndicator";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Modal, Image, StyleSheet } from "react-native";
import { Text, TouchableOpacity } from "../overridedComponents";
import { height, statusBarHeight, width } from "../../constants";
import Carousel, { ICarouselInstance } from "react-native-reanimated-carousel";
import { Video } from "expo-av";
import { useI18n } from "../../hooks/useI18n";

interface Props {
  totalItems: number;
  isLoading: boolean;
  currentIndex: number;
  data: IgalleryItem[];
  isModalVisible: boolean;
  isArabic?: () => boolean;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const GalleryView: React.FC<Props> = ({
  data,
  isLoading,
  totalItems,
  currentIndex,
  isModalVisible,
  setCurrentIndex,
  setIsModalVisible,
 
}) => {
  const carouselRef = React.useRef<ICarouselInstance>();
  const videoRef = React.useRef<Video | null>(null);
   const { isArabic } = useI18n();
  React.useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync(); // أو pauseAsync()
      }
    };
  }, [currentIndex]);

  React.useEffect(() => {
    if (currentIndex !== undefined && isModalVisible) {
      carouselRef.current?.scrollTo({
        index: currentIndex,
        animated: false,
      });
    }
  }, [currentIndex, isModalVisible]);

  const handleClose = async () => {
    if (videoRef.current) {
      await videoRef.current.stopAsync();
    }
    setIsModalVisible(false);
  };
  const handlePrev = () => carouselRef.current?.prev();
  const handleNext = () => carouselRef.current?.next();

  const isBackBtnDisabled = currentIndex === 0;
  const isNextBtnDisabled = currentIndex + 1 === data.length;

  // ✅ Get YouTube video ID
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  // ✅ Get YouTube thumbnail
  const getYouTubeThumbnail = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : url;
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={isModalVisible}
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Carousel
          data={data}
          loop={false}
          width={width}
          height={height}
          // @ts-ignore
          ref={carouselRef}
          onSnapToItem={setCurrentIndex}
          renderItem={({ item, index }) => {
            const rawUrl = item.url || item.photoUrl;

            // ✅ حل المشكلة: تحويل الرابط الكامل
            const mediaUri =
              rawUrl && !rawUrl.startsWith("http")
                ? `http://192.168.1.16${rawUrl}`
                : rawUrl;

            const isVideo = item.isPhoto === false;
            console.log("isArabic:", isArabic?.());
            console.log("contentAr:", item.contentAr);
            console.log("contentEn:", item.contentEn);
            const caption = isArabic()
              ? item.contentAr || ""
              : item.contentEn || "";

            console.log("🎬 FINAL URI:", mediaUri);

            // ✅ YouTube
            const isYoutube =
              mediaUri?.includes("youtube.com") ||
              mediaUri?.includes("youtu.be");

            if (isVideo) {
              if (isYoutube) {
                return (
                  <View style={styles.videoContainer}>
                    <Image
                      source={{ uri: getYouTubeThumbnail(mediaUri) }}
                      style={styles.image}
                    />
                    <View style={styles.youtubeOverlay}>
                      <MaterialCommunityIcons
                        name="youtube"
                        size={80}
                        color="#FF0000"
                      />
                    </View>
                  </View>
                );
              }

              // ✅ فيديو mp4
              return (
                <View style={styles.videoContainer}>
                  <Video
                    ref={videoRef}
                    source={{ uri: mediaUri }}
                    style={styles.video}
                    resizeMode="contain"
                    shouldPlay={index === currentIndex}
                    useNativeControls
                  />
                  {caption ? (
                    <Text style={styles.captionText}>{caption}</Text>
                  ) : null}
                </View>
              );
            }

            // ✅ صورة
            return (
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri:
                      mediaUri ||
                      "https://via.placeholder.com/800x800.png?text=No+Image",
                  }}
                  style={styles.image}
                  resizeMode="contain"
                />
                {caption ? (
                  <Text style={styles.captionText}>{caption}</Text>
                ) : null}
              </View>
            );
          }}
        />

        <LoadingIndicator isOnTop isLoading={isLoading} color={Colors.white} />

        {/* 🔙 Back Button */}
        <MaterialCommunityIcons
          size={30}
          name="arrow-left"
          color={Colors.white}
          onPress={handleClose}
          style={styles.backButton}
        />

        {/* ▶️ Controls */}
        <View style={styles.controlsWrapper}>
          <TouchableOpacity
            onPress={handlePrev}
            disabled={isBackBtnDisabled}
            style={isBackBtnDisabled && styles.disabledBtn}
          >
            <View style={[styles.wrapper, styles.iconWrapper]}>
              <MaterialCommunityIcons
                size={30}
                name="chevron-left"
                color={Colors.white}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.wrapper}>
            <Text style={styles.text}>
              {currentIndex + 1} {i18n.t("of")} {totalItems}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleNext}
            disabled={isNextBtnDisabled}
            style={isNextBtnDisabled && styles.disabledBtn}
          >
            <View style={[styles.wrapper, styles.iconWrapper]}>
              <MaterialCommunityIcons
                size={30}
                name="chevron-right"
                color={Colors.white}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <StatusBar style="light" />
    </Modal>
  );
};

export default GalleryView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  imageContainer: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width,
    height: height * 0.8,
  },
  videoContainer: {
    width,
    height,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.black,
  },
  video: {
    width,
    height: height * 0.8,
  },
  youtubeOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  youtubeText: {
    color: Colors.white,
    fontSize: 16,
    marginTop: 10,
    fontFamily: "SF-Medium",
  },
  captionText: {
    color: Colors.white,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontFamily: "SF-Medium",
    position: "absolute",
    bottom: 100,
  },
  backButton: {
    position: "absolute",
    top: statusBarHeight,
    left: 30,
    zIndex: 10,
  },
  controlsWrapper: {
    width,
    bottom: 0,
    padding: 30,
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    justifyContent: "space-between",
  },
  wrapper: {
    height: 43,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00000044",
  },
  iconWrapper: {
    width: 43,
  },
  text: {
    color: Colors.white,
    marginHorizontal: 30,
    fontFamily: "SF-Medium",
  },
  disabledBtn: {
    opacity: 0.4,
  },
});
