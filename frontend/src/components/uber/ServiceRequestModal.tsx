import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { ServiceRequest } from '../../hooks/useRealTimeService';

interface ServiceRequestModalProps {
  visible: boolean;
  serviceRequest: ServiceRequest | null;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  timeLeft?: number; // seconds
}

const { width, height } = Dimensions.get('window');

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  visible,
  serviceRequest,
  onAccept,
  onReject,
  onCancel,
  timeLeft = 30,
}) => {
  const themeContext = useTheme();
  const [countdown, setCountdown] = useState(timeLeft);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    if (visible && serviceRequest) {
      setCountdown(timeLeft);
      setIsProcessing(false);
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start pulse animation
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (visible && !isProcessing) startPulse();
        });
      };
      startPulse();

      // Start countdown and progress animation
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            onCancel(); // Auto-cancel when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: timeLeft * 1000,
        useNativeDriver: false,
      }).start();

      return () => {
        clearInterval(countdownInterval);
      };
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, serviceRequest]);

  const handleAccept = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onAccept();
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Erro', 'Não foi possível aceitar a solicitação. Tente novamente.');
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await onReject();
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Erro', 'Não foi possível recusar a solicitação. Tente novamente.');
    }
  };

  const getServiceIcon = (serviceType: string) => {
    const iconMap: { [key: string]: string } = {
      limpeza: 'sparkles',
      manutencao: 'construct',
      entrega: 'bicycle',
      beleza: 'cut',
      saude: 'medical',
      educacao: 'school',
      pets: 'paw',
      outros: 'ellipsis-horizontal',
    };
    return iconMap[serviceType] || 'help-circle';
  };

  const getUrgencyColor = (countdown: number) => {
    if (countdown > 20) return '#4CAF50'; // Green
    if (countdown > 10) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  if (!visible || !serviceRequest) return null;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 8,
      maxHeight: height * 0.85,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.outline,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    header: {
      paddingHorizontal: 24,
      marginBottom: 20,
    },
    urgencyIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    urgencyText: {
      ...typography.titleMedium,
      marginLeft: 8,
      fontWeight: '700',
    },
    progressContainer: {
      height: 4,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 2,
      marginHorizontal: 24,
      marginBottom: 20,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 2,
    },
    serviceInfo: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    serviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    serviceIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    serviceTitle: {
      ...typography.headlineSmall,
      color: colors.onSurface,
      flex: 1,
    },
    serviceDescription: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      marginBottom: 16,
      lineHeight: 20,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    locationIcon: {
      marginTop: 2,
      marginRight: 12,
    },
    locationText: {
      ...typography.bodyMedium,
      color: colors.onSurface,
      flex: 1,
      lineHeight: 20,
    },
    clientInfo: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 24,
      marginBottom: 24,
    },
    clientRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    clientText: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      marginLeft: 8,
      flex: 1,
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      paddingBottom: 32,
      gap: 16,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    acceptButton: {
      backgroundColor: '#4CAF50',
    },
    rejectButton: {
      backgroundColor: colors.error,
    },
    disabledButton: {
      backgroundColor: colors.outline,
    },
    buttonText: {
      ...typography.titleMedium,
      color: colors.surface,
      marginLeft: 8,
      fontWeight: '600',
    },
    processingText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateY: slideAnim },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <View style={styles.handle} />

          {/* Urgency Indicator */}
          <View style={styles.urgencyIndicator}>
            <Ionicons
              name="time"
              size={24}
              color={getUrgencyColor(countdown)}
            />
            <Animated.Text
              style={[
                styles.urgencyText,
                {
                  color: getUrgencyColor(countdown),
                },
              ]}
            >
              {countdown}s restantes
            </Animated.Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  backgroundColor: getUrgencyColor(countdown),
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Service Information */}
          <View style={styles.serviceInfo}>
            <View style={styles.serviceHeader}>
              <View
                style={[
                  styles.serviceIcon,
                  {
                    backgroundColor: colors.primary + '20',
                  },
                ]}
              >
                <Ionicons
                  name={getServiceIcon(serviceRequest.service_type) as any}
                  size={24}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.serviceTitle}>
                Nova Solicitação
              </Text>
            </View>

            <Text style={styles.serviceDescription}>
              {serviceRequest.description}
            </Text>

            <View style={styles.locationContainer}>
              <Ionicons
                name="location"
                size={20}
                color={colors.primary}
                style={styles.locationIcon}
              />
              <Text style={styles.locationText}>
                {serviceRequest.location.address || 
                 `${serviceRequest.location.latitude.toFixed(4)}, ${serviceRequest.location.longitude.toFixed(4)}`}
              </Text>
            </View>
          </View>

          {/* Client Information */}
          <View style={styles.clientInfo}>
            <View style={styles.clientRow}>
              <Ionicons name="person" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.clientText}>Cliente verificado</Text>
            </View>
            <View style={styles.clientRow}>
              <Ionicons name="star" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.clientText}>Avaliação: 4.8 ⭐</Text>
            </View>
            <View style={styles.clientRow}>
              <Ionicons name="time" size={16} color={colors.onSurfaceVariant} />
              <Text style={styles.clientText}>
                Solicitado há {Math.floor((Date.now() - new Date(serviceRequest.created_at).getTime()) / 60000)} min
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isProcessing ? styles.disabledButton : styles.rejectButton,
              ]}
              onPress={handleReject}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons
                name="close"
                size={20}
                color={colors.surface}
              />
              <Text style={styles.buttonText}>
                {isProcessing ? 'Processando...' : 'Recusar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                isProcessing ? styles.disabledButton : styles.acceptButton,
              ]}
              onPress={handleAccept}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark"
                size={20}
                color={colors.surface}
              />
              <Text style={styles.buttonText}>
                {isProcessing ? 'Processando...' : 'Aceitar'}
              </Text>
            </TouchableOpacity>
          </View>

          {isProcessing && (
            <Text style={styles.processingText}>
              Processando sua resposta...
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};