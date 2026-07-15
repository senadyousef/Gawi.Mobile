import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
  I18nManager,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "../localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context"; // 👈 import context

const { width } = Dimensions.get("window");

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#f5f7fa",
  cardBg: dark ? "#1E1E1E" : "rgba(255,255,255,0.95)",
  ink: dark ? "#F0F0F0" : "#333333",
  muted: dark ? "#AAAAAA" : "#555555",
  mutedLight: dark ? "#888888" : "#888888",
  border: dark ? "#2C2C2C" : "#E2E8F0",
  mapUnavailableBg: dark ? "#2C2C2C" : "#e3e6ea",
  mapUnavailableText: dark ? "#AAAAAA" : "#555555",
  dayText: dark ? "#F0F0F0" : "#333333",
  timeText: dark ? "#AAAAAA" : "#555555",
  ownerName: dark ? "#F0F0F0" : "#333333",
  ownerPhone: dark ? "#AAAAAA" : "#666666",
  headerGradientStart: "#103453ff",
  headerGradientEnd: "#254764ff",
});

const parseCoordinate = (coord: string) => {
  if (!coord || typeof coord !== "string") return null;
  const regex = /(\d+)°(\d+)'([\d.]+)"/;
  const match = coord.match(regex);
  if (!match) return null;
  const degrees = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) return null;
  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (coord.includes("S") || coord.includes("W")) decimal *= -1;
  return decimal;
};

