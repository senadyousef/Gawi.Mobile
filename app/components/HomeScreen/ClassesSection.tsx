import * as React from "react";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import ErrorBox from "../ErrorBox";
import i18n from "../../localization";
import SectionTitle from "./SectionTitle";
import ClassCard from "../ClassesScreen/ClassCard";
import NoItemsComponent from "../NoItemsComponent";
import { LoadingIndicator } from "../LoadingIndicator";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../../context"; // 👈 ADD

interface Props {
  refreshTrigger?: number;
}

export default function ClassesSection({ refreshTrigger = 0 }: Props) {
  const { navigate } = useNavigation<any>();
  const { isDarkMode } = useAppContext(); // 👈 ADD

  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [didFail, setDidFail] = useState(false);
  const isRTL = i18n.locale === "ar";

  useEffect(() => {
    const fetchClasses = async () => {
      let MemberId = await AsyncStorage.getItem("MemberId");
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://gawifit.com/api/GymClass/getAllGymClassByUser?userId=${MemberId}`,
          { headers: { accept: "text/plain" } },
        );
        if (!response.ok) throw new Error("Failed to load gym classes");
        const data = await response.json();
        setData(data);
        setDidFail(false);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setDidFail(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [refreshTrigger]);

  const handleOpenEvent = (item: any) =>
    navigate("BookClassDrawer" as never, {
      screen: "ClassDetails",
      params: { classId: item.id },
    } as never);

  const getContent = () => {
    if (isLoading) {
      return <LoadingIndicator isLoading={true} />;
    } else if (didFail) {
      return (
        <ErrorBox
          isLoading={false}
          onRetry={() => {
            setDidFail(false);
            setIsLoading(true);
          }}
        />
      );
    } else if (!data.length) {
      return <NoItemsComponent />;
    } else {
      return (
        <FlatList
          horizontal
          data={data}
          inverted={isRTL}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          renderItem={({ item, index }) => (
            <ClassCard
              key={index}
              item={item}
              imageStyle={styles.imageStyle}
              handleOpenEvent={handleOpenEvent}
              isDarkMode={isDarkMode} // 👈 pass down to ClassCard
            />
          )}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <SectionTitle
        title={i18n.t("classes_title")}
        onPress={() =>
          navigate("BookClassDrawer" as never, {
            screen: "BookClassMain",
          } as never)
        }
      />
      {getContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
  },
  imageStyle: {
    width: 130,
    height: 150,
    borderRadius: 10,
  },
});