import * as React from 'react';import i18n from '../localization';
import Colors from '../constants/Colors';
import { useAppContext } from '../context';
import { StatusBar } from 'expo-status-bar';
import { handleFetchEvent } from '../api/events';
import { handleBookEvent } from '../api/userEvents';
import { Ievent, RootStackParamList } from '../types';
import { daysOfTheWeek, height, width } from '../constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Header from '../components/EventDetailsScreen/Header';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { Image, StyleSheet, ScrollView, View } from 'react-native';
import { handleShowToast, handleGetLocalizedField } from '../helpers';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, TouchableOpacity } from '../components/overridedComponents';

const EventDetailsScreen: React.FC<
  NativeStackScreenProps<RootStackParamList, 'eventDetails'>
> = ({ route, navigation }) => {
  const { userProfile, handleLogout } = useAppContext();
  const [event, setEvent] = React.useState<Ievent | undefined>();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await handleFetchEvent({
          id: route?.params?.eventId,
          handleLogout,
        });
        setEvent(res);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    })();
  }, [route]);

  const handleBook = async () => {
    if (!event?.id || !userProfile?.id) return;

    try {
      await handleBookEvent({
        handleLogout,
        eventsId: event.id,
        userId: userProfile.id,
      });
      navigation.navigate('successfulAction', {
        title: i18n.t('success'),
        message: i18n.t('event_booked_successfully'),
      });
    } catch (err: any) {
      handleShowToast({
        type: 'error',
        text1: 'error',
        message: err.message,
      });
    }
  };

  if (!event) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.black }}>
        <Header />
        <View style={{ paddingTop: 60 }}>
          {isLoading ? (
            <LoadingIndicator isLoading color={Colors.tertiary} />
          ) : (
            <Text style={styles.notFoundText}>{i18n.t('not_found')}</Text>
          )}
          <StatusBar style='light' />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        blurRadius={15}
        style={styles.imageBackground}
        source={{ uri: event?.photoUri }}
      />
      <View style={styles.background} />
      <Header />
      <ScrollView contentContainerStyle={styles.bodyContainer}>
        <Image style={styles.image} source={{ uri: event?.photoUri }} />
        <Text style={styles.headerText}>
          {handleGetLocalizedField('nameEn', 'nameAr', event)}
        </Text>
        <Text style={styles.descriptionText}>
          {handleGetLocalizedField('descriptionEn', 'descriptionAr', event)}
        </Text>
        <View style={styles.daysWrapper}>
          {daysOfTheWeek.map((day, index) => (
            <View key={index} style={styles.dayWrapper}>
              <Text style={styles.dayText}>{day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.timeWrapper}>
          <Text style={styles.timeText}>
            {i18n.t('from')} {event.from} {i18n.t('to')} {event.to}
          </Text>
        </View>
        <View style={{ gap: 30 }}>
          <View style={styles.infoWrapper}>
            <MaterialCommunityIcons
              size={24}
              color={Colors.white}
              name='account-group-outline'
            />
            <View style={styles.infoSubWrapper}>
              <Text style={styles.subTitle}>{i18n.t('capacity')}</Text>
              <Text style={styles.message}>
                {event.capacity} {i18n.t('members')},{' '}
                <Text style={{ color: Colors.tertiary }}>
                  {event.booked} {i18n.t('persons_booked_this_class')}
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.subInfoWrapper}>
            <View style={styles.smallInfoWrapper}>
              <MaterialCommunityIcons
                size={24}
                color={Colors.white}
                name='account-outline'
              />
              <View style={styles.infoSubWrapper}>
                <Text style={styles.subTitle}>{i18n.t('coach')}</Text>
                <Text style={styles.message}>
                  {handleGetLocalizedField('nameEn', 'nameAr', event.user) ||
                    '-'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footerWrapper}>
        <TouchableOpacity onPress={handleBook}>
          <Text style={styles.buttonText}>{i18n.t('book_now')}</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style='light' />
    </View>
  );
};

export default EventDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageBackground: {
    width,
    height,
    top: 0,
    left: 0,
    position: 'absolute',
  },
  background: {
    width,
    height,
    top: 0,
    left: 0,
    position: 'absolute',
    backgroundColor: '#00000099',
  },
  bodyContainer: {
    gap: 15,
    padding: 16,
    alignItems: 'center',
  },
  image: {
    borderRadius: 10,
    width: width / 1.5,
    height: width / 1.5,
    backgroundColor: Colors.black,
  },
  headerText: {
    fontSize: 24,
    marginTop: 10,
    color: Colors.white,
    fontFamily: 'SF-Semibold',
  },
  descriptionText: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: 'SF-Medium',
  },
  daysWrapper: {
    gap: 5,
    flexWrap: 'wrap',
    width: width - 32,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayWrapper: {
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: Colors.tertiary,
  },
  dayText: {
    fontSize: 10,
    fontFamily: 'SF-Medium',
  },
  timeWrapper: {
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF66',
  },
  timeText: {
    fontSize: 10,
    color: Colors.white,
    fontFamily: 'SF-Medium',
  },
  infoWrapper: {
    gap: 15,
    width: width - 32,
    alignItems: 'center',
    flexDirection: 'row',
  },
  smallInfoWrapper: {
    gap: 15,
    alignItems: 'center',
    flexDirection: 'row',
    width: (width - 32) / 2 - 10,
  },
  infoSubWrapper: {
    gap: 5,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: 'SF-Medium',
    color: Colors.lightGray,
  },
  message: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'SF-Medium',
  },
  subInfoWrapper: {
    gap: 10,
    width: width - 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerWrapper: {
    margin: 16,
    marginBottom: 25,
  },
  bookedEventText: {
    padding: 16,
    textAlign: 'center',
    color: Colors.tertiary,
  },
  buttonText: {
    padding: 16,
    borderRadius: 10,
    overflow: 'hidden',
    textAlign: 'center',
    color: Colors.black,
    fontFamily: 'SF-Bold',
    backgroundColor: Colors.tertiary,
  },
  notFoundText: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.white,
    fontFamily: 'SF-Medium',
  },
});
