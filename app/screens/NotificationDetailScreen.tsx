// app/screens/NotificationDetailScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function NotificationDetailScreen() {
  const route = useRoute<RouteProp<{ params: { item: any } }, "params">>();
  const navigation = useNavigation<any>();
  const { item } = route.params;

  return (
    <LinearGradient colors={["#eef1ff", "#f9f9ff"]} style={styles.container}>
      {/* 🔙 Back Button */}

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 🛎️ Notification Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={30}
              color="#4e54c8"
            />
          </View>

          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.dateChip}>
            <Ionicons name="time-outline" size={14} color="#4e54c8" />
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>

          <Text style={styles.message}>{item.message}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    marginTop: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginLeft: 12,
  },
  scrollContainer: {
    padding: 20,
    alignItems: "center",
  },
  card: {
    width: width * 0.9,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignSelf: "center",
    backgroundColor: "#eef0ff",
    padding: 14,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
    marginBottom: 12,
  },
  dateChip: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#f2f2ff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    marginBottom: 18,
  },
  dateText: {
    fontSize: 13,
    color: "#4e54c8",
    marginLeft: 6,
  },
  message: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    textAlign: "center",
  },
});
