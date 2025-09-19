import React, { useState } from 'react';
import { TextInput as RNTextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  variant?: 'filled' | 'outlined';
}

export const TextInput: React.FC<CustomTextInputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  variant = 'filled',
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.small,
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      borderWidth: variant === 'outlined' ? 1 : 0,
    };

    if (variant === 'filled') {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.surfaceContainer,
      };
    }

    // Outlined variant
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      borderColor: error 
        ? theme.colors.error 
        : isFocused 
          ? theme.colors.primary 
          : theme.colors.outline,
      borderWidth: isFocused ? 2 : 1,
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
      flex: 1,
      paddingHorizontal: leftIcon || rightIcon ? theme.spacing.sm : 0,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      ...theme.typography.bodyMedium,
      color: error 
        ? theme.colors.error 
        : isFocused 
          ? theme.colors.primary 
          : theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
    };
  };

  const getHelperStyle = (): TextStyle => {
    return {
      ...theme.typography.bodySmall,
      color: error ? theme.colors.error : theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    };
  };

  return (
    <View style={containerStyle}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      <View style={getContainerStyle()}>
        {leftIcon && <View style={{ marginRight: theme.spacing.sm }}>{leftIcon}</View>}
        <RNTextInput
          style={[getInputStyle(), inputStyle]}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && <View style={{ marginLeft: theme.spacing.sm }}>{rightIcon}</View>}
      </View>
      {(error || helper) && (
        <Text style={getHelperStyle()}>{error || helper}</Text>
      )}
    </View>
  );
};