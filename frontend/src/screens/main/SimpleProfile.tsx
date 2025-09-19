import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { serviceActionsAPI } from '../../services/serviceActions';

export default function SimpleProfile() {
  const themeContext = useTheme();
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const theme = themeContext?.theme || {
    colors: { background: '#F6F6F6', surface: '#FFFFFF', primary: '#6750A4', onSurface: '#1C1B1F', onSurfaceVariant: '#49454F', outline: '#79747E' },
    spacing: { md: 16 }, typography: { displayMedium: { fontSize: 20, fontWeight: 'bold' }, bodyMedium: { fontSize: 14 } }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleRoleSwitch = async () => {
    console.log('🔄 Role switch button pressed');
    Alert.alert(
      'Trocar Perfil',
      `Deseja trocar para ${user?.role === 'client' ? 'Prestador' : 'Cliente'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            try {
              setLoading(true);
              console.log('🔄 Calling API to switch role...');
              
              const response = await serviceActionsAPI.switchUserRole();
              console.log('🔄 API response:', response);
              
              // Show success message first
              Alert.alert(
                'Sucesso!',
                `${response.message}\n\nReinicie o app ou navegue entre as telas para ver a mudança.`,
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      try {
                        console.log('🔄 Refreshing user data...');
                        if (refreshUser) {
                          await refreshUser();
                          console.log('🔄 User data refreshed successfully');
                        }
                      } catch (error) {
                        console.error('🔄 Error refreshing user:', error);
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('🔄 Error switching role:', error);
              Alert.alert('Erro', `Não foi possível trocar o perfil: ${error.message}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.md },
    title: { ...theme.typography.displayMedium, color: theme.colors.onSurface, marginBottom: 20, textAlign: 'center' },
    profileCard: { backgroundColor: theme.colors.surface, padding: 20, borderRadius: 12, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    avatar: { fontSize: 60, marginBottom: 16 },
    userName: { fontSize: 18, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 },
    userRole: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    userEmail: { fontSize: 14, color: theme.colors.onSurfaceVariant },
    menuItem: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    menuItemText: { fontSize: 16, color: theme.colors.onSurface },
    menuItemIcon: { fontSize: 20 },
    dangerItem: { backgroundColor: '#FFEBEE' },
    dangerText: { color: '#C62828' },
    switchItem: { backgroundColor: '#E8F5E8' },
    switchText: { color: '#2E7D32' },
    
    // Current role info
    currentRoleInfo: { 
      backgroundColor: theme.colors.surfaceVariant, 
      padding: 16, 
      borderRadius: 12, 
      marginTop: 16,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary
    },
    currentRoleText: { 
      fontSize: 16, 
      fontWeight: 'bold', 
      color: theme.colors.onSurface,
      marginBottom: 4 
    },
    currentRoleSubtext: { 
      fontSize: 14, 
      color: theme.colors.onSurfaceVariant 
    }
  });

  const isProvider = user?.role === 'provider';

  const menuItems = [
    { title: 'Editar Perfil', icon: '👤', onPress: () => Alert.alert('Info', 'Funcionalidade em desenvolvimento') },
    { title: 'Configurações', icon: '⚙️', onPress: () => Alert.alert('Info', 'Funcionalidade em desenvolvimento') },
    { title: 'Histórico de Pagamentos', icon: '💳', onPress: () => Alert.alert('Info', 'Funcionalidade em desenvolvimento') },
    { title: 'Suporte', icon: '🆘', onPress: () => Alert.alert('Info', 'Funcionalidade em desenvolvimento') },
    { title: 'Sobre', icon: 'ℹ️', onPress: () => Alert.alert('Sobre', 'Marketplace de Serviços v1.0.0') }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Conta</Text>

        <View style={styles.profileCard}>
          <Text style={styles.avatar}>{isProvider ? '🔧' : '👤'}</Text>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.userRole}>
            {isProvider ? '🛠️ Prestador de Serviços' : '👋 Cliente'}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Text style={styles.menuItemIcon}>{item.icon}</Text>
          </TouchableOpacity>
        ))}

        {/* BOTÃO DE TESTE SIMPLES */}
        <TouchableOpacity 
          style={{ 
            backgroundColor: 'red', 
            padding: 20, 
            margin: 10, 
            borderRadius: 10,
            zIndex: 1000
          }}
          onPress={() => {
            console.log('🚨 BOTÃO VERMELHO CLICADO!');
            Alert.alert('FUNCIONOU!', 'O botão vermelho funciona!');
          }}
        >
          <Text style={{ color: 'white', fontSize: 18, textAlign: 'center' }}>
            🚨 TESTE CLIQUE AQUI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, styles.switchItem]} 
          onPress={() => {
            console.log('🔧 BUTTON PRESSED - Role switch button clicked!');
            // Pular o Alert de teste e ir direto para o handleRoleSwitch
            handleRoleSwitch();
          }} 
          disabled={loading}
        >
          <Text style={[styles.menuItemText, styles.switchText]}>
            {loading ? '⏳ Alterando...' : `🔄 Trocar para ${isProvider ? 'Cliente' : 'Prestador'}`}
          </Text>
          <Text style={styles.menuItemIcon}>
            {isProvider ? '🙋‍♂️' : '👷‍♂️'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.currentRoleInfo}>
          <Text style={styles.currentRoleText}>
            Perfil atual: {isProvider ? '👷‍♂️ Prestador de Serviços' : '🙋‍♂️ Cliente'}
          </Text>
          <Text style={styles.currentRoleSubtext}>
            {isProvider 
              ? 'Você pode aceitar solicitações e prestar serviços'
              : 'Você pode solicitar serviços dos prestadores'
            }
          </Text>
        </View>

        <TouchableOpacity style={[styles.menuItem, styles.dangerItem]} onPress={handleLogout}>
          <Text style={[styles.menuItemText, styles.dangerText]}>Sair</Text>
          <Text style={styles.menuItemIcon}>🚪</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}