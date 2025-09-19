import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, TextInput as RNTextInput } from 'react-native';
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
  const [currentState, setCurrentState] = useState<'idle' | 'searching' | 'provider_found' | 'in_progress' | 'completed'>('idle');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  
  // Service form states
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('limpeza');
  const [serviceDescription, setServiceDescription] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);

  const theme = themeContext?.theme || {
    colors: {
      background: '#F6F6F6', surface: '#FFFFFF', primary: '#6750A4',
      onSurface: '#1C1B1F', onSurfaceVariant: '#49454F', success: '#4CAF50', warning: '#FF9800'
    },
    spacing: { md: 16, lg: 24 },
    typography: { displayMedium: { fontSize: 20, fontWeight: 'bold' }, bodyLarge: { fontSize: 16 } }
  };

  const serviceCategories = [
    { id: 'limpeza', name: 'Limpeza', icon: '🧹', price: 80 },
    { id: 'jardinagem', name: 'Jardinagem', icon: '🌱', price: 120 },
    { id: 'pintura', name: 'Pintura', icon: '🎨', price: 200 },
    { id: 'eletrica', name: 'Elétrica', icon: '⚡', price: 150 },
    { id: 'encanamento', name: 'Encanamento', icon: '🔧', price: 100 }
  ];

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

  // Provider actions
  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    Alert.alert(
      'Status atualizado',
      `Agora você está ${!isOnline ? 'online e pode receber solicitações' : 'offline'}`,
      [{ text: 'OK' }]
    );
  };

  // Client actions
  const handleOpenServiceForm = () => {
    setShowServiceForm(true);
  };

  const handleRequestService = () => {
    if (!serviceTitle.trim()) {
      Alert.alert('Erro', 'Por favor, adicione um título para o serviço');
      return;
    }

    const selectedCat = serviceCategories.find(cat => cat.id === serviceCategory);
    
    Alert.alert(
      'Confirmar Solicitação',
      `Serviço: ${serviceTitle}\nCategoria: ${selectedCat?.name}\nPreço estimado: R$ ${selectedCat?.price},00\n\nConfirmar solicitação?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            setShowServiceForm(false);
            setCurrentState('searching');
            
            // Simulate finding provider
            setTimeout(() => {
              setSelectedProvider({
                name: 'João Silva',
                rating: 4.8,
                distance: '2.3 km',
                eta: '15 min',
                price: selectedCat?.price || 80
              });
              setCurrentState('provider_found');
            }, 3000);
          }
        }
      ]
    );
  };

  const handleAcceptProvider = () => {
    setCurrentState('in_progress');
    Alert.alert(
      'Serviço Confirmado!',
      `${selectedProvider?.name} está a caminho!\nTempo estimado: ${selectedProvider?.eta}`,
      [{ text: 'OK' }]
    );
  };

  const handleRejectProvider = () => {
    setCurrentState('searching');
    setSelectedProvider(null);
    
    // Simulate finding another provider
    setTimeout(() => {
      setSelectedProvider({
        name: 'Maria Santos',
        rating: 4.9,
        distance: '3.1 km', 
        eta: '20 min',
        price: serviceCategories.find(cat => cat.id === serviceCategory)?.price || 80
      });
      setCurrentState('provider_found');
    }, 2000);
  };

  const handleCancelService = () => {
    Alert.alert(
      'Cancelar Serviço',
      'Tem certeza que deseja cancelar o serviço?',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim, cancelar', 
          style: 'destructive',
          onPress: () => {
            setCurrentState('idle');
            setSelectedProvider(null);
            setServiceTitle('');
            setServiceDescription('');
          }
        }
      ]
    );
  };

  const handleCompleteService = () => {
    setCurrentState('completed');
    Alert.alert(
      'Serviço Concluído!',
      'Como foi sua experiência? Avalie o prestador:',
      [
        { text: 'Avaliar depois', onPress: () => setCurrentState('idle') },
        { text: 'Avaliar agora', onPress: () => {
          // TODO: Open rating modal
          Alert.alert('Avaliação', 'Funcionalidade de avaliação em desenvolvimento');
          setCurrentState('idle');
        }}
      ]
    );
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
    dangerButton: { backgroundColor: '#f44336' },
    successButton: { backgroundColor: theme.colors.success },
    warningButton: { backgroundColor: theme.colors.warning },
    status: { textAlign: 'center', fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 10 },
    onlineStatus: { backgroundColor: '#E8F5E8', padding: 8, borderRadius: 6, marginBottom: 10 },
    onlineText: { textAlign: 'center', color: '#2E7D32', fontWeight: '600' },
    
    // Modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: theme.colors.surface, margin: 20, padding: 24, borderRadius: 12, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface, marginBottom: 16, textAlign: 'center' },
    input: { borderWidth: 1, borderColor: theme.colors.onSurfaceVariant, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.primary },
    categoryChipSelected: { backgroundColor: theme.colors.primary },
    categoryChipText: { color: theme.colors.primary, fontSize: 14 },
    categoryChipTextSelected: { color: 'white' },
    
    // Provider card
    providerCard: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    providerName: { fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface, marginBottom: 8 },
    providerInfo: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    providerPrice: { fontSize: 16, fontWeight: 'bold', color: theme.colors.primary, marginTop: 8 }
  });

  const isClient = user?.role === 'client';

  const renderProviderView = () => (
    <View style={styles.bottomSheet}>
      <Text style={styles.title}>Modo Prestador</Text>
      
      {isOnline && (
        <View style={styles.onlineStatus}>
          <Text style={styles.onlineText}>🟢 Online - Aguardando solicitações</Text>
        </View>
      )}
      
      <Text style={styles.subtitle}>
        {isOnline ? 'Você está online e pode receber solicitações' : 'Você está offline'}
      </Text>
      
      <TouchableOpacity
        style={[styles.button, isOnline ? styles.warningButton : styles.successButton]}
        onPress={handleToggleOnline}
      >
        <Text style={styles.buttonText}>
          {isOnline ? '🔴 Ficar Offline' : '🟢 Ficar Online'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderClientView = () => {
    if (currentState === 'searching') {
      return (
        <View style={styles.bottomSheet}>
          <Text style={styles.title}>🔍 Procurando prestadores...</Text>
          <Text style={styles.subtitle}>Aguarde enquanto encontramos profissionais próximos</Text>
          <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={handleCancelService}>
            <Text style={[styles.buttonText, styles.outlineButtonText]}>Cancelar Busca</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentState === 'provider_found' && selectedProvider) {
      return (
        <View style={styles.bottomSheet}>
          <Text style={styles.title}>✅ Prestador Encontrado!</Text>
          <View style={styles.providerCard}>
            <Text style={styles.providerName}>👨‍🔧 {selectedProvider.name}</Text>
            <Text style={styles.providerInfo}>⭐ {selectedProvider.rating} • 📍 {selectedProvider.distance}</Text>
            <Text style={styles.providerInfo}>⏰ Chega em {selectedProvider.eta}</Text>
            <Text style={styles.providerPrice}>💰 R$ {selectedProvider.price},00</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.button, styles.outlineButton, { flex: 1 }]} onPress={handleRejectProvider}>
              <Text style={[styles.buttonText, styles.outlineButtonText]}>❌ Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={handleAcceptProvider}>
              <Text style={styles.buttonText}>✅ Aceitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (currentState === 'in_progress' && selectedProvider) {
      return (
        <View style={styles.bottomSheet}>
          <Text style={styles.title}>🚗 Prestador a Caminho</Text>
          <View style={styles.providerCard}>
            <Text style={styles.providerName}>👨‍🔧 {selectedProvider.name}</Text>
            <Text style={styles.providerInfo}>🚗 A caminho - {selectedProvider.eta}</Text>
            <Text style={styles.providerInfo}>📞 Você pode ligar para o prestador</Text>
          </View>
          <TouchableOpacity style={[styles.button, styles.successButton]} onPress={handleCompleteService}>
            <Text style={styles.buttonText}>✅ Marcar como Concluído</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleCancelService}>
            <Text style={styles.buttonText}>❌ Cancelar Serviço</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.bottomSheet}>
        <Text style={styles.title}>Que serviço você precisa?</Text>
        <Text style={styles.subtitle}>Encontre prestadores próximos a você</Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenServiceForm}>
          <Text style={styles.buttonText}>🛠️ Solicitar Serviço</Text>
        </TouchableOpacity>
        <Text style={styles.status}>
          🌐 Firebase: {isConnected ? '🟢 Conectado' : '🔴 Desconectado (usaremos Firebase RT)'}
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

      {/* Service Request Modal */}
      <Modal visible={showServiceForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Solicitação de Serviço</Text>
            
            <Text style={{ marginBottom: 8, fontWeight: '600' }}>Categoria:</Text>
            <View style={styles.categoryGrid}>
              {serviceCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    serviceCategory === category.id && styles.categoryChipSelected
                  ]}
                  onPress={() => setServiceCategory(category.id)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    serviceCategory === category.id && styles.categoryChipTextSelected
                  ]}>
                    {category.icon} {category.name} - R$ {category.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ marginBottom: 8, fontWeight: '600' }}>Título do Serviço:</Text>
            <RNTextInput
              style={styles.input}
              placeholder="Ex: Limpeza completa da casa"
              value={serviceTitle}
              onChangeText={setServiceTitle}
            />

            <Text style={{ marginBottom: 8, fontWeight: '600' }}>Descrição (opcional):</Text>
            <RNTextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Descreva detalhes do serviço..."
              value={serviceDescription}
              onChangeText={setServiceDescription}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.button, styles.outlineButton, { flex: 1 }]} 
                onPress={() => setShowServiceForm(false)}
              >
                <Text style={[styles.buttonText, styles.outlineButtonText]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={handleRequestService}>
                <Text style={styles.buttonText}>Solicitar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}