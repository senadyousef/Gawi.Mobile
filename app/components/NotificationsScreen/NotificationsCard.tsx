import * as React from 'react';import { format } from 'date-fns';
import { StyleSheet } from 'react-native';
import { Inotification } from '../../types';
import Colors from '../../constants/Colors';
import { shadowStyle } from '../../constants';
import { Text, View } from '../overridedComponents';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  item: Inotification;
}

const NotificationsCard: React.FC<Props> = ({ item }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.dateWrapper}>
        <MaterialCommunityIcons
          size={14}
          color={Colors.gray}
          name='calendar-month-outline'
        />
        <Text style={styles.dateText}>
          {format(new Date(item.createdAt), 'MMMM dd, yyyy p')}
        </Text>
      </View>
    </View>
  );
};

export default NotificationsCard;

const styles = StyleSheet.create({
  container: {
    gap: 9,
    borderRadius: 10,
    paddingVertical: 17,
    paddingHorizontal: 12,
    ...shadowStyle,
  },
  title: {
    fontSize: 14,
    color: Colors.secondary,
    fontFamily: 'SF-Medium',
  },
  message: {
    fontSize: 16,
    color: Colors.secondary,
    fontFamily: 'SF-Medium',
  },
  dateWrapper: {
    gap: 2,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: Colors.gray,
  },
});
