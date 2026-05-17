import * as React from 'react';import { format } from 'date-fns';
import Colors from '../../constants/Colors';
import { useAppContext } from '../../context';
import { Text, View } from '../overridedComponents';
import { StyleSheet, ScrollView } from 'react-native';
import { handleFetchEventsDates } from '../../api/events';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarkedDates } from 'react-native-calendars/src/types';
import { defaultErrorToast, formatEventDates } from '../../helpers';
import { CalendarProvider, ExpandableCalendar } from 'react-native-calendars';

interface Props {
  selected: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
}

const CalendarComponent: React.FC<Props> = ({ selected, setSelected }) => {
  const [selectedYear, setSelectedYear] = React.useState<number>();
  const [selectedMonth, setSelectedMonth] = React.useState<number>();
  const [eventDates, setEventsDates] = React.useState<MarkedDates>({});
  const { handleLogout, userProfile, setBookedEvents } = useAppContext();

  React.useEffect(() => {
    const [year, month, _day] = selected.split('-');

    setSelectedYear(parseInt(year));
    setSelectedMonth(parseInt(month));
  }, [selected]);

  React.useEffect(() => {
    if (selectedYear && selectedMonth && userProfile?.id) {
      handleFetchEventsDates({
        handleLogout,
        year: selectedYear,
        month: selectedMonth,
        userId: userProfile.id,
      })
        .then((res) => {
          if (res) {
            const events = formatEventDates(res, setBookedEvents);
            setEventsDates(events);
          }
        })
        .catch((err) => {
          defaultErrorToast();
        });
    }
  }, [selectedYear, selectedMonth]);

  const arrows = {
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

  return (
    <ScrollView scrollEnabled={false}>
      <CalendarProvider
        date={selected}
        onDateChanged={(date) => setSelected(date)}
      >
        <ExpandableCalendar
          firstDay={1}
          date={selected}
          customHeaderTitle={
            <Text style={styles.headerText}>
              {format(new Date(selected), 'MMMM yyyy')}
            </Text>
          }
          markingType={'multi-dot'}
          onDayPress={(date) => {
            setSelected(date.dateString);
          }}
          renderArrow={(dir) => arrows[dir]}
          theme={{
            selectedDayTextColor: Colors.white,
            selectedDayBackgroundColor: Colors.primary,
          }}
          markedDates={{
            ...eventDates,
          }}
        />
      </CalendarProvider>
    </ScrollView>
  );
};

export default CalendarComponent;

const styles = StyleSheet.create({
  headerText: {
    color: Colors.secondary,
    fontFamily: 'SF-Semibold',
  },
  arrow: {
    width: 23,
    height: 23,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F7FB',
  },
});
