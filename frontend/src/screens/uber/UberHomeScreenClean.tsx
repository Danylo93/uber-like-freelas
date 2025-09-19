import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { InteractiveMapView } from '../../components/maps/InteractiveMapView';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { PrimaryButton as Button } from '../../components/ui/PrimaryButton';
import { TextInput } from '../../components/ui/TextInput';
import { Chip } from '../../components/ui/CategoryChips';

const { height } = StyleSheet.create({}).height || 800;

export default function UberHomeScreen() {
  const themeContext = useTheme();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  
  // Core states
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentState, setCurrentState] = useState<'idle' | 'searching' | 'provider_found' | 'in_progress' | 'completed'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Service form states
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('limpeza');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');

  const theme = themeContext?.theme || {
    colors: {
      background: '#F6F6F6',
      surface: '#FFFFFF',
      primary: '#6750A4',
      onSurface: '#1C1B1F',
      onSurfaceVariant: '#49454F',
      outline: '#79747E',
    },
    spacing: { sm: 8, md: 16, lg: 24 },
    typography: {
      displayMedium: { fontSize: 20, fontWeight: 'bold' },
      titleMedium: { fontSize: 16, fontWeight: '600' },
      bodyLarge: { fontSize: 16 },
      bodyMedium: { fontSize: 14 },
    },
  };

  const serviceCategories = [
    { id: 'limpeza', label: 'Limpeza', icon: '🧹' },
    { id: 'jardinagem', label: 'Jardinagem', icon: '🌱' },
    { id: 'pintura', label: 'Pintura', icon: '🎨' },
    { id: 'eletrica', label: 'Elétrica', icon: '⚡' },
    { id: 'encanamento', label: 'Encanamento', icon: '🔧' },
  ];

  // Initialize location
  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização negada');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      // Fallback to São Paulo center
      setUserLocation({ latitude: -23.5505, longitude: -46.6333 });
    }
  };

  const handleRequestService = async () => {
    if (!serviceTitle.trim()) {
      Alert.alert('Erro', 'Por favor, adicione um título para o serviço');
      return;
    }

    setIsLoading(true);
    setCurrentState('searching');
    setShowServiceForm(false);

    try {
      console.log('🚀 Requesting service:', {
        category: selectedCategory,
        title: serviceTitle,
        description: serviceDescription,
        address: serviceAddress,
        location: userLocation,
      });

      // Simulate search
      setTimeout(() => {
        setCurrentState('provider_found');
        setIsLoading(false);
      }, 3000);
      
    } catch (error) {
      console.error('Service request error:', error);
      setError('Erro ao solicitar serviço');
      setIsLoading(false);
      setCurrentState('idle');
    }
  };

  const getBottomSheetContent = () => {
    const isClient = user?.role === 'client';

    if (!isClient) {
      return (
        <View style={styles.providerContent}>
          <Text style={styles.title}>Modo Prestador</Text>
          <Text style={styles.subtitle}>
            {currentState === 'idle' ? 'Você está Offline' : 'Pronto para receber solicitações'}
          </Text>
          <Button
            title={currentState === 'idle' ? 'Ficar Online' : 'Ficar Offline'}
            onPress={() => setCurrentState(currentState === 'idle' ? 'provider_found' : 'idle')}
            style={styles.primaryButton}
          />
        </View>
      );
    }

    switch (currentState) {
      case 'searching':
        return (
          <View style={styles.searchingContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.title}>Procurando prestadores...</Text>
            <Text style={styles.subtitle}>
              Aguarde enquanto encontramos o melhor prestador para você
            </Text>
            <Button
              title="Cancelar"
              onPress={() => {
                setCurrentState('idle');
                setIsLoading(false);
              }}
              variant="outlined"
              style={styles.button}
            />
          </View>
        );

      case 'provider_found':
        return (
          <View style={styles.providerCard}>
            <Text style={styles.title}>Prestador Encontrado!</Text>
            <Text style={styles.subtitle}>
              João Silva está disponível para o seu serviço
            </Text>
            <View style={styles.buttonRow}>
              <Button
                title="Recusar"
                onPress={() => setCurrentState('idle')}
                variant="outlined"
                style={styles.button}
              />
              <Button
                title="Aceitar"
                onPress={() => setCurrentState('in_progress')}
                style={styles.button}
              />
            </View>
          </View>
        );

      case 'in_progress':
        return (
          <View style={styles.progressContent}>
            <Text style={styles.title}>Serviço em Andamento</Text>
            <Text style={styles.subtitle}>
              João Silva está a caminho
            </Text>
            <Button
              title="Cancelar Serviço"
              onPress={() => setCurrentState('idle')}
              variant="outlined"
              style={styles.button}
            />
          </View>
        );

      default: // 'idle'
        return (
          <View style={styles.idleContent}>
            <Text style={styles.title}>Que serviço você precisa?</Text>
            <Text style={styles.subtitle}>
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
                
                {/* Status info */}
                <View style={styles.statsContainer}>
                  <Text style={styles.statsText}>
                    🟢 WebSocket: {isConnected ? 'Conectado' : 'Desconectado'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    mapContainer: {
      flex: 1,
    },
    idleContent: {
      padding: theme.spacing.md,
    },
    title: {
      ...theme.typography.displayMedium,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    quickActions: {
      alignItems: 'center',
    },
    primaryButton: {
      marginTop: theme.spacing.md,
    },
    form: {
      maxHeight: 400,
    },
    formTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
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
      marginBottom: theme.spacing.sm,
    },
    input: {
      marginBottom: theme.spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    button: {
      flex: 1,
    },
    searchingContent: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    providerCard: {
      padding: theme.spacing.md,
    },
    progressContent: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    providerContent: {
      padding: theme.spacing.md,
      alignItems: 'center',
    },
    statsContainer: {
      marginTop: theme.spacing.md,
      alignItems: 'center',
    },
    statsText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer}>
        <InteractiveMapView
          userLocation={userLocation}
          markers={[
            ...(userLocation ? [{
              id: 'user',
              coordinate: userLocation,
              title: 'Você está aqui',
              type: 'user' as const,
            }] : []),
          ]}
          onMarkerPress={(markerId) => console.log('Marker pressed:', markerId)}
          showUserLocation={true}
          animated={true}
        />
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        isVisible={true}
        onClose={() => {}}
        snapPoints={[200, 400, height * 0.7]}
        style={{ backgroundColor: theme.colors.surface }}
      >
        {getBottomSheetContent()}
      </BottomSheet>
    </SafeAreaView>
  );
}