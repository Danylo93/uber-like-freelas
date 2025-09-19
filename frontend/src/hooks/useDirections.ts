import { useState, useCallback, useRef } from 'react';
import { googleDirectionsService, Coordinate, DirectionsRoute } from '../services/googleDirections';

export interface NavigationStep {
  id: string;
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: string;
  coordinates: {
    start: Coordinate;
    end: Coordinate;
  };
}

export interface RouteInfo {
  distance: string;
  duration: string;
  estimatedArrival: string;
  steps: NavigationStep[];
  polylinePoints: Coordinate[];
}

export interface UseDirectionsReturn {
  routeInfo: RouteInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  getRoute: (origin: Coordinate, destination: Coordinate, waypoints?: Coordinate[]) => Promise<void>;
  clearRoute: () => void;
  getCurrentStep: () => NavigationStep | null;
  getNextStep: () => NavigationStep | null;
  
  // Turn-by-turn navigation
  startNavigation: () => void;
  stopNavigation: () => void;
  isNavigating: boolean;
  currentStepIndex: number;
  
  // Real-time updates
  updateCurrentLocation: (location: Coordinate) => void;
  recalculateRoute: () => Promise<void>;
  
  // ETA and progress
  getProgressPercentage: () => number;
  getRemainingDistance: () => string;
  getRemainingTime: () => string;
}

