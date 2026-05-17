import * as React from 'react';
import Chevron from './Chevron';
import Colors from '../../constants/Colors';
import { useI18n } from '../../hooks/useI18n';
import { StyleSheet, View } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, Text } from '../overridedComponents';
import { useAppContext } from '../../context';

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  ink:     dark ? '#F0F0F0' : Colors.secondary,
  icon:    dark ? '#AAAAAA' : Colors.gray,
  badgeBg: dark ? '#444444' : Colors.gray,
});

export interface IsettingsItemProps {
  title: string;
  badge?: string;
  color?: string;
  onPress: () => void;
  shouldShowChevron?: boolean;
  rightElement?: React.ReactNode;
  IoniconsIconName?: React.ComponentProps<typeof Ionicons>['name'];
  AntDesignIconName?: React.ComponentProps<typeof AntDesign>['name'];
}

const SettingsItem: React.FC<IsettingsItemProps> = ({
  badge,
  title,
  color,
  onPress,
  IoniconsIconName,
  AntDesignIconName,
  shouldShowChevron = true,
  rightElement,
}) => {
  const { getDirection } = useI18n();
  const { isDarkMode } = useAppContext();                                   // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]); // 👈 reactive theme
  const s = React.useMemo(() => createStyles(theme), [theme]);             // 👈 reactive styles

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[s.container, getDirection()]}>
        <View style={[s.wrapper, getDirection()]}>
          {AntDesignIconName && (
            <AntDesign
              size={18}
              name={AntDesignIconName}
              color={color || theme.icon} // 👈
            />
          )}
          {IoniconsIconName && (
            <Ionicons
              size={18}
              name={IoniconsIconName}
              color={color || theme.icon} // 👈
            />
          )}
          <Text style={[s.text, { color: color || theme.ink }]}> {/* 👈 */}
            {title}
          </Text>
        </View>
        <View style={[s.badgeWrapper, getDirection()]}>
          {badge && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{badge}</Text>
            </View>
          )}
          {rightElement ? rightElement : shouldShowChevron && <Chevron />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SettingsItem;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    container: {
      gap: 16,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    wrapper: {
      gap: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    text: {
      fontSize: 14,
      fontFamily: 'SF-Medium',
    },
    badgeWrapper: {
      gap: 5,
      flexDirection: 'row',
      alignItems: 'center',
    },
    badge: {
      borderRadius: 5,
      paddingVertical: 3,
      paddingHorizontal: 5,
      backgroundColor: theme.badgeBg, // 👈
    },
    badgeText: {
      fontSize: 12,
      color: Colors.white,
      fontFamily: 'SF-Regular',
    },
  });