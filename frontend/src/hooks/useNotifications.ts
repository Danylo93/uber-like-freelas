import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface UseNotificationsReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isLoading: boolean;
  error: string | null;
  sendTestNotification: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      // Handle notification tap - navigate to relevant screen
      const data = response.notification.request.content.data;
      if (data?.type === 'chat_message') {
        // Navigate to chat screen
        console.log('Navigate to chat:', data.chatId);
      } else if (data?.type === 'service_request') {
        // Navigate to service screen
        console.log('Navigate to service:', data.serviceId);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!Device.isDevice) {
        setError('Push notifications only work on physical devices');
        return;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Permissão de notificação não concedida');
        return;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync();
      setExpoPushToken(token.data);

      // Send token to backend for this user
      if (user && token.data) {
        try {
          await apiService.post('/notifications/token', { push_token: token.data });
          console.log('✅ Push token saved for user', user.id);
        } catch (err) {
          console.error('❌ Error saving push token:', err);
        }
      }

      // Android-specific configuration
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0B57D0',
        });
      }

    } catch (err) {
      console.error('Error registering for push notifications:', err);
      setError('Erro ao configurar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!expoPushToken) {
      setError('Token de notificação não disponível');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Teste de Notificação! 🎉",
          body: 'Esta é uma notificação de teste do seu marketplace de serviços.',
          data: { 
            type: 'test',
            timestamp: new Date().toISOString(),
          },
        },
        trigger: { seconds: 1 },
      });
    } catch (err) {
      console.error('Error sending test notification:', err);
      setError('Erro ao enviar notificação de teste');
    }
  };

  return {
    expoPushToken,
    notification,
    isLoading,
    error,
    sendTestNotification,
  };
};

// Notification templates for different types
export const NotificationTemplates = {
  newServiceRequest: (clientName: string, category: string) => ({
    title: '📋 Nova Solicitação',
    body: `${clientName} solicitou um serviço de ${category}`,
    data: { type: 'service_request' },
  }),

  offerReceived: (providerName: string, price: number) => ({
    title: '💰 Nova Oferta',
    body: `${providerName} fez uma oferta de R$ ${price}`,
    data: { type: 'offer' },
  }),

  serviceConfirmed: (providerName: string) => ({
    title: '✅ Serviço Confirmado',
    body: `${providerName} confirmou seu serviço e está a caminho!`,
    data: { type: 'service_confirmed' },
  }),

  serviceCompleted: (amount: number) => ({
    title: '🎉 Serviço Concluído',
    body: `Serviço finalizado! Valor: R$ ${amount}. Avalie sua experiência.`,
    data: { type: 'service_completed' },
  }),

  newMessage: (senderName: string, message: string) => ({
    title: `💬 ${senderName}`,
    body: message.length > 50 ? message.substring(0, 47) + '...' : message,
    data: { type: 'chat_message' },
  }),

  paymentReceived: (amount: number) => ({
    title: '💳 Pagamento Recebido',
    body: `Você recebeu R$ ${amount} pelo serviço realizado!`,
    data: { type: 'payment' },
  }),
};