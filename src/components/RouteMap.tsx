import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken } from '@/lib/mapboxConfig';
import { Card } from './ui/card';
import { MapPin, Loader2 } from 'lucide-react';

interface RouteMapProps {
  origin?: { lat: number; lng: number; label?: string };
  destinations: Array<{
    lat: number;
    lng: number;
    label?: string;
    sequence?: number;
  }>;
  routes?: Array<{
    coordinates: Array<[number, number]>;
    isSelected?: boolean;
    index?: number;
  }>;
  className?: string;
  onCenterMap?: () => void;
}

const RouteMap = ({
  origin,
  destinations,
  routes,
  className = 'w-full h-full',
  onCenterMap
}: RouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [tokenReady, setTokenReady] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  // Buscar token do Mapbox
  useEffect(() => {
    const initToken = async () => {
      try {
        const token = await getMapboxToken();
        if (token) {
          mapboxgl.accessToken = token;
          setTokenReady(true);
        } else {
          console.error('Token Mapbox não configurado');
          setTokenError(true);
        }
      } catch (error) {
        console.error('Erro ao inicializar token:', error);
        setTokenError(true);
      }
    };
    initToken();
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current || !tokenReady) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: origin ? [origin.lng, origin.lat] : [-46.6333, -23.5505],
      zoom: 12,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [tokenReady, origin]);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (origin) {
      const el = document.createElement('div');
      el.className = 'w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold animate-pulse';
      el.style.background = '#E10600';
      el.innerHTML = '🏪';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([origin.lng, origin.lat])
        .addTo(map.current!);

      if (origin.label) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setText(origin.label);
        marker.setPopup(popup);
      }

      markersRef.current.push(marker);
    }

    destinations.forEach(({ lng, lat, label, sequence }) => {
      const el = document.createElement('div');
      el.className = 'w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold animate-bounce';
      el.style.background = '#E10600';
      el.innerHTML = sequence?.toString() || '📍';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current!);

      if (label) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setText(label);
        marker.setPopup(popup);
      }

      markersRef.current.push(marker);
    });

    if (destinations.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      if (origin) bounds.extend([origin.lng, origin.lat]);
      destinations.forEach(d => bounds.extend([d.lng, d.lat]));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [origin, destinations]);

  useEffect(() => {
    if (!map.current || !routes || routes.length === 0) return;

    const updateRoutes = () => {
      if (!map.current) return;

      routes.forEach((route, idx) => {
        const sourceId = `route-${idx}`;
        const layerId = `route-layer-${idx}`;

        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        if (map.current.getSource(sourceId)) {
          map.current.removeSource(sourceId);
        }

        if (route.coordinates.length < 2) return;

        map.current.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates
            }
          }
        });

        map.current.addLayer({
          id: layerId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': route.isSelected ? '#E10600' : '#666666',
            'line-width': route.isSelected ? 5 : 3,
            'line-opacity': route.isSelected ? 1 : 0.5
          }
        });
      });
    };

    if (map.current.isStyleLoaded()) {
      updateRoutes();
    } else {
      map.current.on('load', updateRoutes);
    }
  }, [routes]);

  if (tokenError) {
    return (
      <Card className={`${className} flex items-center justify-center bg-muted/50`}>
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold text-lg mb-2">Token Mapbox necessário</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure seu token público do Mapbox nos secrets do projeto
          </p>
        </div>
      </Card>
    );
  }

  if (!tokenReady) {
    return (
      <Card className={`${className} flex items-center justify-center bg-muted/50`}>
        <div className="text-center p-8">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
      </Card>
    );
  }

  return <div ref={mapContainer} className={className} />;
};

export default RouteMap;
