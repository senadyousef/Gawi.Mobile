import {
  TouchableOpacityProps,
  TouchableOpacity as RNTouchableOpacity,
} from 'react-native';
import * as React from 'react';
const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  activeOpacity,
  ...props
}) => {
  return <RNTouchableOpacity activeOpacity={activeOpacity || 0.7} {...props} />;
};

export default TouchableOpacity;
