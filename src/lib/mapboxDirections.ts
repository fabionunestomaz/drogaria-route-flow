import { MAPBOX_PUBLIC_TOKEN } from './mapboxConfig';

export interface DirectionsResponse {
  routes: Array<{
    duration: number; // seconds
    distance: number; // meters
    geometry: {
      type: 'LineString';
      coordinates: [number, number][]; // [lng, lat]
    };
  }>;
  code: string;
}

export const calculateRoute = async (
  originLng: number,
  originLat: number,
  destLng: number,
  destLat: number
): Promise<DirectionsResponse | null> => {
  try {
    const coordinates = `${originLng},${originLat};${destLng},${destLat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?alternatives=false&overview=full&geometries=geojson&access_token=${MAPBOX_PUBLIC_TOKEN}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Erro ao calcular rota');
    }

    const data: DirectionsResponse = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('Nenhuma rota encontrada');
    }

    return data;
  } catch (error) {
    console.error('Erro ao calcular rota Mapbox:', error);
    return null;
  }
};

export const calculateETA = async (
  originLng: number,
  originLat: number,
  destLng: number,
  destLat: number
): Promise<{ eta_seconds: number; distance_km: number } | null> => {
  const route = await calculateRoute(originLng, originLat, destLng, destLat);
  
  if (!route || !route.routes[0]) {
    return null;
  }

  return {
    eta_seconds: Math.round(route.routes[0].duration),
    distance_km: route.routes[0].distance / 1000
  };
};