export const useDirections = (): UseDirectionsReturn => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Store route parameters for recalculation
  const routeParams = useRef<{
    origin: Coordinate;
    destination: Coordinate;
    waypoints?: Coordinate[];
  } | null>(null);
  
  const currentLocation = useRef<Coordinate | null>(null);

  const processDirectionsResponse = useCallback((route: DirectionsRoute): RouteInfo => {
    const leg = route.legs[0]; // For now, handle single leg routes
    
    // Process steps into navigation format
    const steps: NavigationStep[] = leg.steps.map((step, index) => ({
      id: `step_${index}`,
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML tags
      distance: step.distance.text,
      duration: step.duration.text,
      maneuver: step.maneuver,
      coordinates: {
        start: {
          latitude: step.start_location.lat,
          longitude: step.start_location.lng,
        },
        end: {
          latitude: step.end_location.lat,
          longitude: step.end_location.lng,
        },
      },
    }));

    // Decode polyline for route visualization
    const polylinePoints = googleDirectionsService.decodePolyline(route.overview_polyline.points);

    // Calculate ETA
    const estimatedArrival = googleDirectionsService.calculateETA(route.duration.value);

    return {
      distance: route.distance.text,
      duration: route.duration.text,
      estimatedArrival,
      steps,
      polylinePoints,
    };
  }, []);

  const getRoute = useCallback(async (
    origin: Coordinate,
    destination: Coordinate,
    waypoints?: Coordinate[]
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🗺️ Getting route from', origin, 'to', destination);
      
      // Store parameters for potential recalculation
      routeParams.current = { origin, destination, waypoints };
      
      const response = await googleDirectionsService.getDirections(
        origin,
        destination,
        waypoints,
        {
          mode: 'driving',
          avoidTolls: false,
          avoidHighways: false,
        }
      );

      if (response.status !== 'OK' || response.routes.length === 0) {
        throw new Error(`No route found: ${response.status}`);
      }

      const processedRoute = processDirectionsResponse(response.routes[0]);
      setRouteInfo(processedRoute);
      setCurrentStepIndex(0);
      
      console.log('✅ Route calculated successfully:', processedRoute);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get directions';
      setError(errorMessage);
      console.error('❌ Error getting route:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [processDirectionsResponse]);

  const clearRoute = useCallback(() => {
    setRouteInfo(null);
    setError(null);
    setIsNavigating(false);
    setCurrentStepIndex(0);
    routeParams.current = null;
    currentLocation.current = null;
    console.log('🗺️ Route cleared');
  }, []);

  const startNavigation = useCallback(() => {
    if (!routeInfo) {
      console.warn('⚠️ Cannot start navigation: no route available');
      return;
    }
    
    setIsNavigating(true);
    setCurrentStepIndex(0);
    console.log('🧭 Navigation started');
  }, [routeInfo]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    console.log('🛑 Navigation stopped');
  }, []);

  const getCurrentStep = useCallback((): NavigationStep | null => {
    if (!routeInfo || currentStepIndex >= routeInfo.steps.length) {
      return null;
    }
    return routeInfo.steps[currentStepIndex];
  }, [routeInfo, currentStepIndex]);

  const getNextStep = useCallback((): NavigationStep | null => {
    if (!routeInfo || currentStepIndex + 1 >= routeInfo.steps.length) {
      return null;
    }
    return routeInfo.steps[currentStepIndex + 1];
  }, [routeInfo, currentStepIndex]);

  const updateCurrentLocation = useCallback((location: Coordinate) => {
    currentLocation.current = location;
    
    if (!isNavigating || !routeInfo) return;

    // Simple logic to advance to next step based on proximity
    const currentStep = getCurrentStep();
    if (currentStep) {
      const distanceToEnd = calculateDistance(
        location,
        currentStep.coordinates.end
      );
      
      // If within 50m of step end, advance to next step
      if (distanceToEnd < 0.05) { // 50 meters
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < routeInfo.steps.length) {
          setCurrentStepIndex(nextIndex);
          console.log(`🧭 Advanced to step ${nextIndex + 1}/${routeInfo.steps.length}`);
        } else {
          console.log('🎉 Navigation completed!');
          setIsNavigating(false);
        }
      }
    }
  }, [isNavigating, routeInfo, getCurrentStep, currentStepIndex]);

  const recalculateRoute = useCallback(async () => {
    if (!routeParams.current || !currentLocation.current) {
      console.warn('⚠️ Cannot recalculate: missing route parameters or current location');
      return;
    }

    console.log('🔄 Recalculating route from current location');
    
    await getRoute(
      currentLocation.current,
      routeParams.current.destination,
      routeParams.current.waypoints
    );
  }, [getRoute]);

  const getProgressPercentage = useCallback((): number => {
    if (!routeInfo || routeInfo.steps.length === 0) return 0;
    return Math.round((currentStepIndex / routeInfo.steps.length) * 100);
  }, [routeInfo, currentStepIndex]);

  const getRemainingDistance = useCallback((): string => {
    if (!routeInfo) return '0 km';
    
    // Calculate remaining distance from current step
    let remainingMeters = 0;
    for (let i = currentStepIndex; i < routeInfo.steps.length; i++) {
      // This is a simplification - would need more precise calculation
      remainingMeters += parseDistance(routeInfo.steps[i].distance);
    }
    
    return googleDirectionsService.formatDistance(remainingMeters);
  }, [routeInfo, currentStepIndex]);

  const getRemainingTime = useCallback((): string => {
    if (!routeInfo) return '0 min';
    
    // Calculate remaining time from current step
    let remainingSeconds = 0;
    for (let i = currentStepIndex; i < routeInfo.steps.length; i++) {
      remainingSeconds += parseDuration(routeInfo.steps[i].duration);
    }
    
    return googleDirectionsService.formatDuration(remainingSeconds);
  }, [routeInfo, currentStepIndex]);

  return {
    routeInfo,
    isLoading,
    error,
    
    // Methods
    getRoute,
    clearRoute,
    getCurrentStep,
    getNextStep,
    
    // Navigation
    startNavigation,
    stopNavigation,
    isNavigating,
    currentStepIndex,
    
    // Real-time updates
    updateCurrentLocation,
    recalculateRoute,
    
    // Progress tracking
    getProgressPercentage,
    getRemainingDistance,
    getRemainingTime,
  };
};

// Helper functions
function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLng = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function parseDistance(distanceText: string): number {
  const match = distanceText.match(/(\d+\.?\d*)\s*(km|m)/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2];
  
  return unit === 'km' ? value * 1000 : value;
}

function parseDuration(durationText: string): number {
  const match = durationText.match(/(\d+)\s*min/);
  if (!match) return 0;
  
  return parseInt(match[1]) * 60; // Convert to seconds
}