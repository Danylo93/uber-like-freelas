import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  subtitle?: string;
  type?: 'user' | 'provider' | 'destination';
  price?: number;
}

interface InteractiveMapViewProps {
  markers: MapMarker[];
  userLocation?: Location.LocationObject | null;
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
  style?: any;
  showUserLocation?: boolean;
}

const { width, height } = Dimensions.get('window');

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  markers = [],
  userLocation,
  onMarkerPress,
  onMapPress,
  style,
  showUserLocation = true,
}) => {
  const themeContext = useTheme();
  
  // Fallback colors in case theme context is not available
  const colors = themeContext?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    outline: '#79747E',
    error: '#BA1A1A',
  };
  
  const typography = themeContext?.typography || {
    bodyLarge: { fontSize: 16 },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
    titleSmall: { fontSize: 14, fontWeight: '600' },
  };
  const [mapCenter, setMapCenter] = useState({
    latitude: userLocation?.coords.latitude || -23.5505,
    longitude: userLocation?.coords.longitude || -46.6333,
  });
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (userLocation) {
      setMapCenter({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      });
    }
  }, [userLocation]);

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
      
      setMapCenter({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    }
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  const getMarkerPosition = (marker: MapMarker) => {
    // Convert lat/lng to screen coordinates (simplified)
    const latDiff = marker.coordinate.latitude - mapCenter.latitude;
    const lngDiff = marker.coordinate.longitude - mapCenter.longitude;
    
    const x = (width / 2) + (lngDiff * zoomLevel * 1000);
    const y = (height / 2) - (latDiff * zoomLevel * 1000);
    
    return { x, y };
  };

  const handleMapPress = (event: any) => {
    if (onMapPress) {
      // Convert screen coordinates back to lat/lng (simplified)
      const { locationX, locationY } = event.nativeEvent;
      const latDiff = (height / 2 - locationY) / (zoomLevel * 1000);
      const lngDiff = (locationX - width / 2) / (zoomLevel * 1000);
      
      onMapPress({
        latitude: mapCenter.latitude + latDiff,
        longitude: mapCenter.longitude + lngDiff,
      });
    }
  };

  const renderMarker = (marker: MapMarker) => {
    const position = getMarkerPosition(marker);
    
    // Only render if within screen bounds
    if (position.x < -50 || position.x > width + 50 || 
        position.y < -50 || position.y > height + 50) {
      return null;
    }

    let markerContent;
    
    switch (marker.type) {
      case 'user':
        markerContent = (
          <View style={[styles.userMarker, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={16} color="white" />
          </View>
        );
        break;
      case 'provider':
        markerContent = (
          <View style={[styles.providerMarker, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.markerText, { color: colors.onSecondary }]}>
              {marker.price ? `R$${marker.price}` : '🚗'}
            </Text>
          </View>
        );
        break;
      case 'destination':
        markerContent = (
          <View style={[styles.destinationMarker, { backgroundColor: colors.error }]}>
            <Ionicons name="location" size={16} color="white" />
          </View>
        );
        break;
      default:
        markerContent = (
          <View style={[styles.defaultMarker, { backgroundColor: colors.outline }]}>
            <Ionicons name="location-outline" size={16} color="white" />
          </View>
        );
    }

    return (
      <TouchableOpacity
        key={marker.id}
        style={[
          styles.markerContainer,
          {
            left: position.x - 20,
            top: position.y - 20,
          },
        ]}
        onPress={() => onMarkerPress?.(marker.id)}
        activeOpacity={0.7}
      >
        {markerContent}
        {marker.title && (
          <View style={[styles.markerTooltip, { backgroundColor: colors.surface }]}>
            <Text style={[styles.tooltipText, { color: colors.onSurface }]}>
              {marker.title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
    },
    mapArea: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      position: 'relative',
    },
    gridPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
    },
    mapInfo: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    infoText: {
      ...typography.bodyMedium,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
    },
    coordinatesText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
    controls: {
      position: 'absolute',
      right: 20,
      bottom: 100,
      gap: 12,
    },
    controlButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    locationButton: {
      position: 'absolute',
      right: 20,
      bottom: 40,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    markerContainer: {
      position: 'absolute',
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userMarker: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'white',
    },
    providerMarker: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'white',
    },
    destinationMarker: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'white',
    },
    defaultMarker: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'white',
    },
    markerText: {
      fontSize: 10,
      fontWeight: 'bold',
    },
    markerTooltip: {
      position: 'absolute',
      top: -35,
      left: -30,
      right: -30,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    tooltipText: {
      fontSize: 12,
      fontWeight: '500',
    },
    statusBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline,
    },
    statusText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.mapArea}
        onPress={handleMapPress}
        activeOpacity={1}
      >
        {/* Map background with grid pattern */}
        <View style={styles.gridPattern} />
        
        {/* Map info panel */}
        <View style={styles.mapInfo}>
          <Text style={styles.infoText}>
            🗺️ Mapa Interativo (Versão Alternativa)
          </Text>
          <Text style={styles.coordinatesText}>
            Lat: {mapCenter.latitude.toFixed(4)}, Lng: {mapCenter.longitude.toFixed(4)}
          </Text>
          <Text style={styles.coordinatesText}>
            Zoom: {zoomLevel.toFixed(1)}x
          </Text>
        </View>

        {/* Render markers */}
        {markers.map(renderMarker)}
        
        {/* Render user location marker */}
        {showUserLocation && userLocation && (
          <View
            style={[
              styles.markerContainer,
              {
                left: width / 2 - 20,
                top: height / 2 - 20,
              },
            ]}
          >
            <View style={[styles.userMarker, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={16} color="white" />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Map controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
          <Ionicons name="remove" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Get location button */}
      <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
        <Ionicons name="locate" size={24} color="white" />
      </TouchableOpacity>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {markers.length > 0 
            ? `${markers.length} marcadores • Toque para interagir`
            : 'Nenhum marcador • Mapa pronto para uso'
          }
        </Text>
      </View>
    </View>
  );
};