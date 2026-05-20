import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BrandLogo from '../components/BrandLogo';
import { colors } from '../theme/colors';

export default function SplashScreen({ loading }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <BrandLogo size={96} />
        <Text style={styles.title}>SCARS</Text>
        <Text style={styles.tagline}>
          Know who owes you — loans, buys & payments
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color="rgba(255,255,255,0.9)" style={styles.loader} />
        ) : null}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    marginTop: 28,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },
  loader: {
    marginTop: 32,
  },
});

