import * as React from 'react';import Colors from '../../constants/Colors';
import { statusBarHeight } from '../../constants';
import { StyleSheet, View as RNView, ViewProps } from 'react-native';

interface Props extends ViewProps {
  isHeaderless?: boolean;
}

const View: React.FC<Props> = ({
  style,
  children,
  isHeaderless = false,
  ...props
}) => {
  return (
    <RNView
      style={[
        isHeaderless ? { paddingTop: statusBarHeight } : {},
        styles.view,
        style,
      ]}
      {...props}
    >
      {children}
    </RNView>
  );
};

export default View;

const styles = StyleSheet.create({
  view: {
    backgroundColor: Colors.white,
  },
});
