import * as React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "../localization";
import { useAppContext } from "../context";
import { handleGetToken } from "../helpers";

interface SaleHistoryItem {
  ticketId: number;
  itemName: string;
  price: number;
  purchasedOn: string;
}

const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#F5F0E8",
  surface: dark ? "#1E1E1E" : "#FDFAF5",
  border: dark ? "#2C2C2C" : "#E8E0D0",
  ink: dark ? "#F0F0F0" : "#1A1A1A",
  muted: dark ? "#888888" : "#8A8070",
  accent: "#E8742A",
});

export default function WalletHistoryScreen() {
  const { isDarkMode } = useAppContext();
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);
  const isRTL = i18n.locale === "ar";

  const [history, setHistory] = React.useState<SaleHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchHistory = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const token = await handleGetToken();
      if (!token) {
        console.log("⚠️ [WalletHistoryScreen] no auth token, skipping fetch");
        setHistory([]);
        return;
      }

      const response = await fetch(
        "https://gym.useitsmart.com/api/MemberWallet/me/sales-history",
        {
          method: "GET",
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.warn("⚠️ [WalletHistoryScreen] fetch failed:", response.status);
        setHistory([]);
        return;
      }

      const data = await response.json();
      // 👇 this endpoint returns a raw array, not { result: [...] } like
      // the other gym.useitsmart.com endpoints — handled directly here
      console.log("🧾 [WalletHistoryScreen] sales history:", data);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ [WalletHistoryScreen] fetchHistory error:", error);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalSpent = history.reduce((sum, item) => sum + (item.price || 0), 0);

  if (loading) {
    return (
      <View style={[s.container, s.centerContent]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {history.length > 0 && (
        <View
          style={[
            s.summaryCard,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={s.summaryLabel}>
              {i18n.t("total_transactions") || "Transactions"}
            </Text>
            <Text style={s.summaryValue}>{history.length}</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={{ flex: 1 }}>
            <Text style={s.summaryLabel}>
              {i18n.t("total_spent") || "Total Spent"}
            </Text>
            <Text style={s.summaryValue}>{totalSpent.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={history}
        keyExtractor={(item) => item.ticketId.toString()}
        contentContainerStyle={{
          padding: 16,
          paddingTop: history.length > 0 ? 4 : 16,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchHistory(true)}
            colors={[theme.ink]}
            tintColor={theme.ink}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={28} color={theme.muted} />
            </View>
            <Text style={s.emptyText}>
              {i18n.t("no_wallet_history") || "No transactions yet"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[s.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          >
            <View style={s.iconWrap}>
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={theme.accent}
              />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text
                style={[s.itemName, { textAlign: isRTL ? "right" : "left" }]}
                numberOfLines={1}
              >
                {item.itemName}
              </Text>
              <Text
                style={[s.itemDate, { textAlign: isRTL ? "right" : "left" }]}
              >
                {formatDate(item.purchasedOn)} · {formatTime(item.purchasedOn)}
              </Text>
            </View>
            <Text style={s.itemPrice}>-{Number(item.price).toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    centerContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    summaryCard: {
      alignItems: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      marginHorizontal: 16,
      marginTop: 16,
      paddingVertical: 16,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.muted,
      fontWeight: "600",
      textAlign: "center",
    },
    summaryValue: {
      fontSize: 20,
      color: theme.ink,
      fontWeight: "800",
      textAlign: "center",
      marginTop: 4,
    },
    summaryDivider: {
      width: 1,
      height: 34,
      backgroundColor: theme.border,
    },
    row: {
      alignItems: "center",
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: theme.accent + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    itemName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.ink,
    },
    itemDate: {
      fontSize: 12,
      color: theme.muted,
      marginTop: 2,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.ink,
    },
    emptyWrap: {
      alignItems: "center",
      paddingVertical: 48,
      gap: 10,
    },
    emptyIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      fontSize: 14,
      color: theme.muted,
      fontWeight: "600",
    },
  });
