import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function BrandLogo({ size = 88, color = '#FFFFFF' }) {
  const ring = size * 0.52;
  const box = size * 0.48;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.circle,
          {
            width: ring,
            height: ring,
            borderRadius: ring / 2,
            borderColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.square,
          {
            width: box,
            height: box,
            borderColor: color,
            borderRadius: size * 0.1,
            transform: [{ translateX: size * 0.14 }, { translateY: size * 0.06 }, { rotate: '8deg' }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderWidth: 3.5,
    left: 0,
    top: '18%',
  },
  square: {
    position: 'absolute',
    borderWidth: 3.5,
    right: 0,
    bottom: '12%',
  },
});
