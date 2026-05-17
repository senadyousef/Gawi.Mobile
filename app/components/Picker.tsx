import * as React from 'react';import i18n from '../localization';
import Colors from '../constants/Colors';
import { IpickerOption } from '../types';
import { StatusBar } from 'expo-status-bar';
import { Modal, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from './overridedComponents';

interface Props {
  initialValue: string;
  isModalVisible: boolean;
  options: IpickerOption[];
  handleSave: (value: string) => void;
  setIsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const PickerComponent: React.FC<Props> = ({
  options,
  handleSave,
  initialValue,
  isModalVisible,
  setIsModalVisible,
}) => {
  const [selectedValue, setSelectedValue] =
    React.useState<string>(initialValue);

  const handleClose = () => setIsModalVisible(false);

  return (
    <Modal
      transparent
      animationType='fade'
      statusBarTranslucent
      visible={isModalVisible}
      onRequestClose={handleClose}
    >
      <View isHeaderless style={styles.container}>
        <TouchableOpacity onPress={handleClose}>
          <MaterialCommunityIcons
            size={30}
            name='arrow-left'
            color={Colors.white}
            style={styles.backButton}
          />
        </TouchableOpacity>
        <View style={styles.innerContainer}>
          <Picker
            selectedValue={selectedValue}
            onValueChange={(itemValue) => setSelectedValue(itemValue)}
          >
            {options.map(({ key, label, value }) => (
              <Picker.Item key={key} label={label} value={value} />
            ))}
          </Picker>
          <TouchableOpacity
            disabled={!selectedValue}
            onPress={() => handleSave(selectedValue)}
            style={[styles.button, !selectedValue && styles.disabledButton]}
          >
            <Text style={styles.buttonText}>{i18n.t('confirm')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <StatusBar style='light' />
    </Modal>
  );
};

export default PickerComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000dd',
    justifyContent: 'space-between',
  },
  innerContainer: {
    height: 350,
    justifyContent: 'space-between',
  },
  backButton: {
    position: 'absolute',
    left: 30,
  },
  button: {
    padding: 10,
    marginBottom: 30,
    borderRadius: 10,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
  },
});
