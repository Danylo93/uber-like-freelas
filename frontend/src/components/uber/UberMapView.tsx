import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';

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

const { width, height } = Dimensions.get('window');

export const UberMapView: React.FC<UberMapViewProps> = ({
  userLocation,
  serviceProviders,
  selectedProviderId,
  onProviderSelect,
  style,
}) => {
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);
  
  const [region, setRegion] = useState<Region>({
    latitude: userLocation?.coords.latitude || -23.5505,
    longitude: userLocation?.coords.longitude || -46.6333,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  useEffect(() => {
    if (userLocation) {
      const newRegion = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  }, [userLocation]);

  const mapStyle = [
    {
      elementType: 'geometry',
      stylers: [{ color: theme.isDark ? '#242f3e' : '#f5f5f5' }],
    },
    {
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: theme.isDark ? '#e1e2e1' : '#616161' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: theme.isDark ? '#38414e' : '#ffffff' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: theme.isDark ? '#17263c' : '#c9c9c9' }],
    },
  ];

  const styles = StyleSheet.create({
    map: {
      flex: 1,
    },
    webPlaceholder: {
      flex: 1,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    webText: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.webPlaceholder, style]}>
        <Text style={styles.webText}>
          🗺️{'\n\n'}
          Google Maps{'\n'}
          (Disponível no mobile)
          {userLocation && (
            `\n\nLat: ${userLocation.coords.latitude.toFixed(4)}\nLng: ${userLocation.coords.longitude.toFixed(4)}`
          )}
        </Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={PROVIDER_GOOGLE}
      region={region}
      showsUserLocation={true}
      showsMyLocationButton={false}
      customMapStyle={mapStyle}
      mapType="standard"
      toolbarEnabled={false}
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: theme.colors.primary,
            borderWidth: 3,
            borderColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5,
          }} />
        </Marker>
      )}
      
      {/* Service provider markers */}
      {serviceProviders.map((provider) => (
        <Marker
          key={provider.id}
          coordinate={provider.coordinate}
          onPress={() => onProviderSelect(provider.id)}
        >
          <View style={{
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: selectedProviderId === provider.id ? theme.colors.primary : 'white',
              borderRadius: 20,
              padding: 8,
              borderWidth: 2,
              borderColor: selectedProviderId === provider.id ? 'white' : theme.colors.outline,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 3,
              elevation: 5,
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: selectedProviderId === provider.id ? 'white' : theme.colors.onSurface,
              }}>
                R${provider.price}
              </Text>
            </View>
            <View style={{
              width: 0,
              height: 0,
              borderLeftWidth: 5,
              borderRightWidth: 5,
              borderTopWidth: 5,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: selectedProviderId === provider.id ? theme.colors.primary : 'white',
            }} />
          </View>
        </Marker>
      ))}
    </MapView>
  );
};