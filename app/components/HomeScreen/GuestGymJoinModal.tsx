import * as React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import Colors from "../../constants/Colors";
import { useAppContext } from "../../context";
import { useI18n } from "../../hooks/useI18n";
import { handleGetToken } from "../../helpers";
// 👇 adjust this path to wherever SweetAlert.tsx actually lives in this project
import SweetAlert, { SweetAlertButton, SweetAlertType } from "../SweetAlert";

const API_BASE_URL = "http://192.168.1.16/api";
const STORAGE_KEY = "GuestGymJoinKey";

interface StoredKeyData {
  key: string;
  expiresOn: string;
  expiresInMinutes: number;
  oneTimeUse: boolean;
}

interface GuestGymRequest {
  requestId: number;
  status: string;
  createdOn: string;
  expiresOn: string;
  gymId: number;
  gymNameEn: string;
  gymNameAr: string;
  gymPhotoUrl: string;
  subscriptionId: number;
  subscriptionName: string;
  startDate: string;
  expiryDate: string;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  amountPaid: number;
  outstandingAmount: number;
  maxFreezingCount: number;
  freezePeriodDays: number;
}

type ModalStep = "loading" | "generate" | "keyResult" | "requestDetail";

// Backend timestamps are meant to be read as literal (gym-server) wall-clock
// time, but sometimes arrive with a trailing "Z"/offset as if they were UTC.
// Strip any timezone marker before parsing so no timezone conversion is
// applied — used consistently for both display and expiry comparisons.
const parseServerDate = (iso: string) => {
  const literal = iso.replace(/Z$/i, "").replace(/[+-]\d{2}:\d{2}$/, "");
  return new Date(literal);
};

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#1E1E1E" : Colors.white,
  ink: dark ? "#F0F0F0" : Colors.black,
  muted: dark ? "#888888" : Colors.gray,
  surface: dark ? "#2C2C2C" : Colors.backgroundBlue + "10",
});

