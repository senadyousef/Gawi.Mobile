// components/Auth/AuthInput.tsx
import React from "react";
import { TextInput, View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";

interface AuthInputProps {
  iconName: string;
  placeholder: string;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  keyboardType?: any;
  textAlign?: "left" | "right";
  rightIcon?: React.ReactNode; // 👁️ added for custom icon (like eye)
}

export default function AuthInput({
  iconName,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  onBlur,
  keyboardType,
  textAlign = "left",
  rightIcon,
}: AuthInputProps) {
  return (
    <View style={styles.inputContainer}>
      <MaterialCommunityIcons
        name={iconName}
        size={22}
        color={Colors.gray}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { textAlign }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType={keyboardType}
      />
      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginVertical: 5,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.black,
    fontFamily: "SF-Regular",
    marginVertical:15
  },
  rightIcon: {
    marginLeft: 8,
  },
});
