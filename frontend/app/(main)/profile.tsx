import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, logout, switchRole } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleSwitchRole = async () => {
    const newRole = user?.role === 'client' ? 'provider' : 'client';
    const roleText = newRole === 'client' ? 'Cliente' : 'Prestador';
    
    Alert.alert(
      'Trocar função',
      `Deseja trocar para ${roleText}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Trocar', 
          onPress: async () => {
            try {
              await switchRole(newRole);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível trocar a função');
            }
          }
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: theme.spacing.md,
    },
    title: {
      ...theme.typography.displayMedium,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.lg,
    },
    userInfo: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    avatarText: {
      ...theme.typography.titleLarge,
      color: theme.colors.onPrimaryContainer,
    },
    userName: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    userEmail: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.sm,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
    },
    buttonContainer: {
      gap: theme.spacing.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Conta</Text>
        
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          <Chip
            label={user?.role === 'client' ? 'Cliente' : 'Prestador'}
            selected={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <Card>
            <View style={styles.buttonContainer}>
              <Button
                title={`Trocar para ${user?.role === 'client' ? 'Prestador' : 'Cliente'}`}
                onPress={handleSwitchRole}
                variant="outlined"
                fullWidth
              />
              
              <Button
                title="Sair"
                onPress={handleLogout}
                variant="outlined"
                fullWidth
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}