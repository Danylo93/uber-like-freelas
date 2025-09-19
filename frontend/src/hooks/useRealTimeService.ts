import { useState, useEffect, useCallback } from 'react';
import { useWebSocket, WebSocketMessage } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

export interface ServiceRequest {
  id: string;
  client_id: string;
  provider_id?: string;
  service_type: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'pending' | 'accepted' | 'on_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  price?: number;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceOffer {
  id: string;
  service_request_id: string;
  provider_id: string;
  provider_name: string;
  price: number;
  estimated_time: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export const useRealTimeService = () => {
  const { user } = useAuth();
  const { isConnected, onMessage, sendMessage, sendLocationUpdate, updateProviderStatus, respondToService } = useWebSocket();
  
  const [activeService, setActiveService] = useState<ServiceRequest | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<ServiceRequest[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<ServiceOffer[]>([]);
  const [isProviderOnline, setIsProviderOnline] = useState(false);
  const [nearbyProviders, setNearbyProviders] = useState<any[]>([]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = onMessage((message: WebSocketMessage) => {
      console.log('🔔 Real-time service message:', message);

      switch (message.type) {
        case 'new_service_request':
          handleNewServiceRequest(message.data.service);
          break;
          
        case 'service_status_update':
          handleServiceStatusUpdate(message.data);
          break;
          
        case 'service_offer':
          handleServiceOffer(message.data);
          break;
          
        case 'provider_status_change':
          handleProviderStatusChange(message.data);
          break;
          
        case 'location_update':
          handleLocationUpdate(message.data);
          break;
          
        default:
          console.log('Unhandled message type:', message.type);
      }
    });

    return unsubscribe;
  }, [isConnected]);

  const handleNewServiceRequest = (service: ServiceRequest) => {
    // Only show to providers
    if (user?.role === 'provider' && isProviderOnline) {
      setIncomingRequests(prev => {
        // Avoid duplicates
        if (prev.find(req => req.id === service.id)) {
          return prev;
        }
        return [...prev, service];
      });
      
      // Auto-remove after 30 seconds if not responded
      setTimeout(() => {
        setIncomingRequests(prev => prev.filter(req => req.id !== service.id));
      }, 30000);
    }
  };

  const handleServiceStatusUpdate = (data: any) => {
    const { service_id, status, service } = data;
    
    if (activeService && activeService.id === service_id) {
      setActiveService(prev => prev ? { ...prev, status, ...service } : null);
    }
  };

  const handleServiceOffer = (offer: ServiceOffer) => {
    // Only show to clients
    if (user?.role === 'client') {
      setReceivedOffers(prev => {
        // Avoid duplicates
        if (prev.find(o => o.id === offer.id)) {
          return prev;
        }
        return [...prev, offer];
      });
    }
  };

  const handleProviderStatusChange = (data: any) => {
    const { provider_id, is_online } = data;
    
    setNearbyProviders(prev => 
      prev.map(provider => 
        provider.id === provider_id 
          ? { ...provider, is_online }
          : provider
      )
    );
  };

  const handleLocationUpdate = (data: any) => {
    const { user_id, latitude, longitude } = data;
    
    // Update provider location if tracking active service
    if (activeService && activeService.provider_id === user_id) {
      setActiveService(prev => prev ? {
        ...prev,
        provider_location: { latitude, longitude }
      } : null);
    }
  };

  // Client functions
  const createServiceRequest = async (serviceData: {
    service_type: string;
    description: string;
    location: { latitude: number; longitude: number; address?: string };
  }) => {
    try {
      const response = await apiService.post('/services/requests', serviceData);
      const newService = response.data;
      setActiveService(newService);
      return newService;
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  };

  const acceptOffer = async (offerId: string) => {
    try {
      const response = await apiService.post(`/services/offers/${offerId}/accept`);
      const acceptedService = response.data;
      setActiveService(acceptedService);
      
      // Clear other offers
      setReceivedOffers([]);
      
      return acceptedService;
    } catch (error) {
      console.error('Error accepting offer:', error);
      throw error;
    }
  };

  const cancelService = async () => {
    if (!activeService) return;
    
    try {
      await apiService.put(`/services/requests/${activeService.id}/status`, {
        status: 'cancelled'
      });
      
      setActiveService(null);
    } catch (error) {
      console.error('Error cancelling service:', error);
      throw error;
    }
  };

  // Provider functions
  const toggleProviderStatus = async (online: boolean) => {
    try {
      await apiService.put('/providers/status', { is_online: online });
      setIsProviderOnline(online);
      updateProviderStatus(online);
    } catch (error) {
      console.error('Error updating provider status:', error);
      throw error;
    }
  };

  const acceptServiceRequest = async (serviceId: string) => {
    try {
      respondToService(serviceId, 'accept');
      
      // Remove from incoming requests
      setIncomingRequests(prev => prev.filter(req => req.id !== serviceId));
      
      // Set as active service
      const service = incomingRequests.find(req => req.id === serviceId);
      if (service) {
        setActiveService({ ...service, status: 'accepted', provider_id: user?.id });
      }
    } catch (error) {
      console.error('Error accepting service request:', error);
      throw error;
    }
  };

  const rejectServiceRequest = async (serviceId: string) => {
    try {
      respondToService(serviceId, 'reject');
      
      // Remove from incoming requests
      setIncomingRequests(prev => prev.filter(req => req.id !== serviceId));
    } catch (error) {
      console.error('Error rejecting service request:', error);
      throw error;
    }
  };

  const updateServiceStatus = async (status: ServiceRequest['status']) => {
    if (!activeService) return;
    
    try {
      await apiService.put(`/services/requests/${activeService.id}/status`, { status });
      
      setActiveService(prev => prev ? { ...prev, status } : null);
      
      // Clear active service if completed or cancelled
      if (status === 'completed' || status === 'cancelled') {
        setTimeout(() => setActiveService(null), 2000);
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      throw error;
    }
  };

  // Location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        sendLocationUpdate(latitude, longitude);
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
    
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [sendLocationUpdate]);

  // Load nearby providers for clients
  const loadNearbyProviders = async (latitude?: number, longitude?: number) => {
    try {
      const params = new URLSearchParams();
      if (latitude) params.append('latitude', latitude.toString());
      if (longitude) params.append('longitude', longitude.toString());
      
      const response = await apiService.get(`/providers/nearby?${params.toString()}`);
      setNearbyProviders(response.data.providers || []);
    } catch (error) {
      console.error('Error loading nearby providers:', error);
    }
  };

  return {
    // State
    activeService,
    incomingRequests,
    receivedOffers,
    isProviderOnline,
    nearbyProviders,
    isConnected,
    
    // Client functions
    createServiceRequest,
    acceptOffer,
    cancelService,
    loadNearbyProviders,
    
    // Provider functions
    toggleProviderStatus,
    acceptServiceRequest,
    rejectServiceRequest,
    updateServiceStatus,
    
    // Location tracking
    startLocationTracking,
  };
};