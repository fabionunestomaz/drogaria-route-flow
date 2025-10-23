const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'drogaria-route-flow/1.0';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export const searchAddress = async (query: string): Promise<NominatimResult[]> => {
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'br'
    });

    const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar endereço');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro Nominatim search:', error);
    return [];
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<NominatimResult | null> => {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1'
    });

    const response = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer reverse geocoding');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro Nominatim reverse:', error);
    return null;
  }
};

export const formatNominatimAddress = (result: NominatimResult): string => {
  if (!result.address) return result.display_name;

  const parts = [
    result.address.road,
    result.address.house_number,
    result.address.suburb,
    result.address.city,
    result.address.state
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : result.display_name;
};