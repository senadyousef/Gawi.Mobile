import * as React from 'react';import i18n from '../../localization';
import Colors from '../../constants/Colors';
import { Text } from '../overridedComponents';
import { StyleSheet, View, TouchableOpacity, ViewProps } from 'react-native';

interface Props extends ViewProps {
  label: string;
  isLoading?: boolean;
  onPress: () => void;
  isDisabled?: boolean;
  noBackground?: boolean;
}

const AuthButton: React.FC<Props> = ({
  label,
  style,
  onPress,
  isLoading = false,
  isDisabled = false,
  noBackground = false,
  ...props
}) => {
  const disabled = isLoading || isDisabled;
   
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      style={disabled && { opacity: 0.5 }}
    >
      <View
        style={[styles.button, noBackground && styles.transparentButton, style]}
        {...props}
      >
        <Text
          style={[
            styles.buttonText,
            noBackground && styles.transparentButtonText,
          ]}
        >
          {isLoading ? i18n.t('loading') : label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default AuthButton;

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#ff7002",
  },
  buttonText: {
    color: Colors.black,
    textAlign: 'center',
    fontFamily: 'SF-Medium',
  },
  transparentButton: {
    backgroundColor: '#ffffff00',
  },
  transparentButtonText: {
    color: Colors.primary,
  },
});
