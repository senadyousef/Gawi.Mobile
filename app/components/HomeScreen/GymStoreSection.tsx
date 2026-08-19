import * as React from "react";
import ErrorBox from "../ErrorBox";
import i18n from "../../localization";
import { IshopItem } from "../../types";
import SectionTitle from "./SectionTitle";
import { useAppContext } from "../../context";
import NoItemsComponent from "../NoItemsComponent";
import ProductCard from "../ShopScreen/ProductCard";
import { LoadingIndicator } from "../LoadingIndicator";
import { useNavigation } from "@react-navigation/native";
import { FlatList, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props {
  refreshTrigger?: number;
}

const GymStoreSection = ({ refreshTrigger = 0 }: Props) => {
  const { navigate } = useNavigation();
  const { guestMode, isDarkMode } = useAppContext(); // 👈 pull isDarkMode
  const navigation = useNavigation();
  const isRTL = i18n.locale === "ar";

  const [data, setData] = React.useState<IshopItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [didFail, setDidFail] = React.useState(false);

  const fetchGymStoreItems = async () => {
    try {
      setIsLoading(true);
      setDidFail(false);

      let storedId = await AsyncStorage.getItem("MemberId");
      const UserRole = (await AsyncStorage.getItem("UserRole"))|| "Guest"
      if (!storedId || storedId === "0" || storedId === "null") {
        storedId = "0";
      }

      const url = `https://gawifit.com/api/Gyms/getAllGymsStoreItems?userId=${storedId}&role=${UserRole}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });

      if (!res.ok) {
        setDidFail(true);
        return;
      }

      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("❌ Fetch Error:", error);
      setDidFail(true);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchGymStoreItems();
  }, [refreshTrigger]);

  const handleShowProductDetails = (e: IshopItem) =>
    navigation.navigate("productDetails", { productId: e.id, isGymStore: false });

  const renderItem = React.useCallback(
    ({ item }: { item: IshopItem }) => (
      <ProductCard
        item={item}
        handleShowProductDetails={handleShowProductDetails}
        containerStyles={{ flexGrow: 0 }}
        isDarkMode={isDarkMode} // 👈 pass down to ProductCard
      />
    ),
    [isDarkMode], // 👈 add isDarkMode to deps so it re-renders on toggle
  );

  const getContent = () => {
    if (isLoading) return <LoadingIndicator isLoading />;
    if (didFail) return <ErrorBox onRetry={fetchGymStoreItems} isLoading={isLoading} />;
    if (!data.length) return <NoItemsComponent message={i18n.t("no_products_available")} />;

    return (
      <FlatList
        horizontal
        data={data}
        renderItem={renderItem}
        inverted={isRTL}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        getItemLayout={(_, index) => ({
          length: 180,
          offset: 180 * index,
          index,
        })}
        contentContainerStyle={{ paddingVertical: 5 }}
      />
    );
  };

  return (
    <View style={[styles.container ]}>
      <SectionTitle
        title={i18n.t("gym_store_title")}
        onPress={() => navigate("stores")}
      />
      {getContent()}
    </View>
  );
};

export default GymStoreSection;

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
   
  },
});