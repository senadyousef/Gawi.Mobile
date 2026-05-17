import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { useAppContext } from "../context"; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#121212" : "#FFFFFF",
  surface: dark ? "#1E1E1E" : "#FFFFFF",
  ink: dark ? "#F0F0F0" : "#000000",
  muted: dark ? "#AAAAAA" : "#666666",
  border: dark ? "#3C3C3C" : "#CCCCCC",
  inputBg: dark ? "#2C2C2C" : "#FFFFFF",
  placeholder: dark ? "#888888" : "#AAAAAA",
  accent: "#4C63AF",
});

export default function PaymentScreen({ route, navigation }) {
  const { product } = route.params;
  const { isDarkMode } = useAppContext(); // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]); // 👈 reactive styles

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = () => {
    if (!cardNumber || !expiry || !cvv || !name) {
      Alert.alert("Missing Info", "Please fill all fields");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("✅ Payment Successful", `You paid $${product.price}`);
      navigation.goBack();
    }, 1500);
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Image source={{ uri: product.photoUrl }} style={s.image} />

      <Text style={s.title}>Pay for {product.name}</Text>
      <Text style={s.price}>Amount: ${product.price}</Text>

      <TextInput
        style={s.input}
        placeholder="Cardholder Name"
        placeholderTextColor={theme.placeholder} // 👈
        value={name}
        onChangeText={setName}
        color={theme.ink} // 👈
      />
      <TextInput
        style={s.input}
        placeholder="Card Number"
        placeholderTextColor={theme.placeholder} // 👈
        keyboardType="numeric"
        maxLength={16}
        value={cardNumber}
        onChangeText={setCardNumber}
        color={theme.ink} // 👈
      />

      <View style={s.row}>
        <TextInput
          style={[s.input, { flex: 1, marginRight: 10 }]}
          placeholder="MM/YY"
          placeholderTextColor={theme.placeholder} // 👈
          value={expiry}
          onChangeText={setExpiry}
          color={theme.ink} // 👈
        />
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="CVV"
          placeholderTextColor={theme.placeholder} // 👈
          keyboardType="numeric"
          maxLength={3}
          value={cvv}
          onChangeText={setCvv}
          color={theme.ink} // 👈
        />
      </View>

      <TouchableOpacity
        style={[s.button, loading && { opacity: 0.5 }]}
        disabled={loading}
        onPress={handleConfirmPayment}
      >
        <Text style={s.buttonText}>
          {loading ? "Processing..." : "Confirm Payment"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: theme.bg, // 👈
      flexGrow: 1,
    },
    image: {
      width: "100%",
      height: 200,
      borderRadius: 10,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.ink, // 👈
    },
    price: {
      fontSize: 16,
      color: theme.accent,
      marginVertical: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border, // 👈
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      backgroundColor: theme.inputBg, // 👈
      color: theme.ink, // 👈
    },
    row: {
      flexDirection: "row",
    },
    button: {
      backgroundColor: theme.accent,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
