import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useI18n } from "../hooks/useI18n"; // adjust the path if needed
import { useAppContext } from "../context"; // adjust the path if needed
import { handleGetToken } from "../helpers"; // adjust the path if needed

const API_BASE = "http://192.168.1.16/api";

type TicketStatus = "Open" | "Closed" | "Cancelled";

type WalletSaleTicket = {
  id: number;
  itemName: string;
  price: number;
  createdOn: string;
  status: TicketStatus;
  paidByMemberName?: string | null;
  paidByMemberPhone?: string | null;
  purchasedOn?: string | null;
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}, ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const getTheme = (dark: boolean) => ({
  background: dark ? "#0F172A" : "#F3F4F6",
  cardBg: dark ? "#1E293B" : "#FFFFFF",
  border: dark ? "#334155" : "#E5E7EB",
  textPrimary: dark ? "#F1F5F9" : "#111827",
  label: dark ? "#CBD5E1" : "#374151",
  textSecondary: dark ? "#94A3B8" : "#6B7280",
  textMuted: dark ? "#64748B" : "#9CA3AF",
  inputBg: dark ? "#0F172A" : "#FFFFFF",
  placeholder: dark ? "#64748B" : "#9CA3AF",
  currencyBg: dark ? "#0F172A" : "#F9FAFB",
  rowBorder: dark ? "#1E293B" : "#F3F4F6",
  refreshBg: dark ? "#1E293B" : "#FFFFFF",
});

const getStatusStyles = (
  dark: boolean,
): Record<TicketStatus, { bg: string; text: string }> => ({
  Open: dark
    ? { bg: "#1E3A5F", text: "#60A5FA" }
    : { bg: "#DBEAFE", text: "#2563EB" },
  Closed: dark
    ? { bg: "#14532D", text: "#4ADE80" }
    : { bg: "#DCFCE7", text: "#16A34A" },
  Cancelled: dark
    ? { bg: "#312E81", text: "#A5B4FC" }
    : { bg: "#E0E7FF", text: "#4F46E5" },
});

