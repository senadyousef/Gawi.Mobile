import * as React from 'react';
import i18n from '../localization';
import Colors from '../constants/Colors';
import { shadowStyle } from '../constants';
import { Text, TouchableOpacity } from './overridedComponents';
import { StyleSheet, TouchableOpacityProps } from 'react-native';
import { useAppContext } from '../context'; // 👈

// ─── Theme factory ────────────────────────────────────────────────────────────
const getTheme = (dark: boolean) => ({
  bg: dark ? "#1E1E1E" : Colors.white,
});

interface Iprops extends TouchableOpacityProps {
  label: string;
  isLoading?: boolean;
  shouldShowShadow?: boolean;
  isDarkMode?: boolean; // 👈 optional prop
}

const BottomButton: React.FC<Iprops> = ({
  label,
  style,
  isLoading = false,
  shouldShowShadow = true,
  ...props
}) => {
  const { isDarkMode } = useAppContext();                                    // 👈
  const theme = React.useMemo(() => getTheme(!!isDarkMode), [isDarkMode]);  // 👈
  const s = React.useMemo(() => createStyles(theme), [theme]);              // 👈

  return (
    <TouchableOpacity
      disabled={isLoading}
      style={[
        s.button,
        isLoading && { opacity: 0.5 },
        shouldShowShadow && shadowStyle,
        style,
      ]}
      {...props}
    >
      <Text style={s.buttonText}>
        {isLoading ? i18n.t('loading') : label}
      </Text>
    </TouchableOpacity>
  );
};

export default BottomButton;

// ─── Styles factory ───────────────────────────────────────────────────────────
const createStyles = (theme: ReturnType<typeof getTheme>) =>
  StyleSheet.create({
    button: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: theme.bg, // 👈
    },
    buttonText: {
      padding: 16,
      borderRadius: 10,
      overflow: 'hidden',
      color: Colors.white,
      textAlign: 'center',
      backgroundColor: Colors.primary, // stays same — primary button color
    },
  });