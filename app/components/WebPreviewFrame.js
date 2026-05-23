import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { fonts } from '../theme/fonts';

const PHONE_WIDTH = 390;

export default function WebPreviewFrame({ children }) {
  if (Platform.OS !== 'web') {
    return children;
  }

  return (
    <View style={styles.page}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Web preview — same UI as phone. Press w in the Expo terminal to refresh the browser.
        </Text>
      </View>
      <View style={styles.phoneShell}>
        <View style={styles.phone}>{children}</View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    minHeight: '100vh',
  },
  banner: {
    width: '100%',
    maxWidth: PHONE_WIDTH + 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bannerText: {
    color: '#B0BEC5',
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
  phoneShell: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 24,
  },
  phone: {
    width: '100%',
    maxWidth: PHONE_WIDTH,
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#37474F',
    // @ts-ignore web shadow
    boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
  },
});

