import * as React from 'react';import i18n from '../../localization';
import { useI18n } from '../../hooks/useI18n';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from '../overridedComponents';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../constants/Colors';
import { statusBarHeight } from '../../constants';

const Header = () => {
  const { goBack } = useNavigation();
  const { isArabic, getDirection } = useI18n();

  return (
    <View style={styles.header}>
      <View style={[styles.backButtonWrapper, getDirection()]}>
        <TouchableOpacity onPress={goBack}>
          <MaterialCommunityIcons
            size={24}
            color={Colors.white}
            name={isArabic() ? 'arrow-right' : 'arrow-left'}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{i18n.t('class_details_title')}</Text>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: statusBarHeight,
    height: statusBarHeight + 50,
    justifyContent: 'space-between',
  },
  backButtonWrapper: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: Colors.white,
    fontFamily: 'SF-Semibold',
  },
});
