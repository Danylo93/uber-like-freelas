import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ServicesProvider } from '../src/contexts/ServicesContext';
import { ChatProvider } from '../src/contexts/ChatContext';
import { WebSocketProvider } from '../src/contexts/WebSocketContext';
import { MatchingProvider } from '../src/contexts/MatchingContext';
import { FirebaseProvider } from '../src/contexts/FirebaseContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <FirebaseProvider>
              <WebSocketProvider>
                <MatchingProvider>
                  <ChatProvider>
                      <StatusBar style="auto" />
                      <Stack
                        screenOptions={{
                          headerShown: false,
                        }}
                      />
                  </ChatProvider>
                </MatchingProvider>
              </WebSocketProvider>
            </FirebaseProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}