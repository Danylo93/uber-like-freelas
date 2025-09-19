import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { useRouter } from 'expo-router';

export const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email, password);
      // After successful login, navigate to home
      router.replace('/(main)/home');
    } catch (error) {
      Alert.alert('Erro', 'Email ou senha incorretos');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      Alert.alert('Erro', 'Falha no login com Google');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme?.colors?.background || '#FFFFFF',
    },
    scrollContent: {
      flexGrow: 1,
      padding: theme?.spacing?.md || 16,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: theme?.spacing?.xl || 32,
    },
    title: {
      ...(theme?.typography?.displayMedium || {}),
      color: theme?.colors?.onBackground || '#1C1B1F',
      textAlign: 'center',
      marginBottom: theme?.spacing?.sm || 8,
    },
    subtitle: {
      ...(theme?.typography?.bodyLarge || {}),
      color: theme?.colors?.onSurfaceVariant || '#49454F',
      textAlign: 'center',
    },
    form: {
      gap: theme?.spacing?.md || 16,
    },
    buttonContainer: {
      gap: theme?.spacing?.sm || 8,
      marginTop: theme?.spacing?.md || 16,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme?.spacing?.md || 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme?.colors?.outlineVariant || '#CAC4D0',
    },
    dividerText: {
      ...(theme?.typography?.bodyMedium || {}),
      color: theme?.colors?.onSurfaceVariant || '#49454F',
      marginHorizontal: theme?.spacing?.md || 16,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: theme?.spacing?.lg || 24,
    },
    footerText: {
      ...(theme?.typography?.bodyMedium || {}),
      color: theme?.colors?.onSurfaceVariant || '#49454F',
    },
    linkText: {
      ...(theme?.typography?.bodyMedium || {}),
      color: theme?.colors?.primary || '#6750A4',
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Bem-vindo!</Text>
            <Text style={styles.subtitle}>
              Entre para acessar todos os serviços
            </Text>
          </View>

          <Card>
            <View style={styles.form}>
              <TextInput
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                label="Senha"
                placeholder="Sua senha"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
              />

              <View style={styles.buttonContainer}>
                <Button
                  title="Entrar"
                  onPress={handleLogin}
                  loading={isLoading}
                  fullWidth
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  title="Continuar com Google"
                  onPress={handleGoogleLogin}
                  variant="outlined"
                  fullWidth
                />
              </View>
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta? </Text>
            <Text 
              style={styles.linkText}
              onPress={() => router.push('/register')}
            >
              Criar conta
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};