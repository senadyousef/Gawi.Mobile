import * as React from 'react';import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Inews, RootStackParamList } from '../types';
import NewsCard from '../components/LatestNewsScreen/NewsCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

const LatestNewsDetailsScreen: React.FC<
  NativeStackScreenProps<RootStackParamList, 'latestNewsDetails'>
> = ({ route }) => {
  return (
    <View style={styles.container}>
      <NewsCard isExpanded item={JSON.parse(route.params.details) as Inews} />
      <StatusBar style='dark' />
    </View>
  );
};

export default LatestNewsDetailsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
