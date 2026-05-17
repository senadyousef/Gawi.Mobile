import i18n from '../localization';
import { LOCALE } from '../constants';
import * as Localisation from 'expo-localization';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

// ── Module-level broadcast ────────────────────────────────────────────────────
type Listener = (lang: string) => void;
const listeners = new Set<Listener>();

export const useI18n = () => {
  const [, setTick] = useState(0); // dummy state — forces re-render on lang change

  useEffect(() => {
    const listener: Listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const isArabic = () => i18n.locale === 'ar';

  const getDirection = (): StyleProp<ViewStyle> => {
    const isIos = Platform.OS === 'ios';

    const ltr: StyleProp<ViewStyle> = isIos
      ? { direction: 'ltr' }
      : { flexDirection: 'row' };

    const rtl: StyleProp<ViewStyle> = isIos
      ? { direction: 'rtl' }
      : { flexDirection: 'row-reverse' };

    return i18n.locale.indexOf('en') > -1
      ? ltr
      : i18n.locale.indexOf('ar') > -1
      ? rtl
      : ltr;
  };

  const setLanguage = async (locale: string) => {
    i18n.locale = locale;
    await AsyncStorage.setItem(LOCALE, locale);
    listeners.forEach((l) => l(locale)); // ← notify all mounted screens
  };

  const initiateLocale = async () => {
    const locale = await AsyncStorage.getItem(LOCALE);

    if (locale) {
      const localeTranslation =
        locale.indexOf('en') > -1
          ? 'en'
          : locale.indexOf('ar') > -1
          ? 'ar'
          : 'en';
      setLanguage(localeTranslation);
    } else {
      const deviceLocale =
        Localisation.locale.indexOf('en') > -1
          ? 'en'
          : Localisation.locale.indexOf('ar') > -1
          ? 'ar'
          : 'en';
      setLanguage(deviceLocale);
    }
  };

  return {
    isArabic,
    setLanguage,
    getDirection,
    initiateLocale,
  };
};