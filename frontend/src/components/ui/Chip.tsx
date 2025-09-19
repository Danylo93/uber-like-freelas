import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

export type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: ChipVariant;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  onDelete,
  disabled = false,
  icon,
  variant = 'assist',
  style,
}) => {
  const { theme } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.small,
      minHeight: 32,
      opacity: disabled ? theme.colors.states.disabled : 1,
    };

    if (selected) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.secondaryContainer,
        borderWidth: 0,
      };
    }

    switch (variant) {
      case 'filter':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.outline,
        };
      case 'input':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceContainer,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceContainer,
          ...theme.elevation.level1,
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    return {
      ...theme.typography.labelMedium,
      color: selected 
        ? theme.colors.onSecondaryContainer 
        : theme.colors.onSurfaceVariant,
      marginLeft: icon ? theme.spacing.xs : 0,
      marginRight: onDelete ? theme.spacing.xs : 0,
    };
  };

  const content = (
    <>
      {icon && <View>{icon}</View>}
      <Text style={getTextStyle()}>{label}</Text>
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: theme.spacing.xs }}
        >
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>×</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[getContainerStyle(), style]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getContainerStyle(), style]}>
      {content}
    </View>
  );
};