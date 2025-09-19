import { api } from './api';

export interface ServiceRequest {
  title: string;
  category: string;
  description: string;
  budget?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface ServiceResponse {
  id: string;
  message: string;
  status: string;
  estimated_response_time?: string;
}

export interface ProviderStatusResponse {
  status: 'online' | 'offline';
  message: string;
  timestamp: string;
}

export interface NearbyService {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  client_name: string;
  created_at: string;
  estimated_duration: string;
}

export interface EarningsData {
  total_earnings: number;
  total_services: number;
  monthly_earnings: number;
  monthly_services: number;
  average_service_value: number;
  provider_rating: number;
}

class ServiceActionsAPI {
  // Provider actions
  async toggleProviderStatus(): Promise<ProviderStatusResponse> {
    const response = await api.put('/providers/toggle-status');
    return response.data;
  }

  async getNearbyServices(): Promise<{ services: NearbyService[]; count: number; radius_km: number }> {
    const response = await api.get('/services/nearby');
    return response.data;
  }

  async acceptServiceRequest(serviceId: string): Promise<{ message: string; service_id: string; client_id: string; next_steps: string }> {
    const response = await api.post(`/services/${serviceId}/accept`);
    return response.data;
  }

  async rejectServiceRequest(serviceId: string): Promise<{ message: string; service_id: string }> {
    const response = await api.post(`/services/${serviceId}/reject`);
    return response.data;
  }

  async getProviderEarnings(): Promise<EarningsData> {
    const response = await api.get('/providers/earnings');
    return response.data;
  }

  // Client actions
  async createServiceRequest(requestData: ServiceRequest): Promise<ServiceResponse> {
    const response = await api.post('/services/request', requestData);
    return response.data;
  }

  // Common actions
  async updateServiceStatus(serviceId: string, status: string): Promise<{ message: string; service_id: string; new_status: string }> {
    const response = await api.put(`/services/${serviceId}/status`, { status });
    return response.data;
  }

  async switchUserRole(): Promise<{ message: string; new_role: string; previous_role: string }> {
    const response = await api.get('/users/role-switch');
    return response.data;
  }

  // Real-time data polling (will be replaced by Firebase)
  async pollServiceUpdates(serviceId: string): Promise<any> {
    try {
      const response = await api.get(`/services/requests/${serviceId}`);
      return response.data;
    } catch (error) {
      console.error('Error polling service updates:', error);
      return null;
    }
  }
}

export const serviceActionsAPI = new ServiceActionsAPI();