const translations = {
  title: { en: "Wallet Sales", ar: "مبيعات المحفظة" },
  subtitle: {
    en: "Create one open sale ticket for the gym. The next member purchase API call pays it from that member's wallet, then the ticket closes.",
    ar: "أنشئ تذكرة بيع مفتوحة واحدة للنادي. عملية الشراء القادمة للعضو ستدفع هذه التذكرة من محفظته، ثم يتم إغلاقها.",
  },
  openNewTicket: { en: "Open New Ticket", ar: "فتح تذكرة جديدة" },
  itemNote: { en: "Item / Note", ar: "الصنف / ملاحظة" },
  itemPlaceholder: { en: "Example: Water", ar: "مثال: ماء" },
  price: { en: "Price", ar: "السعر" },
  createTicket: { en: "Create Open Ticket", ar: "إنشاء تذكرة مفتوحة" },
  saleTickets: { en: "Sale Tickets", ar: "تذاكر البيع" },
  refresh: { en: "Refresh", ar: "تحديث" },
  noTickets: { en: "No sale tickets yet.", ar: "لا توجد تذاكر بيع بعد." },
  colId: { en: "#", ar: "#" },
  colItem: { en: "Item", ar: "الصنف" },
  colPrice: { en: "Price", ar: "السعر" },
  colCreated: { en: "Created", ar: "تاريخ الإنشاء" },
  colStatus: { en: "Status", ar: "الحالة" },
  colMember: { en: "Paid By Member", ar: "دفعها العضو" },
  colPurchased: { en: "Purchased", ar: "تاريخ الشراء" },
  colAction: { en: "Action", ar: "إجراء" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  missingItemTitle: { en: "Missing item", ar: "الصنف مفقود" },
  missingItemMsg: {
    en: "Please enter an item or note.",
    ar: "الرجاء إدخال الصنف أو ملاحظة.",
  },
  invalidPriceTitle: { en: "Invalid price", ar: "سعر غير صالح" },
  invalidPriceMsg: {
    en: "Please enter a valid price.",
    ar: "الرجاء إدخال سعر صحيح.",
  },
  errorTitle: { en: "Error", ar: "خطأ" },
  loadTicketsError: {
    en: "Could not load sale tickets.",
    ar: "تعذر تحميل تذاكر البيع.",
  },
  createTicketError: {
    en: "Could not create the ticket.",
    ar: "تعذر إنشاء التذكرة.",
  },
  cancelTicketTitle: { en: "Cancel ticket", ar: "إلغاء التذكرة" },
  no: { en: "No", ar: "لا" },
  yesCancel: { en: "Yes, cancel", ar: "نعم، إلغاء" },
  cancelTicketError: {
    en: "Could not cancel the ticket.",
    ar: "تعذر إلغاء التذكرة.",
  },
  statusOpen: { en: "Open", ar: "مفتوحة" },
  statusClosed: { en: "Closed", ar: "مغلقة" },
  statusCancelled: { en: "Cancelled", ar: "ملغاة" },
  jod: { en: "JOD", ar: "د.أ" },
} as const;

export default function GymEmployeeScreen() {
  const { isArabic } = useI18n();
  const { isDarkMode } = useAppContext();
  const arabic = isArabic();
  const theme = useMemo(() => getTheme(!isDarkMode), [isDarkMode]);
  const statusStyles = useMemo(
    () => getStatusStyles(!isDarkMode),
    [isDarkMode],
  );

  const t = (key: keyof typeof translations) =>
    translations[key][arabic ? "ar" : "en"];
  const statusLabel = (status: TicketStatus) =>
    status === "Open"
      ? t("statusOpen")
      : status === "Closed"
        ? t("statusClosed")
        : t("statusCancelled");

  const [tickets, setTickets] = useState<WalletSaleTicket[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [creating, setCreating] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const authHeaders = async () => {
    const token = await handleGetToken();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchMyPages = useCallback(async () => {
    try {
      const headers = await authHeaders();
      await fetch(`${API_BASE}/GymEmployees/my-pages`, { headers });
    } catch (err) {
      console.log("my-pages fetch error:", err);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoadingList(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/WalletSales`, { headers });
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      const data = await res.json();
      const list: WalletSaleTicket[] = Array.isArray(data)
        ? data
        : (data?.items ?? []);
      list.sort((a, b) => b.id - a.id);
      setTickets(list);
    } catch (err) {
      console.log("WalletSales fetch error:", err);
      Alert.alert(t("errorTitle"), t("loadTicketsError"));
    } finally {
      setLoadingList(false);
    }
  }, [arabic]);

  useEffect(() => {
    fetchMyPages();
    fetchTickets();
  }, [fetchMyPages, fetchTickets]);

  const onCreateTicket = async () => {
    if (!itemName.trim()) {
      Alert.alert(t("missingItemTitle"), t("missingItemMsg"));
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert(t("invalidPriceTitle"), t("invalidPriceMsg"));
      return;
    }

    setCreating(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/WalletSales`, {
        method: "POST",
        headers,
        body: JSON.stringify({ itemName: itemName.trim(), price: parsedPrice }),
      });
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      setItemName("");
      setPrice("");
      await fetchTickets();
    } catch (err) {
      console.log("Create ticket error:", err);
      Alert.alert(t("errorTitle"), t("createTicketError"));
    } finally {
      setCreating(false);
    }
  };

  const onCancelTicket = (ticket: WalletSaleTicket) => {
    const msg = arabic
      ? `هل تريد إلغاء التذكرة رقم ${ticket.id} (${ticket.itemName})؟`
      : `Cancel ticket #${ticket.id} (${ticket.itemName})?`;

    Alert.alert(t("cancelTicketTitle"), msg, [
      { text: t("no"), style: "cancel" },
      {
        text: t("yesCancel"),
        style: "destructive",
        onPress: async () => {
          setCancellingId(ticket.id);
          try {
            const headers = await authHeaders();
            const res = await fetch(
              `${API_BASE}/WalletSales/${ticket.id}/cancel`,
              {
                method: "POST",
                headers,
              },
            );
            if (!res.ok) throw new Error(`Failed with status ${res.status}`);
            await fetchTickets();
          } catch (err) {
            console.log("Cancel ticket error:", err);
            Alert.alert(t("errorTitle"), t("cancelTicketError"));
          } finally {
            setCancellingId(null);
          }
        },
      },
    ]);
  };

  const textAlign = arabic ? "right" : "left";
  const rowDir = arabic ? "row-reverse" : "row";

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { textAlign, color: theme.textPrimary }]}>
          {t("title")}
        </Text>
        <Text
          style={[styles.subtitle, { textAlign, color: theme.textSecondary }]}
        >
          {t("subtitle")}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <View style={[styles.cardHeaderRow, { flexDirection: rowDir }]}>
          <Text style={styles.ticketIcon}>🎫</Text>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {t("openNewTicket")}
          </Text>
        </View>

        <Text style={[styles.label, { textAlign, color: theme.label }]}>
          {t("itemNote")}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              textAlign,
              borderColor: theme.border,
              backgroundColor: theme.inputBg,
              color: theme.textPrimary,
            },
          ]}
          placeholder={t("itemPlaceholder")}
          placeholderTextColor={theme.placeholder}
          value={itemName}
          onChangeText={setItemName}
        />

        <Text
          style={[
            styles.label,
            { marginTop: 16, textAlign, color: theme.label },
          ]}
        >
          {t("price")}
        </Text>
        <View
          style={[
            styles.priceRow,
            { flexDirection: rowDir, borderColor: theme.border },
          ]}
        >
          <TextInput
            style={[styles.priceInput, { textAlign, color: theme.textPrimary }]}
            placeholder="0.50"
            placeholderTextColor={theme.placeholder}
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
          <View
            style={[
              styles.currencyBox,
              { backgroundColor: theme.currencyBg },
              arabic
                ? {
                    borderLeftWidth: 0,
                    borderRightWidth: 1,
                    borderRightColor: theme.border,
                  }
                : { borderLeftColor: theme.border },
            ]}
          >
            <Text style={[styles.currencyText, { color: theme.textPrimary }]}>
              {t("jod")}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, creating && styles.createButtonDisabled]}
          onPress={onCreateTicket}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.createButtonText}>+ {t("createTicket")}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <View style={[styles.ticketsHeaderRow, { flexDirection: rowDir }]}>
          <View style={[styles.cardHeaderRow, { flexDirection: rowDir }]}>
            <Text style={styles.ticketIcon}>📋</Text>
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {t("saleTickets")}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.refreshButton,
              { borderColor: theme.border, backgroundColor: theme.refreshBg },
            ]}
            onPress={fetchTickets}
          >
            <Text style={[styles.refreshText, { color: theme.textSecondary }]}>
              ⟳ {t("refresh")}
            </Text>
          </TouchableOpacity>
        </View>

        {loadingList ? (
          <ActivityIndicator style={{ marginVertical: 24 }} color="#F97316" />
        ) : tickets.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {t("noTickets")}
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            style={arabic ? styles.rtlFlip : undefined}
          >
            <View style={arabic ? styles.rtlFlip : undefined}>
              <View
                style={[
                  styles.tableHeaderRow,
                  {
                    borderBottomColor: theme.border,
                    flexDirection: isArabic() ? "row-reverse" : "row",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.th,
                    styles.colId,
                    { textAlign, color: theme.textSecondary },
                  ]}
                >
                  {t("colId")}
                </Text>
                <Text
                  style={[
                    styles.th,
                    styles.colItem,
                    { textAlign, color: theme.textSecondary },
                  ]}
                >
                  {t("colItem")}
                </Text>
                <Text
                  style={[
                    styles.th,
                    styles.colPrice,
                    { textAlign, color: theme.textSecondary },
                  ]}
                >
                  {t("colPrice")}
                </Text>
                <Text
                  style={[
                    styles.th,
                    styles.colDate,
                    { textAlign, color: theme.textSecondary },
                  ]}
                >
                  {t("colCreated")}
                </Text>
                <Text
                  style={[
                    styles.th,
                    styles.colStatus,
                    { textAlign, color: theme.textSecondary },
                  ]}
                >
                  {t("colStatus")}
                </Text>
                <Text
                  style={[
                    styles.th,
                    styles.colMember,
                    { textAlign, color: theme.textSecondary },
                  ]}
                >
                  {t("colMember")}
                </Text>
                <Text
                  style={[
                    styles.th,
                    styles.colDate,
                    { textAlign, color: theme.textSecondary },
                  ]}
                >
                  {t("colPurchased")}
                </Text>
                <Text
                  style={[
                    styles.th,
                    styles.colAction,
                    { textAlign, color: theme.textSecondary },
                  ]}
                >
                  {t("colAction")}
                </Text>
              </View>

              {tickets.map((tk) => {
                const badge = statusStyles[tk.status] ?? statusStyles.Open;
                return (
                  <View
                    key={tk.id}
                    style={[
                      styles.tableRow,
                      {
                        borderBottomColor: theme.rowBorder,
                        flexDirection: isArabic() ? "row-reverse" : "row",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.td,
                        styles.colId,
                        { textAlign, color: theme.textPrimary },
                      ]}
                    >
                      {tk.id}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.colItem,
                        { textAlign, color: theme.textPrimary },
                      ]}
                    >
                      {tk.itemName}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.colPrice,
                        { textAlign, color: theme.textPrimary },
                      ]}
                    >
                      {tk.price.toFixed(2)} {t("jod")}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.colDate,
                        { textAlign, color: theme.textPrimary },
                      ]}
                    >
                      {formatDateTime(tk.createdOn)}
                    </Text>
                    <View
                      style={[styles.colStatus, { justifyContent: "center" }]}
                    >
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badge.bg },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: badge.text }]}
                        >
                          {statusLabel(tk.status)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.colMember}>
                      <Text
                        style={[
                          styles.td,
                          { textAlign, color: theme.textPrimary },
                        ]}
                      >
                        {tk.paidByMemberName ?? "-"}
                      </Text>
                      {tk.paidByMemberPhone ? (
                        <Text
                          style={[
                            styles.tdMuted,
                            { textAlign, color: theme.textMuted },
                          ]}
                        >
                          {tk.paidByMemberPhone}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.td,
                        styles.colDate,
                        { textAlign, color: theme.textPrimary },
                      ]}
                    >
                      {formatDateTime(tk.purchasedOn)}
                    </Text>
                    <View
                      style={[styles.colAction, { justifyContent: "center" }]}
                    >
                      {tk.status === "Open" ? (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => onCancelTicket(tk)}
                          disabled={cancellingId === tk.id}
                        >
                          {cancellingId === tk.id ? (
                            <ActivityIndicator size="small" color="#DC2626" />
                          ) : (
                            <Text style={styles.cancelButtonText}>
                              {t("cancel")}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <Text style={{ color: theme.textMuted }}>-</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 20, paddingBottom: 60 },
  headerBlock: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeaderRow: {
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  ticketIcon: { fontSize: 18 },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  priceRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  currencyBox: {
    paddingHorizontal: 16,
    justifyContent: "center",
    borderLeftWidth: 1,
  },
  currencyText: { fontSize: 14, fontWeight: "600" },
  createButton: {
    backgroundColor: "#F97316",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { color: "#111827", fontWeight: "700", fontSize: 16 },
  ticketsHeaderRow: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshText: { fontSize: 13, fontWeight: "600" },
  emptyText: { textAlign: "center", paddingVertical: 24 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  th: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  td: { fontSize: 13 },
  tdMuted: { fontSize: 12, marginTop: 2 },
  colId: { width: 40 },
  colItem: { width: 100 },
  colPrice: { width: 90 },
  colDate: { width: 140 },
  colStatus: { width: 100 },
  colMember: { width: 130 },
  colAction: { width: 90 },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  cancelButton: {
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  cancelButtonText: { color: "#DC2626", fontWeight: "700", fontSize: 12 },
  rtlFlip: { transform: [{ scaleX: -1 }] },
});
