import * as React from 'react';import { height, width } from '../constants';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, Image } from 'react-native';

interface Iprops {
  setIsAnimationFinished: React.Dispatch<React.SetStateAction<boolean>>;
}

const SplashScreen: React.FC<Iprops> = ({ setIsAnimationFinished }) => {
  const [isGymLogoLoaded, setIsGymLogoLoaded] = React.useState<boolean>(false);
  const [isSmartUseLogoLoaded, setIsSmartUseLogoLoaded] =
    React.useState<boolean>(false);

  const handleOnGymLogoLoadEnd = () => setIsGymLogoLoaded(true);

  const handleOnSmartUseLogoLoadEnd = () => setIsSmartUseLogoLoaded(true);

  const isLoaded = isGymLogoLoaded && isSmartUseLogoLoaded;

  React.useEffect(() => {
    if (isLoaded) {
      setTimeout(() => setIsAnimationFinished(true), 2000);
    }
  }, [isLoaded]);

  return (
    <View style={styles.container}>
      <LinearGradient
        style={styles.gradient}
        colors={['transparent', '#006BA61A']}
      />
      {isLoaded ? (
        <>
          <Image
            style={styles.gymLogo}
            source={require('../assets/images/AnimatedMuscleUpLogoColored.gif')}
          />
          <Image
            style={styles.smartUseLogo}
            source={require('../assets/images/SmartUseGifLogo.gif')}
          />
        </>
      ) : (
        <>
          <Image
            style={styles.hidden}
            onLoadEnd={handleOnGymLogoLoadEnd}
            source={require('../assets/images/AnimatedMuscleUpLogoColored.gif')}
          />
          <Image
            style={styles.hidden}
            onLoadEnd={handleOnSmartUseLogoLoadEnd}
            source={require('../assets/images/SmartUseGifLogo.gif')}
          />
        </>
      )}
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymLogo: {
    width,
    height: 1000,
    objectFit: 'contain',
  },
  smartUseLogo: {
    width: 300,
    height: 50,
    bottom: 50,
    fontSize: 18,
    position: 'absolute',
  },
  gradient: {
    flex: 1,
    width,
    height,
    position: 'absolute',
  },
  hidden: {
    opacity: 0,
  },
});
