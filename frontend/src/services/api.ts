import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/api`;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('@auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Authentication
  async register(data: {
    email: string;
    password: string;
    name: string;
    role: 'client' | 'provider';
    phone?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async login(data: { email: string; password: string }) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // User
  async getCurrentUser() {
    const response = await fetch(`${this.baseUrl}/users/me`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateProfile(data: any) {
    const response = await fetch(`${this.baseUrl}/users/profile`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async updateLocation(data: { latitude: number; longitude: number }) {
    const response = await fetch(`${this.baseUrl}/users/location`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Service Requests
  async createServiceRequest(data: {
    category: string;
    title: string;
    description: string;
    location: { latitude: number; longitude: number };
    address: string;
    images?: string[];
    budget_range?: { min: number; max: number };
  }) {
    const response = await fetch(`${this.baseUrl}/services/requests`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getServiceRequests() {
    const response = await fetch(`${this.baseUrl}/services/requests`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getServiceRequest(id: string) {
    const response = await fetch(`${this.baseUrl}/services/requests/${id}`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Offers
  async createOffer(data: {
    service_request_id: string;
    price: number;
    estimated_duration: number;
    message?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/services/offers`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getOffers() {
    const response = await fetch(`${this.baseUrl}/services/offers`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Payments
  async createPaymentSession(data: {
    package_id: string;
    origin_url: string;
    metadata?: Record<string, string>;
  }) {
    const response = await fetch(`${this.baseUrl}/payments/checkout/session`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async getPaymentStatus(sessionId: string) {
    const response = await fetch(`${this.baseUrl}/payments/checkout/status/${sessionId}`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getPaymentPackages() {
    const response = await fetch(`${this.baseUrl}/payments/packages`, {
      headers: await this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();