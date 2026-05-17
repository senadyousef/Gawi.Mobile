import * as React from 'react';import { Ievent } from '../types';
import { width } from '../constants';
import { useAppContext } from '../context';
import { StatusBar } from 'expo-status-bar';
import { defaultErrorToast } from '../helpers';
import { handleFetchEvents } from '../api/events';
import { useNavigation } from '@react-navigation/native';
import { FlatList, StyleSheet, View } from 'react-native';
import ClassCard from '../components/ClassesScreen/ClassCard';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListEmptyComponent } from '../components/ListEmptyComponent';

const ClassesScreen: React.FC = () => {
  const { navigate } = useNavigation();
  const { handleLogout, userProfile } = useAppContext();
  const [events, setEvents] = React.useState<Ievent[]>([]);
  const [totalPages, setTotalPages] = React.useState<number>(0);
  const [currentPage, setCurrentPage] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const fetchEvents = async (page: number) => {
    if (!userProfile?.id) return;

    try {
      setIsLoading(true);
      const res = await handleFetchEvents({
        page,
        pageSize: 15,
        handleLogout,
        userId: userProfile.id,
      });
      if (res) {
        setEvents((evnts) => [...evnts, ...res.result]);
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
    fetchEvents(1);
  }, []);

  const handleGetNextPage = () => {
    if (currentPage < totalPages && !isLoading) fetchEvents(currentPage + 1);
  };

  const handleOpenEvent = (e: Ievent) =>
    navigate('eventDetails', { eventId: e.id });

  return (
    <View>
      <FlatList
        data={events}
        numColumns={3}
        onEndReached={handleGetNextPage}
        ListFooterComponentStyle={styles.footerStyle}
        contentContainerStyle={styles.contentContainerStyle}
        ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
        ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
        ListEmptyComponent={
          <ListEmptyComponent
            isLoading={isLoading}
            message={'no_events_found'}
          />
        }
        renderItem={({ item, index }) => (
          <View
            style={{ marginRight: index > 0 && (index + 1) % 3 === 0 ? 0 : 10 }}
          >
            <ClassCard
              key={index}
              item={item}
              imageStyle={styles.imageStyle}
              handleOpenEvent={handleOpenEvent}
            />
          </View>
        )}
      />
      <StatusBar style='dark' />
    </View>
  );
};

export default ClassesScreen;

const styles = StyleSheet.create({
  imageStyle: {
    width: (width - 52) / 3,
    height: 150,
    borderRadius: 10,
  },
  contentContainerStyle: {
    padding: 16,
    width: width,
    paddingBottom: 25,
  },
  footerStyle: {
    paddingVertical: 20,
  },
});
