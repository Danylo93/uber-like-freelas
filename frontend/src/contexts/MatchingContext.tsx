import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

export type MatchingState = 
  | 'idle'           // Initial state
  | 'searching'      // Looking for providers
  | 'providers_found' // Providers available for selection
  | 'provider_selected' // Provider selected, waiting for confirmation
  | 'confirmed'      // Service confirmed, provider on the way
  | 'in_progress'    // Service in progress
  | 'completed'      // Service completed
  | 'cancelled';     // Service cancelled

export interface ServiceProvider {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  distance: number;
  estimatedTime: number;
  price: number;
  category: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  isOnline: boolean;
  phone?: string;
}

export interface ServiceMatch {
  id: string;
  clientId: string;
  providerId: string;
  category: string;
  title: string;
  description: string;
  status: MatchingState;
  clientLocation: {
    latitude: number;
    longitude: number;
  };
  address: string;
  estimatedPrice: number;
  finalPrice?: number;
  createdAt: Date;
  confirmedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface MatchingContextType {
  // State
  currentState: MatchingState;
  userLocation: Location.LocationObject | null;
  availableProviders: ServiceProvider[];
  selectedProvider: ServiceProvider | null;
  currentMatch: ServiceMatch | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  requestService: (category: string, title: string, description: string, address: string) => Promise<void>;
  selectProvider: (providerId: string) => Promise<void>;
  confirmService: () => Promise<void>;
  cancelService: () => Promise<void>;
  completeService: () => Promise<void>;
  refreshProviders: () => Promise<void>;
  updateLocation: (location: Location.LocationObject) => Promise<void>;
  resetState: () => void;
}

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

interface MatchingProviderProps {
  children: ReactNode;
}

export const MatchingProvider: React.FC<MatchingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  
  // State
  const [currentState, setCurrentState] = useState<MatchingState>('idle');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [availableProviders, setAvailableProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [currentMatch, setCurrentMatch] = useState<ServiceMatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize location
  useEffect(() => {
    initializeLocation();
  }, []);

  // Auto-refresh providers when in searching state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentState === 'searching') {
      interval = setInterval(() => {
        refreshProviders();
      }, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentState]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização é necessária');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setUserLocation(location);
      await updateLocationInBackend(location);
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Erro ao obter localização');
    }
  };

  const updateLocationInBackend = async (location: Location.LocationObject) => {
    try {
      await apiService.updateLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      console.error('Error updating location in backend:', err);
    }
  };

  const requestService = async (category: string, title: string, description: string, address: string) => {
    if (!userLocation) {
      setError('Localização não disponível');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCurrentState('searching');

      // Create service request
      const serviceRequest = await apiService.createServiceRequest({
        category,
        title,
        description,
        location: {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        address,
      });

      // Create match object
      const match: ServiceMatch = {
        id: serviceRequest.id,
        clientId: user!.id,
        providerId: '',
        category,
        title,
        description,
        status: 'searching',
        clientLocation: {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        },
        address,
        estimatedPrice: 0,
        createdAt: new Date(),
      };

      setCurrentMatch(match);
      
      // Start looking for providers
      await refreshProviders();
      
      // Simulate provider search
      setTimeout(() => {
        setCurrentState('providers_found');
      }, 2000);

    } catch (err) {
      console.error('Error requesting service:', err);
      setError('Erro ao solicitar serviço');
      setCurrentState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProviders = async () => {
    if (!userLocation) return;

    try {
      // In a real app, this would call an API to get nearby providers
      // For now, we'll generate mock data based on location
      const mockProviders: ServiceProvider[] = [
        {
          id: '1',
          name: 'João Silva',
          avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          rating: 4.8,
          reviewCount: 127,
          distance: 0.8,
          estimatedTime: 12,
          price: 85,
          category: 'Limpeza',
          coordinate: {
            latitude: userLocation.coords.latitude + 0.005,
            longitude: userLocation.coords.longitude + 0.005,
          },
          isOnline: true,
          phone: '+55 11 99999-1111',
        },
        {
          id: '2',
          name: 'Maria Santos',
          avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
          rating: 4.9,
          reviewCount: 203,
          distance: 1.2,
          estimatedTime: 18,
          price: 75,
          category: 'Limpeza',
          coordinate: {
            latitude: userLocation.coords.latitude - 0.008,
            longitude: userLocation.coords.longitude + 0.003,
          },
          isOnline: true,
          phone: '+55 11 99999-2222',
        },
        {
          id: '3',
          name: 'Carlos Oliveira',
          avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
          rating: 4.7,
          reviewCount: 89,
          distance: 2.1,
          estimatedTime: 25,
          price: 95,
          category: 'Limpeza',
          coordinate: {
            latitude: userLocation.coords.latitude + 0.012,
            longitude: userLocation.coords.longitude - 0.007,
          },
          isOnline: true,
          phone: '+55 11 99999-3333',
        },
      ];

      setAvailableProviders(mockProviders);
    } catch (err) {
      console.error('Error refreshing providers:', err);
    }
  };

  const selectProvider = async (providerId: string) => {
    const provider = availableProviders.find(p => p.id === providerId);
    if (!provider) return;

    try {
      setSelectedProvider(provider);
      setCurrentState('provider_selected');

      if (currentMatch) {
        setCurrentMatch({
          ...currentMatch,
          providerId: provider.id,
          estimatedPrice: provider.price,
        });
      }
    } catch (err) {
      console.error('Error selecting provider:', err);
      setError('Erro ao selecionar prestador');
    }
  };

  const confirmService = async () => {
    if (!selectedProvider || !currentMatch) return;

    try {
      setIsLoading(true);
      setCurrentState('confirmed');

      // Update match
      setCurrentMatch({
        ...currentMatch,
        status: 'confirmed',
        confirmedAt: new Date(),
      });

      // In real app, notify provider and start tracking
      setTimeout(() => {
        setCurrentState('in_progress');
        setCurrentMatch(prev => prev ? {
          ...prev,
          status: 'in_progress',
          startedAt: new Date(),
        } : null);
      }, 3000);

    } catch (err) {
      console.error('Error confirming service:', err);
      setError('Erro ao confirmar serviço');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelService = async () => {
    try {
      setCurrentState('cancelled');
      
      if (currentMatch) {
        setCurrentMatch({
          ...currentMatch,
          status: 'cancelled',
        });
      }

      // Reset after a moment
      setTimeout(() => {
        resetState();
      }, 2000);

    } catch (err) {
      console.error('Error cancelling service:', err);
      setError('Erro ao cancelar serviço');
    }
  };

  const completeService = async () => {
    try {
      setCurrentState('completed');
      
      if (currentMatch) {
        setCurrentMatch({
          ...currentMatch,
          status: 'completed',
          completedAt: new Date(),
          finalPrice: currentMatch.estimatedPrice,
        });
      }

      // Auto-reset after completion
      setTimeout(() => {
        resetState();
      }, 5000);

    } catch (err) {
      console.error('Error completing service:', err);
      setError('Erro ao finalizar serviço');
    }
  };

  const updateLocation = async (location: Location.LocationObject) => {
    setUserLocation(location);
    await updateLocationInBackend(location);
  };

  const resetState = () => {
    setCurrentState('idle');
    setAvailableProviders([]);
    setSelectedProvider(null);
    setCurrentMatch(null);
    setError(null);
    setIsLoading(false);
  };

  const value: MatchingContextType = {
    // State
    currentState,
    userLocation,
    availableProviders,
    selectedProvider,
    currentMatch,
    isLoading,
    error,

    // Actions
    requestService,
    selectProvider,
    confirmService,
    cancelService,
    completeService,
    refreshProviders,
    updateLocation,
    resetState,
  };

  return (
    <MatchingContext.Provider value={value}>
      {children}
    </MatchingContext.Provider>
  );
};

export const useMatching = (): MatchingContextType => {
  const context = useContext(MatchingContext);
  if (!context) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
};