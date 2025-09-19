import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface PriceEstimate {
  id: string;
  serviceName: string;
  minPrice: number;
  maxPrice: number;
  estimatedTime: string;
  distance?: number;
  currency: string;
  factors?: string[];
}

interface PriceEstimatorProps {
  serviceCategory: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  destination?: {
    latitude: number;
    longitude: number;
  };
  onPriceSelect?: (estimate: PriceEstimate) => void;
  style?: any;
}

export const PriceEstimator: React.FC<PriceEstimatorProps> = ({
  serviceCategory,
  location,
  destination,
  onPriceSelect,
  style,
}) => {
  const themeContext = useTheme();
  
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
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  const [estimates, setEstimates] = useState<PriceEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<string | null>(null);

  // Mock data for different service categories
  const getEstimatesForCategory = (category: string): PriceEstimate[] => {
    const baseEstimates = {
      limpeza: [
        {
          id: 'limpeza_basica',
          serviceName: 'Limpeza Básica',
          minPrice: 50,
          maxPrice: 120,
          estimatedTime: '2-4 horas',
          currency: 'R$',
          factors: ['Tamanho do local', 'Grau de sujeira'],
        },
        {
          id: 'limpeza_pesada',
          serviceName: 'Limpeza Pesada',
          minPrice: 100,
          maxPrice: 250,
          estimatedTime: '4-8 horas',
          currency: 'R$',
          factors: ['Área total', 'Tipo de limpeza'],
        },
      ],
      manutencao: [
        {
          id: 'manutencao_rapida',
          serviceName: 'Reparo Rápido',
          minPrice: 80,
          maxPrice: 200,
          estimatedTime: '1-3 horas',
          currency: 'R$',
          factors: ['Complexidade', 'Materiais'],
        },
        {
          id: 'manutencao_completa',
          serviceName: 'Manutenção Completa',
          minPrice: 150,
          maxPrice: 500,
          estimatedTime: '3-6 horas',
          currency: 'R$',
          factors: ['Tipo de serviço', 'Materiais necessários'],
        },
      ],
      entrega: [
        {
          id: 'entrega_rapida',
          serviceName: 'Entrega Expressa',
          minPrice: 15,
          maxPrice: 45,
          estimatedTime: '15-45 min',
          distance: 10,
          currency: 'R$',
          factors: ['Distância', 'Tamanho do item'],
        },
        {
          id: 'entrega_programada',
          serviceName: 'Entrega Programada',
          minPrice: 25,
          maxPrice: 70,
          estimatedTime: '1-4 horas',
          distance: 20,
          currency: 'R$',
          factors: ['Horário', 'Peso do item'],
        },
      ],
      beleza: [
        {
          id: 'beleza_domicilio',
          serviceName: 'Beleza em Casa',
          minPrice: 60,
          maxPrice: 200,
          estimatedTime: '1-3 horas',
          currency: 'R$',
          factors: ['Tipo de serviço', 'Produtos utilizados'],
        },
      ],
    };

    return baseEstimates[category as keyof typeof baseEstimates] || [
      {
        id: 'servico_geral',
        serviceName: 'Serviço Personalizado',
        minPrice: 50,
        maxPrice: 200,
        estimatedTime: '1-4 horas',
        currency: 'R$',
        factors: ['A combinar'],
      },
    ];
  };

  useEffect(() => {
    loadPriceEstimates();
  }, [serviceCategory, location, destination]);

  const loadPriceEstimates = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const categoryEstimates = getEstimatesForCategory(serviceCategory);
      
      // Apply location-based adjustments
      const adjustedEstimates = categoryEstimates.map(estimate => {
        let multiplier = 1;
        
        // Distance-based pricing for delivery services
        if (location && destination && estimate.distance) {
          const distance = calculateDistance(location, destination);
          multiplier = Math.max(1, distance / 10); // Adjust based on distance
        }
        
        return {
          ...estimate,
          minPrice: Math.round(estimate.minPrice * multiplier),
          maxPrice: Math.round(estimate.maxPrice * multiplier),
        };
      });
      
      setEstimates(adjustedEstimates);
      setIsLoading(false);
    }, 1500);
  };

  const calculateDistance = (point1: any, point2: any): number => {
    // Simple distance calculation (in km)
    const R = 6371;
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleEstimateSelect = (estimate: PriceEstimate) => {
    setSelectedEstimate(estimate.id);
    onPriceSelect?.(estimate);
  };

  const renderPriceEstimate = (estimate: PriceEstimate) => {
    const isSelected = selectedEstimate === estimate.id;
    
    return (
      <TouchableOpacity
        key={estimate.id}
        style={[
          styles.estimateCard,
          {
            backgroundColor: isSelected ? colors.primary + '10' : colors.surface,
            borderColor: isSelected ? colors.primary : colors.outline,
          },
        ]}
        onPress={() => handleEstimateSelect(estimate)}
        activeOpacity={0.7}
      >
        <View style={styles.estimateHeader}>
          <Text
            style={[
              styles.serviceName,
              {
                color: isSelected ? colors.primary : colors.onSurface,
              },
              typography.titleMedium,
            ]}
          >
            {estimate.serviceName}
          </Text>
          
          <View style={styles.priceContainer}>
            <Text
              style={[
                styles.priceRange,
                {
                  color: isSelected ? colors.primary : colors.onSurface,
                },
                typography.titleMedium,
              ]}
            >
              {estimate.currency}{estimate.minPrice} - {estimate.currency}{estimate.maxPrice}
            </Text>
          </View>
        </View>

        <View style={styles.estimateDetails}>
          <View style={styles.detailRow}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={colors.onSurfaceVariant} 
            />
            <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
              {estimate.estimatedTime}
            </Text>
          </View>
          
          {estimate.distance && (
            <View style={styles.detailRow}>
              <Ionicons 
                name="location-outline" 
                size={16} 
                color={colors.onSurfaceVariant} 
              />
              <Text style={[styles.detailText, { color: colors.onSurfaceVariant }]}>
                até {estimate.distance}km
              </Text>
            </View>
          )}
        </View>

        {estimate.factors && (
          <View style={styles.factorsContainer}>
            <Text style={[styles.factorsLabel, { color: colors.onSurfaceVariant }]}>
              Fatores de preço:
            </Text>
            <Text style={[styles.factorsText, { color: colors.onSurfaceVariant }]}>
              {estimate.factors.join(' • ')}
            </Text>
          </View>
        )}

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      ...typography.titleMedium,
      color: colors.onSurface,
      marginBottom: 4,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    loadingText: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      marginTop: 12,
    },
    estimatesContainer: {
      gap: 12,
    },
    estimateCard: {
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      position: 'relative',
    },
    estimateHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    serviceName: {
      flex: 1,
      marginRight: 12,
    },
    priceContainer: {
      alignItems: 'flex-end',
    },
    priceRange: {
      fontWeight: '700',
    },
    estimateDetails: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    detailText: {
      ...typography.bodySmall,
    },
    factorsContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.outline + '30',
    },
    factorsLabel: {
      ...typography.bodySmall,
      fontWeight: '600',
      marginBottom: 2,
    },
    factorsText: {
      ...typography.bodySmall,
      lineHeight: 16,
    },
    selectedIndicator: {
      position: 'absolute',
      top: 12,
      right: 12,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Estimativas de Preço</Text>
        <Text style={styles.subtitle}>
          Escolha o tipo de serviço que melhor atende suas necessidades
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Calculando estimativas...</Text>
        </View>
      ) : (
        <View style={styles.estimatesContainer}>
          {estimates.map(renderPriceEstimate)}
        </View>
      )}
    </View>
  );
};