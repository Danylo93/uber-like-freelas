import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useRealTimeService } from '../../hooks/useRealTimeService';
import { useAuth } from '../../contexts/AuthContext';

interface ProviderStatusToggleProps {
  style?: any;
}

export const ProviderStatusToggle: React.FC<ProviderStatusToggleProps> = ({ style }) => {
  const themeContext = useTheme();
  const { user } = useAuth();
  const { isProviderOnline, toggleProviderStatus, isConnected } = useRealTimeService();
  
  const [isLoading, setIsLoading] = useState(false);
  const [animatedValue] = useState(new Animated.Value(isProviderOnline ? 1 : 0));

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
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isProviderOnline ? 1 : 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [isProviderOnline]);

  const handleToggle = async () => {
    if (user?.role !== 'provider') {
      Alert.alert('Erro', 'Apenas prestadores podem alterar o status');
      return;
    }

    if (!isConnected) {
      Alert.alert(
        'Conexão necessária',
        'Você precisa estar conectado à internet para alterar seu status'
      );
      return;
    }

    try {
      setIsLoading(true);
      await toggleProviderStatus(!isProviderOnline);
    } catch (error) {
      console.error('Error toggling provider status:', error);
      Alert.alert(
        'Erro',
        'Não foi possível alterar seu status. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = () => {
    if (isLoading) return 'Atualizando...';
    return isProviderOnline ? 'Você está Online' : 'Você está Offline';
  };

  const getStatusSubtext = () => {
    if (isProviderOnline) {
      return 'Recebendo solicitações de serviços';
    } else {
      return 'Toque para ficar online e receber solicitações';
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    leftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    textContainer: {
      flex: 1,
    },
    statusText: {
      ...typography.titleMedium,
      marginBottom: 4,
    },
    subText: {
      ...typography.bodySmall,
      opacity: 0.8,
    },
    switchContainer: {
      width: 60,
      height: 32,
      borderRadius: 16,
      padding: 2,
      justifyContent: 'center',
    },
    switchThumb: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
    },
    connectionText: {
      ...typography.bodySmall,
      opacity: 0.6,
    },
    earnings: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.outline + '30',
    },
    earningsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    earningsLabel: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
    },
    earningsValue: {
      ...typography.titleMedium,
      color: colors.primary,
      fontWeight: '700',
    },
  });

  const onlineColor = '#4CAF50';
  const offlineColor = colors.outline;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={handleToggle}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [offlineColor + '20', onlineColor + '20'],
                }),
              },
            ]}
          >
            <Animated.View
              style={{
                transform: [
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              }}
            >
              <Ionicons
                name={isProviderOnline ? 'radio-button-on' : 'radio-button-off'}
                size={24}
                color={isProviderOnline ? onlineColor : offlineColor}
              />
            </Animated.View>
          </Animated.View>

          <View style={styles.textContainer}>
            <Animated.Text
              style={[
                styles.statusText,
                {
                  color: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.onSurface, onlineColor],
                  }),
                },
              ]}
            >
              {getStatusText()}
            </Animated.Text>
            <Text style={[styles.subText, { color: colors.onSurfaceVariant }]}>
              {getStatusSubtext()}
            </Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.switchContainer,
            {
              backgroundColor: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [offlineColor, onlineColor],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.switchThumb,
              {
                transform: [
                  {
                    translateX: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 28],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.connectionDot,
            {
              backgroundColor: isConnected ? onlineColor : colors.error,
            },
          ]}
        />
        <Text style={styles.connectionText}>
          {isConnected ? 'Conectado ao servidor' : 'Desconectado do servidor'}
        </Text>
      </View>

      {/* Earnings Preview (for providers) */}
      {isProviderOnline && (
        <View style={styles.earnings}>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Ganhos hoje</Text>
            <Text style={styles.earningsValue}>R$ 0,00</Text>
          </View>
        </View>
      )}
    </View>
  );
};