/**
 * Design Tokens - Material 3 com customizações
 * Baseado na especificação UX/UI fornecida
 */

export const colors = {
  // Primary
  primary: '#0B57D0',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D3E3FD',
  onPrimaryContainer: '#001C3B',

  // Secondary  
  secondary: '#035D5A',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#B3F0ED',
  onSecondaryContainer: '#00201E',

  // Status Colors
  success: '#2E7D32',
  onSuccess: '#FFFFFF',
  successContainer: '#C8E6C9',
  onSuccessContainer: '#1B5E20',

  warning: '#ED6C02',
  onWarning: '#FFFFFF',
  warningContainer: '#FFF3E0',
  onWarningContainer: '#E65100',

  error: '#D32F2F',
  onError: '#FFFFFF',
  errorContainer: '#FFEBEE',
  onErrorContainer: '#B71C1C',

  info: '#0288D1',
  onInfo: '#FFFFFF',
  infoContainer: '#E1F5FE',
  onInfoContainer: '#01579B',

  // Surface
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#F4F6F8',
  onSurfaceVariant: '#44474E',
  surfaceContainer: '#F0F4F8',
  surfaceContainerHigh: '#E4E9F1',

  // Background
  background: '#FEFBFF',
  onBackground: '#1A1C1E',

  // Outline
  outline: '#74777F',
  outlineVariant: '#C4C7C5',

  // Dark theme colors
  dark: {
    surface: '#121212',
    onSurface: '#E1E2E1',
    surfaceVariant: '#1E1F22',
    onSurfaceVariant: '#C4C7C5',
    background: '#0F0F0F',
    onBackground: '#E1E2E1',
    surfaceContainer: '#1A1B1E',
    surfaceContainerHigh: '#24252A',
  },

  // Interactive states (opacities)
  states: {
    hover: 0.08,
    pressed: 0.12,
    focus: 0.16,
    disabled: 0.38,
  },

  // Map overlay
  mapOverlay: 'rgba(255, 255, 255, 0.92)',
  mapOverlayDark: 'rgba(18, 18, 18, 0.92)',
};

export const typography = {
  // Display
  displayLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },

  // Title
  titleLarge: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },

  // Body
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },

  // Label
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  small: 12,
  medium: 16,
  large: 28,
  full: 9999,
};

export const elevation = {
  level0: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  level2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  level3: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const touchTargets = {
  minimum: 44, // iOS minimum
  android: 48, // Android minimum
};

export const animations = {
  quick: 150,
  normal: 220,
  slow: 300,
  spring: {
    tension: 260,
    friction: 24,
  },
};