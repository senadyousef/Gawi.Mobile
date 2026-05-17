import * as React from 'react';import { View } from './overridedComponents';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardWrapper: React.FC<Props> = ({ style, children }) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

export default CardWrapper;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 10,
  },
});
