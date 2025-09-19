import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

export type UserRole = 'client' | 'provider';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  verified: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  // Provider specific
  categories?: string[];
  rating?: number;
  isOnline?: boolean;
  // Client specific
  preferredPaymentMethod?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_TOKEN_KEY = '@auth_token';
const USER_DATA_KEY = '@user_data';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [token, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY),
      ]);

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // TODO: Validate token with backend
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Starting login process for:', email);
      
      const response = await apiService.login({ email, password });
      console.log('✅ Login response received:', response);
      
      if (!response.access_token) {
        throw new Error('No access token received from server');
      }
      
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
      console.log('✅ Auth data stored successfully');
      
      setUser(response.user);
      console.log('✅ User state updated, login successful');
      
      // Force immediate re-render to trigger redirect
      setTimeout(() => {
        console.log('🚀 Triggering auth state refresh for redirect');
      }, 100);
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error; // Re-throw so the UI can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      setIsLoading(true);
      const response = await apiService.register({ email, password, name, role });
      
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
      
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement Google Sign-In
      console.log('Google login not implemented yet');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem(AUTH_TOKEN_KEY)}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const switchRole = async (role: UserRole) => {
    if (!user) return;
    
    try {
      await updateUserProfile({ role });
    } catch (error) {
      console.error('Error switching role:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      const response = await apiService.get('/users/me');
      const userData = response.data;

      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      // If refresh fails, we might need to logout
      if (error.response?.status === 401) {
        await logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUserProfile,
    switchRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};