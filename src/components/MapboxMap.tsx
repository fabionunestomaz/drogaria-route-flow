import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_PUBLIC_TOKEN } from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

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
  center = [-46.6333, -23.5505], // São Paulo como padrão
  zoom = 12,
  markers = [],
  route,
  onMapClick,
  className = 'w-full h-full'
}: MapboxMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
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
  }, []);

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

  return (
    <div ref={mapContainer} className={className} />
  );
};

export default MapboxMap;
