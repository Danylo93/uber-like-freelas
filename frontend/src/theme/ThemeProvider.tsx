import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';

// Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    surface: string;
    surfaceVariant: string;
    background: string;
    error: string;
    warning: string;
    success: string;
    onPrimary: string;
    onSecondary: string;
    onTertiary: string;
    onSurface: string;
    onSurfaceVariant: string;
    onBackground: string;
    onError: string;
    outline: string;
    outlineVariant: string;
    scrim: string;
    shadow: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    displayLarge: TextStyle;
    displayMedium: TextStyle;
    displaySmall: TextStyle;
    headlineLarge: TextStyle;
    headlineMedium: TextStyle;
    headlineSmall: TextStyle;
    titleLarge: TextStyle;
    titleMedium: TextStyle;
    titleSmall: TextStyle;
    labelLarge: TextStyle;
    labelMedium: TextStyle;
    labelSmall: TextStyle;
    bodyLarge: TextStyle;
    bodyMedium: TextStyle;
    bodySmall: TextStyle;
  };
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  elevation: {
    none: ShadowStyle;
    sm: ShadowStyle;
    md: ShadowStyle;
    lg: ShadowStyle;
    xl: ShadowStyle;
  };
}

interface TextStyle {
  fontSize: number;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
}

interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

// Default fallback theme to prevent crashes
const FALLBACK_THEME: Theme = {
  colors: {
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    background: '#FFFFFF',
    error: '#BA1A1A',
    warning: '#FF9800',
    success: '#4CAF50',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onTertiary: '#FFFFFF',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    onBackground: '#1C1B1F',
    onError: '#FFFFFF',
    outline: '#79747E',
    outlineVariant: '#CAC4D0',
    scrim: '#000000',
    shadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    displayLarge: { fontSize: 57, fontWeight: '400' },
    displayMedium: { fontSize: 45, fontWeight: '400' },
    displaySmall: { fontSize: 36, fontWeight: '400' },
    headlineLarge: { fontSize: 32, fontWeight: '400' },
    headlineMedium: { fontSize: 28, fontWeight: '400' },
    headlineSmall: { fontSize: 24, fontWeight: '400' },
    titleLarge: { fontSize: 22, fontWeight: '400' },
    titleMedium: { fontSize: 16, fontWeight: '500' },
    titleSmall: { fontSize: 14, fontWeight: '500' },
    labelLarge: { fontSize: 14, fontWeight: '500' },
    labelMedium: { fontSize: 12, fontWeight: '500' },
    labelSmall: { fontSize: 11, fontWeight: '500' },
    bodyLarge: { fontSize: 16, fontWeight: '400' },
    bodyMedium: { fontSize: 14, fontWeight: '400' },
    bodySmall: { fontSize: 12, fontWeight: '400' },
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
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
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 16,
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setCurrentTheme] = useState<Theme>(FALLBACK_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize theme
  useEffect(() => {
    initializeTheme();
  }, []);

  // Update theme when isDark changes
  useEffect(() => {
    try {
      const selectedTheme = isDark ? (darkTheme || FALLBACK_THEME) : (lightTheme || FALLBACK_THEME);
      setCurrentTheme(selectedTheme);
      setError(null);
    } catch (err) {
      console.warn('Failed to load theme, using fallback:', err);
      setCurrentTheme(FALLBACK_THEME);
      setError('Failed to load theme');
    }
  }, [isDark]);

  // Listen to system theme changes
  useEffect(() => {
    try {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        // Only auto-switch if we haven't manually set a preference
        loadThemePreference().then((savedPreference) => {
          if (savedPreference === null) {
            setIsDark(colorScheme === 'dark');
          }
        });
      });

      return () => subscription?.remove();
    } catch (err) {
      console.warn('Failed to setup appearance listener:', err);
    }
  }, []);

  const initializeTheme = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const savedPreference = await loadThemePreference();
      
      if (savedPreference !== null) {
        setIsDark(savedPreference);
      } else {
        // Use system preference
        const systemColorScheme = Appearance.getColorScheme();
        setIsDark(systemColorScheme === 'dark');
      }
    } catch (err) {
      console.warn('Failed to initialize theme:', err);
      setError('Failed to initialize theme');
      // Use system preference as fallback
      const systemColorScheme = Appearance.getColorScheme();
      setIsDark(systemColorScheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const loadThemePreference = async (): Promise<boolean | null> => {
    try {
      const preference = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      return preference ? JSON.parse(preference) : null;
    } catch (err) {
      console.warn('Failed to load theme preference:', err);
      return null;
    }
  };

  const saveThemePreference = async (isDarkMode: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(isDarkMode));
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
    }
  };

  const toggleTheme = useCallback(() => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    saveThemePreference(newIsDark);
  }, [isDark]);

  const setTheme = useCallback((isDarkMode: boolean) => {
    setIsDark(isDarkMode);
    saveThemePreference(isDarkMode);
  }, []);

  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setTheme,
    isLoading,
    error,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    // Provide a complete fallback to prevent crashes
    console.warn('useTheme must be used within a ThemeProvider. Using fallback theme.');
    return {
      theme: FALLBACK_THEME,
      isDark: false,
      toggleTheme: () => {
        console.warn('ThemeProvider not found. Cannot toggle theme.');
      },
      setTheme: () => {
        console.warn('ThemeProvider not found. Cannot set theme.');
      },
      isLoading: false,
      error: 'ThemeProvider not found',
    };
  }
  
  return context;
};

