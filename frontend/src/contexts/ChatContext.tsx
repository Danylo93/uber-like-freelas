import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../api/apiService';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'location';
  serviceRequestId?: string;
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  serviceRequestId?: string;
  participantNames: Record<string, string>; // userId -> name mapping
}

interface ChatContextType {
  chats: Chat[];
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'location') => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  createChat: (participantId: string, participantName: string, serviceRequestId?: string) => Promise<string>;
  refreshChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      refreshChats();
    }
  }, [user]);

  const refreshChats = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // In a real app, this would call a backend API to get user's chats
      // For now, we'll get chats based on service requests
      const serviceRequests = await apiService.getServiceRequests();
      const offers = await apiService.getOffers();
      
      const chatMap = new Map<string, Chat>();

      // Create chats from service requests (for clients)
      if (user.role === 'client') {
        serviceRequests.forEach(request => {
          if (request.provider_id) {
            const chatId = `service_${request.id}`;
            chatMap.set(chatId, {
              id: chatId,
              participants: [user.id, request.provider_id],
              serviceRequestId: request.id,
              unreadCount: 0,
              participantNames: {
                [user.id]: user.name,
                [request.provider_id]: 'Prestador', // Would get real name from API
              },
            });
          }
        });
      }

      // Create chats from offers (for providers)
      if (user.role === 'provider') {
        offers.forEach(offer => {
          // Get the service request to find the client
          const request = serviceRequests.find(r => r.id === offer.service_request_id);
          if (request) {
            const chatId = `service_${request.id}`;
            chatMap.set(chatId, {
              id: chatId,
              participants: [user.id, request.client_id],
              serviceRequestId: request.id,
              unreadCount: 0,
              participantNames: {
                [user.id]: user.name,
                [request.client_id]: 'Cliente', // Would get real name from API
              },
            });
          }
        });
      }

      setChats(Array.from(chatMap.values()));
      
    } catch (error) {
      console.error('Error refreshing chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      // In a real app, this would load messages from backend/Firebase
      // For now, return empty array since we removed mocks
      setMessages(prev => ({
        ...prev,
        [chatId]: []
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (chatId: string, content: string, type: 'text' | 'image' | 'location' = 'text') => {
    if (!user) return;

    try {
      setIsLoading(true);

      const chat = chats.find(c => c.id === chatId);
      if (!chat) return;

      const receiverId = chat.participants.find(p => p !== user.id) || '';

      const newMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: user.id,
        receiverId,
        content,
        timestamp: new Date(),
        read: false,
        type,
        serviceRequestId: chat.serviceRequestId,
      };

      // Update local messages immediately (optimistic update)
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMessage],
      }));

      // Update chat last message
      setChats(prev => 
        prev.map(c => 
          c.id === chatId 
            ? { ...c, lastMessage: newMessage }
            : c
        )
      );

      // In a real app, send to backend/Firebase here
      // await apiService.sendMessage({ chatId, content, type, receiverId });

      console.log('Message sent:', newMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (chatId: string) => {
    if (!user) return;

    try {
      // Mark all messages as read
      setMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId]?.map(msg => 
          msg.receiverId === user.id ? { ...msg, read: true } : msg
        ) || [],
      }));

      // Update unread count
      setChats(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      );

      // In a real app, send to backend here
      // await apiService.markMessagesAsRead(chatId);

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const createChat = async (participantId: string, participantName: string, serviceRequestId?: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);

      const chatId = serviceRequestId ? `service_${serviceRequestId}` : `chat_${Date.now()}`;
      
      const newChat: Chat = {
        id: chatId,
        participants: [user.id, participantId],
        unreadCount: 0,
        serviceRequestId,
        participantNames: {
          [user.id]: user.name,
          [participantId]: participantName,
        },
      };

      setChats(prev => [...prev, newChat]);
      setMessages(prev => ({ ...prev, [chatId]: [] }));

      // In a real app, create chat in backend here
      // await apiService.createChat({ participantId, serviceRequestId });

      return chatId;

    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: ChatContextType = {
    chats,
    messages,
    sendMessage,
    markAsRead,
    createChat,
    refreshChats,
    loadMessages,
    isLoading,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};