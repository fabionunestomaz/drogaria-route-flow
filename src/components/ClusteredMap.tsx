import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken } from '@/lib/mapboxConfig';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Navigation, Package, Loader2 } from 'lucide-react';

interface DeliveryMarker {
  id: string;
  lat: number;
  lng: number;
  status: string;
  address: string;
  customerName?: string;
  driverName?: string;
  orderNumber?: string;
}

interface ClusteredMapProps {
  deliveries: DeliveryMarker[];
  onMarkerClick?: (delivery: DeliveryMarker) => void;
  className?: string;
}

const ClusteredMap = ({ deliveries, onMarkerClick, className }: ClusteredMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryMarker | null>(null);
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
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-44.1900, -13.4100], // São Félix do Coribe - BA
      zoom: 13,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add source for deliveries
      map.current.addSource('deliveries', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // Cluster circles
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'deliveries',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            10,
            '#f1f075',
            30,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Cluster count
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'deliveries',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Unclustered points
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'deliveries',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'status'],
            'pending', '#fbbf24',
            'assigned', '#3b82f6',
            'in_progress', '#8b5cf6',
            'delivered', '#22c55e',
            '#6b7280'
          ],
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Click on cluster
      map.current.on('click', 'clusters', (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });

        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = map.current.getSource('deliveries') as mapboxgl.GeoJSONSource;

        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;

          const coordinates = (features[0].geometry as any).coordinates;
          map.current.easeTo({
            center: coordinates,
            zoom: zoom || 14
          });
        });
      });

      // Click on unclustered point
      map.current.on('click', 'unclustered-point', (e) => {
        if (!e.features || !e.features[0]) return;

        const properties = e.features[0].properties;
        const delivery = deliveries.find(d => d.id === properties?.id);

        if (delivery) {
          setSelectedDelivery(delivery);
          if (onMarkerClick) {
            onMarkerClick(delivery);
          }
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });

      map.current.on('mouseenter', 'unclustered-point', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current.on('mouseleave', 'unclustered-point', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [tokenReady]);

  useEffect(() => {
    if (!map.current) return;

    const source = map.current.getSource('deliveries') as mapboxgl.GeoJSONSource;
    if (!source) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: deliveries.map(delivery => ({
        type: 'Feature',
        properties: {
          id: delivery.id,
          status: delivery.status,
          address: delivery.address,
          customerName: delivery.customerName,
          driverName: delivery.driverName,
          orderNumber: delivery.orderNumber
        },
        geometry: {
          type: 'Point',
          coordinates: [delivery.lng, delivery.lat]
        }
      }))
    };

    source.setData(geojson);

    // Fit bounds if there are deliveries
    if (deliveries.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      deliveries.forEach(d => bounds.extend([d.lng, d.lat]));
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [deliveries]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-yellow-500" },
      assigned: { label: "Atribuído", className: "bg-blue-500" },
      in_progress: { label: "Em Rota", className: "bg-purple-500" },
      delivered: { label: "Entregue", className: "bg-green-500" }
    };
    return statusMap[status] || statusMap.pending;
  };

  if (tokenError) {
    return (
      <Card className={`${className} flex items-center justify-center bg-muted/50 h-[600px]`}>
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
      <Card className={`${className} flex items-center justify-center bg-muted/50 h-[600px]`}>
        <div className="text-center p-8">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="relative h-[600px] rounded-lg overflow-hidden border shadow-lg">
        <div ref={mapContainer} className="absolute inset-0" />

        {selectedDelivery && (
          <Card className="absolute top-4 right-4 p-4 max-w-sm bg-card/95 backdrop-blur-sm shadow-xl">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Detalhes da Entrega</h3>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <Badge className={`${getStatusBadge(selectedDelivery.status).className} text-white mb-3`}>
              {getStatusBadge(selectedDelivery.status).label}
            </Badge>

            <div className="space-y-2 text-sm">
              {selectedDelivery.orderNumber && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">#{selectedDelivery.orderNumber}</span>
                </div>
              )}

              {selectedDelivery.customerName && (
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedDelivery.customerName}</p>
                </div>
              )}

              {selectedDelivery.driverName && (
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedDelivery.driverName}</span>
                </div>
              )}

              <div>
                <p className="text-muted-foreground">Endereço</p>
                <p className="font-medium">{selectedDelivery.address}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Legend */}
        <Card className="absolute bottom-4 left-4 p-3 bg-card/95 backdrop-blur-sm">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white"></div>
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
              <span>Atribuído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-white"></div>
              <span>Em Rota</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
              <span>Entregue</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClusteredMap;