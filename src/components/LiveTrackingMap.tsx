import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Navigation, Clock, Activity, Loader2 } from 'lucide-react';
import { useRideTracking } from '@/hooks/useRideTracking';
import MapboxMap from './MapboxMap';

interface LiveTrackingMapProps {
  rideId: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  destAddress: string;
  className?: string;
}

const LiveTrackingMap = ({
  rideId,
  originLat,
  originLng,
  destLat,
  destLng,
  destAddress,
  className
}: LiveTrackingMapProps) => {
  const { connected, driverLocation, eta, error } = useRideTracking({
    rideId,
    enabled: true
  });

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    (originLng + destLng) / 2,
    (originLat + destLat) / 2
  ]);

  useEffect(() => {
    if (driverLocation) {
      setMapCenter([driverLocation.lng, driverLocation.lat]);
    }
  }, [driverLocation]);

  const markers = [
    {
      lat: destLat,
      lng: destLng,
      label: 'Destino',
      color: '#22c55e'
    },
    ...(driverLocation
      ? [{
          lat: driverLocation.lat,
          lng: driverLocation.lng,
          label: 'Motorista',
          color: '#3b82f6'
        }]
      : [])
  ];

  const formatEta = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <Card className={className}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Rastreamento ao Vivo</h3>
          </div>
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Activity className="h-4 w-4 text-green-500 animate-pulse" />
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                  Conectado
                </Badge>
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <Badge variant="outline" className="bg-muted">
                  Conectando...
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 inline mr-1" />
          {destAddress}
        </div>
      </div>

      <div className="relative">
        <MapboxMap
          center={mapCenter}
          zoom={14}
          markers={markers}
          className="h-[400px] w-full"
        />

        {eta && (
          <div className="absolute top-4 left-4 right-4 bg-card/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Chega em</p>
                  <p className="text-xl font-bold text-primary">
                    ~ {formatEta(eta.seconds)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Distância</p>
                <p className="text-sm font-semibold">
                  {eta.distance_km.toFixed(1)} km
                </p>
              </div>
            </div>
          </div>
        )}

        {driverLocation && (
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>
                {driverLocation.speed !== null
                  ? `${Math.round(driverLocation.speed * 3.6)} km/h`
                  : 'Velocidade: --'}
              </span>
              {driverLocation.accuracy !== null && (
                <span className="ml-2">
                  ±{Math.round(driverLocation.accuracy)}m
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
            <div className="text-center p-4">
              <p className="text-sm text-destructive">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Tentando reconectar...
              </p>
            </div>
          </div>
        )}
      </div>

      {!driverLocation && connected && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Aguardando localização do motorista...
        </div>
      )}
    </Card>
  );
};

export default LiveTrackingMap;