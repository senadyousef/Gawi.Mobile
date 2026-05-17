import React from 'react';
import Colors from '../constants/Colors';
import { StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      text2NumberOfLines={5}
      style={styles.successToastStyle}
      text1Style={styles.successToastText1Style}
      text2Style={styles.successToastText2Style}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text2NumberOfLines={5}
      style={styles.errorToastStyle}
      text1Style={styles.errorToastText1Style}
      text2Style={styles.errorToastText2Style}
    />
  ),
};

const styles = StyleSheet.create({
  successToastStyle: {
    borderLeftWidth: 0,
    backgroundColor: Colors.success,
  },
  successToastText1Style: {
    fontSize: 17,
    color: Colors.black,
  },
  successToastText2Style: {
    fontSize: 15,
    color: Colors.secondary,
  },
  errorToastStyle: {
    borderLeftWidth: 0,
    backgroundColor: Colors.error,
  },
  errorToastText1Style: {
    fontSize: 17,
    color: Colors.white,
  },
  errorToastText2Style: {
    fontSize: 15,
    color: Colors.white,
  },
});
