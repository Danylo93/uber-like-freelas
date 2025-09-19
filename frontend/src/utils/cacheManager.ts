import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  priority?: 'low' | 'medium' | 'high';
  compressed?: boolean;
  persistent?: boolean; // Store in AsyncStorage
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private maxMemorySize = 50; // Maximum items in memory
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clean expired items periodically
    setInterval(() => {
      this.cleanExpiredItems();
    }, 60000); // Every minute
  }

  /**
   * Store data in cache
   */
  async set<T>(
    key: string, 
    data: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      ttl = this.defaultTTL,
      priority = 'medium',
      compressed = false,
      persistent = false,
    } = options;

    const now = Date.now();
    const cacheItem: CacheItem<T> = {
      data: compressed ? this.compress(data) : data,
      timestamp: now,
      expiresAt: now + ttl,
      key,
    };

    // Store in memory cache
    this.memoryCache.set(key, cacheItem);

    // Manage memory cache size
    if (this.memoryCache.size > this.maxMemorySize) {
      this.evictLRU();
    }

    // Store in persistent storage if requested
    if (persistent) {
      try {
        const serializedItem = JSON.stringify(cacheItem);
        await AsyncStorage.setItem(`cache_${key}`, serializedItem);
      } catch (error) {
        console.warn('Failed to store in persistent cache:', error);
      }
    }

    console.log(`📦 Cached: ${key} (TTL: ${ttl}ms, Priority: ${priority})`);
  }

  /**
   * Retrieve data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      console.log(`🎯 Cache HIT (memory): ${key}`);
      return memoryItem.data;
    }

    // Try persistent cache
    try {
      const persistentItem = await AsyncStorage.getItem(`cache_${key}`);
      if (persistentItem) {
        const parsed: CacheItem<T> = JSON.parse(persistentItem);
        if (!this.isExpired(parsed)) {
          // Move back to memory cache
          this.memoryCache.set(key, parsed);
          console.log(`🎯 Cache HIT (persistent): ${key}`);
          return parsed.data;
        } else {
          // Remove expired persistent item
          await AsyncStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read from persistent cache:', error);
    }

    console.log(`❌ Cache MISS: ${key}`);
    return null;
  }

  /**
   * Cache with automatic fetch if not found
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    console.log(`🔄 Fetching fresh data: ${key}`);
    const data = await fetcher();
    await this.set(key, data, options);
    return data;
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove from persistent cache:', error);
    }
    console.log(`🗑️ Invalidated cache: ${key}`);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    try {
      // Get all AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Failed to clear persistent cache:', error);
    }

    console.log('🧹 Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryItems: number;
    memorySize: string;
    hitRate: number;
  } {
    const memoryItems = this.memoryCache.size;
    const memorySize = this.formatBytes(
      JSON.stringify([...this.memoryCache.values()]).length
    );

    return {
      memoryItems,
      memorySize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
    };
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    const exists = await this.get(key);
    if (!exists) {
      try {
        const data = await fetcher();
        await this.set(key, data, { ...options, priority: 'high' });
        console.log(`⚡ Preloaded: ${key}`);
      } catch (error) {
        console.warn(`Failed to preload ${key}:`, error);
      }
    }
  }

  /**
   * Batch operations
   */
  async batchGet<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    await Promise.all(
      keys.map(async (key) => {
        const data = await this.get<T>(key);
        if (data !== null) {
          results.set(key, data);
        }
      })
    );

    return results;
  }

  async batchSet<T>(
    items: Array<{ key: string; data: T; options?: CacheOptions }>
  ): Promise<void> {
    await Promise.all(
      items.map(({ key, data, options }) => this.set(key, data, options))
    );
  }

  // Private methods
  private isExpired<T>(item: CacheItem<T>): boolean {
    return Date.now() > item.expiresAt;
  }

  private cleanExpiredItems(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiresAt) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧼 Cleaned ${cleaned} expired cache items`);
    }
  }

  private evictLRU(): void {
    // Find least recently used item (oldest timestamp)
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      console.log(`🔄 Evicted LRU item: ${oldestKey}`);
    }
  }

  private compress<T>(data: T): string {
    try {
      // Simple compression (in real app, use a proper compression library)
      return JSON.stringify(data);
    } catch {
      return data as any;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Cache keys constants
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  SERVICE_REQUESTS: 'service_requests',
  SERVICE_OFFERS: 'service_offers',
  CHAT_MESSAGES: (chatId: string) => `chat_messages_${chatId}`,
  NEARBY_PROVIDERS: (lat: number, lng: number) => `nearby_providers_${lat}_${lng}`,
  ROUTE_DIRECTIONS: (origin: string, destination: string) => `route_${origin}_${destination}`,
  PROVIDER_REVIEWS: (providerId: string) => `provider_reviews_${providerId}`,
  SERVICE_CATEGORIES: 'service_categories',
  USER_FAVORITES: 'user_favorites',
  NOTIFICATION_SETTINGS: 'notification_settings',
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 30 * 60 * 1000,      // 30 minutes
  EXTRA_LONG: 2 * 60 * 60 * 1000, // 2 hours
  PERSISTENT: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Singleton instance
export const cacheManager = new CacheManager();

// React hook for cache integration
export const useCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const { enabled = true, ...cacheOptions } = options;

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await cacheManager.getOrFetch(key, fetcher, cacheOptions);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, enabled, cacheOptions]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = React.useCallback(() => {
    cacheManager.invalidate(key);
    fetchData();
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate,
  };
};

// API cache decorators
export const apiCacheDecorators = {
  // Cache user profile data
  cacheUserProfile: <T>(fetcher: () => Promise<T>) => 
    () => cacheManager.getOrFetch(
      CACHE_KEYS.USER_PROFILE,
      fetcher,
      { ttl: CACHE_TTL.LONG, persistent: true }
    ),

  // Cache service requests with short TTL
  cacheServiceRequests: <T>(fetcher: () => Promise<T>) =>
    () => cacheManager.getOrFetch(
      CACHE_KEYS.SERVICE_REQUESTS,
      fetcher,
      { ttl: CACHE_TTL.SHORT, priority: 'high' }
    ),

  // Cache nearby providers based on location
  cacheNearbyProviders: <T>(lat: number, lng: number, fetcher: () => Promise<T>) =>
    () => cacheManager.getOrFetch(
      CACHE_KEYS.NEARBY_PROVIDERS(lat, lng),
      fetcher,
      { ttl: CACHE_TTL.MEDIUM, priority: 'high' }
    ),

  // Cache route directions
  cacheRouteDirections: <T>(origin: string, destination: string, fetcher: () => Promise<T>) =>
    () => cacheManager.getOrFetch(
      CACHE_KEYS.ROUTE_DIRECTIONS(origin, destination),
      fetcher,
      { ttl: CACHE_TTL.EXTRA_LONG, persistent: true }
    ),
};