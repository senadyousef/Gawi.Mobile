import * as React from 'react';import { ScrollViewProps, ScrollView as RNScrollView } from 'react-native';

const ScrollView: React.FC<ScrollViewProps> = ({
  style,
  children,
  contentContainerStyle,
  ...props
}) => {
  return (
    <RNScrollView
      {...props}
      style={[{ flexGrow: 1 }, style]}
      contentContainerStyle={[{ padding: 16 }, contentContainerStyle]}
    >
      {children}
    </RNScrollView>
  );
};

export default ScrollView;
