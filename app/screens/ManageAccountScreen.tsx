import * as React from 'react';import { format } from 'date-fns';
import i18n from '../localization';
import { width } from '../constants';
import { useAppContext } from '../context';
import { useI18n } from '../hooks/useI18n';
import { StatusBar } from 'expo-status-bar';
import AppInput from '../components/AppInput';
import { ImanageAccountForm } from '../types';
import ErrorText from '../components/ErrorText';
import { StyleSheet, View } from 'react-native';
import DatePicker from '../components/DatePicker';
import { ManageAccountFormRules } from '../formRules';
import BottomButton from '../components/BottomButton';
import ErrorMessage from '../components/ErrorMessage';
import { Text } from '../components/overridedComponents';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

const ManageAccountScreen = () => {
  const { getDirection } = useI18n();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const { handleLogout, userProfile, handleFetchUserProfile } = useAppContext();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ImanageAccountForm>({
    defaultValues: {
      email: userProfile?.email,
      username: userProfile?.nameEn,
      mobilePhone: userProfile?.mobilePhone,
      age: userProfile?.age ? userProfile.age.toString() : undefined,
      bod: userProfile?.bod ? new Date(userProfile?.bod) : undefined,
    },
  });

  const onSubmit: SubmitHandler<ImanageAccountForm> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      // TODO handle update profile
      // only fetch user profile
      // await handleFetchUserProfile();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <ErrorMessage width={width - 32} message={errorMessage} />
        <View>
          <Controller
            name='email'
            control={control}
            rules={ManageAccountFormRules['email']}
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                value={value}
                onBlur={onBlur}
                editable={false}
                onChangeText={onChange}
                iconName='email-outline'
                keyboardType='email-address'
                placeholder={i18n.t('email_input_placeholder')}
              />
            )}
          />
          {errors.email?.message && (
            <ErrorText>{errors.email.message}</ErrorText>
          )}
        </View>
        <View>
          <Controller
            name='username'
            control={control}
            rules={ManageAccountFormRules['username']}
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                iconName='account-outline'
                placeholder={i18n.t('username_input_placeholder')}
              />
            )}
          />
          {errors.username?.message && (
            <ErrorText>{errors.username.message}</ErrorText>
          )}
        </View>
        <View>
          <Controller
            name='bod'
            control={control}
            rules={ManageAccountFormRules['bod']}
            render={({ field: { onChange, value } }) => (
              <DatePicker
                handleSave={onChange}
                trigger={
                  <AppInput
                    editable={false}
                    iconName='calendar'
                    placeholder={i18n.t('dob_input_placeholder')}
                    value={value ? format(value, 'yyyy-MM-dd') : ''}
                  />
                }
              />
            )}
          />
          {errors.bod?.message && <ErrorText>{errors.bod.message}</ErrorText>}
        </View>
        <View>
          <Controller
            name='mobilePhone'
            control={control}
            rules={ManageAccountFormRules['mobilePhone']}
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                value={value}
                onBlur={onBlur}
                iconName='phone'
                onChangeText={onChange}
                keyboardType='phone-pad'
                placeholder={i18n.t('phonenumber_input_placeholder')}
              />
            )}
          />
          {errors.bod?.message && <ErrorText>{errors.bod.message}</ErrorText>}
        </View>
        <View>
          <Controller
            name='age'
            control={control}
            rules={ManageAccountFormRules['age']}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.ageWrapper}>
                <Text>{i18n.t('your_age')}</Text>
                <AppInput
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  keyboardType='decimal-pad'
                  containerStyle={styles.ageInput}
                  placeholder={i18n.t('age_input_placeholder')}
                />
              </View>
            )}
          />
          {errors.age?.message && <ErrorText>{errors.age.message}</ErrorText>}
        </View>
        <StatusBar style='dark' />
      </View>
      <BottomButton
        isLoading={isLoading}
        label={i18n.t('save_changes')}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
};

export default ManageAccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    gap: 15,
    padding: 16,
  },
  footerStyle: {
    paddingVertical: 20,
  },
  ageWrapper: {
    width: width - 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageInput: {
    width: 100,
    alignItems: 'center',
  },
});
