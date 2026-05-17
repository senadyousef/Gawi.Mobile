import * as React from 'react';import i18n from '../../localization';
import Colors from '../../constants/Colors';
import { useI18n } from '../../hooks/useI18n';
import { Image, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity } from '../overridedComponents';
import { HOMESCREEN_HEADER_paddingHorizontal, width } from '../../constants';

const data = [
  {
    percentage: '50',
    message: 'For annual subscription',
    image: require('../../assets/images/home-screen-carousel-image.png'),
  },
  {
    percentage: '40',
    message: 'For annual subscription',
    image: require('../../assets/images/home-screen-carousel-image.png'),
  },
  {
    percentage: '30',
    message: 'For annual subscription',
    image: require('../../assets/images/home-screen-carousel-image.png'),
  },
];

const carouselHight = 200;
const carouselWidth = width - HOMESCREEN_HEADER_paddingHorizontal * 2;

const StoreCarousel = () => {
  const { isArabic } = useI18n();

  return (
    <View style={{ height: carouselHight }}>
      <Carousel
        loop
        autoPlay
        data={data}
        width={carouselWidth}
        height={carouselHight}
        style={styles.carousel}
        autoPlayInterval={2500}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.title}>
              {isArabic() && i18n.t('off')} {item.percentage}%{' '}
              {!isArabic() && i18n.t('off')}
            </Text>
            <Text style={styles.subTitle}>{item.message}</Text>
            <TouchableOpacity>
              <View style={styles.bookNow}>
                <Text style={styles.bookNowText}>{i18n.t('book_now')}</Text>
                <MaterialCommunityIcons
                  size={24}
                  color={Colors.tertiary}
                  name='chevron-right-circle'
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default StoreCarousel;

const styles = StyleSheet.create({
  carousel: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardContainer: {
    padding: 20,
    width: carouselWidth,
    height: carouselHight,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  image: {
    width: carouselWidth,
    position: 'absolute',
    height: carouselHight,
  },
  title: {
    fontSize: 32,
    color: Colors.white,
    fontFamily: 'SF-Bold',
  },
  subTitle: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'SF-Medium',
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
});
