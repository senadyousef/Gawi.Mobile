import * as React from 'react';import { galleryFilter } from '../../types';
import Colors from '../../constants/Colors';
import { StyleSheet, View } from 'react-native';
import GalleryFilterButton from './GalleryFilterButton';
import { useI18n } from '../../hooks/useI18n';

interface Props {
  galleryFilter: galleryFilter;
  setGalleryFilter: React.Dispatch<React.SetStateAction<galleryFilter>>;
}

const GalleryFilter: React.FC<Props> = ({
  galleryFilter,
  setGalleryFilter,
  
}) => {
  const { getDirection } = useI18n();

  return (
    <View style={[styles.container, getDirection()]}>
      <GalleryFilterButton
        activeOn='all'
        galleryFilter={galleryFilter}
        setGalleryFilter={setGalleryFilter}
      />
      <GalleryFilterButton
        activeOn='photos'
        galleryFilter={galleryFilter}
        setGalleryFilter={setGalleryFilter}
      />
      <GalleryFilterButton
        activeOn='videos'
        galleryFilter={galleryFilter}
        setGalleryFilter={setGalleryFilter}
      />
    </View>
  );
};

export default GalleryFilter;

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    flexDirection: 'row',
    backgroundColor: Colors.white,
  },
});
