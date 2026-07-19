import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleGetToken } from "../helpers";
import i18n from "../localization";
import { useAppContext } from "../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F8FAFF",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#222222",
  muted: dark ? "#AAAAAA" : "#555555",
  detail: dark ? "#CCCCCC" : "#333333",
  border: dark ? "#2C2C2C" : "transparent",
});

const isArabic = i18n.locale === "ar";

const fetchGymClassByUser = async () => {
  try {
    const MemberId = await AsyncStorage.getItem("MemberId");
    if (!MemberId) throw new Error("User not found");
    const response = await fetch(
      `https://gym.useitsmart.com/api/GymClass/getAllGymClassByUser?userId=${MemberId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch gym classes");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

export default function ClassDetailsScreen({ route }: any) {
  const { classId } = route.params || {};
  const { isDarkMode } = useAppContext(); // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const [gymClass, setGymClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isPastClass = React.useMemo(() => {
    if (!gymClass) return false;

    const now = new Date();
    const classDateTime = new Date(gymClass.date);

    const [hours, minutes = "0"] = String(gymClass.from || "0:0").split(":");

    classDateTime.setHours(Number(hours), Number(minutes), 0, 0);

    return classDateTime < now;
  }, [gymClass]);
  useEffect(() => {
    const loadClass = async () => {
      try {
        setLoading(true);
        const MemberId = await AsyncStorage.getItem("MemberId");
        if (!MemberId) {
          Alert.alert("Login Required", "Please log in to view class details.");
          setLoading(false);
          return;
        }
        const classes = await fetchGymClassByUser();
        const foundClass = classes.find((c: any) => c.id === classId);
        if (!foundClass) {
          Alert.alert("Class Not Found", "This class could not be found.");
          setLoading(false);
          return;
        }
        setGymClass(foundClass);
      } catch (error) {
        Alert.alert("Error", "Unable to load class details.");
      } finally {
        setLoading(false);
      }
    };
    loadClass();
  }, [classId]);

  const handleBookClass = async () => {
    try {
      const MemberId = await AsyncStorage.getItem("MemberId");
      if (!MemberId) {
        Alert.alert("Login Required", "Please log in to book a class.");
        return;
      }
      const classes = await fetchGymClassByUser();
      const classToBook = classes.find((c: any) => c.id === classId);
      if (!classToBook) {
        Alert.alert("Error", "Class not found. Cannot book.");
        return;
      }
      if (classToBook.isBooked) {
        Alert.alert("Already Booked", "You have already booked this class.");
        return;
      }

      const isClassFull =
        classToBook.isFull === true ||
        classToBook.availableSeats === 0 ||
        (classToBook.capacity &&
          classToBook.bookedCount &&
          classToBook.bookedCount >= classToBook.capacity);

      if (isClassFull) {
        Alert.alert("Class Full", "Sorry, this class is fully booked.");
        return;
      }

      const payload = {
        userId: parseInt(MemberId),
        gymClassId: classToBook.id,
      };
      const token = await handleGetToken();
      const response = await fetch("https://gym.useitsmart.com/api/UserClass", {
        method: "POST",
        headers: {
          Accept: "text/plain",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const resultText = await response.text();
      if (!response.ok) {
        Alert.alert(
          "Booking Failed",
          resultText || "Unable to book this class.",
        );
        return;
      }
      Alert.alert(
        "✅ Booking Confirmed",
        `You successfully booked ${classToBook.nameEn}!`,
      );
      setGymClass((prev: any) => ({ ...prev, isBooked: true }));
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred while booking.");
    }
  };

  const handleBookClassDelete = async (userClassId: string) => {
    try {
      if (!userClassId) return;
      const token = await handleGetToken();
      if (!token) {
        alert("User not authenticated");
        return;
      }
      const response = await fetch(
        `https://gym.useitsmart.com/api/UserClass/${userClassId}`,
        {
          method: "DELETE",
          headers: { Accept: "*/*", Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        alert("Unable to cancel this booking.");
        return;
      }
      alert("✅ Booking successfully cancelled");
      setGymClass((prev: any) =>
        prev ? { ...prev, isBooked: false, userClassId: null } : prev,
      );
    } catch (error) {
      alert("An error occurred while cancelling the booking.");
    }
  };

  if (loading) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!gymClass) {
    return (
      <View
        style={[
          s.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: theme.ink }}>No class data available</Text>
      </View>
    );
  }

  const isAr = i18n.locale === "ar";

  return (
    <View style={s.container}>
      {/* Header Image */}
      <ImageBackground
        source={{ uri: `https://gym.useitsmart.com/${gymClass.photoUrl}` }}
        style={s.bannerImage}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,1)"]}
          style={s.imageOverlay}
        />
        <View style={s.headerContent}>
          <Text style={s.classType}>
            {isArabic ? gymClass.nameAr : gymClass.nameEn}
          </Text>
          <View style={s.infoRow}>
            <MaterialCommunityIcons name="calendar" size={18} color="#FF7002" />
            <Text
              style={[
                s.infoText,
                {
                  textAlign: isAr ? "right" : "left",
                  writingDirection: isAr ? "rtl" : "ltr",
                },
              ]}
            >
              {new Date(gymClass.date).toLocaleDateString(isAr ? "ar" : "en")} •{" "}
              {gymClass.from}:00–{gymClass.to}:00
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Details */}
      <ScrollView style={s.detailsSection} showsVerticalScrollIndicator={false}>
        <Text
          style={[
            s.sectionTitle,
            {
              textAlign: isAr ? "right" : "left",
              writingDirection: isAr ? "rtl" : "ltr",
            },
          ]}
        >
          📋 {i18n.t("class_information")}
        </Text>

        <View style={s.detailBox}>
          <View
            style={[
              s.detailItem,
              { flexDirection: isAr ? "row-reverse" : "row" },
            ]}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={20}
              color="#FF7002"
            />
            <Text style={s.detailText}>
              {i18n.t("capacity")}: {gymClass.capacity} {i18n.t("attendees")}
            </Text>
          </View>
          <View
            style={[
              s.detailItem,
              { flexDirection: isAr ? "row-reverse" : "row" },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-check"
              size={20}
              color="#2563EB"
            />
            <Text style={s.detailText}>
              {i18n.t("booked")}: {gymClass.bookedCount} / {gymClass.capacity}
            </Text>
          </View>
          <View
            style={[
              s.detailItem,
              { flexDirection: isAr ? "row-reverse" : "row" },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color={gymClass.isBooked ? "#28A745" : "#CCCCCC"}
            />
            <Text style={s.detailText}>
              {gymClass.isBooked
                ? i18n.t("already_booked")
                : i18n.t("not_booked")}
            </Text>
          </View>
        </View>

        <Text
          style={[
            s.description,
            {
              textAlign: isAr ? "right" : "left",
              writingDirection: isAr ? "rtl" : "ltr",
            },
          ]}
        >
          {gymClass.description || i18n.t("default_class_description")}
        </Text>
      </ScrollView>

      {/* Book Button */}
      {!isPastClass && !gymClass.isBooked && (
        <TouchableOpacity onPress={handleBookClass} activeOpacity={0.9}>
          <LinearGradient
            colors={["#FF7002", "#FF7002"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bookButton}
          >
            <Text style={s.bookButtonText}>{i18n.t("book_this_class")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {!isPastClass && gymClass.isBooked && (
        <TouchableOpacity
          onPress={() => handleBookClassDelete(gymClass.userClassId)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#620000", "#5F0000"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bookButton}
          >
            <Text style={s.bookButtonText}>{i18n.t("cancel_booking")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {isPastClass && (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 24,
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#E5E5E5",
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontWeight: "bold",
              color: "#666",
            }}
          >
            {i18n.t("class_finished")}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg, // 👈
    },
    bannerImage: { height: 240, justifyContent: "flex-end" },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    headerContent: { padding: 16 },
    classType: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
    infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    infoText: { color: "#FF7002", fontSize: 15, marginLeft: 6 },
    detailsSection: { flex: 1, paddingHorizontal: 16, marginTop: 10 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginVertical: 10,
      color: theme.ink, // 👈
    },
    detailBox: {
      backgroundColor: theme.surface, // 👈
      borderRadius: 12,
      padding: 14,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 6,
      elevation: 3,
      marginBottom: 16,
      borderWidth: 0.5,
      borderColor: theme.border, // 👈 subtle border in dark mode
    },
    detailItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    detailText: {
      fontSize: 15,
      marginLeft: 8,
      color: theme.detail, // 👈
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.muted, // 👈
      backgroundColor: theme.surface, // 👈
      padding: 12,
      borderRadius: 12,
      marginBottom: 80,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 0.5,
      borderColor: theme.border, // 👈
    },
    bookButton: {
      paddingVertical: 14,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 24,
    },
    bookButtonText: {
      textAlign: "center",
      color: "#FFFFFF",
      fontWeight: "bold",
      fontSize: 17,
    },
  });
