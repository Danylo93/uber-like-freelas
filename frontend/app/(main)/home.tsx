import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { GoogleMapView } from '../../src/components/maps/GoogleMapView';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.0922,  
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da sua localização para mostrar serviços próximos'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const serviceCategories = [
    'Limpeza',
    'Jardinagem',
    'Pintura',
    'Elétrica',  
    'Encanamento',
    'Marcenaria',
  ];

  // Sample service providers for map
  const serviceProviders = [
    {
      id: '1',
      coordinate: { latitude: -23.5505, longitude: -46.6333 },
      title: 'João - Limpeza',
      description: 'Especialista em limpeza residencial',
    },
    {
      id: '2', 
      coordinate: { latitude: -23.5515, longitude: -46.6343 },
      title: 'Maria - Jardinagem',
      description: 'Cuidado de jardins e plantas',
    },
    {
      id: '3',
      coordinate: { latitude: -23.5495, longitude: -46.6323 },
      title: 'Carlos - Elétrica',
      description: 'Instalações e reparos elétricos',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    mapContainer: {
      flex: 1,
    },
    bottomSheet: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.large,
      borderTopRightRadius: theme.borderRadius.large,
      padding: theme.spacing.md,
      minHeight: 220,
      ...theme.elevation.level2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    title: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
    },
    statusChip: {
      backgroundColor: user?.role === 'provider' && user?.isOnline 
        ? theme.colors.successContainer 
        : theme.colors.surfaceContainer,
    },
    categoriesContainer: {
      gap: theme.spacing.sm,
    },
    categoriesTitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    floatingButton: {
      position: 'absolute',
      top: 60,
      right: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.full,
      padding: theme.spacing.sm,
      ...theme.elevation.level2,
    },
  });

  const ClientBottomSheet = () => (
    <View style={styles.bottomSheet}>
      <View style={styles.header}>
        <Text style={styles.title}>O que você precisa?</Text>
      </View>
      
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>Categorias de serviços</Text>
        <View style={styles.categoriesGrid}>
          {serviceCategories.map((category) => (
            <Chip
              key={category}
              label={category}
              onPress={() => {
                router.push('/service-request');
              }}
            />
          ))}
        </View>
        
        <View style={styles.buttonRow}>
          <Button
        <View style={styles.buttonRow}>
          <Button
            title="Nova Solicitação"
            onPress={() => router.push('/service-request')}
            variant="primary"
            style={{ flex: 1 }}
          />
          <Button
            title="AI Assistant"
            onPress={() => router.push('/ai-recommendations')}
            variant="tonal"
            style={{ flex: 1 }}
          />
        </View>
        
        <View style={styles.buttonRow}>
          <Button
            title="Chat"
            onPress={() => router.push('/chat')}
            variant="outlined"
            style={{ flex: 1 }}
          />
          <Button
            title="Pagamento"
            onPress={() => router.push('/payment')}
            variant="outlined"
            style={{ flex: 1 }}
          />
        </View>
        </View>
      </View>
    </View>
  );

  const ProviderBottomSheet = () => (
    <View style={styles.bottomSheet}>
      <View style={styles.header}>
        <Text style={styles.title}>Painel do Prestador</Text>
        <Chip
          label={user?.isOnline ? 'Online' : 'Offline'}
          style={styles.statusChip}
          selected={user?.isOnline}
        />
      </View>
      
      <View style={{ gap: theme.spacing.md }}>
        <Button
          title={user?.isOnline ? 'Ficar Offline' : 'Ficar Online'}
          onPress={() => {
            Alert.alert('Status', `Você está agora ${user?.isOnline ? 'Offline' : 'Online'}`);
          }}
          variant={user?.isOnline ? 'outlined' : 'primary'}
        />
        
        <View style={styles.buttonRow}>
          <Text style={[styles.categoriesTitle, { flex: 1 }]}>
            Ganhos de hoje: R$ 0,00
          </Text>
          <Button
            title="Pagamento"
            onPress={() => router.push('/payment')}
            variant="tonal"
            size="small"
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <GoogleMapView
          initialRegion={region}
          markers={serviceProviders}
          onRegionChange={setRegion}
          onMarkerPress={(markerId) => {
            const provider = serviceProviders.find(p => p.id === markerId);
            if (provider) {
              Alert.alert(provider.title, provider.description);
            }
          }}
          showUserLocation={true}
          followUserLocation={false}
        />
      </View>

      <View style={styles.floatingButton}>
        <Button
          title=""
          onPress={requestLocationPermission}
          variant="text"
          icon="📍"
        />
      </View>

      {user?.role === 'client' ? <ClientBottomSheet /> : <ProviderBottomSheet />}
    </SafeAreaView>
  );
}