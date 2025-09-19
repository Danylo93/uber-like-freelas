import { Theme } from './theme';

export const darkTheme: Theme = {
  colors: {
    // Primary colors
    primary: '#D0BCFF',
    onPrimary: '#371E73',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EADDFF',
    
    // Secondary colors
    secondary: '#CCC2DC',
    onSecondary: '#332D41',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    
    // Tertiary colors
    tertiary: '#EFB8C8',
    onTertiary: '#492532',
    tertiaryContainer: '#633B48',
    onTertiaryContainer: '#FFD8E4',
    
    // Error colors
    error: '#F2B8B5',
    onError: '#601410',
    errorContainer: '#8C1D18',
    onErrorContainer: '#F9DEDC',
    
    // Success colors (custom)
    success: '#A6D4AA',
    onSuccess: '#0F3D16',
    successContainer: '#1E5F2B',
    onSuccessContainer: '#C2F0C4',
    
    // Warning colors (custom)
    warning: '#E6C569',
    onWarning: '#3D2F00',
    warningContainer: '#5A4300',
    onWarningContainer: '#FFE085',
    
    // Surface colors
    background: '#10131C',
    onBackground: '#E6E0E9',
    surface: '#1D1B20',
    onSurface: '#E6E0E9',
    surfaceVariant: '#49454F',
    onSurfaceVariant: '#CAC4D0',
    
    // Outline colors
    outline: '#938F99',
    outlineVariant: '#49454F',
    
    // Surface tints
    surfaceTint: '#D0BCFF',
    inverseSurface: '#E6E0E9',
    inverseOnSurface: '#322F35',
    inversePrimary: '#6750A4',
    
    // Surface containers
    surfaceContainer: '#211F26',
    surfaceContainerHigh: '#2B2930',
    surfaceContainerHighest: '#36343B',
    surfaceContainerLow: '#1D1B20',
    surfaceContainerLowest: '#0B0E14',
    
    // Additional utility colors
    scrim: '#000000',
    shadow: '#000000',
    
    // App-specific colors
    mapBackground: '#1A1A1A',
    cardBackground: '#2D2D30',
    buttonDisabled: '#3E3E42',
    textDisabled: '#8A8A8F',
    
    // Status colors for Uber-like features
    online: '#00D563',
    offline: '#8A8A8F',
    inTransit: '#1E88E5',
    delivered: '#4CAF50',
    cancelled: '#F44336',
  },
  
  typography: {
    // Display styles
    displayLarge: {
      fontSize: 57,
      fontWeight: '400',
      lineHeight: 64,
      letterSpacing: -0.25,
    },
    displayMedium: {
      fontSize: 45,
      fontWeight: '400',
      lineHeight: 52,
      letterSpacing: 0,
    },
    displaySmall: {
      fontSize: 36,
      fontWeight: '400',
      lineHeight: 44,
      letterSpacing: 0,
    },
    
    // Headlines
    headlineLarge: {
      fontSize: 32,
      fontWeight: '400',
      lineHeight: 40,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontSize: 28,
      fontWeight: '400',
      lineHeight: 36,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontSize: 24,
      fontWeight: '400',
      lineHeight: 32,
      letterSpacing: 0,
    },
    
    // Titles
    titleLarge: {
      fontSize: 22,
      fontWeight: '400',
      lineHeight: 28,
      letterSpacing: 0,
    },
    titleMedium: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    
    // Labels
    labelLarge: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.5,
    },
    
    // Body text
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      letterSpacing: 0.4,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 28,
    full: 9999,
  },
  
  elevation: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 16,
      elevation: 16,
    },
  },
  
  animation: {
    timing: {
      fast: 150,
      medium: 300,
      slow: 500,
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },
  
  // Dark mode specific properties
  isDark: true,
  
  // Component-specific dark mode styles
  components: {
    button: {
      primaryBackground: '#D0BCFF',
      primaryText: '#371E73',
      secondaryBackground: 'transparent',
      secondaryText: '#D0BCFF',
      secondaryBorder: '#D0BCFF',
      disabledBackground: '#3E3E42',
      disabledText: '#8A8A8F',
    },
    
    input: {
      background: '#2D2D30',
      border: '#938F99',
      focusedBorder: '#D0BCFF',
      text: '#E6E0E9',
      placeholder: '#8A8A8F',
    },
    
    card: {
      background: '#2D2D30',
      border: '#49454F',
      shadow: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
    },
    
    navigation: {
      background: '#1D1B20',
      activeTab: '#D0BCFF',
      inactiveTab: '#8A8A8F',
      border: '#49454F',
    },
    
    map: {
      style: 'dark',
      background: '#1A1A1A',
      markerBackground: '#2D2D30',
      routeColor: '#D0BCFF',
      userLocationColor: '#00D563',
    },
    
    modal: {
      background: '#1D1B20',
      overlay: 'rgba(0, 0, 0, 0.7)',
      border: '#49454F',
    },
    
    bottomSheet: {
      background: '#1D1B20',
      handle: '#49454F',
      border: '#938F99',
    },
    
    notification: {
      background: '#2D2D30',
      border: '#49454F',
      successBackground: '#1E5F2B',
      errorBackground: '#8C1D18',
      warningBackground: '#5A4300',
    },
  },
  
  // Accessibility improvements for dark mode
  accessibility: {
    minimumTouchTarget: 44,
    focusRingColor: '#D0BCFF',
    focusRingWidth: 2,
    highContrastBorder: '#FFFFFF',
  },
};

// Utility functions for dark theme
export const darkThemeUtils = {
  // Get appropriate text color based on background
  getTextColor: (backgroundColor: string): string => {
    // Simple luminance check - in production, use a proper color library
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? darkTheme.colors.onBackground : darkTheme.colors.background;
  },
  
  // Adjust opacity for dark mode
  withOpacity: (color: string, opacity: number): string => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  },
  
  // Get surface color based on elevation level
  getSurfaceColor: (elevationLevel: number): string => {
    const baseColor = darkTheme.colors.surface;
    const overlay = darkTheme.colors.primary;
    
    // Apply elevation tint for dark surfaces
    const elevationOpacity = Math.min(elevationLevel * 0.05, 0.15);
    return darkThemeUtils.withOpacity(overlay, elevationOpacity);
  },
  
  // Check if color is dark
  isDarkColor: (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance < 0.5;
  },
};