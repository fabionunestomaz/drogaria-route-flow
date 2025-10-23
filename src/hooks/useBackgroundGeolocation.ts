import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// Type definitions for background geolocation
interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  time: number;
}

interface BackgroundGeolocationPlugin {
  configure: (config: any) => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  getCurrentLocation: () => Promise<Location>;
  on: (event: string, callback: (location: Location) => void) => void;
}

export const useBackgroundGeolocation = (onLocationUpdate?: (location: Location) => void) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Background geolocation only works on native platforms');
      return;
    }

    // Import plugin dynamically only on native platforms
    import('@capacitor-community/background-geolocation').then((module) => {
      const bgGeo = module.default as unknown as BackgroundGeolocationPlugin;

      bgGeo.configure({
        locationProvider: 'DISTANCE_FILTER_PROVIDER',
        desiredAccuracy: 'HIGH_ACCURACY',
        stationaryRadius: 50,
        distanceFilter: 50,
        notificationTitle: 'Rastreamento Ativo',
        notificationText: 'Sua localização está sendo rastreada',
        debug: false,
        interval: 10000,
        fastestInterval: 5000,
      });

      bgGeo.on('location', (location: Location) => {
        setCurrentLocation(location);
        onLocationUpdate?.(location);
      });

      bgGeo.on('error', (error: any) => {
        console.error('Background geolocation error:', error);
        setError(error.message || 'Erro no rastreamento');
      });
    });
  }, [onLocationUpdate]);

  const startTracking = async () => {
    if (!Capacitor.isNativePlatform()) {
      setError('Rastreamento em background só funciona no app nativo');
      return;
    }

    try {
      const module = await import('@capacitor-community/background-geolocation');
      const bgGeo = module.default as unknown as BackgroundGeolocationPlugin;
      
      await bgGeo.start();
      setIsTracking(true);
      setError(null);
    } catch (err) {
      console.error('Failed to start tracking:', err);
      setError('Falha ao iniciar rastreamento');
    }
  };

  const stopTracking = async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const module = await import('@capacitor-community/background-geolocation');
      const bgGeo = module.default as unknown as BackgroundGeolocationPlugin;
      
      await bgGeo.stop();
      setIsTracking(false);
    } catch (err) {
      console.error('Failed to stop tracking:', err);
    }
  };

  return {
    isTracking,
    currentLocation,
    error,
    startTracking,
    stopTracking,
  };
};