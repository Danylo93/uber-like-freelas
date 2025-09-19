import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';

export default function MainLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const getTabIcon = (name: string, focused: boolean) => {
    let iconName: any;
    
    switch (name) {
      case 'home':
        iconName = focused ? 'map' : 'map-outline';
        break;
      case 'services':
        iconName = focused ? 'briefcase' : 'briefcase-outline';
        break;
      case 'activity':
        iconName = focused ? 'time' : 'time-outline';
        break;
      case 'profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        iconName = 'help-outline';
    }
    
    return iconName;
  };

  const getTabLabel = (name: string) => {
    switch (name) {
      case 'home':
        return 'Mapa';
      case 'services':
        return user?.role === 'provider' ? 'Solicitações' : 'Serviços';
      case 'activity':
        return 'Atividade';
      case 'profile':
        return 'Conta';
      default:
        return name;
    }
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme?.colors?.surface || '#FFFFFF',
          borderTopColor: theme?.colors?.outlineVariant || '#CAC4D0',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
          ...(theme?.elevation?.level2 || {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
          }),
        },
        tabBarActiveTintColor: theme?.colors?.primary || '#6750A4',
        tabBarInactiveTintColor: theme?.colors?.onSurfaceVariant || '#49454F',
        tabBarLabelStyle: {
          ...(theme?.typography?.labelSmall || {}),
          marginTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons 
            name={getTabIcon(route.name, focused)} 
            size={24} 
            color={color} 
          />
        ),
        tabBarLabel: getTabLabel(route.name),
      })}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="services" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}