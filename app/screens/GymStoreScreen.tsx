import * as React from 'react';
import { IshopItem } from '../types';
import { width } from '../constants';
import { useAppContext } from '../context';
import { StatusBar } from 'expo-status-bar';
import { defaultErrorToast } from '../helpers';
import { handleFetchItem } from '../api/shop';
import SearchBar from '../components/ShopScreen/SearchBar';
import ProductCard from '../components/ShopScreen/ProductCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { FlatList, Keyboard, StyleSheet, View } from 'react-native';
import { ListEmptyComponent } from '../components/ListEmptyComponent';
import { useNavigation, useScrollToTop } from '@react-navigation/native';

const GymStoreScreen = () => {
  const ref = React.useRef(null);
  const { navigate } = useNavigation();
  const { handleLogout } = useAppContext();
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [searchValue, setSearchValue] = React.useState<string>();
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [shopItems, setShopItems] = React.useState<IshopItem[]>([]);
  const [searchTimeout, setSearchTimeout] = React.useState<NodeJS.Timeout>();

  useScrollToTop(ref);

  const fetchShopItems = async (
    page: number,
    shouldReset: boolean = false,
    searchText?: string,
  ) => {
    try {
      setSearchValue(searchText);
      setIsLoading(true);
      const res = await handleFetchItem({
        page,
        searchText,
        handleLogout,
      });
      if (res) {
        if (shouldReset) {
          setShopItems(res.result);
        } else {
          setShopItems((items) => [...items, ...res.result]);
        }
        setTotalPages(res.totalPages);
        setCurrentPage(res.currentPage);
        Keyboard.dismiss();
      }
    } catch (err) {
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchShopItems(1, true);
  }, []);

  const onSearchTextChanged = (value?: string) => {
    clearTimeout(searchTimeout);
    setSearchTimeout(
      setTimeout(() => {
        setCurrentPage(0);
        fetchShopItems(1, true, value);
      }, 1000),
    );
  };

  const handleGetNextPage = () => {
    if (currentPage < totalPages && !isLoading)
      fetchShopItems(currentPage + 1, false, searchValue);
  };

  const handleShowProductDetails = (e: IshopItem) => {
    navigate('productDetails', { productId: e.id, isGymStore: true });
  };

  return (
    <View style={styles.container}>
      <SearchBar onSearchTextChanged={onSearchTextChanged} />
      {isLoading && !!shopItems.length && (
        <LoadingIndicator isLoading={isLoading} />
      )}
      <FlatList
        ref={ref}
        numColumns={2}
        data={shopItems}
        onEndReached={handleGetNextPage}
        ListFooterComponentStyle={styles.footerStyle}
        contentContainerStyle={styles.contentContainerStyle}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
        ListEmptyComponent={
          <ListEmptyComponent
            isLoading={isLoading}
            message={'no_products_found'}
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
      <StatusBar style='dark' />
    </View>
  );
};

export default GymStoreScreen;

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
