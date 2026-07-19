import Colors from './Colors';
import i18n from '../localization';
import Constants from 'expo-constants';
import { IpickerOption } from '../types';
import { Dimensions } from 'react-native';

export const width = Dimensions.get('screen').width;
export const height = Dimensions.get('screen').height;

export const statusBarHeight = Constants.statusBarHeight;

// ASYNC STORAGE KEYS
export const LOCALE = 'locale';
export const HAS_OPENED_APP_BEFORE = 'hasOpenedAppBefore';

// HOMESCREEN HEADER
export const HOMESCREEN_HEADER_translateY = 55;
export const HOMESCREEN_HEADER_headerHeight = 175;
export const HOMESCREEN_HEADER_paddingHorizontal = 16;
export const HOMESCREEN_HEADER_headerBodyHeight =
  HOMESCREEN_HEADER_headerHeight -
  HOMESCREEN_HEADER_translateY -
  statusBarHeight;

export const API_BASE_ENDPOINT = 'http://192.168.1.2/api';
export const TOKEN = 'token';
export const REFRESH_TOKEN = 'refreshToken';
export const USER_EMAIL = 'userEmail';

export const genderOptions: IpickerOption[] = [
  {
    key: 1,
    value: 'Male',
    label: i18n.t('male_select_option'),
  },
  {
    key: 2,
    value: 'Female',
    label: i18n.t('female_select_option'),
  },
];

export const shadowStyle = {
  shadowColor: Colors.secondary,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
};

export const daysOfTheWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
