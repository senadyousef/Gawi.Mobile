import React from "react";
import i18n from "../localization";
import { Text } from "./overridedComponents";

interface Props {
  message?: string;
  isLoading: boolean;
  color?: "white" | "black";
}

export const ListEmptyComponent: React.FC<Props> = ({
  isLoading,
  color = "black",
  message = "empty_list_default_text",
}) => {
  if (isLoading) return null;

  // ✅ إذا المفتاح موجود بالـ i18n استخدمه، وإلا اعرض النص مباشرة
  const displayMessage =
    i18n.t(message) === message || i18n.t(message).includes("missing")
      ? message
      : i18n.t(message);

  return (
    <Text style={{ textAlign: "center", padding: 10, color }}>
      {displayMessage}
    </Text>
  );
};
