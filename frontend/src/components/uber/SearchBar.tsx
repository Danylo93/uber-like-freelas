import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  onPress: () => void;
  placeholder?: string;
  address?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onPress,
  placeholder = "Para onde?",
  address,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60,
      left: theme.spacing.md,
      right: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.small,
      ...theme.elevation.level3,
      zIndex: 1000,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      minHeight: 56,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    textContainer: {
      flex: 1,
    },
    placeholder: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
    },
    address: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    subtitle: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.searchBar} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={theme.colors.onSurfaceVariant} 
          />
        </View>
        <View style={styles.textContainer}>
          {address ? (
            <>
              <Text style={styles.address} numberOfLines={1}>
                {address}
              </Text>
              <Text style={styles.subtitle}>Toque para alterar</Text>
            </>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};