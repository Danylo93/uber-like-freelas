import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';

const serviceCategories = [
  { id: 'limpeza', label: 'Limpeza', icon: '🧹' },
  { id: 'jardinagem', label: 'Jardinagem', icon: '🌱' },
  { id: 'pintura', label: 'Pintura', icon: '🎨' },
  { id: 'eletrica', label: 'Elétrica', icon: '⚡' },
  { id: 'encanamento', label: 'Encanamento', icon: '🔧' },
  { id: 'marcenaria', label: 'Marcenaria', icon: '🪚' },
];

export default function ServiceRequestScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    address: '',
    budgetMin: '',
    budgetMax: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Selecione uma categoria';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Endereço é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // TODO: Send to backend
      Alert.alert(
        'Solicitação criada!',
        'Sua solicitação foi enviada. Você receberá ofertas em breve.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a solicitação.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      ...theme.elevation.level1,
    },
    backButton: {
      marginRight: theme.spacing.md,
    },
    title: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
    },
    content: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    categoryChip: {
      minWidth: 100,
    },
    budgetRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    budgetInput: {
      flex: 1,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Voltar"
          onPress={() => router.back()}
          variant="text"
          style={styles.backButton}
        />
        <Text style={styles.title}>Nova Solicitação</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoria do Serviço</Text>
            <View style={styles.categoryGrid}>
              {serviceCategories.map((category) => (
                <Chip
                  key={category.id}
                  label={`${category.icon} ${category.label}`}
                  selected={formData.category === category.id}
                  onPress={() => updateFormData('category', category.id)}
                  variant="filter"
                  style={styles.categoryChip}
                />
              ))}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          <View style={styles.section}>
            <TextInput
              label="Título do serviço"
              placeholder="Ex: Limpeza de casa de 3 quartos"
              value={formData.title}
              onChangeText={(value) => updateFormData('title', value)}
              error={errors.title}
            />
          </View>

          <View style={styles.section}>
            <TextInput
              label="Descrição detalhada"
              placeholder="Descreva exatamente o que precisa ser feito"
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              error={errors.description}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <TextInput
              label="Endereço"
              placeholder="Rua, Bairro, Cidade"
              value={formData.address}
              onChangeText={(value) => updateFormData('address', value)}
              error={errors.address}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orçamento (opcional)</Text>
            <View style={styles.budgetRow}>
              <TextInput
                label="Valor mínimo"
                placeholder="R$ 50"
                value={formData.budgetMin}
                onChangeText={(value) => updateFormData('budgetMin', value)}
                keyboardType="numeric"
                style={styles.budgetInput}
              />
              <TextInput
                label="Valor máximo"
                placeholder="R$ 200"
                value={formData.budgetMax}
                onChangeText={(value) => updateFormData('budgetMax', value)}
                keyboardType="numeric"
                style={styles.budgetInput}
              />
            </View>
          </View>

          <Button
            title="Criar Solicitação"
            onPress={handleSubmit}
            fullWidth
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}