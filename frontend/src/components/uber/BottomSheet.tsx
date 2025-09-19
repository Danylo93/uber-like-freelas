import React, { useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  PanResponder,
  TouchableWithoutFeedback 
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints: number[]; // Array of snap points as percentages (0-1)
  initialSnap?: number;
  onSnapChange?: (snapIndex: number) => void;
  backgroundColor?: string;
}

const { height: screenHeight } = Dimensions.get('window');

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  snapPoints = [0.3, 0.6, 0.9],
  initialSnap = 0,
  onSnapChange,
  backgroundColor,
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(screenHeight * (1 - snapPoints[initialSnap]))).current;
  const currentSnapIndex = useRef(initialSnap);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = screenHeight * (1 - snapPoints[currentSnapIndex.current]) + gestureState.dy;
        const minY = screenHeight * (1 - snapPoints[snapPoints.length - 1]);
        const maxY = screenHeight * (1 - snapPoints[0]);
        
        if (newValue >= minY && newValue <= maxY) {
          translateY.setValue(newValue);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentY = screenHeight * (1 - snapPoints[currentSnapIndex.current]) + gestureState.dy;
        
        // Find the closest snap point
        let closestSnapIndex = 0;
        let minDistance = Math.abs(currentY - screenHeight * (1 - snapPoints[0]));
        
        snapPoints.forEach((snapPoint, index) => {
          const snapY = screenHeight * (1 - snapPoint);
          const distance = Math.abs(currentY - snapY);
          if (distance < minDistance) {
            minDistance = distance;
            closestSnapIndex = index;
          }
        });

        // Consider velocity for better UX
        if (Math.abs(gestureState.vy) > 0.5) {
          if (gestureState.vy < 0 && closestSnapIndex < snapPoints.length - 1) {
            closestSnapIndex += 1;
          } else if (gestureState.vy > 0 && closestSnapIndex > 0) {
            closestSnapIndex -= 1;
          }
        }

        snapToIndex(closestSnapIndex);
      },
    })
  ).current;

  const snapToIndex = (index: number) => {
    if (index < 0 || index >= snapPoints.length) return;
    
    currentSnapIndex.current = index;
    const targetY = screenHeight * (1 - snapPoints[index]);
    
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();

    onSnapChange?.(index);
  };

  useEffect(() => {
    snapToIndex(initialSnap);
  }, [initialSnap]);

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      zIndex: 999,
    },
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: screenHeight,
      backgroundColor: backgroundColor || theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.large,
      borderTopRightRadius: theme.borderRadius.large,
      zIndex: 1000,
      ...theme.elevation.level3,
    },
    handle: {
      alignSelf: 'center',
      width: 32,
      height: 4,
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: 2,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
  });

  return (
    <>
      <TouchableWithoutFeedback onPress={() => snapToIndex(0)}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />
        <View style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </>
  );
};