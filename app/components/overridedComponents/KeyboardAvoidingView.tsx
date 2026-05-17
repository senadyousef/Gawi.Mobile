import {
  Platform,
  KeyboardAvoidingViewProps,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
} from 'react-native';
import * as React from 'react';
interface Props extends KeyboardAvoidingViewProps {
  onKeyboardDismiss?: () => void;
}

const KeyboardAvoidingView: React.FC<Props> = ({
  children,
  onKeyboardDismiss,
  ...props
}) => {
  return (
    <RNKeyboardAvoidingView
      enabled
      {...props}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {children}
    </RNKeyboardAvoidingView>
  );
};

export default KeyboardAvoidingView;
