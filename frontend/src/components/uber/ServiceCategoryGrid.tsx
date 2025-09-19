import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  available?: boolean;
}

interface ServiceCategoryGridProps {
  categories: ServiceCategory[];
  onCategorySelect: (categoryId: string) => void;
  selectedCategoryId?: string;
  style?: any;
}

const { width } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARDS_PER_ROW = 2;
const CARD_WIDTH = (width - CARD_MARGIN * (CARDS_PER_ROW + 1)) / CARDS_PER_ROW;

export const ServiceCategoryGrid: React.FC<ServiceCategoryGridProps> = ({
  categories,
  onCategorySelect,
  selectedCategoryId,
  style,
}) => {
  const themeContext = useTheme();
  
  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    outline: '#79747E',
  };
  
  const typography = themeContext?.theme?.typography || {
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodySmall: { fontSize: 12 },
  };

  const defaultCategories: ServiceCategory[] = [
    {
      id: 'limpeza',
      name: 'Limpeza',
      icon: 'sparkles',
      color: '#4CAF50',
      description: 'Limpeza residencial e comercial',
      available: true,
    },
    {
      id: 'manutencao',
      name: 'Manutenção',
      icon: 'construct',
      color: '#FF9800',
      description: 'Reparos e manutenção',
      available: true,
    },
    {
      id: 'entrega',
      name: 'Entrega',
      icon: 'bicycle',
      color: '#2196F3',
      description: 'Entrega e transporte',
      available: true,
    },
    {
      id: 'beleza',
      name: 'Beleza',
      icon: 'cut',
      color: '#E91E63',
      description: 'Serviços de beleza',
      available: true,
    },
    {
      id: 'saude',
      name: 'Saúde',
      icon: 'medical',
      color: '#00BCD4',
      description: 'Cuidados com a saúde',
      available: true,
    },
    {
      id: 'educacao',
      name: 'Educação',
      icon: 'school',
      color: '#673AB7',
      description: 'Aulas e treinamentos',
      available: true,
    },
    {
      id: 'pets',
      name: 'Pet Care',
      icon: 'paw',
      color: '#795548',
      description: 'Cuidados com pets',
      available: true,
    },
    {
      id: 'outros',
      name: 'Outros',
      icon: 'ellipsis-horizontal',
      color: '#607D8B',
      description: 'Outros serviços',
      available: true,
    },
  ];

  const categoriesToShow = categories.length > 0 ? categories : defaultCategories;

  const renderCategory = (category: ServiceCategory) => {
    const isSelected = selectedCategoryId === category.id;
    const isAvailable = category.available !== false;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryCard,
          {
            backgroundColor: isSelected ? category.color + '15' : colors.surface,
            borderColor: isSelected ? category.color : colors.outline,
            width: CARD_WIDTH,
            opacity: isAvailable ? 1 : 0.5,
          },
        ]}
        onPress={() => isAvailable && onCategorySelect(category.id)}
        activeOpacity={0.7}
        disabled={!isAvailable}
      >
        <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
          <Ionicons
            name={category.icon as any}
            size={24}
            color={category.color}
          />
        </View>
        
        <Text
          style={[
            styles.categoryName,
            {
              color: isSelected ? category.color : colors.onSurface,
            },
            typography.titleMedium,
          ]}
        >
          {category.name}
        </Text>
        
        {category.description && (
          <Text
            style={[
              styles.categoryDescription,
              {
                color: colors.onSurfaceVariant,
              },
              typography.bodySmall,
            ]}
          >
            {category.description}
          </Text>
        )}

        {!isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={[styles.unavailableText, { color: colors.onSurfaceVariant }]}>
              Em breve
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingVertical: 16,
    },
    scrollContainer: {
      paddingHorizontal: CARD_MARGIN / 2,
    },
    header: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    headerTitle: {
      ...typography.titleMedium,
      color: colors.onSurface,
      marginBottom: 4,
    },
    headerSubtitle: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: CARD_MARGIN / 2,
    },
    categoryCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: CARD_MARGIN,
      marginHorizontal: CARD_MARGIN / 2,
      borderWidth: 1,
      alignItems: 'center',
      minHeight: 120,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      position: 'relative',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    categoryName: {
      textAlign: 'center',
      marginBottom: 4,
    },
    categoryDescription: {
      textAlign: 'center',
      lineHeight: 16,
    },
    unavailableOverlay: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    unavailableText: {
      fontSize: 10,
      fontWeight: '500',
    },
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Que tipo de serviço você precisa?</Text>
        <Text style={styles.headerSubtitle}>Escolha uma categoria para começar</Text>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.grid}>
          {categoriesToShow.map(renderCategory)}
        </View>
      </ScrollView>
    </View>
  );
};