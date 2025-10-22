// Token público do Mapbox - seguro para uso no frontend
// Obtenha seu token em: https://account.mapbox.com/access-tokens/

export const MAPBOX_PUBLIC_TOKEN = localStorage.getItem('mapbox_token') || '';

export const setMapboxToken = (token: string) => {
  localStorage.setItem('mapbox_token', token);
  window.location.reload();
};

export const hasMapboxToken = () => {
  return MAPBOX_PUBLIC_TOKEN.length > 0;
};
