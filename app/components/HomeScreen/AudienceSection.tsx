import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../../context";
import { useI18n } from "../../hooks/useI18n";
import i18n from "../../localization";
import Colors from "../../constants/Colors";
import SectionTitle from "./SectionTitle";
import { LoadingIndicator } from "../LoadingIndicator";

const AudienceSection: React.FC = () => {
  const { getDirection } = useI18n();
  const { guestMode, expoPushToken } = useAppContext();

  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // useEffect(() => {
  //   const fetchMemberships = async () => {
  //     try {
  //       setLoading(true);
  //       const token = await AsyncStorage.getItem("authToken");
  //       const MemberId = await AsyncStorage.getItem("MemberId");

  //       const url = `http://192.168.1.16/api/MemberShips/currentMembersForMember?memberId=${MemberId}`;
  //       console.log("📡 Fetching:", url);

  //       const res = await fetch(url, {
  //         headers: {
  //           Accept: "application/json",
  //           ...(token ? { Authorization: `Bearer ${token}` } : {}),
  //         },
  //       });

  //       if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  //       const result = await res.json();
  //       console.log("🔍 API Response:", result);

  //       if (typeof result === "number") setMemberCount(result);
  //       else if (Array.isArray(result)) setMemberCount(result.length);
  //       else if (result && result.count) setMemberCount(result.count);
  //       else setMemberCount(0);
  //     } catch (error) {
  //       console.error("❌ Error:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchMemberships();

  //  
    
  // }, []);
  
   // Get push token from AsyncStorage or context
(async () => {
      const storedToken = await AsyncStorage.getItem("expoPushToken");
      setPushToken(storedToken || expoPushToken);
    })();

  // if (guestMode) {
  //   return (
  //     <View style={styles.guestContainer}>
  //       <Ionicons name="lock-closed-outline" size={40} color="#777" />
  //       <Text style={styles.guestText}>
  //         {i18n.t("members_only_section")}
  //       </Text>
  //     </View>
  //   );
  // }

  return (
    <View style={styles.container}>
      {/* <SectionTitle title={i18n.t("audience_title")} />

      {loading ? (
        <LoadingIndicator isLoading={true} />
      ) : memberCount === null ? (
        <Text style={styles.noDataText}>{i18n.t("no_memberships_found")}</Text>
      ) : (
        <>
          <View style={[styles.wrapper, getDirection()]}>
            <View style={styles.iconWrapper}>
              <Image
                source={require("../../assets/images/audience-section-icon.png")}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.subTitle}>{i18n.t("current_members")}</Text>
              <Text style={styles.detail}>{memberCount}</Text>
            </View>
          </View> */}

          {/* Display Expo Push Token */}
          {/* {pushToken && (
            <View style={[styles.wrapper, getDirection(), { backgroundColor: "#FFF5E6" }]}>
              <Text style={styles.subTitle}>Expo Push Token:</Text>
              <Text selectable style={styles.detail}>{pushToken}</Text>
            </View>
          )} */}
        {/* </>
      )} */}
    </View>
  );
};

export default AudienceSection;

const styles = StyleSheet.create({
  container: { paddingTop: 25 },
  wrapper: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#1575A980",
    backgroundColor: "#E8F1F6",
    marginBottom: 10,
  },
  subTitle: { fontSize: 16, color: Colors.black, fontFamily: "SF-Semibold" },
  detail: { fontSize: 14, color: Colors.black, fontFamily: "SF-Medium" },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  guestContainer: {
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f4",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  guestText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "SF-Medium",
  },
  noDataText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontFamily: "SF-Medium",
  },
});
