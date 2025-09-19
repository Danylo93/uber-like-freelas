import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 Index useEffect - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    
    // Add a small delay to ensure auth state is properly updated
    const checkAuth = async () => {
      if (!isLoading) {
        if (isAuthenticated) {
          console.log('🏠 Navigating to home...');
          router.replace('/(main)/home');
        } else {
          console.log('🔑 Navigating to login...');
          router.replace('/login');
        }
      }
    };

    // Use setTimeout to ensure state updates have completed
    const timeoutId = setTimeout(checkAuth, 100);
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, isLoading, router]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}