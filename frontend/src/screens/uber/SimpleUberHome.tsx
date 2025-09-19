import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ClientHomeScreen from '../client/ClientHomeScreen';
import ProviderHomeScreen from '../provider/ProviderHomeScreen';

export default function SimpleUberHome() {
  const { user } = useAuth();

  // Renderizar interface baseada no papel do usuário
  if (user?.role === 'provider') {
    return <ProviderHomeScreen />;
  }

  // Por padrão, mostrar interface do cliente
  return <ClientHomeScreen />;
}