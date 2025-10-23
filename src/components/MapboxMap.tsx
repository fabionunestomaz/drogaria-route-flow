import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken, hasMapboxToken } from '@/lib/mapboxConfig';
import { Card } from './ui/card';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapboxMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: Array<{
    lng: number;
    lat: number;
    color?: string;
    label?: string;
  }>;
  route?: Array<[number, number]>;
  onMapClick?: (lng: number, lat: number) => void;
  className?: string;
}

const MapboxMap = ({
  center = [-44.1900, -13.4100], // São Félix do Coribe - BA
  zoom = 13,
  markers = [],
  route,
  onMapClick,
  className = 'w-full h-full'
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [tokenReady, setTokenReady] = useState(false);
  const { toast } = useToast();

  // Buscar token do Mapbox
  useEffect(() => {
    const initToken = async () => {
      try {
        const token = await getMapboxToken();
        if (token) {
          mapboxgl.accessToken = token;
          setTokenReady(true);
        } else {
          toast({
            title: "Token Mapbox necessário",
            description: "Configure o token do Mapbox nas configurações do projeto",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao inicializar token:', error);
      }
    };
    initToken();
  }, [toast]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current || !tokenReady) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      pitch: 45,
      center,
      zoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick(e.lngLat.lng, e.lngLat.lat);
      });
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [tokenReady, center, zoom, onMapClick]);

  // Atualizar centro do mapa
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({ center, zoom });
    }
  }, [center, zoom]);

  // Atualizar marcadores
  useEffect(() => {
    if (!map.current) return;

    // Remover marcadores antigos
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Adicionar novos marcadores
    markers.forEach(({ lng, lat, color = '#3b82f6', label }) => {
      const el = document.createElement('div');
      el.className = 'w-8 h-8 rounded-full border-4 border-white shadow-lg';
      el.style.backgroundColor = color;
      
      if (label) {
        el.title = label;
      }

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
  }, [markers]);

  // Atualizar rota
  useEffect(() => {
    if (!map.current || !route || route.length < 2) return;

    map.current.on('load', () => {
      if (!map.current) return;

      // Remover layer e source anteriores se existirem
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }

      // Adicionar rota
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        }
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4
        }
      });

      // Ajustar bounds para mostrar toda a rota
      const bounds = new mapboxgl.LngLatBounds();
      route.forEach(coord => bounds.extend(coord as [number, number]));
      map.current.fitBounds(bounds, { padding: 50 });
    });
  }, [route]);

  if (!tokenReady) {
    return (
      <Card className={`${className} flex items-center justify-center bg-muted/50`}>
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
      </Card>
    );
  }

  return (
    <div ref={mapContainer} className={className} />
  );
};

export default MapboxMap;
