import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { apiService } from '../../services/api';

interface EarningsData {
  today: number;
  week: number;
  month: number;
  total: number;
  completedServices: number;
  rating: number;
  totalHours: number;
}

interface ServiceHistory {
  id: string;
  service_type: string;
  earnings: number;
  date: string;
  rating?: number;
  duration: number; // in minutes
}

interface EarningsDashboardProps {
  style?: any;
}

export const EarningsDashboard: React.FC<EarningsDashboardProps> = ({ style }) => {
  const themeContext = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earningsData, setEarningsData] = useState<EarningsData>({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    completedServices: 0,
    rating: 0,
    totalHours: 0,
  });
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    outline: '#79747E',
  };
  
  const typography = themeContext?.theme?.typography || {
    headlineSmall: { fontSize: 24, fontWeight: '600' },
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would call actual earnings endpoints
      // For now, we'll simulate with some data based on completed services
      const servicesResponse = await apiService.get('/services/requests');
      const completedServices = servicesResponse.data.filter((s: any) => s.status === 'completed');
      
      // Mock earnings calculation
      const mockEarnings: EarningsData = {
        today: 125.50,
        week: 780.25,
        month: 3245.80,
        total: 12456.70,
        completedServices: completedServices.length,
        rating: 4.8,
        totalHours: 156,
      };

      const mockHistory: ServiceHistory[] = [
        {
          id: '1',
          service_type: 'Limpeza',
          earnings: 85.00,
          date: new Date().toISOString(),
          rating: 5,
          duration: 120,
        },
        {
          id: '2',
          service_type: 'Manutenção',
          earnings: 150.00,
          date: new Date(Date.now() - 86400000).toISOString(),
          rating: 4,
          duration: 180,
        },
        {
          id: '3',
          service_type: 'Entrega',
          earnings: 25.00,
          date: new Date(Date.now() - 172800000).toISOString(),
          rating: 5,
          duration: 30,
        },
      ];

      setEarningsData(mockEarnings);
      setServiceHistory(mockHistory);
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getServiceIcon = (serviceType: string) => {
    const iconMap: { [key: string]: string } = {
      'Limpeza': 'sparkles',
      'Manutenção': 'construct',
      'Entrega': 'bicycle',
      'Beleza': 'cut',
      'Saúde': 'medical',
      'Educação': 'school',
      'Pet Care': 'paw',
    };
    return iconMap[serviceType] || 'help-circle';
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
    }
  };

  const getCurrentEarnings = () => {
    return earningsData[selectedPeriod];
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      flex: 1,
    },
    header: {
      padding: 20,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      ...typography.headlineSmall,
      color: colors.surface,
      marginBottom: 8,
    },
    headerSubtitle: {
      ...typography.bodyMedium,
      color: colors.surface + 'CC',
    },
    periodSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      margin: 16,
      borderRadius: 16,
      padding: 4,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
    },
    periodButtonText: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
    },
    periodButtonTextActive: {
      color: colors.surface,
      fontWeight: '600',
    },
    earningsCard: {
      backgroundColor: colors.surfaceVariant,
      margin: 16,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
    },
    earningsAmount: {
      ...typography.headlineSmall,
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 8,
    },
    earningsLabel: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statValue: {
      ...typography.titleMedium,
      color: colors.onSurface,
      fontWeight: '700',
      marginBottom: 4,
    },
    statLabel: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    historySection: {
      flex: 1,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      ...typography.titleMedium,
      color: colors.onSurface,
      marginBottom: 12,
    },
    historyItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    serviceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    historyContent: {
      flex: 1,
    },
    serviceName: {
      ...typography.titleMedium,
      color: colors.onSurface,
      marginBottom: 4,
    },
    serviceDate: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
    },
    historyRight: {
      alignItems: 'flex-end',
    },
    earningsAmount2: {
      ...typography.titleMedium,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 4,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      marginLeft: 4,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass" size={48} color={colors.outline} />
          <Text style={styles.emptyText}>Carregando seus ganhos...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seus Ganhos</Text>
        <Text style={styles.headerSubtitle}>
          Acompanhe sua performance como prestador
        </Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Earnings Display */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsAmount}>
          {formatCurrency(getCurrentEarnings())}
        </Text>
        <Text style={styles.earningsLabel}>
          Ganhos de {getPeriodLabel()}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earningsData.completedServices}</Text>
          <Text style={styles.statLabel}>Serviços Completos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earningsData.rating}⭐</Text>
          <Text style={styles.statLabel}>Avaliação Média</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earningsData.totalHours}h</Text>
          <Text style={styles.statLabel}>Horas Trabalhadas</Text>
        </View>
      </View>

      {/* Service History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Histórico Recente</Text>
        
        {serviceHistory.length > 0 ? (
          serviceHistory.map((service) => (
            <View key={service.id} style={styles.historyItem}>
              <View
                style={[
                  styles.serviceIcon,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Ionicons
                  name={getServiceIcon(service.service_type) as any}
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.historyContent}>
                <Text style={styles.serviceName}>{service.service_type}</Text>
                <Text style={styles.serviceDate}>
                  {formatDate(service.date)} • {service.duration}min
                </Text>
              </View>

              <View style={styles.historyRight}>
                <Text style={styles.earningsAmount2}>
                  {formatCurrency(service.earnings)}
                </Text>
                {service.rating && (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={12} color="#FFB000" />
                    <Text style={styles.ratingText}>{service.rating}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt" size={48} color={colors.outline} />
            <Text style={styles.emptyText}>
              Nenhum serviço completado ainda.{'\n'}
              Complete seu primeiro serviço para ver seus ganhos!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};