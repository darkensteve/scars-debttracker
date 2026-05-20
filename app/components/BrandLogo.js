import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function BrandLogo({ size = 100 }) {
  const r = size * 0.26;
  const arcSize = size * 0.72;
  const arc2Size = size * 0.88;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer faint ring */}
      <View
        style={{
          position: 'absolute',
          width: arc2Size,
          height: arc2Size,
          borderRadius: arc2Size / 2,
          borderWidth: 1.5,
          borderColor: 'rgba(255,255,255,0.15)',
        }}
      />
      {/* Inner ring */}
      <View
        style={{
          position: 'absolute',
          width: arcSize,
          height: arcSize,
          borderRadius: arcSize / 2,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.25)',
          borderTopColor: 'rgba(255,255,255,0.7)',
          borderRightColor: 'rgba(255,255,255,0.5)',
        }}
      />

      {/* Icon card */}
      <View
        style={{
          width: size * 0.72,
          height: size * 0.72,
          borderRadius: size * 0.18,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 16,
        }}
      >
        {/* S letter */}
        <Text
          style={{
            fontSize: size * 0.34,
            fontFamily: 'Poppins_700Bold',
            color: '#1A4FD6',
            letterSpacing: -1,
            lineHeight: size * 0.38,
          }}
        >
          S
        </Text>
        {/* Underline accent */}
        <View
          style={{
            width: size * 0.22,
            height: 3,
            borderRadius: 2,
            backgroundColor: '#1A4FD6',
            opacity: 0.35,
            marginTop: 2,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({});
