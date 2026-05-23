import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';
import { fonts } from './fonts';

const poppins = {
  regular: { fontFamily: fonts.regular },
  medium: { fontFamily: fonts.medium },
  bold: { fontFamily: fonts.bold },
  heavy: { fontFamily: fonts.bold },
};

const baseFonts = configureFonts({
  config: {
    fontFamily: fonts.regular,
  },
  isV3: true,
});

function withPoppins(variant, weight = 'regular') {
  const base = baseFonts[variant] || baseFonts.bodyMedium;
  return { ...base, ...poppins[weight] };
}

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.primaryDark,
    background: colors.background,
    surface: colors.surface,
    outline: colors.border,
  },
  roundness: 12,
  fonts: {
    ...baseFonts,
    default: withPoppins('bodyMedium', 'regular'),
    displaySmall: withPoppins('displaySmall', 'bold'),
    displayMedium: withPoppins('displayMedium', 'bold'),
    displayLarge: withPoppins('displayLarge', 'bold'),
    headlineSmall: withPoppins('headlineSmall', 'bold'),
    headlineMedium: withPoppins('headlineMedium', 'bold'),
    headlineLarge: withPoppins('headlineLarge', 'bold'),
    titleSmall: withPoppins('titleSmall', 'medium'),
    titleMedium: withPoppins('titleMedium', 'bold'),
    titleLarge: withPoppins('titleLarge', 'bold'),
    labelSmall: withPoppins('labelSmall', 'medium'),
    labelMedium: withPoppins('labelMedium', 'medium'),
    labelLarge: withPoppins('labelLarge', 'medium'),
    bodySmall: withPoppins('bodySmall', 'regular'),
    bodyMedium: withPoppins('bodyMedium', 'regular'),
    bodyLarge: withPoppins('bodyLarge', 'medium'),
  },
};
