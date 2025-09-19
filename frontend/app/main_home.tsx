import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    mapPlaceholder: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      margin: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
    },
    mapText: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    bottomSheet: {
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
                Alert.alert('Serviço', `Você selecionou: ${category}`);
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
            Alert.alert('Status', `Você está agora ${user?.isOnline ? 'Offline' : 'Online'}`);
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
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>
          🗺️{'\n\n'}
          Mapa será exibido aqui{'\n'}
          (Funcionalidade em desenvolvimento)
          {location && (
            `\n\nLocalização atual:\nLat: ${location.coords.latitude.toFixed(4)}\nLng: ${location.coords.longitude.toFixed(4)}`
          )}
        </Text>
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