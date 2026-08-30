import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import i18n from "../../localization";
import { handleGetToken } from "../../helpers";

interface WalletData {
  balance?: number;
  walletBalance?: number;
  credit?: number;
  currency?: string;
  points?: number;
  loyaltyPoints?: number;
  expiryDate?: string;
  packageName?: string;
  [key: string]: any;
}

interface IProps {
  refreshTrigger?: number;
  theme: {
    bg: string;
    surface: string;
    border: string;
    ink: string;
    muted: string;
    accent: string;
    orange: string;
    radius: { sm: number; md: number; lg: number; xl: number; xxl: number };
  };
  isRTL: boolean;
}

export default function WalletSection({
  refreshTrigger,
  theme,
  isRTL,
}: IProps) {
  const [wallet, setWallet] = React.useState<WalletData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const navigation = useNavigation<any>();

  const fetchWallet = React.useCallback(async () => {
    try {
      setLoading(true);
      const memberId = await AsyncStorage.getItem("MemberId");
      if (!memberId) {
        setWallet(null);
        return;
      }
      const token = await handleGetToken();
      if (!token) {
        console.log("⚠️ [WalletSection] no auth token, skipping wallet fetch");
        setWallet(null);
        return;
      }

      const response = await fetch(
        "http://192.168.1.16/api/MemberWallet/me",
        {
          method: "GET",
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.warn(
          "⚠️ [WalletSection] wallet fetch failed:",
          response.status,
        );
        setWallet(null);
        return;
      }

      const data = await response.json();
      console.log("💳 [WalletSection] wallet data:", data);
      setWallet(data);
    } catch (error) {
      console.error("❌ [WalletSection] fetchWallet error:", error);
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWallet();
  }, [fetchWallet, refreshTrigger]);

  const s = React.useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return (
      <View style={[s.card, s.centerContent]}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    );
  }

  if (!wallet) return null;

  const balance = wallet.balance ?? wallet.walletBalance ?? wallet.credit ?? 0;
  const currency = wallet.currency || "JOD";
  const points = wallet.points ?? wallet.loyaltyPoints;

  return (
    <View style={{ marginTop: 24 }}>
      <View
        style={{
          flexDirection: isRTL ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginLeft: 5,
          marginRight: 5,
          marginBottom: 12,
        }}
      >
        <Text style={s.sectionTitle}>{i18n.t("my_wallet") || "My Wallet"}</Text>
        <Pressable
          onPress={() => navigation.navigate("WalletHistory")}
          style={({ pressed }) => ({
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            gap: 3,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={s.historyLink}>
            {i18n.t("view_history1") || "History"}
          </Text>
          <Ionicons
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={14}
            color={theme.muted}
          />
        </Pressable>
      </View>

      <LinearGradient
        colors={[theme.ink, "#232014"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.card}
      >
        <View
          style={[
            s.blob,
            { top: -30, right: -20, backgroundColor: theme.orange + "22" },
          ]}
        />
        <View
          style={[
            s.blob,
            { bottom: -40, left: -30, backgroundColor: theme.orange + "18" },
          ]}
        />

        <View
          style={{
            flexDirection: isRTL ? "row-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={s.iconBadge}>
            <Ionicons name="wallet" size={20} color={theme.orange} />
          </View>
          {wallet.packageName && (
            <View style={s.packagePill}>
              <Text style={s.packagePillText}>{wallet.packageName}</Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: 18 }}>
          <Text
            style={[s.balanceLabel, { textAlign: isRTL ? "right" : "left" }]}
          >
            {i18n.t("current_balance") || "Current Balance"}
          </Text>
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "baseline",
              gap: 6,
              marginTop: 4,
            }}
          >
            <Text style={s.balanceValue}>{Number(balance).toFixed(2)}</Text>
            <Text style={s.balanceCurrency}>{currency}</Text>
          </View>
        </View>

        {(points !== undefined || wallet.expiryDate) && (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              gap: 10,
              marginTop: 18,
            }}
          >
            {points !== undefined && (
              <View style={s.statChip}>
                <Ionicons name="star" size={13} color={theme.orange} />
                <Text style={s.statChipText}>
                  {points} {i18n.t("points") || "pts"}
                </Text>
              </View>
            )}
            {wallet.expiryDate && (
              <View style={s.statChip}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={theme.orange}
                />
                <Text style={s.statChipText}>
                  {new Date(wallet.expiryDate).toLocaleDateString(
                    isRTL ? "ar-EG" : "en-US",
                    { month: "short", day: "numeric" },
                  )}
                </Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const createStyles = (theme: IProps["theme"]) =>
  StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      color: theme.ink,
      letterSpacing: -0.3,
      fontWeight: "700",
    },
    historyLink: {
      fontSize: 13,
      color: theme.muted,
      fontWeight: "600",
    },
    card: {
      borderRadius: theme.radius.xl,
      padding: 20,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    centerContent: {
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
    },
    blob: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: "#FFFFFF14",
      alignItems: "center",
      justifyContent: "center",
    },
    packagePill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: "#FFFFFF14",
    },
    packagePillText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#F0F0F0",
      letterSpacing: 0.3,
    },
    balanceLabel: {
      fontSize: 12,
      color: "#B8B8B8",
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    balanceValue: {
      fontSize: 36,
      fontWeight: "800",
      color: "#F5F5F5",
      letterSpacing: -0.5,
    },
    balanceCurrency: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.orange,
    },
    statChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: "#FFFFFF10",
    },
    statChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#E8E8E8",
    },
  });
