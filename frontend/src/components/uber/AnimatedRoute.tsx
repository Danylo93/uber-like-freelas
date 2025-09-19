import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface AnimatedRouteProps {
  route: RoutePoint[];
  isActive?: boolean;
  animated?: boolean;
  color?: string;
  width?: number;
  style?: any;
}

export const AnimatedRoute: React.FC<AnimatedRouteProps> = ({
  route,
  isActive = false,
  animated = true,
  color,
  width = 4,
  style,
}) => {
  const themeContext = useTheme();
  const [animatedSegments, setAnimatedSegments] = useState<Animated.Value[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const colors = themeContext?.theme?.colors || {
    primary: '#6750A4',
    secondary: '#625B71',
  };

  const routeColor = color || colors.primary;

  useEffect(() => {
    if (route.length > 1 && animated) {
      // Create animated values for each route segment
      const segments = route.slice(1).map(() => new Animated.Value(0));
      setAnimatedSegments(segments);

      // Animate each segment in sequence
      const animateSegments = () => {
        const animations = segments.map((segment, index) =>
          Animated.timing(segment, {
            toValue: 1,
            duration: 800,
            delay: index * 200, // Stagger the animations
            useNativeDriver: false,
          })
        );

        Animated.sequence(animations).start(() => {
          // Reset and restart animation
          segments.forEach(segment => segment.setValue(0));
          setTimeout(animateSegments, 2000);
        });
      };

      animateSegments();
    }
  }, [route, animated]);

  useEffect(() => {
    if (isActive) {
      // Pulse animation for active route
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isActive) startPulse();
        });
      };
      startPulse();
    }
  }, [isActive]);

  const renderRouteSegments = () => {
    if (route.length < 2) return null;

    return route.slice(1).map((point, index) => {
      const prevPoint = route[index];
      const animValue = animatedSegments[index] || new Animated.Value(1);

      // Calculate segment direction and length
      const deltaLat = point.latitude - prevPoint.latitude;
      const deltaLng = point.longitude - prevPoint.longitude;
      const distance = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
      const angle = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);

      return (
        <Animated.View
          key={`segment-${index}`}
          style={[
            styles.routeSegment,
            {
              backgroundColor: routeColor,
              height: width,
              width: animated ? animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, distance * 100000], // Scale for visual representation
              }) : distance * 100000,
              transform: [
                { rotate: `${angle}deg` },
                { scale: isActive ? pulseAnim : 1 },
              ],
              opacity: animated ? animValue.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.7, 1],
              }) : 1,
            },
          ]}
        />
      );
    });
  };

  const renderRouteDots = () => {
    return route.map((point, index) => (
      <View
        key={`dot-${index}`}
        style={[
          styles.routeDot,
          {
            backgroundColor: routeColor,
            borderColor: colors.primary,
          },
          index === 0 && styles.startDot,
          index === route.length - 1 && styles.endDot,
        ]}
      />
    ));
  };

  if (route.length < 2) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
    },
    routeSegment: {
      position: 'absolute',
      borderRadius: width / 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    routeDot: {
      position: 'absolute',
      width: width * 2,
      height: width * 2,
      borderRadius: width,
      borderWidth: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    startDot: {
      backgroundColor: '#4CAF50', // Green for start
      borderColor: '#388E3C',
    },
    endDot: {
      backgroundColor: '#F44336', // Red for end
      borderColor: '#D32F2F',
    },
  });

  return (
    <View style={[styles.container, style]}>
      {renderRouteSegments()}
      {renderRouteDots()}
    </View>
  );
};