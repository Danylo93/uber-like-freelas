import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

// Mock Firebase database for now - in real app, use @react-native-firebase/database
interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'location';
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  serviceRequestId?: string;
}

interface ChatContextType {
  chats: Chat[];
  messages: Record<string, Message[]>;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'location') => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  createChat: (participantId: string, serviceRequestId?: string) => Promise<string>;
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

  // Mock data for demonstration
  useEffect(() => {
    if (user) {
      loadMockData();
    }
  }, [user]);

  const loadMockData = () => {
    // Mock chats
    const mockChats: Chat[] = [
      {
        id: 'chat-1',
        participants: [user!.id, 'provider-1'],
        unreadCount: 2,
        serviceRequestId: 'service-1',
        lastMessage: {
          id: 'msg-3',
          senderId: 'provider-1',
          receiverId: user!.id,
          content: 'Posso chegar às 14h, está bom?',
          timestamp: new Date(),
          read: false,
          type: 'text',
        },
      },
      {
        id: 'chat-2',
        participants: [user!.id, 'client-1'],
        unreadCount: 0,
        serviceRequestId: 'service-2',
        lastMessage: {
          id: 'msg-6',
          senderId: user!.id,
          receiverId: 'client-1',
          content: 'Serviço finalizado!',
          timestamp: new Date(Date.now() - 3600000),
          read: true,
          type: 'text',
        },
      },
    ];

    // Mock messages
    const mockMessages: Record<string, Message[]> = {
      'chat-1': [
        {
          id: 'msg-1',
          senderId: user!.id,
          receiverId: 'provider-1',
          content: 'Olá! Você pode fazer a limpeza da casa?',
          timestamp: new Date(Date.now() - 7200000),
          read: true,
          type: 'text',
        },
        {
          id: 'msg-2',
          senderId: 'provider-1',
          receiverId: user!.id,
          content: 'Claro! Quando seria bom para você?',
          timestamp: new Date(Date.now() - 3600000),
          read: true,
          type: 'text',
        },
        {
          id: 'msg-3',
          senderId: 'provider-1',
          receiverId: user!.id,
          content: 'Posso chegar às 14h, está bom?',
          timestamp: new Date(),
          read: false,
          type: 'text',
        },
      ],
      'chat-2': [
        {
          id: 'msg-4',
          senderId: 'client-1',
          receiverId: user!.id,
          content: 'Como está o progresso do serviço?',
          timestamp: new Date(Date.now() - 7200000),
          read: true,
          type: 'text',
        },
        {
          id: 'msg-5',
          senderId: user!.id,
          receiverId: 'client-1',
          content: 'Estou quase terminando, mais uns 30 minutos',
          timestamp: new Date(Date.now() - 5400000),
          read: true,
          type: 'text',
        },
        {
          id: 'msg-6',
          senderId: user!.id,
          receiverId: 'client-1',
          content: 'Serviço finalizado!',
          timestamp: new Date(Date.now() - 3600000),
          read: true,
          type: 'text',
        },
      ],
    };

    setChats(mockChats);
    setMessages(mockMessages);
  };

  const sendMessage = async (chatId: string, content: string, type: 'text' | 'image' | 'location' = 'text') => {
    if (!user) return;

    try {
      setIsLoading(true);

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: user.id,
        receiverId: chats.find(c => c.id === chatId)?.participants.find(p => p !== user.id) || '',
        content,
        timestamp: new Date(),
        read: false,
        type,
      };

      // Update messages
      setMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), newMessage],
      }));

      // Update chat last message
      setChats(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, lastMessage: newMessage }
            : chat
        )
      );

      // In real app, send to Firebase and backend
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

    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const createChat = async (participantId: string, serviceRequestId?: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);

      const newChatId = `chat-${Date.now()}`;
      const newChat: Chat = {
        id: newChatId,
        participants: [user.id, participantId],
        unreadCount: 0,
        serviceRequestId,
      };

      setChats(prev => [...prev, newChat]);
      setMessages(prev => ({ ...prev, [newChatId]: [] }));

      return newChatId;

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