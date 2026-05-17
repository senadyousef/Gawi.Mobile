import * as React from 'react';import i18n from '../../localization';
import { galleryFilter } from '../../types';
import Colors from '../../constants/Colors';
import { TouchableOpacity } from '../overridedComponents';
import {
  Text,
  View,
  StyleProp,
  TextStyle,
  ViewStyle,
  StyleSheet,
} from 'react-native';

interface Props {
  activeOn: galleryFilter;
  galleryFilter: galleryFilter;
  setGalleryFilter: React.Dispatch<React.SetStateAction<galleryFilter>>;
}

const GalleryFilterButton: React.FC<Props> = ({
  activeOn,
  galleryFilter,
  setGalleryFilter,
}) => {
  const activeBackgroundColor = (
    filter: galleryFilter,
  ): StyleProp<ViewStyle> => {
    if (galleryFilter === filter) return { backgroundColor: Colors.primary };
  };

  const activeColor = (filter: galleryFilter): StyleProp<TextStyle> => {
    if (galleryFilter === filter) return { color: Colors.white };
  };

  return (
    <TouchableOpacity
      onPress={() => setGalleryFilter(activeOn)}
      style={styles.buttonWrapper}
    >
      <View style={[styles.button, activeBackgroundColor(activeOn)]}>
        <Text style={[styles.buttonText, activeColor(activeOn)]}>
          {i18n.t(activeOn)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default GalleryFilterButton;

const styles = StyleSheet.create({
  button: {
    height: 36,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.gray,
    fontFamily: 'SF-Semibold',
  },
  buttonWrapper: {
    flexGrow: 1,
    borderRadius: 32,
    overflow: 'hidden',
  },
});
