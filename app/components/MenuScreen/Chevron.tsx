import * as React from 'react';import Colors from '../../constants/Colors';
import { useI18n } from '../../hooks/useI18n';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Chevron = () => {
  const { isArabic } = useI18n();

  return (
    <MaterialCommunityIcons
      size={24}
      color={Colors.gray}
      name={isArabic() ? 'chevron-left' : 'chevron-right'}
    />
  );
};

export default Chevron;
