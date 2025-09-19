import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';

export interface ServiceRequest {
  id: string;
  category: string;
  title: string;
  description: string;
  location: { latitude: number; longitude: number };
  address: string;
  client_id: string;
  provider_id?: string;
  status: 'requested' | 'matched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  estimated_price?: number;
  final_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  service_request_id: string;
  provider_id: string;
  price: number;
  estimated_duration: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface ServicesContextType {
  serviceRequests: ServiceRequest[];
  offers: Offer[];
  isLoading: boolean;
  createServiceRequest: (data: any) => Promise<ServiceRequest>;
  createOffer: (data: any) => Promise<Offer>;
  refreshData: () => Promise<void>;
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

interface ServicesProviderProps {
  children: ReactNode;
}

export const ServicesProvider: React.FC<ServicesProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const [requestsResponse, offersResponse] = await Promise.all([
        apiService.getServiceRequests(),
        apiService.getOffers(),
      ]);
      
      setServiceRequests(requestsResponse);
      setOffers(offersResponse);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createServiceRequest = async (data: any): Promise<ServiceRequest> => {
    try {
      const request = await apiService.createServiceRequest(data);
      setServiceRequests(prev => [request, ...prev]);
      return request;
    } catch (error) {
      console.error('Error creating service request:', error);
      throw error;
    }
  };

  const createOffer = async (data: any): Promise<Offer> => {
    try {
      const offer = await apiService.createOffer(data);
      setOffers(prev => [offer, ...prev]);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const value: ServicesContextType = {
    serviceRequests,
    offers,
    isLoading,
    createServiceRequest,
    createOffer,
    refreshData,
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = (): ServicesContextType => {
  const context = useContext(ServicesContext);
  if (!context) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
};