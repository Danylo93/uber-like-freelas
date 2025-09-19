import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  color?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onRatingChange,
  size = 24,
  readonly = false,
  color,
}) => {
  const { colors } = useTheme();
  
  const starColor = color || colors.primary;
  const emptyStarColor = colors.outline;

  const handleStarPress = (starIndex: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, index) => {
        const isFilled = index < rating;
        const StarComponent = readonly ? View : TouchableOpacity;
        
        return (
          <StarComponent
            key={index}
            style={[styles.star, { opacity: readonly ? 1 : 0.8 }]}
            onPress={readonly ? undefined : () => handleStarPress(index)}
            disabled={readonly}
          >
            <Ionicons
              name={isFilled ? 'star' : 'star-outline'}
              size={size}
              color={isFilled ? starColor : emptyStarColor}
            />
          </StarComponent>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginHorizontal: 2,
  },
});