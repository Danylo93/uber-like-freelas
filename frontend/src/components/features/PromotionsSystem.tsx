import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { cacheManager, CACHE_KEYS, CACHE_TTL } from '../../utils/cacheManager';

interface Promotion {
  id: string;
  title: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_delivery';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  targetAudience: 'all' | 'new_users' | 'loyal_users' | 'providers';
  serviceCategories?: string[];
  image?: string;
}

interface Coupon {
  id: string;
  code: string;
  promotion: Promotion;
  userId: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt: string;
}

interface PromotionsSystemProps {
  onApplyCoupon?: (coupon: Coupon) => void;
  showInput?: boolean;
  currentOrderValue?: number;
  selectedCategories?: string[];
}

export const PromotionsSystem: React.FC<PromotionsSystemProps> = ({
  onApplyCoupon,
  showInput = true,
  currentOrderValue = 0,
  selectedCategories = [],
}) => {
  const themeContext = useTheme();
  const { user } = useAuth();
  
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPromotions, setShowPromotions] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const colors = themeContext?.theme?.colors || {
    surface: '#FFFFFF',
    surfaceVariant: '#F3F3F3',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    primary: '#6750A4',
    secondary: '#625B71',
    error: '#BA1A1A',
    success: '#4CAF50',
    outline: '#79747E',
  };

  const typography = themeContext?.theme?.typography || {
    headlineSmall: { fontSize: 24, fontWeight: '600' },
    titleLarge: { fontSize: 22, fontWeight: '600' },
    titleMedium: { fontSize: 16, fontWeight: '600' },
    bodyLarge: { fontSize: 16 },
    bodyMedium: { fontSize: 14 },
    bodySmall: { fontSize: 12 },
  };

  useEffect(() => {
    loadPromotions();
    loadUserCoupons();
  }, [user]);

  useEffect(() => {
    if (appliedCoupon) {
      startPulseAnimation();
    }
  }, [appliedCoupon]);

  const loadPromotions = async () => {
    try {
      const cached = await cacheManager.getOrFetch(
        CACHE_KEYS.SERVICE_CATEGORIES + '_promotions',
        async () => {
          // Mock promotions data - in real app, fetch from API
          return mockPromotions;
        },
        { ttl: CACHE_TTL.LONG }
      );
      setPromotions(cached);
    } catch (error) {
      console.error('Failed to load promotions:', error);
    }
  };

  const loadUserCoupons = async () => {
    if (!user) return;

    try {
      const cached = await cacheManager.getOrFetch(
        `user_coupons_${user.id}`,
        async () => {
          // Mock user coupons - in real app, fetch from API
          return mockUserCoupons;
        },
        { ttl: CACHE_TTL.MEDIUM }
      );
      setUserCoupons(cached);
    } catch (error) {
      console.error('Failed to load user coupons:', error);
    }
  };

  const validateCoupon = (coupon: Coupon): { valid: boolean; reason?: string } => {
    const promotion = coupon.promotion;
    const now = new Date();
    
    // Check if coupon is used
    if (coupon.isUsed) {
      return { valid: false, reason: 'Este cupom já foi utilizado' };
    }

    // Check expiration
    if (new Date(coupon.expiresAt) < now) {
      return { valid: false, reason: 'Este cupom expirou' };
    }

    // Check promotion validity
    if (!promotion.isActive) {
      return { valid: false, reason: 'Esta promoção não está ativa' };
    }

    if (new Date(promotion.validUntil) < now) {
      return { valid: false, reason: 'Esta promoção expirou' };
    }

    // Check usage limit
    if (promotion.usedCount >= promotion.usageLimit) {
      return { valid: false, reason: 'Esta promoção atingiu o limite de uso' };
    }

    // Check minimum order value
    if (promotion.minOrderValue && currentOrderValue < promotion.minOrderValue) {
      return { 
        valid: false, 
        reason: `Valor mínimo do pedido: R$ ${promotion.minOrderValue.toFixed(2)}` 
      };
    }

    // Check target audience
    if (user && promotion.targetAudience === 'new_users') {
      // Check if user is new (created less than 30 days ago)
      // This would require user creation date from API
    }

    // Check service categories
    if (promotion.serviceCategories && promotion.serviceCategories.length > 0) {
      const hasMatchingCategory = promotion.serviceCategories.some(cat => 
        selectedCategories.includes(cat)
      );
      if (!hasMatchingCategory) {
        return { 
          valid: false, 
          reason: 'Este cupom não é válido para os serviços selecionados' 
        };
      }
    }

    return { valid: true };
  };

  const applyCoupon = async (code: string) => {
    setLoading(true);
    
    try {
      // Find coupon by code
      const coupon = userCoupons.find(c => 
        c.code.toLowerCase() === code.toLowerCase()
      );

      if (!coupon) {
        Alert.alert('Erro', 'Cupom não encontrado');
        return;
      }

      const validation = validateCoupon(coupon);
      if (!validation.valid) {
        Alert.alert('Cupom Inválido', validation.reason);
        return;
      }

      setAppliedCoupon(coupon);
      onApplyCoupon?.(coupon);
      setCouponCode('');
      
      Alert.alert(
        'Cupom Aplicado! 🎉',
        `Desconto de ${getDiscountText(coupon.promotion)} aplicado com sucesso!`
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aplicar o cupom');
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    onApplyCoupon?.(null as any);
  };

  const calculateDiscount = (promotion: Promotion, orderValue: number): number => {
    switch (promotion.discountType) {
      case 'percentage':
        const percentageDiscount = orderValue * (promotion.discountValue / 100);
        return promotion.maxDiscount 
          ? Math.min(percentageDiscount, promotion.maxDiscount)
          : percentageDiscount;
      
      case 'fixed':
        return Math.min(promotion.discountValue, orderValue);
      
      case 'free_delivery':
        return promotion.discountValue; // Delivery fee amount
      
      default:
        return 0;
    }
  };

  const getDiscountText = (promotion: Promotion): string => {
    switch (promotion.discountType) {
      case 'percentage':
        return `${promotion.discountValue}%`;
      case 'fixed':
        return `R$ ${promotion.discountValue.toFixed(2)}`;
      case 'free_delivery':
        return 'Frete Grátis';
      default:
        return '';
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      margin: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    title: {
      ...typography.titleMedium,
      color: colors.onSurface,
      marginBottom: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surfaceVariant,
      marginRight: 8,
    },
    applyButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonDisabled: {
      backgroundColor: colors.outline,
    },
    applyButtonText: {
      ...typography.bodyMedium,
      color: colors.surface,
      fontWeight: '600',
    },
    appliedCouponContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '10',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    appliedCouponText: {
      flex: 1,
      ...typography.bodyMedium,
      color: colors.success,
      fontWeight: '600',
    },
    removeButton: {
      padding: 4,
    },
    promotionsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary + '10',
      borderRadius: 12,
      padding: 12,
    },
    promotionsButtonText: {
      ...typography.bodyMedium,
      color: colors.secondary,
      marginRight: 8,
      fontWeight: '500',
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.outline + '30',
    },
    modalTitle: {
      ...typography.titleLarge,
      color: colors.onSurface,
    },
    promotionCard: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      margin: 8,
      marginHorizontal: 16,
    },
    promotionTitle: {
      ...typography.titleMedium,
      color: colors.onSurface,
      marginBottom: 4,
    },
    promotionDescription: {
      ...typography.bodyMedium,
      color: colors.onSurfaceVariant,
      marginBottom: 8,
    },
    promotionDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    promotionCode: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    promotionCodeText: {
      ...typography.bodySmall,
      color: colors.primary,
      fontWeight: '600',
    },
    promotionDiscount: {
      ...typography.titleMedium,
      color: colors.success,
      fontWeight: '700',
    },
    validityText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cupons e Promoções</Text>

      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <Animated.View
          style={[
            styles.appliedCouponContainer,
            {
              transform: [{
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.05],
                }),
              }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.appliedCouponText, { marginLeft: 8 }]}>
            {appliedCoupon.code} - {getDiscountText(appliedCoupon.promotion)}
          </Text>
          <TouchableOpacity onPress={removeCoupon} style={styles.removeButton}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Coupon Input */}
      {showInput && !appliedCoupon && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Digite seu código de cupom"
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[
              styles.applyButton,
              (!couponCode || loading) && styles.applyButtonDisabled,
            ]}
            onPress={() => applyCoupon(couponCode)}
            disabled={!couponCode || loading}
          >
            <Text style={styles.applyButtonText}>
              {loading ? 'Verificando...' : 'Aplicar'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* View Available Promotions */}
      <TouchableOpacity
        style={styles.promotionsButton}
        onPress={() => setShowPromotions(true)}
      >
        <Text style={styles.promotionsButtonText}>Ver Promoções Disponíveis</Text>
        <Ionicons name="gift" size={20} color={colors.secondary} />
      </TouchableOpacity>

      {/* Promotions Modal */}
      <Modal
        visible={showPromotions}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPromotions(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Promoções Disponíveis</Text>
              <TouchableOpacity onPress={() => setShowPromotions(false)}>
                <Ionicons name="close" size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {promotions.map((promotion) => (
                <View key={promotion.id} style={styles.promotionCard}>
                  <Text style={styles.promotionTitle}>{promotion.title}</Text>
                  <Text style={styles.promotionDescription}>
                    {promotion.description}
                  </Text>
                  
                  <View style={styles.promotionDetails}>
                    <View style={styles.promotionCode}>
                      <Text style={styles.promotionCodeText}>{promotion.code}</Text>
                    </View>
                    <Text style={styles.promotionDiscount}>
                      {getDiscountText(promotion)}
                    </Text>
                  </View>
                  
                  <Text style={styles.validityText}>
                    Válido até {new Date(promotion.validUntil).toLocaleDateString()}
                    {promotion.minOrderValue && 
                      ` • Pedido mínimo: R$ ${promotion.minOrderValue.toFixed(2)}`
                    }
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Mock data - in real app, these would come from API
const mockPromotions: Promotion[] = [
  {
    id: '1',
    title: 'Primeira Corrida Grátis',
    description: 'Ganhe desconto de 100% na sua primeira corrida!',
    code: 'PRIMEIRA',
    discountType: 'percentage',
    discountValue: 100,
    maxDiscount: 25,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    usageLimit: 1000,
    usedCount: 150,
    isActive: true,
    targetAudience: 'new_users',
  },
  {
    id: '2',
    title: 'Frete Grátis',
    description: 'Frete grátis em pedidos acima de R$ 50',
    code: 'FRETEGRATIS',
    discountType: 'free_delivery',
    discountValue: 8.99,
    minOrderValue: 50,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    usageLimit: 5000,
    usedCount: 1200,
    isActive: true,
    targetAudience: 'all',
  },
  {
    id: '3',
    title: '20% OFF Limpeza',
    description: '20% de desconto em todos os serviços de limpeza',
    code: 'LIMPEZA20',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 50,
    validFrom: '2024-01-01',
    validUntil: '2024-06-30',
    usageLimit: 2000,
    usedCount: 800,
    isActive: true,
    targetAudience: 'all',
    serviceCategories: ['limpeza'],
  },
];

const mockUserCoupons: Coupon[] = [
  {
    id: '1',
    code: 'PRIMEIRA',
    promotion: mockPromotions[0],
    userId: 'user1',
    isUsed: false,
    expiresAt: '2024-12-31T23:59:59Z',
  },
  {
    id: '2',
    code: 'FRETEGRATIS',
    promotion: mockPromotions[1],
    userId: 'user1',
    isUsed: false,
    expiresAt: '2024-12-31T23:59:59Z',
  },
];

export default PromotionsSystem;