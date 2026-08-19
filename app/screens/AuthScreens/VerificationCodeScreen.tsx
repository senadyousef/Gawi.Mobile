import * as React from 'react';
import i18n from '../../localization';
import { width } from '../../constants';
import { StatusBar } from 'expo-status-bar';
import Colors from '../../constants/Colors';
import { IverifyCodeForm } from '../../types';
import ErrorText from '../../components/ErrorText';
import AuthInput from '../../components/Auth/AuthInput';
import ErrorMessage from '../../components/ErrorMessage';
import { useNavigation, useRoute } from '@react-navigation/native';
import AuthButton from '../../components/Auth/AuthButton';
import { StyleSheet, View as RNView } from 'react-native';
import { verifyCodeFormRules } from '../../formRules';
import { Text, View } from '../../components/overridedComponents';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

const VerifyCodeScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IverifyCodeForm>();
  const { navigate } = useNavigation();
  const route = useRoute<any>();
  const { email } = route.params ?? {};
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  React.useEffect(() => {
    if (!email) {
      navigate('ForgotPassword' as never);
    }
  }, [email]);

  const onSubmit: SubmitHandler<IverifyCodeForm> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await fetch(
        'https://gawifit.com/resetpassmobile/verify-code',
        {
          method: 'POST',
          headers: { Accept: '*/*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code: data.code }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || i18n.t('something_went_wrong'));
      }

      navigate('ResetPassword', { email, code: data.code });
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <RNView style={{ gap: 35 }}>
        <RNView style={styles.textContainer}>
          <Text style={styles.thinText}>{i18n.t('verify_code')}</Text>
          <Text style={styles.text}>{i18n.t('verify_code_text')}</Text>
        </RNView>

        <RNView style={{ gap: 10 }}>
          <ErrorMessage width={width - 50} message={errorMessage} />
          <RNView>
            <Controller
              name='code'
              control={control}
              rules={verifyCodeFormRules['code']}
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  iconName='numeric'
                  keyboardType='number-pad'
                  containerStyle={styles.codeInput}
                  placeholder={i18n.t('code_input_placeholder')}
                />
              )}
            />
            {errors.code?.message && (
              <ErrorText>{errors.code.message}</ErrorText>
            )}
          </RNView>
        </RNView>
      </RNView>
      <RNView style={{ gap: 15 }}>
        <AuthButton
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          label={i18n.t('verify_code_button')}
          style={[styles.verifyButton, styles.commonWidth]}
        />
      </RNView>
      <StatusBar style='dark' />
    </View>
  );
};

export default VerifyCodeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundGray,
  },
  commonWidth: { width: width - 50 },
  verifyButton: { backgroundColor: Colors.primary },
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
  codeInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
});