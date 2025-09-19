import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

const { width } = Dimensions.get('window');

interface StatusStep {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

interface StatusProgressBarProps {
  steps: StatusStep[];
  currentStep: number;
  animated?: boolean;
}

export const StatusProgressBar: React.FC<StatusProgressBarProps> = ({
  steps,
  currentStep,
  animated = true,
}) => {
  const themeContext = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stepAnimations = useRef(steps.map(() => new Animated.Value(0))).current;

  const colors = themeContext?.theme?.colors || {
    primary: '#6750A4',
    secondary: '#625B71',
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    success: '#4CAF50',
  };

  const typography = themeContext?.theme?.typography || {
    titleSmall: { fontSize: 14, fontWeight: '600' },
    bodySmall: { fontSize: 12 },
  };

  useEffect(() => {
    if (animated) {
      // Animate progress bar
      const progressWidth = (currentStep / (steps.length - 1)) * 100;
      Animated.timing(progressAnim, {
        toValue: progressWidth,
        duration: 800,
        useNativeDriver: false,
      }).start();

      // Animate step indicators
      steps.forEach((step, index) => {
        const stepAnim = stepAnimations[index];
        const targetValue = index <= currentStep ? 1 : 0;
        
        Animated.spring(stepAnim, {
          toValue: targetValue,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [currentStep, animated]);

  const getStepColor = (step: StatusStep, index: number) => {
    if (step.completed || index < currentStep) {
      return colors.success || '#4CAF50';
    } else if (step.active || index === currentStep) {
      return colors.primary;
    } else {
      return colors.outline;
    }
  };

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    progressContainer: {
      position: 'relative',
      height: 4,
      backgroundColor: colors.outline + '30',
      borderRadius: 2,
      marginBottom: 16,
    },
    progressBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    stepsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    stepItem: {
      alignItems: 'center',
      flex: 1,
    },
    stepIndicator: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      borderWidth: 2,
    },
    stepLabel: {
      ...typography.bodySmall,
      textAlign: 'center',
      maxWidth: 80,
    },
    connector: {
      position: 'absolute',
      top: 15,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: colors.outline + '30',
      zIndex: -1,
    },
  });

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {/* Connector line */}
        <View style={styles.connector} />
        
        {steps.map((step, index) => {
          const stepColor = getStepColor(step, index);
          const stepAnim = stepAnimations[index];
          
          return (
            <View key={step.id} style={styles.stepItem}>
              <Animated.View
                style={[
                  styles.stepIndicator,
                  {
                    backgroundColor: stepColor + '20',
                    borderColor: stepColor,
                    transform: [
                      {
                        scale: stepAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons
                  name={step.icon as any}
                  size={16}
                  color={stepColor}
                />
              </Animated.View>
              
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: index <= currentStep ? colors.onSurface : colors.onSurfaceVariant,
                    fontWeight: index === currentStep ? '600' : 'normal',
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Predefined service flow steps
export const getServiceFlowSteps = (state: string) => {
  const baseSteps = [
    {
      id: 'request',
      label: 'Solicitação',
      icon: 'create-outline',
      completed: false,
      active: false,
    },
    {
      id: 'matching',
      label: 'Busca',
      icon: 'search-outline',
      completed: false,
      active: false,
    },
    {
      id: 'assigned',
      label: 'Aceito',
      icon: 'checkmark-circle-outline',
      completed: false,
      active: false,
    },
    {
      id: 'in_progress',
      label: 'A Caminho',
      icon: 'car-outline',
      completed: false,
      active: false,
    },
    {
      id: 'started',
      label: 'Em Serviço',
      icon: 'construct-outline',
      completed: false,
      active: false,
    },
    {
      id: 'completed',
      label: 'Concluído',
      icon: 'checkmark-done-outline',
      completed: false,
      active: false,
    },
  ];

  // Update steps based on current state
  const stateMap = {
    'idle': -1,
    'searching': 0,
    'provider_found': 1,
    'confirmed': 2,
    'in_progress': 3,
    'started': 4,
    'completed': 5,
  };

  const currentStepIndex = stateMap[state as keyof typeof stateMap] ?? -1;

  return baseSteps.map((step, index) => ({
    ...step,
    completed: index < currentStepIndex,
    active: index === currentStepIndex,
  }));
};