import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { RatingStars } from './RatingStars';
import { Button } from './Button';

interface RatingSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  serviceName?: string;
  providerName?: string;
  isProvider?: boolean; // true if provider is rating client
}

export const RatingSheet: React.FC<RatingSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  serviceName = 'serviço',
  providerName = 'prestador',
  isProvider = false,
}) => {
  const { colors, typography } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Avaliação necessária', 'Por favor, selecione uma classificação com estrelas.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(rating, comment);
      
      // Reset form
      setRating(0);
      setComment('');
      onClose();
      
      Alert.alert(
        'Obrigado!',
        'Sua avaliação foi enviada com sucesso.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert(
        'Erro',
        'Não foi possível enviar sua avaliação. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Muito ruim';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return 'Selecione uma classificação';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.outline }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.onSurface }, typography.headlineSmall]}>
              Avaliar {isProvider ? 'Cliente' : 'Serviço'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Service Info */}
            <View style={[styles.serviceInfo, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.serviceTitle, { color: colors.onSurfaceVariant }, typography.titleMedium]}>
                {serviceName}
              </Text>
              <Text style={[styles.providerName, { color: colors.onSurfaceVariant }, typography.bodyMedium]}>
                {isProvider ? 'Cliente' : 'Prestador'}: {providerName}
              </Text>
            </View>

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }, typography.titleMedium]}>
                Como foi sua experiência?
              </Text>
              
              <View style={styles.starsContainer}>
                <RatingStars
                  rating={rating}
                  onRatingChange={setRating}
                  size={40}
                />
              </View>
              
              <Text style={[styles.ratingText, { color: colors.primary }, typography.bodyLarge]}>
                {getRatingText(rating)}
              </Text>
            </View>

            {/* Comment Section */}
            <View style={styles.commentSection}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }, typography.titleMedium]}>
                Deixe um comentário (opcional)
              </Text>
              
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outline,
                    color: colors.onSurfaceVariant,
                  },
                ]}
                placeholder={`Conte-nos mais sobre sua experiência com ${isProvider ? 'este cliente' : 'este serviço'}...`}
                placeholderTextColor={colors.onSurfaceVariant + '80'}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={comment}
                onChangeText={setComment}
                maxLength={300}
              />
              
              <Text style={[styles.characterCount, { color: colors.onSurfaceVariant }]}>
                {comment.length}/300
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { borderTopColor: colors.outline }]}>
            <Button
              title="Enviar Avaliação"
              onPress={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              loading={isSubmitting}
              style={styles.submitButton}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  serviceInfo: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  serviceTitle: {
    marginBottom: 4,
  },
  providerName: {
    opacity: 0.8,
  },
  ratingSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  starsContainer: {
    marginVertical: 16,
  },
  ratingText: {
    marginTop: 8,
    fontWeight: '600',
  },
  commentSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  commentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
    height: 120,
    fontSize: 16,
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    opacity: 0.6,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    marginTop: 0,
  },
});