const GymInfoScreen = () => {
  const { isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [gym, setGym] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Reactive RTL detection based on current language
  const isRTL = i18n.locale === "ar";

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("MemberId");
        setUserId(id);
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchGymInfo = async () => {
      if (!userId) return;
      try {
        const API_URL = `https://gym.useitsmart.com/api/Gyms/getGymInfo?userId=${userId}`;
        const response = await fetch(API_URL, {
          headers: { Accept: "text/plain" },
        });
        if (!response.ok) throw new Error("Failed to fetch gym info");
        const data = await response.json();
        console.log("Gym data:", data);
        const latitude = data.latitude;
        const longitude = data.longitude;
        const validLat =
          latitude && Math.abs(latitude) <= 90 ? latitude : 31.963158;
        const validLon =
          longitude && Math.abs(longitude) <= 180 ? longitude : 35.930359;
        setGym({
          ...data,
          location: {
            latitude: validLat,
            longitude: validLon,
            address: data.location || "No address available",
          },
        });
      } catch (err) {
        console.error("Error fetching gym info:", err);
        Alert.alert("Error", "Failed to load gym information.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchGymInfo();
  }, [userId]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

  const openInMaps = async () => {
    if (!gym) return;

    const { latitude, longitude } = gym.location;
    const label = encodeURIComponent(gym.nameEn || "Gym Location");

    // ✅ Google Maps App URL (works if installed)
    const appUrl =
      Platform.OS === "ios"
        ? `comgooglemaps://?q=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

    // ✅ Fallback (browser Google Maps)
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);

      if (supported) {
        await Linking.openURL(appUrl); // opens Google Maps app
      } else {
        await Linking.openURL(webUrl); // fallback to browser
      }
    } catch (err) {
      console.error("Error opening maps:", err);
    }
  };

  // ✅ Helper: returns row direction style based on RTL
  const rowStyle = {
    flexDirection: (isRTL ? "row-reverse" : "row") as "row" | "row-reverse",
  };

  // ✅ Helper: returns text alignment style based on RTL
  const textAlign = {
    textAlign: (isRTL ? "right" : "left") as "right" | "left",
  };

  // ✅ Helper: icon spacing — flips marginLeft/marginRight
  const iconSpacing = {
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
  };

  if (isLoading) {
    return (
      <View style={[s.loader, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color="#0189ff" />
      </View>
    );
  }

  if (!gym) {
    return (
      <View style={[s.loader, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.muted, fontSize: 16 }}>
          {i18n.t("no_gym_data_found")}
        </Text>
      </View>
    );
  }

  const mapRegion = {
    latitude: parseFloat(gym.location.latitude),
    longitude: parseFloat(gym.location.longitude),
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
  const lat = parseFloat(gym.location.latitude);
  const lng = parseFloat(gym.location.longitude);

  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.bg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 🔹 Header - gradient stays consistent for branding */}
      <LinearGradient
        colors={[theme.headerGradientStart, theme.headerGradientEnd]}
        style={s.header}
      >
        <Image
          source={{ uri: `https://gym.useitsmart.com/${gym.gymPhotoUrl}` }}
          style={s.logo}
        />
        <Text style={s.gymName}>{gym.nameEn || "Unknown Gym"}</Text>
      </LinearGradient>

      {/* 🧾 Gym Info Card */}
      <View style={[s.infoCard, { backgroundColor: theme.cardBg }]}>
        {/* Location Row */}
        <View style={[s.infoRow, rowStyle]}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={24}
            color="#0189ff"
          />
          <View style={[s.textContainer, iconSpacing]}>
            <Text style={[s.label, textAlign]}>{i18n.t("location")}</Text>
            <Text style={[s.value, textAlign, { color: theme.ink }]}>
              {gym.location.address}
            </Text>
          </View>
        </View>

        {/* Phone Row */}
        <View style={[s.infoRow, rowStyle]}>
          <MaterialCommunityIcons
            name="phone-outline"
            size={24}
            color="#0189ff"
          />
          <View style={[s.textContainer, iconSpacing]}>
            <Text style={[s.label, textAlign]}>{i18n.t("phone")}</Text>
            <Text style={[s.value, textAlign, { color: theme.ink }]}>
              {gym.phoneNumber || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* 🕒 Gym Hours */}
      <View style={[s.hoursCard, { backgroundColor: theme.cardBg }]}>
        <Text style={[s.sectionTitle, textAlign]}>
          🕒 {i18n.t("gym_hours")}
        </Text>
        {gym.gymHours && gym.gymHours.length > 0 ? (
          gym.gymHours.map((item: any, index: number) => (
            <View key={index} style={[s.hourRow, rowStyle]}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#0189ff"
              />
              <Text
                style={[
                  s.dayText,
                  { marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 },
                  textAlign,
                  { color: theme.dayText },
                ]}
              >
                {formatDay(item.day)}
              </Text>
              <Text style={[s.timeText, textAlign, { color: theme.timeText }]}>
                {formatTime(item.fromHours)} – {formatTime(item.toHours)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[s.noHoursText, textAlign, { color: theme.muted }]}>
            {i18n.t("no_working_hours")}
          </Text>
        )}
      </View>

      {/* 🧑‍💼 Owner Info */}
      <View style={[s.ownerCard, { backgroundColor: theme.cardBg }]}>
        <Text style={[s.sectionTitle, textAlign]}>{i18n.t("gym_owner")}</Text>
        <View style={[s.ownerRow, rowStyle]}>
          <Image
            source={{
              uri: gym.ownerPhotoUrl || "https://via.placeholder.com/70",
            }}
            style={s.ownerPhoto}
          />
          <View
            style={{
              marginLeft: isRTL ? 0 : 15,
              marginRight: isRTL ? 15 : 0,
            }}
          >
            <Text style={[s.ownerName, textAlign, { color: theme.ownerName }]}>
              {gym.gymOwner || "Unknown"}
            </Text>
            <Text
              style={[s.ownerPhone, textAlign, { color: theme.ownerPhone }]}
            >
              {gym.phoneNumber || "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* 🗺️ Map Section */}
      <Text
        style={[
          s.mapTitle,
          {
            marginLeft: isRTL ? 0 : 25,
            marginRight: isRTL ? 25 : 0,
            textAlign: isRTL ? "right" : "left",
          },
        ]}
      >
        📍 {i18n.t("location_on_map")}
      </Text>
      <View style={s.mapCard}>
        {gym.location.latitude && gym.location.longitude ? (
          <MapView
            style={s.map}
            {...(Platform.OS === "ios"
              ? { initialRegion: mapRegion, region: mapRegion }
              : { region: mapRegion })}
          >
            {hasValidCoords && (
              <Marker
                coordinate={{ latitude: lat, longitude: lng }}
                title={gym.nameEn}
                description={gym.location.address}
              />
            )}
          </MapView>
        ) : (
          <View
            style={[
              s.mapUnavailable,
              { backgroundColor: theme.mapUnavailableBg },
            ]}
          >
            <Text
              style={[
                s.mapUnavailableText,
                { color: theme.mapUnavailableText },
              ]}
            >
              {i18n.t("map_not_available")}
            </Text>
          </View>
        )}
      </View>

      {/* 🔗 Open in Maps */}
      <TouchableOpacity
        style={[s.openMapButton, rowStyle]}
        onPress={openInMaps}
      >
        <MaterialCommunityIcons name="map-outline" size={22} color="#fff" />
        <Text
          style={[
            s.openMapText,
            {
              marginLeft: isRTL ? 0 : 8,
              marginRight: isRTL ? 8 : 0,
            },
          ]}
        >
          {i18n.t("open_in_maps")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center" },

    header: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 50,
      shadowColor: "#007bff",
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 5 },
      shadowRadius: 12,
      elevation: 8,
    },
    logo: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: "#fff",
      borderWidth: 4,
      borderColor: "#fff",
      marginBottom: 12,
    },
    gymName: {
      color: "#fff",
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: 0.5,
      textAlign: "center",
    },

    infoCard: {
      marginHorizontal: 20,
      marginVertical: 15,
      borderRadius: 18,
      padding: 20,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 3,
    },
    infoRow: { alignItems: "center", marginBottom: 18 },
    textContainer: { flex: 1 },
    label: { fontSize: 15, fontWeight: "700", color: "#0189ff" },
    value: { fontSize: 15, marginTop: 3 },

    hoursCard: {
      marginHorizontal: 20,
      borderRadius: 18,
      padding: 20,
      marginVertical: 15,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 3,
    },
    hourRow: {
      alignItems: "center",
      marginBottom: 14,
    },
    dayText: {
      fontSize: 15,
      fontWeight: "700",
      width: 70,
    },
    timeText: {
      fontSize: 15,
    },
    noHoursText: {
      fontSize: 14,
      fontStyle: "italic",
    },

    ownerCard: {
      marginHorizontal: 20,
      borderRadius: 18,
      padding: 20,
      marginVertical: 15,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#0189ff",
      marginBottom: 15,
    },
    ownerRow: { alignItems: "center" },
    ownerPhoto: { width: 70, height: 70, borderRadius: 35 },
    ownerName: { fontSize: 16, fontWeight: "700" },
    ownerPhone: { fontSize: 14, marginTop: 4 },

    mapTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#0189ff",
      marginBottom: 8,
    },
    mapCard: {
      marginHorizontal: 20,
      borderRadius: 18,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 5,
    },
    map: { width: "100%", height: 260 },
    mapUnavailable: {
      width: "100%",
      height: 260,
      justifyContent: "center",
      alignItems: "center",
    },
    mapUnavailableText: { fontSize: 15 },

    openMapButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0189ff",
      marginHorizontal: 50,
      marginTop: 25,
      marginBottom: 40,
      paddingVertical: 12,
      borderRadius: 30,
      shadowColor: "#0189ff",
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 6,
      elevation: 4,
    },
    openMapText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });

export default GymInfoScreen;
