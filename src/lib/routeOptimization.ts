import { supabase } from '@/integrations/supabase/client';

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

export interface OptimizedRoute {
  waypoints: Waypoint[];
  totalDistance: number;
  totalDuration: number;
  coordinates: [number, number][];
}

export const optimizeRoute = async (
  origin: { lat: number; lng: number },
  destinations: Waypoint[]
): Promise<OptimizedRoute> => {
  try {
    const coordinates = [
      `${origin.lng},${origin.lat}`,
      ...destinations.map(d => `${d.lng},${d.lat}`)
    ].join(';');

    const { data, error } = await supabase.functions.invoke('optimize-route', {
      body: { coordinates, destinations }
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Erro ao otimizar rota:', error);
    throw error;
  }
};

export const calculateRoutePrice = (
  distanceKm: number,
  basePrice: number = 5,
  pricePerKm: number = 2
): number => {
  return basePrice + (distanceKm * pricePerKm);
};
