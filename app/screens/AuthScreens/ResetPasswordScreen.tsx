import * as React from 'react';
import i18n from '../../localization';
import { width } from '../../constants';
import { StatusBar } from 'expo-status-bar';
import Colors from '../../constants/Colors';
import { IresetPasswordForm } from '../../types';
import ErrorText from '../../components/ErrorText';
import AuthInput from '../../components/Auth/AuthInput';
import ErrorMessage from '../../components/ErrorMessage';
import { useNavigation, useRoute } from '@react-navigation/native';
import AuthButton from '../../components/Auth/AuthButton';
import { StyleSheet, View as RNView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resetPasswordFormRules } from '../../formRules';
import { Text, View } from '../../components/overridedComponents';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

const ResetPasswordScreen = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IresetPasswordForm>();
  const { navigate } = useNavigation();
  const route = useRoute<any>();
  const { email, code } = route.params;
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  // 👇 Toggle state for each password field's visibility
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    React.useState<boolean>(false);
  const isRTL = i18n.locale === 'ar';

  const onSubmit: SubmitHandler<IresetPasswordForm> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      if (data.password !== data.confirmation_password) {
        setErrorMessage(i18n.t('passwords_do_not_match'));
        return;
      }

      const res = await fetch(
        'http://192.168.1.16/resetpassmobile/reset-password',
        {
          method: 'POST',
          headers: { Accept: '*/*', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            code,
            password: data.password,
            confirmPassword: data.confirmation_password,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || i18n.t('something_went_wrong'));
      }

      navigate('Login');
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
          <Text style={styles.thinText}>{i18n.t('reset_password')}</Text>
          <Text style={styles.text}>{i18n.t('reset_password_text')}</Text>
        </RNView>

        <RNView style={{ gap: 10 }}>
          <ErrorMessage width={width - 50} message={errorMessage} />
          <RNView>
            <RNView style={styles.inputWrapper}>
              <Controller
                name='password'
                control={control}
                rules={resetPasswordFormRules['password']}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    value={value}
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    keyboardType='default'
                    onChangeText={onChange}
                    iconName='lock-outline'
                    containerStyle={styles.passwordInput}
                    placeholder={i18n.t('new_password_input_placeholder')}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={[
                  styles.eyeButton,
                  isRTL ? { left: 14 } : { right: 14 },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.lightGray}
                />
              </TouchableOpacity>
            </RNView>
            {errors.password?.message && (
              <ErrorText>{errors.password.message}</ErrorText>
            )}
          </RNView>
          <RNView>
            <RNView style={styles.inputWrapper}>
              <Controller
                control={control}
                name='confirmation_password'
                rules={resetPasswordFormRules['confirmation_password']}
                render={({ field: { onChange, onBlur, value } }) => (
                  <AuthInput
                    value={value}
                    onBlur={onBlur}
                    secureTextEntry={!showConfirmPassword}
                    keyboardType='default'
                    onChangeText={onChange}
                    iconName='lock-outline'
                    containerStyle={styles.passwordInput}
                    placeholder={i18n.t(
                      'confirm_new_password_input_placeholder'
                    )}
                  />
                )}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                style={[
                  styles.eyeButton,
                  isRTL ? { left: 14 } : { right: 14 },
                ]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons
                  name={
                    showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                  }
                  size={20}
                  color={Colors.lightGray}
                />
              </TouchableOpacity>
            </RNView>
            {errors.confirmation_password?.message && (
              <ErrorText>{errors.confirmation_password.message}</ErrorText>
            )}
          </RNView>
        </RNView>
      </RNView>
      <RNView style={{ gap: 15 }}>
        <AuthButton
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          label={i18n.t('reset_password_button')}
          style={[styles.resetPasswordButton, styles.commonWidth]}
        />
      </RNView>
      <StatusBar style='dark' />
    </View>
  );
};

export default ResetPasswordScreen;

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
  resetPasswordButton: {
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
  passwordInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  // 👇 Wraps AuthInput so the eye toggle can sit on top of it
  inputWrapper: {
    justifyContent: 'center',
  },
  eyeButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 28,
  },
});