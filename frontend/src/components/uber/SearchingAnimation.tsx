import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchingAnimationProps {
  isVisible: boolean;
  onCancel?: () => void;
  searchText?: string;
  subtitle?: string;
}

export const SearchingAnimation: React.FC<SearchingAnimationProps> = ({
  isVisible,
  onCancel,
  searchText = "Procurando prestadores...",
  subtitle = "Encontraremos o melhor prestador para você",
}) => {
  const themeContext = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  
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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const searchSteps = [
    { icon: 'search', text: 'Analisando sua solicitação...', color: colors.primary },
    { icon: 'location', text: 'Identificando sua localização...', color: '#4CAF50' },
    { icon: 'people', text: 'Buscando prestadores próximos...', color: '#FF9800' },
    { icon: 'star', text: 'Selecionando os melhores...', color: '#E91E63' },
    { icon: 'checkmark-circle', text: 'Enviando solicitações...', color: '#2196F3' },
  ];

  useEffect(() => {
    if (isVisible) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start step animation cycle
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % searchSteps.length);
      }, 2000);

      // Continuous pulse animation
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (isVisible) startPulse();
        });
      };
      startPulse();

      // Continuous rotation animation
      const startRotation = () => {
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start(() => {
          rotateAnim.setValue(0);
          if (isVisible) startRotation();
        });
      };
      startRotation();

      // Ripple effect animation
      const startRipple = () => {
        rippleAnim.setValue(0);
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          if (isVisible) {
            setTimeout(startRipple, 500);
          }
        });
      };
      startRipple();

      return () => {
        clearInterval(stepInterval);
      };
    } else {
      // Fade out animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const currentStepData = searchSteps[currentStep];

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    container: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 32,
      margin: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 16,
      minWidth: 300,
    },
    animationContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    rippleContainer: {
      position: 'absolute',
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ripple: {
      position: 'absolute',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 2,
    },
    centralIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary + '20',
      zIndex: 2,
    },
    rotatingRing: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: 'transparent',
      borderTopColor: colors.primary,
      zIndex: 1,
    },
    textContainer: {
      alignItems: 'center',
    },
    mainText: {
      ...typography.titleMedium,
      color: colors.onSurface,
      textAlign: 'center',
      marginBottom: 8,
    },
    stepText: {
      ...typography.bodyMedium,
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitleText: {
      ...typography.bodySmall,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      opacity: 0.8,
    },
    stepsContainer: {
      marginTop: 20,
      width: '100%',
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginVertical: 2,
    },
    stepIcon: {
      width: 24,
      height: 24,
      marginRight: 12,
    },
    stepLabel: {
      ...typography.bodySmall,
      flex: 1,
    },
    progressDots: {
      flexDirection: 'row',
      marginTop: 16,
      justifyContent: 'center',
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      backgroundColor: colors.outline,
    },
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
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
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.animationContainer}>
          {/* Ripple Effects */}
          <View style={styles.rippleContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.ripple,
                  {
                    borderColor: colors.primary + '30',
                    transform: [
                      {
                        scale: rippleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5 + index * 0.1, 1.2 + index * 0.1],
                        }),
                      },
                    ],
                    opacity: rippleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.8, 0.4, 0],
                    }),
                  },
                ]}
              />
            ))}
          </View>

          {/* Rotating Ring */}
          <Animated.View
            style={[
              styles.rotatingRing,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          />

          {/* Central Icon */}
          <Animated.View
            style={[
              styles.centralIcon,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons
              name={currentStepData.icon as any}
              size={32}
              color={currentStepData.color}
            />
          </Animated.View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.mainText}>{searchText}</Text>
          <Animated.Text
            style={[
              styles.stepText,
              {
                color: currentStepData.color,
                opacity: fadeAnim,
              },
            ]}
          >
            {currentStepData.text}
          </Animated.Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressDots}>
          {searchSteps.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentStep ? colors.primary : colors.outline,
                  transform: [
                    {
                      scale: index === currentStep ? 1.2 : 1,
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
};