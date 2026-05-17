import * as React from 'react';import i18n from '../localization';
import { StyleSheet, Image } from 'react-native';
import BottomButton from '../components/BottomButton';
import { Text, View } from '../components/overridedComponents';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList, RootTabParamList } from '../types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Colors from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';

const SuccessfulActionScreen: React.FC<
  NativeStackScreenProps<RootStackParamList, 'successfulAction'>
> = ({ route }) => {
  const { navigate } = useNavigation<NavigationProp<RootTabParamList>>();

  const { title, message, extraMessage } = route?.params || {};

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Image source={require('../assets/images/success-image.png')} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {extraMessage && (
          <Text style={styles.extraMessage}>{extraMessage}</Text>
        )}
      </View>
      <BottomButton
        isLoading={false}
        shouldShowShadow={false}
        label={i18n.t('back_to_home')}
        onPress={() => navigate('Home')}
      />
    
      <StatusBar style='dark' />
    </View>
  );
};

export default SuccessfulActionScreen;

const styles = StyleSheet.create({
  container: {
    gap: 15,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: Colors.primary,
    fontFamily: 'SF-Semibold',
  },
  message: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: 'SF-Medium',
  },
  extraMessage: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: 'SF-Medium',
  },
});
