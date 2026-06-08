import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

/* ═══════════════════════════════════════════════════════════════
   HAVEN DESIGN SYSTEM (mobile)
   Mirrors the web palette: iris/violet brand, plum-tinted neutrals,
   honey-amber accent, gradient-forward surfaces.
   ═══════════════════════════════════════════════════════════════ */

export const Colors = {
  primary: '#6D3BEF',
  primaryLight: '#A78BFA',
  primaryDark: '#5B27E0',
  primarySurface: '#EFEAFF',

  secondary: '#06B6D4',
  secondaryLight: '#67E8F9',

  accent: '#F59E0B',
  accentLight: '#FDE68A',

  success: '#0F9D6E',
  successLight: '#D1FAE5',
  successDark: '#065F46',

  error: '#EF4757',
  errorLight: '#FEE2E2',
  errorDark: '#9F1239',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#92400E',

  // Light neutrals – warm plum tint
  text: '#1B1530',
  textSecondary: '#5A5470',
  textMuted: '#938DA8',

  surface: '#FFFFFF',
  surfaceVariant: '#EFEDF7',
  background: '#F6F5FB',
  border: '#E6E2F1',
  borderLight: '#F0EDF8',

  // Dark neutrals – deep plum-black
  darkText: '#ECE9F6',
  darkTextSecondary: '#A8A1BF',
  darkTextMuted: '#6F6789',
  darkSurface: '#161226',
  darkSurfaceVariant: '#1F1934',
  darkBackground: '#0C0A14',
  darkBorder: '#2A2342',
};

export const Gradients = {
  primary: ['#8B5CF6', '#6D3BEF', '#5B27E0'] as const,
  primaryDark: ['#A78BFA', '#8B5CF6', '#7C3AED'] as const,
  brand: ['#A78BFA', '#6D3BEF', '#EC4899'] as const,
  brandDark: ['#C4B5FD', '#A78BFA', '#F472B6'] as const,
  success: ['#34D399', '#0F9D6E'] as const,
  danger: ['#FB7185', '#EF4757'] as const,
  // Subtle aurora wash for hero / header backgrounds
  auroraLight: ['#F6F5FB', '#EFEAFF', '#FDF2F8'] as const,
  auroraDark: ['#0C0A14', '#171128', '#1A0F1F'] as const,
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
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

/* ───────────────────────────────────────────────────────────
   TYPOGRAPHY  –  Space Grotesk (display) + Plus Jakarta Sans (UI)
   Font families are loaded in app/_layout.tsx via expo-font.
   ─────────────────────────────────────────────────────────── */
export const FontFamily = {
  display: 'SpaceGrotesk_700Bold',
  displaySemi: 'SpaceGrotesk_600SemiBold',
  displayMedium: 'SpaceGrotesk_500Medium',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

function buildFontConfig(base: typeof MD3LightTheme.fonts) {
  const entries = Object.entries(base).map(([variant, props]) => {
    let fontFamily = FontFamily.regular;
    if (/display|headline/i.test(variant)) {
      fontFamily = FontFamily.display;
    } else if (/title/i.test(variant)) {
      fontFamily = FontFamily.displaySemi;
    } else if (/label/i.test(variant)) {
      fontFamily = FontFamily.semibold;
    } else if (variant === 'bodyLarge') {
      fontFamily = FontFamily.medium;
    }
    return [variant, { ...(props as object), fontFamily }];
  });
  return Object.fromEntries(entries);
}

const lightFonts = configureFonts({ config: buildFontConfig(MD3LightTheme.fonts) as never });
const darkFonts = configureFonts({ config: buildFontConfig(MD3DarkTheme.fonts) as never });

export const LightTheme = {
  ...MD3LightTheme,
  roundness: 3,
  fonts: lightFonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primarySurface,
    secondary: Colors.secondary,
    secondaryContainer: '#CFFAFE',
    tertiary: Colors.accent,
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
  fonts: darkFonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.primaryLight,
    primaryContainer: '#2E1F57',
    secondary: Colors.secondaryLight,
    secondaryContainer: '#0C4A6E',
    tertiary: '#FBBF24',
    background: Colors.darkBackground,
    surface: Colors.darkSurface,
    surfaceVariant: Colors.darkSurfaceVariant,
    error: Colors.error,
    errorContainer: '#7F1D1D',
    onPrimary: '#1B1530',
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
      level2: '#1B1630',
      level3: Colors.darkSurfaceVariant,
    },
  },
};
