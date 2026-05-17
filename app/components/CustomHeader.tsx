import * as React from "react";
import { IheaderIcon } from "../types";
import { StyleSheet, ImageBackground, View, TouchableOpacity, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text } from "./overridedComponents";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabHeaderProps } from "@react-navigation/bottom-tabs";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { statusBarHeight, shadowStyle } from "../constants";
import IconsContainer from "./IconsContainer";
import i18n from "../localization";

interface Props {
  icons?: IheaderIcon[];
  isShadowVisible?: boolean;
  shouldShowBackArrow?: boolean;
  params: BottomTabHeaderProps | NativeStackHeaderProps;
  headerImage: any;
}

const CustomHeader: React.FC<Props> = ({
  icons,
  params,
  shouldShowBackArrow,
  isShadowVisible = true,
}) => {
  const arabic = i18n.locale?.startsWith("ar");

  const title =
    params && "options" in params && params.options?.title
      ? params.options.title
      : "";
  const goBack =
    params && "navigation" in params && params.navigation?.goBack
      ? params.navigation.goBack
      : () => {};

  return (
    <ImageBackground
      source={require("../assets/images/96d6283d8c42e6cbeea7a776b64638740c9fc9fa.jpg")}
      style={[
        styles.container,
        arabic ? styles.containerRTL : styles.containerLTR,
        isShadowVisible && shadowStyle,
      ]}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["#006ca6d2", "#006ca6d7"]}
        style={styles.gradientOverlay}
      />

      {/* Title & Back Arrow */}
      <View
        style={[
          styles.titleWrapper,
          arabic ? styles.titleWrapperRTL : styles.titleWrapperLTR,
        ]}
      >
        {shouldShowBackArrow && (
          <TouchableOpacity onPress={goBack} style={styles.backArrow}>
            <MaterialCommunityIcons
              size={24}
              name={arabic ? "arrow-right" : "arrow-left"}
              color="white"
            />
          </TouchableOpacity>
        )}
        <Text
          style={[styles.title, arabic ? styles.titleRTL : styles.titleLTR]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Icons */}
      {icons && <IconsContainer icons={icons} />}
    </ImageBackground>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: statusBarHeight,
    height: statusBarHeight + 40,
    backgroundColor: "transparent",
  },
  containerLTR: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerRTL: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  titleWrapperLTR: {
    justifyContent: "flex-start",
  },
  titleWrapperRTL: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 18,
    color: "white",
    fontFamily: "SF-Semibold",
    marginHorizontal: 8,
    flexShrink: 1,
  },
  titleLTR: {
    textAlign: "left",
  },
  titleRTL: {
    textAlign: "right",
  },
  backArrow: {
    padding: 8,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ?95 : 65,
  },
});
