import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[]; // Array of snap points as percentages (0-1)
  initialSnap?: number; // Index of initial snap point
  onSnapChange?: (snapIndex: number) => void;
}

const { height: screenHeight } = Dimensions.get('window');

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  snapPoints = [0.25, 0.5, 0.9],
  initialSnap = 0,
  onSnapChange,
}) => {
  const { theme } = useTheme();

  const panResponder = useMemo(() => 
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Handle pan gesture - simplified for now
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Handle snap logic - simplified for now
        if (onSnapChange) {
          onSnapChange(initialSnap);
        }
      },
    }),
    [initialSnap, onSnapChange]
  );

  const sheetHeight = screenHeight * snapPoints[initialSnap];

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: sheetHeight,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.large,
      borderTopRightRadius: theme.borderRadius.large,
      ...theme.elevation.level2,
    },
    handle: {
      alignSelf: 'center',
      width: 32,
      height: 4,
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: 2,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
  });

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.handle} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};