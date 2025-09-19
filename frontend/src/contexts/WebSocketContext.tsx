import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  onMessage: (callback: (message: WebSocketMessage) => void) => () => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const messageCallbacksRef = useRef<Array<(message: WebSocketMessage) => void>>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const getWebSocketUrl = () => {
    if (!user) return null;
    
    // Get base URL from environment or use default
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl}/ws/${user.id}`;
  };

  const connect = () => {
    const wsUrl = getWebSocketUrl();
    if (!wsUrl) return;

    try {
      setConnectionStatus('connecting');
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // Send initial connection message
        sendMessage({
          type: 'connection',
          user_id: user?.id,
          timestamp: new Date().toISOString(),
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          
          // Notify all registered callbacks
          messageCallbacksRef.current.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error('Error in message callback:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        console.log('📤 WebSocket message sent:', message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('⚠️ WebSocket not connected. Message not sent:', message);
    }
  };

  const onMessage = (callback: (message: WebSocketMessage) => void) => {
    messageCallbacksRef.current.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = messageCallbacksRef.current.indexOf(callback);
      if (index > -1) {
        messageCallbacksRef.current.splice(index, 1);
      }
    };
  };

  // Location update helper
  const sendLocationUpdate = (latitude: number, longitude: number) => {
    sendMessage({
      type: 'location_update',
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  };

  // Provider status update helper
  const updateProviderStatus = (isOnline: boolean) => {
    sendMessage({
      type: 'provider_status',
      is_online: isOnline,
      timestamp: new Date().toISOString(),
    });
  };

  // Service response helper
  const respondToService = (serviceId: string, response: 'accept' | 'reject') => {
    sendMessage({
      type: 'service_response',
      service_id: serviceId,
      response,
      timestamp: new Date().toISOString(),
    });
  };

  // Connect when user is available
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [user]);

  // Auto-reconnect when app comes back to foreground (mobile)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user && !isConnected) {
        connect();
      }
    };

    // For React Native
    try {
      const { AppState } = require('react-native');
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      
      return () => {
        subscription?.remove();
      };
    } catch (error) {
      // Not in React Native environment
    }
  }, [user, isConnected]);

  const contextValue: WebSocketContextType = {
    isConnected,
    sendMessage,
    onMessage,
    connectionStatus,
  };

  // Add helper methods to the context value
  (contextValue as any).sendLocationUpdate = sendLocationUpdate;
  (contextValue as any).updateProviderStatus = updateProviderStatus;
  (contextValue as any).respondToService = respondToService;

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType & {
  sendLocationUpdate: (latitude: number, longitude: number) => void;
  updateProviderStatus: (isOnline: boolean) => void;
  respondToService: (serviceId: string, response: 'accept' | 'reject') => void;
} => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context as any;
};