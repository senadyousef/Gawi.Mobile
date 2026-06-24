import i18n from '../localization';
import {
  ILoginFormRules,
  IresetPasswordFormRules,
  ImanageAccountFormRules,
  IforgotPasswordFormRules,
} from '../types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginFormRules: ILoginFormRules = {
  email: {
    validate: (email) => {
      if (!email?.trim()) return i18n.t('email_is_required');
      else if (!emailRegex.test(email)) return i18n.t('email_is_not_valid');
      return true;
    },
  },
  password: {
    validate: (password) => {
      if (!password?.trim()) return i18n.t('password_is_required');
      // TODO check min on the backend
     
      return true;
    },
  },
};

export const forgotPasswordFormRules: IforgotPasswordFormRules = {
  email: {
    validate: (email) => {
      if (!email?.trim()) return i18n.t('email_is_required');
      else if (!emailRegex.test(email)) return i18n.t('email_is_not_valid');
      return true;
    },
  },
};

export const resetPasswordFormRules: IresetPasswordFormRules = {
  password: {
    validate: (password) => {
      if (!password?.trim()) return i18n.t('password_is_required');
      // TODO check min on the backend
      else if (password?.trim().length < 6)
        return i18n.t('password_min_length');
      return true;
    },
  },
  confirmation_password: {
    validate: (confirmationPassword, form) => {
      if (confirmationPassword !== form.password) {
        return i18n.t('passwords_dont_match');
      }
      return true;
    },
  },
};

export const ManageAccountFormRules: ImanageAccountFormRules = {
  email: {
    validate: (email) => {
      if (!email?.trim()) return i18n.t('email_is_required');
      else if (!emailRegex.test(email) || email.trim().length > 50)
        return i18n.t('email_is_not_valid');
      return true;
    },
  },
  username: {
    validate: (value) => {
      const username = value?.trim() || '';
      if (username.length < 1) return i18n.t('username_is_required');
      else if (username.length > 50) return i18n.t('username_max');
      return true;
    },
  },
  age: {
    min: { value: 1, message: i18n.t('age_min') },
    max: {
      value: 99,
      message: i18n.t('age_max'),
    },
    required: false,
  },
  bod: {
    validate: () => true,
  },
  mobilePhone: {
    validate: () => true,
  },
};
