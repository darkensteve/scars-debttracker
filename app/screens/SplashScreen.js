import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BrandLogo from '../components/BrandLogo';
import { colors } from '../theme/colors';

export default function SplashScreen({ loading }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Center content */}
      <View style={styles.center}>
        <BrandLogo size={110} />

        <Text style={styles.title}>SCARS</Text>
        <Text style={styles.tagline}>Know who owes you</Text>
        <Text style={styles.taglineSub}>Loans · Purchases · Payments</Text>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {loading ? (
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        ) : (
          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
        )}
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splash,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 64,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -60,
    left: -80,
  },
  bgCircle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 120,
    right: -50,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  title: {
    marginTop: 28,
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  tagline: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.3,
  },
  taglineSub: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
  },
  bottom: {
    alignItems: 'center',
    gap: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    width: 20,
    borderRadius: 3,
  },
  version: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
  },
});
