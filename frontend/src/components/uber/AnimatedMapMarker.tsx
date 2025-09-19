import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface AnimatedMapMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  subtitle?: string;
  type: 'user' | 'provider' | 'service_location';
  isMoving?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  style?: any;
}

export const AnimatedMapMarker: React.FC<AnimatedMapMarkerProps> = ({
  coordinate,
  title,
  subtitle,
  type,
  isMoving = false,
  isSelected = false,
  onPress,
  style,
}) => {
  const themeContext = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

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
    titleSmall: { fontSize: 14, fontWeight: '600' },
    bodySmall: { fontSize: 12 },
  };

  useEffect(() => {
    // Bounce animation on mount
    Animated.spring(bounceAnim, {
      toValue: 1,
      tension: 300,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Continuous pulse for user location
    if (type === 'user') {
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => startPulse());
      };
      startPulse();
    }

    // Rotation animation for moving providers
    if (isMoving && type === 'provider') {
      const startRotation = () => {
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }).start(() => {
          rotateAnim.setValue(0);
          startRotation();
        });
      };
      startRotation();
    }
  }, [type, isMoving]);

  useEffect(() => {
    // Scale animation when selected
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.2 : 1,
      tension: 300,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const getMarkerIcon = () => {
    switch (type) {
      case 'user':
        return 'radio-button-on';
      case 'provider':
        return isMoving ? 'car' : 'person';
      case 'service_location':
        return 'location';
      default:
        return 'location';
    }
  };

  const getMarkerColor = () => {
    switch (type) {
      case 'user':
        return '#2196F3';
      case 'provider':
        return isMoving ? '#FF9800' : colors.primary;
      case 'service_location':
        return '#4CAF50';
      default:
        return colors.primary;
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    markerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    pulse: {
      position: 'absolute',
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getMarkerColor() + '30',
    },
    marker: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      borderWidth: 2,
      borderColor: getMarkerColor(),
    },
    selectedMarker: {
      borderWidth: 3,
      borderColor: getMarkerColor(),
    },
    callout: {
      backgroundColor: colors.surface,
      padding: 8,
      borderRadius: 8,
      marginTop: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
      maxWidth: 150,
    },
    calloutTitle: {
      ...typography.titleSmall,
      color: colors.onSurface,
      textAlign: 'center',
    },
    calloutSubtitle: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 2,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: bounceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })},
          ],
        },
        style,
      ]}
    >
      <View style={styles.markerContainer}>
        {/* Pulse effect for user location */}
        {type === 'user' && (
          <Animated.View
            style={[
              styles.pulse,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.3],
                  outputRange: [0.7, 0],
                }),
              },
            ]}
          />
        )}

        {/* Main marker */}
        <Animated.View
          style={[
            styles.marker,
            isSelected && styles.selectedMarker,
            isMoving && type === 'provider' && {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Ionicons
            name={getMarkerIcon() as any}
            size={16}
            color={getMarkerColor()}
          />
        </Animated.View>

        {/* Callout bubble */}
        {(isSelected || type === 'service_location') && (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.calloutSubtitle}>{subtitle}</Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};