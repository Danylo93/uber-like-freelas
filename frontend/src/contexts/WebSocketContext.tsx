import React, { createContext, useContext, useState } from 'react';

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
  // Temporariamente desabilitado para evitar erros de conectividade
  const [isConnected] = useState(false);
  const [connectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const sendMessage = () => {
    console.log('WebSocket temporariamente desabilitado');
  };

  const onMessage = () => {
    return () => {}; // cleanup function
  };

  const value: WebSocketContextType = {
    isConnected,
    sendMessage,
    onMessage,
    connectionStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};