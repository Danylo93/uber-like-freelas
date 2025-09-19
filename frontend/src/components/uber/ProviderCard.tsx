import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface ProviderCardProps {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  distance: number;
  estimatedTime: number;
  price: number;
  category: string;
  selected?: boolean;
  onSelect: (id: string) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  id,
  name,
  avatar,
  rating,
  reviewCount,
  distance,
  estimatedTime,
  price,
  category,
  selected = false,
  onSelect,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
      ...theme.elevation.level1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: theme.spacing.md,
      backgroundColor: theme.colors.surfaceContainer,
    },
    providerInfo: {
      flex: 1,
    },
    name: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    category: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    rating: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    },
    priceContainer: {
      alignItems: 'flex-end',
    },
    price: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    currency: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    details: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    },
    selectButton: {
      backgroundColor: selected ? theme.colors.primary : theme.colors.primaryContainer,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.small,
      marginTop: theme.spacing.sm,
    },
    selectButtonText: {
      ...theme.typography.labelMedium,
      color: selected ? theme.colors.onPrimary : theme.colors.onPrimaryContainer,
      textAlign: 'center',
      fontWeight: '600',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onSelect(id)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Image 
          source={{ uri: avatar || 'https://via.placeholder.com/48' }}
          style={styles.avatar}
          defaultSource={{ uri: 'https://via.placeholder.com/48' }}
        />
        <View style={styles.providerInfo}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.category}>{category}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.rating}>
              {rating.toFixed(1)} ({reviewCount} avaliações)
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>R$ {price.toFixed(0)}</Text>
          <Text style={styles.currency}>estimado</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.detailText}>{distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.detailText}>{estimatedTime} min</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.success} />
          <Text style={styles.detailText}>Disponível</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.selectButton}
        onPress={() => onSelect(id)}
      >
        <Text style={styles.selectButtonText}>
          {selected ? 'Selecionado' : 'Selecionar'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};