import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMatching } from '../../contexts/MatchingContext';
import { InteractiveMapView } from '../../components/maps/InteractiveMapView';
import { UberSearchBar } from '../../components/uber/UberSearchBar';
import { BottomSheet } from '../../components/uber/BottomSheet';
import { ProviderCard } from '../../components/uber/ProviderCard';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Chip } from '../../components/ui/Chip';
import { Card } from '../../components/ui/Card';
import { SearchingAnimation } from '../../components/uber/SearchingAnimation';
import { ServiceRequestModal } from '../../components/uber/ServiceRequestModal';
import { RealTimeTracker } from '../../components/uber/RealTimeTracker';
import { EarningsDashboard } from '../../components/uber/EarningsDashboard';
import { ProviderStatusToggle } from '../../components/uber/ProviderStatusToggle';
import { useRealTimeService } from '../../hooks/useRealTimeService';

export default function UberHomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
    currentState,
    userLocation,
    availableProviders,
    selectedProvider,
    currentMatch,
    isLoading,
    error,
    requestService,
    selectProvider,
    confirmService,
    cancelService,
    completeService,
    resetState,
  } = useMatching();

  const {
    serviceRequests,
    isProviderOnline,
    toggleProviderStatus,
    acceptServiceRequest,
    rejectServiceRequest,
  } = useRealTimeService();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showSearchingAnimation, setShowSearchingAnimation] = useState(false);
  const [pendingServiceRequest, setPendingServiceRequest] = useState(null);
  const [showEarningsDashboard, setShowEarningsDashboard] = useState(false);

  const serviceCategories = [
    { id: 'limpeza', label: 'Limpeza', icon: '🧹' },
    { id: 'jardinagem', label: 'Jardinagem', icon: '🌱' },
    { id: 'pintura', label: 'Pintura', icon: '🎨' },
    { id: 'eletrica', label: 'Elétrica', icon: '⚡' },
    { id: 'encanamento', label: 'Encanamento', icon: '🔧' },
    { id: 'marcenaria', label: 'Marcenaria', icon: '🪚' },
  ];

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error);
    }
  }, [error]);

  const handleSearchPress = () => {
    setShowServiceForm(true);
  };

  const handleRequestService = async () => {
    if (!selectedCategory || !serviceTitle || !serviceAddress) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setShowSearchingAnimation(true);
      await requestService(selectedCategory, serviceTitle, serviceDescription, serviceAddress);
      setShowServiceForm(false);
      
      // Hide searching animation after some time if no providers found
      setTimeout(() => {
        setShowSearchingAnimation(false);
      }, 10000);
    } catch (error) {
      setShowSearchingAnimation(false);
      Alert.alert('Erro', 'Não foi possível solicitar o serviço. Tente novamente.');
    }
  };

  const handleProviderSelect = async (providerId: string) => {
    await selectProvider(providerId);
  };

  const handleServiceRequestResponse = async (serviceId: string, accept: boolean) => {
    if (accept) {
      await acceptServiceRequest(serviceId);
    } else {
      await rejectServiceRequest(serviceId);
    }
    setPendingServiceRequest(null);
  };

  // Listen for incoming service requests (providers only)
  useEffect(() => {
    if (user?.role === 'provider' && serviceRequests.length > 0 && !pendingServiceRequest) {
      const latestRequest = serviceRequests[serviceRequests.length - 1];
      setPendingServiceRequest(latestRequest);
    }
  }, [serviceRequests, user?.role]);

  // Hide searching animation when providers are found
  useEffect(() => {
    if (currentState === 'providers_found' && showSearchingAnimation) {
      setShowSearchingAnimation(false);
    }
  }, [currentState]);

  // Check if should show earnings dashboard
  const shouldShowEarningsDashboard = user?.role === 'provider' && showEarningsDashboard;

  const getBottomSheetContent = () => {
    // Show earnings dashboard for providers when requested
    if (shouldShowEarningsDashboard) {
      return <EarningsDashboard style={{ flex: 1 }} />;
    }

    // Provider-specific UI
    if (user?.role === 'provider') {
      return (
        <View style={styles.sheetContent}>
          <ProviderStatusToggle />
          
          {!isProviderOnline ? (
            <View style={styles.offlineMessage}>
              <Text style={styles.sheetTitle}>Você está Offline</Text>
              <Text style={styles.sheetSubtitle}>
                Ative seu status para começar a receber solicitações de serviços
              </Text>
            </View>
          ) : (
            <View style={styles.onlineMessage}>
              <Text style={styles.sheetTitle}>Pronto para receber solicitações!</Text>
              <Text style={styles.sheetSubtitle}>
                Você está online e disponível para receber serviços
              </Text>
              
              <Button
                title="Ver Ganhos"
                onPress={() => setShowEarningsDashboard(true)}
                variant="outlined"
                style={styles.earningsButton}
              />
            </View>
          )}
        </View>
      );
    }

    // Client-specific UI based on current state
    switch (currentState) {
      case 'idle':
        return (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Que serviço você precisa?</Text>
            <Text style={styles.sheetSubtitle}>
              Encontre prestadores de serviços próximos a você
            </Text>
            
            {showServiceForm ? (
              <ScrollView style={styles.form}>
                <Text style={styles.formTitle}>Nova Solicitação</Text>
                
                <Text style={styles.sectionTitle}>Categoria</Text>
                <View style={styles.categoryGrid}>
                  {serviceCategories.map((category) => (
                    <Chip
                      key={category.id}
                      label={`${category.icon} ${category.label}`}
                      selected={selectedCategory === category.id}
                      onPress={() => setSelectedCategory(category.id)}
                      style={styles.categoryChip}
                    />
                  ))}
                </View>

                <TextInput
                  label="Título do serviço"
                  placeholder="Ex: Limpeza de casa completa"
                  value={serviceTitle}
                  onChangeText={setServiceTitle}
                  style={styles.input}
                />

                <TextInput
                  label="Descrição (opcional)"
                  placeholder="Descreva detalhes do serviço"
                  value={serviceDescription}
                  onChangeText={setServiceDescription}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                <TextInput
                  label="Endereço"
                  placeholder="Digite o endereço"
                  value={serviceAddress}
                  onChangeText={setServiceAddress}
                  style={styles.input}
                />

                <View style={styles.buttonRow}>
                  <Button
                    title="Cancelar"
                    onPress={() => setShowServiceForm(false)}
                    variant="outlined"
                    style={styles.button}
                  />
                  <Button
                    title="Solicitar"
                    onPress={handleRequestService}
                    loading={isLoading}
                    style={styles.button}
                  />
                </View>
              </ScrollView>
            ) : (
              <View style={styles.quickActions}>
                <Button
                  title="Solicitar Serviço"
                  onPress={() => setShowServiceForm(true)}
                  fullWidth
                  style={styles.primaryButton}
                />
              </View>
            )}
          </View>
        );

      case 'searching':
        return (
          <View style={styles.sheetContent}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingTitle}>Procurando prestadores...</Text>
              <Text style={styles.loadingSubtitle}>
                Aguarde enquanto encontramos os melhores profissionais
              </Text>
            </View>
            
            <Button
              title="Cancelar"
              onPress={cancelService}
              variant="outlined"
              style={styles.cancelButton}
            />
          </View>
        );

      case 'providers_found':
        return (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Prestadores Disponíveis</Text>
            <Text style={styles.sheetSubtitle}>
              {availableProviders.length} prestador(es) encontrado(s)
            </Text>
            
            <ScrollView style={styles.providersList}>
              {availableProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  {...provider}
                  selected={selectedProvider?.id === provider.id}
                  onSelect={handleProviderSelect}
                />
              ))}
            </ScrollView>

            <Button
              title="Cancelar"
              onPress={cancelService}
              variant="outlined"
              style={styles.cancelButton}
            />
          </View>
        );

      case 'provider_selected':
        return (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Confirmar Serviço</Text>
            
            {selectedProvider && (
              <Card style={styles.selectedProviderCard}>
                <Text style={styles.providerName}>{selectedProvider.name}</Text>
                <Text style={styles.providerDetails}>
                  ⭐ {selectedProvider.rating} • {selectedProvider.distance.toFixed(1)}km • {selectedProvider.estimatedTime}min
                </Text>
                <Text style={styles.price}>R$ {selectedProvider.price}</Text>
              </Card>
            )}

            <View style={styles.buttonRow}>
              <Button
                title="Voltar"
                onPress={() => setSelectedProvider(null)}
                variant="outlined"
                style={styles.button}
              />
              <Button
                title="Confirmar"
                onPress={confirmService}
                loading={isLoading}
                style={styles.button}
              />
            </View>
          </View>
        );

      case 'confirmed':
        return (
          <View style={styles.sheetContent}>
            {currentMatch && (
              <RealTimeTracker
                serviceRequest={currentMatch}
                onCallProvider={() => Alert.alert('Ligar', 'Funcionalidade em desenvolvimento')}
                onChatProvider={() => Alert.alert('Chat', 'Funcionalidade em desenvolvimento')}
                onCancelService={cancelService}
              />
            )}
          </View>
        );

      case 'in_progress':
        return (
          <View style={styles.sheetContent}>
            {currentMatch && (
              <RealTimeTracker
                serviceRequest={currentMatch}
                onCallProvider={() => Alert.alert('Ligar', 'Funcionalidade em desenvolvimento')}
                onChatProvider={() => Alert.alert('Chat', 'Funcionalidade em desenvolvimento')}
              />
            )}
          </View>
        );

      case 'completed':
        return (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Serviço Concluído! ✨</Text>
            <Text style={styles.sheetSubtitle}>
              Como foi sua experiência com {selectedProvider?.name}?
            </Text>
            
            <View style={styles.completedCard}>
              <Text style={styles.completedAmount}>R$ {currentMatch?.finalPrice}</Text>
              <Text style={styles.completedText}>Valor pago</Text>
            </View>

            <Button
              title="Avaliar Prestador"
              onPress={resetState}
              style={styles.primaryButton}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const getSnapPoints = () => {
    switch (currentState) {
      case 'idle':
        return showServiceForm ? [0.8] : [0.3];
      case 'searching':
        return [0.4];
      case 'providers_found':
        return [0.7, 0.9];
      case 'provider_selected':
        return [0.5];
      case 'confirmed':
      case 'in_progress':
        return [0.4];
      case 'completed':
        return [0.5];
      default:
        return [0.3];
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    sheetContent: {
      flex: 1,
      paddingBottom: theme.spacing.xl,
    },
    sheetTitle: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    sheetSubtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.lg,
    },
    quickActions: {
      marginTop: theme.spacing.md,
    },
    primaryButton: {
      marginTop: theme.spacing.md,
    },
    form: {
      flex: 1,
    },
    formTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    categoryChip: {
      minWidth: 100,
    },
    input: {
      marginBottom: theme.spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    button: {
      flex: 1,
    },
    loadingContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    loadingTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginTop: theme.spacing.md,
    },
    loadingSubtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },
    providersList: {
      flex: 1,
      marginBottom: theme.spacing.md,
    },
    selectedProviderCard: {
      marginBottom: theme.spacing.lg,
    },
    providerName: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    providerDetails: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.sm,
    },
    price: {
      ...theme.typography.titleLarge,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    statusCard: {
      backgroundColor: theme.colors.surfaceContainer,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.lg,
    },
    statusText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    completedCard: {
      alignItems: 'center',
      padding: theme.spacing.xl,
      backgroundColor: theme.colors.successContainer,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.lg,
    },
    completedAmount: {
      ...theme.typography.displayMedium,
      color: theme.colors.onSuccessContainer,
      fontWeight: '600',
    },
    completedText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSuccessContainer,
      marginTop: theme.spacing.xs,
    },
    cancelButton: {
      marginTop: theme.spacing.md,
    },
    // New styles for provider interface
    offlineMessage: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    onlineMessage: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    earningsButton: {
      marginTop: theme.spacing.md,
      minWidth: 120,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <InteractiveMapView
        userLocation={userLocation}
        markers={availableProviders.map(provider => ({
          id: provider.id,
          coordinate: provider.coordinate,
          title: provider.name,
          subtitle: `R$ ${provider.price} • ${provider.distance.toFixed(1)}km`,
          type: 'provider' as const,
          price: provider.price,
        }))}
        onMarkerPress={handleProviderSelect}
        showUserLocation={true}
      />

      {/* Show search bar only for clients */}
      {user?.role === 'client' && (
        <UberSearchBar
          onPress={handleSearchPress}
          placeholder="Que serviço você precisa?"
          address={serviceAddress}
        />
      )}

      {/* Show earnings dashboard button for providers when online */}
      {user?.role === 'provider' && isProviderOnline && !shouldShowEarningsDashboard && (
        <View style={{ position: 'absolute', top: 60, right: 16 }}>
          <Button
            title="Ganhos"
            onPress={() => setShowEarningsDashboard(true)}
            variant="outlined"
            style={{ backgroundColor: theme.colors.surface }}
          />
        </View>
      )}

      {/* Back button for earnings dashboard */}
      {shouldShowEarningsDashboard && (
        <View style={{ position: 'absolute', top: 60, left: 16, zIndex: 1000 }}>
          <Button
            title="← Voltar"
            onPress={() => setShowEarningsDashboard(false)}
            variant="outlined"
            style={{ backgroundColor: theme.colors.surface }}
          />
        </View>
      )}

      <BottomSheet
        snapPoints={getSnapPoints()}
        initialSnap={0}
      >
        {getBottomSheetContent()}
      </BottomSheet>

      {/* Searching Animation Overlay */}
      <SearchingAnimation
        isVisible={showSearchingAnimation}
        onCancel={() => {
          setShowSearchingAnimation(false);
          cancelService();
        }}
        searchText="Procurando prestadores..."
        subtitle="Encontraremos os melhores profissionais para você"
      />

      {/* Service Request Modal for Providers */}
      <ServiceRequestModal
        visible={!!pendingServiceRequest}
        serviceRequest={pendingServiceRequest}
        onAccept={() => handleServiceRequestResponse(pendingServiceRequest?.id || '', true)}
        onReject={() => handleServiceRequestResponse(pendingServiceRequest?.id || '', false)}
        onCancel={() => setPendingServiceRequest(null)}
        timeLeft={30}
      />
    </SafeAreaView>
  );
}