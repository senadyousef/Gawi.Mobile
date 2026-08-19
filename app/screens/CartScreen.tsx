import * as React from "react";
import i18n from "../localization";
import { IcartItem } from "../types";
import { width } from "../constants";
import { useAppContext } from "../context";
import { StatusBar } from "expo-status-bar";
import { defaultErrorToast, handleGetToken } from "../helpers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomButton from "../components/BottomButton";
import CartItemCard from "../components/CartScreen/CartItemCard";
import { LoadingIndicator } from "../components/LoadingIndicator";
import {
  FlatList,
  StyleSheet,
  View as RNView,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { ListEmptyComponent } from "../components/ListEmptyComponent";
import { Text, TouchableOpacity } from "../components/overridedComponents";

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#FFFFFF",
  modalBg: dark ? "#1E1E1E" : "#FFFFFF",
  textColor: dark ? "#FFFFFF" : "#000000",
  inputBg: dark ? "#2C2C2C" : "#F5F5F5",
  borderColor: dark ? "#444444" : "#DDDDDD",
});

interface IProfileDefaults {
  nameEn: string;
  nameAr: string;
  email: string;
  phoneNumber: string;
}

const CartScreen: React.FC = () => {
  const { cartId, setCartId, handleLogout, setTotalCartItems, isDarkMode } =
    useAppContext();

  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [cartItems, setCartItems] = React.useState<IcartItem[]>([]);
  const [isModalVisible, setIsModalVisible] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Form state
  const [fullName, setFullName] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");
  const [location, setLocation] = React.useState<string>("");

  // Profile defaults, fetched once so checkout can prefill from them
  const [profileDefaults, setProfileDefaults] =
    React.useState<IProfileDefaults | null>(null);

  const fetchCartItems = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      const token = await handleGetToken();
      const res = await fetch(
        `https://gawifit.com/api/Cart/getCartWithItems?cartId=${cartId}`,
        {
          method: "GET",
          headers: {
            Accept: "*/*",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("cartId", cartId);
      if (!res.ok) {
        if (res.status === 401) return handleLogout();
        return defaultErrorToast();
      }

      const data = await res.json();
      console.log("Cart data:", data);

      if (data.cartId && data.cartId !== cartId) {
        setCartId(data.cartId);
      }

      setCartItems(
        Array.isArray(data.listCartItemDto) ? data.listCartItemDto : [],
      );
      setTotalCartItems(data.listCartItemDto?.length ?? 0);
    } catch (err) {
      defaultErrorToast();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Same membership endpoint MyProfileScreen uses — just pulled for
  // name/email/phone so the checkout form doesn't start blank.
  const fetchProfileDefaults = async () => {
    try {
      const MemberId = await AsyncStorage.getItem("MemberId");
      if (!MemberId) return;

      const res = await fetch(
        `https://gawifit.com/api/MemberShips/MemberShipsforuser/${MemberId}`,
        { method: "GET", headers: { accept: "application/json" } },
      );
      if (!res.ok) return;

      const data = await res.json();
      setProfileDefaults({
        nameEn: data.nameEn || "",
        nameAr: data.nameAr || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
      });
    } catch (err) {
      // Silent — checkout form just falls back to empty fields
      console.log("Failed to fetch profile defaults for checkout:", err);
    }
  };

  React.useEffect(() => {
    fetchCartItems();
  }, [cartId]);

  React.useEffect(() => {
    fetchProfileDefaults();
  }, []);

  const handleRefresh = React.useCallback(() => {
    fetchCartItems(true);
  }, [cartId]);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    // Prefill from profile, but only fields the user hasn't already typed into
    if (profileDefaults) {
      setFullName((prev) =>
        prev.trim()
          ? prev
          : profileDefaults.nameEn || profileDefaults.nameAr || "",
      );
      setEmail((prev) => (prev.trim() ? prev : profileDefaults.email));
      setPhone((prev) => (prev.trim() ? prev : profileDefaults.phoneNumber));
    }

    setIsModalVisible(true);
  };

  const handleSubmitOrder = async () => {
    // Validate form
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !location.trim()
    ) {
      Alert.alert(i18n.t("error"), i18n.t("please_fill_all_fields"));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(i18n.t("error"), i18n.t("invalid_email_format"));
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await handleGetToken();

      const orderData = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        cartId: parseInt(cartId),
      };

      console.log("Submitting order:", orderData);

      const response = await fetch("https://gawifit.com/api/Orders/checkout", {
        method: "POST",
        headers: {
          accept: "text/plain",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content
      const responseText = await response.text();
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        // If response is empty or not JSON, treat as success
        result = { message: "Order placed successfully" };
      }

      console.log("Order submitted successfully:", result);

      // Close modal and show success message
      setIsModalVisible(false);
      Alert.alert(i18n.t("success"), i18n.t("order_placed_successfully"), [
        {
          text: i18n.t("ok"),
          onPress: () => {
            // Clear locally — do NOT refetch here, the backend
            // still returns the old items under the same cartId
            setCartItems([]);
            setTotalCartItems(0);
            if (result?.cartId) {
              setCartId(result.cartId);
            }
          },
        },
      ]);
    } catch (err) {
      console.error("Error submitting order:", err);
      defaultErrorToast();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalVisible(false);
      // Reset form back to profile defaults (not blank) so reopening
      // the modal still shows the prefilled values
      setFullName(profileDefaults?.nameEn || profileDefaults?.nameAr || "");
      setEmail(profileDefaults?.email || "");
      setPhone(profileDefaults?.phoneNumber || "");
      setLocation("");
    }
  };

  return (
    <RNView style={s.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id?.toString() ?? `item-${Math.random()}`}
        contentContainerStyle={s.contentContainerStyle}
        ItemSeparatorComponent={() => <RNView style={{ height: 15 }} />}
        ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
        ListEmptyComponent={
          <ListEmptyComponent isLoading={isLoading} message="cart_is_empty" />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.textColor}
            colors={[theme.textColor]}
          />
        }
        renderItem={({ item }) => (
          <CartItemCard
            cartItem={item}
            fetchCartItems={fetchCartItems}
            isDarkMode={isDarkMode}
          />
        )}
      />

      <BottomButton
        label={i18n.t("checkout")}
        disabled={cartItems.length === 0}
        isDarkMode={isDarkMode}
        onPress={handleCheckout}
      />

      {/* Checkout Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          style={s.modalOverlay}
        >
          <RNView style={s.modalContent}>
            <Text style={s.modalTitle}>{i18n.t("checkout")}</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <RNView style={s.formContainer}>
                <Text
                  style={[
                    s.inputLabel,
                    { textAlign: i18n.locale === "ar" ? "right" : "left" },
                  ]}
                >
                  {i18n.t("full_name")}
                </Text>
                <TextInput
                  style={[
                    s.input,
                    { textAlign: i18n.locale === "ar" ? "right" : "left" },
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder={i18n.t("enter_full_name")}
                  placeholderTextColor={theme.textColor + "80"}
                  editable={!isSubmitting}
                />

                <Text
                  style={[
                    s.inputLabel,
                    { textAlign: i18n.locale === "ar" ? "right" : "left" },
                  ]}
                >
                  {i18n.t("email")}
                </Text>
                <TextInput
                  style={[
                    s.input,
                    { textAlign: i18n.locale === "ar" ? "right" : "left" },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={i18n.t("enter_email")}
                  placeholderTextColor={theme.textColor + "80"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />

                <Text
                  style={[
                    s.inputLabel,
                    { textAlign: i18n.locale === "ar" ? "right" : "left" },
                  ]}
                >
                  {i18n.t("phone")}
                </Text>
                <TextInput
                  style={[
                    s.input,
                    { textAlign: i18n.locale === "ar" ? "right" : "left" },
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={i18n.t("enter_phone")}
                  placeholderTextColor={theme.textColor + "80"}
                  keyboardType="phone-pad"
                  editable={!isSubmitting}
                />

                <Text
                  style={[
                    s.inputLabel,
                    { textAlign: i18n.locale === "ar" ? "right" : "left" },
                  ]}
                >
                  {i18n.t("location")}
                </Text>
                <TextInput
                  style={[
                    s.input,
                    s.locationInput,
                    { textAlign: i18n.locale === "ar" ? "right" : "left" },
                  ]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={i18n.t("enter_location")}
                  placeholderTextColor={theme.textColor + "80"}
                  multiline
                  numberOfLines={3}
                  editable={!isSubmitting}
                />
              </RNView>
            </ScrollView>

            <RNView style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalButton, s.cancelButton]}
                onPress={handleCloseModal}
                disabled={isSubmitting}
              >
                <Text style={s.cancelButtonText}>{i18n.t("cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.modalButton, s.submitButton]}
                onPress={handleSubmitOrder}
                disabled={isSubmitting}
              >
                <Text style={s.submitButtonText}>
                  {isSubmitting ? i18n.t("submitting") : i18n.t("send")}
                </Text>
              </TouchableOpacity>
            </RNView>
          </RNView>
        </KeyboardAvoidingView>
      </Modal>

      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </RNView>
  );
};

export default CartScreen;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    contentContainerStyle: {
      padding: 16,
      width: width,
      paddingBottom: 25,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.modalBg,
      borderRadius: 20,
      padding: 20,
      width: "90%",
      maxHeight: "80%",
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.textColor,
      textAlign: "center",
      marginBottom: 20,
    },
    formContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textColor,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      backgroundColor: theme.inputBg,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
      color: theme.textColor,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    locationInput: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    modalButton: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: "#E0E0E0",
    },
    submitButton: {
      backgroundColor: "#000",
    },
    cancelButtonText: {
      color: "#333333",
      fontSize: 16,
      fontWeight: "600",
    },
    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
