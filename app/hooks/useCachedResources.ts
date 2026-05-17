import * as React from 'react';import * as Font from 'expo-font';
import { useI18n } from './useI18n';
import { useAppContext } from '../context';
import { HAS_OPENED_APP_BEFORE } from '../constants';
import { defaultErrorToast, handleGetToken } from '../helpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Ionicons,
  AntDesign,
  MaterialCommunityIcons,
} from '@expo/vector-icons';

export default function useCachedResources() {
  const { initiateLocale } = useI18n();
  const [isFirstTime, setIsFirstTime] = React.useState<boolean>(true);
  const { homeScreenEvents, handleFetchUserProfile } = useAppContext();
  const [isLoadingComplete, setLoadingComplete] = React.useState(false);

  React.useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        await initiateLocale();

        await Font.loadAsync({
          ...Ionicons.font,
          ...AntDesign.font,
          ...MaterialCommunityIcons.font,
          'SF-Thin': require('../assets/fonts/SF-UI-Display-Thin.ttf'),
          'SF-Bold': require('../assets/fonts/SF-UI-Display-Bold.ttf'),
          'SF-Medium': require('../assets/fonts/SF-UI-Display-Medium.ttf'),
          'SF-Regular': require('../assets/fonts/SF-UI-Display-Regular.ttf'),
          'SF-Semibold': require('../assets/fonts/SF-UI-Display-Semibold.ttf'),
        });

        const savedToken = await handleGetToken();
        const hasOpenedAppBefore = await AsyncStorage.getItem(
          HAS_OPENED_APP_BEFORE,
        );

        if (!!hasOpenedAppBefore) setIsFirstTime(false);

        if (savedToken) {
          // this will automatically set the authentication switch
          await handleFetchUserProfile();
        }
      } catch (e) {
        defaultErrorToast();
      } finally {
        setLoadingComplete(true);
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return {
    isFirstTime,
    homeScreenEvents,
    isLoadingComplete,
  };
}
