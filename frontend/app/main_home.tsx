import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    map: {
      flex: 1,
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.large,
      borderTopRightRadius: theme.borderRadius.large,
      padding: theme.spacing.md,
      minHeight: 200,
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
                // TODO: Navigate to service request
                console.log('Selected category:', category);
              }}
            />
          ))}
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
        />
      </View>
      
      <View style={{ gap: theme.spacing.md }}>
        <Button
          title={user?.isOnline ? 'Ficar Offline' : 'Ficar Online'}
          onPress={() => {
            // TODO: Toggle online status
          }}
          variant={user?.isOnline ? 'outlined' : 'primary'}
        />
        
        <Text style={styles.categoriesTitle}>
          Ganhos de hoje: R$ 0,00
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChange={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Sua localização"
          />
        )}
      </MapView>

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