import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeProvider';
import { useAuth } from '../../contexts/AuthContext';
import { serviceActionsAPI, ServiceRequest } from '../../services/serviceActions';

const serviceCategories = [
  { id: 'limpeza', name: 'Limpeza', icon: '🧹', price: 80, description: 'Limpeza residencial completa' },
  { id: 'encanamento', name: 'Encanamento', icon: '🔧', price: 120, description: 'Reparo e instalação hidráulica' },
  { id: 'eletrica', name: 'Elétrica', icon: '⚡', price: 100, description: 'Instalação e reparo elétrico' },
  { id: 'pintura', name: 'Pintura', icon: '🎨', price: 150, description: 'Pintura de paredes e móveis' },
  { id: 'jardinagem', name: 'Jardinagem', icon: '🌱', price: 90, description: 'Cuidado com plantas e jardins' },
  { id: 'montagem', name: 'Montagem', icon: '🔨', price: 70, description: 'Montagem de móveis' }
];

export default function ClientHomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceCategory, setServiceCategory] = useState('limpeza');
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myServices, setMyServices] = useState([]);

  useEffect(() => {
    initLocation();
    loadMyServices();
  }, []);

  const initLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da localização para encontrar prestadores próximos');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
    }
  };

  const loadMyServices = async () => {
    try {
      // Aqui podemos carregar os serviços do cliente via API
      // Por enquanto, vamos manter vazio
      setMyServices([]);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const handleRequestService = async () => {
    if (!serviceTitle.trim()) {
      Alert.alert('Erro', 'Por favor, adicione um título para o serviço');
      return;
    }

    const selectedCat = serviceCategories.find(cat => cat.id === serviceCategory);
    const requestData: ServiceRequest = {
      title: serviceTitle,
      category: serviceCategory,
      description: serviceDescription,
      budget: selectedCat?.price || 80,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude,
      address: 'São Paulo, SP'
    };

    try {
      setLoading(true);
      const response = await serviceActionsAPI.createServiceRequest(requestData);
      
      Alert.alert(
        '🎉 Solicitação Enviada!',  
        `${response.message}\n\nID: ${response.id}\nTempo estimado: ${response.estimated_response_time}`,
        [
          { 
            text: 'OK',
            onPress: () => {
              setShowServiceForm(false);
              setServiceTitle('');
              setServiceDescription('');
              loadMyServices(); // Recarregar lista
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating service request:', error);
      Alert.alert('Erro', 'Não foi possível criar a solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: 20, backgroundColor: theme.colors.primary },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
    subtitle: { fontSize: 16, color: 'white', opacity: 0.9 },
    content: { flex: 1, padding: 16 },
    
    // Seção de categorias
    categoriesSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.onBackground, marginBottom: 12 },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryCard: { 
      width: '48%', 
      backgroundColor: theme.colors.surface, 
      padding: 16, 
      borderRadius: 12, 
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    categoryIcon: { fontSize: 24, textAlign: 'center', marginBottom: 8 },
    categoryName: { fontSize: 14, fontWeight: '600', color: theme.colors.onSurface, textAlign: 'center', marginBottom: 4 },
    categoryPrice: { fontSize: 12, color: theme.colors.primary, textAlign: 'center', fontWeight: 'bold' },
    
    // Botão principal
    mainButton: { 
      backgroundColor: theme.colors.primary, 
      padding: 16, 
      borderRadius: 12, 
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3
    },
    mainButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    
    // Modal de formulário
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, maxHeight: '80%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.onSurface, marginBottom: 16, textAlign: 'center' },
    
    formGroup: { marginBottom: 16 },
    label: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 8 },
    input: { 
      borderWidth: 1, 
      borderColor: theme.colors.outline, 
      borderRadius: 8, 
      padding: 12, 
      fontSize: 16,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.background
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    
    // Seletor de categoria
    categorySelector: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    categoryOption: { 
      width: '30%', 
      padding: 12, 
      borderRadius: 8, 
      borderWidth: 1, 
      borderColor: theme.colors.outline,
      marginBottom: 8,
      alignItems: 'center'
    },
    categoryOptionSelected: { 
      borderColor: theme.colors.primary, 
      backgroundColor: theme.colors.primary + '20' 
    },
    categoryOptionIcon: { fontSize: 20, marginBottom: 4 },
    categoryOptionName: { fontSize: 12, color: theme.colors.onSurface, textAlign: 'center' },
    
    // Botões do modal
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    modalButton: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4 },
    cancelButton: { backgroundColor: theme.colors.outline },
    submitButton: { backgroundColor: theme.colors.primary },
    modalButtonText: { textAlign: 'center', fontWeight: '600' },
    cancelButtonText: { color: theme.colors.onSurface },
    submitButtonText: { color: 'white' },
    
    // Status
    status: { 
      fontSize: 12, 
      color: theme.colors.onSurfaceVariant, 
      textAlign: 'center',
      padding: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 16
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Olá, {user?.name}! 👋</Text>
        <Text style={styles.subtitle}>Que serviço você precisa hoje?</Text>
      </View>

      <Text style={styles.status}>
        🙋‍♂️ Modo Cliente | 📍 {userLocation ? 'Localização ativa' : 'Obtendo localização...'}
      </Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categorias Populares</Text>
          <View style={styles.categoriesGrid}>
            {serviceCategories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => {
                  setServiceCategory(category.id);
                  setServiceTitle(category.description);
                  setShowServiceForm(true);
                }}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryPrice}>R$ {category.price},00</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.mainButton} 
          onPress={() => setShowServiceForm(true)}
          disabled={loading}
        >
          <Text style={styles.mainButtonText}>
            {loading ? '⏳ Criando solicitação...' : '➕ Solicitar Serviço Personalizado'}
          </Text>
        </TouchableOpacity>

        {/* Aqui podemos adicionar seção "Meus Serviços" futuramente */}
      </ScrollView>

      {/* Modal de Formulário */}
      <Modal
        visible={showServiceForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowServiceForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Solicitação de Serviço</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Título do Serviço</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Limpeza completa do apartamento"
                  value={serviceTitle}
                  onChangeText={setServiceTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.categorySelector}>
                  {serviceCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        serviceCategory === category.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => setServiceCategory(category.id)}
                    >
                      <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                      <Text style={styles.categoryOptionName}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descrição Detalhada</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descreva o que precisa ser feito..."
                  value={serviceDescription}
                  onChangeText={setServiceDescription}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowServiceForm(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={handleRequestService}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.submitButtonText]}>
                  {loading ? 'Enviando...' : 'Solicitar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}