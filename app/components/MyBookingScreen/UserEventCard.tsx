import * as React from 'react';import i18n from '../../localization';
import { IuserEvent } from '../../types';
import Colors from '../../constants/Colors';
import { shadowStyle } from '../../constants';
import { Image, StyleSheet } from 'react-native';
import { handleGetLocalizedField } from '../../helpers';
import { useNavigation } from '@react-navigation/native';
import { Text, TouchableOpacity, View } from '../overridedComponents';

interface Iprops {
  item: IuserEvent;
}

const UserEventCard: React.FC<Iprops> = ({ item }) => {
  const { navigate } = useNavigation();

  const handleNavigate = () =>
    navigate('eventDetails', { eventId: item.events.id });

  return (
    <TouchableOpacity onPress={handleNavigate}>
      <View style={styles.container}>
        <Image style={styles.image} source={{ uri: item.events.photoUri }} />
        <View style={styles.info}>
          <Text style={styles.idText}>#{item.id}</Text>
          <Text style={styles.title}>
            {handleGetLocalizedField('nameEn', 'nameAr', item.events)}
          </Text>
          <Text style={styles.dateText}>
            {/* TODO */}
            {i18n.t('order_date')}: {}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default UserEventCard;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    ...shadowStyle,
  },
  image: {
    width: 80,
    height: 100,
    borderRadius: 10,
    backgroundColor: Colors.black,
  },
  info: {
    gap: 10,
    padding: 5,
    flexShrink: 1,
    justifyContent: 'space-between',
  },
  idText: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'SF-Medium',
  },
  title: {
    color: Colors.secondary,
    fontFamily: 'SF-Medium',
  },
  dateText: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: 'SF-Medium',
  },
});
