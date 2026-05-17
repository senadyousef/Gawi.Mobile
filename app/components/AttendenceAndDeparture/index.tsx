import * as React from "react";
import { StatusBar } from "expo-status-bar";
import Colors from "../../constants/Colors";
import { View } from "../overridedComponents";
import { Modal, StyleSheet } from "react-native";
import AttendanceAndDeparture from "./AttendanceAndDeparture";

interface Iprops {
  isVisible: boolean;
  handleClose: () => void;
}

const AttendanceAndDepartureModal: React.FC<Iprops> = ({
  isVisible,
  handleClose,
}) => {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <AttendanceAndDeparture handleClose={handleClose} />
        <StatusBar style="dark" />
      </View>
    </Modal>
  );
};

export default AttendanceAndDepartureModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: Colors.borderGray,
  },
});
