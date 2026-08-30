import * as React from 'react';
import i18n from '../../localization';
import { width } from '../../constants';
import { StatusBar } from 'expo-status-bar';
import Colors from '../../constants/Colors';
import { IforgotPasswordForm } from '../../types';
import ErrorText from '../../components/ErrorText';
import AuthInput from '../../components/Auth/AuthInput';
import ErrorMessage from '../../components/ErrorMessage';
import { useNavigation } from '@react-navigation/native';
import AuthButton from '../../components/Auth/AuthButton';
import { StyleSheet, View as RNView } from 'react-native';
import { forgotPasswordFormRules } from '../../formRules';
import { Text, View } from '../../components/overridedComponents';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

const ForgetPasswordScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IforgotPasswordForm>();
  const { navigate } = useNavigation();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  const onSubmit: SubmitHandler<IforgotPasswordForm> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await fetch('http://192.168.1.16/resetpassmobile/request', {
        method: 'POST',
        headers: { Accept: '*/*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || i18n.t('something_went_wrong'));
      }

      navigate('VerifyCode', { email: data.email });
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
          <Text style={styles.thinText}>{i18n.t('forgot_password')}</Text>
          <Text style={styles.text}>{i18n.t('forgot_password_text')}</Text>
        </RNView>

        <RNView style={{ gap: 10 }}>
          <ErrorMessage width={width - 50} message={errorMessage} />
          <RNView>
            <Controller
              name='email'
              control={control}
              rules={forgotPasswordFormRules['email']}
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  iconName='email-outline'
                  keyboardType='email-address'
                  containerStyle={styles.emailInput}
                  placeholder={i18n.t('email_input_placeholder')}
                />
              )}
            />
            {errors.email?.message && (
              <ErrorText>{errors.email.message}</ErrorText>
            )}
          </RNView>
        </RNView>
      </RNView>
      <RNView style={{ gap: 15 }}>
        <AuthButton
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          label={i18n.t('send_code_button')}
          style={[styles.sendCodeButton, styles.commonWidth]}
        />
        <AuthButton
          noBackground
          isLoading={isLoading}
          style={styles.commonWidth}
          onPress={() => navigate('Login')}
          label={i18n.t('back_to_login_button')}
        />
      </RNView>
      <StatusBar style='dark' />
    </View>
  );
};

export default ForgetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundGray,
  },
  commonWidth: { width: width - 50 },
  sendCodeButton: { backgroundColor: Colors.primary },
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
  emailInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
});