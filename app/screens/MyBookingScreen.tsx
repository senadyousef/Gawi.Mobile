import * as React from 'react';import { width } from '../constants';
import { IuserEvent } from '../types';
import { useAppContext } from '../context';
import { StatusBar } from 'expo-status-bar';
import { defaultErrorToast } from '../helpers';
import { FlatList, StyleSheet, View } from 'react-native';
import { handleFetchUserEvents } from '../api/userEvents';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListEmptyComponent } from '../components/ListEmptyComponent';
import UserEventCard from '../components/MyBookingScreen/UserEventCard';

const MyBookingScreen = () => {
  const { handleLogout, userProfile } = useAppContext();
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [userEvents, setUserEvents] = React.useState<IuserEvent[]>([]);

  const fetchUserEvents = async (page: number) => {
    if (!userProfile) return;

    try {
      setIsLoading(true);
      const res = await handleFetchUserEvents({
        page,
        handleLogout,
        userId: userProfile.id,
      });
      if (res) {
        setUserEvents((evts) => [...evts, ...res.result]);
        setTotalPages(res.totalPages);
        setCurrentPage(res.currentPage);
      }
    } catch (err) {
      defaultErrorToast();
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUserEvents(1);
  }, []);

  const handleGetNextPage = () => {
    if (currentPage < totalPages && !isLoading)
      fetchUserEvents(currentPage + 1);
  };

  return (
    <View>
      <FlatList
        data={userEvents}
        onEndReached={handleGetNextPage}
        ListFooterComponentStyle={styles.footerStyle}
        contentContainerStyle={styles.contentContainerStyle}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
        ListEmptyComponent={
          <ListEmptyComponent
            isLoading={isLoading}
            message={'no_Booked_events_yet'}
          />
        }
        renderItem={({ item, index }) => (
          <UserEventCard key={index} item={item} />
        )}
      />
      <StatusBar style='dark' />
    </View>
  );
};

export default MyBookingScreen;

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
