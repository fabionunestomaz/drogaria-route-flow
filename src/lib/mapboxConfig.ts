// Token público do Mapbox - seguro para uso no frontend
// Configure em .env como VITE_MAPBOX_TOKEN

export const MAPBOX_PUBLIC_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export const hasMapboxToken = () => {
  return MAPBOX_PUBLIC_TOKEN.length > 0;
};
