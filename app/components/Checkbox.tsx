import Colors from '../constants/Colors';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, TouchableOpacity } from './overridedComponents';
import { useI18n } from '../hooks/useI18n';

interface Props {
  label: string;
  isChecked: boolean;
  setIsChecked: (val: boolean) => void;
}

const Checkbox: React.FC<Props> = ({ label, isChecked, setIsChecked }) => {
  const { getDirection } = useI18n();

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[styles.wrapper, getDirection()]}
      onPress={() => setIsChecked(!isChecked)}
    >
      <>
        <View
          style={[styles.checkboxBase, isChecked && styles.checkboxChecked]}
        >
          {isChecked && (
            <MaterialCommunityIcons
              size={12}
              name='check'
              color={Colors.black}
            />
          )}
        </View>
        <Text style={styles.label}>{label}</Text>
      </>
    </TouchableOpacity>
  );
};

export default Checkbox;

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'SF-Medium',
  },
  wrapper: {
    gap: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBase: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: Colors.white,
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
});
