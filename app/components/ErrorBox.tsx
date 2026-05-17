import * as React from 'react';import i18n from '../localization';
import Colors from '../constants/Colors';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from './overridedComponents';

interface Iprops {
  isLoading: boolean;
  onRetry: () => Promise<void>;
}

const ErrorBox: React.FC<Iprops> = ({ onRetry, isLoading }) => {
  return (
    <TouchableOpacity onPress={onRetry}>
      <View style={[styles.container, isLoading && { opacity: 0.5 }]}>
        <Text style={styles.text}>{i18n.t('failed_to_load')}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ErrorBox;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: Colors.darkRed,
    justifyContent: 'space-between',
    backgroundColor: Colors.lightRed,
  },
  text: {
    color: Colors.darkRed,
  },
});
