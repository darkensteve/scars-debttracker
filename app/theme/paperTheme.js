import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

const poppinsFonts = {
  regular: { fontFamily: 'Poppins_400Regular', fontFamily: 'Poppins_400Regular' },
  medium: { fontFamily: 'Poppins_500Medium', fontFamily: 'Poppins_400Regular' },
  bold: { fontFamily: 'Poppins_700Bold', fontFamily: 'Poppins_400Regular' },
  heavy: { fontFamily: 'Poppins_700Bold', fontFamily: 'Poppins_400Regular' },
};

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
    ...MD3LightTheme.fonts,
    default: poppinsFonts.regular,
    bodySmall: { ...MD3LightTheme.fonts.bodySmall, ...poppinsFonts.regular },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, ...poppinsFonts.regular },
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, ...poppinsFonts.medium },
    labelSmall: { ...MD3LightTheme.fonts.labelSmall, ...poppinsFonts.medium },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, ...poppinsFonts.medium },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, ...poppinsFonts.medium },
    titleSmall: { ...MD3LightTheme.fonts.titleSmall, ...poppinsFonts.medium },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, ...poppinsFonts.bold },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, ...poppinsFonts.bold },
    headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, ...poppinsFonts.bold },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, ...poppinsFonts.bold },
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, ...poppinsFonts.bold },
  },
};
