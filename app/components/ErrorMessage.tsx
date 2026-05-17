import * as React from 'react';import Colors from '../constants/Colors';
import { Text } from './overridedComponents';
import { StyleSheet, View } from 'react-native';

interface Props {
  width: number;
  message: string;
}

const ErrorMessage: React.FC<Props> = ({ width, message }) => {
  if (!message) return <></>;

  return (
    <View style={[styles.container, { width }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

export default ErrorMessage;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Colors.darkRed,
    backgroundColor: Colors.lightRed,
  },
  text: {
    color: Colors.darkRed,
  },
});
