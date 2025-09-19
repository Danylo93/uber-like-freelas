import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'outlined' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme?.borderRadius?.medium || theme?.borderRadius?.md || 12,
      minHeight: size === 'small' ? 32 : size === 'medium' ? 40 : 48,
      paddingHorizontal: theme?.spacing?.md || 16,
      opacity: disabled ? theme?.colors?.states?.disabled || 0.5 : 1,
      ...(fullWidth && { width: '100%' }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: theme?.colors?.primary || '#6750A4',
          ...(theme?.elevation?.level1 || {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }),
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: theme?.colors?.secondary || '#625B71',
          ...(theme?.elevation?.level1 || {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }),
        };
      case 'tonal':
        return {
          ...baseStyle,
          backgroundColor: theme?.colors?.primaryContainer || theme?.colors?.surfaceVariant || '#F3F3F3',
        };
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme?.colors?.outline || '#79747E',
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingHorizontal: theme?.spacing?.sm || 8,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...theme.typography.labelLarge,
      textAlign: 'center',
    };

    switch (variant) {
      case 'primary':
      case 'secondary':
        return {
          ...baseTextStyle,
          color: theme.colors.onPrimary,
        };
      case 'tonal':
        return {
          ...baseTextStyle,
          color: theme.colors.onPrimaryContainer,
        };
      case 'outlined':
      case 'text':
        return {
          ...baseTextStyle,
          color: theme.colors.primary,
        };
      default:
        return baseTextStyle;
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'secondary' ? theme.colors.onPrimary : theme.colors.primary} 
        />
      ) : (
        <>
          {icon && <Text style={{ marginRight: theme.spacing.xs }}>{icon}</Text>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // Base styles defined in getButtonStyle function
  },
});