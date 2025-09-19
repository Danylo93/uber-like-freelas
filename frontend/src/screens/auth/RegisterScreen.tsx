import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { useRouter } from 'expo-router';

export const RegisterScreen: React.FC = () => {
  const { theme } = useTheme();
  const { register, loginWithGoogle, isLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client' as UserRole,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register(formData.email, formData.password, formData.name, formData.role);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar conta. Tente novamente.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      Alert.alert('Erro', 'Falha no login com Google');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
      marginBottom: theme?.spacing?.lg || 24,
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
    roleSection: {
      gap: theme?.spacing?.sm || 8,
    },
    roleLabel: {
      ...(theme?.typography?.bodyMedium || {}),
      color: theme?.colors?.onSurface || '#1C1B1F',
      fontWeight: '500',
    },
    roleChips: {
      flexDirection: 'row',
      gap: theme?.spacing?.sm || 8,
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
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>
              Junte-se à nossa comunidade de serviços
            </Text>
          </View>

          <Card>
            <View style={styles.form}>
              <TextInput
                label="Nome completo"
                placeholder="Seu nome"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                error={errors.name}
                autoCapitalize="words"
              />

              <TextInput
                label="Email"
                placeholder="seu@email.com"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TextInput
                label="Senha"
                placeholder="Crie uma senha"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                error={errors.password}
                secureTextEntry
              />

              <TextInput
                label="Confirmar senha"
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry
              />

              <View style={styles.roleSection}>
                <Text style={styles.roleLabel}>Como você quer usar o app?</Text>
                <View style={styles.roleChips}>
                  <Chip
                    label="Solicitar serviços"
                    selected={formData.role === 'client'}
                    onPress={() => updateFormData('role', 'client')}
                    variant="filter"
                  />
                  <Chip
                    label="Prestar serviços"
                    selected={formData.role === 'provider'}
                    onPress={() => updateFormData('role', 'provider')}
                    variant="filter"
                  />
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <Button
                  title="Criar conta"
                  onPress={handleRegister}
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
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <Text 
              style={styles.linkText}
              onPress={() => router.push('/login')}
            >
              Fazer login
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};