import Colors from '../constants/Colors';
import { statusBarHeight } from '../constants';
import { ActivityIndicator, StyleSheet } from 'react-native';
import React from 'react';

interface Props {
  color?: string;
  isOnTop?: boolean;
  isLoading: boolean;
}

export const LoadingIndicator: React.FC<Props> = ({
  isLoading,
  isOnTop = false,
  color = Colors.primary,
}) => {
  if (isLoading)
    return (
      <ActivityIndicator
        style={isOnTop && styles.isOnTop}
        size='small'
        color={color}
      />
    );
};

const styles = StyleSheet.create({
  isOnTop: {
    left: 0,
    right: 0,
    position: 'absolute',
    top: statusBarHeight,
  },
});
