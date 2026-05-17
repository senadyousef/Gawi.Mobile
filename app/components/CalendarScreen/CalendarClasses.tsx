import * as React from 'react';import { Ievent } from '../../types';
import { width } from '../../constants';
import CalendarClassCard from './CalendarClassCard';
import { LoadingIndicator } from '../LoadingIndicator';
import { FlatList, StyleSheet, View } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import { ListEmptyComponent } from '../ListEmptyComponent';

interface Props {
  events: Ievent[];
  isLoading: boolean;
  handleGetNextPage: () => void;
  handleOpenEvent: (e: Ievent) => void;
}

const CalendarClasses: React.FC<Props> = ({
  events,
  isLoading,
  handleOpenEvent,
  handleGetNextPage,
}) => {
  const ref = React.useRef(null);

  useScrollToTop(ref);

  return (
    <FlatList
      ref={ref}
      data={events}
      onEndReached={handleGetNextPage}
      ListFooterComponentStyle={styles.footerStyle}
      contentContainerStyle={styles.contentContainerStyle}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListFooterComponent={<LoadingIndicator isLoading={isLoading} />}
      ListEmptyComponent={
        <ListEmptyComponent isLoading={isLoading} message={'no_events_found'} />
      }
      renderItem={({ item, index }) => (
        <CalendarClassCard
          key={index}
          item={item}
          handleOpenEvent={handleOpenEvent}
        />
      )}
    />
  );
};

export default CalendarClasses;

const styles = StyleSheet.create({
  contentContainerStyle: {
    width,
    padding: 16,
  },
  footerStyle: {
    paddingVertical: 20,
  },
});
