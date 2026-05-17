import * as React from 'react';import i18n from '../localization';
import Colors from '../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { Modal, StyleSheet } from 'react-native';
import {
  Text,
  View,
  TouchableOpacity,
} from '../components/overridedComponents';

interface Iprops {
  title: string;
  isVisible: boolean;
  isDisabled: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
}

const ConfirmationModal: React.FC<Iprops> = ({
  title,
  isVisible,
  isDisabled,
  handleClose,
  handleConfirm,
}) => {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType='fade'
      statusBarTranslucent
      onRequestClose={isDisabled ? undefined : handleClose}
    >
      <View isHeaderless style={styles.ModalContainer}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            disabled={isDisabled}
            style={[styles.button, isDisabled && styles.disabledButton]}
            onPress={handleConfirm}
          >
            <Text style={styles.buttonText}>{i18n.t('confirm')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isDisabled}
            onPress={handleClose}
            style={[
              styles.button,
              styles.secondaryButton,
              isDisabled && styles.disabledButton,
            ]}
          >
            <Text style={styles.buttonText}>{i18n.t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <StatusBar style='light' />
    </Modal>
  );
};

export default ConfirmationModal;

const styles = StyleSheet.create({
  ModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#000000dd',
  },

  innerContainer: {
    gap: 10,
    padding: 30,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 20,
    paddingBottom: 30,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
  },
  secondaryButton: {
    backgroundColor: Colors.gray,
  },
  buttonText: {
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
