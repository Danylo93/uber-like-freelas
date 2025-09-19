import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeProvider';

interface GoogleMapViewProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title?: string;
    description?: string;
  }>;
  onRegionChange?: (region: any) => void;
  onMarkerPress?: (markerId: string) => void;
  showUserLocation?: boolean;
  followUserLocation?: boolean;
  style?: any;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  initialRegion,
  markers = [],
  onRegionChange,
  onMarkerPress,
  showUserLocation = true,
  followUserLocation = false,
  style,
}) => {
  const { theme } = useTheme();
  
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    if (showUserLocation || followUserLocation) {
      getCurrentLocation();
    }
  }, [showUserLocation, followUserLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão de localização',
          'Precisamos da sua localização para mostrar no mapa'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

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
    markersInfo: {
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
        Google Maps View{'\n'}
        (Implementação futura com solução compatível)
      </Text>
      
      {userLocation && (
        <Text style={styles.locationInfo}>
          📍 Localização atual:{'\n'}
          Lat: {userLocation.coords.latitude.toFixed(4)}{'\n'}
          Lng: {userLocation.coords.longitude.toFixed(4)}
        </Text>
      )}
      
      {markers.length > 0 && (
        <Text style={styles.markersInfo}>
          📍 {markers.length} marcadores disponíveis
        </Text>
      )}
    </View>
  );
};