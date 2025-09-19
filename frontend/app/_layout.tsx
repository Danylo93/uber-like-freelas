import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ServicesProvider } from '../src/contexts/ServicesContext';
import { ChatProvider } from '../src/contexts/ChatContext';
import { WebSocketProvider } from '../src/contexts/WebSocketContext';
import { MatchingProvider } from '../src/contexts/MatchingContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <WebSocketProvider>
              <MatchingProvider>
                <ChatProvider>
                    <StatusBar style="auto" />
                    <Stack
                      screenOptions={{
                        headerShown: false,
                      }}
                    />
                  </MatchingProvider>
                </ChatProvider>
            </WebSocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}