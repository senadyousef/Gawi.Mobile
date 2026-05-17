// app/screens/ChatListScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  I18nManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "../localization";
import Colors from "../constants/Colors"; // optional if you have theme colors

interface User {
  id: string;
  name: string;
  role: "Management" | "Member";
}

const users: User[] = [
  { id: "1", name: "Management", role: "Management" },
  { id: "2", name: "John Doe", role: "Member" },
  { id: "3", name: "Sara Ali", role: "Member" },
  { id: "4", name: "Ali Ahmad", role: "Member" },
  { id: "5", name: "Noor Hassan", role: "Member" },
];

export default function ChatListScreen() {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleChatPress = (user: User) => {
    navigation.navigate("PrivateChat", { user });
  };

  const renderUserCard = (item: User) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => handleChatPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={
            item.role === "Management"
              ? ["#4e54c8", "#8f94fb"]
              : ["#43cea2", "#185a9d"]
          }
          style={styles.avatarGradient}
        >
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <View
          style={[
            styles.badge,
            item.role === "Management" ? styles.badgeManager : styles.badgeMember,
          ]}
        >
          <Text style={styles.badgeText}>
            {item.role === "Management"
              ? i18n.t("management")
              : i18n.t("member")}
          </Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name={I18nManager.isRTL ? "chevron-left" : "chevron-right"}
        size={22}
        color="#bbb"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient and floating search */}
      <LinearGradient
        colors={["#103453ff", "#254764ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <Text style={styles.headerTitle}>{i18n.t("chat_list")}</Text>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={i18n.t("search_user")}
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </LinearGradient>

      <View style={styles.listContainer}>
        

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderUserCard(item)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },

  headerContainer: {
    paddingTop: 50,
    paddingBottom: 70,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, fontSize: 15, color: "#333" },

  listContainer: {
    flex: 1,
    padding: 20,
    marginTop: -40, // overlap with header
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555",
    marginBottom: 15,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: { marginRight: 12 },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  textContainer: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#222" },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  badgeManager: { backgroundColor: "#e6e8ff" },
  badgeMember: { backgroundColor: "#e0f8eb" },
  badgeText: { fontSize: 12, color: "#444" },
});
