import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeProvider';

interface ServiceProvider {
  id: string;
  name: string;
  rating: number;
  distance: number;
  estimatedTime: number;
  price: number;
  avatar: string;
  category: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

interface UberMapViewProps {
  userLocation: Location.LocationObject | null;
  serviceProviders: ServiceProvider[];
  selectedProviderId?: string;
  onProviderSelect: (providerId: string) => void;
  style?: any;
}

export const UberMapView: React.FC<UberMapViewProps> = ({
  userLocation,
  serviceProviders,
  selectedProviderId,
  onProviderSelect,
  style,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    placeholder: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    text: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 16,
    },
    locationInfo: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    providersInfo: {
      ...theme.typography.bodyMedium,
      color: theme.colors.primary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.text}>
        🗺️{'\n\n'}
        Uber-like Map View{'\n'}
        (Implementação futura com solução compatível)
      </Text>
      
      {userLocation && (
        <Text style={styles.locationInfo}>
          📍 Localização atual:{'\n'}
          Lat: {userLocation.coords.latitude.toFixed(4)}{'\n'}
          Lng: {userLocation.coords.longitude.toFixed(4)}
        </Text>
      )}
      
      {serviceProviders.length > 0 && (
        <Text style={styles.providersInfo}>
          👥 {serviceProviders.length} prestadores próximos
        </Text>
      )}
    </View>
  );
};