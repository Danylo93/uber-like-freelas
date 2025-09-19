import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface AIRecommendation {
  category: string;
  title: string;
  description: string;
  estimated_price: string;
  urgency: 'low' | 'medium' | 'high';
  tips: string;
}

export default function AIRecommendationsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState({ latitude: -23.5505, longitude: -46.6333 });

  useEffect(() => {
    getCurrentLocation();
    getInitialRecommendations();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const getInitialRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAIRecommendations({
        location,
        query: '',
      });
      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      // Use fallback recommendations
      setRecommendations([
        {
          category: 'limpeza',
          title: 'Limpeza Residencial',
          description: 'Limpeza completa da sua casa',
          estimated_price: 'R$ 80-150',
          urgency: 'medium',
          tips: 'Idealmente agendado semanalmente'
        },
        {
          category: 'jardinagem',
          title: 'Manutenção de Jardim', 
          description: 'Cuidado e poda de plantas',
          estimated_price: 'R$ 60-120',
          urgency: 'low',
          tips: 'Melhor realizado pela manhã'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchRecommendations = async () => {
    if (!query.trim()) {
      Alert.alert('Aviso', 'Digite sua solicitação para receber recomendações personalizadas');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.getAIRecommendations({
        location,
        query: query.trim(),
      });
      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error('Error searching recommendations:', error);
      Alert.alert('Erro', 'Não foi possível obter recomendações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      default:
        return theme.colors.success;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...theme.elevation.level1,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    title: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
    },
    content: {
      flex: 1,
      padding: theme.spacing.md,
    },
    searchSection: {
      marginBottom: theme.spacing.lg,
    },
    searchInput: {
      marginBottom: theme.spacing.md,
    },
    recommendationCard: {
      marginBottom: theme.spacing.md,
    },
    recommendationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    recommendationTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      flex: 1,
    },
    priceText: {
      ...theme.typography.titleSmall,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    categoryChip: {
      alignSelf: 'flex-start',
      marginBottom: theme.spacing.sm,
    },
    description: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.md,
    },
    tipsSection: {
      backgroundColor: theme.colors.surfaceContainer,
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.small,
      marginBottom: theme.spacing.md,
    },
    tipsLabel: {
      ...theme.typography.labelMedium,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    tipsText: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
    },
    urgencyBadge: {
      alignSelf: 'flex-start',
      marginTop: theme.spacing.sm,
    },
    actionButton: {
      marginTop: theme.spacing.sm,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Voltar"
          onPress={() => router.back()}
          variant="text"
          style={styles.backButton}
        />
        <Text style={styles.title}>Recomendações AI</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.searchSection}>
          <TextInput
            label="O que você precisa?"
            placeholder="Ex: Preciso de limpeza para minha casa..."
            value={query}
            onChangeText={setQuery}
            multiline
            numberOfLines={2}
            style={styles.searchInput}
          />
          <Button
            title="Buscar Recomendações"
            onPress={searchRecommendations}
            loading={isLoading}
            fullWidth
          />
        </View>

        {isLoading && recommendations.length === 0 ? (
          <LoadingSpinner message="Gerando recomendações personalizadas..." />
        ) : recommendations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              🤖{'\n\n'}
              Nenhuma recomendação disponível.{'\n'}
              Tente fazer uma busca personalizada.
            </Text>
          </View>
        ) : (
          recommendations.map((rec, index) => (
            <Card key={index} style={styles.recommendationCard}>
              <Chip
                label={rec.category}
                selected={true}
                style={styles.categoryChip}
              />
              
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
                <Text style={styles.priceText}>{rec.estimated_price}</Text>
              </View>
              
              <Text style={styles.description}>{rec.description}</Text>
              
              <View style={styles.tipsSection}>
                <Text style={styles.tipsLabel}>💡 Dica</Text>
                <Text style={styles.tipsText}>{rec.tips}</Text>
              </View>
              
              <Chip
                label={`Urgência: ${rec.urgency === 'high' ? 'Alta' : rec.urgency === 'medium' ? 'Média' : 'Baixa'}`}
                selected={true}
                style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(rec.urgency) + '30' }]}
              />
              
              <Button
                title="Solicitar Serviço"
                onPress={() => {
                  router.push('/service-request');
                }}
                variant="outlined"
                fullWidth
                style={styles.actionButton}
              />
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}