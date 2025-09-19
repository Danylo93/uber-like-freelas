import { colors, typography, spacing, borderRadius, elevation } from './tokens';

export interface Theme {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  elevation: typeof elevation;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  elevation,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    ...colors,
    // Override with dark colors
    surface: colors.dark.surface,
    onSurface: colors.dark.onSurface,
    surfaceVariant: colors.dark.surfaceVariant,
    onSurfaceVariant: colors.dark.onSurfaceVariant,
    background: colors.dark.background,
    onBackground: colors.dark.onBackground,
    surfaceContainer: colors.dark.surfaceContainer,
    surfaceContainerHigh: colors.dark.surfaceContainerHigh,
  },
  typography,
  spacing,
  borderRadius,
  elevation,
  isDark: true,
};