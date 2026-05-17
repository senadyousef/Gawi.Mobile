import { format } from 'date-fns';
import { width } from '../constants';
import Colors from '../constants/Colors';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from './overridedComponents';
import React from 'react';

interface IheaderProps {
  month: Date;
  addMonth: (number: number) => void;
}

const CalendarHeader: React.FC<IheaderProps> = ({ month, addMonth }) => {
  const monthArrows = {
    left: (
      <View style={styles.arrow}>
        <MaterialCommunityIcons
          size={18}
          name='chevron-left'
          color={Colors.gray}
        />
      </View>
    ),
    right: (
      <View style={styles.arrow}>
        <MaterialCommunityIcons
          size={18}
          name='chevron-right'
          color={Colors.gray}
        />
      </View>
    ),
  };

  const yearsArrows = {
    left: (
      <View style={styles.arrow}>
        <MaterialCommunityIcons
          size={18}
          name='chevron-double-left'
          color={Colors.gray}
        />
      </View>
    ),
    right: (
      <View style={styles.arrow}>
        <MaterialCommunityIcons
          size={18}
          name='chevron-double-right'
          color={Colors.gray}
        />
      </View>
    ),
  };

  const nextMonth = () => addMonth(1);
  const prevMonth = () => addMonth(-1);

  const addYear = () => addMonth(12);
  const subYear = () => addMonth(-12);

  return (
    <View style={styles.customHeader}>
      <TouchableOpacity onPress={prevMonth}>
        {monthArrows.left}
      </TouchableOpacity>
      <TouchableOpacity onPress={subYear}>{yearsArrows.left}</TouchableOpacity>
      <Text>{format(new Date(month), 'MMMM yyyy')}</Text>
      <TouchableOpacity onPress={addYear}>{yearsArrows.right}</TouchableOpacity>
      <TouchableOpacity onPress={nextMonth}>
        {monthArrows.right}
      </TouchableOpacity>
    </View>
  );
};

export default CalendarHeader;

const styles = StyleSheet.create({
  arrow: {
    width: 23,
    height: 23,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F7FB',
  },
  customHeader: {
    width,
    gap: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
