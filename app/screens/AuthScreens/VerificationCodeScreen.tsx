import * as React from 'react';
import i18n from '../../localization';
import { width } from '../../constants';
import { StatusBar } from 'expo-status-bar';
import Colors from '../../constants/Colors';
import { useNavigation } from '@react-navigation/native';
import AuthButton from '../../components/Auth/AuthButton';
import { Text, View } from '../../components/overridedComponents';
import { StyleSheet, View as RNView, TextInput } from 'react-native';
import {
  Cursor,
  CodeField,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

const CELL_COUNT = 5;

const VerificationCodeScreen = () => {
  const { navigate } = useNavigation();
  const [value, setValue] = React.useState('');
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  const isDisabled = value.length < 5;

  return (
    <View style={styles.container}>
      <RNView style={{ gap: 35 }}>
        <RNView style={styles.textContainer}>
          <Text style={styles.thinText}>{i18n.t('code_verification')}</Text>
          <Text style={styles.text}>{i18n.t('code_verification_text')}</Text>
        </RNView>
        <CodeField
          ref={ref}
          {...props}
          value={value}
          cellCount={CELL_COUNT}
          testID='my-code-input'
          onChangeText={setValue}
          keyboardType='number-pad'
          InputComponent={TextInput}
          textContentType='oneTimeCode'
          rootStyle={[styles.codeFieldRoot]}
          renderCell={({ index, symbol, isFocused }) => (
            <Text
              key={index}
              style={[styles.cell, isFocused && styles.focusCell]}
              onLayout={getCellOnLayoutHandler(index)}
            >
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
          )}
        />
      </RNView>
      <AuthButton
        onPress={() => {}}
        isLoading={isLoading}
        isDisabled={isDisabled}
        label={i18n.t('continue_button')}
        style={[styles.continueButton, styles.commonWidth]}
      />
      <StatusBar style='dark' />
    </View>
  );
};

export default VerificationCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundGray,
  },
  commonWidth: {
    width: width - 50,
  },
  continueButton: {
    backgroundColor: Colors.primary,
  },
  textContainer: {
    gap: 17,
    alignItems: 'center',
  },
  thinText: {
    fontSize: 22,
    fontFamily: 'SF-Thin',
  },
  text: {
    fontSize: 16,
    width: width * 0.7,
    textAlign: 'center',
    fontFamily: 'SF-Bold',
  },
  codeFieldRoot: {
    gap: 20,
  },
  cell: {
    width: 50,
    height: 50,
    fontSize: 24,
    borderWidth: 1,
    lineHeight: 38,
    borderRadius: 10,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  focusCell: {
    borderColor: '#000',
  },
});
