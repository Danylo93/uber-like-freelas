import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface FloatingActionButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'surface';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  children,
  style,
  size = 'medium',
  variant = 'primary',
}) => {
  const { theme } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 64;
      default:
        return 56;
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'secondary':
        return theme.colors.secondary;
      case 'surface':
        return theme.colors.surface;
      default:
        return theme.colors.primary;
    }
  };

  const buttonSize = getSize();

  const styles = StyleSheet.create({
    button: {
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      backgroundColor: getBackgroundColor(),
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.elevation.level3,
    },
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
};