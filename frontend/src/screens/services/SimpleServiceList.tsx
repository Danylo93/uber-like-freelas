import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { serviceActionsAPI, NearbyService } from '../../services/serviceActions';

export default function SimpleServiceList() {
  const themeContext = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [services, setServices] = useState([]);
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);
  const [newServiceData, setNewServiceData] = useState({
    title: '',
    category: 'limpeza',
    description: '',
    budget: ''
  });

  useEffect(() => {
    loadServices();
  }, [user?.role]);

  const loadServices = async () => {
    if (user?.role === 'provider') {
      try {
        const response = await serviceActionsAPI.getNearbyServices();
        setServices(response.services || []);
      } catch (error) {
        console.error('Error loading services:', error);
        setServices([]);
      }
    } else {
      // For clients, we could load their own service requests
      // For now, keeping mock data for demonstration
      setServices([
        { id: '1', title: 'Limpeza Residencial', category: '🧹 Limpeza', price: 'R$ 80,00', status: 'Disponível', clientName: 'Você', location: 'Sua localização', description: 'Limpeza completa de apartamento 2 quartos' },
      ]);
    }
  };

  const theme = themeContext?.theme || {
    colors: { background: '#F6F6F6', surface: '#FFFFFF', primary: '#6750A4', onSurface: '#1C1B1F', onSurfaceVariant: '#49454F' },
    spacing: { md: 16 }, typography: { displayMedium: { fontSize: 20, fontWeight: 'bold' }, bodyMedium: { fontSize: 14 } }
  };

  const serviceCategories = [
    { id: 'limpeza', name: 'Limpeza', icon: '🧹' },
    { id: 'jardinagem', name: 'Jardinagem', icon: '🌱' },
    { id: 'pintura', name: 'Pintura', icon: '🎨' },
    { id: 'eletrica', name: 'Elétrica', icon: '⚡' },
    { id: 'encanamento', name: 'Encanamento', icon: '🔧' }
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      Alert.alert('✅ Atualizado', 'Lista de serviços atualizada com sucesso!');
      setRefreshing(false);
    }, 1000);
  };

  const handleServicePress = (service) => {
    const isProvider = user?.role === 'provider';
    
    if (isProvider) {
      // Provider actions
      if (service.status === 'Disponível') {
        Alert.alert(
          'Aceitar Solicitação',
          `Cliente: ${service.clientName}\nServiço: ${service.title}\nLocal: ${service.location}\nValor: ${service.price}\n\nDeseja aceitar esta solicitação?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Aceitar', 
              onPress: () => {
                setServices(prev => prev.map(s => 
                  s.id === service.id ? { ...s, status: 'Em andamento' } : s
                ));
                Alert.alert('✅ Sucesso', 'Solicitação aceita! O cliente foi notificado.');
              }
            }
          ]
        );
      } else if (service.status === 'Em andamento') {
        Alert.alert(
          'Gerenciar Serviço',
          `${service.title} - ${service.clientName}`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ligar para Cliente', onPress: () => Alert.alert('📞', 'Funcionalidade de ligação em desenvolvimento') },
            { text: '✅ Marcar Concluído', onPress: () => {
              setServices(prev => prev.map(s => 
                s.id === service.id ? { ...s, status: 'Concluído' } : s
              ));
              Alert.alert('🎉 Parabéns!', 'Serviço marcado como concluído. Aguarde a avaliação do cliente.');
            }}
          ]
        );
      } else {
        Alert.alert('Serviço Concluído', `${service.title} foi finalizado em ${service.location}`);
      }
    } else {
      // Client actions
      Alert.alert(
        service.title,
        `Categoria: ${service.category}\nStatus: ${service.status}\nValor: ${service.price}\nDescrição: ${service.description}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleNewService = () => {
    if (!newServiceData.title.trim()) {
      Alert.alert('Erro', 'Por favor, adicione um título para o serviço');
      return;
    }

    const selectedCategory = serviceCategories.find(cat => cat.id === newServiceData.category);
    const newService = {
      id: Date.now().toString(),
      title: newServiceData.title,
      category: `${selectedCategory?.icon} ${selectedCategory?.name}`,
      price: newServiceData.budget || 'A negociar',
      status: 'Disponível',
      clientName: user?.name || 'Você',
      location: 'Sua localização',
      description: newServiceData.description
    };

    setServices(prev => [newService, ...prev]);
    setShowNewServiceModal(false);
    setNewServiceData({ title: '', category: 'limpeza', description: '', budget: '' });
    
    Alert.alert('🎉 Sucesso!', 'Sua solicitação foi publicada e os prestadores próximos foram notificados!');
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.md },
    title: { ...theme.typography.displayMedium, color: theme.colors.onSurface, marginBottom: 20, textAlign: 'center' },
    card: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 },
    cardCategory: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    cardClient: { fontSize: 13, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    cardDescription: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 8, fontStyle: 'italic' },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    price: { fontSize: 16, fontWeight: '600', color: theme.colors.primary },
    status: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
    statusAvailable: { backgroundColor: '#E8F5E8', color: '#2E7D32' },
    statusProgress: { backgroundColor: '#FFF3E0', color: '#F57C00' },
    statusCompleted: { backgroundColor: '#E3F2FD', color: '#1976D2' },
    emptyState: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: 40, fontSize: 16 },
    button: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    
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
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Disponível': return [styles.status, styles.statusAvailable];
      case 'Em andamento': return [styles.status, styles.statusProgress];
      case 'Concluído': return [styles.status, styles.statusCompleted];
      default: return styles.status;
    }
  };

  const isProvider = user?.role === 'provider';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>
          {isProvider ? '📋 Solicitações' : '🛠️ Serviços Disponíveis'}
        </Text>

        {services.length > 0 ? (
          services.map((service) => (
            <TouchableOpacity key={service.id} style={styles.card} onPress={() => handleServicePress(service)}>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardCategory}>{service.category}</Text>
              {isProvider && <Text style={styles.cardClient}>👤 Cliente: {service.clientName} • 📍 {service.location}</Text>}
              <Text style={styles.cardDescription}>{service.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.price}>{service.price}</Text>
                <Text style={getStatusStyle(service.status)}>{service.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyState}>
            {isProvider ? 'Nenhuma solicitação no momento' : 'Nenhum serviço disponível'}
          </Text>
        )}

        <TouchableOpacity style={styles.button} onPress={() => {
          if (isProvider) {
            onRefresh();
          } else {
            setShowNewServiceModal(true);
          }
        }}>
          <Text style={styles.buttonText}>
            {isProvider ? '🔄 Atualizar Solicitações' : '➕ Solicitar Novo Serviço'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* New Service Modal */}
      <Modal visible={showNewServiceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Solicitação</Text>
            
            <Text style={{ marginBottom: 8, fontWeight: '600' }}>Categoria:</Text>
            <View style={styles.categoryGrid}>
              {serviceCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    newServiceData.category === category.id && styles.categoryChipSelected
                  ]}
                  onPress={() => setNewServiceData(prev => ({ ...prev, category: category.id }))}
                >
                  <Text style={[
                    styles.categoryChipText,
                    newServiceData.category === category.id && styles.categoryChipTextSelected
                  ]}>
                    {category.icon} {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ marginBottom: 8, fontWeight: '600' }}>Título:</Text>
            <RNTextInput
              style={styles.input}
              placeholder="Ex: Limpeza completa da casa"
              value={newServiceData.title}
              onChangeText={(text) => setNewServiceData(prev => ({ ...prev, title: text }))}
            />

            <Text style={{ marginBottom: 8, fontWeight: '600' }}>Orçamento (opcional):</Text>
            <RNTextInput
              style={styles.input}
              placeholder="Ex: R$ 100,00"
              value={newServiceData.budget}
              onChangeText={(text) => setNewServiceData(prev => ({ ...prev, budget: text }))}
            />

            <Text style={{ marginBottom: 8, fontWeight: '600' }}>Descrição:</Text>
            <RNTextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Descreva o que precisa..."
              value={newServiceData.description}
              onChangeText={(text) => setNewServiceData(prev => ({ ...prev, description: text }))}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.button, { backgroundColor: '#666', flex: 1 }]} 
                onPress={() => setShowNewServiceModal(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { flex: 1 }]} onPress={handleNewService}>
                <Text style={styles.buttonText}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}