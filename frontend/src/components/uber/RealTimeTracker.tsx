import React, { useState, useEffect, useRef } from 'react';
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
import { ServiceRequest } from '../../hooks/useRealTimeService';
import { ServiceStatusTransition } from './ServiceStatusTransition';

interface RealTimeTrackerProps {
  serviceRequest: ServiceRequest;
  providerLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedArrival?: string;
  onCallProvider?: () => void;
  onChatProvider?: () => void;
  onCancelService?: () => void;
  style?: any;
}

const { width } = Dimensions.get('window');

export const RealTimeTracker: React.FC<RealTimeTrackerProps> = ({
  serviceRequest,
  providerLocation,
  estimatedArrival,
  onCallProvider,
  onChatProvider,
  onCancelService,
  style,
}) => {
  const themeContext = useTheme();
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [progressAnimation] = useState(new Animated.Value(0));
  const [locationUpdate, setLocationUpdate] = useState(0);

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
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  // Animation for location updates
  useEffect(() => {
    if (providerLocation) {
      setLocationUpdate(prev => prev + 1);
      
      // Pulse animation when location updates
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [providerLocation]);

  // Progress animation based on service status
  useEffect(() => {
    const getProgress = () => {
      switch (serviceRequest.status) {
        case 'accepted': return 0.2;
        case 'on_way': return 0.4;
        case 'arrived': return 0.6;
        case 'in_progress': return 0.8;
        case 'completed': return 1.0;
        default: return 0;
      }
    };

    Animated.timing(progressAnimation, {
      toValue: getProgress(),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [serviceRequest.status]);

  const getStatusInfo = () => {
    switch (serviceRequest.status) {
      case 'accepted':
        return {
          icon: 'checkmark-circle',
          title: 'Prestador Confirmado',
          subtitle: 'O prestador aceitou sua solicitação',
          color: '#4CAF50',
          showETA: false,
        };
      case 'on_way':
        return {
          icon: 'car',
          title: 'A Caminho',
          subtitle: estimatedArrival ? `Chegada prevista: ${estimatedArrival}` : 'O prestador está indo até você',
          color: '#2196F3',
          showETA: true,
        };
      case 'arrived':
        return {
          icon: 'location',
          title: 'Chegou!',
          subtitle: 'O prestador está no local',
          color: '#FF9800',
          showETA: false,
        };
      case 'in_progress':
        return {
          icon: 'construct',
          title: 'Serviço em Andamento',
          subtitle: 'O serviço está sendo realizado',
          color: '#9C27B0',
          showETA: false,
        };
      case 'completed':
        return {
          icon: 'star',
          title: 'Serviço Concluído',
          subtitle: 'Avalie sua experiência',
          color: '#4CAF50',
          showETA: false,
        };
      default:
        return {
          icon: 'help-circle',
          title: 'Status Desconhecido',
          subtitle: 'Aguardando atualizações',
          color: colors.outline,
          showETA: false,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDistanceText = () => {
    if (!providerLocation) return null;
    
    const distance = calculateDistance(
      serviceRequest.location.latitude,
      serviceRequest.location.longitude,
      providerLocation.latitude,
      providerLocation.longitude
    );

    if (distance < 0.1) return 'Muito próximo';
    if (distance < 1) return `${Math.round(distance * 1000)}m de distância`;
    return `${distance.toFixed(1)}km de distância`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      margin: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.surfaceVariant,
    },
    progress: {
      height: '100%',
      backgroundColor: statusInfo.color,
    },
    content: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    statusTextContainer: {
      flex: 1,
    },
    statusTitle: {
      ...typography.titleMedium,
      color: colors.onSurface,
      marginBottom: 4,
    },
    statusSubtitle: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#4CAF50',
      marginRight: 6,
    },
    liveText: {
      ...typography.bodySmall,
      color: '#4CAF50',
      fontWeight: '600',
    },
    infoSection: {
      marginBottom: 20,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    infoIcon: {
      width: 24,
      marginRight: 12,
    },
    infoText: {
      ...typography.bodyMedium,
      color: colors.onSurface,
      flex: 1,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
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
    cancelButton: {
      backgroundColor: colors.error + '10',
      borderColor: colors.error,
    },
    buttonText: {
      ...typography.bodyMedium,
      marginLeft: 6,
      fontWeight: '500',
    },
    updateIndicator: {
      position: 'absolute',
      top: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    updateText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      marginLeft: 4,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progress,
            {
              width: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.statusIcon,
              {
                backgroundColor: statusInfo.color + '20',
                transform: [{ scale: pulseAnimation }],
              },
            ]}
          >
            <Ionicons
              name={statusInfo.icon as any}
              size={24}
              color={statusInfo.color}
            />
          </Animated.View>

          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            <Text style={styles.statusSubtitle}>{statusInfo.subtitle}</Text>
          </View>

          <View style={styles.liveIndicator}>
            <Animated.View
              style={[
                styles.liveDot,
                {
                  transform: [{ scale: pulseAnimation }],
                },
              ]}
            />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        </View>

        {/* Service Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons
              name="construct"
              size={16}
              color={colors.onSurfaceVariant}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{serviceRequest.service_type}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="location"
              size={16}
              color={colors.onSurfaceVariant}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              {serviceRequest.location.address || 'Endereço do serviço'}
            </Text>
          </View>

          {providerLocation && (
            <View style={styles.infoRow}>
              <Ionicons
                name="navigate"
                size={16}
                color={colors.primary}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                {getDistanceText()}
              </Text>
            </View>
          )}

          {statusInfo.showETA && estimatedArrival && (
            <View style={styles.infoRow}>
              <Ionicons
                name="time"
                size={16}
                color={colors.secondary}
                style={styles.infoIcon}
              />
              <Text style={[styles.infoText, { color: colors.secondary }]}>
                Chegada: {estimatedArrival}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {onCallProvider && serviceRequest.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={onCallProvider}
              activeOpacity={0.7}
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
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble" size={16} color={colors.secondary} />
              <Text style={[styles.buttonText, { color: colors.secondary }]}>
                Chat
              </Text>
            </TouchableOpacity>
          )}

          {onCancelService && serviceRequest.status !== 'completed' && serviceRequest.status !== 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onCancelService}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={16} color={colors.error} />
              <Text style={[styles.buttonText, { color: colors.error }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Location Update Indicator */}
        {providerLocation && (
          <View style={styles.updateIndicator}>
            <Ionicons
              name="radio-button-on"
              size={12}
              color="#4CAF50"
            />
            <Text style={styles.updateText}>
              Atualizado há {Math.floor(Math.random() * 30)}s
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};