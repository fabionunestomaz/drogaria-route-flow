import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, Clock, MapPin } from 'lucide-react';
import MapboxMap from './MapboxMap';

interface DriverLocation {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

interface LiveTrackingMapBatchProps {
  batchId: string;
  originLat: number;
  originLng: number;
  deliveries: Array<{
    lat: number;
    lng: number;
    address: string;
  }>;
}

const LiveTrackingMapBatch = ({
  batchId,
  originLat,
  originLng,
  deliveries
}: LiveTrackingMapBatchProps) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const WS_URL = `wss://dnflkxdyfmuubgjnfshe.supabase.co/functions/v1/realtime-tracking`;
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        console.log('🔌 Connecting to batch tracking:', batchId);
        ws = new WebSocket(`${WS_URL}?batch_id=${batchId}&role=customer`);

        ws.onopen = () => {
          console.log('🟢 Batch tracking connected');
          setConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'driver_location') {
              console.log('📍 Driver location:', data);
              setDriverLocation({
                lat: data.lat,
                lng: data.lng,
                heading: data.heading,
                speed: data.speed,
                accuracy: data.accuracy,
                timestamp: data.timestamp
              });
            } else if (data.type === 'connected') {
              console.log('✅ Connected to batch tracking');
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setError('Erro de conexão');
          setConnected(false);
        };

        ws.onclose = () => {
          console.log('🔴 Batch tracking disconnected');
          setConnected(false);
        };
      } catch (error: any) {
        console.error('Failed to connect:', error);
        setError(error.message);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [batchId]);

  return (
    <Card className="overflow-hidden">
      <div className="h-[500px] relative">
        <MapboxMap
          center={driverLocation ? [driverLocation.lng, driverLocation.lat] : [originLng, originLat]}
          zoom={14}
          markers={[
            // Origin
            {
              lng: originLng,
              lat: originLat,
              color: '#3B82F6',
              label: '🏪'
            },
            // Deliveries
            ...deliveries.map((d, idx) => ({
              lng: d.lng,
              lat: d.lat,
              color: '#10B981',
              label: `${idx + 1}`
            })),
            // Driver location
            ...(driverLocation ? [{
              lng: driverLocation.lng,
              lat: driverLocation.lat,
              color: '#EF4444',
              label: '🚗'
            }] : [])
          ]}
        />
        
        {/* Status Overlay */}
        <div className="absolute top-4 left-4 right-4 flex gap-2 z-10">
          <Badge 
            variant={connected ? "default" : "destructive"}
            className="shadow-lg"
          >
            {connected ? '🟢 Conectado' : '🔴 Desconectado'}
          </Badge>
          
          {driverLocation && (
            <>
              {driverLocation.speed && driverLocation.speed > 0 && (
                <Badge variant="secondary" className="shadow-lg">
                  <Navigation className="h-3 w-3 mr-1" />
                  {Math.round(driverLocation.speed * 3.6)} km/h
                </Badge>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg">
              {error}
            </div>
          </div>
        )}

        {!driverLocation && connected && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <div className="text-center p-6">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-lg font-semibold">Aguardando localização do motorista...</p>
              <p className="text-sm text-muted-foreground mt-2">
                O motorista precisa iniciar o compartilhamento de localização
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LiveTrackingMapBatch;
