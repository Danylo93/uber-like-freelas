import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';

export default function SimpleActivity() {
  const themeContext = useTheme();
  const { user } = useAuth();

  const theme = themeContext?.theme || {
    colors: { background: '#F6F6F6', surface: '#FFFFFF', primary: '#6750A4', onSurface: '#1C1B1F', onSurfaceVariant: '#49454F' },
    spacing: { md: 16 }, typography: { displayMedium: { fontSize: 20, fontWeight: 'bold' }, bodyMedium: { fontSize: 14 } }
  };

  const mockActivities = [
    { id: '1', title: 'Limpeza concluída', date: '18 Set 2024', amount: 'R$ 80,00', type: 'completed' },
    { id: '2', title: 'Jardinagem em andamento', date: '17 Set 2024', amount: 'R$ 120,00', type: 'progress' },
    { id: '3', title: 'Pintura cancelada', date: '16 Set 2024', amount: 'R$ 200,00', type: 'cancelled' }
  ];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.md },
    title: { ...theme.typography.displayMedium, color: theme.colors.onSurface, marginBottom: 20, textAlign: 'center' },
    card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 },
    cardDate: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amount: { fontSize: 16, fontWeight: '600', color: theme.colors.primary },
    statusIcon: { fontSize: 20 },
    emptyState: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 40, fontSize: 16 },
    stats: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 20 },
    statsTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 12, textAlign: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    statsLabel: { fontSize: 14, color: theme.colors.onSurfaceVariant },
    statsValue: { fontSize: 14, fontWeight: '600', color: theme.colors.onSurface }
  });

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'completed': return '✅';
      case 'progress': return '🔄';
      case 'cancelled': return '❌';
      default: return '📄';
    }
  };

  const isProvider = user?.role === 'provider';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Atividades</Text>

        {isProvider && (
          <View style={styles.stats}>
            <Text style={styles.statsTitle}>📊 Estatísticas</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Serviços concluídos</Text>
              <Text style={styles.statsValue}>23</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Ganhos do mês</Text>
              <Text style={styles.statsValue}>R$ 1.240,00</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Avaliação média</Text>
              <Text style={styles.statsValue}>4.8 ⭐</Text>
            </View>
          </View>
        )}

        {mockActivities.length > 0 ? (
          mockActivities.map((activity) => (
            <TouchableOpacity key={activity.id} style={styles.card}>
              <Text style={styles.cardTitle}>{activity.title}</Text>
              <Text style={styles.cardDate}>{activity.date}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.amount}>{activity.amount}</Text>
                <Text style={styles.statusIcon}>{getStatusIcon(activity.type)}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyState}>
            Nenhuma atividade recente
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}