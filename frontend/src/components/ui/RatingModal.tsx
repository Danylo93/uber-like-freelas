import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  providerName: string;
  serviceTitle: string;
  onSubmitRating: (rating: number, comment: string) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  providerName,
  serviceTitle,
  onSubmitRating,
}) => {
  const themeContext = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const theme = themeContext?.theme || {
    colors: {
      surface: '#FFFFFF',
      onSurface: '#1C1B1F',
      onSurfaceVariant: '#49454F',
      primary: '#6750A4',
      outline: '#79747E',
    },
    spacing: { md: 16 },
    typography: {
      titleMedium: { fontSize: 16, fontWeight: '600' },
      bodyMedium: { fontSize: 14 },
    },
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Avaliação obrigatória', 'Por favor, selecione uma nota de 1 a 5 estrelas');
      return;
    }

    onSubmitRating(rating, comment);
    setRating(0);
    setComment('');
    onClose();
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      return (
        <TouchableOpacity
          key={starNumber}
          onPress={() => setRating(starNumber)}
          style={styles.starButton}
        >
          <Text style={[
            styles.star,
            { color: starNumber <= rating ? '#FFD700' : theme.colors.outline }
          ]}>
            ⭐
          </Text>
        </TouchableOpacity>
      );
    });
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Muito ruim';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return 'Selecione uma nota';
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      padding: 24,
      borderRadius: 12,
      maxHeight: '80%',
      minWidth: 320,
    },
    title: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 24,
    },
    serviceInfo: {
      backgroundColor: theme.colors.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    serviceText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 16,
    },
    starButton: {
      padding: 4,
    },
    star: {
      fontSize: 32,
    },
    ratingText: {
      ...theme.typography.titleMedium,
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 24,
    },
    commentLabel: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      marginBottom: 8,
      fontWeight: '600',
    },
    commentInput: {
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 12,
      marginBottom: 24,
      fontSize: 14,
      textAlignVertical: 'top',
      minHeight: 80,
    },
    buttonsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    buttonText: {
      ...theme.typography.bodyMedium,
      fontWeight: '600',
    },
    primaryButtonText: {
      color: 'white',
    },
    secondaryButtonText: {
      color: theme.colors.onSurface,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Avaliar Serviço</Text>
            <Text style={styles.subtitle}>Como foi sua experiência?</Text>

            <View style={styles.serviceInfo}>
              <Text style={styles.serviceText}>
                🧑‍🔧 {providerName}
              </Text>
              <Text style={styles.serviceText}>
                📋 {serviceTitle}
              </Text>
            </View>

            <View style={styles.starsContainer}>
              {renderStars()}
            </View>

            <Text style={styles.ratingText}>
              {getRatingText()}
            </Text>

            <Text style={styles.commentLabel}>
              Comentário (opcional):
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Conte como foi o serviço, o que você achou do prestador..."
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleSubmit}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Avaliar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};