import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { firebaseRealtimeService, RealTimeServiceRequest, ProviderLocation, ChatMessage } from '../services/firebaseService';
import { useAuth } from './AuthContext';

interface FirebaseContextType {
  // Connection status
  isConnected: boolean;
  isInitializing: boolean;
  
  // Service requests
  nearbyServices: RealTimeServiceRequest[];
  myServices: RealTimeServiceRequest[];
  
  // Provider tracking
  nearbyProviders: ProviderLocation[];
  
  // Real-time actions
  createServiceRequest: (serviceData: Omit<RealTimeServiceRequest, 'id' | 'createdAt' | 'updatedAt' | 'clientId' | 'clientName'>) => Promise<string>;
  updateServiceStatus: (serviceId: string, status: RealTimeServiceRequest['status']) => Promise<void>;
  updateProviderLocation: (location: { latitude: number; longitude: number; isOnline: boolean; name: string; rating: number }) => Promise<void>;
  
  // Chat
  sendMessage: (chatId: string, message: string) => Promise<void>;
  subscribeToChat: (chatId: string, callback: (messages: ChatMessage[]) => void) => () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [nearbyServices, setNearbyServices] = useState<RealTimeServiceRequest[]>([]);
  const [myServices, setMyServices] = useState<RealTimeServiceRequest[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<ProviderLocation[]>([]);

  useEffect(() => {
    let mounted = true;
    
    const initializeFirebase = async () => {
      try {
        // Check if Firebase is configured
        const hasFirebaseConfig = process.env.EXPO_PUBLIC_FIREBASE_API_KEY && 
                                 process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
        
        if (!hasFirebaseConfig) {
          console.log('Firebase not configured - using fallback mode');
          setIsConnected(false);
          setIsInitializing(false);
          return;
        }

        console.log('Initializing Firebase with credentials provided...');
        await firebaseRealtimeService.initialize();
        
        if (mounted) {
          setIsConnected(true);
          setIsInitializing(false);
          
          // Subscribe to relevant data based on user role
          if (user) {
            subscribeToRealtimeData();
          }
        }
      } catch (error) {
        console.error('Firebase initialization failed:', error);
        if (mounted) {
          setIsConnected(false);
          setIsInitializing(false);
        }
      }
    };

    initializeFirebase();

    return () => {
      mounted = false;
    };
  }, [user]);

  const subscribeToRealtimeData = () => {
    if (!user || !isConnected) return;

    // Subscribe to service requests
    const unsubscribeServices = firebaseRealtimeService.subscribeToServiceRequests((services) => {
      // Filter services based on user role
      if (user.role === 'provider') {
        // Show available services
        const availableServices = services.filter(s => s.status === 'pending' && s.clientId !== user.id);
        setNearbyServices(availableServices);
        
        // Show services user is working on
        const myProviderServices = services.filter(s => s.providerId === user.id);
        setMyServices(myProviderServices);
      } else {
        // Show user's own service requests
        const myClientServices = services.filter(s => s.clientId === user.id);
        setMyServices(myClientServices);
        setNearbyServices([]); // Clients don't need to see all services
      }
    });

    // Subscribe to nearby providers (for clients)
    let unsubscribeProviders: (() => void) | undefined;
    if (user.role === 'client') {
      unsubscribeProviders = firebaseRealtimeService.subscribeToNearbyProviders((providers) => {
        setNearbyProviders(providers);
      });
    }

    // Return cleanup function
    return () => {
      unsubscribeServices();
      if (unsubscribeProviders) {
        unsubscribeProviders();
      }
    };
  };

  const createServiceRequest = async (serviceData: Omit<RealTimeServiceRequest, 'id' | 'createdAt' | 'updatedAt' | 'clientId' | 'clientName'>): Promise<string> => {
    if (!user || !isConnected) {
      throw new Error('Firebase not connected or user not authenticated');
    }

    const fullServiceData = {
      ...serviceData,
      clientId: user.id,
      clientName: user.name
    };

    return await firebaseRealtimeService.createServiceRequest(fullServiceData);
  };

  const updateServiceStatus = async (serviceId: string, status: RealTimeServiceRequest['status']): Promise<void> => {
    if (!isConnected) {
      throw new Error('Firebase not connected');
    }

    await firebaseRealtimeService.updateServiceRequest(serviceId, { status });
  };

  const updateProviderLocation = async (location: { latitude: number; longitude: number; isOnline: boolean; name: string; rating: number }): Promise<void> => {
    if (!user || !isConnected) {
      throw new Error('Firebase not connected or user not authenticated');
    }

    await firebaseRealtimeService.updateProviderLocation(user.id, location);
  };

  const sendMessage = async (chatId: string, message: string): Promise<void> => {
    if (!user || !isConnected) {
      throw new Error('Firebase not connected or user not authenticated');
    }

    await firebaseRealtimeService.sendMessage(chatId, {
      senderId: user.id,
      senderName: user.name,
      message,
      read: false
    });
  };

  const subscribeToChat = (chatId: string, callback: (messages: ChatMessage[]) => void): () => void => {
    if (!isConnected) {
      return () => {};
    }

    return firebaseRealtimeService.subscribeToChat(chatId, callback);
  };

  const value: FirebaseContextType = {
    isConnected,
    isInitializing,
    nearbyServices,
    myServices,
    nearbyProviders,
    createServiceRequest,
    updateServiceStatus,
    updateProviderLocation,
    sendMessage,
    subscribeToChat
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};