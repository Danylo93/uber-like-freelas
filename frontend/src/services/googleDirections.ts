import { Alert } from 'react-native';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface DirectionsRoute {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  overview_polyline: {
    points: string;
  };
  legs: Array<{
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    start_address: string;
    end_address: string;
    start_location: {
      lat: number;
      lng: number;
    };
    end_location: {
      lat: number;
      lng: number;
    };
    steps: Array<{
      distance: {
        text: string;
        value: number;
      };
      duration: {
        text: string;
        value: number;
      };
      html_instructions: string;
      polyline: {
        points: string;
      };
      start_location: {
        lat: number;
        lng: number;
      };
      end_location: {
        lat: number;
        lng: number;
      };
      maneuver?: string;
    }>;
  }>;
}

export interface DirectionsResponse {
  routes: DirectionsRoute[];
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
  error_message?: string;
}

class GoogleDirectionsService {
  private apiKey: string | null = null;
  private baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

  constructor() {
    // For now, we'll implement a mock service
    // In production, you would set the API key here
    console.log('🗺️ GoogleDirectionsService initialized');
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: Coordinate | string,
    destination: Coordinate | string,
    waypoints?: Coordinate[],
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      avoidTolls?: boolean;
      avoidHighways?: boolean;
      avoidFerries?: boolean;
      optimize?: boolean;
    }
  ): Promise<DirectionsResponse> {
    try {
      if (!this.apiKey) {
        console.log('⚠️ Google Directions API key not set, using mock data');
        return this.getMockDirections(origin, destination);
      }

      const params = new URLSearchParams();
      
      // Format origin and destination
      const formattedOrigin = typeof origin === 'string' 
        ? origin 
        : `${origin.latitude},${origin.longitude}`;
      const formattedDestination = typeof destination === 'string' 
        ? destination 
        : `${destination.latitude},${destination.longitude}`;

      params.append('origin', formattedOrigin);
      params.append('destination', formattedDestination);
      params.append('key', this.apiKey);
      params.append('mode', options?.mode || 'driving');
      params.append('language', 'pt-BR');
      params.append('units', 'metric');

      // Add waypoints if provided
      if (waypoints && waypoints.length > 0) {
        const waypointsStr = waypoints
          .map(wp => `${wp.latitude},${wp.longitude}`)
          .join('|');
        params.append('waypoints', waypointsStr);
        
        if (options?.optimize) {
          params.append('waypoints', `optimize:true|${waypointsStr}`);
        }
      }

      // Add avoid options
      const avoid = [];
      if (options?.avoidTolls) avoid.push('tolls');
      if (options?.avoidHighways) avoid.push('highways');
      if (options?.avoidFerries) avoid.push('ferries');
      if (avoid.length > 0) {
        params.append('avoid', avoid.join('|'));
      }

      const url = `${this.baseUrl}?${params.toString()}`;
      console.log('🗺️ Requesting directions from Google API');

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Directions API error: ${data.status} - ${data.error_message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching directions:', error);
      // Fallback to mock data on error
      return this.getMockDirections(origin, destination);
    }
  }

  /**
   * Mock directions for development/testing
   */
  private getMockDirections(
    origin: Coordinate | string,
    destination: Coordinate | string
  ): DirectionsResponse {
    // Create realistic mock data based on origin/destination
    const mockDistance = Math.random() * 15000 + 1000; // 1-16km
    const mockDuration = mockDistance / 1000 * 3 * 60; // Approximate driving time

    const originCoord = typeof origin === 'string' 
      ? { lat: -23.5505, lng: -46.6333 } // São Paulo default
      : { lat: origin.latitude, lng: origin.longitude };

    const destCoord = typeof destination === 'string'
      ? { lat: -23.5505 + (Math.random() - 0.5) * 0.1, lng: -46.6333 + (Math.random() - 0.5) * 0.1 }
      : { lat: destination.latitude, lng: destination.longitude };

    // Generate a simple polyline path
    const steps = this.generateMockSteps(originCoord, destCoord, 5);

    return {
      routes: [{
        distance: {
          text: `${(mockDistance / 1000).toFixed(1)} km`,
          value: Math.round(mockDistance),
        },
        duration: {
          text: `${Math.round(mockDuration / 60)} min`,
          value: Math.round(mockDuration),
        },
        overview_polyline: {
          points: this.encodePath([originCoord, destCoord]), // Simplified
        },
        legs: [{
          distance: {
            text: `${(mockDistance / 1000).toFixed(1)} km`,
            value: Math.round(mockDistance),
          },
          duration: {
            text: `${Math.round(mockDuration / 60)} min`,
            value: Math.round(mockDuration),
          },
          start_address: 'Origem',
          end_address: 'Destino',
          start_location: originCoord,
          end_location: destCoord,
          steps: steps,
        }],
      }],
      status: 'OK',
    };
  }

  /**
   * Generate mock steps for directions
   */
  private generateMockSteps(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    numSteps: number
  ) {
    const steps = [];
    const latStep = (destination.lat - origin.lat) / numSteps;
    const lngStep = (destination.lng - origin.lng) / numSteps;

    for (let i = 0; i < numSteps; i++) {
      const stepDistance = Math.random() * 1000 + 200; // 200m - 1.2km per step
      const stepDuration = stepDistance / 1000 * 2 * 60; // ~2 min per km

      steps.push({
        distance: {
          text: `${Math.round(stepDistance)}m`,
          value: Math.round(stepDistance),
        },
        duration: {
          text: `${Math.round(stepDuration / 60)} min`,
          value: Math.round(stepDuration),
        },
        html_instructions: this.getMockInstruction(i, numSteps),
        polyline: {
          points: 'mock_polyline',
        },
        start_location: {
          lat: origin.lat + latStep * i,
          lng: origin.lng + lngStep * i,
        },
        end_location: {
          lat: origin.lat + latStep * (i + 1),
          lng: origin.lng + lngStep * (i + 1),
        },
        maneuver: i === 0 ? 'depart' : (i === numSteps - 1 ? 'arrive' : this.getRandomManeuver()),
      });
    }

    return steps;
  }

  /**
   * Get mock instruction based on step
   */
  private getMockInstruction(step: number, totalSteps: number): string {
    if (step === 0) return 'Siga pela rua principal';
    if (step === totalSteps - 1) return 'Chegue ao destino';
    
    const instructions = [
      'Continue em frente',
      'Vire à direita',
      'Vire à esquerda',
      'Entre na rotatória',
      'Saia na 2ª saída',
      'Continue pela avenida',
    ];
    
    return instructions[Math.floor(Math.random() * instructions.length)];
  }

  /**
   * Get random maneuver type
   */
  private getRandomManeuver(): string {
    const maneuvers = ['turn-right', 'turn-left', 'straight', 'ramp-right', 'ramp-left'];
    return maneuvers[Math.floor(Math.random() * maneuvers.length)];
  }

  /**
   * Simple polyline encoding (mock implementation)
   */
  private encodePath(path: Array<{ lat: number; lng: number }>): string {
    // This is a simplified mock - real implementation would use Google's polyline encoding
    return 'mock_encoded_polyline_' + path.length;
  }

  /**
   * Decode polyline points to coordinates
   */
  decodePolyline(encoded: string): Coordinate[] {
    // Mock implementation - in production you'd use Google's polyline decoding
    if (encoded.startsWith('mock_encoded_polyline_')) {
      const numPoints = parseInt(encoded.split('_').pop() || '2');
      const points: Coordinate[] = [];
      
      for (let i = 0; i < numPoints; i++) {
        points.push({
          latitude: -23.5505 + (Math.random() - 0.5) * 0.01,
          longitude: -46.6333 + (Math.random() - 0.5) * 0.01,
        });
      }
      
      return points;
    }
    
    // For real polylines, implement proper decoding
    return [];
  }

  /**
   * Calculate estimated arrival time
   */
  calculateETA(durationSeconds: number): string {
    const now = new Date();
    const eta = new Date(now.getTime() + durationSeconds * 1000);
    
    return eta.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    }
  }
}

export const googleDirectionsService = new GoogleDirectionsService();