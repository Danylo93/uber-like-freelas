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
      borderRadius: theme?.borderRadius?.md || 12,
      minHeight: 56,
      paddingVertical: theme?.spacing?.sm || 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme?.spacing?.md || 16,
      borderWidth: variant === 'outlined' ? 1 : 0,
    };

    if (variant === 'filled') {
      return {
        ...baseStyle,
        backgroundColor: theme?.colors?.surfaceContainer || theme?.colors?.surfaceVariant || '#F3F3F3',
      };
    }

    // Outlined variant
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      borderColor: error 
        ? theme?.colors?.error || '#BA1A1A'
        : isFocused 
          ? theme?.colors?.primary || '#6750A4'
          : theme?.colors?.outline || '#79747E',
      borderWidth: isFocused ? 2 : 1,
    };
  };

  const getInputStyle = (): TextStyle => {
    return {
      ...(theme?.typography?.bodyLarge || {}),
      color: theme?.colors?.onSurface || '#1C1B1F',
      flex: 1,
      paddingHorizontal: leftIcon || rightIcon ? theme?.spacing?.sm || 8 : 0,
    };
  };

  const getLabelStyle = (): TextStyle => {
    return {
      ...(theme?.typography?.bodyMedium || {}),
      color: error 
        ? theme?.colors?.error || '#BA1A1A'
        : isFocused 
          ? theme?.colors?.primary || '#6750A4'
          : theme?.colors?.onSurfaceVariant || '#49454F',
      marginBottom: theme?.spacing?.xs || 4,
    };
  };

  const getHelperStyle = (): TextStyle => {
    return {
      ...(theme?.typography?.bodySmall || {}),
      color: error ? theme?.colors?.error || '#BA1A1A' : theme?.colors?.onSurfaceVariant || '#49454F',
      marginTop: theme?.spacing?.xs || 4,
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