export default function GuestGymJoinModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { isDarkMode, handleLogout, setGuestMode } = useAppContext();
  const { isArabic } = useI18n();
  const rtl = isArabic();
  const navigation = useNavigation();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);

  const [step, setStep] = React.useState<ModalStep>("loading");
  const [storedKeyData, setStoredKeyData] =
    React.useState<StoredKeyData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeRequest, setActiveRequest] =
    React.useState<GuestGymRequest | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    type: SweetAlertType;
    title: string;
    message?: string;
    buttons?: SweetAlertButton[];
  }>({ visible: false, type: "info", title: "" });

  const showAlert = (
    type: SweetAlertType,
    title: string,
    message?: string,
    buttons?: SweetAlertButton[],
  ) => setAlertConfig({ visible: true, type, title, message, buttons });

  const hideAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  const clearStoredKey = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setStoredKeyData(null);
  };

  // ─── Load stored key state whenever the modal opens ──────────────────────
  React.useEffect(() => {
    if (!visible) return;

    setIsCopied(false);

    const loadState = async () => {
      setStep("loading");
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (raw) {
          const parsed: StoredKeyData = JSON.parse(raw);

          // If the key already expired (checked against the saved
          // expiresOn) and was never used, clear it so the guest doesn't
          // get stuck — let them generate a fresh one instead.
          if (parseServerDate(parsed.expiresOn).getTime() < Date.now()) {
            await clearStoredKey();
            setStep("generate");
          } else {
            setStoredKeyData(parsed);
            setStep("keyResult");
          }
        } else {
          setStoredKeyData(null);
          setStep("generate");
        }
      } catch (error) {
        console.error("❌ Error reading guest join key:", error);
        setStep("generate");
      }
    };

    loadState();
  }, [visible]);

  // ─── Live-watch the stored key's expiry while it's on screen ─────────────
  // If the modal stays open past expiresOn, flip to "Generate Key"
  // automatically instead of waiting for the user to close and reopen it.
  React.useEffect(() => {
    if (!visible || step !== "keyResult" || !storedKeyData) return;

    const expiryTime = parseServerDate(storedKeyData.expiresOn).getTime();
    const msRemaining = expiryTime - Date.now();

    if (msRemaining <= 0) {
      clearStoredKey().then(() => setStep("generate"));
      return;
    }

    const timer = setTimeout(() => {
      clearStoredKey().then(() => setStep("generate"));
    }, msRemaining);

    return () => clearTimeout(timer);
  }, [visible, step, storedKeyData]);

  // ─── Copy key to clipboard ─────────────────────────────────────────────
  const handleCopyKey = async () => {
    if (!storedKeyData?.key) return;
    try {
      await Clipboard.setStringAsync(storedKeyData.key);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (error) {
      console.error("❌ Error copying key:", error);
    }
  };

  // ─── Fetch my requests ─────────────────────────────────────────────────
  const handleFetchMyRequests = async () => {
    setIsSubmitting(true);
    try {
      const token = await handleGetToken();

      const response = await fetch(`${API_BASE_URL}/GuestGymJoin/my-requests`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          "❌ my-requests failed:",
          response.status,
          await response.text(),
        );
        showAlert(
          "error",
          isArabic() ? "حدث خطأ" : "Something went wrong",
          isArabic()
            ? "تعذر تحميل الطلبات، حاول مرة أخرى."
            : "Couldn't load your requests. Please try again.",
        );
        return;
      }

      const data: GuestGymRequest[] = await response.json();

      if (data.length > 0) {
        setActiveRequest(data[0]);
        setStep("requestDetail");
      } else {
        showAlert(
          "info",
          isArabic() ? "لا يوجد طلب" : "No pending request",
          isArabic()
            ? "لم يتم العثور على طلب انضمام مرتبط بهذا الرمز بعد."
            : "No join request has been created for this key yet.",
        );
      }
    } catch (error) {
      console.error("❌ Error fetching guest join requests:", error);
      showAlert(
        "error",
        isArabic() ? "حدث خطأ" : "Something went wrong",
        isArabic()
          ? "تعذر تحميل الطلبات، تحقق من الاتصال بالإنترنت."
          : "Couldn't load your requests. Check your internet connection.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Generate key ──────────────────────────────────────────────────────
  const handleGenerateKey = async () => {
    setIsSubmitting(true);
    try {
      const token = await handleGetToken();

      const response = await fetch(
        `${API_BASE_URL}/GuestGymJoin/generate-key`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        let errorBody: any = null;
        try {
          errorBody = await response.json();
        } catch {
          // response had no JSON body — ignore
        }

        console.error("❌ generate-key failed:", response.status, errorBody);

        // 409 = a join request already exists server-side for this guest
        // (e.g. local storage was cleared/reinstalled after the key was
        // already handed to the front desk). Route straight into checking
        // that existing request instead of showing a dead-end error.
        if (response.status === 409) {
          showAlert(
            "info",
            isArabic()
              ? "لديك طلب قيد الانتظار"
              : "You already have a pending request",
            isArabic()
              ? "لديك طلب انضمام قيد الانتظار بالفعل. سنعرضه لك الآن."
              : "You already have a pending join request. Let's pull it up.",
            [
              {
                text: isArabic() ? "حسنًا" : "OK",
                onPress: () => {
                  hideAlert();
                  handleFetchMyRequests();
                },
              },
            ],
          );
          return;
        }

        showAlert(
          "error",
          isArabic() ? "حدث خطأ" : "Something went wrong",
          isArabic()
            ? "تعذر إنشاء الرمز، حاول مرة أخرى."
            : "Couldn't generate the key. Please try again.",
        );
        return;
      }

      const data: StoredKeyData = await response.json();

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStoredKeyData(data);
      setStep("keyResult");
    } catch (error) {
      console.error("❌ Error generating guest join key:", error);
      showAlert(
        "error",
        isArabic() ? "حدث خطأ" : "Something went wrong",
        isArabic()
          ? "تعذر إنشاء الرمز، تحقق من الاتصال بالإنترنت."
          : "Couldn't generate the key. Check your internet connection.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Log the guest out after a confirmed join ─────────────────────────
  const handlePostConfirmLogout = async () => {
    try {
      await handleLogout();
      await AsyncStorage.clear();
      setGuestMode?.(true);

      hideAlert();

      // GuestGymJoinModal is rendered from inside Header.tsx, which itself
      // needs two levels of getParent() to reach the root Stack navigator
      // (see Header.tsx's own SignUp redirect) — one level only reaches an
      // intermediate Tab/Drawer navigator with no "Login" route, so the
      // reset silently fails there.
      const rootNavigation = navigation.getParent()?.getParent();

      rootNavigation?.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }),
      );
    } catch (error) {
      console.error("❌ Error logging out after confirm:", error);
      hideAlert();
    }
  };
  // ─── Confirm / Reject ──────────────────────────────────────────────────
  const handleConfirmOrReject = async (action: "confirm" | "reject") => {
    if (!activeRequest) return;

    setIsSubmitting(true);
    try {
      const token = await handleGetToken();

      const response = await fetch(
        `${API_BASE_URL}/GuestGymJoin/${activeRequest.requestId}/${action}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.error(
          `❌ ${action} failed:`,
          response.status,
          await response.text(),
        );
        showAlert(
          "error",
          isArabic() ? "حدث خطأ" : "Something went wrong",
          isArabic()
            ? "تعذر إتمام العملية، حاول مرة أخرى."
            : "Couldn't complete the action. Please try again.",
        );
        return;
      }

      // Both confirm and reject close out this key's lifecycle
      await clearStoredKey();
      setActiveRequest(null);

      // Close the join modal FIRST so only one native <Modal> is ever open
      // at a time — stacking this Modal with SweetAlert's own internal
      // Modal causes SweetAlert to silently fail to show (RN limitation,
      // especially on Android).
      onClose();

      if (action === "confirm") {
        // Joining as a real member invalidates the guest session — walk the
        // user through it instead of silently logging them out mid-flow.
        showAlert(
          "success",
          isArabic() ? "تم الانضمام" : "You've joined",
          isArabic()
            ? "تم تأكيد انضمامك إلى النادي بنجاح. سيتم الآن تسجيل خروجك، الرجاء تسجيل الدخول من جديد كعضو."
            : "You've successfully joined the gym. Your account will now be logged out — please log back in as a member.",
          [
            {
              text: isArabic() ? "حسنًا" : "OK",
              onPress: handlePostConfirmLogout,
            },
          ],
        );
      } else {
        showAlert(
          "success",
          isArabic() ? "تم الرفض" : "Request rejected",
          isArabic()
            ? "تم رفض طلب الانضمام."
            : "The join request was rejected.",
          [
            {
              text: isArabic() ? "تم" : "Done",
              onPress: () => {
                hideAlert();
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error(`❌ Error on ${action}:`, error);
      showAlert(
        "error",
        isArabic() ? "حدث خطأ" : "Something went wrong",
        isArabic()
          ? "تعذر إتمام العملية، تحقق من الاتصال بالإنترنت."
          : "Couldn't complete the action. Check your internet connection.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatExpiry = (iso: string) => {
    try {
      return parseServerDate(iso).toLocaleString(isArabic() ? "ar" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      });
    } catch {
      return iso;
    }
  };

  const gymName = (req: GuestGymRequest) =>
    (isArabic() ? req.gymNameAr : req.gymNameEn) || req.gymNameEn;

  return (
    <>
      <Modal
        transparent
        animationType="slide"
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.box, { backgroundColor: theme.bg }]}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={theme.muted}
              />
            </TouchableOpacity>

            {/* ── Loading ─────────────────────────────────────────── */}
            {step === "loading" && (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            )}

            {/* ── No key yet: offer to generate one ─────────────────── */}
            {step === "generate" && (
              <View>
                <MaterialCommunityIcons
                  name="key-outline"
                  size={40}
                  color={Colors.primary}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.title,
                    { color: theme.ink },
                    rtl && styles.textRTL,
                  ]}
                >
                  {isArabic() ? "انضم إلى نادٍ رياضي" : "Join a gym"}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.muted },
                    rtl && styles.textRTL,
                  ]}
                >
                  {isArabic()
                    ? "أنشئ رمزًا مؤقتًا وأعطه لموظف الاستقبال في النادي لبدء طلب انضمامك."
                    : "Generate a temporary key and give it to the gym's front desk to start your join request."}
                </Text>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleGenerateKey}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {isArabic() ? "إنشاء رمز" : "Generate Key"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── Key exists (just generated or from a previous visit) ── */}
            {step === "keyResult" && storedKeyData && (
              <View>
                <MaterialCommunityIcons
                  name="key-outline"
                  size={40}
                  color={Colors.primary}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.title,
                    { color: theme.ink },
                    rtl && styles.textRTL,
                  ]}
                >
                  {isArabic() ? "رمزك جاهز" : "Your key is ready"}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.muted },
                    rtl && styles.textRTL,
                  ]}
                >
                  {isArabic()
                    ? "أعط هذا الرمز لموظف الاستقبال في النادي لإتمام طلب انضمامك."
                    : "Give this key to the gym's front desk to complete your join request."}
                </Text>

                <View
                  style={[styles.keyBox, { backgroundColor: theme.surface }]}
                >
                  <Text style={styles.keyText}>{storedKeyData.key}</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={handleCopyKey}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons
                      name={isCopied ? "check" : "content-copy"}
                      size={20}
                      color={isCopied ? "#2ECC71" : Colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.expiryText,
                    { color: theme.muted },
                    rtl && styles.textRTL,
                  ]}
                >
                  {isArabic()
                    ? `تنتهي صلاحية الرمز خلال ${storedKeyData.expiresInMinutes} دقيقة (${formatExpiry(storedKeyData.expiresOn)})`
                    : `Expires in ${storedKeyData.expiresInMinutes} minutes (${formatExpiry(storedKeyData.expiresOn)})`}
                </Text>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleFetchMyRequests}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {isArabic() ? "طلبي" : "My Request"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ── Show request details + confirm/reject ─────────────── */}
            {step === "requestDetail" && activeRequest && (
              <View>
                <Text
                  style={[
                    styles.title,
                    { color: theme.ink },
                    rtl && styles.textRTL,
                  ]}
                >
                  {isArabic() ? "تأكيد الانضمام" : "Confirm your join request"}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.muted },
                    rtl && styles.textRTL,
                  ]}
                >
                  {isArabic()
                    ? `هل تريد الانضمام إلى ${gymName(activeRequest)}؟`
                    : `Do you want to join ${gymName(activeRequest)}?`}
                </Text>

                <View
                  style={[
                    styles.detailsBox,
                    { backgroundColor: theme.surface },
                  ]}
                >
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.muted }]}>
                      {isArabic() ? "الاشتراك" : "Subscription"}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.ink }]}>
                      {activeRequest.subscriptionName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.muted }]}>
                      {isArabic() ? "السعر" : "Price"}
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.ink }]}>
                      {activeRequest.finalPrice}
                    </Text>
                  </View>
                  {activeRequest.outstandingAmount > 0 && (
                    <View style={styles.detailRow}>
                      <Text
                        style={[styles.detailLabel, { color: theme.muted }]}
                      >
                        {isArabic() ? "المبلغ المتبقي" : "Outstanding"}
                      </Text>
                      <Text style={[styles.detailValue, { color: theme.ink }]}>
                        {activeRequest.outstandingAmount}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleConfirmOrReject("reject")}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.rejectBtnText}>
                      {isArabic() ? "رفض" : "Reject"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.confirmBtn]}
                    onPress={() => handleConfirmOrReject("confirm")}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.confirmBtnText}>
                        {isArabic() ? "تأكيد" : "Confirm"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <SweetAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        isDarkMode={!!isDarkMode}
        isRTL={rtl}
        onRequestClose={hideAlert}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  box: {
    borderRadius: 20,
    padding: 24,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  icon: { alignSelf: "center", marginBottom: 10 },
  title: {
    fontSize: 18,
    fontFamily: "SF-Semibold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "SF-Regular",
    textAlign: "center",
    marginBottom: 20,
  },
  textRTL: { textAlign: "right", writingDirection: "rtl" },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: Colors.white,
    fontFamily: "SF-Semibold",
    fontSize: 15,
  },
  keyBox: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  keyText: {
    fontSize: 26,
    fontFamily: "SF-Semibold",
    color: Colors.primary,
    letterSpacing: 2,
  },
  copyBtn: {
    padding: 4,
  },
  expiryText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },
  detailsBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  detailLabel: { fontSize: 13, fontFamily: "SF-Regular" },
  detailValue: { fontSize: 13, fontFamily: "SF-Semibold" },
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  rejectBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#f80303",
  },
  rejectBtnText: { color: "#f80303", fontFamily: "SF-Semibold", fontSize: 15 },
  confirmBtn: { backgroundColor: Colors.primary },
  confirmBtnText: {
    color: Colors.white,
    fontFamily: "SF-Semibold",
    fontSize: 15,
  },
});
