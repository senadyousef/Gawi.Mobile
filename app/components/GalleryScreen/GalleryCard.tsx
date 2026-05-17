import * as React from 'react';import { IgalleryItem } from '../../types';
import { width } from '../../constants';
import Colors from '../../constants/Colors';
import { Image, StyleSheet, View ,Text} from 'react-native';

interface Props {
  item: IgalleryItem;
}

const GalleryCard: React.FC<Props> = ({ item }) => {
  
  return (
    <View style={styles.container}>
     
      <Image source={{ uri: item.photoUrl }} style={styles.imageStyle} />
    </View>
  );
  
};


export default GalleryCard;

const styles = StyleSheet.create({
  container: {
    gap: 5,
  },
  name: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.secondary,
  },
  imageStyle: {
    aspectRatio: 1,
    borderRadius: 10,
    width: (width - 52) / 3,
    backgroundColor: Colors.white,
  },
});
