import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_PUBLIC_TOKEN } from '@/lib/mapboxConfig';

mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

interface RouteMapProps {
  origin?: { lat: number; lng: number; label?: string };
  destinations: Array<{
    lat: number;
    lng: number;
    label?: string;
    sequence?: number;
  }>;
  route?: Array<[number, number]>;
  className?: string;
}

const RouteMap = ({
  origin,
  destinations,
  route,
  className = 'w-full h-full'
}: RouteMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: origin ? [origin.lng, origin.lat] : [-46.6333, -23.5505],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (origin) {
      const el = document.createElement('div');
      el.className = 'w-10 h-10 rounded-full border-4 border-white shadow-lg bg-green-500 flex items-center justify-center text-white font-bold';
      el.innerHTML = 'F';

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
      el.className = 'w-10 h-10 rounded-full border-4 border-white shadow-lg bg-blue-500 flex items-center justify-center text-white font-bold';
      el.innerHTML = sequence?.toString() || '?';

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
    if (!map.current || !route || route.length < 2) return;

    map.current.on('load', () => {
      if (!map.current) return;

      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }

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
    });
  }, [route]);

  return <div ref={mapContainer} className={className} />;
};

export default RouteMap;
