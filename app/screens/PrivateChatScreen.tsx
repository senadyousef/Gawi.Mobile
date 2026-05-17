// app/screens/PrivateChatScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function PrivateChatScreen() {
  const route = useRoute<RouteProp<{ params: any }, "params">>();
  const { user } = route.params;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { id: string; text: string; sender: string; time: string }[]
  >([]);

  const handleSend = () => {
    if (message.trim() === "") return;
    const newMsg = {
      id: Date.now().toString(),
      text: message,
      sender: "You",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.sender === "You";
    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.alignRight : styles.alignLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Gradient Header */}
      <LinearGradient
        colors={["#103453ff", "#254764ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.headerTitle}>{user.name}</Text>
        </View>
      </LinearGradient>

      {/* Chat messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
        />

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity>
            <MaterialCommunityIcons name="emoticon-outline" size={24} color="#666" />
          </TouchableOpacity>

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSend}
            style={styles.sendButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#103453ff", "#254764ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f6fa" },

  // Header
  header: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
  },
  headerContent: { flexDirection: "row", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  // Chat messages
  chatContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: "row",
  },
  alignRight: { justifyContent: "flex-end" },
  alignLeft: { justifyContent: "flex-start" },
  bubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleLeft: {
    backgroundColor: "#ffffff44",
    borderTopLeftRadius: 0,
  },
  bubbleRight: {
    backgroundColor: "#d1dcf7ff",
    borderTopRightRadius: 0,  
  },
  messageText: {
    fontSize: 15,
    color: "#333",
  },
  time: {
    fontSize: 11,
    color: "#666",
    alignSelf: "flex-end",
    marginTop: 4,
  },

  // Input bar
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    marginHorizontal: 8,
    paddingVertical: 6,
  },
  sendButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  sendGradient: {
    padding: 10,
    borderRadius: 24,
  },
});
