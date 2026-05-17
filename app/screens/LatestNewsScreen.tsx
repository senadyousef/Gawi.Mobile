import * as React from 'react';import { Inews } from '../types';
import { width } from '../constants';
import { useAppContext } from '../context';
import { StatusBar } from 'expo-status-bar';
import { handleFetchNews } from '../api/news';
import { defaultErrorToast } from '../helpers';
import { FlatList, StyleSheet, View } from 'react-native';
import NewsCard from '../components/LatestNewsScreen/NewsCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListEmptyComponent } from '../components/ListEmptyComponent';

const LatestNewsScreen = () => {
  const { handleLogout } = useAppContext();
  const [news, setNews] = React.useState<Inews[]>([]);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // const fetchEvents = async (page: number) => {
  //   try {
  //     setIsLoading(true);
  //     const res = await handleFetchNews({
  //       page,
  //       handleLogout,
  //     });
  //     if (res) {
  //       setNews((news) => [...news, ...res.result]);
  //       setTotalPages(res.totalPages);
  //       setCurrentPage(res.currentPage);
  //     }
  //   } catch (err) {
  //     defaultErrorToast();
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // React.useEffect(() => {
  //   fetchEvents(1);
  // }, []);

  // const handleGetNextPage = () => {
  //   if (currentPage < totalPages && !isLoading) fetchEvents(currentPage + 1);
  // };

  return (
    <View>
      <FlatList
        data={news}
        // onEndReached={handleGetNextPage}
        ListFooterComponentStyle={styles.footerStyle}
        contentContainerStyle={styles.contentContainerStyle}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
        renderItem={({ item, index }) => <NewsCard key={index} item={item} />}
        ListEmptyComponent={
          <ListEmptyComponent isLoading={isLoading} message={'no_news_found'} />
        }
      />
      <StatusBar style='dark' />
    </View>
  );
};

export default LatestNewsScreen;

const styles = StyleSheet.create({
  contentContainerStyle: {
    width,
    padding: 16,
    paddingBottom: 25,
  },
  footerStyle: {
    paddingVertical: 20,
  },
});
