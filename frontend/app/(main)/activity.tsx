import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Card } from '../../src/components/ui/Card';

export default function ActivityScreen() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
    },
    title: {
      ...theme.typography.displayMedium,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.lg,
    },
    subtitle: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Atividade</Text>
        
        <Card>
          <Text style={styles.subtitle}>
            Aqui você verá o histórico de suas atividades
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}