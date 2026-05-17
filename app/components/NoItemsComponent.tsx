import * as React from "react";
import i18n from "../localization";
import Colors from "../constants/Colors";
import { Text } from "./overridedComponents";
import { StyleSheet, View } from "react-native";
import { useI18n } from "../hooks/useI18n";

interface Iprops {
  message?: string;
}

const NoItemsComponent: React.FC<Iprops> = ({ message }) => {
  const { isArabic } = useI18n();

  return (
    <View style={[styles.container, isArabic() && styles.rtlContainer]}>
      <Text
        style={[
          styles.text,
          { textAlign: isArabic() ? "right" : "left" }, // 👈 Align text properly
        ]}
      >
        {message || i18n.t("nothing_to_see_here")}
      </Text>
    </View>
  );
};

export default NoItemsComponent;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  rtlContainer: {
    flexDirection: "row-reverse",
  },
  text: {
    fontSize: 12,
    color: Colors.secondary,
    fontFamily: "SF-Medium",
    writingDirection: "auto", // lets RN handle RTL characters properly
  },
});
