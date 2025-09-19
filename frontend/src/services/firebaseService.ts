import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue, off, serverTimestamp, update, remove } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase configuration - will be set from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
                             firebaseConfig.databaseURL && 
                             firebaseConfig.projectId;

console.log('Firebase configuration check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasDatabaseURL: !!firebaseConfig.databaseURL,
  hasProjectId: !!firebaseConfig.projectId,
  isConfigured: isFirebaseConfigured
});

export interface RealTimeServiceRequest {
  id: string;
  clientId: string;
  providerId?: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  clientName: string;
  providerName?: string;
}

export interface ProviderLocation {
  providerId: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  lastUpdated: number;
  name: string;
  rating: number;
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  read: boolean;
}

class FirebaseRealtimeService {
  private initialized: boolean = false;
  private app: any = null;
  private database: any = null;
  private auth: any = null;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Check if Firebase is properly configured
      if (!isFirebaseConfigured) {
        console.log('Firebase not configured - missing credentials');
        return;
      }

      // Initialize Firebase components only when needed
      this.app = initializeApp(firebaseConfig);
      this.database = getDatabase(this.app);
      this.auth = getAuth(this.app);
      
      // Sign in anonymously to Firebase
      await signInAnonymously(this.auth);
      this.initialized = true;
      console.log('Firebase Realtime Database initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }

  // Service Requests Management
  async createServiceRequest(serviceRequest: Omit<RealTimeServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase not configured');
    }
    
    if (!this.initialized) await this.initialize();
    
    const serviceRef = ref(this.database, 'serviceRequests');
    const newServiceRef = push(serviceRef);
    
    const serviceData: RealTimeServiceRequest = {
      ...serviceRequest,
      id: newServiceRef.key!,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pending'
    };

    await set(newServiceRef, serviceData);
    return newServiceRef.key!;
  }

  async updateServiceRequest(serviceId: string, updates: Partial<RealTimeServiceRequest>) {
    if (!isFirebaseConfigured || !this.initialized) {
      throw new Error('Firebase not configured or initialized');
    }
    
    const serviceRef = ref(this.database, `serviceRequests/${serviceId}`);
    await update(serviceRef, {
      ...updates,
      updatedAt: Date.now()
    });
  }

  subscribeToServiceRequests(callback: (services: RealTimeServiceRequest[]) => void): () => void {
    if (!this.initialized) {
      this.initialize().then(() => {
        this.subscribeToServiceRequests(callback);
      });
      return () => {};
    }

    const servicesRef = ref(database, 'serviceRequests');
    
    const unsubscribe = onValue(servicesRef, (snapshot) => {
      const data = snapshot.val();
      const services: RealTimeServiceRequest[] = data 
        ? Object.values(data)
        : [];
      callback(services);
    });

    return () => off(servicesRef, 'value', unsubscribe);
  }

  subscribeToServiceRequest(serviceId: string, callback: (service: RealTimeServiceRequest | null) => void): () => void {
    if (!this.initialized) {
      this.initialize().then(() => {
        this.subscribeToServiceRequest(serviceId, callback);
      });
      return () => {};
    }

    const serviceRef = ref(database, `serviceRequests/${serviceId}`);
    
    const unsubscribe = onValue(serviceRef, (snapshot) => {
      const service = snapshot.val();
      callback(service);
    });

    return () => off(serviceRef, 'value', unsubscribe);
  }

  // Provider Location Tracking
  async updateProviderLocation(providerId: string, location: Omit<ProviderLocation, 'providerId' | 'lastUpdated'>) {
    if (!this.initialized) await this.initialize();
    
    const locationRef = ref(database, `providerLocations/${providerId}`);
    await set(locationRef, {
      ...location,
      providerId,
      lastUpdated: Date.now()
    });
  }

  subscribeToNearbyProviders(callback: (providers: ProviderLocation[]) => void): () => void {
    if (!this.initialized) {
      this.initialize().then(() => {
        this.subscribeToNearbyProviders(callback);
      });
      return () => {};
    }

    const providersRef = ref(database, 'providerLocations');
    
    const unsubscribe = onValue(providersRef, (snapshot) => {
      const data = snapshot.val();
      const providers: ProviderLocation[] = data 
        ? Object.values(data).filter((p: any) => p.isOnline && (Date.now() - p.lastUpdated) < 300000) // Active in last 5 minutes
        : [];
      callback(providers);
    });

    return () => off(providersRef, 'value', unsubscribe);
  }

  // Chat System
  async sendMessage(chatId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    if (!this.initialized) await this.initialize();
    
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    
    const messageData: ChatMessage = {
      ...message,
      id: newMessageRef.key!,
      timestamp: Date.now()
    };

    await set(newMessageRef, messageData);
    
    // Update chat metadata
    const chatRef = ref(database, `chats/${chatId}/metadata`);
    await update(chatRef, {
      lastMessage: message.message,
      lastMessageTime: Date.now(),
      lastSenderId: message.senderId
    });

    return newMessageRef.key!;
  }

  subscribeToChat(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
    if (!this.initialized) {
      this.initialize().then(() => {
        this.subscribeToChat(chatId, callback);
      });
      return () => {};
    }

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const messages: ChatMessage[] = data 
        ? Object.values(data).sort((a: any, b: any) => a.timestamp - b.timestamp)
        : [];
      callback(messages);
    });

    return () => off(messagesRef, 'value', unsubscribe);
  }

  // Notifications
  async sendNotification(userId: string, notification: {
    title: string;
    body: string;
    data?: any;
  }) {
    if (!this.initialized) await this.initialize();
    
    const notificationRef = ref(database, `notifications/${userId}`);
    const newNotificationRef = push(notificationRef);
    
    await set(newNotificationRef, {
      ...notification,
      id: newNotificationRef.key!,
      timestamp: Date.now(),
      read: false
    });
  }

  subscribeToNotifications(userId: string, callback: (notifications: any[]) => void): () => void {
    if (!this.initialized) {
      this.initialize().then(() => {
        this.subscribeToNotifications(userId, callback);
      });
      return () => {};
    }

    const notificationsRef = ref(database, `notifications/${userId}`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      const notifications = data 
        ? Object.values(data).sort((a: any, b: any) => b.timestamp - a.timestamp)
        : [];
      callback(notifications);
    });

    return () => off(notificationsRef, 'value', unsubscribe);
  }

  // Connection Status
  isConnected(): boolean {
    return this.initialized;
  }

  // Cleanup
  async disconnect() {
    // Firebase handles connection cleanup automatically
    this.initialized = false;
  }
}

export const firebaseRealtimeService = new FirebaseRealtimeService();