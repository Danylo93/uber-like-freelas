import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

const { width } = Dimensions.get('window');

export interface NotificationData {
  id: string;
  type: 'provider_found' | 'provider_assigned' | 'provider_nearby' | 'service_started' | 'service_completed' | 'eta_update';
  title: string;
  message: string;
  icon?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  autoHide?: boolean;
  duration?: number;
}

interface RealTimeNotificationsProps {
  notifications: NotificationData[];
  onNotificationDismiss: (id: string) => void;
  position?: 'top' | 'bottom';
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  notifications,
  onNotificationDismiss,
  position = 'top',
}) => {
  const themeContext = useTheme();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);
  const animatedValues = useRef<Map<string, Animated.Value>>(new Map());

  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    outline: '#79747E',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  };

  const typography = themeContext?.theme?.typography || {
    titleSmall: { fontSize: 14, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  useEffect(() => {
    notifications.forEach(notification => {
      if (!visibleNotifications.includes(notification.id)) {
        showNotification(notification);
      }
    });

    // Remove notifications that are no longer in the list
    visibleNotifications.forEach(id => {
      if (!notifications.find(n => n.id === id)) {
        hideNotification(id);
      }
    });
  }, [notifications]);

  const showNotification = (notification: NotificationData) => {
    if (!animatedValues.current.has(notification.id)) {
      animatedValues.current.set(notification.id, new Animated.Value(0));
    }

    const animValue = animatedValues.current.get(notification.id)!;

    setVisibleNotifications(prev => [...prev, notification.id]);

    // Slide in animation
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Auto hide if specified
      ...(notification.autoHide !== false ? [
        Animated.delay(notification.duration || 4000),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ] : []),
    ]).start((finished) => {
      if (finished && notification.autoHide !== false) {
        setVisibleNotifications(prev => prev.filter(id => id !== notification.id));
        onNotificationDismiss(notification.id);
      }
    });
  };

  const hideNotification = (id: string) => {
    const animValue = animatedValues.current.get(id);
    if (animValue) {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start((finished) => {
        if (finished) {
          setVisibleNotifications(prev => prev.filter(notId => notId !== id));
          animatedValues.current.delete(id);
        }
      });
    }
  };

  const handleDismiss = (id: string) => {
    hideNotification(id);
    onNotificationDismiss(id);
  };

  const getNotificationColor = (type: NotificationData['type']) => {
    switch (type) {
      case 'provider_found':
        return colors.info || '#2196F3';
      case 'provider_assigned':
        return colors.success || '#4CAF50';
      case 'provider_nearby':
        return colors.warning || '#FF9800';
      case 'service_started':
        return colors.primary;
      case 'service_completed':
        return colors.success || '#4CAF50';
      case 'eta_update':
        return colors.info || '#2196F3';
      default:
        return colors.primary;
    }
  };

  const getNotificationIcon = (type: NotificationData['type'], customIcon?: string) => {
    if (customIcon) return customIcon;
    
    switch (type) {
      case 'provider_found':
        return 'search';
      case 'provider_assigned':
        return 'checkmark-circle';
      case 'provider_nearby':
        return 'location';
      case 'service_started':
        return 'play-circle';
      case 'service_completed':
        return 'checkmark-done-circle';
      case 'eta_update':
        return 'time';
      default:
        return 'information-circle';
    }
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      ...(position === 'top' ? { top: 60 } : { bottom: 100 }),
      zIndex: 1000,
    },
    notification: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      borderLeftWidth: 4,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    content: {
      flex: 1,
    },
    title: {
      ...typography.titleSmall,
      color: colors.onSurface,
      marginBottom: 4,
    },
    message: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
    },
    actionButtonText: {
      ...typography.bodySmall,
      fontWeight: '600',
    },
    dismissButton: {
      padding: 4,
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      {visibleNotifications.map(id => {
        const notification = notifications.find(n => n.id === id);
        if (!notification) return null;

        const animValue = animatedValues.current.get(id);
        if (!animValue) return null;

        const notificationColor = getNotificationColor(notification.type);

        return (
          <Animated.View
            key={id}
            style={[
              styles.notification,
              { borderLeftColor: notificationColor },
              {
                opacity: animValue,
                transform: [
                  {
                    translateY: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: position === 'top' ? [-50, 0] : [50, 0],
                    }),
                  },
                  {
                    scale: animValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: notificationColor + '20' }
            ]}>
              <Ionicons
                name={getNotificationIcon(notification.type, notification.icon) as any}
                size={20}
                color={notificationColor}
              />
            </View>

            <View style={styles.content}>
              <Text style={styles.title}>{notification.title}</Text>
              <Text style={styles.message}>{notification.message}</Text>
              
              {notification.action && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: notificationColor + '20' }
                    ]}
                    onPress={notification.action.onPress}
                  >
                    <Text style={[
                      styles.actionButtonText,
                      { color: notificationColor }
                    ]}>
                      {notification.action.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => handleDismiss(id)}
            >
              <Ionicons
                name="close"
                size={20}
                color={colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

// Hook para gerenciar notificações
export const useRealTimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: NotificationData = {
      ...notification,
      id,
      autoHide: notification.autoHide !== false,
      duration: notification.duration || 4000,
    };

    setNotifications(prev => [...prev, newNotification]);

    return id;
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const showProviderFoundNotification = (providerName: string, eta: number) => {
    return showNotification({
      type: 'provider_found',
      title: 'Prestador Encontrado!',
      message: `${providerName} está disponível e chegará em ${eta} minutos`,
      action: {
        label: 'Ver Detalhes',
        onPress: () => console.log('Ver detalhes do prestador'),
      },
    });
  };

  const showProviderNearbyNotification = (providerName: string, distance: string) => {
    return showNotification({
      type: 'provider_nearby',
      title: 'Prestador Próximo',
      message: `${providerName} está ${distance} de distância`,
      duration: 3000,
    });
  };

  const showServiceStartedNotification = (providerName: string) => {
    return showNotification({
      type: 'service_started',
      title: 'Serviço Iniciado',
      message: `${providerName} começou o trabalho`,
      duration: 3000,
    });
  };

  const showETAUpdateNotification = (newETA: number) => {
    return showNotification({
      type: 'eta_update',
      title: 'Tempo Atualizado',
      message: `Nova previsão de chegada: ${newETA} minutos`,
      duration: 2000,
    });
  };

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications,
    showProviderFoundNotification,
    showProviderNearbyNotification,
    showServiceStartedNotification,
    showETAUpdateNotification,
  };
};