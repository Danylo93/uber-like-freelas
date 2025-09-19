import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface UberSearchBarProps {
  onPress: () => void;
  placeholder?: string;
  address?: string;
  style?: any;
}

export const UberSearchBar: React.FC<UberSearchBarProps> = ({
  onPress,
  placeholder = "Que serviço você precisa?",
  address,
  style,
}) => {
  const themeContext = useTheme();
  
  // Fallback colors in case theme context is not available
  const colors = themeContext?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    outline: '#79747E',
  };
  
  const typography = themeContext?.typography || {
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 70 : 50,
      left: 16,
      right: 16,
      zIndex: 1000,
      maxWidth: 500, // Prevent stretching on larger screens
      alignSelf: 'center',
    },
    searchCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    placeholderText: {
      ...typography.titleMedium,
      color: colors.onSurface,
      fontWeight: '600',
    },
    addressText: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    arrow: {
      marginLeft: 8,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.searchCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons 
            name="location-outline" 
            size={20} 
            color={colors.onSurfaceVariant} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.placeholderText}>
            {address || placeholder}
          </Text>
          {address && (
            <Text style={styles.addressText}>
              Toque para alterar
            </Text>
          )}
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={colors.onSurfaceVariant}
          style={styles.arrow}
        />
      </TouchableOpacity>
    </View>
  );
};

export default UberSearchBar;