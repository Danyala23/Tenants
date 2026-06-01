import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const Colors = {
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  primarySurface: '#EEF2FF',

  secondary: '#0EA5E9',
  secondaryLight: '#7DD3FC',

  accent: '#F59E0B',
  accentLight: '#FDE68A',

  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#065F46',

  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#991B1B',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  background: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  darkText: '#F1F5F9',
  darkTextSecondary: '#94A3B8',
  darkTextMuted: '#64748B',
  darkSurface: '#1E293B',
  darkSurfaceVariant: '#334155',
  darkBackground: '#0F172A',
  darkBorder: '#334155',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const LightTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primarySurface,
    secondary: Colors.secondary,
    secondaryContainer: '#E0F2FE',
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.surfaceVariant,
    error: Colors.error,
    errorContainer: Colors.errorLight,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: Colors.primaryDark,
    onBackground: Colors.text,
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    outlineVariant: Colors.borderLight,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: Colors.surface,
      level2: Colors.surface,
      level3: Colors.surfaceVariant,
    },
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primaryLight,
    primaryContainer: Colors.primaryDark,
    secondary: Colors.secondaryLight,
    secondaryContainer: '#0C4A6E',
    background: Colors.darkBackground,
    surface: Colors.darkSurface,
    surfaceVariant: Colors.darkSurfaceVariant,
    error: Colors.error,
    errorContainer: '#7F1D1D',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: Colors.primaryLight,
    onBackground: Colors.darkText,
    onSurface: Colors.darkText,
    onSurfaceVariant: Colors.darkTextSecondary,
    outline: Colors.darkBorder,
    outlineVariant: Colors.darkSurfaceVariant,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: Colors.darkSurface,
      level2: Colors.darkSurface,
      level3: Colors.darkSurfaceVariant,
    },
  },
};
