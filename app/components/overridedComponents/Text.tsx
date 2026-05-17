import * as React from 'react';import { StyleSheet, Text as RNText, TextProps } from 'react-native';

const Text: React.FC<TextProps> = ({ style, children, ...props }) => {
  return (
    <RNText style={[styles.text, style]} {...props}>
      {children}
    </RNText>
  );
};

export default Text;

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontFamily: 'SF-Regular',
  },
});
