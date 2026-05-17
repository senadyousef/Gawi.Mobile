import * as React from "react";
import i18n from "../../localization";
import Colors from "../../constants/Colors";
import { useI18n } from "../../hooks/useI18n";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, TouchableOpacity } from "../overridedComponents";

interface Props {
  title: string;
  onPress?: () => void;
}

const SectionTitle: React.FC<Props> = ({ title, onPress }) => {
  const { isArabic, getDirection } = useI18n();

  return (
    <View style={[styles.wrapper, getDirection()]}>
      <Text style={styles.title}>{title}</Text>
      {onPress && (
        <TouchableOpacity
          style={[styles.button, getDirection()]}
          onPress={onPress}
        >
          <Text style={styles.buttonText}>{i18n.t("view_all")}</Text>
          <MaterialCommunityIcons
            size={18}
            color={Colors.primary}
            name={isArabic() ? "chevron-left-circle" : "chevron-right-circle"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SectionTitle;

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "SF-Medium",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: Colors.primary,
    marginLeft: 5,
  },
});
