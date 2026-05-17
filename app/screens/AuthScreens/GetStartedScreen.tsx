import * as React from 'react';
import i18n from '../../localization';
import { StatusBar } from 'expo-status-bar';
import Colors from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthButton from '../../components/Auth/AuthButton';
import { StyleSheet, Image, View as RNView } from 'react-native';
import { Text, View } from '../../components/overridedComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HAS_OPENED_APP_BEFORE, height, width } from '../../constants';
import { useAppContext } from '../../context';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GetStarted'>;

const GetStartedScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { setShouldShowSignUp } = useAppContext();
  
  const handlePress = async () => {
    await AsyncStorage.setItem(HAS_OPENED_APP_BEFORE, HAS_OPENED_APP_BEFORE);
    setShouldShowSignUp(false); // Make sure flag is reset
    navigation.navigate('Login');
  };

  return (
    <View isHeaderless style={styles.container}>
      <Image
        style={styles.background}
        source={require('../../assets/images/get-started-image.png')}
      />
      <LinearGradient
        style={styles.gradient}
        colors={['transparent', Colors.backgroundBlue]}
      />
      <Image
        style={styles.logo}
        source={require('../../assets/images/Gawi.png')}
      />
      <RNView style={styles.textWrapper}>
        <Text style={styles.thinText}>{i18n.t('welcome_to')}</Text>
        <Text style={styles.text}>{i18n.t('primal_gym')}</Text>
        <Text style={styles.thinText}>{i18n.t('fitness_is_a_life_style')}</Text>
      </RNView>
      <AuthButton
        onPress={handlePress}
        style={{ width: 230 }}
        label={i18n.t('get_started')}
      />
      <StatusBar style='light' />
    </View>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 68,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  background: {
    width,
    height,
    objectFit: 'cover',
    position: 'absolute',
  },
  gradient: {
    width,
    height,
    flex: 1,
    position: 'absolute',
  },
  logo: {
    width: width * 0.7,
    height: height * 0.3,
    resizeMode: "contain",
    marginBottom: 50,  
  },
  thinText: {
    fontSize: 18,
    color: Colors.white,
    fontFamily: 'SF-Thin',
  },
  text: {
    fontSize: 28,
    color: Colors.white,
    letterSpacing: 4.48,
    fontFamily: 'SF-Bold',
  },
  textWrapper: {
    gap: 12,
    marginBottom: 36,
    alignItems: 'center',
  },
});