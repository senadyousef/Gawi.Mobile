import * as React from "react";
import { width } from "../constants";
import { useAppContext } from "../context";
import { StatusBar } from "expo-status-bar";
import { defaultErrorToast } from "../helpers";
import { handleFetchStoreItems } from "../api/shop"; // ✅ correct import
import Header from "../components/StoreScreen/Header";
import { IshopItem, RootStackParamList } from "../types";
import SearchBar from "../components/ShopScreen/SearchBar";
import ProductCard from "../components/ShopScreen/ProductCard";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { FlatList, Keyboard, StyleSheet, View } from "react-native";
import { ListEmptyComponent } from "../components/ListEmptyComponent";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

const StoreItemsScreen: React.FC<
  NativeStackScreenProps<RootStackParamList, "storeItemsScreen">
> = ({
  route: {
    params: { storeId, storeName },
  },
  navigation: { navigate },
}) => {
  const { handleLogout, guestMode } = useAppContext();

  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [searchValue, setSearchValue] = React.useState<string>();
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [storeItems, setStoreItems] = React.useState<IshopItem[]>([]);
  const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout>();

  /** ✅ Fetch store items */
  const fetchStoreItems = async (
    page: number,
    shouldReset: boolean = false,
    searchText?: string
  ) => {
    try {
      setSearchValue(searchText);
      setIsLoading(true);

      const res = await handleFetchStoreItems({
        page,
        storeId,
        searchText,
        handleLogout: guestMode ? async () => {} : handleLogout, // ✅ allow guest access
      });

      if (res?.result && Array.isArray(res.result)) {
        setStoreItems((prev) =>
          shouldReset ? res.result : [...prev, ...res.result]
        );
        setTotalPages(res.totalPages || 1);
        setCurrentPage(res.currentPage || page);
      } else if (Array.isArray(res)) {
        // For APIs that return a raw array
        setStoreItems(res);
      } else {
        setStoreItems([]);
      }

      Keyboard.dismiss();
    } catch (err) {
      console.error("❌ Store items fetch error:", err);
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (storeId) {
      fetchStoreItems(1, true);
    }
  }, [storeId]);

  /** ✅ Search handler */
  const onSearchTextChanged = (value?: string) => {
    clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        setCurrentPage(0);
        fetchStoreItems(1, true, value);
      }, 600)
    );
  };

  /** ✅ Pagination */
  const handleGetNextPage = () => {
    if (currentPage < totalPages && !isLoading)
      fetchStoreItems(currentPage + 1, false, searchValue);
  };

  /** ✅ Navigate to details */
  const handleShowProductDetails = (e: IshopItem) => {
    navigate("productDetails", { productId: e.id, isGymStore: false });
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={storeName} />
      <View style={styles.container}>
        <SearchBar onSearchTextChanged={onSearchTextChanged} />
        {isLoading && !!storeItems.length && (
          <LoadingIndicator isLoading={isLoading} />
        )}
        <FlatList
          numColumns={2}
          data={storeItems}
          onEndReached={handleGetNextPage}
          ListFooterComponentStyle={styles.footerStyle}
          contentContainerStyle={styles.contentContainerStyle}
          ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
          ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
          ListEmptyComponent={
            <ListEmptyComponent
              isLoading={isLoading}
              message={"no_products_found"}
            />
          }
          renderItem={({ item, index }) => (
            <View style={{ marginRight: index % 2 !== 0 ? 0 : 15 }}>
              <ProductCard
                key={item.id}
                item={item}
                handleShowProductDetails={handleShowProductDetails}
              />
            </View>
          )}
        />
        <StatusBar style="dark" />
      </View>
    </View>
  );
};

export default StoreItemsScreen;

const styles = StyleSheet.create({
  container: {
    gap: 15,
    padding: 16,
  },
  contentContainerStyle: {
    width: width - 32,
    paddingVertical: 5,
    paddingBottom: 25,
  },
  footerStyle: {
    paddingVertical: 20,
  },
});
