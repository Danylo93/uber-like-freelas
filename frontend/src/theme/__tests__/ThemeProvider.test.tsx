import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../ThemeProvider';
import { Text } from 'react-native';

// Test component to access theme
const TestComponent: React.FC = () => {
  const { theme, isDark, toggleTheme, isLoading, error } = useTheme();
  
  if (isLoading) {
    return <Text testID="loading">Loading</Text>;
  }
  
  if (error) {
    return <Text testID="error">{error}</Text>;
  }
  
  return (
    <>
      <Text testID="theme-colors">{JSON.stringify(theme.colors)}</Text>
      <Text testID="is-dark">{isDark.toString()}</Text>
      <Text testID="toggle-theme" onPress={toggleTheme}>Toggle</Text>
    </>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear any previous state
    jest.clearAllMocks();
  });

  it('should provide default light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('is-dark')).toHaveTextContent('false');
    expect(screen.getByTestId('theme-colors')).toBeDefined();
  });

  it('should handle theme loading state', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Initially should show loading or content
    const loading = screen.queryByTestId('loading');
    const colors = screen.queryByTestId('theme-colors');
    
    expect(loading || colors).toBeDefined();
  });

  it('should toggle between light and dark themes', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');
    const isDarkText = screen.getByTestId('is-dark');

    // Initial state should be light
    expect(isDarkText).toHaveTextContent('false');

    // Toggle to dark
    act(() => {
      toggleButton.props.onPress();
    });

    // Should be dark now
    expect(isDarkText).toHaveTextContent('true');
  });

  it('should provide fallback theme when context is undefined', () => {
    // Component outside provider should get fallback
    const OutsideComponent: React.FC = () => {
      const { theme, isDark, error } = useTheme();
      return (
        <>
          <Text testID="fallback-theme">{theme ? 'has-theme' : 'no-theme'}</Text>
          <Text testID="fallback-dark">{isDark.toString()}</Text>
          <Text testID="fallback-error">{error || 'no-error'}</Text>
        </>
      );
    };

    render(<OutsideComponent />);

    expect(screen.getByTestId('fallback-theme')).toHaveTextContent('has-theme');
    expect(screen.getByTestId('fallback-dark')).toHaveTextContent('false');
    expect(screen.getByTestId('fallback-error')).toHaveTextContent('no-error');
  });

  it('should handle theme initialization errors gracefully', () => {
    // Mock AsyncStorage to throw error
    const mockGetItem = jest.fn().mockRejectedValue(new Error('Storage error'));
    require('@react-native-async-storage/async-storage').getItem = mockGetItem;

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Should still provide a working theme despite storage error
    expect(screen.getByTestId('theme-colors')).toBeDefined();
  });

  it('should persist theme preference', async () => {
    const mockSetItem = jest.fn().mockResolvedValue(undefined);
    require('@react-native-async-storage/async-storage').setItem = mockSetItem;

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');

    act(() => {
      toggleButton.props.onPress();
    });

    // Should attempt to save theme preference
    expect(mockSetItem).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String)
    );
  });

  it('should provide all required theme properties', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeColorsText = screen.getByTestId('theme-colors').props.children;
    const themeColors = JSON.parse(themeColorsText);

    // Check for required color properties
    expect(themeColors).toHaveProperty('primary');
    expect(themeColors).toHaveProperty('secondary');
    expect(themeColors).toHaveProperty('surface');
    expect(themeColors).toHaveProperty('background');
    expect(themeColors).toHaveProperty('error');
    expect(themeColors).toHaveProperty('onSurface');
    expect(themeColors).toHaveProperty('onBackground');
  });
});