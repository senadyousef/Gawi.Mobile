import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../localization";
import Colors from "../constants/Colors";

const { height, width } = Dimensions.get("window");

export default function ReelsScreen() {
  const [reels, setReels] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likes, setLikes] = useState({});
  const [loading, setLoading] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedReel, setSelectedReel] = useState<any>(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const videoRefs = useRef<any[]>([]);
  const navigation = useNavigation();
  const route = useRoute();

  // Handle deep linking when screen is mounted
  useEffect(() => {
    if (route.params?.id && reels.length) {
      const targetId = route.params.id;
      const index = reels.findIndex((r) => r.id.toString() === targetId.toString());
      if (index !== -1) setCurrentIndex(index);
    }
  }, [route.params, reels]);


  const shuffleArray = (array: any[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // ----------------------
  // Fetch all reels
  // ----------------------
  const fetchAllReels = async () => {
    try {
      setLoading(true);
      let page = 1;
      let allReels: any[] = [];
      const userId = await AsyncStorage.getItem("MemberId");

      while (true) {
        const res = await fetch(
          `https://gym.useitsmart.com/api/Reels/getReelsCommentsAndLikes?currentPage=${page}&pageSize=3&userId=${userId}`,
          { headers: { accept: "text/plain" } }
        );
        if (!res.ok) throw new Error(`Failed to fetch reels: ${res.status}`);
        const data = await res.json();
        const reelsPage = Array.isArray(data.result) ? data.result : [];
        allReels = [...allReels, ...reelsPage];
        if (data.currentPage >= data.totalPages) break;
        page++;
      }

      setReels(shuffleArray(allReels));
    } catch (err) {
      console.error("❌ Error fetching reels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReels();
    return () => videoRefs.current.forEach((v) => v?.unloadAsync && v.unloadAsync());
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => videoRefs.current.forEach((v) => v?.pauseAsync && v.pauseAsync());
    }, [])
  );

  // ----------------------
  // Helpers
  // ----------------------
  
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (!viewableItems.length) return;
    const visibleIndex = viewableItems[0].index;
    setCurrentIndex(visibleIndex);

    videoRefs.current.forEach((video, idx) => {
      if (!video?.pauseAsync || !video?.playAsync) return;
      idx === visibleIndex ? video.playAsync() : video.pauseAsync();
    });
  }).current;

  // ----------------------
  // Likes
  // ----------------------
  const handleLike = async (reelId: string) => {
    try {
      const userId = await AsyncStorage.getItem("MemberId");
      if (!userId) return alert("User not found. Please log in.");
      setLikes((prev) => ({ ...prev, [reelId]: !prev[reelId] }));

      const res = await fetch(
        `https://gym.useitsmart.com/api/Reels/like?userId=${userId}&reelId=${reelId}`,
        { method: "PUT", headers: { accept: "text/plain" } }
      );

      if (!res.ok) setLikes((prev) => ({ ...prev, [reelId]: !prev[reelId] }));
    } catch (err) {
      console.error("❌ Error liking reel:", err);
    }
  };

  // ----------------------
  // WhatsApp sharing
  // ----------------------
 const handleShare = async (title: string, reelId: string) => {
  // Deep link to your app
  const appDeepLink = `gym://reel/${reelId}`;
  // Fallback web link (in case the user doesn't have the app)
  const webLink = `https://gym.useitsmart.com/reel/${reelId}`;  
  // Message to share
  const msg = `${title}\n${appDeepLink}\n(If the app is not installed, open the link: ${webLink})`;
  
  // WhatsApp URL scheme
  const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(msg)}`;

  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);
    if (!canOpen) {
      alert("WhatsApp is not installed");
      return;
    }
    await Linking.openURL(whatsappUrl);
  } catch (error) {
    console.error("Error sharing via WhatsApp:", error);
  }
};


  // ----------------------
  // Comments
  // ----------------------
  const fetchComments = async (reelId: string) => {
    try {
      const userId = await AsyncStorage.getItem("MemberId");
      const res = await fetch(
        `https://gym.useitsmart.com/api/Reels/getReelsCommentsAndLikes?currentPage=1&pageSize=3&userId=${userId}`
      );
      const data = await res.json();
      const reel = data.result?.find((r: any) => r.id === reelId);
      setComments(reel?.comments || []);
    } catch (err) {
      console.error("❌ Error fetching comments:", err);
    }
  };

  const handleOpenComments = async (reel: any) => {
    setSelectedReel(reel);
    setCommentsVisible(true);
    await fetchComments(reel.id);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const userId = await AsyncStorage.getItem("MemberId");
      const res = await fetch(
        `https://gym.useitsmart.com/api/Reels/comment?userId=${userId}&reelId=${selectedReel.id}&comment=${encodeURIComponent(newComment)}`,
        { method: "PUT", headers: { accept: "text/plain" } }
      );
      if (res.ok) {
        setNewComment("");
        await fetchComments(selectedReel.id);
      }
    } catch (err) {
      console.error("❌ Error adding comment:", err);
    }
  };

  // ----------------------
  // Render Reel Item
  // ----------------------
  const renderItem = ({ item, index }: any) => {
    const isActive = currentIndex === index;
    return (
      <View style={styles.reelWrapper}>
        <Video
          ref={(ref) => (videoRefs.current[index] = ref)}
          source={{ uri: item.url }}
          resizeMode="cover"
          shouldPlay={isActive}
          isLooping
          style={styles.video}
        />
        <LinearGradient colors={["rgba(0,0,0,0.7)", "transparent"]} style={styles.topGradient} />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.9)"]} style={styles.bottomGradient} />

        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.userName}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleLike(item.id)} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={likes[item.id] ? "heart" : "heart-outline"}
              size={36}
              color={likes[item.id] ? "#ff3b5c" : "#fff"}
              style={styles.icon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenComments(item)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="comment-outline" size={32} color="#fff" style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item.userName, item.id)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="share-outline" size={32} color="#fff" style={styles.icon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList
        data={reels}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToAlignment="center"
        pagingEnabled
        ListFooterComponent={loading && <ActivityIndicator size="large" color="#00bfff" style={{ marginVertical: 20 }} />}
      />

      {/* Comments Modal */}
      <Modal visible={commentsVisible} animationType="slide" transparent={true} onRequestClose={() => setCommentsVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💬 Comments on {selectedReel?.userName}'s Reel</Text>
            <ScrollView style={styles.commentList}>
              {comments.length > 0 ? (
                comments.map((c: any, i: number) => (
                  <View key={i} style={styles.commentItem}>
                    <Text style={styles.commentUser}>{c.name}:</Text>
                    <Text style={styles.commentText}>{c.comment}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noComments}>No comments yet.</Text>
              )}
            </ScrollView>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#ccc"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
                <MaterialCommunityIcons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setCommentsVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  reelWrapper: { width, height, backgroundColor: "#000" },
  video: { width: "100%", height: "100%" },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 160 },
  bottomGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 300 },
  textContainer: { position: "absolute", bottom: 100, left: 18, width: width * 0.75 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  description: { color: "#e0e0e0", fontSize: 14, lineHeight: 22 },
  actions: { position: "absolute", right: 16, bottom: 100, alignItems: "center" },
  icon: { marginVertical: 18 },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#111", width: "90%", borderRadius: 15, padding: 20, maxHeight: "80%" },
  modalTitle: { color: "#00bfff", fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  commentList: { maxHeight: 250, marginBottom: 15 },
  commentItem: { marginBottom: 10 },
  commentUser: { color: "#00bfff", fontWeight: "bold" },
  commentText: { color: "#fff", marginLeft: 10 },
  noComments: { color: "#aaa", textAlign: "center" },
  commentInputContainer: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 10 },
  commentInput: { flex: 1, color: "#fff", backgroundColor: "#222", padding: 8, borderRadius: 8 },
  sendButton: { marginLeft: 8, backgroundColor: "#00bfff", padding: 8, borderRadius: 8 },
  closeButton: { marginTop: 10, alignSelf: "center", backgroundColor: "#333", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  closeText: { color: "#fff", fontWeight: "bold" },
});
