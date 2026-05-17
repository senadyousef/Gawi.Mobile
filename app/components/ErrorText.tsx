import * as React from 'react';import { Text } from './overridedComponents';
import { StyleSheet, TextProps } from 'react-native';
import Colors from '../constants/Colors';

const ErrorText: React.FC<TextProps> = ({ children, style, ...props }) => {
  return (
    <Text style={[styles.text, style]} {...props}>
      {children}
    </Text>
  );
};

export default ErrorText;

const styles = StyleSheet.create({
  text: { color: Colors.error },
});
