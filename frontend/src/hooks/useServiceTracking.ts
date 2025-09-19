import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useNotifications } from './useNotifications';

export type ServiceStatus = 'searching' | 'matched' | 'on_way' | 'arrived' | 'in_progress' | 'completed';

export interface ServiceTrackingData {
  id: string;
  status: ServiceStatus;
  providerId?: string;
  providerName?: string;
  providerPhone?: string;
  estimatedArrival?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  serviceType: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export const useServiceTracking = (serviceRequestId?: string) => {
  const [trackingData, setTrackingData] = useState<ServiceTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { sendTestNotification } = useNotifications();

  const loadTrackingData = useCallback(async () => {
    if (!serviceRequestId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.get(`/services/requests/${serviceRequestId}`);
      const serviceRequest = response.data;

      // Transform service request data to tracking data
      const tracking: ServiceTrackingData = {
        id: serviceRequest.id,
        status: getStatusFromServiceRequest(serviceRequest),
        providerId: serviceRequest.provider_id,
        providerName: serviceRequest.provider_name || 'Prestador',
        providerPhone: serviceRequest.provider_phone,
        estimatedArrival: serviceRequest.estimated_arrival,
        currentLocation: serviceRequest.provider_location,
        serviceType: serviceRequest.service_type,
        price: serviceRequest.price || 0,
        createdAt: serviceRequest.created_at,
        updatedAt: serviceRequest.updated_at,
      };

      setTrackingData(tracking);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao carregar dados de rastreamento';
      setError(errorMessage);
      console.error('Error loading tracking data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [serviceRequestId]);

  const updateServiceStatus = async (newStatus: ServiceStatus) => {
    if (!serviceRequestId) return;

    try {
      setError(null);

      // Update status on backend
      await apiService.put(`/services/requests/${serviceRequestId}/status`, {
        status: newStatus
      });

      // Update local state
      setTrackingData(prev => 
        prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null
      );

      // Send notification for status changes
      await sendStatusNotification(newStatus);

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao atualizar status';
      setError(errorMessage);
      console.error('Error updating service status:', err);
    }
  };

  const sendStatusNotification = async (status: ServiceStatus) => {
    const notifications = {
      matched: {
        title: '🎉 Prestador encontrado!',
        body: `${trackingData?.providerName} aceitou sua solicitação`,
      },
      on_way: {
        title: '🚗 A caminho',
        body: `${trackingData?.providerName} está indo até você`,
      },
      arrived: {
        title: '📍 Chegou!',
        body: `${trackingData?.providerName} chegou ao local`,
      },
      in_progress: {
        title: '🔧 Serviço iniciado',
        body: 'O serviço está sendo realizado',
      },
      completed: {
        title: '✅ Serviço concluído',
        body: 'Avalie sua experiência!',
      },
    };

    const notification = notifications[status];
    if (notification) {
      // In a real app, this would be sent from the backend
      console.log('Status notification:', notification);
    }
  };

  const cancelService = async () => {
    if (!serviceRequestId) return;

    try {
      setError(null);

      await apiService.delete(`/services/requests/${serviceRequestId}`);
      
      setTrackingData(null);
      
      console.log('Service cancelled successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Erro ao cancelar serviço';
      setError(errorMessage);
      console.error('Error cancelling service:', err);
    }
  };

  const callProvider = () => {
    if (trackingData?.providerPhone) {
      // In a real app, this would open the phone dialer
      console.log('Calling provider:', trackingData.providerPhone);
      // Linking.openURL(`tel:${trackingData.providerPhone}`);
    }
  };

  const openChat = () => {
    if (trackingData?.providerId) {
      // In a real app, this would navigate to chat screen
      console.log('Opening chat with provider:', trackingData.providerId);
    }
  };

  // Auto-refresh tracking data every 30 seconds
  useEffect(() => {
    if (serviceRequestId) {
      loadTrackingData();
      
      const interval = setInterval(loadTrackingData, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [serviceRequestId, loadTrackingData]);

  const getStatusFromServiceRequest = (serviceRequest: any): ServiceStatus => {
    if (serviceRequest.status === 'cancelled' || serviceRequest.status === 'completed') {
      return 'completed';
    }
    
    if (serviceRequest.provider_id) {
      if (serviceRequest.status === 'in_progress') {
        return 'in_progress';
      }
      if (serviceRequest.status === 'provider_arrived') {
        return 'arrived';
      }
      if (serviceRequest.status === 'provider_on_way') {
        return 'on_way';
      }
      return 'matched';
    }
    
    return 'searching';
  };

  const getEstimatedArrivalText = () => {
    if (!trackingData?.estimatedArrival) return undefined;
    
    try {
      const arrival = new Date(trackingData.estimatedArrival);
      const now = new Date();
      const diffMinutes = Math.round((arrival.getTime() - now.getTime()) / (1000 * 60));
      
      if (diffMinutes <= 0) {
        return 'Chegando agora';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} min`;
      } else {
        return arrival.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch {
      return trackingData.estimatedArrival;
    }
  };

  return {
    trackingData,
    isLoading,
    error,
    updateServiceStatus,
    cancelService,
    callProvider,
    openChat,
    refreshTracking: loadTrackingData,
    estimatedArrivalText: getEstimatedArrivalText(),
  };
};