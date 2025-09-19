import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = '📭',
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    icon: {
      fontSize: 64,
      marginBottom: theme.spacing.lg,
    },
    title: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    description: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: 24,
    },
    action: {
      minWidth: 200,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.action}
        />
      )}
    </View>
  );
};