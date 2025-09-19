import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanGestureHandler,
  State,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface UberBottomSheetProps {
  children: React.ReactNode;
  snapPoints: number[];
  initialSnap?: number;
  onSnapChange?: (index: number) => void;
  style?: any;
}

const { height: screenHeight } = Dimensions.get('window');

export const UberBottomSheet: React.FC<UberBottomSheetProps> = ({
  children,
  snapPoints,
  initialSnap = 0,
  onSnapChange,
  style,
}) => {
  const themeContext = useTheme();
  
  // Fallback colors in case theme context is not available
  const colors = themeContext?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    outline: '#79747E',
  };
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const translateY = useRef(new Animated.Value(screenHeight - snapPoints[initialSnap])).current;
  const lastGestureY = useRef(0);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: screenHeight - snapPoints[currentSnap],
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [currentSnap, snapPoints]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationY, velocityY } = event.nativeEvent;
      const currentPosition = screenHeight - snapPoints[currentSnap] + translationY;
      
      let targetSnap = currentSnap;
      let minDistance = Infinity;

      // Find closest snap point
      snapPoints.forEach((point, index) => {
        const distance = Math.abs(screenHeight - point - currentPosition);
        if (distance < minDistance) {
          minDistance = distance;
          targetSnap = index;
        }
      });

      // Consider velocity for snapping
      if (Math.abs(velocityY) > 500) {
        if (velocityY > 0 && targetSnap > 0) {
          targetSnap = Math.max(0, targetSnap - 1);
        } else if (velocityY < 0 && targetSnap < snapPoints.length - 1) {
          targetSnap = Math.min(snapPoints.length - 1, targetSnap + 1);
        }
      }

      if (targetSnap !== currentSnap) {
        setCurrentSnap(targetSnap);
        onSnapChange?.(targetSnap);
      }

      Animated.spring(translateY, {
        toValue: screenHeight - snapPoints[targetSnap],
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const snapTo = (index: number) => {
    if (index >= 0 && index < snapPoints.length) {
      setCurrentSnap(index);
      onSnapChange?.(index);
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: screenHeight,
      backgroundColor: 'transparent',
      pointerEvents: 'box-none',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      flex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 16,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      backgroundColor: colors.outline,
      borderRadius: 2,
      marginTop: 12,
      marginBottom: 16,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline + '20',
    },
    quickAction: {
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
      minWidth: 80,
    },
    quickActionText: {
      marginTop: 8,
      fontSize: 12,
      fontWeight: '500',
      color: colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          {/* Quick Actions Row */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => snapTo(snapPoints.length - 1)}
            >
              <Ionicons name="car" size={20} color={colors.onSurfaceVariant} />
              <Text style={styles.quickActionText}>Serviços</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => snapTo(1)}
            >
              <Ionicons name="time" size={20} color={colors.onSurfaceVariant} />
              <Text style={styles.quickActionText}>Agendado</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => snapTo(0)}
            >
              <Ionicons name="location" size={20} color={colors.onSurfaceVariant} />
              <Text style={styles.quickActionText}>Destinos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

export default UberBottomSheet;