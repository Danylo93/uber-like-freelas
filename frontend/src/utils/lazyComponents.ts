import React, { lazy, Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// Loading component for lazy loading
const LazyLoadingComponent: React.FC = () => {
  const themeContext = useTheme();
  const colors = themeContext?.theme?.colors || {
    background: '#FFFFFF',
    primary: '#6750A4',
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

// HOC for lazy loading with custom loading component
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  LoadingComponent: React.ComponentType = LazyLoadingComponent
) => {
  const LazyComponent = React.forwardRef<any, P>((props, ref) => (
    <Suspense fallback={<LoadingComponent />}>
      <Component {...props} ref={ref} />
    </Suspense>
  ));

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`;
  return LazyComponent;
};

// Lazy loaded screens for better performance
export const LazyLoginScreen = lazy(() => import('../screens/auth/LoginScreen'));
export const LazyRegisterScreen = lazy(() => import('../screens/auth/RegisterScreen'));
export const LazyUberHomeScreen = lazy(() => import('../screens/uber/UberHomeScreen'));
export const LazyAccountScreen = lazy(() => import('../screens/main/AccountScreen'));
export const LazyActivityScreen = lazy(() => import('../screens/main/ActivityScreen'));
export const LazyServiceListScreen = lazy(() => import('../screens/main/ServiceListScreen'));
export const LazyChatScreen = lazy(() => import('../screens/ChatScreen'));
export const LazyPaymentScreen = lazy(() => import('../screens/payment/PaymentScreen'));

// Lazy loaded components for better performance
export const LazyEarningsDashboard = lazy(() => import('../components/uber/EarningsDashboard'));
export const LazyServiceRequestModal = lazy(() => import('../components/uber/ServiceRequestModal'));
export const LazySearchingAnimation = lazy(() => import('../components/uber/SearchingAnimation'));
export const LazyTurnByTurnNavigation = lazy(() => import('../components/uber/TurnByTurnNavigation'));

// Preload components for critical paths
export const preloadCriticalComponents = () => {
  // Preload login and home screens immediately
  LazyLoginScreen;
  LazyUberHomeScreen;
  
  // Preload other components after a delay
  setTimeout(() => {
    LazyAccountScreen;
    LazyActivityScreen;
    LazyServiceListScreen;
  }, 2000);
  
  // Preload heavy components after user interaction
  setTimeout(() => {
    LazyEarningsDashboard;
    LazyServiceRequestModal;
    LazySearchingAnimation;
    LazyTurnByTurnNavigation;
  }, 5000);
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [renderTime, setRenderTime] = React.useState<number>(0);
  const [mountTime, setMountTime] = React.useState<number>(0);

  React.useEffect(() => {
    const startTime = performance.now();
    setMountTime(startTime);

    return () => {
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      setRenderTime(totalTime);
      
      if (totalTime > 16.67) { // More than 60fps threshold
        console.warn(`Slow render detected: ${totalTime.toFixed(2)}ms`);
      }
    };
  }, []);

  return { renderTime, mountTime };
};

// Memory optimization utilities
export const optimizeImages = {
  // Compress base64 images
  compressBase64: (base64: string, quality: number = 0.8): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          const ratio = Math.min(800 / img.width, 600 / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = base64;
      }) as any;
    } catch (error) {
      console.warn('Image compression failed:', error);
      return base64;
    }
  },

  // Get optimal image size for device
  getOptimalSize: (screenWidth: number, screenHeight: number) => {
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return {
      width: Math.min(screenWidth * pixelRatio, 1200),
      height: Math.min(screenHeight * pixelRatio, 800),
    };
  },
};

// Animation performance utilities
export const animationUtils = {
  // Check if device can handle smooth animations
  canHandleSmoothAnimations: (): boolean => {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      const isLowEnd = userAgent.includes('android') && 
                       (userAgent.includes('chrome/') && 
                        parseInt(userAgent.split('chrome/')[1]) < 80);
      
      return !isLowEnd && 'requestAnimationFrame' in window;
    } catch {
      return true; // Default to true for React Native
    }
  },

  // Optimize animation for 60fps
  optimizeForFPS: (callback: () => void, maxFPS: number = 60) => {
    const targetInterval = 1000 / maxFPS;
    let lastTime = 0;

    const optimizedCallback = (currentTime: number) => {
      if (currentTime - lastTime >= targetInterval) {
        callback();
        lastTime = currentTime;
      }
      requestAnimationFrame(optimizedCallback);
    };

    requestAnimationFrame(optimizedCallback);
  },

  // Throttle expensive operations
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    
    return (...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  },
};

// Bundle size optimization
export const bundleOptimization = {
  // Dynamic imports for better code splitting
  loadModule: async <T>(moduleLoader: () => Promise<{ default: T }>): Promise<T> => {
    try {
      const module = await moduleLoader();
      return module.default;
    } catch (error) {
      console.error('Failed to load module:', error);
      throw error;
    }
  },

  // Preconnect to external resources
  preconnectResources: () => {
    const resources = [
      'https://maps.googleapis.com',
      'https://fonts.googleapis.com',
      'https://api.stripe.com',
    ];

    resources.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
    });
  },
};