// Hook for type-safe theme access with guaranteed properties
export const useThemeSafe = () => {
  const { theme, ...rest } = useTheme();
  
  // Ensure all theme properties exist with fallbacks
  const safeTheme: Theme = {
    colors: {
      primary: theme?.colors?.primary || FALLBACK_THEME.colors.primary,
      secondary: theme?.colors?.secondary || FALLBACK_THEME.colors.secondary,
      tertiary: theme?.colors?.tertiary || FALLBACK_THEME.colors.tertiary,
      surface: theme?.colors?.surface || FALLBACK_THEME.colors.surface,
      surfaceVariant: theme?.colors?.surfaceVariant || FALLBACK_THEME.colors.surfaceVariant,
      background: theme?.colors?.background || FALLBACK_THEME.colors.background,
      error: theme?.colors?.error || FALLBACK_THEME.colors.error,
      warning: theme?.colors?.warning || FALLBACK_THEME.colors.warning,
      success: theme?.colors?.success || FALLBACK_THEME.colors.success,
      onPrimary: theme?.colors?.onPrimary || FALLBACK_THEME.colors.onPrimary,
      onSecondary: theme?.colors?.onSecondary || FALLBACK_THEME.colors.onSecondary,
      onTertiary: theme?.colors?.onTertiary || FALLBACK_THEME.colors.onTertiary,
      onSurface: theme?.colors?.onSurface || FALLBACK_THEME.colors.onSurface,
      onSurfaceVariant: theme?.colors?.onSurfaceVariant || FALLBACK_THEME.colors.onSurfaceVariant,
      onBackground: theme?.colors?.onBackground || FALLBACK_THEME.colors.onBackground,
      onError: theme?.colors?.onError || FALLBACK_THEME.colors.onError,
      outline: theme?.colors?.outline || FALLBACK_THEME.colors.outline,
      outlineVariant: theme?.colors?.outlineVariant || FALLBACK_THEME.colors.outlineVariant,
      scrim: theme?.colors?.scrim || FALLBACK_THEME.colors.scrim,
      shadow: theme?.colors?.shadow || FALLBACK_THEME.colors.shadow,
    },
    spacing: {
      xs: theme?.spacing?.xs ?? FALLBACK_THEME.spacing.xs,
      sm: theme?.spacing?.sm ?? FALLBACK_THEME.spacing.sm,
      md: theme?.spacing?.md ?? FALLBACK_THEME.spacing.md,
      lg: theme?.spacing?.lg ?? FALLBACK_THEME.spacing.lg,
      xl: theme?.spacing?.xl ?? FALLBACK_THEME.spacing.xl,
      xxl: theme?.spacing?.xxl ?? FALLBACK_THEME.spacing.xxl,
    },
    typography: {
      ...FALLBACK_THEME.typography,
      ...theme?.typography,
    },
    borderRadius: {
      ...FALLBACK_THEME.borderRadius,
      ...theme?.borderRadius,
    },
    elevation: {
      ...FALLBACK_THEME.elevation,
      ...theme?.elevation,
    },
  };
  
  return {
    theme: safeTheme,
    ...rest,
  };
};