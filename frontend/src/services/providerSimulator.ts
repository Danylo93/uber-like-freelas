import { ServiceProvider } from '../contexts/MatchingContext';

interface MovingProvider extends ServiceProvider {
  targetLocation?: {
    latitude: number;
    longitude: number;
  };
  speed: number; // km/h
  bearing: number; // degrees
  lastUpdate: Date;
}

export class ProviderSimulator {
  private providers: Map<string, MovingProvider> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private callbacks: Array<(providers: ServiceProvider[]) => void> = [];

  constructor() {
    this.initializeDemoProviders();
  }

  private initializeDemoProviders() {
    // Simulate providers in different areas of São Paulo
    const demoProviders: MovingProvider[] = [
      {
        id: 'provider-1',
        name: 'João Silva',
        avatar: '👨‍🔧',
        rating: 4.8,
        reviewCount: 127,
        distance: 2.3,
        estimatedTime: 15,
        price: 45.00,
        category: 'limpeza',
        coordinate: {
          latitude: -23.5505 + Math.random() * 0.02,
          longitude: -46.6333 + Math.random() * 0.02,
        },
        isOnline: true,
        speed: 30 + Math.random() * 20, // 30-50 km/h
        bearing: Math.random() * 360,
        lastUpdate: new Date(),
      },
      {
        id: 'provider-2',
        name: 'Maria Santos',
        avatar: '👩‍💼',
        rating: 4.9,
        reviewCount: 89,
        distance: 1.8,
        estimatedTime: 12,
        price: 40.00,
        category: 'limpeza',
        coordinate: {
          latitude: -23.5505 + Math.random() * 0.02,
          longitude: -46.6333 + Math.random() * 0.02,
        },
        isOnline: true,
        speed: 25 + Math.random() * 15,
        bearing: Math.random() * 360,
        lastUpdate: new Date(),
      },
      {
        id: 'provider-3',
        name: 'Carlos Oliveira',
        avatar: '🧹',
        rating: 4.7,
        reviewCount: 156,
        distance: 3.1,
        estimatedTime: 18,
        price: 50.00,
        category: 'limpeza',
        coordinate: {
          latitude: -23.5505 + Math.random() * 0.02,
          longitude: -46.6333 + Math.random() * 0.02,
        },
        isOnline: true,
        speed: 35 + Math.random() * 25,
        bearing: Math.random() * 360,
        lastUpdate: new Date(),
      },
      {
        id: 'provider-4',
        name: 'Ana Costa',
        avatar: '🌱',
        rating: 4.6,
        reviewCount: 203,
        distance: 2.7,
        estimatedTime: 16,
        price: 35.00,
        category: 'jardinagem',
        coordinate: {
          latitude: -23.5505 + Math.random() * 0.02,
          longitude: -46.6333 + Math.random() * 0.02,
        },
        isOnline: true,
        speed: 20 + Math.random() * 15,
        bearing: Math.random() * 360,
        lastUpdate: new Date(),
      },
    ];

    demoProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  public startSimulation(updateIntervalMs: number = 3000) {
    if (this.intervalId) {
      this.stopSimulation();
    }

    console.log('🎯 Starting provider movement simulation...');

    this.intervalId = setInterval(() => {
      this.updateProviderPositions();
      this.notifyCallbacks();
    }, updateIntervalMs);

    // Initial notification
    this.notifyCallbacks();
  }

  public stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Provider simulation stopped');
    }
  }

  private updateProviderPositions() {
    const now = new Date();

    this.providers.forEach((provider, id) => {
      const timeDelta = (now.getTime() - provider.lastUpdate.getTime()) / 1000 / 3600; // hours
      const distanceKm = provider.speed * timeDelta;
      
      // Convert distance to degrees (approximate)
      const distanceDegrees = distanceKm / 111.32; // rough conversion
      
      // Calculate new position
      const bearingRad = (provider.bearing * Math.PI) / 180;
      const deltaLat = Math.cos(bearingRad) * distanceDegrees;
      const deltaLng = Math.sin(bearingRad) * distanceDegrees;
      
      const newProvider = {
        ...provider,
        coordinate: {
          latitude: provider.coordinate.latitude + deltaLat,
          longitude: provider.coordinate.longitude + deltaLng,
        },
        lastUpdate: now,
        // Slightly change bearing to simulate natural movement
        bearing: provider.bearing + (Math.random() - 0.5) * 30,
      };

      // Keep providers within a reasonable area (São Paulo bounds)
      if (newProvider.coordinate.latitude < -23.57 || newProvider.coordinate.latitude > -23.53) {
        newProvider.bearing = (newProvider.bearing + 180) % 360;
      }
      if (newProvider.coordinate.longitude < -46.65 || newProvider.coordinate.longitude > -46.61) {
        newProvider.bearing = (newProvider.bearing + 180) % 360;
      }

      this.providers.set(id, newProvider);
    });
  }

  public getProviders(): ServiceProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvidersNearLocation(
    userLocation: { latitude: number; longitude: number },
    radiusKm: number = 5
  ): ServiceProvider[] {
    const providers = this.getProviders();
    
    return providers.filter(provider => {
      const distance = this.calculateDistance(userLocation, provider.coordinate);
      return distance <= radiusKm;
    }).map(provider => ({
      ...provider,
      distance: this.calculateDistance(userLocation, provider.coordinate),
      estimatedTime: Math.round(this.calculateDistance(userLocation, provider.coordinate) * 5), // 5 min per km
    }));
  }

  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  public assignProviderToService(
    providerId: string, 
    targetLocation: { latitude: number; longitude: number }
  ) {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.targetLocation = targetLocation;
      provider.speed = 40; // Increase speed when assigned
      
      // Calculate bearing towards target
      const bearing = this.calculateBearing(provider.coordinate, targetLocation);
      provider.bearing = bearing;
      
      console.log(`🎯 Provider ${provider.name} assigned to service at ${targetLocation.latitude}, ${targetLocation.longitude}`);
    }
  }

  private calculateBearing(
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
  ): number {
    const dLon = (end.longitude - start.longitude) * Math.PI / 180;
    const lat1 = start.latitude * Math.PI / 180;
    const lat2 = end.latitude * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  public onProvidersUpdate(callback: (providers: ServiceProvider[]) => void) {
    this.callbacks.push(callback);
  }

  public removeCallback(callback: (providers: ServiceProvider[]) => void) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  private notifyCallbacks() {
    const providers = this.getProviders();
    this.callbacks.forEach(callback => callback(providers));
  }

  public destroy() {
    this.stopSimulation();
    this.callbacks = [];
    this.providers.clear();
  }
}

// Singleton instance
export const providerSimulator = new ProviderSimulator();