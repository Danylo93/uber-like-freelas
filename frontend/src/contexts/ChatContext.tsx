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
      
      // Get chats from backend
      const response = await apiService.get('/chats');
      const backendChats = response.data || [];
      
      // Transform backend data to match our interface
      const transformedChats: Chat[] = backendChats.map((chat: any) => ({
        id: chat.id,
        participants: chat.participants,
        serviceRequestId: chat.service_request_id,
        unreadCount: 0, // TODO: Calculate unread count
        participantNames: {
          [user.id]: user.name,
          // Get other participant name from backend data
          ...Object.fromEntries(
            chat.participants
              .filter((id: string) => id !== user.id)
              .map((id: string) => [id, chat.participant_name || 'Usuário'])
          )
        },
        lastMessage: chat.last_message ? {
          id: chat.last_message.id,
          senderId: chat.last_message.sender_id,
          receiverId: chat.last_message.receiver_id || '',
          content: chat.last_message.content,
          timestamp: new Date(chat.last_message.created_at),
          read: !!chat.last_message.read_at,
          type: chat.last_message.message_type as 'text' | 'image' | 'location',
          serviceRequestId: chat.last_message.service_request_id,
        } : undefined,
      }));

      setChats(transformedChats);
      
    } catch (error) {
      console.error('Error refreshing chats:', error);
      // Fallback to empty array on error
      setChats([]);
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