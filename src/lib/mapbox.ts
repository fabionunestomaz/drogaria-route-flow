import { supabase } from '@/integrations/supabase/client';

export interface GeocodingResult {
  place_name: string;
  center: [number, number]; // [lng, lat]
  text: string;
}

export interface GeocodingResponse {
  features: GeocodingResult[];
}

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('geocoding', {
      body: { query: address, type: 'forward', limit: 1 }
    });

    if (error) throw error;

    if (data?.features && data.features.length > 0) {
      return data.features[0];
    }

    return null;
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    return null;
  }
};

export const reverseGeocode = async (lng: number, lat: number): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('geocoding', {
      body: { query: `${lng},${lat}`, type: 'reverse' }
    });

    if (error) throw error;

    if (data?.features && data.features.length > 0) {
      return data.features[0].place_name;
    }

    return null;
  } catch (error) {
    console.error('Erro ao fazer geocodificação reversa:', error);
    return null;
  }
};

export const searchAddresses = async (query: string): Promise<GeocodingResult[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('geocoding', {
      body: { query, type: 'forward', limit: 5 }
    });

    if (error) throw error;

    return data?.features || [];
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    return [];
  }
};

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
