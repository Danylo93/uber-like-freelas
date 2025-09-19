import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface PaymentPackage {
  id: string;
  name: string;
  amount: number;
  currency: string;
  description: string;
  features: string[];
}

const PAYMENT_PACKAGES: PaymentPackage[] = [
  {
    id: 'service_basic',
    name: 'Serviço Básico',
    amount: 50.0,
    currency: 'BRL',
    description: 'Ideal para serviços simples e rápidos',
    features: ['Até 2 horas de serviço', 'Suporte básico', 'Garantia de 7 dias']
  },
  {
    id: 'service_premium',
    name: 'Serviço Premium',
    amount: 150.0,
    currency: 'BRL',
    description: 'Para serviços complexos e especializados',
    features: ['Até 6 horas de serviço', 'Suporte prioritário', 'Garantia de 15 dias', 'Relatório detalhado']
  },
  {
    id: 'service_deluxe',
    name: 'Serviço Deluxe',
    amount: 300.0,
    currency: 'BRL',
    description: 'Serviço completo com máxima qualidade',
    features: ['Serviço ilimitado', 'Suporte 24/7', 'Garantia de 30 dias', 'Relatório + fotos', 'Revisão gratuita']
  }
];

export default function PaymentScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check if returning from Stripe
    if (params.session_id) {
      checkPaymentStatus(params.session_id as string);
    }
  }, [params.session_id]);

  const checkPaymentStatus = async (sessionId: string) => {
    try {
      setPaymentStatus('processing');
      
      // Poll payment status with retries
      let attempts = 0;
      const maxAttempts = 5;
      
      const pollStatus = async (): Promise<void> => {
        try {
          const response = await apiService.getPaymentStatus(sessionId);
          
          if (response.payment_status === 'paid') {
            setPaymentStatus('success');
            Alert.alert(
              'Pagamento aprovado!',
              'Seu pagamento foi processado com sucesso.',
              [{ text: 'OK', onPress: () => router.push('/(main)/services') }]
            );
            return;
          } else if (response.status === 'expired') {
            setPaymentStatus('error');
            Alert.alert('Sessão expirada', 'A sessão de pagamento expirou. Tente novamente.');
            return;
          }
          
          // Continue polling if payment is still pending
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(pollStatus, 2000);
          } else {
            setPaymentStatus('error');
            Alert.alert('Timeout', 'Não foi possível verificar o status do pagamento.');
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          setPaymentStatus('error');
        }
      };
      
      await pollStatus();
    } catch (error) {
      console.error('Error in payment status check:', error);
      setPaymentStatus('error');
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      Alert.alert('Erro', 'Selecione um pacote de pagamento');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Get current origin URL
      const originUrl = 'https://providerapp-1.preview.emergentagent.com'; // You can make this dynamic if needed

      const response = await apiService.createPaymentSession({
        package_id: selectedPackage,
        origin_url: originUrl,
        metadata: {
          user_id: user?.id || '',
          service_type: 'marketplace_payment'
        }
      });

      // Open Stripe checkout URL
      if (response.url) {
        const supported = await Linking.canOpenURL(response.url);
        if (supported) {
          await Linking.openURL(response.url);
        } else {
          Alert.alert('Erro', 'Não foi possível abrir a página de pagamento');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Erro', 'Não foi possível processar o pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
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
      padding: theme.spacing.md,
    },
    packageCard: {
      marginBottom: theme.spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedPackage: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    packageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    packageName: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
    },
    packagePrice: {
      ...theme.typography.titleLarge,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    packageDescription: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.md,
    },
    featuresList: {
      gap: theme.spacing.xs,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    featureText: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    paymentButton: {
      marginTop: theme.spacing.lg,
    },
    statusContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    statusText: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });

  if (paymentStatus === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.statusContainer}>
          <LoadingSpinner message="Verificando pagamento..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Voltar"
          onPress={() => router.back()}
          variant="text"
          style={styles.backButton}
        />
        <Text style={styles.title}>Pagamento</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { marginBottom: theme.spacing.lg }]}>
          Escolha seu pacote de serviço
        </Text>

        {PAYMENT_PACKAGES.map((pkg) => (
          <Card
            key={pkg.id}
            style={[
              styles.packageCard,
              selectedPackage === pkg.id && styles.selectedPackage
            ]}
            onPress={() => setSelectedPackage(pkg.id)}
          >
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <Text style={styles.packagePrice}>
                R$ {pkg.amount.toFixed(2)}
              </Text>
            </View>
            
            <Text style={styles.packageDescription}>
              {pkg.description}
            </Text>
            
            <View style={styles.featuresList}>
              {pkg.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={{ color: theme.colors.success }}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}

        <Button
          title={isProcessing ? "Processando..." : "Pagar Agora"}
          onPress={handlePayment}
          loading={isProcessing}
          disabled={!selectedPackage || isProcessing}
          fullWidth
          style={styles.paymentButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}