import React from 'react';
import { Text, StyleSheet } from 'react-native';

const weightMap = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export default function AppText({ style, weight = 'regular', children, ...props }) {
  const fontFamily = weightMap[weight] || weightMap.regular;
  return (
    <Text style={[{ fontFamily }, style]} {...props}>
      {children}
    </Text>
  );
}
