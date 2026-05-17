import * as React from 'react';import { format } from 'date-fns';
import i18n from '../localization';
import { statusBarHeight } from '../constants';
import { Calendar } from 'react-native-calendars';
import CalendarHeader from './CalendarCustomHeader';
import { Modal, StyleSheet, View as RNView } from 'react-native';
import { Text, TouchableOpacity, View } from './overridedComponents';

interface Iprops {
  trigger: React.ReactNode;
  handleSave: (date: Date) => void;
}

const DatePicker: React.FC<Iprops> = ({ trigger, handleSave }) => {
  const [date, setDate] = React.useState<Date>(new Date());
  const [isVisible, setIsVisible] = React.useState<boolean>(false);

  const handleClose = () => setIsVisible(false);

  const handleSaveDate = () => {
    handleSave(date);
    setIsVisible(false);
  };

  return (
    <RNView>
      <TouchableOpacity onPress={() => setIsVisible(true)}>
        {trigger}
      </TouchableOpacity>
      <Modal
        transparent
        visible={isVisible}
        animationType='slide'
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View style={styles.container}>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={handleClose}>
              <Text>{i18n.t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveDate}>
              <Text>{i18n.t('save')}</Text>
            </TouchableOpacity>
          </View>
          <Calendar
            hideExtraDays
            enableSwipeMonths
            customHeader={CalendarHeader}
            date={format(date, 'yyyy-MM-dd')}
            disableAllTouchEventsForDisabledDays
            maxDate={format(new Date(), 'yyyy-MM-dd')}
            initialDate={format(new Date(), 'yyyy-MM-dd')}
            onDayPress={(day) => setDate(new Date(day.timestamp))}
            markedDates={{
              [format(date, 'yyyy-MM-dd')]: {
                selected: true,
              },
            }}
          />
        </View>
      </Modal>
    </RNView>
  );
};

export default DatePicker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: statusBarHeight,
  },
  buttonsContainer: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
