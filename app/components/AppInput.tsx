import * as React from 'react';import { width } from '../constants';
import Colors from '../constants/Colors';
import { useI18n } from '../hooks/useI18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  ViewStyle,
  StyleProp,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';

interface Props extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const AppInput: React.FC<Props> = ({
  style,
  iconName,
  containerStyle,
  editable = true,
  ...props
}) => {
  const { getDirection } = useI18n();

  return (
    <View style={[styles.container, containerStyle, getDirection()]}>
      {iconName && (
        <MaterialCommunityIcons
          size={20}
          name={iconName}
          color={Colors.lightGray}
        />
      )}
      <TextInput
        {...props}
        editable={editable}
        style={[styles.input, style, !editable && { pointerEvents: 'none' }]}
      />
    </View>
  );
};

export default AppInput;

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    width: width - 32,
    alignItems: 'center',
    flexDirection: 'row',
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  input: {
    flex: 1,
    height: '100%',
  },
});
