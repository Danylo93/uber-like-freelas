import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

interface ServiceStatus {
  key: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

interface ServiceStatusTransitionProps {
  currentStatus: string;
  onStatusChange?: (status: string) => void;
  animated?: boolean;
  showProgress?: boolean;
  style?: any;
}

const SERVICE_STATUSES: ServiceStatus[] = [
  {
    key: 'pending',
    label: 'Solicitação Enviada',
    icon: 'time',
    color: '#FF9800',
    description: 'Aguardando resposta dos prestadores',
  },
  {
    key: 'accepted',
    label: 'Aceito',
    icon: 'checkmark-circle',
    color: '#4CAF50',
    description: 'Prestador confirmou o serviço',
  },
  {
    key: 'on_way',
    label: 'A Caminho',
    icon: 'car',
    color: '#2196F3',
    description: 'Prestador está indo até você',
  },
  {
    key: 'arrived',
    label: 'Chegou',
    icon: 'location',
    color: '#9C27B0',
    description: 'Prestador chegou ao local',
  },
  {
    key: 'in_progress',
    label: 'Em Andamento',
    icon: 'construct',
    color: '#FF5722',
    description: 'Serviço sendo realizado',
  },
  {
    key: 'completed',
    label: 'Concluído',
    icon: 'star',
    color: '#4CAF50',
    description: 'Serviço finalizado com sucesso',
  },
];

export const ServiceStatusTransition: React.FC<ServiceStatusTransitionProps> = ({
  currentStatus,
  onStatusChange,
  animated = true,
  showProgress = true,
  style,
}) => {
  const themeContext = useTheme();
  const [displayStatus, setDisplayStatus] = useState(currentStatus);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    outline: '#79747E',
  };

  const typography = themeContext?.theme?.typography || {
    headlineSmall: { fontSize: 24, fontWeight: '600' },
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  const currentStatusData = SERVICE_STATUSES.find(s => s.key === displayStatus) || SERVICE_STATUSES[0];
  const currentIndex = SERVICE_STATUSES.findIndex(s => s.key === displayStatus);
  const progressPercentage = ((currentIndex + 1) / SERVICE_STATUSES.length) * 100;

  useEffect(() => {
    if (currentStatus !== displayStatus && animated) {
      // Animate out current status
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Update status
        setDisplayStatus(currentStatus);
        
        // Animate in new status
        Animated.parallel([
          Animated.spring(fadeAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (currentStatus !== displayStatus) {
      setDisplayStatus(currentStatus);
    }
  }, [currentStatus]);

  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progressPercentage / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [displayStatus, showProgress]);

  const renderProgressBar = () => {
    if (!showProgress) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: currentStatusData.color,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% concluído
        </Text>
      </View>
    );
  };

  const renderStatusSteps = () => {
    return (
      <View style={styles.stepsContainer}>
        {SERVICE_STATUSES.map((status, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = status.key === displayStatus;

          return (
            <View key={status.key} style={styles.stepContainer}>
              <View
                style={[
                  styles.stepIcon,
                  {
                    backgroundColor: isActive ? status.color : colors.outline + '40',
                    borderColor: isActive ? status.color : colors.outline,
                  },
                  isCurrent && styles.currentStepIcon,
                ]}
              >
                <Ionicons
                  name={status.icon as any}
                  size={16}
                  color={isActive ? colors.surface : colors.outline}
                />
              </View>
              
              {index < SERVICE_STATUSES.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    {
                      backgroundColor: isActive ? status.color : colors.outline + '40',
                    },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    statusContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    statusIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    statusLabel: {
      ...typography.headlineSmall,
      textAlign: 'center',
      marginBottom: 8,
    },
    statusDescription: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      opacity: 0.8,
    },
    progressContainer: {
      marginBottom: 20,
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.outline + '30',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBar: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      fontWeight: '600',
    },
    stepsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },
    stepContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    currentStepIcon: {
      transform: [{ scale: 1.2 }],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    stepConnector: {
      width: 20,
      height: 2,
      marginHorizontal: 4,
    },
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.statusContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.statusIcon,
            {
              backgroundColor: currentStatusData.color + '20',
              borderColor: currentStatusData.color,
              borderWidth: 3,
            },
          ]}
        >
          <Ionicons
            name={currentStatusData.icon as any}
            size={32}
            color={currentStatusData.color}
          />
        </View>

        <Text
          style={[
            styles.statusLabel,
            { color: currentStatusData.color },
          ]}
        >
          {currentStatusData.label}
        </Text>

        <Text style={styles.statusDescription}>
          {currentStatusData.description}
        </Text>
      </Animated.View>

      {renderProgressBar()}
      {renderStatusSteps()}
    </View>
  );
};