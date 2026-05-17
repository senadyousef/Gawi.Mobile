import * as React from 'react';import i18n from '../../localization';
import { width } from '../../constants';
import Colors from '../../constants/Colors';
import { Ievent } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { LinearGradient } from 'expo-linear-gradient';
import { handleGetLocalizedField } from '../../helpers';
import { TouchableOpacity } from '../overridedComponents';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppContext } from '../../context';

interface Props {
  item: Ievent;
  handleOpenEvent: (e: Ievent) => void;
}

const CalendarClassCard: React.FC<Props> = ({ item, handleOpenEvent }) => {
  const { bookedEvents } = useAppContext();
  const { isArabic, getDirection } = useI18n();

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.photoUri }} style={styles.image} />
      <LinearGradient
        style={styles.gradient}
        colors={
          isArabic()
            ? ['#000000cc', 'transparent']
            : ['transparent', '#000000cc']
        }
      />
      <View style={styles.header}>
        <View style={[{ flexDirection: 'row' }, getDirection()]}>
          <Text style={styles.headerText}>
            {handleGetLocalizedField('nameEn', 'nameAr', item)}
          </Text>
          <Text></Text>
        </View>
        <View style={[{ flexDirection: 'row' }, getDirection()]}>
          <Text style={styles.timeText}>
            {item.from} - {item.to}
          </Text>
          <Text></Text>
        </View>
        {bookedEvents[item.id] ? (
          <View style={[styles.bookNow, getDirection()]}>
            <Text style={[styles.bookNowText, styles.bookedEvent]}>
              {i18n.t('event_booked')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleOpenEvent(item)}>
            <View style={[styles.bookNow, getDirection()]}>
              <Text style={styles.bookNowText}>{i18n.t('book_now')}</Text>
              <MaterialCommunityIcons
                size={24}
                color={Colors.tertiary}
                name={
                  isArabic() ? 'chevron-left-circle' : 'chevron-right-circle'
                }
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default CalendarClassCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    width: width - 32,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  image: {
    position: 'absolute',
    width: width - 32,
    height: '100%',
    backgroundColor: Colors.white,
  },
  header: {
    gap: 2,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 18,
    color: Colors.white,
    fontFamily: 'SF-Semibold',
  },
  timeText: {
    fontSize: 10,
    color: Colors.tertiary,
    fontFamily: 'SF-Medium',
  },
  gradient: {
    flex: 1,
    width: width - 32,
    height: width - 32,
    position: 'absolute',
    transform: [{ rotate: '90deg' }],
  },
  bookNow: {
    gap: 5,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookNowText: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: 'SF-Medium',
  },
  bookedEvent: {
    color: Colors.green,
  },
});
