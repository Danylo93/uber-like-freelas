import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useServices, ServiceRequest } from '../../contexts/ServicesContext';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function ServiceListScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { serviceRequests, isLoading, refreshData } = useServices();
  const router = useRouter();

  useEffect(() => {
    refreshData();
  }, []);

  const renderServiceRequest = ({ item }: { item: ServiceRequest }) => {
    const isMyRequest = item.client_id === user?.id;
    
    return (
      <Card style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.categoryContainer}>
            <Chip
              label={item.category}
              selected={true}
              variant="assist"
            />
            <Chip
              label={item.status}
              selected={item.status === 'completed'}
              variant="filter"
            />
          </View>
          {item.estimated_price && (
            <Text style={styles.price}>R$ {item.estimated_price.toFixed(2)}</Text>
          )}
        </View>
        
        <Text style={styles.requestTitle}>{item.title}</Text>
        <Text style={styles.requestDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.requestAddress}>{item.address}</Text>
        
        <View style={styles.requestFooter}>
          <Text style={styles.requestDate}>
            {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </Text>
          
          {user?.role === 'provider' && !isMyRequest && (
            <Button
              title="Fazer Oferta"
              onPress={() => {
                // TODO: Navigate to offer screen
                console.log('Make offer for:', item.id);
              }}
              variant="outlined"
              size="small"
            />
          )}
          
          {isMyRequest && (
            <Button
              title="Ver Detalhes"
              onPress={() => {
                // TODO: Navigate to request details
                console.log('View details:', item.id);
              }}
              variant="text"
              size="small"
            />
          )}
        </View>
      </Card>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...theme.elevation.level1,
    },
    title: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    requestCard: {
      marginBottom: theme.spacing.md,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    categoryContainer: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      flex: 1,
    },
    price: {
      ...theme.typography.titleMedium,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    requestTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    requestDescription: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.sm,
    },
    requestAddress: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.md,
    },
    requestFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    requestDate: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
  });

  if (isLoading && serviceRequests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="Carregando serviços..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.role === 'client' ? 'Minhas Solicitações' : 'Solicitações Disponíveis'}
        </Text>
        
        {user?.role === 'client' && (
          <Button
            title="+ Nova"
            onPress={() => router.push('/service-request')}
            variant="primary"
            size="small"
          />
        )}
      </View>

      {serviceRequests.length === 0 ? (
        <EmptyState
          title={user?.role === 'client' ? 'Nenhuma solicitação' : 'Nenhum serviço disponível'}
          description={
            user?.role === 'client' 
              ? 'Crie sua primeira solicitação de serviço'
              : 'Não há solicitações disponíveis no momento'
          }
          icon={user?.role === 'client' ? '📝' : '🔍'}
          actionLabel={user?.role === 'client' ? 'Criar Solicitação' : 'Atualizar'}
          onAction={() => {
            if (user?.role === 'client') {
              router.push('/service-request');
            } else {
              refreshData();
            }
          }}
        />
      ) : (
        <FlatList
          data={serviceRequests}
          renderItem={renderServiceRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshData}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}