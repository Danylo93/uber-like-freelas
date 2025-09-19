import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { serviceActionsAPI, NearbyService, EarningsData } from '../../services/serviceActions';

export default function ProviderHomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    initLocation();
    loadProviderData();
  }, []);

  const initLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da localização para mostrar serviços próximos');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    }
  };

  const loadProviderData = async () => {
    try {
      const [servicesData, earningsData] = await Promise.all([
        serviceActionsAPI.getNearbyServices(),
        serviceActionsAPI.getProviderEarnings()
      ]);
      setNearbyServices(servicesData.services || []);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error loading provider data:', error);
      setNearbyServices([]);
      setEarnings(null);
    }
  };

  const handleToggleOnline = async () => {
    try {
      setLoading(true);
      const response = await serviceActionsAPI.toggleProviderStatus();
      setIsOnline(response.status === 'online');
      
      Alert.alert(
        'Status atualizado',
        response.message,
        [{ text: 'OK' }]
      );
      
      // Reload nearby services if going online
      if (response.status === 'online') {
        await loadProviderData();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      Alert.alert('Erro', 'Não foi possível alterar o status. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptService = async (service: NearbyService) => {
    Alert.alert(
      'Aceitar Solicitação',
      `Cliente: ${service.client_name}\nServiço: ${service.title}\nLocal: ${service.location?.address || 'Não informado'}\nValor: R$ ${service.budget || 0},00\n\nDeseja aceitar esta solicitação?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aceitar', 
          onPress: async () => {
            try {
              setLoading(true);
              const response = await serviceActionsAPI.acceptServiceRequest(service.id);
              
              Alert.alert('✅ Sucesso!', response.message);
              
              // Remove from list and reload
              setNearbyServices(prev => prev.filter(s => s.id !== service.id));
              await loadProviderData();
            } catch (error) {
              console.error('Error accepting service:', error);
              Alert.alert('Erro', 'Não foi possível aceitar a solicitação.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadProviderData();
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = () => {
    return isOnline ? '#4CAF50' : '#FF5722';
  };

  const getStatusText = () => {
    return isOnline ? '🟢 Online' : '🔴 Offline';
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 20, backgroundColor: theme.colors.primary },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    subtitle: { fontSize: 16, color: 'white', opacity: 0.9 },
    content: { flex: 1, padding: 16 },
    
    // Status section
    statusSection: { 
      backgroundColor: theme.colors.surface, 
      padding: 16, 
      borderRadius: 12, 
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    statusText: { fontSize: 18, fontWeight: 'bold' },
    statusButton: { 
      paddingHorizontal: 16, 
      paddingVertical: 8, 
      borderRadius: 20, 
      minWidth: 100 
    },
    statusButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
    
    // Earnings section
    earningsSection: { 
      backgroundColor: theme.colors.surfaceVariant, 
      padding: 16, 
      borderRadius: 12, 
      marginBottom: 16 
    },
    earningsTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface, marginBottom: 12 },
    earningsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    earningsItem: { alignItems: 'center', flex: 1 },
    earningsValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
    earningsLabel: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 4 },
    
    // Services section
    servicesSection: { flex: 1 },
    servicesTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.onBackground, marginBottom: 12 },
    
    // Service card
    serviceCard: { 
      backgroundColor: theme.colors.surface, 
      padding: 16, 
      borderRadius: 12, 
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    serviceTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.onSurface, flex: 1 },
    serviceBudget: { fontSize: 16, fontWeight: 'bold', color: theme.colors.primary },
    serviceClient: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    serviceLocation: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 8 },
    serviceDescription: { fontSize: 14, color: theme.colors.onSurface, marginBottom: 12 },
    serviceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    serviceTime: { fontSize: 12, color: theme.colors.onSurfaceVariant },
    acceptButton: { 
      backgroundColor: theme.colors.primary, 
      paddingHorizontal: 16, 
      paddingVertical: 8, 
      borderRadius: 8 
    },
    acceptButtonText: { color: 'white', fontWeight: 'bold' },
    
    // Empty state
    emptyState: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingVertical: 40 
    },
    emptyStateText: { 
      fontSize: 16, 
      color: theme.colors.onSurfaceVariant, 
      textAlign: 'center',
      marginBottom: 8
    },
    emptyStateSubtext: { 
      fontSize: 14, 
      color: theme.colors.onSurfaceVariant, 
      textAlign: 'center' 
    },
    
    // Status info
    statusInfo: { 
      fontSize: 12, 
      color: theme.colors.onSurfaceVariant, 
      textAlign: 'center',
      padding: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 16
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bem-vindo, {user?.name}! 👷‍♂️</Text>
        <Text style={styles.subtitle}>Gerencie seus serviços</Text>
      </View>

      <Text style={styles.statusInfo}>
        👨‍🔧 Modo Prestador | 📍 {userLocation ? `${nearbyServices.length} solicitações próximas` : 'Obtendo localização...'}
      </Text>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            <TouchableOpacity 
              style={[styles.statusButton, { backgroundColor: getStatusColor() }]}
              onPress={handleToggleOnline}
              disabled={loading}
            >
              <Text style={styles.statusButtonText}>
                {loading ? '⏳' : (isOnline ? 'Ficar Offline' : 'Ficar Online')}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14 }}>
            {isOnline 
              ? 'Você está online e pode receber solicitações' 
              : 'Fique online para receber solicitações de serviço'
            }
          </Text>
        </View>

        {/* Earnings Section */}
        {earnings && (
          <View style={styles.earningsSection}>
            <Text style={styles.earningsTitle}>📊 Suas Estatísticas</Text>
            <View style={styles.earningsGrid}>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsValue}>{earnings.total_services}</Text>
                <Text style={styles.earningsLabel}>Serviços</Text>
              </View>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsValue}>{formatCurrency(earnings.total_earnings)}</Text>
                <Text style={styles.earningsLabel}>Total Ganho</Text>
              </View>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsValue}>{earnings.provider_rating.toFixed(1)} ⭐</Text>
                <Text style={styles.earningsLabel}>Avaliação</Text>
              </View>
            </View>
          </View>
        )}

        {/* Services Section */}
        <View style={styles.servicesSection}>
          <Text style={styles.servicesTitle}>
            💼 Solicitações Disponíveis ({nearbyServices.length})
          </Text>

          {nearbyServices.length > 0 ? (
            nearbyServices.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  <Text style={styles.serviceBudget}>
                    {formatCurrency(service.budget || 0)}
                  </Text>
                </View>
                
                <Text style={styles.serviceClient}>👤 {service.client_name}</Text>
                <Text style={styles.serviceLocation}>
                  📍 {service.location?.address || 'Localização não informada'}
                </Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
                
                <View style={styles.serviceFooter}>
                  <Text style={styles.serviceTime}>
                    🕒 {service.estimated_duration || '2-4 horas'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => handleAcceptService(service)}
                    disabled={loading}
                  >
                    <Text style={styles.acceptButtonText}>
                      {loading ? '⏳' : 'Aceitar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isOnline ? '📭 Nenhuma solicitação disponível' : '⚠️ Você está offline'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {isOnline 
                  ? 'Aguarde novas solicitações aparecerem' 
                  : 'Fique online para ver solicitações próximas'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}