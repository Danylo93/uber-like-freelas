import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';
import { theme as lightTheme } from '../theme/theme';
import { darkTheme } from '../theme/darkTheme';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '../utils/cacheManager';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: typeof lightTheme;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  
  // Performance tracking
  performanceMode: boolean;
  setPerformanceMode: (enabled: boolean) => void;
  
  // Accessibility
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  
  // Theme customization
  customColors: Partial<typeof lightTheme.colors>;
  setCustomColors: (colors: Partial<typeof lightTheme.colors>) => void;
  resetCustomColors: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme_mode';
const PERFORMANCE_STORAGE_KEY = 'app_performance_mode';
const REDUCED_MOTION_STORAGE_KEY = 'app_reduced_motion';
const CUSTOM_COLORS_STORAGE_KEY = 'app_custom_colors';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(lightTheme);
  const [performanceMode, setPerformanceModeState] = useState(false);
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [customColors, setCustomColorsState] = useState<Partial<typeof lightTheme.colors>>({});

  // Load saved preferences on startup
  useEffect(() => {
    loadThemePreferences();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, [themeMode]);

  // Update current theme when dark mode or custom colors change
  useEffect(() => {
    const baseTheme = isDark ? darkTheme : lightTheme;
    
    if (Object.keys(customColors).length > 0) {
      setCurrentTheme({
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          ...customColors,
        },
      });
    } else {
      setCurrentTheme(baseTheme);
    }
  }, [isDark, customColors]);

  const loadThemePreferences = async () => {
    try {
      // Load cached preferences
      const preferences = await cacheManager.batchGet([
        THEME_STORAGE_KEY,
        PERFORMANCE_STORAGE_KEY,
        REDUCED_MOTION_STORAGE_KEY,
        CUSTOM_COLORS_STORAGE_KEY,
      ]);

      // Theme mode
      const savedThemeMode = preferences.get(THEME_STORAGE_KEY) as ThemeMode;
      if (savedThemeMode) {
        setThemeModeState(savedThemeMode);
        
        if (savedThemeMode === 'system') {
          setIsDark(Appearance.getColorScheme() === 'dark');
        } else {
          setIsDark(savedThemeMode === 'dark');
        }
      } else {
        // Default to system theme
        setIsDark(Appearance.getColorScheme() === 'dark');
      }

      // Performance mode
      const savedPerformanceMode = preferences.get(PERFORMANCE_STORAGE_KEY);
      if (savedPerformanceMode !== null) {
        setPerformanceModeState(savedPerformanceMode);
      }

      // Reduced motion
      const savedReducedMotion = preferences.get(REDUCED_MOTION_STORAGE_KEY);
      if (savedReducedMotion !== null) {
        setReducedMotionState(savedReducedMotion);
      }

      // Custom colors
      const savedCustomColors = preferences.get(CUSTOM_COLORS_STORAGE_KEY);
      if (savedCustomColors) {
        setCustomColorsState(savedCustomColors);
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      
      if (mode === 'system') {
        setIsDark(Appearance.getColorScheme() === 'dark');
      } else {
        setIsDark(mode === 'dark');
      }

      // Cache the preference
      await cacheManager.set(THEME_STORAGE_KEY, mode, {
        ttl: CACHE_TTL.PERSISTENT,
        persistent: true,
      });

      console.log(`🎨 Theme mode changed to: ${mode}`);
    } catch (error) {
      console.warn('Failed to save theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const newMode: ThemeMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const setPerformanceMode = async (enabled: boolean) => {
    try {
      setPerformanceModeState(enabled);
      
      await cacheManager.set(PERFORMANCE_STORAGE_KEY, enabled, {
        ttl: CACHE_TTL.PERSISTENT,
        persistent: true,
      });

      console.log(`⚡ Performance mode: ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.warn('Failed to save performance mode:', error);
    }
  };

  const setReducedMotion = async (enabled: boolean) => {
    try {
      setReducedMotionState(enabled);
      
      await cacheManager.set(REDUCED_MOTION_STORAGE_KEY, enabled, {
        ttl: CACHE_TTL.PERSISTENT,
        persistent: true,
      });

      console.log(`🏃 Reduced motion: ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.warn('Failed to save reduced motion preference:', error);
    }
  };

  const setCustomColors = async (colors: Partial<typeof lightTheme.colors>) => {
    try {
      const newCustomColors = { ...customColors, ...colors };
      setCustomColorsState(newCustomColors);
      
      await cacheManager.set(CUSTOM_COLORS_STORAGE_KEY, newCustomColors, {
        ttl: CACHE_TTL.PERSISTENT,
        persistent: true,
      });

      console.log('🎨 Custom colors updated');
    } catch (error) {
      console.warn('Failed to save custom colors:', error);
    }
  };

  const resetCustomColors = async () => {
    try {
      setCustomColorsState({});
      
      await cacheManager.invalidate(CUSTOM_COLORS_STORAGE_KEY);
      
      console.log('🎨 Custom colors reset');
    } catch (error) {
      console.warn('Failed to reset custom colors:', error);
    }
  };

  const value: ThemeContextType = {
    theme: currentTheme,
    isDark,
    themeMode,
    setThemeMode,
    toggleTheme,
    performanceMode,
    setPerformanceMode,
    reducedMotion,
    setReducedMotion,
    customColors,
    setCustomColors,
    resetCustomColors,
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
    // Fallback theme to prevent crashes
    console.warn('useTheme must be used within a ThemeProvider. Using fallback theme.');
    return {
      theme: lightTheme,
      isDark: false,
      themeMode: 'light',
      setThemeMode: () => {},
      toggleTheme: () => {},
      performanceMode: false,
      setPerformanceMode: () => {},
      reducedMotion: false,
      setReducedMotion: () => {},
      customColors: {},
      setCustomColors: () => {},
      resetCustomColors: () => {},
    };
  }
  return context;
};

// Hook for theme-aware styles
export const useThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: typeof lightTheme, isDark: boolean) => T
): T => {
  const { theme, isDark } = useTheme();
  return React.useMemo(() => styleCreator(theme, isDark), [theme, isDark]);
};

// Hook for performance-aware animations
export const usePerformanceAnimation = () => {
  const { performanceMode, reducedMotion } = useTheme();
  
  return {
    // Disable animations if performance mode is on or reduced motion is enabled
    shouldAnimate: !performanceMode && !reducedMotion,
    
    // Get appropriate animation duration
    getDuration: (normalDuration: number) => {
      if (performanceMode) return normalDuration * 0.5; // Faster animations
      if (reducedMotion) return 0; // No animations
      return normalDuration;
    },
    
    // Get appropriate animation config
    getAnimationConfig: (config: any) => ({
      ...config,
      duration: config.duration ? (performanceMode ? config.duration * 0.5 : config.duration) : undefined,
      useNativeDriver: !performanceMode, // Use JS driver for performance mode
    }),
  };
};

// Theme utility functions
export const themeUtils = {
  // Get contrasting text color
  getContrastingTextColor: (backgroundColor: string, theme: typeof lightTheme) => {
    // Simple implementation - in production, use a proper contrast ratio calculation
    return backgroundColor === theme.colors.primary ? theme.colors.onPrimary : theme.colors.onSurface;
  },
  
  // Apply opacity to color
  withOpacity: (color: string, opacity: number) => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  },
  
  // Get elevation-appropriate surface color
  getElevatedSurface: (elevation: number, theme: typeof lightTheme) => {
    if (theme.isDark) {
      // In dark theme, apply elevation overlay
      const overlay = theme.colors.primary;
      const opacity = Math.min(elevation * 0.05, 0.15);
      return themeUtils.withOpacity(overlay, opacity);
    }
    return theme.colors.surface;
  },
  
  // Get theme-aware icon color
  getIconColor: (variant: 'primary' | 'secondary' | 'surface', theme: typeof lightTheme) => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.onSurfaceVariant;
      case 'surface':
        return theme.colors.onSurface;
      default:
        return theme.colors.onSurface;
    }
  },
};