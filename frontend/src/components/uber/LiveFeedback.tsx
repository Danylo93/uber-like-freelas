import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface FeedbackOption {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
}

interface LiveFeedbackProps {
  visible: boolean;
  onClose: () => void;
  onFeedbackSubmit: (feedback: { type: string; rating: number; comment?: string }) => void;
  serviceProviderName?: string;
  serviceName?: string;
}

export const LiveFeedback: React.FC<LiveFeedbackProps> = ({
  visible,
  onClose,
  onFeedbackSubmit,
  serviceProviderName = 'Prestador',
  serviceName = 'Serviço',
}) => {
  const themeContext = useTheme();
  
  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    outline: '#79747E',
  };
  
  const typography = themeContext?.theme?.typography || {
    headlineSmall: { fontSize: 24, fontWeight: '600' },
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [animatedValue] = useState(new Animated.Value(0));

  const feedbackOptions: FeedbackOption[] = [
    {
      id: 'excellent',
      icon: 'happy',
      label: 'Excelente',
      description: 'Superou expectativas',
      color: '#4CAF50',
    },
    {
      id: 'good',
      icon: 'thumbs-up',
      label: 'Bom',
      description: 'Atendeu expectativas',
      color: '#2196F3',
    },
    {
      id: 'average',
      icon: 'remove',
      label: 'Regular',
      description: 'Pode melhorar',
      color: '#FF9800',
    },
    {
      id: 'poor',
      icon: 'thumbs-down',
      label: 'Ruim',
      description: 'Abaixo das expectativas',
      color: '#F44336',
    },
  ];

  useEffect(() => {
    if (visible) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleFeedbackSelect = (feedbackId: string) => {
    setSelectedFeedback(feedbackId);
    
    // Auto-submit after selection
    setTimeout(() => {
      const feedback = feedbackOptions.find(f => f.id === feedbackId);
      if (feedback) {
        const ratingMap = {
          excellent: 5,
          good: 4,
          average: 3,
          poor: 2,
        };
        
        onFeedbackSubmit({
          type: feedbackId,
          rating: ratingMap[feedbackId as keyof typeof ratingMap],
          comment: feedback.description,
        });
        
        setTimeout(() => {
          onClose();
          setSelectedFeedback(null);
        }, 1000);
      }
    }, 500);
  };

  const renderFeedbackOption = (option: FeedbackOption) => {
    const isSelected = selectedFeedback === option.id;
    
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.feedbackOption,
          {
            backgroundColor: isSelected ? option.color + '20' : colors.surfaceVariant,
            borderColor: isSelected ? option.color : colors.outline,
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
        onPress={() => handleFeedbackSelect(option.id)}
        activeOpacity={0.7}
        disabled={!!selectedFeedback}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isSelected ? option.color : colors.surface,
              transform: [
                {
                  scale: isSelected ? 1.2 : 1,
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={option.icon as any}
            size={32}
            color={isSelected ? colors.surface : option.color}
          />
        </Animated.View>
        
        <Text
          style={[
            styles.feedbackLabel,
            {
              color: isSelected ? option.color : colors.onSurface,
            },
            typography.titleMedium,
          ]}
        >
          {option.label}
        </Text>
        
        <Text
          style={[
            styles.feedbackDescription,
            {
              color: colors.onSurfaceVariant,
            },
            typography.bodySmall,
          ]}
        >
          {option.description}
        </Text>

        {isSelected && (
          <Animated.View
            style={[
              styles.selectionIndicator,
              {
                backgroundColor: option.color,
                transform: [
                  {
                    scale: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Ionicons name="checkmark" size={16} color={colors.surface} />
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      margin: 20,
      maxWidth: 400,
      width: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
    },
    header: {
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      ...typography.headlineSmall,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    providerName: {
      ...typography.bodyMedium,
      color: colors.primary,
      fontWeight: '600',
    },
    feedbackGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: 12,
    },
    feedbackOption: {
      width: '48%',
      aspectRatio: 1,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      position: 'relative',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    feedbackLabel: {
      textAlign: 'center',
      marginBottom: 4,
    },
    feedbackDescription: {
      textAlign: 'center',
      lineHeight: 16,
    },
    selectionIndicator: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skipButton: {
      marginTop: 24,
      paddingVertical: 12,
      alignItems: 'center',
    },
    skipText: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
              opacity: animatedValue,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Como foi sua experiência?</Text>
            <Text style={styles.subtitle}>
              Ajude-nos a melhorar avaliando{' '}
              <Text style={styles.providerName}>{serviceProviderName}</Text>
              {'\n'}no serviço de {serviceName.toLowerCase()}
            </Text>
          </View>

          <View style={styles.feedbackGrid}>
            {feedbackOptions.map(renderFeedbackOption)}
          </View>

          <TouchableOpacity style={styles.skipButton} onPress={onClose}>
            <Text style={styles.skipText}>Pular por agora</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};