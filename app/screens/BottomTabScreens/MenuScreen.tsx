import * as React from 'react';
import app from '../../../app.json';
import i18n from '../../localization';
import Colors from '../../constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, ScrollView, View } from 'react-native';
import SettingsSection from '../../components/MenuScreen/SettingsSection';
import ProfileInfoSection from '../../components/MenuScreen/ProfileInfoSection';

const MenuScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <ProfileInfoSection />
        <SettingsSection />
        <Text style={styles.versionText}>
          {i18n.t('version')} {app.expo.version}
        </Text>
        <StatusBar style='dark' />
      </ScrollView>
    </View>
  );
};

export default MenuScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    gap: 16,
    padding: 16,
  },
  versionText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'SF-Medium',
    color: Colors.secondary,
  },
});
