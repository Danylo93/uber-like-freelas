import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';

export default function SimpleUberHome() {
  const themeContext = useTheme();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentState, setCurrentState] = useState<'idle' | 'searching' | 'provider_found'>('idle');
  const [showServiceForm, setShowServiceForm] = useState(false);

  const theme = themeContext?.theme || {
    colors: {
      background: '#F6F6F6', surface: '#FFFFFF', primary: '#6750A4',
      onSurface: '#1C1B1F', onSurfaceVariant: '#49454F'
    },
    spacing: { md: 16, lg: 24 },
    typography: { displayMedium: { fontSize: 20, fontWeight: 'bold' }, bodyLarge: { fontSize: 16 } }
  };

  useEffect(() => {
    initLocation();
  }, []);

  const initLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      } else {
        setUserLocation({ latitude: -23.5505, longitude: -46.6333 });
      }
    } catch {
      setUserLocation({ latitude: -23.5505, longitude: -46.6333 });
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    mapContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F5E8' },
    mapText: { fontSize: 18, color: theme.colors.onSurface, marginBottom: 10 },
    locationText: { fontSize: 14, color: theme.colors.onSurfaceVariant },
    bottomSheet: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, minHeight: 200 },
    title: { ...theme.typography.displayMedium, color: theme.colors.onSurface, textAlign: 'center', marginBottom: 10 },
    subtitle: { ...theme.typography.bodyLarge, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 20 },
    button: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    outlineButton: { borderWidth: 1, borderColor: theme.colors.primary, backgroundColor: 'transparent' },
    outlineButtonText: { color: theme.colors.primary },
    status: { textAlign: 'center', fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 10 }
  });

  const isClient = user?.role === 'client';

  const renderProviderView = () => (
    <View style={styles.bottomSheet}>
      <Text style={styles.title}>Modo Prestador</Text>
      <Text style={styles.subtitle}>
        {currentState === 'idle' ? 'Você está Offline' : 'Online - Aguardando solicitações'}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setCurrentState(currentState === 'idle' ? 'provider_found' : 'idle')}
      >
        <Text style={styles.buttonText}>
          {currentState === 'idle' ? 'Ficar Online' : 'Ficar Offline'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderClientView = () => {
    if (currentState === 'searching') {
      return (
        <View style={styles.bottomSheet}>
          <Text style={styles.title}>Procurando prestadores...</Text>
          <Text style={styles.subtitle}>Aguarde enquanto encontramos profissionais próximos</Text>
          <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => setCurrentState('idle')}>
            <Text style={[styles.buttonText, styles.outlineButtonText]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentState === 'provider_found') {
      return (
        <View style={styles.bottomSheet}>
          <Text style={styles.title}>Prestador Encontrado!</Text>
          <Text style={styles.subtitle}>João Silva está disponível - R$ 45,00</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.button, styles.outlineButton, { flex: 1 }]} onPress={() => setCurrentState('idle')}>
              <Text style={[styles.buttonText, styles.outlineButtonText]}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={() => Alert.alert('Success', 'Serviço aceito!')}>
              <Text style={styles.buttonText}>Aceitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.bottomSheet}>
        <Text style={styles.title}>Que serviço você precisa?</Text>
        <Text style={styles.subtitle}>Encontre prestadores próximos a você</Text>
        <TouchableOpacity style={styles.button} onPress={() => setCurrentState('searching')}>
          <Text style={styles.buttonText}>Solicitar Serviço</Text>
        </TouchableOpacity>
        <Text style={styles.status}>
          🟢 WebSocket: {isConnected ? 'Conectado' : 'Desconectado'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <Text style={styles.mapText}>🗺️ Mapa Interativo</Text>
        <Text style={styles.locationText}>
          {userLocation ? 
            `📍 ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 
            'Obtendo localização...'}
        </Text>
      </View>
      {isClient ? renderClientView() : renderProviderView()}
    </SafeAreaView>
  );
}