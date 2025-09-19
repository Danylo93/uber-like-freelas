import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AnimatedMapMarker } from '../uber/AnimatedMapMarker';
import { AnimatedRoute } from '../uber/AnimatedRoute';

interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  subtitle?: string;
  type: 'user' | 'provider' | 'service_location';
  price?: number;
}

interface InteractiveMapViewProps {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  markers?: MapMarker[];
  route?: Array<{ latitude: number; longitude: number }>;
  onMarkerPress?: (markerId: string) => void;
  showUserLocation?: boolean;
  animated?: boolean;
  style?: any;
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  userLocation,
  markers = [],
  route = [],
  onMarkerPress,
  showUserLocation = true,
  animated = true,
  style,
}) => {
  const themeContext = useTheme();
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState(userLocation || { latitude: -23.5505, longitude: -46.6333 });
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    outline: '#79747E',
  };

  const typography = themeContext?.theme?.typography || {
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  useEffect(() => {
    if (userLocation && userLocation !== mapCenter) {
      setMapCenter(userLocation);
    }
  }, [userLocation]);

  const handleMarkerPress = (markerId: string) => {
    setSelectedMarkerId(markerId);
    onMarkerPress?.(markerId);
    
    // Animate zoom to marker
    Animated.spring(zoomAnim, {
      toValue: 1.5,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel * 1.5, 3);
    setZoomLevel(newZoom);
    Animated.spring(zoomAnim, {
      toValue: newZoom,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel / 1.5, 0.5);
    setZoomLevel(newZoom);
    Animated.spring(zoomAnim, {
      toValue: newZoom,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleRecenterMap = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setZoomLevel(1);
      setSelectedMarkerId(null);
      
      Animated.parallel([
        Animated.spring(zoomAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(panAnim, {
          toValue: { x: 0, y: 0 },
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const renderMapOverlay = () => (
    <View style={styles.mapOverlay}>
      <Text style={styles.mapTitle}>Mapa Interativo</Text>
      <Text style={styles.mapSubtitle}>
        {userLocation 
          ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
          : 'Localização não disponível'
        }
      </Text>
    </View>
  );

  const renderMarkers = () => {
    let allMarkers = [...markers];

    // Add user location marker if enabled
    if (showUserLocation && userLocation) {
      allMarkers.unshift({
        id: 'user-location',
        coordinate: userLocation,
        title: 'Sua Localização',
        subtitle: 'Você está aqui',
        type: 'user' as const,
      });
    }

    return allMarkers.map((marker) => (
      <AnimatedMapMarker
        key={marker.id}
        coordinate={marker.coordinate}
        title={marker.title}
        subtitle={marker.subtitle}
        type={marker.type}
        isSelected={selectedMarkerId === marker.id}
        onPress={() => handleMarkerPress(marker.id)}
        style={styles.marker}
      />
    ));
  };

  const renderZoomControls = () => (
    <View style={styles.zoomControls}>
      <TouchableOpacity
        style={styles.zoomButton}
        onPress={handleZoomIn}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={24} color={colors.onSurface} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.zoomButton}
        onPress={handleZoomOut}
        activeOpacity={0.7}
      >
        <Ionicons name="remove" size={24} color={colors.onSurface} />
      </TouchableOpacity>
    </View>
  );

  const renderLocationButton = () => (
    <TouchableOpacity
      style={styles.locationButton}
      onPress={handleRecenterMap}
      activeOpacity={0.7}
    >
      <Ionicons name="locate" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  const renderMapStats = () => (
    <View style={styles.mapStats}>
      <View style={styles.statItem}>
        <Ionicons name="location" size={16} color={colors.primary} />
        <Text style={styles.statText}>{markers.length} Marcadores</Text>
      </View>
      
      <View style={styles.statItem}>
        <Ionicons name="expand" size={16} color={colors.secondary} />
        <Text style={styles.statText}>Zoom: {zoomLevel.toFixed(1)}x</Text>
      </View>
      
      {route.length > 0 && (
        <View style={styles.statItem}>
          <Ionicons name="trending-up" size={16} color={colors.secondary} />
          <Text style={styles.statText}>Rota: {route.length} pontos</Text>
        </View>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
      overflow: 'hidden',
      position: 'relative',
    },
    mapContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    mapOverlay: {
      position: 'absolute',
      top: 20,
      left: 20,
      right: 20,
      backgroundColor: colors.surface + 'F0',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    mapTitle: {
      ...typography.titleMedium,
      color: colors.onSurface,
      marginBottom: 4,
    },
    mapSubtitle: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      fontFamily: 'monospace',
    },
    marker: {
      position: 'absolute',
      zIndex: 10,
    },
    zoomControls: {
      position: 'absolute',
      right: 20,
      top: '50%',
      marginTop: -50,
    },
    zoomButton: {
      width: 48,
      height: 48,
      backgroundColor: colors.surface,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    locationButton: {
      position: 'absolute',
      right: 20,
      bottom: 80,
      width: 56,
      height: 56,
      backgroundColor: colors.surface,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    mapStats: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: colors.surface + 'F0',
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-around',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      marginLeft: 4,
      fontWeight: '500',
    },
    gridPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.1,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.mapContainer,
          {
            transform: [
              { scale: zoomAnim },
              { translateX: panAnim.x },
              { translateY: panAnim.y },
            ],
          },
        ]}
      >
        {/* Grid pattern background */}
        <View style={styles.gridPattern}>
          {Array.from({ length: 20 }, (_, i) => (
            <View
              key={`grid-h-${i}`}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: i * 40,
                height: 1,
                backgroundColor: colors.outline,
              }}
            />
          ))}
          {Array.from({ length: 15 }, (_, i) => (
            <View
              key={`grid-v-${i}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: i * 40,
                width: 1,
                backgroundColor: colors.outline,
              }}
            />
          ))}
        </View>

        {/* Animated route */}
        {route.length > 1 && (
          <AnimatedRoute
            route={route}
            isActive={true}
            animated={animated}
            color={colors.primary}
            width={4}
          />
        )}

        {/* Animated markers */}
        {renderMarkers()}
      </Animated.View>

      {renderMapOverlay()}
      {renderZoomControls()}
      {renderLocationButton()}
      {renderMapStats()}
    </View>
  );
};