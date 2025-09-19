import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useDirections, NavigationStep } from '../../hooks/useDirections';

interface TurnByTurnNavigationProps {
  isVisible: boolean;
  onClose: () => void;
  onRecalculate?: () => void;
  style?: any;
}

export const TurnByTurnNavigation: React.FC<TurnByTurnNavigationProps> = ({
  isVisible,
  onClose,
  onRecalculate,
  style,
}) => {
  const themeContext = useTheme();
  const {
    routeInfo,
    isNavigating,
    currentStepIndex,
    getCurrentStep,
    getNextStep,
    getProgressPercentage,
    getRemainingDistance,
    getRemainingTime,
    startNavigation,
    stopNavigation,
  } = useDirections();
  
  const [isCompact, setIsCompact] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    error: '#BA1A1A',
    outline: '#79747E',
  };

  const typography = themeContext?.theme?.typography || {
    headlineSmall: { fontSize: 24, fontWeight: '600' },
    titleLarge: { fontSize: 22, fontWeight: '600' },
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyLarge: { fontSize: 16 },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  useEffect(() => {
    // Animate entry/exit
    Animated.spring(slideAnim, {
      toValue: isVisible ? 1 : 0,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  useEffect(() => {
    // Update progress animation
    Animated.timing(progressAnim, {
      toValue: getProgressPercentage() / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStepIndex, routeInfo]);

  useEffect(() => {
    // Pulse animation for active navigation
    if (isNavigating) {
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isNavigating) startPulse();
        });
      };
      startPulse();
    }
  }, [isNavigating]);

  const currentStep = getCurrentStep();
  const nextStep = getNextStep();

  const getManeuverIcon = (maneuver?: string): string => {
    switch (maneuver) {
      case 'turn-right':
        return 'arrow-forward';
      case 'turn-left':
        return 'arrow-back';
      case 'turn-slight-right':
        return 'trending-up';
      case 'turn-slight-left':
        return 'trending-down';
      case 'straight':
        return 'arrow-up';
      case 'ramp-right':
        return 'arrow-forward';
      case 'ramp-left':
        return 'arrow-back';
      case 'arrive':
        return 'flag';
      case 'depart':
        return 'play';
      default:
        return 'arrow-up';
    }
  };

  const getManeuverColor = (maneuver?: string): string => {
    switch (maneuver) {
      case 'turn-right':
      case 'turn-slight-right':
      case 'ramp-right':
        return '#2196F3';
      case 'turn-left':
      case 'turn-slight-left':
      case 'ramp-left':
        return '#FF9800';
      case 'straight':
        return '#4CAF50';
      case 'arrive':
        return '#9C27B0';
      case 'depart':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const handleToggleCompact = () => {
    setIsCompact(!isCompact);
  };

  const handleNavigationToggle = () => {
    if (isNavigating) {
      stopNavigation();
    } else {
      startNavigation();
    }
  };

  if (!isVisible || !routeInfo) return null;

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 100,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.surfaceVariant,
    },
    progress: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 20, // Account for status bar
    },
    compactHeader: {
      padding: 12,
      paddingTop: 16,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    routeInfo: {
      flex: 1,
    },
    routeDistance: {
      ...typography.titleMedium,
      color: colors.onSurface,
    },
    routeTime: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      marginTop: 2,
    },
    toggleButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    currentStepContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 0,
    },
    maneuverIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    stepInfo: {
      flex: 1,
    },
    stepInstruction: {
      ...typography.bodyLarge,
      color: colors.onSurface,
      marginBottom: 4,
    },
    stepDistance: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
    },
    nextStepContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
      opacity: 0.7,
    },
    nextStepIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    nextStepText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      flex: 1,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline + '30',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    navigationButton: {
      backgroundColor: isNavigating ? colors.error + '10' : colors.primary + '10',
      borderColor: isNavigating ? colors.error : colors.primary,
    },
    recalculateButton: {
      backgroundColor: colors.secondary + '10',
      borderColor: colors.secondary,
    },
    actionButtonText: {
      ...typography.bodySmall,
      marginLeft: 4,
      fontWeight: '500',
    },
    compactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      paddingTop: 16,
    },
    compactManeuverIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    compactStepInfo: {
      flex: 1,
    },
    compactInstruction: {
      ...typography.bodyMedium,
      color: colors.onSurface,
    },
    compactDistance: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
    },
  });

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 0],
  });

  if (isCompact) {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
          },
          style,
        ]}
      >
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progress,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Compact View */}
        <View style={styles.compactContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color={colors.onSurfaceVariant} />
          </TouchableOpacity>

          {currentStep && (
            <>
              <Animated.View
                style={[
                  styles.compactManeuverIcon,
                  {
                    backgroundColor: getManeuverColor(currentStep.maneuver) + '20',
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Ionicons
                  name={getManeuverIcon(currentStep.maneuver) as any}
                  size={20}
                  color={getManeuverColor(currentStep.maneuver)}
                />
              </Animated.View>

              <View style={styles.compactStepInfo}>
                <Text style={styles.compactInstruction} numberOfLines={1}>
                  {currentStep.instruction}
                </Text>
                <Text style={styles.compactDistance}>
                  {currentStep.distance} • {getRemainingTime()}
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={handleToggleCompact}
            activeOpacity={0.7}
          >
            <Ionicons name="expand" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progress,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={16} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        <View style={styles.routeInfo}>
          <Text style={styles.routeDistance}>
            {getRemainingDistance()} restante
          </Text>
          <Text style={styles.routeTime}>
            {getRemainingTime()} • {getProgressPercentage()}% concluído
          </Text>
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={handleToggleCompact}
          activeOpacity={0.7}
        >
          <Ionicons name="contract" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Current Step */}
      {currentStep && (
        <View style={styles.currentStepContainer}>
          <Animated.View
            style={[
              styles.maneuverIcon,
              {
                backgroundColor: getManeuverColor(currentStep.maneuver) + '20',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons
              name={getManeuverIcon(currentStep.maneuver) as any}
              size={24}
              color={getManeuverColor(currentStep.maneuver)}
            />
          </Animated.View>

          <View style={styles.stepInfo}>
            <Text style={styles.stepInstruction}>
              {currentStep.instruction}
            </Text>
            <Text style={styles.stepDistance}>
              em {currentStep.distance}
            </Text>
          </View>
        </View>
      )}

      {/* Next Step Preview */}
      {nextStep && (
        <View style={styles.nextStepContainer}>
          <View style={styles.nextStepIcon}>
            <Ionicons
              name={getManeuverIcon(nextStep.maneuver) as any}
              size={16}
              color={colors.onSurfaceVariant}
            />
          </View>
          <Text style={styles.nextStepText} numberOfLines={1}>
            Em seguida: {nextStep.instruction}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.navigationButton]}
          onPress={handleNavigationToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isNavigating ? "stop" : "play"}
            size={16}
            color={isNavigating ? colors.error : colors.primary}
          />
          <Text
            style={[
              styles.actionButtonText,
              { color: isNavigating ? colors.error : colors.primary },
            ]}
          >
            {isNavigating ? 'Parar' : 'Iniciar'}
          </Text>
        </TouchableOpacity>

        {onRecalculate && (
          <TouchableOpacity
            style={[styles.actionButton, styles.recalculateButton]}
            onPress={onRecalculate}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={16} color={colors.secondary} />
            <Text
              style={[styles.actionButtonText, { color: colors.secondary }]}
            >
              Recalcular
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};