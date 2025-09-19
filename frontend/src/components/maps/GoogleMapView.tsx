import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';

interface GoogleMapViewProps {
  initialRegion?: Region;
  markers?: Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title?: string;
    description?: string;
  }>;
  onRegionChange?: (region: Region) => void;
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
  
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: -23.5505,
      longitude: -46.6333,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );
  
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
      
      if (followUserLocation) {
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        setRegion(newRegion);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    onRegionChange?.(newRegion);
  };

  const mapStyle = [
    {
      elementType: 'geometry',
      stylers: [
        {
          color: theme.isDark ? '#242f3e' : '#f5f5f5',
        },
      ],
    },
    {
      elementType: 'labels.icon',
      stylers: [
        {
          visibility: 'off',
        },
      ],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: theme.isDark ? '#e1e2e1' : '#616161',
        },
      ],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [
        {
          color: theme.isDark ? '#242f3e' : '#f5f5f5',
        },
      ],
    },
    {
      featureType: 'administrative.land_parcel',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: theme.isDark ? '#e1e2e1' : '#bdbdbd',
        },
      ],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [
        {
          color: theme.isDark ? '#2f3948' : '#eeeeee',
        },
      ],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: theme.isDark ? '#e1e2e1' : '#757575',
        },
      ],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [
        {
          color: theme.isDark ? '#263c3f' : '#e5e5e5',
        },
      ],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: theme.isDark ? '#e1e2e1' : '#9e9e9e',
        },
      ],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [
        {
          color: theme.isDark ? '#38414e' : '#ffffff',
        },
      ],
    },
    {
      featureType: 'road.arterial',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: theme.isDark ? '#e1e2e1' : '#757575',
        },
      ],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [
        {
          color: theme.isDark ? '#746855' : '#dadada',
        },
      ],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: theme.isDark ? '#e1e2e1' : '#616161',
        },
      ],
    },
    {
      featureType: 'road.local',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: theme.isDark ? '#e1e2e1' : '#9e9e9e',
        },
      ],
    },
    {
      featureType: 'transit.line',
      elementType: 'geometry',
      stylers: [
        {
          color: theme.isDark ? '#2f3948' : '#e5e5e5',
        },
      ],
    },
    {
      featureType: 'transit.station',
      elementType: 'geometry',
      stylers: [
        {
          color: theme.isDark ? '#3a4762' : '#eeeeee',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [
        {
          color: theme.isDark ? '#17263c' : '#c9c9c9',
        },
      ],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [
        {
          color: theme.isDark ? '#e1e2e1' : '#9e9e9e',
        },
      ],
    },
  ];

  const styles = StyleSheet.create({
    map: {
      flex: 1,
    },
  });

  // For web compatibility, show placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.map, { 
        backgroundColor: theme.colors.surfaceContainer,
        alignItems: 'center',
        justifyContent: 'center',
      }, style]}>
        <Text style={{
          ...theme.typography.bodyLarge,
          color: theme.colors.onSurfaceVariant,
          textAlign: 'center',
        }}>
          🗺️{'\n\n'}
          Mapa Google Maps{'\n'}
          (Disponível no mobile)
        </Text>
      </View>
    );
  }

  return (
    <MapView
      style={[styles.map, style]}
      provider={PROVIDER_GOOGLE}
      region={region}
      onRegionChangeComplete={handleRegionChange}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={false}
      customMapStyle={mapStyle}
      mapType="standard"
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          }}
          title="Sua localização"
          pinColor={theme.colors.primary}
        />
      )}
      
      {/* Custom markers */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          onPress={() => onMarkerPress?.(marker.id)}
        />
      ))}
    </MapView>
  );
};