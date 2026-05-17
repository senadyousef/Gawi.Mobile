import { format } from 'date-fns';
import i18n from '../localization';
import { IeventDate } from '../types';
import Colors from '../constants/Colors';
import { MarkedDates } from 'react-native-calendars/src/types';
import { TOKEN, USER_EMAIL, statusBarHeight } from '../constants';
import Toast, { ToastShowParams } from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const greet = (): string => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return i18n.t('good_morning');
  } else if (currentHour >= 12 && currentHour < 18) {
    return i18n.t('good_afternoon');
  } else {
    return i18n.t('good_evening');
  }
};

export const handleRememberMe = async (email: string): Promise<void> => {
  await AsyncStorage.setItem(USER_EMAIL, email);
};

export const fetchSavedEmail = async (): Promise<string> =>
  (await AsyncStorage.getItem(USER_EMAIL)) || '';

export const handleClearRememberMe = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_EMAIL);
};

export const handleGetToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN);

};

export const handleGetLocalizedField = <T>(
  englishField: keyof T,
  arabicField: keyof T,
  data: T,
): string => {
  if (!data) return '';
  if (i18n.locale === 'en') return data[englishField] as string;
  else return data[arabicField] as string;
};

export const formatEventDates = (
  dates: IeventDate[],
  setBookedEvents: React.Dispatch<
    React.SetStateAction<{ [key: number]: boolean }>
  >,
): MarkedDates => {
  const events: MarkedDates = {};

  dates.forEach((item) => {
    setBookedEvents((oldValues) => ({
      ...oldValues,
      [item.eventId]: item.booking,
    }));

    const key = format(new Date(item.date), 'yyyy-MM-dd');

    const dots: any = [
      {
        color: Colors.primary,
        selectedDotColor: Colors.white,
      },
    ];

    if (item.booking) {
      dots.push({
        color: Colors.green,
      });
    }

    if (!events[key] || ((events[key] && events[key].dots) || []).length < 2) {
      events[key] = {
        marked: true,
        dots,
      };
    }
  });

  return events;
};

interface Iparams extends ToastShowParams {
  message?: string;
}

export const handleShowToast = ({
  text1,
  text2,
  message,
  ...ToastShowParams
}: Iparams) => {
  Toast.show({
    ...ToastShowParams,
    topOffset: statusBarHeight,
    ...(text1 ? { text1: i18n.t(text1) } : {}),
    ...(text2 ? { text2: i18n.t(text2) } : {}),
    ...(message ? { text2: message } : {}),
  });
};

export const defaultErrorToast = () => {
  handleShowToast({
    type: 'error',
    text1: 'error',
    text2: 'an_error_occured',
  });
};

export const log = (data: any) => {
  console.log(JSON.stringify({ data }, null, 2));
};

export const addQueryItems = (
  items: {
    name: string;
    value: any;
  }[],
) => {
  if (items.every((item) => item.value === undefined)) return '';

  const queryItems: string[] = [];

  items.forEach((item) => {
    if (!item.value) return;
    queryItems.push(`${item.name}=${item.value}`);
  });

  if (!queryItems.length) return '';

  return `?${queryItems.join('&')}`;
};

export const returnRandomArrayItem = <T>(array: T[]): T | undefined => {
  if (!array) return;

  const randomIndex: number = Math.floor(Math.random() * array.length);

  return array[randomIndex];
};
