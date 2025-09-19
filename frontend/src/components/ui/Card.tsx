import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type CardVariant = 'elevated' | 'filled' | 'outlined';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: ViewStyle;
  padding?: keyof typeof import('../../theme/tokens').spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  style,
  padding = 'md',
}) => {
  const { theme } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme?.borderRadius?.medium || theme?.borderRadius?.md || 12,
      padding: theme?.spacing?.[padding] || theme?.spacing?.md || 16,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme?.colors?.surface || '#FFFFFF',
          ...(theme?.elevation?.level1 || {
            shadowColor: theme?.colors?.shadow || '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }),
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme?.colors?.surfaceContainer || theme?.colors?.surfaceVariant || '#F3F3F3',
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme?.colors?.surface || '#FFFFFF',
          borderWidth: 1,
          borderColor: theme?.colors?.outlineVariant || theme?.colors?.outline || '#79747E',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};