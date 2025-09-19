import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

// Haptic feedback utility
const hapticFeedback = {
  light: () => {
    if (Platform.OS === 'ios') {
      // iOS haptic feedback would go here
      // import { Haptics } from 'expo-haptics';
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(10);
    }
  },
  medium: () => {
    if (Platform.OS === 'ios') {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(20);
    }
  },
  heavy: () => {
    if (Platform.OS === 'ios') {
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Vibration.vibrate(30);
    }
  },
  success: () => {
    if (Platform.OS === 'ios') {
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Vibration.vibrate([0, 50, 50, 50]);
    }
  },
  error: () => {
    if (Platform.OS === 'ios') {
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Vibration.vibrate([0, 100, 100, 100]);
    }
  },
};

// Animated Heart Button with Pulse Effect
interface HeartButtonProps {
  isLiked: boolean;
  onPress: (liked: boolean) => void;
  size?: number;
  style?: any;
}

export const HeartButton: React.FC<HeartButtonProps> = ({
  isLiked,
  onPress,
  size = 24,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();

  const handlePress = () => {
    hapticFeedback.light();
    
    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse effect when liked
    if (!isLiked) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onPress(!isLiked);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style} activeOpacity={0.8}>
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
            opacity: isLiked ? pulseAnim.interpolate({
              inputRange: [1, 1.5],
              outputRange: [1, 0.5],
            }) : 1,
          }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={size}
            color={isLiked ? '#FF3B30' : theme.colors.onSurfaceVariant}
          />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Floating Action Button with Ripple Effect
interface FloatingActionButtonProps {
  icon: string;
  onPress: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: any;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onPress,
  size = 56,
  color,
  backgroundColor,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  const handlePress = () => {
    hapticFeedback.medium();

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Ripple effect
    Animated.timing(rippleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      rippleAnim.setValue(0);
    });

    onPress();
  };

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: backgroundColor || theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      overflow: 'hidden',
    },
    ripple: {
      position: 'absolute',
      width: size * 2,
      height: size * 2,
      borderRadius: size,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={style}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.ripple,
            {
              transform: [
                { scale: rippleAnim },
                {
                  translateX: rippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -size / 2],
                  }),
                },
                {
                  translateY: rippleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -size / 2],
                  }),
                },
              ],
              opacity: rippleAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
            },
          ]}
        />
        <Ionicons
          name={icon as any}
          size={size * 0.4}
          color={color || theme.colors.onPrimary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// Swipe Action Card
interface SwipeActionCardProps {
  children: React.ReactNode;
  leftAction?: {
    icon: string;
    color: string;
    onPress: () => void;
  };
  rightAction?: {
    icon: string;
    color: string;
    onPress: () => void;
  };
  threshold?: number;
  style?: any;
}

export const SwipeActionCard: React.FC<SwipeActionCardProps> = ({
  children,
  leftAction,
  rightAction,
  threshold = 100,
  style,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { theme } = useTheme();

  const handlePanGesture = (gestureState: any) => {
    if (gestureState.dx > threshold && leftAction) {
      hapticFeedback.medium();
      leftAction.onPress();
      resetPosition();
    } else if (gestureState.dx < -threshold && rightAction) {
      hapticFeedback.medium();
      rightAction.onPress();
      resetPosition();
    } else {
      resetPosition();
    }
  };

  const resetPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    actionContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    leftAction: {
      left: 0,
      backgroundColor: leftAction?.color || theme.colors.success,
    },
    rightAction: {
      right: 0,
      backgroundColor: rightAction?.color || theme.colors.error,
    },
    content: {
      backgroundColor: theme.colors.surface,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {leftAction && (
        <View style={[styles.actionContainer, styles.leftAction]}>
          <Ionicons
            name={leftAction.icon as any}
            size={24}
            color={theme.colors.onPrimary}
          />
        </View>
      )}
      
      {rightAction && (
        <View style={[styles.actionContainer, styles.rightAction]}>
          <Ionicons
            name={rightAction.icon as any}
            size={24}
            color={theme.colors.onPrimary}
          />
        </View>
      )}

      <Animated.View
        style={[
          styles.content,
          {
            transform: [
              { translateX },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

// Progress Ring Animation
interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color,
  backgroundColor,
  showPercentage = true,
  animated = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  const progressColor = color || theme.colors.primary;
  const bgColor = backgroundColor || theme.colors.outline + '30';

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(progress);
    }
  }, [progress, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    percentage: {
      position: 'absolute',
      fontSize: size * 0.2,
      fontWeight: '600',
      color: progressColor,
    },
  });

  return (
    <View style={styles.container}>
      {/* Background Circle */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: bgColor,
          position: 'absolute',
        }}
      />
      
      {/* Progress Circle */}
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: progressColor,
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
          transform: [
            {
              rotate: animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
      />

      {showPercentage && (
        <Animated.Text style={styles.percentage}>
          {animatedValue.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', `${progress}%`],
          }) as any}
        </Animated.Text>
      )}
    </View>
  );
};

// Pull to Refresh Indicator
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 100,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  const handleRefresh = async () => {
    setRefreshing(true);
    hapticFeedback.light();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      rotationAnim.setValue(0);
      
      Animated.spring(translateY, {
        toValue: 0,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    refreshIndicator: {
      position: 'absolute',
      top: -50,
      left: '50%',
      marginLeft: -20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  });

  return (
    <View style={styles.container}>
      {refreshing && (
        <View style={styles.refreshIndicator}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <Ionicons
              name="refresh"
              size={24}
              color={theme.colors.primary}
            />
          </Animated.View>
        </View>
      )}
      
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateY }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
};

// Toast Notification with Slide Animation
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  onDismiss,
  duration = 3000,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      hapticFeedback.light();
      
      Animated.spring(translateY, {
        toValue: 0,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismissToast = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const getToastColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning || '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  if (!visible) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 50,
      left: 16,
      right: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
      borderLeftWidth: 4,
      borderLeftColor: getToastColor(),
    },
    icon: {
      marginRight: 12,
    },
    message: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    closeButton: {
      padding: 4,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons
        name={getToastIcon() as any}
        size={20}
        color={getToastColor()}
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={dismissToast} style={styles.closeButton}>
        <Ionicons
          name="close"
          size={16}
          color={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export { hapticFeedback };