import * as React from 'react';import ErrorBox from '../ErrorBox';
import i18n from '../../localization';
import { IshopItem } from '../../types';
import NoItemsComponent from '../NoItemsComponent';
import ProductCard from '../ShopScreen/ProductCard';
import SectionTitle from '../HomeScreen/SectionTitle';
import { LoadingIndicator } from '../LoadingIndicator';
import { useNavigation } from '@react-navigation/native';
import { FlatList, StyleSheet, View } from 'react-native';

interface Iprops {
  didFail: boolean;
  data: IshopItem[];
  isLoading: boolean;
  onRetry: () => Promise<void>;
  navigateToStoreItemsScreen: () => void;
}

const StoreItemsSection: React.FC<Iprops> = ({
  data,
  didFail,
  onRetry,
  isLoading,
  navigateToStoreItemsScreen,
}) => {
  const { navigate } = useNavigation();

  const handleShowProductDetails = (product: IshopItem) =>
    navigate('productDetails', { productId: product.id, isGymStore: false });

  const getContent = () => {
    if (isLoading) {
      return <LoadingIndicator isLoading={isLoading} />;
    } else if (didFail) {
      return <ErrorBox onRetry={onRetry} isLoading={!!isLoading} />;
    } else if (!data.length) {
      return <NoItemsComponent />;
    } else {
      return (
        <FlatList
          horizontal
          data={data}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          renderItem={({ item, index }) => (
            <ProductCard
              key={index}
              item={item}
              containerStyles={{ flexGrow: 0 }}
              handleShowProductDetails={handleShowProductDetails}
            />
          )}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <SectionTitle
        onPress={navigateToStoreItemsScreen}
        title={i18n.t('store_items_section_title')}
      />
      {getContent()}
    </View>
  );
};

export default StoreItemsSection;

const styles = StyleSheet.create({
  container: {
    paddingTop: 25,
  },
});
