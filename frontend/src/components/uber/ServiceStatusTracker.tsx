import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ServiceStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  active: boolean;
  estimatedTime?: string;
}

interface ServiceStatusTrackerProps {
  currentStatus: 'searching' | 'matched' | 'on_way' | 'arrived' | 'in_progress' | 'completed';
  providerName?: string;
  estimatedArrival?: string;
  onCallProvider?: () => void;
  onChatProvider?: () => void;
  style?: any;
}

export const ServiceStatusTracker: React.FC<ServiceStatusTrackerProps> = ({
  currentStatus,
  providerName = 'Prestador',
  estimatedArrival,
  onCallProvider,
  onChatProvider,
  style,
}) => {
  const themeContext = useTheme();
  
  // Fallback colors and typography
  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    outline: '#79747E',
    error: '#BA1A1A',
  };
  
  const typography = themeContext?.theme?.typography || {
    headlineSmall: { fontSize: 24, fontWeight: '600' },
    titleSmall: { fontSize: 14, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };
  const [progress] = useState(new Animated.Value(0));

  const getSteps = (): ServiceStep[] => {
    const steps = [
      {
        id: 'searching',
        title: 'Procurando prestador',
        description: 'Buscando o melhor prestador para você',
        icon: 'search',
        completed: false,
        active: currentStatus === 'searching',
      },
      {
        id: 'matched',
        title: 'Prestador encontrado',
        description: `${providerName} aceitou sua solicitação`,
        icon: 'checkmark-circle',
        completed: ['matched', 'on_way', 'arrived', 'in_progress', 'completed'].includes(currentStatus),
        active: currentStatus === 'matched',
      },
      {
        id: 'on_way',
        title: 'A caminho',
        description: estimatedArrival ? `Chegada prevista: ${estimatedArrival}` : 'O prestador está indo até você',
        icon: 'car',
        completed: ['on_way', 'arrived', 'in_progress', 'completed'].includes(currentStatus),
        active: currentStatus === 'on_way',
        estimatedTime: estimatedArrival,
      },
      {
        id: 'arrived',
        title: 'Chegou ao local',
        description: `${providerName} chegou e está pronto para iniciar`,
        icon: 'location',
        completed: ['arrived', 'in_progress', 'completed'].includes(currentStatus),
        active: currentStatus === 'arrived',
      },
      {
        id: 'in_progress',
        title: 'Serviço em andamento',
        description: 'O serviço está sendo realizado',
        icon: 'construct',
        completed: ['in_progress', 'completed'].includes(currentStatus),
        active: currentStatus === 'in_progress',
      },
      {
        id: 'completed',
        title: 'Serviço concluído',
        description: 'Avalie sua experiência',
        icon: 'star',
        completed: currentStatus === 'completed',
        active: currentStatus === 'completed',
      },
    ];

    return steps;
  };

  useEffect(() => {
    const steps = getSteps();
    const completedSteps = steps.filter(step => step.completed).length;
    const progressValue = completedSteps / steps.length;
    
    Animated.timing(progress, {
      toValue: progressValue,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentStatus]);

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'searching':
        return colors.primary;
      case 'matched':
        return colors.secondary;
      case 'on_way':
        return '#4CAF50';
      case 'arrived':
        return '#FF9800';
      case 'in_progress':
        return '#2196F3';
      case 'completed':
        return '#9C27B0';
      default:
        return colors.primary;
    }
  };

  const renderStep = (step: ServiceStep, index: number) => {
    const isLast = index === getSteps().length - 1;
    
    return (
      <View key={step.id} style={styles.stepContainer}>
        <View style={styles.stepRow}>
          {/* Step Icon */}
          <View style={styles.stepIconContainer}>
            <View
              style={[
                styles.stepIcon,
                {
                  backgroundColor: step.completed 
                    ? getStatusColor() 
                    : step.active 
                      ? getStatusColor() + '20'
                      : colors.surfaceVariant,
                  borderColor: step.completed || step.active 
                    ? getStatusColor() 
                    : colors.outline,
                },
              ]}
            >
              <Ionicons
                name={step.icon as any}
                size={20}
                color={
                  step.completed 
                    ? colors.surface 
                    : step.active 
                      ? getStatusColor()
                      : colors.onSurfaceVariant
                }
              />
            </View>
            
            {/* Connecting Line */}
            {!isLast && (
              <View
                style={[
                  styles.connectingLine,
                  {
                    backgroundColor: step.completed 
                      ? getStatusColor() 
                      : colors.outline + '40',
                  },
                ]}
              />
            )}
          </View>

          {/* Step Content */}
          <View style={styles.stepContent}>
            <Text
              style={[
                styles.stepTitle,
                {
                  color: step.active 
                    ? getStatusColor() 
                    : step.completed 
                      ? colors.onSurface 
                      : colors.onSurfaceVariant,
                },
                typography.titleSmall,
              ]}
            >
              {step.title}
            </Text>
            <Text
              style={[
                styles.stepDescription,
                {
                  color: colors.onSurfaceVariant,
                },
                typography.bodyMedium,
              ]}
            >
              {step.description}
            </Text>
            
            {step.estimatedTime && step.active && (
              <Text
                style={[
                  styles.estimatedTime,
                  {
                    color: getStatusColor(),
                  },
                  typography.bodySmall,
                ]}
              >
                🕐 {step.estimatedTime}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      ...typography.headlineSmall,
      color: colors.onSurface,
      marginBottom: 8,
    },
    progressContainer: {
      height: 4,
      backgroundColor: colors.outline + '30',
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: getStatusColor(),
      borderRadius: 2,
    },
    stepsContainer: {
      marginTop: 20,
    },
    stepContainer: {
      marginBottom: 16,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepIconContainer: {
      alignItems: 'center',
      marginRight: 16,
    },
    stepIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    connectingLine: {
      width: 2,
      height: 30,
      marginTop: 4,
    },
    stepContent: {
      flex: 1,
      paddingTop: 8,
    },
    stepTitle: {
      fontWeight: '600',
      marginBottom: 4,
    },
    stepDescription: {
      marginBottom: 4,
    },
    estimatedTime: {
      fontWeight: '500',
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: 20,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    callButton: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    chatButton: {
      backgroundColor: colors.secondary + '10',
      borderColor: colors.secondary,
    },
    buttonText: {
      marginLeft: 8,
      fontWeight: '500',
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Status do Serviço</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {getSteps().map((step, index) => renderStep(step, index))}
      </View>

      {/* Action Buttons */}
      {['matched', 'on_way', 'arrived', 'in_progress'].includes(currentStatus) && (
        <View style={styles.actionButtons}>
          {onCallProvider && (
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={onCallProvider}
            >
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Ligar
              </Text>
            </TouchableOpacity>
          )}
          
          {onChatProvider && (
            <TouchableOpacity
              style={[styles.actionButton, styles.chatButton]}
              onPress={onChatProvider}
            >
              <Ionicons name="chatbubble" size={16} color={colors.secondary} />
              <Text style={[styles.buttonText, { color: colors.secondary }]}>
                Chat
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};