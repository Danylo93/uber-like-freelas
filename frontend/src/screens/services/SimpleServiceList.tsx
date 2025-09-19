import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';

export default function SimpleServiceList() {
  const themeContext = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const theme = themeContext?.theme || {
    colors: { background: '#F6F6F6', surface: '#FFFFFF', primary: '#6750A4', onSurface: '#1C1B1F', onSurfaceVariant: '#49454F' },
    spacing: { md: 16 }, typography: { displayMedium: { fontSize: 20, fontWeight: 'bold' }, bodyMedium: { fontSize: 14 } }
  };

  const mockServices = [
    { id: '1', title: 'Limpeza Residencial', category: '🧹 Limpeza', price: 'R$ 80,00', status: 'Disponível' },
    { id: '2', title: 'Jardinagem', category: '🌱 Jardinagem', price: 'R$ 120,00', status: 'Em andamento' },
    { id: '3', title: 'Pintura de Parede', category: '🎨 Pintura', price: 'R$ 200,00', status: 'Concluído' }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.md },
    title: { ...theme.typography.displayMedium, color: theme.colors.onSurface, marginBottom: 20, textAlign: 'center' },
    card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 },
    cardCategory: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    price: { fontSize: 16, fontWeight: '600', color: theme.colors.primary },
    status: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
    statusAvailable: { backgroundColor: '#E8F5E8', color: '#2E7D32' },
    statusProgress: { backgroundColor: '#FFF3E0', color: '#F57C00' },
    statusCompleted: { backgroundColor: '#E3F2FD', color: '#1976D2' },
    emptyState: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 40, fontSize: 16 },
    button: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' }
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Disponível': return [styles.status, styles.statusAvailable];
      case 'Em andamento': return [styles.status, styles.statusProgress];
      case 'Concluído': return [styles.status, styles.statusCompleted];
      default: return styles.status;
    }
  };

  const isProvider = user?.role === 'provider';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>
          {isProvider ? 'Solicitações' : 'Serviços Disponíveis'}
        </Text>

        {mockServices.length > 0 ? (
          mockServices.map((service) => (
            <TouchableOpacity key={service.id} style={styles.card}>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardCategory}>{service.category}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.price}>{service.price}</Text>
                <Text style={getStatusStyle(service.status)}>{service.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyState}>
            {isProvider ? 'Nenhuma solicitação no momento' : 'Nenhum serviço disponível'}
          </Text>
        )}

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            {isProvider ? 'Atualizar Solicitações' : 'Solicitar Novo Serviço'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}