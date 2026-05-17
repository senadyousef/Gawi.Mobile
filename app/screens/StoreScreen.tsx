import * as React from "react";
import { useAppContext } from "../context";
import { StatusBar } from "expo-status-bar";
import { defaultErrorToast } from "../helpers";
import { StyleSheet, View } from "react-native";
import { handleFetchStoreItems } from "../api/shop";
import Header from "../components/StoreScreen/Header";
import { IshopItem, RootStackParamList } from "../types";
import { LoadingIndicator } from "../components/LoadingIndicator";
import StoreCarousel from "../components/StoreScreen/StoreCarousel";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import StoreItemsSection from "../components/StoreScreen/StoreItemsSection";

const StoreScreen: React.FC<
  NativeStackScreenProps<RootStackParamList, "storeScreen">
> = ({
  route: {
    params: { storeId, storeName },
  },
  navigation: { navigate },
}) => {
  // ✅ Include guestMode flag from context
  const { handleLogout, guestMode } = useAppContext();

  const [didFail, setDidFail] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [storeItems, setStoreItems] = React.useState<IshopItem[]>([]);

  const fetchStoreItems = async () => {
    try {
      setDidFail(false);
      setIsLoading(true);

      // ✅ Allow guest access (skip logout if no token)
      const res = await handleFetchStoreItems({
        userId: storeId,
        handleLogout: guestMode ? async () => {} : handleLogout,
      });

      if (Array.isArray(res)) {
        setStoreItems(res);
      } else if (res?.data?.res && Array.isArray(res.data.res)) {
        setStoreItems(res.data.res);
      } else if (res?.result && Array.isArray(res.result)) {
        setStoreItems(res.result);
      } else {
        console.warn("⚠️ Unexpected API response format:", res);
        setStoreItems([]);
      }
    } catch (err) {
      console.error("❌ Error fetching store items:", err);
      setDidFail(true);
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (storeId) {
      fetchStoreItems();
    }
  }, [storeId]);

  return (
    <View style={{ flex: 1 }}>
      <Header title={storeName} />
      <View style={styles.container}>
        {isLoading && !storeItems.length && (
          <LoadingIndicator isLoading={isLoading} />
        )}

        {/* 🧭 Carousel and items always visible (even for guests) */}
        <StoreCarousel />

        <StoreItemsSection
          data={storeItems.map((item) => ({
            id: item.id,
            name: item.nameEn,
            image: item.photoUrl,
            type: item.type,
          }))}
          didFail={didFail}
          isLoading={isLoading}
          onRetry={fetchStoreItems}
          navigateToStoreItemsScreen={() =>
            navigate("storeItemsScreen", { storeId, storeName })
          }
        />

        <StatusBar style="dark" />
      </View>
    </View>
  );
};

export default StoreScreen;

const styles = StyleSheet.create({
  container: {
    gap: 15,
    padding: 16,
  },
});
